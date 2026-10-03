"use client";

import { useState } from "react";
import type { ReportesBiData } from "@/application/reportes/puertos";
import { PageHeader } from "../_ui/prototipo-ui";

export function ReportesVista({ metricas }: { metricas: ReportesBiData }) {
  const [periodo, setPeriodo] = useState<string>("90d");

  const exportarCsv = () => {
    const encabezados = ["Etapa", "Conteo"];
    const filas = metricas.funnel.map((f) => `"${f.label}",${f.count}`);
    const csvContent = "data:text/csv;charset=utf-8," + [encabezados.join(","), ...filas].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `reporte_bi_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <PageHeader
        eyebrow="C12 · Métricas Operativas"
        title="Reportes y BI"
        subtitle="Conversión, canales, demanda y proyección comercial en tiempo real."
        action={
          <div className="header-actions-inline">
            <select
              className="header-select"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              aria-label="Seleccionar periodo de análisis"
            >
              <option value="90d">Últimos 90 días</option>
              <option value="ano">Este año</option>
              <option value="todo">Histórico completo</option>
            </select>
            <button className="button secondary" type="button" onClick={exportarCsv}>
              Exportar a CSV
            </button>
          </div>
        }
      />
      <div className="report-grid">
        <article className="panel report-large">
          <p className="eyebrow">Conversión del embudo</p>
          <h2>De lead a cierre ({metricas.totalLeads} captados)</h2>
          <div className="report-funnel">
            {metricas.funnel.map((step) => (
              <div style={{ width: `${step.widthPercent}%` }} key={step.label}>
                <strong>{step.count}</strong>
                <span>{step.label}</span>
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
            {metricas.sources.map((src) => (
              <span key={src.source}>
                <i className={src.colorClass} />
                {src.source} {src.percentage}% ({src.count})
              </span>
            ))}
          </div>
        </article>

        <article className="panel">
          <p className="eyebrow">Zonas calientes</p>
          <h2>Interés por ubicación</h2>
          <div className="horizontal-bars">
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
            <div className="projection-line" />
            <div className="projection-area" />
            {metricas.projection.points.map((p) => (
              <span key={p.month}>{p.month}</span>
            ))}
          </div>
          <div className="projection-total">
            <span>Proyección trimestral</span>
            <strong>{metricas.projection.totalDisplayUsd}</strong>
            <small>Confianza estimada {metricas.projection.confidenceEstimated}%</small>
          </div>
        </article>
      </div>
    </>
  );
}
