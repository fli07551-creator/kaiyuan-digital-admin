"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  Pencil,
  Ban,
  PlayCircle,
  Download,
  Upload,
  Search,
  RotateCw,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  KeyRound,
  Trash2,
  X,
} from "lucide-react";
import {
  ADMIN_USER_ID,
  type UserRow,
} from "@/lib/users";
import {
  seedUserRows,
  readLocalUsersForMigration,
  clearLocalUsers,
} from "@/lib/auth";
import { useAuth } from "@/components/AuthProvider";

const ROLE_OPTIONS = [
  "超级管理员",
  "电商管理员",
  "采购主管",
  "库管员",
  "库管员(销售)",
  "销售经理",
  "生产主管",
  "财务主管",
];

function now() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function newUserId() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `UID${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${String(Math.floor(Math.random() * 9000) + 1000)}`;
}

const emptyForm = (): UserRow => ({
  userId: "",
  username: "",
  name: "",
  phone: "",
  role: "库管员",
  remark: "--",
  status: "启用",
  lockCount: "--",
  creator: "",
  createdAt: "",
  password: "",
});

/** 构建时注入的存储模式标记（database / file） */
const isPgMode = process.env.NEXT_PUBLIC_USER_STORE === "database";

/** 服务端接口封装：自动带管理员身份头 */
async function api<T>(
  url: string,
  method: string,
  body: unknown,
  adminId: string
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "x-kaiyuan-user": adminId,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: data?.error || `请求失败（${res.status}）` };
    }
    return { ok: true, data: data as T };
  } catch {
    return { ok: false, error: "网络异常，请稍后重试" };
  }
}

