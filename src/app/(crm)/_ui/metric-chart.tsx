"use client";

import { useState } from "react";
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
  const horizontal = type === "horizontal";
  const config: ChartConfig = Object.fromEntries(series.map(s => [s.key, { label: s.label, color: s.color }]));
  const labelById = new Map(data.map(p => [p.id, p.label]));
  const visible = isolated ? series.filter(s => s.key === isolated) : series;
  const formatValue = (value: number) => money ? formatUsd(value) : formatNumber(value);
  const pieData = isolated ? data.filter(p => p.id === isolated) : data;
  const legend = type === "donut" ? data.map((p, i) => ({ key: p.id, label: p.label, color: `var(--chart-${i % 6 + 1})` })) : series;
  return <div>
    <ChartContainer className="analytics-chart" config={config} role="group" aria-label={summary}>
      {type === "donut" ? <PieChart accessibilityLayer>
        <ChartTooltip content={<ChartTooltipContent nameKey="label" hideLabel formatter={(value, name) => <span>{name}: {formatValue(Number(value))}</span>} />} />
        <Pie data={pieData} dataKey={series[0]?.key} nameKey="label" innerRadius="55%" outerRadius="85%" isAnimationActive={false}>
          {pieData.map(p => <Cell key={p.id} fill={legend.find(s => s.key === p.id)?.color} stroke="var(--card)" strokeWidth={2} />)}
        </Pie>
      </PieChart> : <ComposedChart data={data} layout={horizontal ? "vertical" : "horizontal"} accessibilityLayer margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="var(--border)" vertical={horizontal} horizontal={!horizontal} />
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
  </div>;
}
