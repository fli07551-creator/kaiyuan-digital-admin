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
import { userRows as seedRows, type UserRow } from "@/lib/users";
import { loadUsers as loadUsersSafe } from "@/lib/auth";

const STORAGE_KEY = "kaiyuan-users-v1";

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
  creator: "李飞",
  createdAt: "",
  password: "",
});

export default function UsersPage() {
  const [rows, setRows] = useState<UserRow[]>(seedRows);
  const [hydrated, setHydrated] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [applied, setApplied] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editing, setEditing] = useState<{ mode: "create" | "edit"; data: UserRow } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [pwdReset, setPwdReset] = useState<{ user: UserRow; value: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // 读取本地数据（统一走自愈逻辑，保证演示账号始终存在）
  useEffect(() => {
    setRows(loadUsersSafe());
    setHydrated(true);
  }, []);

  // 持久化
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
    } catch {
      /* 忽略写入失败 */
    }
  }, [rows, hydrated]);

  const say = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  };

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

  const saveForm = () => {
    if (!editing) return;
    const d = editing.data;
    if (!d.username.trim()) {
      say("用户名为必填项");
      return;
    }
    if (editing.mode === "create") {
      setRows((prev) => [
        {
          ...d,
          userId: newUserId(),
          createdAt: now(),
          creator: "李飞",
          remark: d.remark.trim() || "--",
          phone: d.phone.trim() || "--",
          password: d.password?.trim() || "123456",
        },
        ...prev,
      ]);
      say(`已新增用户「${d.username}」，初始密码 ${d.password?.trim() || "123456"}`);
    } else {
      setRows((prev) =>
        prev.map((r) =>
          r.userId === d.userId
            ? { ...d, password: d.password?.trim() || r.password || "123456" }
            : r
        )
      );
      say(`已保存「${d.username}」的修改`);
    }
    setEditing(null);
  };

  /* ---------- 停用 / 启用 ---------- */
  const setStatus = (status: "启用" | "停用") => {
    if (selected.length === 0) {
      say("请先勾选要操作的用户");
      return;
    }
    setRows((prev) =>
      prev.map((r) => (selected.includes(r.userId) ? { ...r, status } : r))
    );
    say(`已将 ${selected.length} 个用户设为「${status}」`);
    setSelected([]);
  };

  /* ---------- 删除 ---------- */
  const removeRow = (row: UserRow) => {
    if (!window.confirm(`确认删除用户「${row.username}」？删除后不可恢复。`)) return;
    setRows((prev) => prev.filter((r) => r.userId !== row.userId));
    setSelected((s) => s.filter((id) => id !== row.userId));
    say(`已删除「${row.username}」`);
  };

  /* ---------- 重置密码 ---------- */
  const resetPassword = (row: UserRow) => {
    setPwdReset({ user: row, value: "" });
  };

  const confirmPwdReset = () => {
    if (!pwdReset) return;
    const v = pwdReset.value.trim();
    if (v.length < 6) {
      say("密码至少 6 位");
      return;
    }
    setRows((prev) =>
      prev.map((r) =>
        r.userId === pwdReset.user.userId
          ? { ...r, password: v, lockCount: "0", remark: "密码已重置" }
          : r
      )
    );
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

  /* ---------- 导入 CSV ---------- */
  const importCsv = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
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
          creator: cols[8] || "导入",
          createdAt: cols[9] || now(),
        });
      });
      if (next.length === 0) {
        say("未解析到有效数据行");
        return;
      }
      setRows((prev) => [...next, ...prev]);
      say(`已导入 ${next.length} 条用户数据`);
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
        <button className="btn" onClick={() => setStatus("停用")} disabled={selected.length === 0}>
          <Ban size={14} /> 停用
        </button>
        <button className="btn" onClick={() => setStatus("启用")} disabled={selected.length === 0}>
          <PlayCircle size={14} /> 启用
        </button>
        <button className="btn" onClick={exportCsv}>
          <Download size={14} /> 导出
        </button>
        <button className="btn" onClick={() => fileRef.current?.click()}>
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
                  <button className="row-icon danger" title="删除" onClick={() => removeRow(u)}>
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
                  暂无数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
              <button className="btn btn-primary" onClick={saveForm}>
                保存
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
              <button className="btn btn-primary" onClick={confirmPwdReset}>
                确认重置
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
