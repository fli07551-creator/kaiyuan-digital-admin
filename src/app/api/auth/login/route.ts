import { NextResponse } from "next/server";
import { listUsers, matchUser } from "@/lib/serverUserStore";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const account = String(body?.account ?? "");
    const password = String(body?.password ?? "");
    const list = await listUsers();
    const result = matchUser(list, account, password);
    if (!result.ok) {
      return NextResponse.json({ ok: false, reason: result.reason }, { status: 200 });
    }
    const u = result.user;
    return NextResponse.json({
      ok: true,
      session: {
        userId: u.userId,
        username: u.username,
        name: u.name || u.username,
        role: u.role,
      },
    });
  } catch {
    return NextResponse.json({ ok: false, reason: "服务异常，请稍后再试" }, { status: 500 });
  }
}
