import { menuData } from "./menu";

/** 功能页唯一键：一级模块/二级菜单 */
export const pageKey = (moduleLabel: string, pageLabel: string) =>
  `${moduleLabel}/${pageLabel}`;

export interface RoleDef {
  id: string;
  name: string;
  desc: string;
  /** 管理员拥有全部权限，不可编辑 */
  all?: boolean;
  defaultPages: string[];
}

/** 授权规则：模块 -> "*"（全部功能）或具体功能名列表 */
type Spec = Record<string, "*" | string[]>;

const SPECS: Record<string, Spec> = {
  sales: {
    销售管理: "*",
    物流管理: "*",
    采购管理: ["采购业务", "报表"],
    库存管理: ["入库", "出库", "货位管理", "仓库报表"],
    个人中心: ["我的"],
  },
  production: {
    自制生产: "*",
    委外管理: "*",
    质量管理: "*",
    设备管理: "*",
    工艺装备: "*",
    研发管理: "*",
    库存管理: ["入库", "出库", "耗材出入库单", "组装拆卸"],
    个人中心: ["我的", "公共"],
  },
  finance: {
    财务管理: "*",
    采购管理: ["报表", "采购设置"],
    库存管理: ["成本管理", "仓库报表"],
    销售管理: ["销售报表"],
    个人中心: ["我的"],
  },
  hr: {
    人力资源: "*",
    行政管理: "*",
    个人中心: ["我的", "公共"],
  },
};

/** 全部二级功能键 */
export function allPageKeys(): string[] {
  return menuData.flatMap((m) =>
    (m.children ?? []).map((c) => pageKey(m.label, c.label))
  );
}

function pagesFromSpec(spec: Spec): string[] {
  const out: string[] = [];
  for (const mod of menuData) {
    const rule = spec[mod.label];
    if (!rule) continue;
    const children = mod.children ?? [];
    if (rule === "*") {
      children.forEach((c) => out.push(pageKey(mod.label, c.label)));
    } else {
      rule.forEach((label) => {
        if (children.some((c) => c.label === label)) {
          out.push(pageKey(mod.label, label));
        }
      });
    }
  }
  return out;
}

export const ROLES: RoleDef[] = [
  {
    id: "admin",
    name: "系统管理员",
    desc: "拥有全部模块与功能权限，不可修改",
    all: true,
    defaultPages: [],
  },
  {
    id: "sales",
    name: "销售经理",
    desc: "销售、物流全流程，可查采购与库存报表",
    defaultPages: pagesFromSpec(SPECS.sales),
  },
  {
    id: "production",
    name: "生产主管",
    desc: "生产、委外、质量、设备、工艺、研发全流程",
    defaultPages: pagesFromSpec(SPECS.production),
  },
  {
    id: "finance",
    name: "财务主管",
    desc: "财务全模块，可查采购/库存/销售报表",
    defaultPages: pagesFromSpec(SPECS.finance),
  },
  {
    id: "hr",
    name: "人事行政",
    desc: "人力资源与行政管理全模块",
    defaultPages: pagesFromSpec(SPECS.hr),
  },
];

/** 初始权限表：角色 id -> 功能键列表 */
export function defaultPerms(): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  ROLES.forEach((r) => {
    map[r.id] = r.all ? allPageKeys() : [...r.defaultPages];
  });
  return map;
}

/** 当前登录身份（演示用，默认管理员） */
export const DEFAULT_ROLE_ID = "admin";
