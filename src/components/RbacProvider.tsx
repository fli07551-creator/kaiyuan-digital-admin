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
  type RoleDef,
} from "@/lib/rbac";

const STORAGE_KEY = "kaiyuan-rbac-v1";

interface Persisted {
  roleId: string;
  perms: Record<string, string[]>;
}

interface RbacCtx {
  roles: RoleDef[];
  role: RoleDef;
  roleId: string;
  setRoleId: (id: string) => void;
  perms: Record<string, string[]>;
  /** 是否有某个功能权限；只传模块名时表示该模块下是否至少有一个功能 */
  has: (moduleLabel: string, pageLabel?: string) => boolean;
  visibleMenu: MenuItem[];
  togglePage: (key: string) => void;
  setModulePages: (moduleLabel: string, on: boolean) => void;
  resetRole: () => void;
  totalPages: number;
}

const Ctx = createContext<RbacCtx | null>(null);

export function RbacProvider({ children }: { children: React.ReactNode }) {
  const [roleId, setRoleIdState] = useState<string>(DEFAULT_ROLE_ID);
  const [perms, setPerms] = useState<Record<string, string[]>>(() => defaultPerms());
  const [hydrated, setHydrated] = useState(false);

  // 读取本地保存的授权配置
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw) as Persisted;
        if (data.roleId) setRoleIdState(data.roleId);
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ roleId, perms }));
    } catch {
      /* 隐私模式下可能写入失败，忽略 */
    }
  }, [roleId, perms, hydrated]);

  const role = useMemo(
    () => ROLES.find((r) => r.id === roleId) ?? ROLES[0],
    [roleId]
  );

  const totalPages = useMemo(() => allPageKeys().length, []);

  const has = useCallback(
    (moduleLabel: string, pageLabel?: string) => {
      if (role.all) return true;
      const keys = perms[role.id] ?? [];
      if (!pageLabel) {
        return keys.some((k) => k.startsWith(`${moduleLabel}/`));
      }
      return keys.includes(pageKey(moduleLabel, pageLabel));
    },
    [role, perms]
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

  const setRoleId = useCallback((id: string) => setRoleIdState(id), []);

  const togglePage = useCallback(
    (key: string) => {
      setPerms((prev) => {
        const current = prev[roleId] ?? [];
        const next = current.includes(key)
          ? current.filter((k) => k !== key)
          : [...current, key];
        return { ...prev, [roleId]: next };
      });
    },
    [roleId]
  );

  const setModulePages = useCallback(
    (moduleLabel: string, on: boolean) => {
      const mod = menuData.find((m) => m.label === moduleLabel);
      const keys = (mod?.children ?? []).map((c) => pageKey(moduleLabel, c.label));
      setPerms((prev) => {
        const current = prev[roleId] ?? [];
        const rest = current.filter((k) => !keys.includes(k));
        return { ...prev, [roleId]: on ? [...rest, ...keys] : rest };
      });
    },
    [roleId]
  );

  const resetRole = useCallback(() => {
    const preset = ROLES.find((r) => r.id === roleId);
    if (!preset) return;
    setPerms((prev) => ({
      ...prev,
      [roleId]: preset.all ? allPageKeys() : [...preset.defaultPages],
    }));
  }, [roleId]);

  const value: RbacCtx = {
    roles: ROLES,
    role,
    roleId,
    setRoleId,
    perms,
    has,
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
