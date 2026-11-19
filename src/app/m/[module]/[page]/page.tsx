import Link from "next/link";
import type { Metadata } from "next";
import { resolveMenu } from "@/lib/menu";
import PermissionGuard from "@/components/PermissionGuard";

type Params = { module: string; page: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { module, page } = await params;
  const found = resolveMenu(decodeURIComponent(module), decodeURIComponent(page));
  return {
    title: found
      ? `${found.page.label} - ${found.module.label} - 开元数智`
      : "开元数智 - 企业管理",
  };
}

export default async function ModulePage({ params }: { params: Promise<Params> }) {
  const { module, page } = await params;
  const moduleLabel = decodeURIComponent(module);
  const pageLabel = decodeURIComponent(page);
  const found = resolveMenu(moduleLabel, pageLabel);

  const siblings = found?.siblings ?? [];
  const current = found?.page;

  return (
    <PermissionGuard module={moduleLabel} page={pageLabel}>
    <div className="mod-page">
      <div className="mod-head">
        <div className="mod-crumb">
          {moduleLabel} <span className="mod-sep">›</span> {pageLabel}
        </div>
        <h1 className="mod-title">{pageLabel}</h1>
        <p className="mod-desc">
          所属模块：{moduleLabel} · 该功能页对应原系统「{moduleLabel} / {pageLabel}」模块，
          菜单结构与层级已完整复刻，业务数据待接入。
        </p>
        <span className="mod-badge">功能页待接入</span>
      </div>

      <div className="mod-grid">
        <div className="mod-cell">
          <span className="mod-k">所属一级模块</span>
          <span className="mod-v">{moduleLabel}</span>
        </div>
        <div className="mod-cell">
          <span className="mod-k">当前功能</span>
          <span className="mod-v">{pageLabel}</span>
        </div>
        <div className="mod-cell">
          <span className="mod-k">页面状态</span>
          <span className="mod-v mod-v-warn">待接入业务数据</span>
        </div>
        <div className="mod-cell">
          <span className="mod-k">当前路由</span>
          <span className="mod-v mod-v-mono">{current?.href ?? "—"}</span>
        </div>
      </div>

      <div className="mod-block">
        <h2 className="mod-block-title">接入说明</h2>
        <ul className="mod-list">
          <li>菜单层级与名称来自原系统真实菜单树（15 个一级模块 / 89 个二级菜单）。</li>
          <li>本页为路由占位，用于验证「一级 → 二级 → 功能页」的逐级下钻。</li>
          <li>如需上线，请提供该模块的数据源（数据库表 / 接口地址 / 导出文件），即可按驾驶舱同样的方式接入真实数据。</li>
        </ul>
      </div>

      <div className="mod-block">
        <h2 className="mod-block-title">
          {moduleLabel} · 其他功能（{siblings.length}）
        </h2>
        <div className="mod-chips">
          {siblings.map((s) => {
            const active = s.label === pageLabel;
            return s.href ? (
              <Link
                key={s.label}
                href={s.href}
                className={`mod-chip ${active ? "active" : ""}`}
              >
                {s.label}
              </Link>
            ) : (
              <span key={s.label} className="mod-chip">
                {s.label}
              </span>
            );
          })}
        </div>
      </div>

      <div className="mod-foot">
        <Link href="/" className="mod-back">
          ← 返回综合驾驶舱
        </Link>
      </div>
    </div>
    </PermissionGuard>
  );
}
