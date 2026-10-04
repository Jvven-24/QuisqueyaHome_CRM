"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { generarCsv } from "@/domain/csv";
import type { ReportesBiData } from "@/application/reportes/puertos";
import { ChartCard } from "@/components/ui/chart-card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { analyticsCopy, inventoryLabels, reportTabs } from "../_ui/analitica-copy";
import { AnalyticsTabs } from "../_ui/analytics-tabs";
import { AnalyticsDetails } from "../_ui/analytics-details";
import { metricState, useOnline } from "../_ui/analytics-state";
import type { MetricPoint, MetricSeries } from "../_ui/metric-chart";
import { formatNumber, formatUsd } from "@/lib/formato-analitica";
import { ReportFiltersView, type FilterOption } from "./filtros-vista";

const MetricChart = dynamic(() => import("../_ui/metric-chart"), { loading: () => <div className="analytics-skeleton" role="status">{analyticsCopy.common.loading}</div>, ssr: false });
type GraphProps = { title: string; subtitle: string; data: MetricPoint[]; series: MetricSeries[]; type?: "bar" | "horizontal" | "area" | "line" | "donut"; money?: boolean; stacked?: boolean; online: boolean; note?: string; range?: React.ReactNode };

function ReportGraph({ title, subtitle, data, series, type, money, stacked, online, note, range }: GraphProps) {
  const summary = data.map(p => `${p.label}: ${series.map(s => `${s.label} ${typeof p[s.key] === "number" ? money ? formatUsd(p[s.key] as number) : formatNumber(p[s.key] as number) : analyticsCopy.common.noData}`).join(", ")}`).join(". ");
  return <ChartCard title={title} subtitle={subtitle} summary={summary} range={range} state={metricState(true, data.some(p => series.some(s => typeof p[s.key] === "number" && p[s.key] !== 0)), online)} emptyAction={<a className="analytics-button" href="/reportes">{analyticsCopy.common.clear}</a>}>
    <MetricChart data={data} series={series} type={type} money={money} stacked={stacked} summary={summary} />
    {note && <p className="analytics-context">{note}</p>}
    <AnalyticsDetails data={data} series={series} money={money} />
  </ChartCard>;
}

