/**
 * 开元数智 · 综合管理平台数据聚合层
 * ---------------------------------------------------------------
 * 数据来源：李飞已建设的各部门管理平台与机器人（真实快照，非编造）。
 * 快照时间：2026-11-18。所有数字取自下列本地数据源，口径见每条备注。
 *
 *  企采台（公司信息采集）  data/companies.db       —— 138 家企业
 *  料讯通（业务采集）      data/platform.db         —— 213 线索 / 30 联系人
 *  拉头看板（咖啡机管理）  mes_data.pkl             —— 172 条工序检测
 *  招聘/夹具/生产/品质/设备等 —— 当前工作区为空或待接入，标注"待接入"
 *
 * 说明：本工作区为笔记本端备份，主力业务在台式机 E:\Agent（共享盘同步）。
 *      空模块（品质/工艺/模具/生产/设备）的数据不在本机，故不伪造数字。
 */

export type DeptStatus = "online" | "pending" | "offline";

export interface DeptModule {
  id: string;
  name: string;
  subtitle: string;
  status: DeptStatus;
  statusText: string;
  owner: string;
  source: string;
  snapshot: string;
  updatedAt: string;
  metrics: { label: string; value: string; unit?: string; tone?: "normal" | "warn" | "danger" | "good" }[];
  note?: string;
}

// ============ 全局 KPI 总览 ============
export const overview = {
  snapshot: "2026-11-18",
  kpis: [
    { label: "接入部门平台", value: "3", unit: "个", sub: "另有 5 个待接入", icon: "layers" },
    { label: "企业资源库", value: "138", unit: "家", sub: "企采台 · 待核验", icon: "building" },
    { label: "海外业务线索", value: "213", unit: "条", sub: "料讯通 · 近7天", icon: "globe" },
    { label: "工序检测记录", value: "172", unit: "条", sub: "拉头看板 · MES", icon: "activity" },
    { label: "待核验企业", value: "138", unit: "家", sub: "需人工复核", icon: "shield", warn: true },
    { label: "质量不良预警", value: "2", unit: "项", sub: "磨豆/撞刀工序", icon: "alert", warn: true },
  ],
};

