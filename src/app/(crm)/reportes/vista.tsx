"use client";

import { generarCsv } from "@/domain/csv";
import type { ReportesBiData } from "@/application/reportes/puertos";
import { PageHeader } from "../_ui/prototipo-ui";

export function ReportesVista({ metricas, canExport, periodo }: { metricas: ReportesBiData; canExport: boolean; periodo: string }) {

  const exportarCsv = () => {
    if (!canExport) return;
    const csvContent = generarCsv(["Etapa", "Actuales", "Alcanzaron", "Tasa de paso (%)"], metricas.funnel.map(f => [f.label, f.count, f.reachedCount, f.passRatePercent ?? "Sin base"]));
    const encodedUri = URL.createObjectURL(new Blob([csvContent], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `reporte_bi_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(encodedUri);
  };

  return (
    <>
      <PageHeader
        eyebrow="Métricas operativas"
        title="Reportes y BI"
        subtitle="Conversión, canales, demanda y proyección comercial en tiempo real."
        action={
          <form method="get" className="header-actions-inline">
            <select
              className="header-select"
              name="periodo"
              defaultValue={periodo}
              onChange={(e) => {
                const form = e.currentTarget.form;
                if (form) {
                  for (const name of ["desde", "hasta"]) (form.elements.namedItem(name) as HTMLInputElement).value = "";
                  form.requestSubmit();
                }
              }}
              aria-label="Seleccionar periodo de análisis"
            >
              <option value="90d">Últimos 90 días</option>
              <option value="ano">Este año</option>
              <option value="todo">Histórico completo</option>
            </select>
            <input className="header-select" type="date" name="desde" aria-label="Desde" defaultValue={metricas.filters.desde ?? ""} />
            <input className="header-select" type="date" name="hasta" aria-label="Hasta" defaultValue={metricas.filters.hasta ?? ""} />
            <input className="header-select" type="number" min="1" name="projectId" aria-label="ID del proyecto" placeholder="Proyecto (ID)" defaultValue={metricas.filters.projectId ?? ""} />
            <input className="header-select" type="number" min="1" name="brokerId" aria-label="ID del broker" placeholder="Broker (ID)" defaultValue={metricas.filters.brokerId ?? ""} />
            <button className="button secondary" type="submit">Aplicar</button>
            <button className="button secondary" type="button" disabled={!canExport} onClick={exportarCsv}>
              Exportar a CSV
            </button>
          </form>
        }
      />
      {metricas.totalLeads === 0 && metricas.totalDeals === 0 && <p className="empty">Sin leads ni negocios para estos filtros.</p>}
      <div className="report-grid">
        <article className="panel report-large">
          <p className="eyebrow">Conversión del embudo</p>
          <h2>De lead a cierre ({metricas.totalLeads} captados)</h2>
          <div className="report-funnel">
            {metricas.funnel.map((step) => (
              <div style={{ width: `${step.widthPercent}%` }} key={step.stageId}>
                <strong>{step.reachedCount}</strong>
                <span>{step.label} · {step.count} actuales · Paso: {step.passRatePercent === null ? "Sin base" : `${step.passRatePercent}%`}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <p className="eyebrow">Leads por canal</p>
          <h2>Origen de captación</h2>
          <div className="donut">
            <strong>{metricas.totalLeads}</strong>
            <span>leads</span>
          </div>
          <div className="legend">
            {metricas.sources.length === 0 && <p>Sin canales registrados.</p>}
            {metricas.sources.map((src) => (
              <span key={src.source}>
                <i className={src.colorClass} />
                {src.source} {src.percentage}% ({src.count})
                <small>{src.deals} negocios · {src.won} cierres · ROI: {src.roiPercent === null ? "No atribuible o sin gasto" : `${src.roiPercent}%`}</small>
              </span>
            ))}
          </div>
        </article>

        <article className="panel">
          <p className="eyebrow">Zonas calientes</p>
          <h2>Interés por ubicación</h2>
          <div className="horizontal-bars">
            {metricas.zones.length === 0 && <p>Sin zonas registradas.</p>}
            {metricas.zones.map((zone) => (
              <div key={zone.label}>
                <span>{zone.label}</span>
                <div>
                  <i style={{ width: `${zone.percentage}%` }} />
                </div>
                <strong>{zone.count}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <p className="eyebrow">Motivos de pérdida</p>
          <h2>Por qué no avanzan</h2>
          <div className="loss-list">
            {metricas.lossReasons.length === 0 && <p>Sin pérdidas registradas.</p>}
            {metricas.lossReasons.map((motivo) => (
              <div key={motivo.label}>
                <span>{motivo.label}</span>
                <strong>{motivo.count}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="panel report-large">
          <p className="eyebrow">Proyección de cierre</p>
          <h2>Pipeline ponderado</h2>
          <div className="projection">
            {metricas.projection.points.length === 0 && <p>Sin proyección calculable.</p>}
            {metricas.projection.points.map((p) => (
              <span key={p.month ?? "sin-fecha"}>{p.month ?? "Sin fecha"}: {new Intl.NumberFormat("es-DO", { style: "currency", currency: "USD" }).format(p.amountCents / 100)}</span>
            ))}
          </div>
          <div className="projection-total">
            <span>Negocios abiertos del periodo</span>
            <strong>{metricas.projection.totalDisplayUsd}</strong>
            <small>Probabilidad ponderada: {metricas.projection.confidenceEstimated === null ? "Sin base" : `${metricas.projection.confidenceEstimated}%`} · {metricas.projection.missingProbabilityCount} sin probabilidad · {metricas.projection.missingAmountCount} sin monto</small>
          </div>
        </article>
        <article className="panel report-large">
          <p className="eyebrow">Tendencia mensual</p><h2>Leads, negocios y cierres</h2>
          <div className="compact-list">{metricas.trend.map(p => <div key={p.month}><strong>{p.month}</strong><span> {p.leads} leads · {p.deals} negocios · {p.won} cierres</span></div>)}</div>
        </article>
        <article className="panel">
          <p className="eyebrow">Brokers</p><h2>Ranking por volumen USD cerrado</h2>
          <div className="ranking">{metricas.brokers.map(b => <div key={b.brokerId ?? "sin-asignar"}><strong>{b.name}</strong><small>{new Intl.NumberFormat("es-DO", { style: "currency", currency: "USD" }).format(b.volumeCents / 100)} · {b.won} cierres · {b.conversionPercent === null ? "Sin base" : `${b.conversionPercent}%`} conversión</small></div>)}</div>
          {metricas.brokers.length === 0 && <p>Sin brokers con actividad.</p>}
        </article>
        <article className="panel">
          <p className="eyebrow">Velocidad</p><h2>Lead a cierre</h2>
          <p>Mediana: {metricas.velocity.medianDays?.toFixed(1) ?? "Sin datos"} días</p>
          <p>p75: {metricas.velocity.p75Days?.toFixed(1) ?? "Sin datos"} días · {metricas.velocity.sampleSize} cierres medidos</p>
        </article>
        <article className="panel">
          <p className="eyebrow">Inventario</p><h2>Estado y antigüedad desde alta</h2>
          {metricas.inventory.map(i => <p key={i.state}>{i.state}: {i.count} · mediana {i.medianAgeDays?.toFixed(1) ?? "—"} días · p75 {i.p75AgeDays?.toFixed(1) ?? "—"} días</p>)}
          {metricas.inventory.length === 0 && <p>Sin unidades visibles.</p>}
        </article>
        <article className="panel report-large">
          <p className="eyebrow">Comisiones USD</p><h2>Por mes de cierre</h2>
          {metricas.commissions.map(c => <p key={c.month ?? "sin-fecha"}>{c.month ?? "Sin fecha"}: {c.count} comisiones · {new Intl.NumberFormat("es-DO", { style: "currency", currency: "USD" }).format(c.totalCents / 100)}</p>)}
          {metricas.commissions.length === 0 && <p>Sin comisiones en el periodo.</p>}
        </article>
      </div>
    </>
  );
}
