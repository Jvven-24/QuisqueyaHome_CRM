"use client";

import { useState } from "react";
import { ChartColumn, Table2 } from "lucide-react";
import { Area, Bar, CartesianGrid, Cell, ComposedChart, Line, Pie, PieChart, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { formatAxis, formatNumber, formatUsd } from "@/lib/formato-analitica";
import { analyticsCopy } from "./analitica-copy";

export type MetricPoint = { id: string; label: string; [key: string]: number | string | null };
export type MetricSeries = { key: string; label: string; color: string };
export type MetricChartProps = {
  data: MetricPoint[]; series: MetricSeries[]; type?: "bar" | "horizontal" | "area" | "line" | "donut";
  money?: boolean; stacked?: boolean; summary: string;
};

/** Presentación de datos: ids estables separados de los nombres visibles. */
export default function MetricChart({ data, series, type = "bar", money = false, stacked = false, summary }: MetricChartProps) {
  const [isolated, setIsolated] = useState<string | null>(null);
  const [view, setView] = useState<"chart" | "table">("chart");
  const horizontal = type === "horizontal";
  const config: ChartConfig = Object.fromEntries(series.map(s => [s.key, { label: s.label, color: s.color }]));
  const labelById = new Map(data.map(p => [p.id, p.label]));
  const visible = isolated ? series.filter(s => s.key === isolated) : series;
  const formatValue = (value: number) => money ? formatUsd(value) : formatNumber(value);
  const pieData = isolated ? data.filter(p => p.id === isolated) : data;
  const legend = type === "donut" ? data.map((p, i) => ({ key: p.id, label: p.label, color: `var(--chart-${i % 6 + 1})` })) : series;
  return <div className="min-w-0">
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <p className="max-w-prose text-[13px] leading-relaxed text-ink-muted">{summary}</p>
      <div role="group" aria-label="Presentación de los datos" className="inline-flex shrink-0 gap-1 rounded-lg border border-line bg-surface-alt p-1">
        <button type="button" aria-pressed={view === "chart"} onClick={() => setView("chart")} className={`inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-[13px] font-medium ${view === "chart" ? "bg-surface text-navy-900" : "text-ink-muted hover:text-ink"}`}><ChartColumn className="size-4" aria-hidden="true" />Gráfico</button>
        <button type="button" aria-pressed={view === "table"} onClick={() => setView("table")} className={`inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-[13px] font-medium ${view === "table" ? "bg-surface text-navy-900" : "text-ink-muted hover:text-ink"}`}><Table2 className="size-4" aria-hidden="true" />Datos</button>
      </div>
    </div>
    {view === "table" ? <div className="max-h-96 overflow-auto rounded-lg border border-line" role="region" aria-label="Tabla de datos del gráfico" tabIndex={0}>
      <table className="w-full min-w-0 text-left text-[13px]">
        <caption className="sr-only">{summary}</caption>
        <thead className="sticky top-0 bg-surface-alt"><tr><th scope="col" className="min-w-32 px-3 py-3 font-semibold">Categoría</th>{series.map(s => <th key={s.key} scope="col" className="px-3 py-3 text-right font-semibold">{s.label}</th>)}</tr></thead>
        <tbody>{data.map(point => <tr key={point.id} className="border-t border-line hover:bg-surface-alt"><th scope="row" className="static whitespace-normal bg-transparent px-3 py-3 font-medium normal-case tracking-normal text-ink">{point.label}</th>{series.map(s => {
          const value = point[s.key];
          return <td key={s.key} className="whitespace-nowrap px-3 py-3 text-right tabular-nums text-ink">{typeof value === "number" ? formatValue(value) : value ?? "Sin datos"}</td>;
        })}</tr>)}</tbody>
      </table>
      {data.length === 0 && <p className="p-4 text-sm text-ink-muted">No hay datos para los filtros seleccionados.</p>}
    </div> : <>
    <ChartContainer className="analytics-chart" style={horizontal ? { height: Math.max(240, data.length * 36 + 32) } : undefined} config={config} role="group" aria-label={summary}>
      {type === "donut" ? <PieChart accessibilityLayer>
        <ChartTooltip content={<ChartTooltipContent nameKey="label" hideLabel formatter={(value, name) => <span>{name}: {formatValue(Number(value))}</span>} />} />
        <Pie data={pieData} dataKey={series[0]?.key} nameKey="label" innerRadius="55%" outerRadius="85%" isAnimationActive={false}>
          {pieData.map(p => <Cell key={p.id} fill={legend.find(s => s.key === p.id)?.color} stroke="var(--card)" strokeWidth={2} />)}
        </Pie>
      </PieChart> : <ComposedChart data={data} layout={horizontal ? "vertical" : "horizontal"} accessibilityLayer margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="var(--border)" strokeDasharray="3 4" vertical={horizontal} horizontal={!horizontal} />
        <XAxis type={horizontal ? "number" : "category"} dataKey={horizontal ? undefined : "id"} tickFormatter={horizontal ? (v: number) => formatAxis(v, money) : (id: string) => labelById.get(id) ?? id} tickLine={false} axisLine={false} minTickGap={24} />
        <YAxis type={horizontal ? "category" : "number"} dataKey={horizontal ? "id" : undefined} tickFormatter={horizontal ? (id: string) => { const label = labelById.get(id) ?? id; return label.length > 16 ? label.slice(0, 15) + "…" : label; } : (v: number) => formatAxis(v, money)} width={horizontal ? 106 : 52} tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent labelFormatter={(_label, payload) => { const id = payload[0]?.payload?.id; return typeof id === "string" ? labelById.get(id) : null; }} formatter={(value, name) => <span>{config[String(name)]?.label ?? name}: {formatValue(Number(value))}</span>} />} />
        {visible.map(s => type === "area" ? <Area key={s.key} dataKey={s.key} name={s.key} type="monotone" stackId={stacked ? "total" : undefined} stroke={s.color} fill={s.color} fillOpacity={0.28} isAnimationActive={false} /> : type === "line" ? <Line key={s.key} dataKey={s.key} name={s.key} stroke={s.color} strokeWidth={3} dot={false} isAnimationActive={false} /> : <Bar key={s.key} dataKey={s.key} name={s.key} fill={s.color} stackId={stacked ? "total" : undefined} radius={2} isAnimationActive={false} />)}
      </ComposedChart>}
    </ChartContainer>
    <div className="analytics-legend" aria-label={analyticsCopy.common.values}>
      {legend.map(s => <button key={s.key} type="button" className="analytics-legend-button" aria-pressed={isolated === s.key} onClick={() => setIsolated(isolated === s.key ? null : s.key)}>
        <span aria-hidden="true" style={{ backgroundColor: s.color }} />{s.label}
      </button>)}
    </div>
    {isolated && <button type="button" className="mt-2 min-h-11 rounded-lg px-3 text-[13px] font-medium text-navy-900 hover:bg-surface-alt" onClick={() => setIsolated(null)}>Mostrar todas las series</button>}
    </>}
  </div>;
}
