"use client";

import { useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  Ban,
  Download,
  Upload,
  Search,
  RotateCw,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  KeyRound,
  Trash2,
} from "lucide-react";
import { userRows } from "@/lib/users";

export default function UsersPage() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return userRows;
    return userRows.filter((u) =>
      [u.userId, u.username, u.name, u.phone].some((v) =>
        (v || "").toLowerCase().includes(q)
      )
    );
  }, [query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const allChecked = paged.length > 0 && paged.every((u) => selected.includes(u.userId));

  const toggleAll = () => {
    if (allChecked) {
      setSelected((s) => s.filter((id) => !paged.some((u) => u.userId === id)));
    } else {
      setSelected((s) => Array.from(new Set([...s, ...paged.map((u) => u.userId)])));
    }
  };

  const toggleOne = (id: string) => {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  return (
    <div className="page-card">
      <div className="toolbar">
        <button className="btn btn-primary">
          <Plus size={14} /> 新增
        </button>
        <button className="btn">
          <Pencil size={14} /> 编辑
        </button>
        <button className="btn">
          <Ban size={14} /> 停用
        </button>
        <button className="btn">
          <Download size={14} /> 导出
        </button>
        <button className="btn">
          <Upload size={14} /> 导入
        </button>
      </div>

      <div className="filter-row">
        <input
          className="search-input"
          placeholder="用户编号 / 用户名 / 手机号 / 姓名"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
        />
        <button className="btn btn-primary" onClick={() => setPage(1)}>
          <Search size={14} /> 查询
        </button>
        <button
          className="btn"
          onClick={() => {
            setQuery("");
            setPage(1);
          }}
        >
          <RotateCw size={14} /> 重置
        </button>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 36 }}>
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={allChecked}
                  onChange={toggleAll}
                />
              </th>
              <th style={{ width: 44 }}>操作</th>
              <th>用户编号</th>
              <th>用户名</th>
              <th>姓名</th>
              <th>手机号</th>
              <th>角色</th>
              <th>备注</th>
              <th>状态</th>
              <th>登录锁定次数</th>
              <th>创建人</th>
              <th>创建时间 <ChevronsUpDown size={12} style={{ verticalAlign: "middle" }} /></th>
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
                  <span className="row-icon" title="编辑">
                    <Pencil size={14} />
                  </span>
                  <span className="row-icon" title="重置密码">
                    <KeyRound size={14} />
                  </span>
                  <span className="row-icon danger" title="删除">
                    <Trash2 size={14} />
                  </span>
                </td>
                <td>{u.userId}</td>
                <td>{u.username}</td>
                <td>{u.name}</td>
                <td>{u.phone}</td>
                <td className={u.isSuperAdmin ? "super-admin" : ""}>{u.role}</td>
                <td>{u.remark}</td>
                <td className="status-tag">{u.status}</td>
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
        <span className="selection-info">共 {filtered.length} 条</span>
        <button
          className="page-btn"
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          <ChevronLeft size={14} />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            className={`page-btn ${n === page ? "active" : ""}`}
            onClick={() => setPage(n)}
          >
            {n}
          </button>
        ))}
        <button
          className="page-btn"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
