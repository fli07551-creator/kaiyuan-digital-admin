import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";
import { AuthProvider } from "@/components/AuthProvider";
import { RbacProvider } from "@/components/RbacProvider";

export const metadata: Metadata = {
  title: "开元数智 - 企业管理",
  description: "开元数智企业管理平台",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <AuthProvider>
          <RbacProvider>
            <AppShell>{children}</AppShell>
          </RbacProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
