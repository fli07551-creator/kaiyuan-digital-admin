// 二级功能页的列表结构定义
// 说明：列结构与筛选项按模块族归类，覆盖 89 个功能页；
// 数据为演示用（根据菜单名确定性生成，保证每次渲染一致），接入真实数据源后替换 data 来源即可。

export type Align = "left" | "center" | "right";
export type ColKind = "text" | "code" | "money" | "num" | "status";

export interface ColumnDef {
  key: string;
  label: string;
  align?: Align;
  kind?: ColKind;
  width?: number;
}

export interface FilterDef {
  key: string;
  label: string;
  kind: "select" | "text";
  options?: string[];
}

export type Row = Record<string, string | number>;

export interface ListSchema {
  columns: ColumnDef[];
  filters: FilterDef[];
  rows: Row[];
  /** 是否存在"启用/停用"这类状态操作 */
  hasStatusAction: boolean;
}

/* ---------------- 确定性随机（保证每次构建数据一致） ---------------- */

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pick<T>(seed: number, arr: T[], offset = 0): T {
  return arr[(seed + offset) % arr.length];
}

function num(seed: number, min: number, max: number, offset = 0): number {
  const span = max - min + 1;
  return min + ((seed >>> (offset % 8)) % span);
}

const OWNERS = ["张伟", "李静", "王海涛", "刘敏", "陈国强", "赵芳", "孙鹏", "周丽"];
const PARTNERS = [
  "青岛海联机械有限公司",
  "山东恒信精工",
  "宁波华翔模具",
  "苏州联达供应链",
  "广州明泰实业",
  "天津中德重工",
];
const CATEGORIES = ["一类", "二类", "外购件", "自制件", "标准件", "专用件"];

/* ---------------- 模块族判定 ---------------- */

type Family = "archive" | "voucher" | "report" | "setting";

function familyOf(moduleLabel: string, pageLabel: string): Family {
  if (/设置|参数|配置/.test(pageLabel)) return "setting";
  if (/报表|统计|分析|运算|汇总|台账|成本/.test(pageLabel)) return "report";
  if (
    /业务|单|入库|出库|调拨|盘点|拆卸|委外|计划|控制|检验|巡检|保养|维修|招聘|考勤|培训|考试|绩效|工资|薪酬|会计|凭证|费用|报销|往来|资产|账|合同|公文|档案|车辆|会议|访客|物资|奖惩|审批|任务|发布|文件|宿舍|食堂/.test(
      pageLabel
    )
  )
    return "voucher";
  return "archive";
}

/* ---------------- 各模块族的列与筛选 ---------------- */

function archiveCols(moduleLabel: string): ColumnDef[] {
  if (moduleLabel === "工艺装备") {
    // 对齐原系统「工艺装备 › 模具」的列结构
    return [
      { key: "类别", label: "模具类型", width: 110 },
      { key: "编码", label: "模具编码", kind: "code", width: 110 },
      { key: "名称", label: "模具名称", width: 160 },
      { key: "规格", label: "规格", width: 90 },
      { key: "寿命", label: "模具寿命", kind: "num", align: "right", width: 90 },
      { key: "已用", label: "已使用次数", kind: "num", align: "right", width: 100 },
      { key: "剩余", label: "模具剩余寿命", kind: "num", align: "right", width: 110 },
      { key: "设备", label: "关联设备", width: 120 },
      { key: "状态", label: "状态", kind: "status", width: 80 },
    ];
  }
  return [
    { key: "编码", label: "编码", kind: "code", width: 120 },
    { key: "名称", label: "名称", width: 180 },
    { key: "分类", label: "所属分类", width: 110 },
    { key: "规格", label: "规格型号", width: 130 },
    { key: "负责人", label: "负责人", width: 90 },
    { key: "日期", label: "更新日期", width: 110 },
    { key: "状态", label: "状态", kind: "status", width: 80 },
  ];
}

