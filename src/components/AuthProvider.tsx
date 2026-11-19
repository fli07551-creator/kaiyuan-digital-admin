"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  authenticate,
  loadSession,
  saveSession,
  type AuthResult,
  type Session,
} from "@/lib/auth";

interface AuthCtx {
  user: Session | null;
  /** 是否已完成本地会话读取（避免首屏误跳登录页） */
  ready: boolean;
  login: (username: string, password: string) => AuthResult;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUser(loadSession());
    setReady(true);
  }, []);

  const login = useCallback((username: string, password: string): AuthResult => {
    const result = authenticate(username, password);
    if (result.ok) {
      setUser(result.session);
      saveSession(result.session);
    }
    return result;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    saveSession(null);
  }, []);

  return <Ctx.Provider value={{ user, ready, login, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth 必须在 AuthProvider 内使用");
  return ctx;
}
