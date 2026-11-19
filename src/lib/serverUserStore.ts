// 服务端用户表存储（仅限 Node 运行时 / API 路由使用，禁止在客户端组件中导入）
import { promises as fs } from "fs";
import path from "path";
import { userRows, ADMIN_USER_ID, LEGACY_DEMO_USER_IDS, type UserRow } from "./users";

// 数据目录：可用环境变量覆盖；默认项目根目录 data/
const DATA_DIR = process.env.KAIYUAN_DATA_DIR || path.join(process.cwd(), "data");
const FILE_PATH = path.join(DATA_DIR, "users.json");

// 简单串行锁，避免并发写坏文件
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

async function readRaw(): Promise<UserRow[]> {
  try {
    const raw = await fs.readFile(FILE_PATH, "utf-8");
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) {
      const cleaned = arr
        .map(sanitize)
        .filter((u): u is UserRow => u !== null)
        .filter((u) => !LEGACY_DEMO_USER_IDS.includes(u.userId));
      if (cleaned.some((u) => u.userId === ADMIN_USER_ID)) return cleaned;
    }
  } catch {
    /* 首次运行或文件损坏，重新初始化 */
  }
  const fresh = userRows.map((u) => ({ ...u }));
  await writeRaw(fresh);
  return fresh;
}

async function writeRaw(list: UserRow[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${FILE_PATH}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(list, null, 2), "utf-8");
  await fs.rename(tmp, FILE_PATH);
}

export async function listUsers(): Promise<UserRow[]> {
  return withLock(readRaw);
}

/** 新增（单个或批量）；用户名重复返回 null */
export async function createUsers(input: UserRow[]): Promise<{ list: UserRow[]; added: number; conflict: string | null }> {
  return withLock(async () => {
    const list = await readRaw();
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
    if (added > 0) await writeRaw(list);
    return { list, added, conflict };
  });
}

/** 按 userId 更新；管理员账号不允许停用；找不到目标返回 notFound */
export async function updateUser(input: UserRow): Promise<{ list: UserRow[]; notFound: boolean; protectedAdmin: boolean }> {
  return withLock(async () => {
    const list = await readRaw();
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
      await writeRaw(list);
    }
    return { list, notFound: false, protectedAdmin: false };
  });
}

/** 批量删除（管理员账号受保护） */
export async function deleteUsers(userIds: string[]): Promise<{ list: UserRow[]; deleted: number; protectedAdmin: boolean }> {
  return withLock(async () => {
    const list = await readRaw();
    const ids = new Set(userIds);
    if (ids.has(ADMIN_USER_ID)) {
      return { list, deleted: 0, protectedAdmin: true };
    }
    const before = list.length;
    const next = list.filter((u) => !ids.has(u.userId));
    await writeRaw(next);
    return { list: next, deleted: before - next.length, protectedAdmin: false };
  });
}

/** 本地账号迁移：按 userId 合并（不覆盖服务端已有账号），用户名冲突的跳过 */
export async function syncUsers(input: UserRow[]): Promise<{ list: UserRow[]; merged: number }> {
  return withLock(async () => {
    const list = await readRaw();
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
    if (merged > 0) await writeRaw(list);
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