function voucherCols(pageLabel: string): ColumnDef[] {
  return [
    { key: "单号", label: "单据编号", kind: "code", width: 140 },
    { key: "日期", label: "业务日期", width: 110 },
    { key: "往来", label: "往来单位 / 来源", width: 220 },
    { key: "经办", label: "经办人", width: 90 },
    { key: "数量", label: "数量", kind: "num", align: "right", width: 80 },
    { key: "金额", label: pageLabel.includes("工资") || pageLabel.includes("报销") ? "金额" : "金额（元）", kind: "money", align: "right", width: 120 },
    { key: "状态", label: "状态", kind: "status", width: 90 },
  ];
}

function reportCols(): ColumnDef[] {
  return [
    { key: "项目", label: "统计项目", width: 200 },
    { key: "本期", label: "本期", kind: "money", align: "right", width: 130 },
    { key: "上期", label: "上期", kind: "money", align: "right", width: 130 },
    { key: "环比", label: "环比", align: "right", width: 100 },
    { key: "占比", label: "占比", align: "right", width: 90 },
  ];
}

function settingCols(): ColumnDef[] {
  return [
    { key: "参数", label: "参数名称", width: 180 },
    { key: "值", label: "参数值", kind: "code", width: 160 },
    { key: "说明", label: "作用说明", width: 260 },
    { key: "更新", label: "更新时间", width: 110 },
    { key: "状态", label: "状态", kind: "status", width: 80 },
  ];
}

function filtersFor(family: Family, moduleLabel: string, pageLabel: string): FilterDef[] {
  if (moduleLabel === "工艺装备" && family === "archive") {
    return [
      { key: "模具类型", label: "模具类型", kind: "select", options: ["模具一类", "模具二类", "外购模具"] },
      { key: "模具编码", label: "模具编码", kind: "text" },
      { key: "模具名称", label: "模具名称", kind: "text" },
      { key: "规格", label: "规格", kind: "text" },
      { key: "状态", label: "状态", kind: "select", options: ["启用", "停用"] },
    ];
  }
  if (family === "archive") {
    return [
      { key: "分类", label: "所属分类", kind: "select", options: CATEGORIES },
      { key: "编码", label: "编码", kind: "text" },
      { key: "名称", label: "名称", kind: "text" },
      { key: "状态", label: "状态", kind: "select", options: ["启用", "停用"] },
    ];
  }
  if (family === "voucher") {
    return [
      { key: "状态", label: "单据状态", kind: "select", options: ["草稿", "待审核", "已完成"] },
      { key: "单号", label: "单据编号", kind: "text" },
      { key: "往来", label: "往来单位", kind: "text" },
      { key: "日期", label: "业务日期", kind: "text" },
    ];
  }
  if (family === "report") {
    return [
      { key: "周期", label: "统计周期", kind: "select", options: ["本月", "本季", "本年"] },
      { key: "项目", label: "统计项目", kind: "text" },
    ];
  }
  return [
    { key: "参数", label: "参数名称", kind: "text" },
    { key: "状态", label: "状态", kind: "select", options: ["启用", "停用"] },
  ];
}

/* ---------------- 行数据生成 ---------------- */

