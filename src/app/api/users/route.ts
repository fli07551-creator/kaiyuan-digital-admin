import { NextResponse } from "next/server";
import {
  listUsers,
  createUsers,
  updateUser,
  deleteUsers,
} from "@/lib/serverUserStore";
import type { UserRow } from "@/lib/users";

export const dynamic = "force-dynamic";

/** 简单管理员校验：请求头携带登录管理员的 userId */
async function requireAdmin(request: Request): Promise<boolean> {
  const id = request.headers.get("x-kaiyuan-user") || "";
  if (!id) return false;
  const list = await listUsers();
  return list.some((u) => u.userId === id && u.isSuperAdmin);
}

export async function GET(request: Request) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "仅系统管理员可查看用户列表" }, { status: 403 });
  }
  const users = await listUsers();
  return NextResponse.json({ users });
}

/** 新增：支持单个对象或数组 */
export async function POST(request: Request) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "仅系统管理员可新增用户" }, { status: 403 });
  }
  const body = await request.json();
  const input: UserRow[] = Array.isArray(body) ? body : [body];
  const { list, added, conflict } = await createUsers(input);
  if (added === 0) {
    return NextResponse.json(
      { error: conflict ? `用户名「${conflict}」已存在` : "未新增任何用户" },
      { status: 409 }
    );
  }
  return NextResponse.json({ users: list, added, conflict });
}

/** 编辑（含重置密码、启用停用） */
export async function PUT(request: Request) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "仅系统管理员可修改用户" }, { status: 403 });
  }
  const body = await request.json();
  const input = Array.isArray(body) ? body : [body];
  let protectedAdmin = false;
  let notFound = false;
  let list: UserRow[] = [];
  for (const item of input) {
    const r = await updateUser(item);
    list = r.list;
    if (r.notFound) notFound = true;
    if (r.protectedAdmin) protectedAdmin = true;
  }
  if (notFound) return NextResponse.json({ error: "未找到要修改的用户" }, { status: 404 });
  if (protectedAdmin) {
    return NextResponse.json({ error: "系统管理员账号不能停用" }, { status: 400 });
  }
  return NextResponse.json({ users: list });
}

/** 删除：body 传 { userIds: string[] } */
export async function DELETE(request: Request) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "仅系统管理员可删除用户" }, { status: 403 });
  }
  const body = await request.json();
  const ids: string[] = Array.isArray(body?.userIds) ? body.userIds.map(String) : [String(body?.userId ?? "")];
  const { list, deleted, protectedAdmin } = await deleteUsers(ids);
  if (protectedAdmin) {
    return NextResponse.json({ error: "系统管理员账号不能删除" }, { status: 400 });
  }
  if (deleted === 0) return NextResponse.json({ error: "未删除任何用户" }, { status: 404 });
  return NextResponse.json({ users: list, deleted });
}
