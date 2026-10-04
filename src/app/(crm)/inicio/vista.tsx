"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import type { DashboardMetrics } from "@/application/dashboard/puertos";
import { ChartCard } from "@/components/ui/chart-card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { analyticsCopy, inicioTabs } from "../_ui/analitica-copy";
import { AnalyticsTabs } from "../_ui/analytics-tabs";
import { AnalyticsDetails } from "../_ui/analytics-details";
import { metricState, useOnline } from "../_ui/analytics-state";
import { formatActivity, formatNumber } from "@/lib/formato-analitica";

const MetricChart = dynamic(() => import("../_ui/metric-chart"), { loading: () => <div className="analytics-skeleton" role="status">{analyticsCopy.common.loading}</div>, ssr: false });
export type InicioPermissions = { leads: boolean; deals: boolean; activities: boolean; projects: boolean; goals: boolean; academy: boolean; createLead: boolean };

export function InicioVista({ roleSlug, metricas, nombre, permissions }: { roleSlug: string; metricas: DashboardMetrics; nombre: string; permissions: InicioPermissions }) {
  const online = useOnline();
  const c = analyticsCopy.inicio;
  const common = analyticsCopy.common;
  const isBroker = roleSlug === "broker";
  const isAssistant = roleSlug === "assistant";
  const funnel = metricas.funnel.map(p => ({ id: String(p.stageId), label: p.label, reached: p.reachedCount, current: p.count, pass: p.passRatePercent }));
  const funnelSeries = [{ key: "reached", label: c.reached, color: "var(--chart-2)" }];
  const funnelDetails = [...funnelSeries, { key: "current", label: c.currentCount, color: "var(--chart-3)" }, { key: "pass", label: `${c.pass} (%)`, color: "var(--chart-4)" }];
  const kpis = isAssistant ? [
    { key: "unassigned", label: c.unassigned, value: formatNumber(metricas.leadsSinAsignarCount), context: common.scope, allowed: permissions.leads },
    { key: "today", label: c.today, value: formatNumber(metricas.citasHoyCount), context: metricas.fechaTexto, allowed: permissions.activities },
    { key: "tasks", label: c.pending, value: formatNumber(metricas.tareasPendientesCount), context: common.scope, allowed: permissions.activities },
    { key: "review", label: c.review, value: metricas.avancesPorRevisarCount === null ? common.noData : formatNumber(metricas.avancesPorRevisarCount), context: c.reviewMissing, allowed: permissions.projects },
  ] : [
    { key: "leads", label: isBroker ? c.myLeads : c.monthLeads, value: formatNumber(isBroker ? metricas.misLeadsCount : metricas.leadsMesCount), context: isBroker ? c.portfolio : c.month, allowed: permissions.leads },
    { key: "active", label: c.active, value: formatNumber(metricas.negociosActivosCount), context: c.current, allowed: permissions.deals },
    { key: "pipeline", label: c.pipeline, value: metricas.volumenPipelineDisplay, context: c.current, allowed: permissions.deals },
    { key: "won", label: c.monthWon, value: formatNumber(metricas.cierresMesCount), context: c.month, allowed: permissions.deals },
    { key: "conversion", label: c.conversion, value: metricas.conversionPorcentaje, context: c.conversionContext, allowed: permissions.deals && permissions.leads },
  ];
  return <div className="analytics-page analytics-inicio">
    <header className="analytics-page-header"><div><p className="analytics-eyebrow">{c.title}</p><h1>{c.greeting}{nombre.trim() ? `, ${nombre.trim()}` : ""}</h1><p>{c.subtitle}</p></div>
      {permissions.createLead && <Link className="analytics-button analytics-primary" href="/leads">{c.createLead}</Link>}
    </header>
    <p className="analytics-context">{metricas.fechaTexto} · {common.scope}</p>
    {!online && <p className="analytics-offline" role="status">{common.offline}</p>}
    <div className="analytics-kpis" aria-label={c.summary}>{kpis.filter(k => k.allowed).map(k => <article key={k.key} data-kind={k.key} className="analytics-kpi"><h2>{k.label}</h2><strong>{k.value}</strong><p>{k.context}</p><small>{common.previousMissing}</small></article>)}</div>
    <Tabs defaultValue="resumen" className="analytics-main-tabs">
      <AnalyticsTabs tabs={inicioTabs} label={c.tabs} />
      <TabsContent value="resumen" className="analytics-inicio-panel">
        <div className="analytics-dashboard-grid">
          <ChartCard title={c.attention} subtitle={c.attentionContext} state={metricState(permissions.leads, metricas.leadsRecientes.length > 0, online)} emptyMessage={c.noLeads} emptyAction={permissions.leads && <Link className="analytics-button" href="/leads">{c.viewLeads}</Link>} action={permissions.leads && <Link className="analytics-button" href="/leads">{c.viewLeads}</Link>}>
            <ul className="analytics-record-list">{metricas.leadsRecientes.map(lead => <li key={lead.id}><Link href={`/leads?lead=${lead.id}`}><strong>{lead.name}</strong><span>{lead.project} · {lead.source}</span><span className="analytics-badge">{lead.stage}</span><small>{lead.next}</small></Link></li>)}</ul>
          </ChartCard>
          <ChartCard title={isBroker ? c.goal : c.demand} subtitle={isBroker ? c.goalContext : c.demandContext} state={metricState(isBroker ? permissions.goals : permissions.projects, isBroker ? metricas.metaMesLabel !== "Sin meta" : metricas.projects.length > 0, online)}>
            {isBroker ? <div className="analytics-goal"><strong>{metricas.metaMesLabel}</strong><progress max={100} value={metricas.metaPorcentaje} aria-label={c.goal} /><p>{formatNumber(metricas.metaPorcentaje)}%</p><p>{metricas.miNivel}</p>{permissions.academy && <p>{metricas.academy ? `${metricas.academy.title} · ${formatNumber(metricas.academy.progressPercent)}% ${c.complete}` : c.academyEmpty}</p>}</div> : <ul className="analytics-record-list">{metricas.projects.map(p => <li key={p.id}><Link href="/propiedades"><strong>{p.name}</strong><span>{formatNumber(p.leads)} {common.leads}</span></Link></li>)}</ul>}
          </ChartCard>
        </div>
      </TabsContent>
      <TabsContent value="embudo" className="analytics-inicio-panel">
        <ChartCard title={c.funnel} subtitle={c.funnelContext} state={metricState(permissions.leads, funnel.some(p => p.reached > 0), online)} summary={funnel.map(p => `${p.label}: ${p.reached}; ${c.pass}: ${p.pass ?? common.noBase}`).join(". ")} emptyAction={permissions.leads && <Link className="analytics-button" href="/leads">{c.viewLeads}</Link>}>
          <MetricChart data={funnel} series={funnelSeries} type="horizontal" summary={c.funnelContext} /><AnalyticsDetails data={funnel} series={funnelDetails} />
        </ChartCard>
      </TabsContent>
      <TabsContent value="agenda" className="analytics-inicio-panel">
        <ChartCard title={c.activities} subtitle={c.activitiesContext} state={metricState(permissions.activities, metricas.activities.length > 0, online)} emptyMessage={c.noActivities} emptyAction={permissions.activities && <Link className="analytics-button" href="/agenda">{c.viewAgenda}</Link>} action={permissions.activities && <Link className="analytics-button" href="/agenda">{c.viewAgenda}</Link>}>
          <ul className="analytics-record-list">{metricas.activities.map(a => <li key={a.id}><Link href="/agenda"><time dateTime={a.startsAt}>{formatActivity(a.startsAt)}</time><strong>{a.title}</strong><span>{a.location ?? common.noLocation}</span></Link></li>)}</ul>
        </ChartCard>
      </TabsContent>
    </Tabs>
  </div>;
}
