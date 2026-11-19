import {
  userRows,
  ADMIN_USER_ID,
  LEGACY_DEMO_USER_IDS,
  type UserRow,
} from "./users";

export const SESSION_KEY = "kaiyuan-auth-v1";
/** 旧版本地用户表键，仅用于一次性迁移到服务端 */
const LEGACY_USERS_KEYS = ["kaiyuan-users-v2", "kaiyuan-users-v1"];

/** 登录会话（不含密码） */
export interface Session {
  userId: string;
  username: string;
  name: string;
  role: string;
}

export const DEFAULT_PASSWORD = "123456";

export type AuthResult =
  | { ok: true; session: Session }
  | { ok: false; reason: string };

/**
 * 登录校验（服务端共享用户表）：
 * 所有浏览器 / 设备访问同一份账号数据，管理员在后台新增的账号即可被他人登录。
 */
export async function authenticate(username: string, password: string): Promise<AuthResult> {
  const account = username.trim();
  if (!account) return { ok: false, reason: "请输入账号" };
  if (!password) return { ok: false, reason: "请输入密码" };
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ account, password }),
    });
    if (!res.ok) return { ok: false, reason: "服务异常，请稍后再试" };
    const data = await res.json();
    if (data?.ok && data.session) return { ok: true, session: data.session as Session };
    return { ok: false, reason: data?.reason || "账号或密码错误" };
  } catch {
    return { ok: false, reason: "网络异常，请检查连接后重试" };
  }
}

/**
 * 读取旧版本地用户表中「管理员自行新增」的账号，用于迁移到服务端。
 * 内置演示账号与系统管理员不迁移（服务端已有）。
 */
export function readLocalUsersForMigration(): UserRow[] {
  if (typeof window === "undefined") return [];
  try {
    for (const key of LEGACY_USERS_KEYS) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const arr = JSON.parse(raw) as UserRow[];
      if (!Array.isArray(arr)) continue;
      const custom = arr.filter(
        (u) =>
          u &&
          u.userId &&
          u.userId !== ADMIN_USER_ID &&
          !LEGACY_DEMO_USER_IDS.includes(u.userId)
      );
      if (custom.length > 0) return custom;
    }
  } catch {
    /* 忽略损坏数据 */
  }
  return [];
}

/** 迁移成功后清理本地旧用户表 */
export function clearLocalUsers() {
  if (typeof window === "undefined") return;
  try {
    for (const key of LEGACY_USERS_KEYS) localStorage.removeItem(key);
  } catch {
    /* 忽略 */
  }
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

// 供用户管理页初始渲染占位使用（真实数据来自服务端）
export const seedUserRows = userRows;
