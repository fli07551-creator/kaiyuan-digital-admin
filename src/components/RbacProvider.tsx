"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { menuData, type MenuItem } from "@/lib/menu";
import {
  DEFAULT_ROLE_ID,
  ROLES,
  allPageKeys,
  defaultPerms,
  pageKey,
  roleIdFromText,
  type RoleDef,
} from "@/lib/rbac";
import { useAuth } from "./AuthProvider";

const STORAGE_KEY = "kaiyuan-rbac-v1";

interface Persisted {
  roleId: string;
  editRoleId?: string;
  perms: Record<string, string[]>;
}

interface RbacCtx {
  roles: RoleDef[];
  /** 当前登录身份对应的角色（决定侧栏可见菜单，不受权限页编辑影响） */
  role: RoleDef;
  roleId: string;
  /** 权限页当前正在编辑的角色（与登录身份解耦） */
  editRoleId: string;
  editRole: RoleDef;
  setEditRoleId: (id: string) => void;
  perms: Record<string, string[]>;
  /** 是否有某个功能权限；只传模块名时表示该模块下是否至少有一个功能 */
  has: (moduleLabel: string, pageLabel?: string) => boolean;
  /** 判断指定角色是否有某功能权限（权限页勾选状态用） */
  hasFor: (roleId: string, moduleLabel: string, pageLabel?: string) => boolean;
  visibleMenu: MenuItem[];
  togglePage: (key: string, roleId?: string) => void;
  setModulePages: (moduleLabel: string, on: boolean, roleId?: string) => void;
  resetRole: (roleId?: string) => void;
  totalPages: number;
}

const Ctx = createContext<RbacCtx | null>(null);

export function RbacProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [roleId, setRoleIdState] = useState<string>(DEFAULT_ROLE_ID);
  const [editRoleId, setEditRoleId] = useState<string>(DEFAULT_ROLE_ID);
  const [perms, setPerms] = useState<Record<string, string[]>>(() => defaultPerms());
  const [hydrated, setHydrated] = useState(false);

  // 登录身份变化时，权限角色跟随该用户的岗位。
  // 同时把"正在编辑的角色"重置为该角色，避免停留在上次权限页选中的角色。
  useEffect(() => {
    if (user) {
      const rid = roleIdFromText(user.role);
      setRoleIdState(rid);
      setEditRoleId(rid);
    }
  }, [user]);

  // 读取本地保存的授权配置
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw) as Persisted;
        if (data.editRoleId) setEditRoleId(data.editRoleId);
        if (data.perms) setPerms({ ...defaultPerms(), ...data.perms });
      }
    } catch {
      /* 忽略损坏的本地数据 */
    }
    setHydrated(true);
  }, []);

  // 变更后持久化
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ roleId, editRoleId, perms }));
    } catch {
      /* 隐私模式下可能写入失败，忽略 */
    }
  }, [roleId, editRoleId, perms, hydrated]);

  const role = useMemo(
    () => ROLES.find((r) => r.id === roleId) ?? ROLES[0],
    [roleId]
  );
  const editRole = useMemo(
    () => ROLES.find((r) => r.id === editRoleId) ?? ROLES[0],
    [editRoleId]
  );

  const totalPages = useMemo(() => allPageKeys().length, []);

  /** 判断指定角色是否拥有某项权限 */
  const hasFor = useCallback(
    (rid: string, moduleLabel: string, pageLabel?: string) => {
      const r = ROLES.find((x) => x.id === rid);
      if (r?.all) return true;
      const keys = perms[rid] ?? [];
      if (!pageLabel) {
        return keys.some((k) => k.startsWith(`${moduleLabel}/`));
      }
      return keys.includes(pageKey(moduleLabel, pageLabel));
    },
    [perms]
  );

  /** 当前登录身份的权限判定（侧栏 / 越权拦截用） */
  const has = useCallback(
    (moduleLabel: string, pageLabel?: string) => hasFor(roleId, moduleLabel, pageLabel),
    [hasFor, roleId]
  );

  const visibleMenu = useMemo(() => {
    return menuData
      .map((item) => {
        if (!item.children || item.children.length === 0) return item;
        const children = item.children.filter((c) => has(item.label, c.label));
        if (children.length === 0) return null;
        return { ...item, children };
      })
      .filter((x): x is MenuItem => x !== null);
  }, [has]);

  const togglePage = useCallback((key: string, rid?: string) => {
    const target = rid ?? editRoleId;
    setPerms((prev) => {
      const current = prev[target] ?? [];
      const next = current.includes(key)
        ? current.filter((k) => k !== key)
        : [...current, key];
      return { ...prev, [target]: next };
    });
  }, [editRoleId]);

  const setModulePages = useCallback(
    (moduleLabel: string, on: boolean, rid?: string) => {
      const target = rid ?? editRoleId;
      const mod = menuData.find((m) => m.label === moduleLabel);
      const keys = (mod?.children ?? []).map((c) => pageKey(moduleLabel, c.label));
      setPerms((prev) => {
        const current = prev[target] ?? [];
        const rest = current.filter((k) => !keys.includes(k));
        return { ...prev, [target]: on ? [...rest, ...keys] : rest };
      });
    },
    [editRoleId]
  );

  const resetRole = useCallback((rid?: string) => {
    const target = rid ?? editRoleId;
    const preset = ROLES.find((r) => r.id === target);
    if (!preset) return;
    setPerms((prev) => ({
      ...prev,
      [target]: preset.all ? allPageKeys() : [...preset.defaultPages],
    }));
  }, [editRoleId]);

  const value: RbacCtx = {
    roles: ROLES,
    role,
    roleId,
    editRole,
    editRoleId,
    setEditRoleId,
    perms,
    has,
    hasFor,
    visibleMenu,
    togglePage,
    setModulePages,
    resetRole,
    totalPages,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useRbac() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useRbac 必须在 RbacProvider 内使用");
  return ctx;
}
