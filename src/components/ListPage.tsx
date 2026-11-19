"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  X,
} from "lucide-react";
import type { ColumnDef, ListSchema, Row } from "@/lib/listSchema";

const ROW_ID = "__rid";

function fmtMoney(v: string | number) {
  const n = typeof v === "number" ? v : Number(v) || 0;
  return "¥" + n.toLocaleString("zh-CN", { maximumFractionDigits: 2 });
}

function statusClass(v: string) {
  if (v === "启用" || v === "已完成") return "on";
  if (v === "待审核") return "warn";
  return "off";
}

function csvCell(v: unknown) {
  return `"${String(v ?? "").replace(/"/g, '""')}"`;
}

/** 支持带引号和逗号的 CSV 解析 */
function parseCsv(text: string): string[][] {
  const out: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field.replace(/\r$/, ""));
      out.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  if (field.length || row.length) {
    row.push(field.replace(/\r$/, ""));
    out.push(row);
  }
  return out;
}

function rowId(row: Row) {
  return String(row[ROW_ID] ?? "");
}

function withIds(rows: Row[], storageKey: string): Row[] {
  return rows.map((r, i) => ({
    ...r,
    [ROW_ID]: r[ROW_ID] || `${storageKey}-${i}`,
  }));
}

function makeRowId(storageKey: string) {
  return `${storageKey}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeRow(row: Row, columns: ColumnDef[]): Row {
  const out: Row = {};
  for (const c of columns) {
    if (c.kind === "money" || c.kind === "num") {
      const raw = String(row[c.key] ?? "").replace(/[¥,\s]/g, "");
      const n = Number(raw);
      out[c.key] = raw !== "" && Number.isFinite(n) ? n : 0;
    } else {
      out[c.key] = String(row[c.key] ?? "").trim();
    }
  }
  return out;
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
  const { columns, filters, hasStatusAction } = schema;
  const storageKey = `kaiyuan-list-v2:${moduleLabel}/${pageLabel}`;
  const statusOptions = hasStatusAction ? ["启用", "停用"] : ["草稿", "待审核", "已完成"];
  const firstKey = columns[0]?.key ?? "";

  const [rows, setRows] = useState<Row[]>(schema.rows);
  const [hydrated, setHydrated] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [applied, setApplied] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<string[]>([]);
  const [editing, setEditing] = useState<{
    mode: "create" | "edit";
    data: Row;
    index?: number;
  } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  /** 先落盘再同步状态，并触发一次重新读取，确保界面与存储一致 */
  const commitRows = (next: Row[]) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      /* 忽略写入失败 */
    }
    setRows(next);
    setReloadToken((t) => t + 1);
  };

  // 读取该页已保存的数据；未保存过则使用内置结构数据
  useEffect(() => {
    let initial = schema.rows;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as Row[];
        if (Array.isArray(parsed) && parsed.length) initial = parsed;
      }
    } catch {
      /* 忽略损坏数据 */
    }
    setRows(withIds(initial, storageKey));
    setHydrated(true);
  }, [storageKey, reloadToken]); // eslint-disable-line react-hooks/exhaustive-deps

  // 编辑结果按页面持久化
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(rows));
    } catch {
      /* 忽略写入失败 */
    }
  }, [rows, hydrated, storageKey]);

  const say = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2400);
  };

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
  const allChecked =
    pageRows.length > 0 && pageRows.every((r) => selected.includes(rowId(r)));

  const toggleAll = () => {
    const ids = pageRows.map(rowId);
    setSelected((prev) =>
      ids.every((id) => prev.includes(id))
        ? prev.filter((id) => !ids.includes(id))
        : [...new Set([...prev, ...ids])]
    );
  };

  const toggleOne = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

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

  /* ------------- 新增 / 编辑 / 删除 ------------- */

  const emptyRow = (): Row => {
    const row: Row = {};
    for (const c of columns) {
      row[c.key] =
        c.kind === "status"
          ? statusOptions[0]
          : c.kind === "money" || c.kind === "num"
            ? 0
            : "";
    }
    return row;
  };

  const openCreate = () => setEditing({ mode: "create", data: emptyRow() });
  const openEdit = (row: Row) =>
    setEditing({
      mode: "edit",
      data: { ...row },
      index: rows.findIndex((r) => r === row),
    });

  const saveForm = () => {
    if (!editing) return;
    const clean = normalizeRow(editing.data, columns);
    if (!String(clean[firstKey] ?? "").trim()) {
      say(`请填写${columns[0]?.label ?? "主键字段"}`);
      return;
    }
    // 仅新增时校验重复；编辑已有记录时不再拦截，避免历史数据中存在同名字段导致无法保存
    if (editing.mode === "create") {
      const duplicate = rows.some(
        (r) =>
          String(r[firstKey] ?? "").trim() === String(clean[firstKey]).trim()
      );
      if (duplicate) {
        say(`${columns[0]?.label}不能重复`);
        return;
      }
    }

    if (editing.mode === "create") {
      commitRows([{ ...clean, [ROW_ID]: makeRowId(storageKey) }, ...rows]);
      say("新增成功");
    } else {
      const targetIndex =
        editing.index !== undefined && rows[editing.index]
          ? editing.index
          : rows.findIndex(
              (r) => rowId(r) && rowId(r) === rowId(editing.data)
            );
      if (targetIndex < 0) {
        say("未找到要修改的记录，请重新点击编辑");
        return;
      }
      const next = [...rows];
      const old = next[targetIndex];
      next[targetIndex] = {
        ...clean,
        [ROW_ID]: rowId(old) || rowId(editing.data) || makeRowId(storageKey),
      };
      commitRows(next);
      say("修改已保存");
    }
    setEditing(null);
  };

  const removeSelected = () => {
    if (!selected.length) return;
    if (!window.confirm(`确认删除选中的 ${selected.length} 条记录？`)) return;
    commitRows(rows.filter((r) => !selected.includes(rowId(r))));
    setSelected([]);
    say(`已删除 ${selected.length} 条记录`);
  };

  const removeRow = (row: Row) => {
    if (!window.confirm(`确认删除「${row[firstKey] ?? ""}」这条记录？`)) return;
    commitRows(rows.filter((r) => rowId(r) !== rowId(row)));
    setSelected((prev) => prev.filter((id) => id !== rowId(row)));
    say("记录已删除");
  };

  const setSelectedStatus = (status: string) => {
    if (!selected.length) return;
    commitRows(
      rows.map((r) => (selected.includes(rowId(r)) ? { ...r, 状态: status } : r))
    );
    say(`已将 ${selected.length} 条记录设为「${status}」`);
    setSelected([]);
  };

  /* ------------- 模板 / 导入 / 导出 ------------- */

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const downloadTemplate = () => {
    const header = columns.map((c) => csvCell(c.label)).join(",");
    const sample = columns
      .map((c) => {
        if (c.kind === "status") return csvCell(statusOptions[0]);
        if (c.kind === "money" || c.kind === "num") return csvCell(0);
        if (c.label.includes("日期") || c.label.includes("时间")) return csvCell("2026-11-19");
        return csvCell(`示例${c.label}`);
      })
      .join(",");
    downloadFile(
      "\uFEFF" + [header, sample].join("\r\n"),
      `${moduleLabel}-${pageLabel}-导入模板.csv`
    );
    say("导入模板已下载，请按模板填写后导入");
  };

  const exportCsv = () => {
    const target = selected.length
      ? rows.filter((r) => selected.includes(rowId(r)))
      : filtered;
    const header = columns.map((c) => csvCell(c.label)).join(",");
    const body = target
      .map((r) => columns.map((c) => csvCell(r[c.key])).join(","))
      .join("\r\n");
    downloadFile(
      "\uFEFF" + [header, body].join("\r\n"),
      `${moduleLabel}-${pageLabel}-${Date.now()}.csv`
    );
    say(`已导出 ${target.length} 条数据`);
  };

  const importCsv = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "").replace(/^\uFEFF/, "");
      const parsed = parseCsv(text).filter((line) => line.some((v) => v.trim()));
      if (parsed.length < 2) {
        say("文件为空或只有表头");
        return;
      }
      const header = parsed[0].map((h) => h.trim());
      const indexOf: Record<string, number> = {};
      for (const c of columns) {
        const hit = header.findIndex((h) => h === c.label || h === c.key);
        indexOf[c.key] = hit;
      }
      if (columns.every((c) => indexOf[c.key] < 0)) {
        say("表头不匹配，请先下载导入模板");
        return;
      }

      const incoming: Row[] = [];
      for (const line of parsed.slice(1)) {
        const raw: Row = {};
        for (const c of columns) {
          const idx = indexOf[c.key];
          raw[c.key] = idx >= 0 ? line[idx] ?? "" : "";
        }
        const clean = normalizeRow(raw, columns);
        if (!String(clean[firstKey] ?? "").trim()) continue;
        incoming.push(clean);
      }
      if (!incoming.length) {
        say("未解析到有效数据行");
        return;
      }

      const map = new Map<string, Row>();
      for (const r of rows) map.set(String(r[firstKey] ?? "").trim(), r);
      for (const r of incoming) {
        const key = String(r[firstKey] ?? "").trim();
        const old = map.get(key);
        map.set(key, { ...r, [ROW_ID]: old ? rowId(old) : makeRowId(storageKey) });
      }
      commitRows([...map.values()]);
      setSelected([]);
      say(`已导入 ${incoming.length} 条数据（相同${columns[0]?.label}自动覆盖）`);
    };
    reader.readAsText(file, "utf-8");
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
        <button className="lp-btn lp-btn-primary" onClick={openCreate}>
          <Plus size={13} /> 新增
        </button>
        <button className="lp-btn" disabled={selected.length === 0} onClick={removeSelected}>
          <Trash2 size={13} /> 删除
        </button>
        {hasStatusAction && (
          <>
            <button className="lp-btn" disabled={selected.length === 0} onClick={() => setSelectedStatus("启用")}>
              <PlayCircle size={13} /> 启用
            </button>
            <button className="lp-btn" disabled={selected.length === 0} onClick={() => setSelectedStatus("停用")}>
              <PauseCircle size={13} /> 停用
            </button>
          </>
        )}
        <span className="lp-tool-divider" />
        <button className="lp-btn lp-btn-text" onClick={downloadTemplate}>
          <FileDown size={13} /> 导入模板
        </button>
        <button
          className="lp-btn lp-btn-text"
          title="支持 CSV，请先下载导入模板"
          onClick={() => fileRef.current?.click()}
        >
          <Upload size={13} /> 导入
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
        <button className="lp-btn lp-btn-text" onClick={exportCsv}>
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
            {pageRows.map((row, i) => (
              <tr key={rowId(row)} className={selected.includes(rowId(row)) ? "lp-tr-on" : ""}>
                <td className="lp-td lp-td-check">
                  <input
                    type="checkbox"
                    className="lp-check"
                    checked={selected.includes(rowId(row))}
                    onChange={() => toggleOne(rowId(row))}
                  />
                </td>
                <td className="lp-td lp-td-idx">{(current - 1) * pageSize + i + 1}</td>
                {columns.map((c) => (
                  <Cell key={c.key} col={c} row={row} />
                ))}
                <td className="lp-td lp-td-center">
                  <button className="lp-link" onClick={() => openEdit(row)}>
                    <Pencil size={12} /> 编辑
                  </button>
                  <button className="lp-link lp-link-danger" onClick={() => removeRow(row)}>
                    删除
                  </button>
                </td>
              </tr>
            ))}
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
        数据保存在当前浏览器：支持新增、编辑、删除、启用停用、CSV 导入导出；导入前可先下载模板。
      </div>

      {/* 新增 / 编辑弹窗 */}
      {editing && (
        <div className="modal-mask" onClick={() => setEditing(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <span>
                {editing.mode === "create" ? "新增" : "编辑"} · {pageLabel}
              </span>
              <button className="modal-close" onClick={() => setEditing(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              {columns.map((c, i) => (
                <label className="field-row" key={c.key}>
                  <span className="field-label">
                    {c.label}
                    {i === 0 && <b className="req"> *</b>}
                  </span>
                  {c.kind === "status" ? (
                    <select
                      className="field-input"
                      value={String(editing.data[c.key] ?? "")}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          data: { ...editing.data, [c.key]: e.target.value },
                        })
                      }
                    >
                      {statusOptions.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      className="field-input"
                      autoFocus={i === 0}
                      type={c.kind === "money" || c.kind === "num" ? "number" : "text"}
                      value={editing.data[c.key] ?? ""}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          data: { ...editing.data, [c.key]: e.target.value },
                        })
                      }
                      placeholder={`请输入${c.label}`}
                    />
                  )}
                </label>
              ))}
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

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
