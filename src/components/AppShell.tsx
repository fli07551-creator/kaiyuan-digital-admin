"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronLeft,
  RotateCw,
  CircleHelp,
  Maximize2,
  UserRound,
  Box,
  ShoppingCart,
  Truck,
  Users,
  Factory,
  Package,
  FileText,
  Wallet,
  Building2,
  Grid2X2,
  Shield,
  SlidersHorizontal,
  Route,
  GitBranch,
  Cog,
} from "lucide-react";
import { menuData, type MenuItem } from "@/lib/menu";

const iconMap: Record<string, React.ReactNode> = {
  综合驾驶舱: <Grid2X2 size={15} />,
  销售管理: <ShoppingCart size={15} />,
  采购管理: <Truck size={15} />,
  库存管理: <Package size={15} />,
  物流管理: <Route size={15} />,
  委外管理: <GitBranch size={15} />,
  自制生产: <Factory size={15} />,
  质量管理: <Shield size={15} />,
  设备管理: <SlidersHorizontal size={15} />,
  工艺装备: <Cog size={15} />,
  研发管理: <Box size={15} />,
  财务管理: <Wallet size={15} />,
  个人中心: <UserRound size={15} />,
  人力资源: <Users size={15} />,
  行政管理: <Building2 size={15} />,
  应用中心: <Grid2X2 size={15} />,
};

function useActivePath() {
  const raw = usePathname();
  // 中文路由在浏览器里是百分号编码的，解码后才能和菜单 label 对齐
  try {
    return decodeURIComponent(raw || "/");
  } catch {
    return raw || "/";
  }
}

function NavNode({ item, collapsed }: { item: MenuItem; collapsed: boolean }) {
  const pathname = useActivePath();
  const hasChildren = !!item.children && item.children.length > 0;
  // null = 跟随是否命中当前路由；true/false = 用户手动展开/收起
  const [userOpen, setUserOpen] = useState<boolean | null>(null);

  const activeChild = item.children?.some(
    (c) => c.href && pathname === decodeURIComponent(c.href)
  );
  const expanded = userOpen ?? !!activeChild;

  if (!hasChildren) {
    const isActive = !!item.href && pathname === decodeURIComponent(item.href);
    const inner = (
      <>
        <span className="nav-icon">{iconMap[item.label] ?? <FileText size={15} />}</span>
        <span className="nav-label">{item.label}</span>
      </>
    );
    return item.href ? (
      <Link href={item.href} key={item.label} className={`nav-leaf-link ${isActive ? "active" : ""}`}>
        <div className={`nav-item ${isActive ? "active" : ""}`} title={collapsed ? item.label : undefined}>
          {inner}
        </div>
      </Link>
    ) : (
      <div className="nav-item" title={collapsed ? item.label : undefined}>
        {inner}
      </div>
    );
  }

  return (
    <div className="nav-group">
      <div
        className={`nav-item ${item.children?.some((c) => c.href && pathname === decodeURIComponent(c.href)) ? "in-path" : ""}`}
        onClick={() => !collapsed && setUserOpen(!expanded)}
        title={collapsed ? item.label : undefined}
      >
        <span className="nav-icon">{iconMap[item.label] ?? <FileText size={15} />}</span>
        <span className="nav-label">{item.label}</span>
        <span className={`nav-arrow ${expanded ? "open" : ""}`}>
          <ChevronRight size={13} />
        </span>
      </div>
      {expanded && !collapsed && (
        <div className="nav-children">
          {item.children!.map((child) => {
            const isActive = !!child.href && pathname === decodeURIComponent(child.href);
            const inner = (
              <div className={`nav-leaf ${isActive ? "active" : ""}`}>
                {child.label}
              </div>
            );
            return child.href ? (
              <Link href={child.href} key={child.label}>
                {inner}
              </Link>
            ) : (
              <div key={child.label}>{inner}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = useActivePath();
  const segs = pathname.split("/").filter(Boolean);

  const crumbs =
    pathname === "/users"
      ? ["开元数智", "综合管理平台", "系统管理", "用户管理"]
      : segs[0] === "m" && segs.length >= 3
        ? ["开元数智", "综合管理平台", segs[1], segs[2]]
        : ["开元数智", "综合管理平台", "数据驾驶舱"];

  return (
    <div className="app-shell">
      <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
        <div className="sidebar-logo">
          <Link href="/" className="sidebar-home" title="返回综合驾驶舱">
            <span className="logo-mark">开</span>
            <span className="logo-text">开元数智</span>
          </Link>
        </div>
        <nav className="sidebar-nav">
          {menuData.map((item) => (
            <NavNode key={item.label} item={item} collapsed={collapsed} />
          ))}
        </nav>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <button
            className="icon-btn"
            onClick={() => setCollapsed((v) => !v)}
            title={collapsed ? "展开菜单" : "收起菜单"}
          >
            {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
          </button>
          <button className="icon-btn" title="后退">
            <ChevronLeft size={17} />
          </button>
          <button className="icon-btn" title="刷新">
            <RotateCw size={15} />
          </button>
          <div className="topbar-divider" />
          <div className="breadcrumb">
            {crumbs.map((c, i) => (
              <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                {i > 0 && <span className="sep">›</span>}
                <span className={i === crumbs.length - 1 ? "current" : ""}>{c}</span>
              </span>
            ))}
          </div>
          <div className="topbar-divider" />
          <button className="icon-btn" title="帮助">
            <CircleHelp size={16} />
          </button>
          <button className="icon-btn" title="全屏">
            <Maximize2 size={15} />
          </button>
          <div className="topbar-user">
            <span>李飞</span>
            <span className="avatar">李</span>
          </div>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
