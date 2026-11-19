"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn, AlertCircle, BarChart3, Boxes, ShieldCheck } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

export default function LoginPage() {
  const { user, ready, login } = useAuth();
  const router = useRouter();
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(true);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  // 已登录直接进后台
  useEffect(() => {
    if (ready && user) router.replace("/");
  }, [ready, user, router]);

  // 记住上次账号
  useEffect(() => {
    try {
      const saved = localStorage.getItem("kaiyuan-last-account");
      if (saved) {
        setAccount(saved);
        setRemember(true);
      }
    } catch {
      /* 忽略 */
    }
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setErr("");
    setLoading(true);
    const result = await login(account, password);
    if (result.ok) {
      try {
        if (remember) localStorage.setItem("kaiyuan-last-account", account.trim());
        else localStorage.removeItem("kaiyuan-last-account");
      } catch {
        /* 忽略 */
      }
      router.replace("/");
    } else {
      setErr(result.reason);
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-brand">
        <div className="login-brand-inner">
          <div className="login-logo">
            <span className="logo-mark">开</span>
            <span className="login-logo-text">开元数智</span>
          </div>
          <h1 className="login-slogan">
            综合管理平台
            <br />
            <em>一屏掌握经营全貌</em>
          </h1>
          <p className="login-sub">
            汇聚各部门管理平台核心数据，覆盖销售、采购、生产、质量、财务、人力等 15 个业务模块。
          </p>
          <ul className="login-points">
            <li>
              <BarChart3 size={15} /> 综合数据驾驶舱 · 真实业务指标聚合
            </li>
            <li>
              <Boxes size={15} /> 15 个一级模块 / 89 个业务功能
            </li>
            <li>
              <ShieldCheck size={15} /> 角色权限控制 · 菜单与功能级授权
            </li>
          </ul>
        </div>
        <div className="login-brand-foot">© 2026 开元数智 · 企业管理平台</div>
      </div>

      <div className="login-main">
        <form className="login-card" onSubmit={submit}>
          <h2 className="login-title">登录</h2>
          <p className="login-tip">请使用您的平台账号登录</p>

          <label className="login-field">
            <span className="login-label">账号</span>
            <input
              className="login-input"
              placeholder="用户名 / 用户编号"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              autoComplete="username"
              autoFocus
            />
          </label>

          <label className="login-field">
            <span className="login-label">密码</span>
            <span className="login-pwd">
              <input
                className="login-input"
                type={showPwd ? "text" : "password"}
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="pwd-toggle"
                onClick={() => setShowPwd((v) => !v)}
                title={showPwd ? "隐藏密码" : "显示密码"}
              >
                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </span>
          </label>

          <div className="login-row">
            <label className="login-check">
              <input
                type="checkbox"
                className="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              记住账号
            </label>
            <span className="login-forgot" title="请联系系统管理员重置密码">
              忘记密码？
            </span>
          </div>

          {err && (
            <div className="login-error">
              <AlertCircle size={14} /> {err}
            </div>
          )}

          <button className="login-btn" type="submit" disabled={loading}>
            <LogIn size={15} /> {loading ? "登录中…" : "登 录"}
          </button>

          <div className="login-note">平台账号由系统管理员统一分配</div>
        </form>
      </div>
    </div>
  );
}
