"use client";

import { useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  PlayCircle,
  PauseCircle,
  Upload,
  Download,
  FileDown,
  Search,
  RotateCw,
  Pencil,
} from "lucide-react";
import type { ColumnDef, ListSchema, Row } from "@/lib/listSchema";

function fmtMoney(v: string | number) {
  const n = typeof v === "number" ? v : Number(v) || 0;
  return "¥" + n.toLocaleString("zh-CN", { maximumFractionDigits: 2 });
}

function statusClass(v: string) {
  if (v === "启用" || v === "已完成") return "on";
  if (v === "待审核") return "warn";
  return "off";
}

function Cell({ col, row }: { col: ColumnDef; row: Row }) {
  const v = row[col.key];
  if (col.kind === "status") {
    return (
      <td className="lp-td lp-td-center">
        <span className={`lp-status ${statusClass(String(v))}`}>{v}</span>
      </td>
    );
  }
  if (col.kind === "money") {
    return <td className="lp-td lp-td-right">{fmtMoney(v)}</td>;
  }
  if (col.kind === "code") {
    return <td className="lp-td"><span className="lp-code">{v}</span></td>;
  }
  return (
    <td className={`lp-td ${col.align === "right" ? "lp-td-right" : col.align === "center" ? "lp-td-center" : ""}`}>
      {v}
    </td>
  );
}