export function ReportesVista({ metricas, canExport, periodo, projects = [], initialTab = "embudo" }: { metricas: ReportesBiData; canExport: boolean; periodo: string; projects?: FilterOption[]; initialTab?: string }) {
  const online = useOnline();
  const [tab, setTab] = useState(initialTab);
  const [exportMessage, setExportMessage] = useState("");
  const c = analyticsCopy.reportes;
  const common = analyticsCopy.common;
  const range = <a href="#report-filters" className="analytics-button">{common.filters}</a>;
  const single = (key: string, label: string, color = "var(--chart-2)"): MetricSeries[] => [{ key, label, color }];
  const funnel = metricas.funnel.map(p => ({ id: String(p.stageId), label: p.label, reached: p.reachedCount, current: p.count, pass: p.passRatePercent }));
  const channels = metricas.sources.map(p => ({ id: p.sourceId === null ? "unattributed" : String(p.sourceId), label: p.source, count: p.count }));
  const trend = metricas.trend.map(p => ({ ...p, id: p.month, label: p.month }));
  const zones = metricas.zones.map(p => ({ id: p.zoneId === null ? "unattributed" : String(p.zoneId), label: p.label, count: p.count }));
  const brokers = metricas.brokers.map(p => ({ id: p.brokerId === null ? "unassigned" : String(p.brokerId), label: p.name, amount: p.volumeCents }));
  const inventory: MetricPoint[] = metricas.inventory.length ? [{ id: "visible-inventory", label: c.inventory, ...Object.fromEntries(metricas.inventory.map((p, i) => [`inventory${i}`, p.count])) }] : [];
  const inventorySeries: MetricSeries[] = metricas.inventory.map((p, i) => ({ key: `inventory${i}`, label: Object.hasOwn(inventoryLabels, p.state) ? inventoryLabels[p.state]! : common.noData, color: `var(--chart-${i % 5 + 2})` }));
  const commissions = metricas.commissions.map(p => ({ id: p.month ?? "undated", label: p.month ?? common.noDate, brokerCents: p.brokerCents, agencyCents: p.agencyCents, paidCents: p.paidCents }));
  const forecast = metricas.projection.points.map(p => ({ id: p.month ?? "undated", label: p.month ?? common.noDate, amount: p.amountCents }));
  const eventSeries: MetricSeries[] = [
    { key: "leads", label: common.leads, color: "var(--chart-2)" }, { key: "deals", label: common.deals, color: "var(--chart-3)" }, { key: "won", label: common.won, color: "var(--chart-4)" },
  ];
  const commissionSeries: MetricSeries[] = [
    { key: "brokerCents", label: c.brokerShare, color: "var(--chart-1)" }, { key: "agencyCents", label: c.agency, color: "var(--chart-2)" }, { key: "paidCents", label: c.paid, color: "var(--chart-4)" },
  ];
  const exportarCsv = () => {
    if (!canExport) return;
    let url: string | undefined;
    try {
      const content = generarCsv([c.funnel, analyticsCopy.inicio.currentCount, analyticsCopy.inicio.reached, `${analyticsCopy.inicio.pass} (%)`], metricas.funnel.map(f => [f.label, f.count, f.reachedCount, f.passRatePercent ?? common.noBase]));
      url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
      const link = document.createElement("a");
      link.href = url; link.download = `reporte_bi_${metricas.asOf.slice(0, 10)}.csv`;
      document.body.appendChild(link); link.click(); link.remove();
      setExportMessage(common.exportDone);
    } catch { setExportMessage(common.exportError); }
    finally { if (url) URL.revokeObjectURL(url); }
  };
  return <div className="analytics-page analytics-reportes">
    <header className="analytics-page-header"><div><h1>{c.title}</h1><p>{c.subtitle}</p></div><div><button className="analytics-button" type="button" disabled={!canExport} onClick={exportarCsv}>{common.export}</button>{!canExport && <p className="analytics-context">{common.exportDenied}</p>}</div></header>
    <p className="analytics-context">{common.received}: <time dateTime={metricas.asOf}>{new Intl.DateTimeFormat("es-DO", { timeZone: "America/Santo_Domingo", dateStyle: "medium", timeStyle: "short" }).format(new Date(metricas.asOf))}</time> · {common.scope}</p>
    <div role="status" aria-live="polite">{exportMessage}</div>
    {!online && <p className="analytics-offline" role="status">{common.offline}</p>}
    <section id="report-filters" aria-label={common.filters}><ReportFiltersView filters={metricas.filters} periodo={periodo} tab={tab} projects={projects} brokers={metricas.brokers.flatMap(b => b.brokerId === null ? [] : [{ id: b.brokerId, label: b.name }])} online={online} /></section>
    <Tabs value={tab} onValueChange={setTab} className="analytics-main-tabs">
      <AnalyticsTabs tabs={reportTabs} label={c.tabs} />
      <TabsContent value="embudo">
        <ReportGraph title={c.funnel} subtitle={c.funnelContext} data={funnel} series={single("reached", analyticsCopy.inicio.reached)} type="horizontal" online={online} range={range} />
        <dl className="analytics-value-list">{metricas.funnel.map(p => <div key={p.stageId}><dt>{p.label}</dt><dd><span>{analyticsCopy.inicio.currentCount}: {formatNumber(p.count)}</span><span>{analyticsCopy.inicio.pass}: {p.passRatePercent === null ? common.noBase : `${formatNumber(p.passRatePercent)}%`}</span></dd></div>)}</dl>
        <details className="analytics-details"><summary>{c.losses}</summary><dl className="analytics-value-list">{metricas.lossReasons.map(p => <div key={p.reasonId ?? "unattributed"}><dt>{p.label}</dt><dd>{formatNumber(p.count)}</dd></div>)}</dl>{!metricas.lossReasons.length && <p>{common.empty}</p>}</details>
      </TabsContent>
      <TabsContent value="canales">
        <ReportGraph title={c.channels} subtitle={c.channelsContext} data={channels} series={single("count", common.leads)} type="donut" online={online} range={range} />
        <div className="analytics-desktop-table"><table><caption>{c.channelsContext}</caption><thead><tr><th>{c.channels}</th><th>{common.leads}</th><th>{c.revenue}</th><th>{c.spend}</th><th>{c.roi}</th></tr></thead><tbody>{metricas.sources.map(p => <tr key={p.sourceId ?? "unattributed"}><th scope="row">{p.source}</th><td>{formatNumber(p.count)}</td><td>{formatUsd(p.revenueCents)}</td><td>{p.spendCents === null ? common.noData : formatUsd(p.spendCents)}</td><td>{p.roiPercent === null ? c.roiMissing : `${formatNumber(p.roiPercent)}%`}</td></tr>)}</tbody></table></div>
        <dl className="analytics-mobile-values analytics-value-list">{metricas.sources.map(p => <div key={p.sourceId ?? "unattributed"}><dt>{p.source}</dt><dd><span>{common.leads}: {formatNumber(p.count)}</span><span>{c.revenue}: {formatUsd(p.revenueCents)}</span><span>{c.spend}: {p.spendCents === null ? common.noData : formatUsd(p.spendCents)}</span><span>{c.roi}: {p.roiPercent === null ? c.roiMissing : `${formatNumber(p.roiPercent)}%`}</span></dd></div>)}</dl>
      </TabsContent>
      <TabsContent value="tendencia"><ReportGraph title={c.trend} subtitle={c.trendContext} data={trend} series={eventSeries} type="area" stacked online={online} range={range} note={c.trendOverlap} /></TabsContent>
      <TabsContent value="zonas"><ReportGraph title={c.zones} subtitle={c.zonesContext} data={zones} series={single("count", common.leads)} online={online} range={range} /></TabsContent>
      <TabsContent value="brokers"><ReportGraph title={c.brokers} subtitle={c.brokersContext} data={brokers} series={single("amount", common.amount, "var(--chart-1)")} type="horizontal" money online={online} range={range} /><dl className="analytics-value-list">{metricas.brokers.map(p => <div key={p.brokerId ?? "unassigned"}><dt>{p.name}</dt><dd><span>{common.won}: {formatNumber(p.won)}</span><span>{analyticsCopy.inicio.conversion}: {p.conversionPercent === null ? common.noBase : `${formatNumber(p.conversionPercent)}%`}</span></dd></div>)}</dl></TabsContent>
      <TabsContent value="velocidad"><ChartCard title={c.velocity} subtitle={c.velocityContext} state={metricState(true, metricas.velocity.sampleSize > 0, online)}><dl className="analytics-value-list"><div><dt>{c.median}</dt><dd>{metricas.velocity.medianDays === null ? common.noData : `${formatNumber(metricas.velocity.medianDays)} ${common.days}`}</dd></div><div><dt>{c.p75}</dt><dd>{metricas.velocity.p75Days === null ? common.noData : `${formatNumber(metricas.velocity.p75Days)} ${common.days}`}</dd></div><div><dt>{c.samples}</dt><dd>{formatNumber(metricas.velocity.sampleSize)}</dd></div></dl><p className="analytics-context">{c.velocityMissing}</p></ChartCard></TabsContent>
      <TabsContent value="inventario"><ReportGraph title={c.inventory} subtitle={c.inventoryContext} data={inventory} series={inventorySeries} stacked online={online} range={range} /><dl className="analytics-value-list">{metricas.inventory.map(p => <div key={p.state}><dt>{inventoryLabels[p.state] ?? common.noData}</dt><dd><span>{c.median}: {p.medianAgeDays === null ? common.noData : `${formatNumber(p.medianAgeDays)} ${common.days}`}</span><span>{c.p75}: {p.p75AgeDays === null ? common.noData : `${formatNumber(p.p75AgeDays)} ${common.days}`}</span></dd></div>)}</dl></TabsContent>
      <TabsContent value="comisiones"><ReportGraph title={c.commissions} subtitle={c.commissionsContext} data={commissions} series={commissionSeries} money online={online} range={range} /></TabsContent>
      <TabsContent value="pronostico"><ReportGraph title={c.forecast} subtitle={c.forecastContext} data={forecast} series={single("amount", c.weighted, "var(--chart-1)")} type="line" money online={online} range={range} note={c.forecastMissing} /><dl className="analytics-value-list"><div><dt>{c.weighted}</dt><dd>{formatUsd(metricas.projection.totalWeightedCents)}</dd></div><div><dt>{c.probability}</dt><dd>{metricas.projection.confidenceEstimated === null ? common.noBase : `${formatNumber(metricas.projection.confidenceEstimated)}%`}</dd></div><div><dt>{c.missingProbability}</dt><dd>{formatNumber(metricas.projection.missingProbabilityCount)}</dd></div><div><dt>{c.missingAmount}</dt><dd>{formatNumber(metricas.projection.missingAmountCount)}</dd></div></dl></TabsContent>
    </Tabs>
  </div>;
}
