"use client";

import { useEffect, useRef } from "react";
import { RotateCcw, ShieldCheck, Info } from "lucide-react";
import { menuData } from "@/lib/menu";
import { pageKey } from "@/lib/rbac";
import { useRbac } from "@/components/RbacProvider";

function TriCheckbox({
  checked,
  indeterminate,
  onChange,
  disabled,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = !!indeterminate && !checked;
  }, [indeterminate, checked]);
  return (
    <input
      ref={ref}
      type="checkbox"
      className="perm-check"
      checked={checked}
      onChange={onChange}
      disabled={disabled}
    />
  );
}

export default function PermissionsPage() {
  const {
    roles,
    roleId,
    setRoleId,
    role,
    has,
    togglePage,
    setModulePages,
    resetRole,
  } = useRbac();

  const total = menuData.reduce((n, m) => n + (m.children?.length ?? 0), 0);
  const granted = menuData.reduce(
    (n, m) => n + (m.children ?? []).filter((c) => has(m.label, c.label)).length,
    0
  );
  const locked = !!role.all;

  return (
    <div className="perm-page">
      <div className="perm-head">
        <div>
          <h1 className="perm-title">
            <ShieldCheck size={19} /> 权限控制
          </h1>
          <p className="perm-desc">
            为不同岗位配置可见的菜单与功能。保存后立即生效，切换右上角身份即可验证效果。
          </p>
        </div>
        <div className="perm-stat">
          <span className="perm-stat-num">{granted}</span>
          <span className="perm-stat-sub">/ {total} 项功能已授权</span>
        </div>
      </div>

      <div className="perm-tabs">
        {roles.map((r) => (
          <button
            key={r.id}
            className={`perm-tab ${r.id === roleId ? "active" : ""}`}
            onClick={() => setRoleId(r.id)}
          >
            {r.name}
          </button>
        ))}
      </div>

      <div className="perm-rolebar">
        <div>
          <strong>{role.name}</strong>
          <span className="perm-rolebar-desc">{role.desc}</span>
        </div>
        {!locked && (
          <button className="perm-reset" onClick={resetRole} title="恢复到该角色的预设权限">
            <RotateCcw size={13} /> 恢复默认
          </button>
        )}
      </div>

      {locked && (
        <div className="perm-note">
          <Info size={14} />
          系统管理员固定拥有全部权限，不可修改。
        </div>
      )}

      <div className="perm-modules">
        {menuData.map((mod) => {
          const children = mod.children ?? [];
          if (children.length === 0) return null;
          const onCount = children.filter((c) => has(mod.label, c.label)).length;
          const allOn = onCount === children.length;
          return (
            <div className="perm-module" key={mod.label}>
              <div className="perm-module-head">
                <TriCheckbox
                  checked={allOn}
                  indeterminate={onCount > 0 && !allOn}
                  disabled={locked}
                  onChange={() => setModulePages(mod.label, !allOn)}
                />
                <span className="perm-module-name">{mod.label}</span>
                <span className="perm-module-count">
                  {onCount}/{children.length}
                </span>
              </div>
              <div className="perm-children">
                {children.map((c) => {
                  const key = pageKey(mod.label, c.label);
                  const on = has(mod.label, c.label);
                  return (
                    <label
                      key={key}
                      className={`perm-item ${on ? "on" : ""} ${locked ? "locked" : ""}`}
                    >
                      <input
                        type="checkbox"
                        className="perm-check"
                        checked={on}
                        disabled={locked}
                        onChange={() => togglePage(key)}
                      />
                      <span>{c.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
