// 用户管理表格数据，按截图还原
export interface UserRow {
  userId: string;
  username: string;
  name: string;
  phone: string;
  role: string;
  remark: string;
  status: "启用" | "停用";
  lockCount: string;
  creator: string;
  createdAt: string;
  isSuperAdmin?: boolean;
}

export const userRows: UserRow[] = [
  { userId: "UID202611040001", username: "吴志兵", name: "吴志兵", phone: "--", role: "超级管理员", remark: "--", status: "启用", lockCount: "--", creator: "--", createdAt: "2026-11-04 15:48:48", isSuperAdmin: true },
  { userId: "UID202607220001", username: "text", name: "张三", phone: "185222222222", role: "超级管理员", remark: "--", status: "启用", lockCount: "--", creator: "--", createdAt: "2026-07-22 16:20:10", isSuperAdmin: true },
  { userId: "UID202604280002", username: "qdjxbjx", name: "青岛建诚信机电设备", phone: "--", role: "电商管理员", remark: "--", status: "启用", lockCount: "--", creator: "版图", createdAt: "2026-04-28 15:42:23" },
  { userId: "UID202604170001", username: "ceshi", name: "测试员", phone: "--", role: "采购主管", remark: "--", status: "启用", lockCount: "--", creator: "测试", createdAt: "2026-04-17 16:18:03" },
  { userId: "UID202601270001", username: "biovblue", name: "北京百财信息", phone: "--", role: "AAA、ESSE", remark: "--", status: "启用", lockCount: "--", creator: "测试", createdAt: "2026-01-27 13:20:54" },
  { userId: "UID202509090001", username: "杜晓晓", name: "杜晓晓", phone: "18577445666", role: "库管员", remark: "--", status: "启用", lockCount: "--", creator: "测试", createdAt: "2025-09-09 22:49:36" },
  { userId: "UID202509050002", username: "商羽用户", name: "商羽", phone: "18666666666", role: "超级管理员", remark: "新增一个超级管理员测试", status: "启用", lockCount: "2", creator: "测试", createdAt: "2025-09-05 07:56:51", isSuperAdmin: true },
  { userId: "UID202509050001", name: "李敏", username: "李敏", phone: "13655889566", role: "库管员(销售)", remark: "--", status: "启用", lockCount: "--", creator: "测试", createdAt: "2025-09-05 07:36:58" },
  { userId: "UID202508140001", username: "王毅", name: "王毅", phone: "13756869999", role: "库管员", remark: "--", status: "启用", lockCount: "--", creator: "欧毅", createdAt: "2025-08-14 11:22:08" },
  { userId: "UID202504080001", username: "王丽丽", name: "王丽丽", phone: "15298745682", role: "库管员", remark: "123456", status: "启用", lockCount: "--", creator: "测试", createdAt: "2025-04-08 09:44:26" },
  { userId: "UID202411120001", username: "段豪", name: "段豪", phone: "16761009562", role: "库管员", remark: "--", status: "启用", lockCount: "--", creator: "测试", createdAt: "2024-11-12 09:48:11" },
  { userId: "YRS202101010101", username: "admin", name: "admin", phone: "13002318278", role: "超级管理员", remark: "--", status: "启用", lockCount: "--", creator: "测试", createdAt: "2021-08-09 17:26:44", isSuperAdmin: true },
];
