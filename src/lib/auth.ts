import {
  userRows,
  ADMIN_USER_ID,
  LEGACY_DEMO_USER_IDS,
  type UserRow,
} from "./users";

/** 用户表使用新键，旧版演示账号数据会在首次读取时迁移清理 */
export const USERS_KEY = "kaiyuan-users-v2";
const LEGACY_USERS_KEY = "kaiyuan-users-v1";
export const SESSION_KEY = "kaiyuan-auth-v1";

/** 登录会话（不含密码） */
export interface Session {
  userId: string;
  username: string;
  name: string;
  role: string;
}

function seedUsers(): UserRow[] {
  return userRows.map((u) => ({ ...u }));
}

function persistUsers(list: UserRow[]) {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(list));
    localStorage.removeItem(LEGACY_USERS_KEY);
  } catch {
    /* 忽略写入失败 */
  }
}

/** 清理旧版内置演示账号，并确认系统管理员始终存在 */
function normalizeUsers(list: UserRow[]): { list: UserRow[]; changed: boolean } {
  const cleaned = list.filter(
    (u) => u && u.userId !== undefined && !LEGACY_DEMO_USER_IDS.includes(u.userId)
  );
  const hasAdmin = cleaned.some((u) => u.userId === ADMIN_USER_ID);
  const result = hasAdmin ? cleaned : [...seedUsers(), ...cleaned];
  return {
    list: result,
    changed: !hasAdmin || cleaned.length !== list.length || result.length !== list.length,
  };
}

/**
 * 首次升级时读取旧用户表：只保留管理员 + 管理员自行新增的账号，
 * 旧版内置演示账号全部丢弃，然后迁移到新存储键。
 */
function migrateLegacyUsers(): UserRow[] {
  const fresh = seedUsers();
  try {
    const raw = localStorage.getItem(LEGACY_USERS_KEY);
    if (raw) {
      const legacy = JSON.parse(raw) as UserRow[];
      if (Array.isArray(legacy)) {
        const custom = legacy.filter(
          (u) => u && u.userId !== ADMIN_USER_ID && !LEGACY_DEMO_USER_IDS.includes(u.userId)
        );
        const merged = [...fresh, ...custom];
        persistUsers(merged);
        return merged;
      }
    }
  } catch {
    /* 忽略损坏数据 */
  }
  persistUsers(fresh);
  return fresh;
}

/**
 * 读取用户表：优先本地已配置的数据，否则用内置系统管理员初始化。
 * 旧版演示账号会被自动清理，用户自行新增的账号不受影响。
 */
export function loadUsers(): UserRow[] {
  if (typeof window === "undefined") return userRows;
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (raw) {
      const arr = JSON.parse(raw) as UserRow[];
      if (Array.isArray(arr)) {
        const { list, changed } = normalizeUsers(arr);
        if (changed) persistUsers(list);
        return list;
      }
    }
  } catch {
    /* 忽略损坏数据 */
  }
  return migrateLegacyUsers();
}

export function saveUsers(list: UserRow[]) {
  const { list: normalized } = normalizeUsers(list);
  persistUsers(normalized);
  return normalized;
}

export const DEFAULT_PASSWORD = "123456";

export type AuthResult =
  | { ok: true; session: Session }
  | { ok: false; reason: string };

/** 账号密码校验 */
export function authenticate(username: string, password: string): AuthResult {
  const account = username.trim();
  if (!account) return { ok: false, reason: "请输入账号" };
  if (!password) return { ok: false, reason: "请输入密码" };

  const list = loadUsers();
  const user = list.find(
    (u) =>
      u.username.toLowerCase() === account.toLowerCase() ||
      u.userId.toLowerCase() === account.toLowerCase()
  );
  if (!user) return { ok: false, reason: "账号不存在" };
  if (user.status === "停用") return { ok: false, reason: "该账号已停用，请联系管理员" };

  const expect = user.password || DEFAULT_PASSWORD;
  if (expect !== password) return { ok: false, reason: "账号或密码错误" };

  return {
    ok: true,
    session: {
      userId: user.userId,
      username: user.username,
      name: user.name || user.username,
      role: user.role,
    },
  };
}

export function loadSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Session;
    return s && s.username ? s : null;
  } catch {
    return null;
  }
}

export function saveSession(session: Session | null) {
  try {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    /* 忽略写入失败 */
  }
}
