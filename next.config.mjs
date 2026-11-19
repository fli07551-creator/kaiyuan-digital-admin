/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // pg 为 Node 原生模块，服务端运行时保持外部依赖不打包
  serverExternalPackages: ["pg"],
  // 构建时判断账号存储模式（是否配置了 DATABASE_URL），供前端提示使用（不含连接串本身）
  env: {
    NEXT_PUBLIC_USER_STORE: process.env.DATABASE_URL ? "database" : "file",
  },
};

export default nextConfig;