function buildRows(
  family: Family,
  moduleLabel: string,
  pageLabel: string,
  count: number
): Row[] {
  const seed = hash(moduleLabel + "/" + pageLabel);
  const rows: Row[] = [];

  for (let i = 0; i < count; i++) {
    const s = (seed + i * 977) >>> 0;

    if (family === "archive") {
      if (moduleLabel === "工艺装备") {
        const 寿命 = num(s, 5000, 20000, 2);
        const 已用 = num(s, 100, Math.max(200, Math.floor(寿命 / 2)), 3);
        rows.push({
          类别: pick(s, ["模具一类", "模具二类", "外购模具"], i),
          编码: `EC${String(num(s, 1, 9999, 1)).padStart(4, "0")}`,
          名称: `${pageLabel.replace(/管理|档案/g, "")}${pick(s, ["A型", "B型", "C型", "标准型"], i)}`,
          规格: String(num(s, 1, 60, 4)),
          寿命,
          已用,
          剩余: Math.max(0, 寿命 - 已用),
          设备: pick(s, ["--", "CNC-01", "CNC-02", "注塑机-3", "冲压线-1"], i),
          状态: pick(s, ["启用", "启用", "停用"], i),
        });
      } else {
        rows.push({
          编码: `${moduleLabel.slice(0, 2)}${String(num(s, 1000, 9999, 1))}`,
          名称: `${pageLabel.replace(/管理|档案|基础/g, "")}${pick(s, ["A", "B", "C", "D"], i)}-${num(s, 1, 99, 2)}`,
          分类: pick(s, CATEGORIES, i),
          规格: `${num(s, 1, 200, 3)}×${num(s, 10, 90, 4)}`,
          负责人: pick(s, OWNERS, i),
          日期: `2026-${String(num(s, 1, 11, 5)).padStart(2, "0")}-${String(num(s, 1, 28, 6)).padStart(2, "0")}`,
          状态: pick(s, ["启用", "启用", "停用"], i),
        });
      }
      continue;
    }

    if (family === "voucher") {
      const prefix = { 销售管理: "XS", 采购管理: "CG", 库存管理: "KC", 物流管理: "WL", 委外管理: "WW", 自制生产: "SC", 质量管理: "ZL", 人力资源: "RL", 行政管理: "XZ", 财务管理: "CW" }[moduleLabel] ?? "DJ";
      rows.push({
        单号: `${prefix}2026${String(num(s, 1000, 9999, 1))}`,
        日期: `2026-11-${String(num(s, 1, 18, 2)).padStart(2, "0")}`,
        往来: pick(s, PARTNERS, i),
        经办: pick(s, OWNERS, i),
        数量: num(s, 1, 500, 3),
        金额: num(s, 1200, 186000, 4),
        状态: pick(s, ["草稿", "待审核", "已完成", "已完成"], i),
      });
      continue;
    }

    if (family === "report") {
      const cur = num(s, 50000, 980000, 1);
      const prev = num(s, 40000, cur, 2);
      const rate = ((cur - prev) / prev) * 100;
      rows.push({
        项目: `${pageLabel.replace(/报表|统计|分析|管理/g, "")}-${pick(s, ["华东", "华北", "华南", "西南", "东北"], i)}`,
        本期: cur,
        上期: prev,
        环比: `${rate >= 0 ? "+" : ""}${rate.toFixed(1)}%`,
        占比: `${num(s, 3, 42, 3)}%`,
      });
      continue;
    }

    rows.push({
      参数: `${pageLabel.replace(/设置/g, "")}参数_${String(i + 1).padStart(2, "0")}`,
      值: pick(s, ["true", "false", "30", "自动", "手动", "1.5"], i),
      说明: `控制${pageLabel.replace(/设置/g, "")}相关业务默认行为`,
      更新: `2026-${String(num(s, 1, 11, 5)).padStart(2, "0")}-${String(num(s, 1, 28, 6)).padStart(2, "0")}`,
      状态: pick(s, ["启用", "启用", "停用"], i),
    });
  }

  return rows;
}

/** 按模块与功能名生成列表页结构 */
export function getListSchema(moduleLabel: string, pageLabel: string): ListSchema {
  const family = familyOf(moduleLabel, pageLabel);
  const columns =
    family === "archive"
      ? archiveCols(moduleLabel)
      : family === "voucher"
        ? voucherCols(pageLabel)
        : family === "report"
          ? reportCols()
          : settingCols();

  const count = family === "report" ? 8 : family === "setting" ? 6 : 13;

  return {
    columns,
    filters: filtersFor(family, moduleLabel, pageLabel),
    rows: buildRows(family, moduleLabel, pageLabel, count),
    hasStatusAction: family === "archive" || family === "setting",
  };
}