export default function UsersPage() {
  const { user } = useAuth();
  const adminId = user?.userId || "";
  const [rows, setRows] = useState<UserRow[]>(seedUserRows);
  const [hydrated, setHydrated] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [applied, setApplied] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editing, setEditing] = useState<{ mode: "create" | "edit"; data: UserRow } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pwdReset, setPwdReset] = useState<{ user: UserRow; value: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const say = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2600);
  };

  // 读取服务端用户表（全设备共享）；并把旧版本地账号一次性迁移到服务端
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const localCustom = readLocalUsersForMigration();
      if (localCustom.length > 0) {
        const r = await fetch("/api/users/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ users: localCustom }),
        })
          .then((res) => res.json())
          .catch(() => null);
        if (!cancelled && r?.users && Array.isArray(r.users)) {
          setRows(r.users as UserRow[]);
          clearLocalUsers();
          if (r.merged > 0) say(`已将 ${r.merged} 个本地账号同步到服务器，其他设备现在可以登录`);
        }
        return;
      }
      const res = await fetch("/api/users", { headers: { "x-kaiyuan-user": adminId } });
      if (cancelled) return;
      if (res.ok) {
        const data = await res.json().catch(() => null);
        if (data?.users && Array.isArray(data.users)) setRows(data.users as UserRow[]);
      } else {
        say("读取用户列表失败，请确认以系统管理员身份登录");
      }
    })();
    setHydrated(true);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminId]);

  const isProtectedAdmin = (row: UserRow) => row.userId === ADMIN_USER_ID;

  const filtered = useMemo(() => {
    const q = applied.trim().toLowerCase();
    return rows.filter((u) => {
      if (statusFilter && u.status !== statusFilter) return false;
      if (!q) return true;
      return [u.userId, u.username, u.name, u.phone, u.role].some((v) =>
        (v || "").toLowerCase().includes(q)
      );
    });
  }, [rows, applied, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, totalPages);
  const paged = filtered.slice((current - 1) * pageSize, current * pageSize);
  const allChecked = paged.length > 0 && paged.every((u) => selected.includes(u.userId));

  const toggleAll = () => {
    if (allChecked) {
      setSelected((s) => s.filter((id) => !paged.some((u) => u.userId === id)));
    } else {
      setSelected((s) => Array.from(new Set([...s, ...paged.map((u) => u.userId)])));
    }
  };

  const toggleOne = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const doSearch = () => {
    setApplied(keyword);
    setPage(1);
    setSelected([]);
  };

  const doReset = () => {
    setKeyword("");
    setApplied("");
    setStatusFilter("");
    setPage(1);
    setSelected([]);
  };

  /* ---------- 新增 / 编辑 ---------- */
  const openCreate = () => setEditing({ mode: "create", data: emptyForm() });

  const openEdit = (row: UserRow) => setEditing({ mode: "edit", data: { ...row } });

  const openBatchEdit = () => {
    if (selected.length !== 1) {
      say("请先勾选 1 个用户再编辑");
      return;
    }
    const row = rows.find((r) => r.userId === selected[0]);
    if (row) openEdit(row);
  };

  const saveForm = async () => {
    if (!editing || busy) return;
    const d = editing.data;
    if (!d.username.trim()) {
      say("用户名为必填项");
      return;
    }
    if (d.userId === ADMIN_USER_ID && d.status === "停用") {
      say("系统管理员账号不能停用");
      return;
    }
    setBusy(true);
    if (editing.mode === "create") {
      const payload: UserRow = {
        ...d,
        userId: newUserId(),
        createdAt: now(),
        creator: user?.name || "管理员",
        remark: d.remark.trim() || "--",
        phone: d.phone.trim() || "--",
        password: d.password?.trim() || "123456",
      };
      const r = await api<{ users: UserRow[] }>("/api/users", "POST", payload, adminId);
      setBusy(false);
      if (!r.ok) {
        say(r.error);
        return;
      }
      setRows(r.data.users);
      say(`已新增用户「${d.username}」，初始密码 ${d.password?.trim() || "123456"}，其他设备可直接登录`);
    } else {
      const payload: UserRow = {
        ...d,
        password: d.password?.trim() || undefined,
      };
      const r = await api<{ users: UserRow[] }>("/api/users", "PUT", payload, adminId);
      setBusy(false);
      if (!r.ok) {
        say(r.error);
        return;
      }
      setRows(r.data.users);
      say(`已保存「${d.username}」的修改`);
    }
    setEditing(null);
  };

  /* ---------- 停用 / 启用 ---------- */
  const setStatus = async (status: "启用" | "停用") => {
    if (selected.length === 0) {
      say("请先勾选要操作的用户");
      return;
    }
    if (status === "停用" && rows.some((r) => selected.includes(r.userId) && isProtectedAdmin(r))) {
      say("系统管理员账号不能停用");
      return;
    }
    setBusy(true);
    const updates = rows
      .filter((r) => selected.includes(r.userId) && r.status !== status)
      .map((r) => ({ ...r, status }));
    const r = await api<{ users: UserRow[] }>("/api/users", "PUT", updates, adminId);
    setBusy(false);
    if (!r.ok) {
      say(r.error);
      return;
    }
    setRows(r.data.users);
    say(`已将 ${selected.length} 个用户设为「${status}」`);
    setSelected([]);
  };

  /* ---------- 删除 ---------- */
  const removeRow = async (row: UserRow) => {
    if (isProtectedAdmin(row)) {
      say("系统管理员账号不能删除");
      return;
    }
    if (!window.confirm(`确认删除用户「${row.username}」？删除后该账号将无法登录。`)) return;
    setBusy(true);
    const r = await api<{ users: UserRow[] }>("/api/users", "DELETE", { userIds: [row.userId] }, adminId);
    setBusy(false);
    if (!r.ok) {
      say(r.error);
      return;
    }
    setRows(r.data.users);
    setSelected((s) => s.filter((id) => id !== row.userId));
    say(`已删除「${row.username}」`);
  };

  /* ---------- 重置密码 ---------- */
  const resetPassword = (row: UserRow) => {
    setPwdReset({ user: row, value: "" });
  };

  const confirmPwdReset = async () => {
    if (!pwdReset || busy) return;
    const v = pwdReset.value.trim();
    if (v.length < 6) {
      say("密码至少 6 位");
      return;
    }
    setBusy(true);
    const r = await api<{ users: UserRow[] }>(
      "/api/users",
      "PUT",
      { ...pwdReset.user, password: v, lockCount: "0", remark: "密码已重置" },
      adminId
    );
    setBusy(false);
    if (!r.ok) {
      say(r.error);
      return;
    }
    setRows(r.data.users);
    say(`「${pwdReset.user.username}」的登录密码已更新`);
    setPwdReset(null);
  };

  /* ---------- 导出 CSV ---------- */
  const exportCsv = () => {
    const target = selected.length
      ? rows.filter((r) => selected.includes(r.userId))
      : filtered;
    const header = ["用户编号", "用户名", "姓名", "手机号", "角色", "备注", "状态", "登录锁定次数", "创建人", "创建时间"];
    const body = target.map((r) =>
      [r.userId, r.username, r.name, r.phone, r.role, r.remark, r.status, r.lockCount, r.creator, r.createdAt]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = "\uFEFF" + [header.join(","), ...body].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `用户管理_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    say(`已导出 ${target.length} 条用户数据`);
  };

  /* ---------- 导入 CSV（写入服务端） ---------- */
  const importCsv = (file: File) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const text = String(reader.result || "").replace(/^\uFEFF/, "");
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      if (lines.length <= 1) {
        say("文件为空或只有表头");
        return;
      }
      const next: UserRow[] = [];
      lines.slice(1).forEach((line) => {
        const cols = line.split(",").map((c) => c.replace(/^"|"$/g, "").trim());
        if (!cols[1]) return;
        next.push({
          userId: cols[0] || newUserId(),
          username: cols[1],
          name: cols[2] || cols[1],
          phone: cols[3] || "--",
          role: cols[4] || "库管员",
          remark: cols[5] || "--",
          status: cols[6] === "停用" ? "停用" : "启用",
          lockCount: cols[7] || "--",
          creator: cols[8] || user?.name || "导入",
          createdAt: cols[9] || now(),
          password: "123456",
        });
      });
      if (next.length === 0) {
        say("未解析到有效数据行");
        return;
      }
      setBusy(true);
      const r = await api<{ users: UserRow[]; added: number; conflict: string | null }>(
        "/api/users",
        "POST",
        next,
        adminId
      );
      setBusy(false);
      if (!r.ok) {
        say(r.error);
        return;
      }
      setRows(r.data.users);
      const skipped = next.length - r.data.added;
      say(`已导入 ${r.data.added} 个用户${skipped > 0 ? `，${skipped} 个因用户名重复跳过` : ""}`);
    };
    reader.readAsText(file, "utf-8");
  };

  return (
    <div className="page-card">
      <div className="toolbar">
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={14} /> 新增
        </button>
        <button className="btn" onClick={openBatchEdit}>
          <Pencil size={14} /> 编辑
        </button>
        <button className="btn" onClick={() => setStatus("停用")} disabled={selected.length === 0 || busy}>
          <Ban size={14} /> 停用
        </button>
        <button className="btn" onClick={() => setStatus("启用")} disabled={selected.length === 0 || busy}>
          <PlayCircle size={14} /> 启用
        </button>
        <button className="btn" onClick={exportCsv}>
          <Download size={14} /> 导出
        </button>
        <button className="btn" onClick={() => fileRef.current?.click()} disabled={busy}>
          <Upload size={14} /> 导入
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          style={{ display: "none" }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) importCsv(f);
            e.target.value = "";
          }}
        />
        {selected.length > 0 && (
          <span className="sel-tip">已选 {selected.length} 条</span>
        )}
      </div>

      <div className="filter-row">
        <input
          className="search-input"
          placeholder="用户编号 / 用户名 / 手机号 / 姓名"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && doSearch()}
        />
        <select
          className="search-input"
          style={{ width: 110 }}
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">全部状态</option>
          <option value="启用">启用</option>
          <option value="停用">停用</option>
        </select>
        <button className="btn btn-primary" onClick={doSearch}>
          <Search size={14} /> 查询
        </button>
        <button className="btn" onClick={doReset}>
          <RotateCw size={14} /> 重置
        </button>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 36 }}>
                <input type="checkbox" className="checkbox" checked={allChecked} onChange={toggleAll} />
              </th>
              <th style={{ width: 76 }}>操作</th>
              <th>用户编号</th>
              <th>用户名</th>
              <th>姓名</th>
              <th>手机号</th>
              <th>角色</th>
              <th>备注</th>
              <th>状态</th>
              <th>登录锁定次数</th>
              <th>创建人</th>
              <th>
                创建时间 <ChevronsUpDown size={12} style={{ verticalAlign: "middle" }} />
              </th>
            </tr>
          </thead>
          <tbody>
            {paged.map((u) => (
              <tr key={u.userId}>
                <td>
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked={selected.includes(u.userId)}
                    onChange={() => toggleOne(u.userId)}
                  />
                </td>
                <td className="col-actions">
                  <button className="row-icon" title="编辑" onClick={() => openEdit(u)}>
                    <Pencil size={14} />
                  </button>
                  <button className="row-icon" title="重置密码" onClick={() => resetPassword(u)}>
                    <KeyRound size={14} />
                  </button>
                  <button
                    className="row-icon danger"
                    title={isProtectedAdmin(u) ? "系统管理员账号不能删除" : "删除"}
                    disabled={isProtectedAdmin(u)}
                    onClick={() => removeRow(u)}
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
                <td>{u.userId}</td>
                <td>{u.username}</td>
                <td>{u.name}</td>
                <td>{u.phone}</td>
                <td className={u.isSuperAdmin ? "super-admin" : ""}>{u.role}</td>
                <td>{u.remark}</td>
                <td>
                  <span className={`status-tag ${u.status === "停用" ? "off" : ""}`}>{u.status}</span>
                </td>
                <td>{u.lockCount}</td>
                <td>{u.creator}</td>
                <td>{u.createdAt}</td>
              </tr>
            ))}
            {paged.length === 0 && (
              <tr>
                <td colSpan={12} style={{ textAlign: "center", color: "#909399", height: 80 }}>
                  {hydrated ? "暂无数据" : "正在加载…"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="lp-note">
        账号保存在服务器端，所有设备共享：管理员新增的账号可直接被他人登录。
        {isPgMode ? " 当前已接入数据库，账号长期保存。" : " 当前为文件存储，服务重新部署后会重置为初始管理员；配置 DATABASE_URL 即可切换为数据库长期保存。"}
      </div>

      <div className="pagination">
        <span className="selection-info">
          共 {filtered.length} 条 · 第 {current} / {totalPages} 页
        </span>
        <button className="page-btn" disabled={current <= 1} onClick={() => setPage(current - 1)}>
          <ChevronLeft size={14} />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            className={`page-btn ${n === current ? "active" : ""}`}
            onClick={() => setPage(n)}
          >
            {n}
          </button>
        ))}
        <button
          className="page-btn"
          disabled={current >= totalPages}
          onClick={() => setPage(current + 1)}
        >
          <ChevronRight size={14} />
        </button>
        <select
          className="page-btn"
          style={{ width: 84 }}
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
            setPage(1);
          }}
        >
          <option value={10}>10 条/页</option>
          <option value={20}>20 条/页</option>
          <option value={50}>50 条/页</option>
        </select>
      </div>

      {/* 新增 / 编辑弹窗 */}
      {editing && (
        <div className="modal-mask" onClick={() => setEditing(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <span>{editing.mode === "create" ? "新增用户" : `编辑用户 · ${editing.data.username}`}</span>
              <button className="modal-close" onClick={() => setEditing(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              <label className="field-row">
                <span className="field-label">
                  用户名 <b className="req">*</b>
                </span>
                <input
                  className="field-input"
                  value={editing.data.username}
                  onChange={(e) =>
                    setEditing({ ...editing, data: { ...editing.data, username: e.target.value } })
                  }
                  placeholder="登录账号"
                />
              </label>
              <label className="field-row">
                <span className="field-label">姓名</span>
                <input
                  className="field-input"
                  value={editing.data.name}
                  onChange={(e) =>
                    setEditing({ ...editing, data: { ...editing.data, name: e.target.value } })
                  }
                  placeholder="真实姓名"
                />
              </label>
              <label className="field-row">
                <span className="field-label">手机号</span>
                <input
                  className="field-input"
                  value={editing.data.phone}
                  onChange={(e) =>
                    setEditing({ ...editing, data: { ...editing.data, phone: e.target.value } })
                  }
                  placeholder="选填"
                />
              </label>
              <label className="field-row">
                <span className="field-label">角色</span>
                <select
                  className="field-input"
                  value={editing.data.role}
                  onChange={(e) =>
                    setEditing({ ...editing, data: { ...editing.data, role: e.target.value } })
                  }
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field-row">
                <span className="field-label">登录密码</span>
                <input
                  className="field-input"
                  value={editing.data.password ?? ""}
                  onChange={(e) =>
                    setEditing({ ...editing, data: { ...editing.data, password: e.target.value } })
                  }
                  placeholder={
                    editing.mode === "create" ? "默认 123456，可自定义" : "留空则不修改"
                  }
                />
              </label>
              <label className="field-row">
                <span className="field-label">状态</span>
                <select
                  className="field-input"
                  value={editing.data.status}
                  disabled={editing.data.userId === ADMIN_USER_ID}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      data: { ...editing.data, status: e.target.value as "启用" | "停用" },
                    })
                  }
                >
                  <option value="启用">启用</option>
                  <option value="停用">停用</option>
                </select>
              </label>
              <label className="field-row">
                <span className="field-label">备注</span>
                <input
                  className="field-input"
                  value={editing.data.remark}
                  onChange={(e) =>
                    setEditing({ ...editing, data: { ...editing.data, remark: e.target.value } })
                  }
                  placeholder="选填"
                />
              </label>
            </div>
            <div className="modal-foot">
              <button className="btn" onClick={() => setEditing(null)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={saveForm} disabled={busy}>
                {busy ? "保存中…" : "保存"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 重置密码弹窗 */}
      {pwdReset && (
        <div className="modal-mask" onClick={() => setPwdReset(null)}>
          <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <span>重置密码 · {pwdReset.user.username}</span>
              <button className="modal-close" onClick={() => setPwdReset(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              <label className="field-row">
                <span className="field-label">新密码</span>
                <input
                  className="field-input"
                  autoFocus
                  value={pwdReset.value}
                  placeholder="至少 6 位"
                  onChange={(e) => setPwdReset({ ...pwdReset, value: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && confirmPwdReset()}
                />
              </label>
              <p className="modal-hint">
                设置后该用户即可用新密码登录，原密码立即失效。
              </p>
            </div>
            <div className="modal-foot">
              <button className="btn" onClick={() => setPwdReset(null)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={confirmPwdReset} disabled={busy}>
                {busy ? "重置中…" : "确认重置"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
