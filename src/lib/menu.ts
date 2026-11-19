// 左侧导航菜单结构
// 依据：2026-11-18 登录弘智 SaaS 演示系统后抓取的真实菜单树
//       （15 个一级模块 / 89 个二级菜单，见项目根目录 README.md）
// 已在最前面加入「综合驾驶舱」入口，末尾挂「用户管理」用于演示路由。
export interface MenuItem {
  label: string;
  icon?: string;
  href?: string;
  children?: MenuItem[];
}

const rawMenuData: MenuItem[] = [
  // 综合驾驶舱（开元数智自研首页）
  { label: "综合驾驶舱", icon: "dashboard", href: "/" },

  // ===== 以下为弘智原站真实菜单结构 =====
  {
    label: "销售管理",
    children: [
      { label: "订货商城" },
      { label: "客户管理" },
      { label: "项目管理" },
      { label: "销售业务" },
      { label: "销售报表" },
      { label: "售后维修" },
      { label: "销售设置" },
    ],
  },
  {
    label: "采购管理",
    children: [
      { label: "采购业务" },
      { label: "报表" },
      { label: "采购设置" },
    ],
  },
  {
    label: "库存管理",
    children: [
      { label: "入库" },
      { label: "出库" },
      { label: "耗材出入库单" },
      { label: "组装拆卸" },
      { label: "调拨" },
      { label: "货位管理" },
      { label: "盘点" },
      { label: "成本管理" },
      { label: "仓库报表" },
      { label: "库存设置" },
    ],
  },
  {
    label: "物流管理",
    children: [
      { label: "基础档案" },
      { label: "物流业务" },
    ],
  },
  {
    label: "委外管理",
    children: [
      { label: "工序委外业务" },
      { label: "委外材料管理" },
      { label: "委外结算" },
    ],
  },
  {
    label: "自制生产",
    children: [
      { label: "MRP运算" },
      { label: "生产计划" },
      { label: "生产控制" },
      { label: "材料控制" },
      { label: "生产工资" },
      { label: "生产成本" },
      { label: "生产统计" },
      { label: "生产设置" },
    ],
  },
  {
    label: "质量管理",
    children: [
      { label: "质检业务" },
      { label: "质量统计" },
      { label: "质量设置" },
    ],
  },
  {
    label: "设备管理",
    children: [
      { label: "设备巡检" },
      { label: "设备保养" },
      { label: "设备维修" },
      { label: "设备耗材" },
      { label: "设备统计" },
      { label: "设备设置" },
    ],
  },
  {
    label: "工艺装备",
    children: [
      { label: "模具" },
      { label: "工具管理" },
      { label: "参数设置" },
    ],
  },
  {
    label: "研发管理",
    children: [
      { label: "物料管理" },
      { label: "工艺工序" },
      { label: "研发设置" },
    ],
  },
  {
    label: "财务管理",
    children: [
      { label: "财务会计" },
      { label: "工资" },
      { label: "固定资产" },
      { label: "费用" },
      { label: "往来账" },
      { label: "财务设置" },
    ],
  },
  {
    label: "个人中心",
    children: [
      { label: "我的" },
      { label: "公共" },
    ],
  },
  {
    label: "人力资源",
    children: [
      { label: "招聘" },
      { label: "劳动关系" },
      { label: "培训" },
      { label: "考试" },
      { label: "绩效" },
      { label: "工作汇报" },
      { label: "考勤" },
      { label: "薪酬" },
      { label: "劳务派遣" },
      { label: "报表" },
      { label: "人力资源设置" },
    ],
  },
  {
    label: "行政管理",
    children: [
      { label: "物资" },
      { label: "车辆" },
      { label: "会议室" },
      { label: "合同" },
      { label: "公文" },
      { label: "证章" },
      { label: "档案" },
      { label: "访客" },
      { label: "食堂" },
      { label: "住宿" },
      { label: "稽核" },
      { label: "奖惩" },
      { label: "通用审批" },
      { label: "任务" },
      { label: "信息发布" },
      { label: "学习园地" },
      { label: "文件" },
      { label: "行政设置" },
    ],
  },
  {
    label: "应用中心",
    children: [
      { label: "权限控制", href: "/system/permissions" },
      { label: "基础设置" },
      { label: "期初设置" },
      { label: "期末处理" },
      // 演示路由：用户管理（挂在权限控制下，便于验证页面）
      { label: "用户管理", href: "/users" },
    ],
  },
];

/**
 * 为二级菜单补齐路由。
 * 原站点击二级菜单是在右侧 iframe 载入对应功能页；这里映射为真实可访问的路由
 * `/m/<一级模块>/<二级菜单>`，使侧栏可以逐级下钻（功能页本体为待接入占位）。
 */
function attachRoutes(items: MenuItem[]): MenuItem[] {
  return items.map((item) => {
    if (!item.children) return item;
    return {
      ...item,
      children: item.children.map((child) => ({
        ...child,
        href:
          child.href ??
          `/m/${encodeURIComponent(item.label)}/${encodeURIComponent(child.label)}`,
      })),
    };
  });
}

export const menuData: MenuItem[] = attachRoutes(rawMenuData);

/** 按路由找出所属的一级模块与二级菜单，供面包屑/页面标题使用 */
export function resolveMenu(moduleLabel: string, pageLabel: string) {
  const mod = menuData.find((m) => m.label === moduleLabel);
  if (!mod) return null;
  const target = mod.children?.find((c) => c.label === pageLabel);
  if (!target) return null;
  return { module: mod, page: target, siblings: mod.children ?? [] };
}

/** 全部二级菜单路由，用于静态预渲染 */
export function allChildRoutes() {
  return menuData.flatMap((m) =>
    (m.children ?? [])
      .filter((c) => c.href && c.href.startsWith("/m/"))
      .map((c) => ({
        module: decodeURIComponent(c.href!.split("/")[2] ?? ""),
        page: decodeURIComponent(c.href!.split("/")[3] ?? ""),
      }))
  );
}