export default function ListPage({
  moduleLabel,
  pageLabel,
  schema,
  siblings,
}: {
  moduleLabel: string;
  pageLabel: string;
  schema: ListSchema;
  siblings: string[];
}) {
  const { columns, filters, rows, hasStatusAction } = schema;
  const [values, setValues] = useState<Record<string, string>>({});
  const [applied, setApplied] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<number[]>([]);

  const filtered = useMemo(() => {
    return rows.filter((r) =>
      Object.entries(applied).every(([k, v]) => {
        if (!v) return true;
        const cell = String(r[k] ?? "");
        return cell.includes(v);
      })
    );
  }, [rows, applied]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, totalPages);
  const pageRows = filtered.slice((current - 1) * pageSize, current * pageSize);
  const allChecked = pageRows.length > 0 && pageRows.every((_, i) => selected.includes((current - 1) * pageSize + i));

  const toggleAll = () => {
    const start = (current - 1) * pageSize;
    const idx = pageRows.map((_, i) => start + i);
    setSelected((prev) =>
      idx.every((i) => prev.includes(i)) ? prev.filter((i) => !idx.includes(i)) : [...new Set([...prev, ...idx])]
    );
  };

  const toggleOne = (idx: number) =>
    setSelected((prev) => (prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]));

  const doSearch = () => {
    setApplied(values);
    setPage(1);
    setSelected([]);
  };

  const doReset = () => {
    setValues({});
    setApplied({});
    setPage(1);
    setSelected([]);
  };

  return (
    <div className="lp-page">
      {/* 页签：对应原系统上方打开的功能标签 */}
      <div className="lp-tabs">
        <span className="lp-tab active">{pageLabel}</span>
        {siblings
          .filter((s) => s !== pageLabel)
          .slice(0, 3)
          .map((s) => (
            <span className="lp-tab" key={s}>
              {s}
            </span>
          ))}
        <span className="lp-tabs-hint">
          {moduleLabel} · {columns.length} 列
        </span>
      </div>

      {/* 工具栏 */}
      <div className="lp-toolbar">
        <button className="lp-btn lp-btn-primary">
          <Plus size={13} /> 新增
        </button>
        <button className="lp-btn" disabled={selected.length === 0}>
          <Trash2 size={13} /> 删除
        </button>
        {hasStatusAction && (
          <>
            <button className="lp-btn" disabled={selected.length === 0}>
              <PlayCircle size={13} /> 启用
            </button>
            <button className="lp-btn" disabled={selected.length === 0}>
              <PauseCircle size={13} /> 停用
            </button>
          </>
        )}
        <span className="lp-tool-divider" />
        <button className="lp-btn lp-btn-text">
          <FileDown size={13} /> 导入模板
        </button>
        <button className="lp-btn lp-btn-text">
          <Upload size={13} /> 导入
        </button>
        <button className="lp-btn lp-btn-text">
          <Download size={13} /> 导出
        </button>
        <span className="lp-selected">已选 {selected.length} 条</span>
      </div>

      {/* 筛选 */}
      <div className="lp-filters">
        {filters.map((f) => (
          <label className="lp-field" key={f.key}>
            <span className="lp-field-label">{f.label}</span>
            {f.kind === "select" ? (
              <select
                className="lp-control"
                value={values[f.key] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
              >
                <option value="">请选择</option>
                {f.options?.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            ) : (
              <input
                className="lp-control"
                placeholder="请输入"
                value={values[f.key] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && doSearch()}
              />
            )}
          </label>
        ))}
        <div className="lp-filter-actions">
          <button className="lp-btn lp-btn-primary" onClick={doSearch}>
            <Search size={13} /> 查询
          </button>
          <button className="lp-btn" onClick={doReset}>
            <RotateCw size={13} /> 重置
          </button>
        </div>
      </div>

      {/* 表格 */}
      <div className="lp-table-wrap">
        <table className="lp-table">
          <thead>
            <tr>
              <th className="lp-th lp-th-check">
                <input type="checkbox" className="lp-check" checked={allChecked} onChange={toggleAll} />
              </th>
              <th className="lp-th lp-th-idx">序号</th>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={`lp-th ${c.align === "right" ? "lp-td-right" : c.align === "center" ? "lp-td-center" : ""}`}
                  style={c.width ? { width: c.width } : undefined}
                >
                  {c.label}
                </th>
              ))}
              <th className="lp-th lp-td-center" style={{ width: 110 }}>
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, i) => {
              const idx = (current - 1) * pageSize + i;
              return (
                <tr key={idx} className={selected.includes(idx) ? "lp-tr-on" : ""}>
                  <td className="lp-td lp-td-check">
                    <input
                      type="checkbox"
                      className="lp-check"
                      checked={selected.includes(idx)}
                      onChange={() => toggleOne(idx)}
                    />
                  </td>
                  <td className="lp-td lp-td-idx">{idx + 1}</td>
                  {columns.map((c) => (
                    <Cell key={c.key} col={c} row={row} />
                  ))}
                  <td className="lp-td lp-td-center">
                    <button className="lp-link">
                      <Pencil size={12} /> 编辑
                    </button>
                    <button className="lp-link lp-link-danger">删除</button>
                  </td>
                </tr>
              );
            })}
            {pageRows.length === 0 && (
              <tr>
                <td className="lp-empty" colSpan={columns.length + 3}>
                  没有符合条件的数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      <div className="lp-pager">
        <span className="lp-pager-info">
          共 {filtered.length} 条 · 第 {current} 页 / 共 {totalPages} 页
        </span>
        <div className="lp-pager-btns">
          <button className="lp-page-btn" onClick={() => setPage(1)} disabled={current === 1}>
            首页
          </button>
          <button className="lp-page-btn" onClick={() => setPage(current - 1)} disabled={current === 1}>
            上一页
          </button>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              className={`lp-page-btn ${current === i + 1 ? "active" : ""}`}
              onClick={() => setPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
          <button className="lp-page-btn" onClick={() => setPage(current + 1)} disabled={current === totalPages}>
            下一页
          </button>
          <button className="lp-page-btn" onClick={() => setPage(totalPages)} disabled={current === totalPages}>
            末页
          </button>
          <select
            className="lp-control lp-page-size"
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
      </div>

      <div className="lp-note">
        演示数据 · 该页列结构与交互已按原系统还原，接入 {moduleLabel} 真实数据源后即可展示业务数据。
      </div>
    </div>
  );
}
