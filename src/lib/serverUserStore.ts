// 服务端用户表存储（仅限 Node 运行时 / API 路由使用，禁止在客户端组件中导入）
// 双模式：
//   1. 配置了 DATABASE_URL 环境变量 → PostgreSQL（长期保存，推荐 Neon / Supabase 免费实例）
//   2. 未配置 → 项目目录 data/users.json（Render 免费实例重启/重新部署后会重置）
import { promises as fs } from "fs";
import path from "path";
import { Pool } from "pg";
import { userRows, ADMIN_USER_ID, LEGACY_DEMO_USER_IDS, type UserRow } from "./users";

/* ------------------------------ 通用工具 ------------------------------ */

// 串行锁，避免并发写坏数据
let chain: Promise<unknown> = Promise.resolve();
function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(fn, fn);
  chain = run.catch(() => undefined);
  return run;
}

function sanitize(raw: unknown): UserRow | null {
  if (!raw || typeof raw !== "object") return null;
  const u = raw as Partial<UserRow>;
  if (!u.userId || !u.username) return null;
  return {
    userId: String(u.userId),
    username: String(u.username),
    name: String(u.name ?? u.username),
    phone: String(u.phone ?? "--"),
    role: String(u.role ?? "库管员"),
    remark: String(u.remark ?? "--"),
    status: u.status === "停用" ? "停用" : "启用",
    lockCount: String(u.lockCount ?? "--"),
    creator: String(u.creator ?? "--"),
    createdAt: String(u.createdAt ?? ""),
    isSuperAdmin: u.userId === ADMIN_USER_ID ? true : Boolean(u.isSuperAdmin),
    password: u.password ? String(u.password) : "123456",
  };
}

function normalize(list: UserRow[]): UserRow[] {
  return list
    .map(sanitize)
    .filter((u): u is UserRow => u !== null)
    .filter((u) => !LEGACY_DEMO_USER_IDS.includes(u.userId));
}

/* ------------------------------ 文件模式 ------------------------------ */

const DATA_DIR = process.env.KAIYUAN_DATA_DIR || path.join(process.cwd(), "data");
const FILE_PATH = path.join(DATA_DIR, "users.json");

async function fileRead(): Promise<UserRow[]> {
  try {
    const raw = await fs.readFile(FILE_PATH, "utf-8");
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) {
      const cleaned = normalize(arr);
      if (cleaned.some((u) => u.userId === ADMIN_USER_ID)) return cleaned;
    }
  } catch {
    /* 首次运行或文件损坏，重新初始化 */
  }
  const fresh = userRows.map((u) => ({ ...u }));
  await fileWrite(fresh);
  return fresh;
}

async function fileWrite(list: UserRow[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${FILE_PATH}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(list, null, 2), "utf-8");
  await fs.rename(tmp, FILE_PATH);
}

/* ------------------------------ PostgreSQL 模式 ------------------------------ */

const DATABASE_URL = process.env.DATABASE_URL || "";
const usePg = DATABASE_URL.length > 0;

// 列映射：数据库列名 ↔ UserRow 字段
const COLS: Array<{ col: string; key: keyof UserRow }> = [
  { col: "user_id", key: "userId" },
  { col: "username", key: "username" },
  { col: "name", key: "name" },
  { col: "phone", key: "phone" },
  { col: "role", key: "role" },
  { col: "remark", key: "remark" },
  { col: "status", key: "status" },
  { col: "lock_count", key: "lockCount" },
  { col: "creator", key: "creator" },
  { col: "created_at", key: "createdAt" },
  { col: "is_super_admin", key: "isSuperAdmin" },
  { col: "password", key: "password" },
];