// ============ 各部门数据模块 ============
export const departments: DeptModule[] = [
  {
    id: "procurement",
    name: "企采台",
    subtitle: "企业信息采集平台",
    status: "online",
    statusText: "数据就绪",
    owner: "个人管理",
    source: "公司信息采集/data/companies.db",
    snapshot: "2026-11-13",
    updatedAt: "11-13 20:23",
    metrics: [
      { label: "企业总数", value: "138", unit: "家" },
      { label: "本年产值合计", value: "26.62", unit: "亿元" },
      { label: "覆盖行业", value: "8+", unit: "类" },
      { label: "待核验", value: "138", unit: "家", tone: "warn" },
    ],
    note: "数据源为本地样本源（离线演示），138 家全部「待核验 / 未跟进」，需替换真实采集源并人工复核。",
  },
  {
    id: "business",
    name: "料讯通",
    subtitle: "海外业务线索采集",
    status: "online",
    statusText: "数据就绪",
    owner: "个人管理",
    source: "业务采集/data/platform.db",
    snapshot: "2026-11-16",
    updatedAt: "11-16",
    metrics: [
      { label: "线索总数", value: "213", unit: "条" },
      { label: "联系人", value: "30", unit: "位" },
      { label: "已转化", value: "29", unit: "条", tone: "good" },
      { label: "平均评分", value: "40.3", unit: "分" },
    ],
    note: "线索 213 条全部为近 7 天采集；中东市场 163 条占主体，来源以 uae_yellowpages 为主。",
  },
  {
    id: "pull-rod",
    name: "拉头看板",
    subtitle: "咖啡机工序质量检测",
    status: "online",
    statusText: "数据就绪",
    owner: "咖啡机管理",
    source: "拉头看板/mes_data.pkl",
    snapshot: "2026-11-16",
    updatedAt: "11-16 13:38",
    metrics: [
      { label: "检测记录", value: "172", unit: "条" },
      { label: "撞刀不良率", value: "29.5", unit: "%", tone: "danger" },
      { label: "磨豆不良率", value: "24.0", unit: "%", tone: "danger" },
      { label: "涉及机型", value: "3", unit: "款" },
    ],
    note: "数据源 B3MES，型号 ES351UK/EU、ES352EU；撞刀 122 条(不良36)、磨豆 50 条(不良12)，不良率偏高需关注。",
  },
  {
    id: "recruit",
    name: "招聘平台",
    subtitle: "行政人事 · 招聘机器人",
    status: "pending",
    statusText: "待接入数据",
    owner: "行政人事管理",
    source: "01 招聘要求 / 03 候选人台账",
    snapshot: "—",
    updatedAt: "—",
    metrics: [
      { label: "岗位要求", value: "—", unit: "" },
      { label: "候选人", value: "0", unit: "人" },
      { label: "今日入库", value: "0", unit: "人" },
    ],
    note: "招聘机器人连续多日日报显示 0 名候选人入库；本机仅有目录结构，业务数据在台式机/共享盘，待接入。",
  },
  {
    id: "fixture",
    name: "夹具平台",
    subtitle: "夹具设计管理",
    status: "pending",
    statusText: "待接入数据",
    owner: "夹具管理",
    source: "夹具管理/index.html",
    snapshot: "—",
    updatedAt: "—",
    metrics: [
      { label: "夹具条目", value: "0", unit: "条" },
      { label: "数据落库", value: "未启用", unit: "" },
    ],
    note: "已有单页 HTML 原型（新建夹具表单），数据存浏览器本地，未接后端数据库，待集中化。",
  },
  {
    id: "production",
    name: "生产管理",
    subtitle: "生产效率与日报",
    status: "pending",
    statusText: "待接入数据",
    owner: "生产管理",
    source: "共享盘 / 生产主管机器人",
    snapshot: "—",
    updatedAt: "—",
    metrics: [
      { label: "今日产量", value: "—", unit: "" },
      { label: "计划达成率", value: "—", unit: "" },
    ],
    note: "台式机 E:\Agent\生产管理 有完整链路（日报表→效率数据→看板），本机目录为空，数据不在本工作区。",
  },
  {
    id: "quality",
    name: "品质管理",
    subtitle: "QE 质量与 SPC 监控",
    status: "pending",
    statusText: "待接入数据",
    owner: "品质管理",
    source: "QE-天天 / 质量管理平台",
    snapshot: "—",
    updatedAt: "—",
    metrics: [
      { label: "IQC 合格率", value: "—", unit: "" },
      { label: "SPC 预警", value: "—", unit: "" },
    ],
    note: "台式机有 MW100/AS100/SL400/DD100 四产品 SPC 监控与质量日报，本机 qe-engineer-bot 目录为空。",
  },
  {
    id: "equipment",
    name: "设备管理",
    subtitle: "设备台账与运行日报",
    status: "pending",
    statusText: "待接入数据",
    owner: "设备管理",
    source: "设备管理台账.xlsx",
    snapshot: "—",
    updatedAt: "—",
    metrics: [
      { label: "设备总数", value: "—", unit: "" },
      { label: "超期项", value: "—", unit: "" },
    ],
    note: "台式机有 14 个子表台账（设备/工装/保养/点检/维修），本机目录为空，待接入。",
  },
  {
    id: "process-mold",
    name: "工艺 · 模具",
    subtitle: "工程技术与工装",
    status: "pending",
    statusText: "待接入数据",
    owner: "工艺管理 / 模具管理",
    source: "共享盘 / 工作日志",
    snapshot: "—",
    updatedAt: "—",
    metrics: [
      { label: "在跟进任务", value: "—", unit: "" },
      { label: "模具台账", value: "—", unit: "" },
    ],
    note: "台式机工艺平台按四模块归类工作日志（量产品维护/新品导入/设备管理/专项跟进），本机目录为空。",
  },
];

