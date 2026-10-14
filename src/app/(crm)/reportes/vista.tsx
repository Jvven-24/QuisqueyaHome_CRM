"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  Printer,
  FileSpreadsheet,
  TrendingDown,
  Building2,
} from "lucide-react";
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

const MetricChart = dynamic(() => import("../_ui/metric-chart"), {
  loading: () => <div className="analytics-skeleton" role="status">{analyticsCopy.common.loading}</div>,
  ssr: false,
});

type GraphProps = {
  title: string;
  subtitle: string;
  data: MetricPoint[];
  series: MetricSeries[];
  type?: "bar" | "horizontal" | "area" | "line" | "donut";
  money?: boolean;
  stacked?: boolean;
  online: boolean;
  note?: string;
  range?: React.ReactNode;
};

function ReportGraph({ title, subtitle, data, series, type, money, stacked, online, note, range }: GraphProps) {
  const summary = data
    .map(
      (p) =>
        `${p.label}: ${series
          .map(
            (s) =>
              `${s.label} ${
                typeof p[s.key] === "number"
                  ? money
                    ? formatUsd(p[s.key] as number)
                    : formatNumber(p[s.key] as number)
                  : analyticsCopy.common.noData
              }`,
          )
          .join(", ")}`,
    )
    .join(". ");

  return (
    <ChartCard
      title={title}
      subtitle={subtitle}
      summary={summary}
      range={range}
      state={metricState(true, data.some((p) => series.some((s) => typeof p[s.key] === "number" && p[s.key] !== 0)), online)}
      emptyAction={<a className="analytics-button" href="/reportes">{analyticsCopy.common.clear}</a>}
    >
      <MetricChart data={data} series={series} type={type} money={money} stacked={stacked} summary={summary} />
      {note && <p className="analytics-context" style={{ fontSize: "13px" }}>{note}</p>}
      <AnalyticsDetails data={data} series={series} money={money} />
    </ChartCard>
  );
}