const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS kaiyuan_users (
  user_id       TEXT PRIMARY KEY,
  username      TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL DEFAULT '',
  phone         TEXT NOT NULL DEFAULT '--',
  role          TEXT NOT NULL DEFAULT '库管员',
  remark        TEXT NOT NULL DEFAULT '--',
  status        TEXT NOT NULL DEFAULT '启用',
  lock_count    TEXT NOT NULL DEFAULT '--',
  creator       TEXT NOT NULL DEFAULT '--',
  created_at    TEXT NOT NULL DEFAULT '',
  is_super_admin BOOLEAN NOT NULL DEFAULT FALSE,
  password      TEXT NOT NULL DEFAULT '123456'
)`;

let pool: Pool | null = null;
function getPool(): Pool {
  if (!pool) {
    const local = /localhost|127\.0\.0\.1/.test(DATABASE_URL);
    pool = new Pool({
      connectionString: DATABASE_URL,
      // 云数据库（Neon/Supabase 等）要求 SSL
      ssl: local || /sslmode=disable/.test(DATABASE_URL) ? undefined : { rejectUnauthorized: false },
      max: 4,
    });
  }
  return pool;
}

let pgReady: Promise<void> | null = null;
function ensurePg(): Promise<void> {
  if (!pgReady) {
    pgReady = (async () => {
      const client = await getPool().connect();
      try {
        await client.query(CREATE_TABLE_SQL);
      } finally {
        client.release();
      }
      const list = await pgRead();
      if (list.length === 0) {
        await pgWrite(userRows.map((u) => ({ ...u })));
      }
    })().catch((err) => {
      pgReady = null; // 失败后允许下次重试
      throw err;
    });
  }
  return pgReady;
}

async function pgRead(): Promise<UserRow[]> {
  const client = await getPool().connect();
  try {
    const { rows } = await client.query(
      `SELECT ${COLS.map((c) => c.col).join(", ")} FROM kaiyuan_users`
    );
    return normalize(
      rows.map((r: Record<string, unknown>) => {
        const u: Record<string, unknown> = {};
        for (const c of COLS) u[c.key] = r[c.col];
        return u as unknown as UserRow;
      })
    );
  } finally {
    client.release();
  }
}

/** 全量写入（账号表数据量小，事务内整表替换，保证与业务逻辑一致） */
async function pgWrite(list: UserRow[]): Promise<void> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM kaiyuan_users");
    if (list.length > 0) {
      const values: unknown[] = [];
      const tuples = list.map((u, i) => {
        const base = i * COLS.length;
        values.push(...COLS.map((c) => {
          const v = u[c.key];
          return c.key === "isSuperAdmin" ? Boolean(v) : v === undefined || v === null ? "" : String(v);
        }));
        return `(${COLS.map((_, j) => `$${base + j + 1}`).join(", ")})`;
      });
      await client.query(
        `INSERT INTO kaiyuan_users (${COLS.map((c) => c.col).join(", ")}) VALUES ${tuples.join(", ")}`,
        values
      );
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw err;
  } finally {
    client.release();
  }
}

/* ------------------------------ 统一入口 ------------------------------ */

async function readAll(): Promise<UserRow[]> {
  if (!usePg) return fileRead();
  await ensurePg();
  return pgRead();
}

async function writeAll(list: UserRow[]): Promise<void> {
  if (!usePg) return fileWrite(list);
  await ensurePg();
  await pgWrite(list);
}

export async function listUsers(): Promise<UserRow[]> {
  return withLock(readAll);
}

/** 新增（单个或批量）；用户名重复的跳过并返回冲突账号名 */
export async function createUsers(input: UserRow[]): Promise<{ list: UserRow[]; added: number; conflict: string | null }> {
  return withLock(async () => {
    const list = await readAll();
    const taken = new Set(list.map((u) => u.username.toLowerCase()));
    let added = 0;
    let conflict: string | null = null;
    for (const item of input) {
      const u = sanitize(item);
      if (!u) continue;
      const key = u.username.toLowerCase();
      if (taken.has(key)) {
        conflict = u.username;
        continue;
      }
      taken.add(key);
      list.push(u);
      added += 1;
    }
    if (added > 0) await writeAll(list);
    return { list, added, conflict };
  });
}

/** 按 userId 更新；管理员账号不允许停用；找不到目标返回 notFound */
export async function updateUser(input: UserRow): Promise<{ list: UserRow[]; notFound: boolean; protectedAdmin: boolean }> {
  return withLock(async () => {
    const list = await readAll();
    const idx = list.findIndex((u) => u.userId === input.userId);
    if (idx < 0) return { list, notFound: true, protectedAdmin: false };
    if (list[idx].userId === ADMIN_USER_ID && input.status === "停用") {
      return { list, notFound: false, protectedAdmin: true };
    }
    const clean = sanitize({ ...list[idx], ...input });
    if (clean) {
      // 管理员标记不可被普通编辑移除
      if (list[idx].userId === ADMIN_USER_ID) clean.isSuperAdmin = true;
      list[idx] = clean;
      await writeAll(list);
    }
    return { list, notFound: false, protectedAdmin: false };
  });
}

/** 批量删除（管理员账号受保护） */
export async function deleteUsers(userIds: string[]): Promise<{ list: UserRow[]; deleted: number; protectedAdmin: boolean }> {
  return withLock(async () => {
    const list = await readAll();
    const ids = new Set(userIds);
    if (ids.has(ADMIN_USER_ID)) {
      return { list, deleted: 0, protectedAdmin: true };
    }
    const before = list.length;
    const next = list.filter((u) => !ids.has(u.userId));
    if (next.length !== before) await writeAll(next);
    return { list: next, deleted: before - next.length, protectedAdmin: false };
  });
}

/** 本地账号迁移：按 userId 合并（不覆盖服务端已有账号），用户名冲突的跳过 */
export async function syncUsers(input: UserRow[]): Promise<{ list: UserRow[]; merged: number }> {
  return withLock(async () => {
    const list = await readAll();
    const ids = new Set(list.map((u) => u.userId));
    const names = new Set(list.map((u) => u.username.toLowerCase()));
    let merged = 0;
    for (const item of input) {
      const u = sanitize(item);
      if (!u) continue;
      if (LEGACY_DEMO_USER_IDS.includes(u.userId)) continue;
      if (ids.has(u.userId) || names.has(u.username.toLowerCase())) continue;
      ids.add(u.userId);
      names.add(u.username.toLowerCase());
      list.push(u);
      merged += 1;
    }
    if (merged > 0) await writeAll(list);
    return { list, merged };
  });
}

/** 登录校验 */
export function matchUser(list: UserRow[], account: string, password: string):
  | { ok: true; user: UserRow }
  | { ok: false; reason: string } {
  const key = account.trim().toLowerCase();
  if (!key) return { ok: false, reason: "请输入账号" };
  if (!password) return { ok: false, reason: "请输入密码" };
  const user = list.find(
    (u) => u.username.toLowerCase() === key || u.userId.toLowerCase() === key
  );
  if (!user) return { ok: false, reason: "账号不存在" };
  if (user.status === "停用") return { ok: false, reason: "该账号已停用，请联系管理员" };
  if ((user.password || "123456") !== password) return { ok: false, reason: "账号或密码错误" };
  return { ok: true, user };
}
