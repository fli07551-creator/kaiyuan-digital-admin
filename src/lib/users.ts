// 用户管理表格数据：初始只保留系统管理员，其余账号由管理员在后台配置
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
  /** 登录密码；未设置时默认 123456 */
  password?: string;
}

export const ADMIN_USER_ID = "UID202611040001";
export const ADMIN_USERNAME = "吴志兵";

/** 旧版本内置的演示账号编号，升级时从本地数据中清除 */
export const LEGACY_DEMO_USER_IDS = [
  "UID202607220001",
  "UID202604280002",
  "UID202604170001",
  "UID202601270001",
  "UID202509090001",
  "UID202509050002",
  "UID202509050001",
  "UID202508140001",
  "UID202504080001",
  "UID202411120001",
  "YRS202101010101",
];

export const userRows: UserRow[] = [
  {
    userId: ADMIN_USER_ID,
    username: ADMIN_USERNAME,
    name: ADMIN_USERNAME,
    phone: "--",
    role: "超级管理员",
    remark: "系统初始管理员，请登录后及时修改密码",
    status: "启用",
    lockCount: "--",
    creator: "--",
    createdAt: "2026-11-04 15:48:48",
    isSuperAdmin: true,
    password: "123456",
  },
];