// ============ 企采台 · 行业分布（真实） ============
export const industryDistribution = [
  { name: "汽车整车", value: 13 },
  { name: "钢铁冶金", value: 10 },
  { name: "医药制造", value: 7 },
  { name: "光伏新能源", value: 6 },
  { name: "化工", value: 5 },
  { name: "有色金属", value: 5 },
  { name: "白酒酿造", value: 5 },
  { name: "其他", value: 87 },
];

// ============ 企采台 · 省份分布（真实，TOP） ============
export const provinceDistribution = [
  { name: "广东", value: 15 },
  { name: "浙江", value: 10 },
  { name: "江苏", value: 9 },
  { name: "山东", value: 8 },
  { name: "北京", value: 6 },
  { name: "上海", value: 5 },
  { name: "其他", value: 85 },
];

// ============ 料讯通 · 线索市场分布（真实） ============
export const leadMarketDistribution = [
  { name: "中东", value: 163 },
  { name: "欧洲", value: 9 },
  { name: "东南亚", value: 6 },
  { name: "北美", value: 5 },
  { name: "拉美", value: 3 },
  { name: "其他", value: 27 },
];

// ============ 料讯通 · 线索漏斗（真实） ============
export const leadFunnel = [
  { label: "采集线索", value: 213, pct: 100 },
  { label: "有效联系人", value: 30, pct: 14 },
  { label: "已转化", value: 29, pct: 14 },
];

// ============ 拉头看板 · 工序质量（真实） ============
export const processQuality = [
  { name: "撞刀校正", total: 122, good: 86, bad: 36, badRate: 29.5 },
  { name: "磨豆称重", total: 50, good: 38, bad: 12, badRate: 24.0 },
];

// ============ 告警与待办 ============
export interface AlertItem {
  level: "danger" | "warn" | "info";
  dept: string;
  title: string;
  detail: string;
  time: string;
}

export const alerts: AlertItem[] = [
  {
    level: "danger",
    dept: "拉头看板",
    title: "撞刀校正不良率 29.5%",
    detail: "122 条检测中 36 条不良，涉及 ES351UK/EU、ES352EU 机型，建议核查刀具与参数。",
    time: "11-16",
  },
  {
    level: "danger",
    dept: "拉头看板",
    title: "磨豆称重不良率 24.0%",
    detail: "50 条检测中 12 条不良，权重偏差集中，建议校准称重工位。",
    time: "11-16",
  },
  {
    level: "warn",
    dept: "企采台",
    title: "138 家企业全部待核验",
    detail: "数据源为本地离线样本，需替换真实采集源并安排人工复核。",
    time: "11-13",
  },
  {
    level: "warn",
    dept: "料讯通",
    title: "线索评分普遍偏低",
    detail: "213 条线索平均评分 40.3，130 条处于 40-59 区间，需筛选高价值目标。",
    time: "11-16",
  },
  {
    level: "info",
    dept: "招聘平台",
    title: "候选人入库持续为 0",
    detail: "招聘机器人连续多日日报显示 0 名候选人，链路待跑通。",
    time: "持续",
  },
];

// ============ 数据接入清单 ============
export const sourceList = [
  { dept: "企采台", path: "公司信息采集/data/companies.db", type: "SQLite", status: "已接入", records: "138" },
  { dept: "料讯通", path: "业务采集/data/platform.db", type: "SQLite", status: "已接入", records: "213" },
  { dept: "拉头看板", path: "咖啡机管理/拉头看板/mes_data.pkl", type: "MES 快照", status: "已接入", records: "172" },
  { dept: "夹具平台", path: "夹具管理/index.html", type: "本地存储", status: "待接入", records: "—" },
  { dept: "招聘平台", path: "行政人事管理/*", type: "文档台账", status: "待接入", records: "0" },
  { dept: "生产管理", path: "台式机 E:\\Agent\\生产管理", type: "共享盘", status: "待接入", records: "—" },
  { dept: "品质管理", path: "台式机 E:\\Agent\\品质管理", type: "共享盘", status: "待接入", records: "—" },
  { dept: "设备管理", path: "台式机 E:\\Agent\\设备管理", type: "共享盘", status: "待接入", records: "—" },
];