export function ReportesVista({
  metricas,
  canExport,
  periodo,
  projects = [],
  initialTab = "embudo",
}: {
  metricas: ReportesBiData;
  canExport: boolean;
  periodo: string;
  projects?: (FilterOption & { count?: number })[];
  initialTab?: string;
}) {
  const online = useOnline();
  const [tab, setTab] = useState(initialTab);
  const [exportMessage, setExportMessage] = useState("");
  const c = analyticsCopy.reportes;
  const common = analyticsCopy.common;
  const range = <a href="#report-filters" className="analytics-button" style={{ minHeight: "44px", fontSize: "13px" }}>{common.filters}</a>;
  const single = (key: string, label: string, color = "var(--chart-2)"): MetricSeries[] => [{ key, label, color }];

  const funnel = metricas.funnel.map((p) => ({
    id: String(p.stageId),
    label: p.label,
    reached: p.reachedCount,
    current: p.count,
    pass: p.passRatePercent,
  }));
  const channels = metricas.sources.map((p) => ({
    id: p.sourceId === null ? "unattributed" : String(p.sourceId),
    label: p.source,
    count: p.count,
  }));
  const trend = metricas.trend.map((p) => ({ ...p, id: p.month, label: p.month }));
  const zones = metricas.zones.map((p) => ({
    id: p.zoneId === null ? "unattributed" : String(p.zoneId),
    label: p.label,
    count: p.count,
  }));
  const brokers = metricas.brokers.map((p) => ({
    id: p.brokerId === null ? "unassigned" : String(p.brokerId),
    label: p.name,
    amount: p.volumeCents,
  }));
  const inventory: MetricPoint[] = metricas.inventory.length
    ? [{ id: "visible-inventory", label: c.inventory, ...Object.fromEntries(metricas.inventory.map((p, i) => [`inventory${i}`, p.count])) }]
    : [];
  const inventorySeries: MetricSeries[] = metricas.inventory.map((p, i) => ({
    key: `inventory${i}`,
    label: Object.hasOwn(inventoryLabels, p.state) ? inventoryLabels[p.state]! : common.noData,
    color: `var(--chart-${(i % 5) + 2})`,
  }));
  const commissions = metricas.commissions.map((p) => ({
    id: p.month ?? "undated",
    label: p.month ?? common.noDate,
    brokerCents: p.brokerCents,
    agencyCents: p.agencyCents,
    paidCents: p.paidCents,
  }));
  const forecast = metricas.projection.points.map((p) => ({
    id: p.month ?? "undated",
    label: p.month ?? common.noDate,
    amount: p.amountCents,
  }));

  const eventSeries: MetricSeries[] = [
    { key: "leads", label: common.leads, color: "var(--chart-2)" },
    { key: "deals", label: common.deals, color: "var(--chart-3)" },
    { key: "won", label: common.won, color: "var(--chart-4)" },
  ];
  const commissionSeries: MetricSeries[] = [
    { key: "brokerCents", label: c.brokerShare, color: "var(--chart-1)" },
    { key: "agencyCents", label: c.agency, color: "var(--chart-2)" },
    { key: "paidCents", label: c.paid, color: "var(--chart-4)" },
  ];

  // Cálculo ordenado de proyectos más cotizados
  const rankingProyectos = useMemo(() => {
    return [...projects]
      .filter((p) => (p.count ?? 0) > 0 || p.label)
      .sort((a, b) => (b.count ?? 0) - (a.count ?? 0));
  }, [projects]);

  const totalDemandLeads = useMemo(() => {
    return rankingProyectos.reduce((acc, p) => acc + (p.count ?? 0), 0);
  }, [rankingProyectos]);

  // Cierres totales
  const totalCierres = useMemo(() => {
    return metricas.brokers.reduce((acc, b) => acc + b.won, 0);
  }, [metricas.brokers]);

  const exportarCsv = () => {
    if (!canExport) return;
    let url: string | undefined;
    try {
      const content = generarCsv(
        [c.funnel, analyticsCopy.inicio.currentCount, analyticsCopy.inicio.reached, `${analyticsCopy.inicio.pass} (%)`],
        metricas.funnel.map((f) => [f.label, f.count, f.reachedCount, f.passRatePercent ?? common.noBase]),
      );
      url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `reporte_ejecutivo_bi_${metricas.asOf.slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setExportMessage(common.exportDone);
    } catch {
      setExportMessage(common.exportError);
    } finally {
      if (url) URL.revokeObjectURL(url);
    }
  };

  const imprimirInforme = () => {
    window.print();
  };

  const fechaFormateada = new Intl.DateTimeFormat("es-DO", {
    timeZone: "America/Santo_Domingo",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(metricas.asOf));

  return (
    <div className="analytics-page analytics-reportes">
      {/* Estilos para impresión limpia de informe ejecutivo */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 14mm 12mm;
          }
          body {
            background: #ffffff !important;
            color: #0b1120 !important;
            font-size: 13px !important;
          }
          .app-sidebar,
          .app-header,
          .analytics-filter-bar,
          .analytics-mobile-filters,
          .analytics-tabs-list,
          .analytics-main-tabs [role="tablist"],
          .non-printable,
          button,
          a.analytics-button,
          details summary {
            display: none !important;
          }
          .printable-letterhead {
            display: block !important;
            margin-bottom: 24px;
            border-bottom: 2px solid #0b1120;
            padding-bottom: 12px;
          }
          .analytics-page {
            padding: 0 !important;
            margin: 0 !important;
          }
          .chart-card,
          .visual-funnel-card,
          .ranking-card {
            break-inside: avoid;
            page-break-inside: avoid;
            box-shadow: none !important;
            border: 1px solid #cbd5e1 !important;
            margin-bottom: 16px !important;
          }
          .executive-kpis-grid {
            display: grid !important;
            grid-template-columns: repeat(4, 1fr) !important;
            gap: 12px !important;
            margin-bottom: 20px !important;
          }
        }
        @media screen {
          .printable-letterhead {
            display: none;
          }
        }
      `}</style>

      {/* Membrete formal de impresión */}
      <header className="printable-letterhead">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 800, color: "#0B1120", letterSpacing: "-0.02em" }}>
              QUISQUEYA HOME REAL ESTATE
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#64748B", fontWeight: 600 }}>
              Informe Ejecutivo de Inteligencia Comercial & Conversión BI
            </p>
          </div>
          <div style={{ textAlign: "right", fontSize: "12px", color: "#475569" }}>
            <p style={{ margin: 0, fontWeight: 700, color: "#0B1120" }}>Santo Domingo, D.N.</p>
            <p style={{ margin: "2px 0 0" }}>Corte: {fechaFormateada}</p>
            <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#94A3B8" }}>Confidencial · Uso Interno</p>
          </div>
        </div>
      </header>

      {/* Cabecera Interactiva de Pantalla */}
      <header className="analytics-page-header">
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: 800, letterSpacing: "-0.03em" }}>{c.title}</h1>
          <p style={{ fontSize: "14px", color: "var(--muted)", margin: "4px 0 0" }}>{c.subtitle}</p>
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          <button
            className="analytics-button"
            type="button"
            onClick={imprimirInforme}
            style={{
              minHeight: "44px",
              padding: "10px 16px",
              fontSize: "13px",
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "var(--navy-950)",
              color: "#ffffff",
              borderRadius: "8px",
              cursor: "pointer",
            }}
            title="Imprimir informe ejecutivo o guardar en PDF"
          >
            <Printer size={16} />
            <span>Imprimir Informe Ejecutivo (PDF)</span>
          </button>

          <button
            className="analytics-button"
            type="button"
            disabled={!canExport}
            onClick={exportarCsv}
            style={{
              minHeight: "44px",
              padding: "10px 16px",
              fontSize: "13px",
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "var(--surface)",
              color: "var(--ink)",
              border: "1px solid var(--line)",
              borderRadius: "8px",
              cursor: canExport ? "pointer" : "not-allowed",
            }}
          >
            <FileSpreadsheet size={16} />
            <span>{common.export}</span>
          </button>
          {!canExport && <p className="analytics-context" style={{ fontSize: "13px" }}>{common.exportDenied}</p>}
        </div>
      </header>

      <p className="analytics-context" style={{ fontSize: "13px", marginTop: "4px" }}>
        {common.received}: <time dateTime={metricas.asOf}>{fechaFormateada}</time> · {common.scope}
      </p>

      {/* Tarjetas KPI de Resumen Ejecutivo */}
      <section
        className="executive-kpis-grid"
        aria-label="Indicadores clave"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "14px",
          marginTop: "16px",
          marginBottom: "16px",
        }}
      >
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: "12px",
            padding: "16px",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Total Leads Captados
          </span>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "var(--navy-950)", marginTop: "6px" }}>
            {formatNumber(metricas.totalLeads)}
          </div>
          <span style={{ fontSize: "13px", color: "var(--muted)" }}>Registros en el periodo</span>
        </div>

        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: "12px",
            padding: "16px",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Negocios Activos
          </span>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "var(--gold-700)", marginTop: "6px" }}>
            {formatNumber(metricas.totalDeals)}
          </div>
          <span style={{ fontSize: "13px", color: "var(--muted)" }}>En negociación comercial</span>
        </div>

        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: "12px",
            padding: "16px",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Cierres Ganados
          </span>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "var(--success)", marginTop: "6px" }}>
            {formatNumber(totalCierres)}
          </div>
          <span style={{ fontSize: "13px", color: "var(--muted)" }}>Ventas concretadas</span>
        </div>

        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: "12px",
            padding: "16px",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Proyección Ponderada
          </span>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "var(--navy-900)", marginTop: "6px" }}>
            {formatUsd(metricas.projection.totalWeightedCents)}
          </div>
          <span style={{ fontSize: "13px", color: "var(--muted)" }}>Volumen proyectado USD</span>
        </div>
      </section>

      <div role="status" aria-live="polite" style={{ fontSize: "13px", color: "var(--success)", fontWeight: 600 }}>
        {exportMessage}
      </div>

      {!online && <p className="analytics-offline" role="status" style={{ fontSize: "13px" }}>{common.offline}</p>}

      <section id="report-filters" aria-label={common.filters} className="non-printable">
        <ReportFiltersView
          filters={metricas.filters}
          periodo={periodo}
          tab={tab}
          projects={projects}
          brokers={metricas.brokers.flatMap((b) => (b.brokerId === null ? [] : [{ id: b.brokerId, label: b.name }]))}
          online={online}
        />
      </section>

      <Tabs value={tab} onValueChange={setTab} className="analytics-main-tabs">
        <div className="non-printable">
          <AnalyticsTabs tabs={reportTabs} label={c.tabs} />
        </div>

        {/* ======================================================== */}
        {/* PESTAÑA 1: EMBUDO DE CONVERSIÓN VISUAL INTEGRAL           */}
        {/* ======================================================== */}
        <TabsContent value="embudo">
          {/* Card: Embudo de Conversión Integral con Porcentajes de Caída */}
          <div
            className="visual-funnel-card"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--line)",
              borderRadius: "14px",
              padding: "24px",
              boxShadow: "var(--shadow-card)",
              marginBottom: "24px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "18px" }}>
              <div>
                <p className="eyebrow" style={{ margin: "0 0 4px", fontSize: "12px" }}>Embudo Comercial Integrado</p>
                <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 800, color: "var(--navy-950)" }}>
                  Flujo de Conversión y Análisis de Caída entre Etapas
                </h2>
                <p style={{ margin: "4px 0 0", fontSize: "14px", color: "var(--muted)" }}>
                  Medición secuencial de avance comercial, tasa de retención y pérdida de prospectos en cada etapa.
                </p>
              </div>
              <div className="non-printable">{range}</div>
            </div>

            {/* Diagrama Arquitectónico del Embudo */}
            <div style={{ display: "grid", gap: "14px", marginTop: "20px" }}>
              {metricas.funnel.map((etapa, idx) => {
                const prev = idx > 0 ? metricas.funnel[idx - 1] : null;
                const baseCount = prev ? prev.reachedCount : null;
                const leadsPerdidos = baseCount !== null ? Math.max(0, baseCount - etapa.reachedCount) : 0;
                const tasaCaida = baseCount !== null && baseCount > 0
                  ? Math.max(0, Math.round((leadsPerdidos / baseCount) * 100))
                  : (etapa.passRatePercent !== null ? Math.max(0, 100 - etapa.passRatePercent) : 0);

                const baseTotal = metricas.funnel[0]?.reachedCount || 1;
                const anchoPorcentaje = Math.max(28, Math.round((etapa.reachedCount / baseTotal) * 100));

                return (
                  <div key={etapa.stageId} style={{ display: "grid", gap: "10px" }}>
                    {/* Indicador de Caída / Transición entre Etapas */}
                    {prev && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "12px",
                          padding: "6px 14px",
                          background: leadsPerdidos > 0 ? "rgba(161, 63, 67, 0.06)" : "rgba(22, 115, 74, 0.06)",
                          border: `1px dashed ${leadsPerdidos > 0 ? "#F87171" : "#86EFAC"}`,
                          borderRadius: "8px",
                          maxWidth: "460px",
                          margin: "0 auto",
                          fontSize: "13px",
                        }}
                      >
                        <TrendingDown size={16} color={leadsPerdidos > 0 ? "var(--danger)" : "var(--success)"} />
                        <span style={{ fontWeight: 700, color: leadsPerdidos > 0 ? "var(--danger)" : "var(--success)" }}>
                          {leadsPerdidos > 0 ? `-${tasaCaida}% Caída de Etapa` : "100% Retención Total"}
                        </span>
                        <span style={{ color: "var(--muted)" }}>
                          ({leadsPerdidos} prospectos desestimados entre «{prev.label}» y «{etapa.label}»)
                        </span>
                      </div>
                    )}

                    {/* Bloque Visual de Etapa */}
                    <div
                      style={{
                        background: "linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)",
                        border: "1px solid var(--line)",
                        borderLeft: `5px solid ${etapa.kind === "won" ? "var(--success)" : etapa.kind === "lost" ? "var(--danger)" : "var(--gold-600)"}`,
                        borderRadius: "10px",
                        padding: "16px 20px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: "14px",
                        boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "14px", minWidth: "220px" }}>
                        <div
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "50%",
                            background: "var(--navy-950)",
                            color: "#FFFFFF",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 800,
                            fontSize: "14px",
                          }}
                        >
                          {etapa.position}
                        </div>
                        <div>
                          <strong style={{ fontSize: "16px", color: "var(--navy-950)", display: "block" }}>
                            {etapa.label}
                          </strong>
                          <span style={{ fontSize: "13px", color: "var(--muted)" }}>
                            Naturaleza: {etapa.kind === "won" ? "Ganada (Cierre)" : etapa.kind === "lost" ? "Perdida" : "Abierta"}
                          </span>
                        </div>
                      </div>

                      {/* Barra de Proporción de Conversión */}
                      <div style={{ flex: "1 1 200px", minWidth: "160px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--muted)", marginBottom: "4px" }}>
                          <span>Avance sobre inicio</span>
                          <span style={{ fontWeight: 700, color: "var(--navy-900)" }}>{anchoPorcentaje}%</span>
                        </div>
                        <div style={{ width: "100%", background: "#E2E8F0", height: "8px", borderRadius: "999px", overflow: "hidden" }}>
                          <div
                            style={{
                              width: `${anchoPorcentaje}%`,
                              height: "100%",
                              background: etapa.kind === "won" ? "var(--success)" : "var(--gold-500)",
                              borderRadius: "999px",
                              transition: "width 400ms ease",
                            }}
                          />
                        </div>
                      </div>

                      {/* Métricas Numéricas de la Etapa */}
                      <div style={{ display: "flex", gap: "18px", alignItems: "center" }}>
                        <div style={{ textAlign: "right" }}>
                          <span style={{ display: "block", fontSize: "12px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>
                            {analyticsCopy.inicio.reached}
                          </span>
                          <strong style={{ fontSize: "18px", color: "var(--navy-950)" }}>
                            {formatNumber(etapa.reachedCount)}
                          </strong>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span style={{ display: "block", fontSize: "12px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>
                            {analyticsCopy.inicio.currentCount}
                          </span>
                          <strong style={{ fontSize: "18px", color: "var(--gold-700)" }}>
                            {formatNumber(etapa.count)}
                          </strong>
                        </div>
                        <div style={{ textAlign: "right", minWidth: "85px" }}>
                          <span style={{ display: "block", fontSize: "12px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>
                            {analyticsCopy.inicio.pass}
                          </span>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "4px 8px",
                              borderRadius: "6px",
                              background: etapa.passRatePercent !== null && etapa.passRatePercent >= 50 ? "#DCFCE7" : "#FEF3C7",
                              color: etapa.passRatePercent !== null && etapa.passRatePercent >= 50 ? "#166534" : "#92400E",
                              fontWeight: 800,
                              fontSize: "13px",
                            }}
                          >
                            {etapa.passRatePercent === null ? common.noBase : `${formatNumber(etapa.passRatePercent)}%`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Gráfico Horizontal Estándar de Apoyo */}
          <ReportGraph
            title={c.funnel}
            subtitle={c.funnelContext}
            data={funnel}
            series={single("reached", analyticsCopy.inicio.reached)}
            type="horizontal"
            online={online}
            range={range}
          />

          {/* Motivos de Desestimación / Pérdida */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--line)",
              borderRadius: "14px",
              padding: "20px",
              boxShadow: "var(--shadow-card)",
              marginTop: "20px",
            }}
          >
            <h3 style={{ margin: "0 0 6px", fontSize: "16px", fontWeight: 700, color: "var(--navy-950)" }}>
              {c.losses} (Análisis de Fuga Comercial)
            </h3>
            <p style={{ margin: "0 0 16px", fontSize: "13px", color: "var(--muted)" }}>
              Causas registradas por los asesores al marcar un negocio o contacto como no concretado.
            </p>

            {metricas.lossReasons.length === 0 ? (
              <p style={{ fontSize: "13px", color: "var(--muted)" }}>{common.empty}</p>
            ) : (
              <div style={{ display: "grid", gap: "10px" }}>
                {metricas.lossReasons.map((motivo) => {
                  const totalPerdidos = metricas.lossReasons.reduce((acc, m) => acc + m.count, 0) || 1;
                  const pct = Math.round((motivo.count / totalPerdidos) * 100);
                  return (
                    <div
                      key={motivo.reasonId ?? "unattributed"}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 14px",
                        background: "#F8FAFC",
                        borderRadius: "8px",
                        border: "1px solid var(--line)",
                        fontSize: "13px",
                      }}
                    >
                      <strong style={{ color: "var(--ink)", minWidth: "180px" }}>{motivo.label}</strong>
                      <div style={{ flex: 1, maxWidth: "340px", margin: "0 16px" }}>
                        <div style={{ background: "#E2E8F0", height: "6px", borderRadius: "999px", overflow: "hidden" }}>
                          <div style={{ width: `${pct}%`, height: "100%", background: "var(--danger)", borderRadius: "999px" }} />
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <span style={{ fontWeight: 800, color: "var(--navy-950)" }}>{formatNumber(motivo.count)}</span>
                        <span style={{ color: "var(--muted)", fontSize: "12px" }}>({pct}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ======================================================== */}
        {/* PESTAÑA 2: CANALES DE CAPTACIÓN & RANKING DE PROYECTOS    */}
        {/* ======================================================== */}
        <TabsContent value="canales">
          <div style={{ display: "grid", gap: "20px" }}>
            {/* Gráfico Donut de Canales */}
            <ReportGraph
              title={c.channels}
              subtitle={c.channelsContext}
              data={channels}
              series={single("count", common.leads)}
              type="donut"
              online={online}
              range={range}
            />

            {/* RANKING DE PROYECTOS MÁS COTIZADOS */}
            <div
              className="ranking-card"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--line)",
                borderRadius: "14px",
                padding: "24px",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                <div>
                  <p className="eyebrow" style={{ margin: "0 0 4px", fontSize: "12px" }}>Demanda Inmobiliaria</p>
                  <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "var(--navy-950)" }}>
                    Ranking de Proyectos Inmobiliarios Más Cotizados
                  </h2>
                  <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--muted)" }}>
                    Desglose de demanda y solicitudes de cotización agrupadas por desarrollo residencial/comercial.
                  </p>
                </div>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "var(--gold-soft)",
                    color: "var(--gold-700)",
                    padding: "6px 12px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: 700,
                  }}
                >
                  <Building2 size={16} />
                  <span>{rankingProyectos.length} Proyectos con interés</span>
                </span>
              </div>

              {rankingProyectos.length === 0 ? (
                <p style={{ fontSize: "13px", color: "var(--muted)", margin: "16px 0" }}>
                  No se registran cotizaciones asociadas a proyectos específicos en el periodo analizado.
                </p>
              ) : (
                <div style={{ display: "grid", gap: "10px", marginTop: "14px" }}>
                  {rankingProyectos.map((proyecto, rankIdx) => {
                    const leadsProyecto = proyecto.count ?? 0;
                    const porcentajeDemanda = totalDemandLeads > 0 ? Math.round((leadsProyecto / totalDemandLeads) * 100) : 0;
                    const maxLeads = rankingProyectos[0]?.count ?? 1;
                    const anchoRelativo = Math.max(12, Math.round((leadsProyecto / maxLeads) * 100));

                    const podioEstilo =
                      rankIdx === 0
                        ? { bg: "#FEF3C7", text: "#92400E", label: "Oro #1" }
                        : rankIdx === 1
                        ? { bg: "#F1F5F9", text: "#475569", label: "Plata #2" }
                        : rankIdx === 2
                        ? { bg: "#FFEDD5", text: "#9A3412", label: "Bronce #3" }
                        : { bg: "#F8FAFC", text: "#64748B", label: `#${rankIdx + 1}` };

                    return (
                      <div
                        key={proyecto.id}
                        style={{
                          background: "#FFFFFF",
                          border: "1px solid var(--line)",
                          borderRadius: "10px",
                          padding: "14px 18px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          flexWrap: "wrap",
                          gap: "14px",
                          boxShadow: "0 1px 2px rgba(15, 23, 42, 0.03)",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: "220px" }}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              minWidth: "32px",
                              height: "32px",
                              borderRadius: "6px",
                              background: podioEstilo.bg,
                              color: podioEstilo.text,
                              fontWeight: 800,
                              fontSize: "12px",
                            }}
                          >
                            {podioEstilo.label}
                          </span>
                          <div>
                            <strong style={{ fontSize: "14px", color: "var(--navy-950)", display: "block" }}>
                              {proyecto.label}
                            </strong>
                            <span style={{ fontSize: "13px", color: "var(--muted)" }}>
                              Código ID: #{proyecto.id}
                            </span>
                          </div>
                        </div>

                        {/* Barra de Proporción Relativa */}
                        <div style={{ flex: "1 1 200px", minWidth: "140px" }}>
                          <div style={{ width: "100%", background: "#F1F5F9", height: "8px", borderRadius: "999px", overflow: "hidden" }}>
                            <div
                              style={{
                                width: `${anchoRelativo}%`,
                                height: "100%",
                                background: rankIdx === 0 ? "var(--gold-600)" : "var(--navy-700)",
                                borderRadius: "999px",
                              }}
                            />
                          </div>
                        </div>

                        {/* Métricas de Cotización */}
                        <div style={{ display: "flex", gap: "16px", alignItems: "center", textAlign: "right" }}>
                          <div>
                            <span style={{ display: "block", fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>
                              Cotizaciones / Leads
                            </span>
                            <strong style={{ fontSize: "16px", color: "var(--navy-950)" }}>
                              {formatNumber(leadsProyecto)}
                            </strong>
                          </div>
                          <div>
                            <span style={{ display: "block", fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>
                              Participación
                            </span>
                            <span
                              style={{
                                display: "inline-block",
                                padding: "2px 8px",
                                borderRadius: "4px",
                                background: "#F1F5F9",
                                color: "var(--navy-900)",
                                fontWeight: 700,
                                fontSize: "13px",
                              }}
                            >
                              {porcentajeDemanda}%
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Tabla Detallada de Canales de Captación */}
            <div className="analytics-desktop-table">
              <table>
                <caption>{c.channelsContext}</caption>
                <thead>
                  <tr>
                    <th>{c.channels}</th>
                    <th>{common.leads}</th>
                    <th>{c.revenue}</th>
                    <th>{c.spend}</th>
                    <th>{c.roi}</th>
                  </tr>
                </thead>
                <tbody>
                  {metricas.sources.map((p) => (
                    <tr key={p.sourceId ?? "unattributed"}>
                      <th scope="row">{p.source}</th>
                      <td>{formatNumber(p.count)}</td>
                      <td>{formatUsd(p.revenueCents)}</td>
                      <td>{p.spendCents === null ? common.noData : formatUsd(p.spendCents)}</td>
                      <td>{p.roiPercent === null ? c.roiMissing : `${formatNumber(p.roiPercent)}%`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <dl className="analytics-mobile-values analytics-value-list">
              {metricas.sources.map((p) => (
                <div key={p.sourceId ?? "unattributed"}>
                  <dt>{p.source}</dt>
                  <dd>
                    <span>{common.leads}: {formatNumber(p.count)}</span>
                    <span>{c.revenue}: {formatUsd(p.revenueCents)}</span>
                    <span>{c.spend}: {p.spendCents === null ? common.noData : formatUsd(p.spendCents)}</span>
                    <span>{c.roi}: {p.roiPercent === null ? c.roiMissing : `${formatNumber(p.roiPercent)}%`}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </TabsContent>

        {/* ======================================================== */}
        {/* OTRAS PESTAÑAS ANALÍTICAS                                */}
        {/* ======================================================== */}
        <TabsContent value="tendencia">
          <ReportGraph
            title={c.trend}
            subtitle={c.trendContext}
            data={trend}
            series={eventSeries}
            type="area"
            stacked
            online={online}
            range={range}
            note={c.trendOverlap}
          />
        </TabsContent>

        <TabsContent value="zonas">
          <ReportGraph
            title={c.zones}
            subtitle={c.zonesContext}
            data={zones}
            series={single("count", common.leads)}
            online={online}
            range={range}
          />
        </TabsContent>

        <TabsContent value="brokers">
          <ReportGraph
            title={c.brokers}
            subtitle={c.brokersContext}
            data={brokers}
            series={single("amount", common.amount, "var(--chart-1)")}
            type="horizontal"
            money
            online={online}
            range={range}
          />
          <dl className="analytics-value-list">
            {metricas.brokers.map((p) => (
              <div key={p.brokerId ?? "unassigned"}>
                <dt>{p.name}</dt>
                <dd>
                  <span>{common.won}: {formatNumber(p.won)}</span>
                  <span>
                    {analyticsCopy.inicio.conversion}:{" "}
                    {p.conversionPercent === null ? common.noBase : `${formatNumber(p.conversionPercent)}%`}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </TabsContent>

        <TabsContent value="velocidad">
          <ChartCard title={c.velocity} subtitle={c.velocityContext} state={metricState(true, metricas.velocity.sampleSize > 0, online)}>
            <dl className="analytics-value-list">
              <div>
                <dt>{c.median}</dt>
                <dd>{metricas.velocity.medianDays === null ? common.noData : `${formatNumber(metricas.velocity.medianDays)} ${common.days}`}</dd>
              </div>
              <div>
                <dt>{c.p75}</dt>
                <dd>{metricas.velocity.p75Days === null ? common.noData : `${formatNumber(metricas.velocity.p75Days)} ${common.days}`}</dd>
              </div>
              <div>
                <dt>{c.samples}</dt>
                <dd>{formatNumber(metricas.velocity.sampleSize)}</dd>
              </div>
            </dl>
            <p className="analytics-context" style={{ fontSize: "13px" }}>{c.velocityMissing}</p>
          </ChartCard>
        </TabsContent>

        <TabsContent value="inventario">
          <ReportGraph
            title={c.inventory}
            subtitle={c.inventoryContext}
            data={inventory}
            series={inventorySeries}
            stacked
            online={online}
            range={range}
          />
          <dl className="analytics-value-list">
            {metricas.inventory.map((p) => (
              <div key={p.state}>
                <dt>{inventoryLabels[p.state] ?? common.noData}</dt>
                <dd>
                  <span>{c.median}: {p.medianAgeDays === null ? common.noData : `${formatNumber(p.medianAgeDays)} ${common.days}`}</span>
                  <span>{c.p75}: {p.p75AgeDays === null ? common.noData : `${formatNumber(p.p75AgeDays)} ${common.days}`}</span>
                </dd>
              </div>
            ))}
          </dl>
        </TabsContent>

        <TabsContent value="comisiones">
          <ReportGraph
            title={c.commissions}
            subtitle={c.commissionsContext}
            data={commissions}
            series={commissionSeries}
            money
            online={online}
            range={range}
          />
        </TabsContent>

        <TabsContent value="pronostico">
          <ReportGraph
            title={c.forecast}
            subtitle={c.forecastContext}
            data={forecast}
            series={single("amount", c.weighted, "var(--chart-1)")}
            type="line"
            money
            online={online}
            range={range}
            note={c.forecastMissing}
          />
          <dl className="analytics-value-list">
            <div>
              <dt>{c.weighted}</dt>
              <dd>{formatUsd(metricas.projection.totalWeightedCents)}</dd>
            </div>
            <div>
              <dt>{c.probability}</dt>
              <dd>{metricas.projection.confidenceEstimated === null ? common.noBase : `${formatNumber(metricas.projection.confidenceEstimated)}%`}</dd>
            </div>
            <div>
              <dt>{c.missingProbability}</dt>
              <dd>{formatNumber(metricas.projection.missingProbabilityCount)}</dd>
            </div>
            <div>
              <dt>{c.missingAmount}</dt>
              <dd>{formatNumber(metricas.projection.missingAmountCount)}</dd>
            </div>
          </dl>
        </TabsContent>
      </Tabs>
    </div>
  );
}
