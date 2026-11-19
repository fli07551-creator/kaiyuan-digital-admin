"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { useRbac } from "./RbacProvider";

/** 功能页权限校验：无权限时展示 403 提示 */
export default function PermissionGuard({
  module,
  page,
  children,
}: {
  module: string;
  page: string;
  children: React.ReactNode;
}) {
  const { has, role } = useRbac();

  if (has(module, page)) return <>{children}</>;

  return (
    <div className="deny">
      <div className="deny-icon">
        <Lock size={26} />
      </div>
      <h2 className="deny-title">无访问权限</h2>
      <p className="deny-desc">
        当前身份「{role.name}」未被授予「{module} / {page}」的访问权限。
        <br />
        请联系系统管理员在「应用中心 › 权限控制」中为该角色开放此功能。
      </p>
      <div className="deny-actions">
        <Link href="/system/permissions" className="deny-btn">
          前往权限控制
        </Link>
        <Link href="/" className="deny-btn deny-btn-ghost">
          返回驾驶舱
        </Link>
      </div>
    </div>
  );
}
