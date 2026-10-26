import { analyticsCopy } from "./analitica-copy";
import { formatNumber, formatUsd } from "@/lib/formato-analitica";
import type { MetricPoint, MetricSeries } from "./metric-chart";

/** Alternativa textual completa; lista de tarjetas sin tabla horizontal en móvil. */
export function AnalyticsDetails({ data, series, money = false }: { data: MetricPoint[]; series: MetricSeries[]; money?: boolean }) {
  return <details className="analytics-details"><summary>{analyticsCopy.common.values}</summary>
    <dl className="analytics-value-list">{data.map(row => <div key={row.id}>
      <dt>{row.label}</dt><dd>{series.map(s => <span key={s.key}><span>{s.label}</span><strong>{typeof row[s.key] === "number" ? (money ? formatUsd(row[s.key] as number) : formatNumber(row[s.key] as number)) : row[s.key] ?? analyticsCopy.common.noData}</strong></span>)}</dd>
    </div>)}</dl>
  </details>;
}
