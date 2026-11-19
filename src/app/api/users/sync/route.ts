import { NextResponse } from "next/server";
import { syncUsers } from "@/lib/serverUserStore";
import type { UserRow } from "@/lib/users";

export const dynamic = "force-dynamic";

/** 本地（浏览器）账号一次性迁移到服务端：按 userId 合并，不覆盖服务端已有数据 */
export async function POST(request: Request) {
  const body = await request.json();
  const input: UserRow[] = Array.isArray(body?.users) ? body.users : [];
  const { list, merged } = await syncUsers(input);
  return NextResponse.json({ users: list, merged });
}
