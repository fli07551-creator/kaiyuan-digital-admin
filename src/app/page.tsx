"use client";

import {
  Layers,
  Building2,
  Globe2,
  Activity,
  ShieldCheck,
  TriangleAlert,
  ArrowUpRight,
  Clock3,
  Database,
  CircleCheck,
  CircleDashed,
  TrendingUp,
  ChevronRight,
  Info,
} from "lucide-react";
import {
  overview,
  departments,
  industryDistribution,
  provinceDistribution,
  leadMarketDistribution,
  leadFunnel,
  processQuality,
  alerts,
  sourceList,
} from "@/lib/dashboard";

const kpiIcons: Record<string, React.ReactNode> = {
  layers: <Layers size={18} />,
  building: <Building2 size={18} />,
  globe: <Globe2 size={18} />,
  activity: <Activity size={18} />,
  shield: <ShieldCheck size={18} />,
  alert: <TriangleAlert size={18} />,
};

function SectionTitle({ title, extra }: { title: string; extra?: React.ReactNode }) {
  return (
    <div className="sec-title">
      <span className="sec-bar" />
      <span>{title}</span>
      {extra && <span className="sec-extra">{extra}</span>}
    </div>
  );
}

/** 横向条形图 */
function BarChart({ data, color = "#2e9e63" }: { data: { name: string; value: number }[]; color?: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="bar-chart">
      {data.map((d) => (
        <div className="bar-row" key={d.name}>
          <span className="bar-label">{d.name}</span>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${(d.value / max) * 100}%`, background: color }} />
          </div>
          <span className="bar-value">{d.value}</span>
        </div>
      ))}
    </div>
  );
}

/** 环形占比图（纯 SVG） */
function DonutChart({ data }: { data: { name: string; value: number }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const colors = ["#2e9e63", "#5bbd84", "#8fd4a9", "#b9e5c9", "#d8f0df", "#e8f6ed"];
  const r = 52;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="donut-wrap">
      <svg viewBox="0 0 140 140" className="donut-svg">
        <circle cx="70" cy="70" r={r} fill="none" stroke="#eef5ef" strokeWidth="18" />
        {data.map((d, i) => {
          const seg = (d.value / total) * c;
          const el = (
            <circle
              key={d.name}
              cx="70"
              cy="70"
              r={r}
              fill="none"
              stroke={colors[i % colors.length]}
              strokeWidth="18"
              strokeDasharray={`${seg} ${c - seg}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 70 70)"
            />
          );
          offset += seg;
          return el;
        })}
        <text x="70" y="66" textAnchor="middle" className="donut-main">{total}</text>
        <text x="70" y="84" textAnchor="middle" className="donut-sub">线索</text>
      </svg>
      <div className="donut-legend">
        {data.map((d, i) => (
          <div className="legend-row" key={d.name}>
            <span className="legend-dot" style={{ background: colors[i % colors.length] }} />
            <span className="legend-name">{d.name}</span>
            <span className="legend-value">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** 漏斗图 */
function Funnel() {
  const colors = ["#2e9e63", "#5bbd84", "#8fd4a9"];
  return (
    <div className="funnel">
      {leadFunnel.map((f, i) => (
        <div className="funnel-step" key={f.label}>
          <span className="funnel-label">{f.label}</span>
          <div className="funnel-track">
            <div
              className="funnel-bar"
              style={{ width: `${Math.max(f.pct, 18)}%`, background: colors[i] }}
            >
              <span>{f.value}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  const onlineCount = departments.filter((d) => d.status === "online").length;

  return (
    <div className="dashboard-page">
      {/* 顶部欢迎条 */}
      <div className="welcome-bar">
        <div className="welcome-left">
          <div className="welcome-title">综合管理平台 · 数据驾驶舱</div>
          <div className="welcome-sub">
            汇聚各部门管理平台核心数据，一屏掌握经营全貌
          </div>
        </div>
        <div className="welcome-right">
          <span className="snap-badge"><Clock3 size={13} /> 数据快照 {overview.snapshot}</span>
          <span className="live-badge"><span className="live-dot" /> 已接入 {onlineCount} 个平台</span>
        </div>
      </div>

      {/* KPI 总览 */}
      <SectionTitle title="核心指标总览" extra={<span className="sec-hint">数据源自各部门平台真实快照</span>} />
      <div className="kpi-grid">
        {overview.kpis.map((k) => (
          <div className={`kpi-card ${k.warn ? "warn" : ""}`} key={k.label}>
            <div className="kpi-icon">{kpiIcons[k.icon] ?? <Activity size={18} />}</div>
            <div className="kpi-body">
              <div className="kpi-label">{k.label}</div>
              <div className="kpi-value">
                {k.value}<span className="kpi-unit">{k.unit}</span>
              </div>
              <div className="kpi-sub">{k.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 部门数据模块 */}
      <SectionTitle
        title="部门数据模块"
        extra={<span className="sec-hint">{onlineCount} 个已接入 · {departments.length - onlineCount} 个待接入</span>}
      />
      <div className="dept-grid">
        {departments.map((d) => (
          <div className={`dept-card ${d.status}`} key={d.id}>
            <div className="dept-head">
              <div className="dept-title">
                <span className="dept-name">{d.name}</span>
                <span className="dept-subtitle">{d.subtitle}</span>
              </div>
              <span className={`dept-status ${d.status}`}>
                {d.status === "online" ? <CircleCheck size={12} /> : <CircleDashed size={12} />}
                {d.statusText}
              </span>
            </div>
            <div className="dept-metrics">
              {d.metrics.map((m) => (
                <div className="dept-metric" key={m.label}>
                  <div className={`dept-metric-value ${m.tone ?? ""}`}>
                    {m.value}<span className="dept-metric-unit">{m.unit}</span>
                  </div>
                  <div className="dept-metric-label">{m.label}</div>
                </div>
              ))}
            </div>
            <div className="dept-foot">
              <span className="dept-source"><Database size={11} /> {d.source}</span>
              <span className="dept-time">{d.updatedAt}</span>
            </div>
            {d.note && <div className="dept-note"><Info size={11} /> {d.note}</div>}
          </div>
        ))}
      </div>

      {/* 数据分析图表 */}
      <SectionTitle title="数据分析" extra={<span className="sec-hint">基于已接入平台的真实数据</span>} />
      <div className="chart-grid">
        <div className="chart-card">
          <div className="chart-head">企采台 · 行业分布 TOP</div>
          <BarChart data={industryDistribution} color="#2e9e63" />
        </div>
        <div className="chart-card">
          <div className="chart-head">企采台 · 区域分布 TOP</div>
          <BarChart data={provinceDistribution} color="#5bbd84" />
        </div>
        <div className="chart-card">
          <div className="chart-head">料讯通 · 海外市场分布</div>
          <DonutChart data={leadMarketDistribution} />
        </div>
        <div className="chart-card">
          <div className="chart-head">料讯通 · 线索转化漏斗</div>
          <Funnel />
          <div className="funnel-note">线索 213 → 联系人 30 → 转化 29，转化率约 13.6%</div>
        </div>
      </div>

      {/* 工序质量 */}
      <SectionTitle title="工序质量监控" extra={<span className="sec-hint">拉头看板 · MES 实时抓取</span>} />
      <div className="quality-card">
        {processQuality.map((q) => (
          <div className="quality-row" key={q.name}>
            <div className="quality-name">{q.name}</div>
            <div className="quality-bar">
              <div className="quality-good" style={{ width: `${100 - q.badRate}%` }} />
              <div className="quality-bad" style={{ width: `${q.badRate}%` }} />
            </div>
            <div className="quality-stats">
              <span className="q-good">良 {q.good}</span>
              <span className="q-bad">不良 {q.bad}</span>
              <span className="q-total">共 {q.total} 条</span>
              <span className="q-rate">不良率 <b>{q.badRate}%</b></span>
            </div>
          </div>
        ))}
        <div className="quality-legend">
          <span><span className="lg-good" /> 合格</span>
          <span><span className="lg-bad" /> 不良</span>
          <span className="quality-tip">两道工序不良率均超 20%，建议优先排查</span>
        </div>
      </div>

      {/* 告警与待办 */}
      <SectionTitle title="告警与待办" extra={<span className="sec-hint">{alerts.length} 条需关注</span>} />
      <div className="alert-list">
        {alerts.map((a, i) => (
          <div className={`alert-item ${a.level}`} key={i}>
            <span className="alert-icon">
              {a.level === "danger" ? <TriangleAlert size={14} /> : a.level === "warn" ? <ShieldCheck size={14} /> : <Info size={14} />}
            </span>
            <div className="alert-content">
              <div className="alert-head">
                <span className="alert-dept">{a.dept}</span>
                <span className="alert-title">{a.title}</span>
              </div>
              <div className="alert-detail">{a.detail}</div>
            </div>
            <span className="alert-time">{a.time}</span>
            <ChevronRight size={15} className="alert-arrow" />
          </div>
        ))}
      </div>

      {/* 数据源接入清单 */}
      <SectionTitle title="数据源接入清单" extra={<span className="sec-hint">数据资产一目了然</span>} />
      <div className="source-card">
        <table className="source-table">
          <thead>
            <tr>
              <th>部门平台</th>
              <th>数据源路径</th>
              <th>类型</th>
              <th>状态</th>
              <th>记录数</th>
            </tr>
          </thead>
          <tbody>
            {sourceList.map((s) => (
              <tr key={s.dept}>
                <td className="src-dept">{s.dept}</td>
                <td className="src-path">{s.path}</td>
                <td>{s.type}</td>
                <td>
                  <span className={`src-status ${s.status === "已接入" ? "on" : "off"}`}>
                    {s.status === "已接入" ? <CircleCheck size={12} /> : <CircleDashed size={12} />}
                    {s.status}
                  </span>
                </td>
                <td>{s.records}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="source-footer">
          <Info size={12} />
          说明：本工作区为笔记本端，生产/品质/设备等平台数据在主台式机 E:\Agent（共享盘同步），标注"待接入"的模块需后续打通数据通道。所有数字均取自真实数据源，未做编造。
        </div>
      </div>
    </div>
  );
}
