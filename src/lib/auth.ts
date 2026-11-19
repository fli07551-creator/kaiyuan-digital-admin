import { userRows, type UserRow } from "./users";

export const USERS_KEY = "kaiyuan-users-v1";
export const SESSION_KEY = "kaiyuan-auth-v1";

/** 登录会话（不含密码） */
export interface Session {
  userId: string;
  username: string;
  name: string;
  role: string;
}

/** 读取用户表：优先本地已编辑的数据，否则用内置种子 */
export function loadUsers(): UserRow[] {
  if (typeof window === "undefined") return userRows;
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (raw) {
      const arr = JSON.parse(raw) as UserRow[];
      if (Array.isArray(arr) && arr.length) return arr;
    }
  } catch {
    /* 忽略损坏数据 */
  }
  return userRows;
}

export function saveUsers(list: UserRow[]) {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(list));
  } catch {
    /* 忽略写入失败 */
  }
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
    /* 忽略 */
  }
}
