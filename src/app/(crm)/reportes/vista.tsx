"use client";

import { PageHeader } from "../_ui/prototipo-ui";

/**
 * ponytail: datos de muestra portados de `referencia-prototipo/app/page.tsx`
 * (`ReportsView`). M12 · Reportes se construye en F4
 * (`docs/F1_ANALISIS_Y_PLAN.md`); sustituye estos valores fijos por
 * consultas reales (criterio de terminado #9: "las métricas de Inicio y
 * Reportes provienen de consultas, no de constantes").
 */
export function ReportesVista() {
  return (
    <>
      <PageHeader
        eyebrow="C12 · Solo administrador"
        title="Reportes y BI"
        subtitle="Conversión, canales, demanda y proyección comercial."
        action={
          <div className="header-actions-inline">
            <select className="header-select">
              <option>Últimos 90 días</option>
              <option>Este año</option>
            </select>
            <button className="button secondary" type="button">
              Exportar a Excel
            </button>
          </div>
        }
      />
      <div className="report-grid">
        <article className="panel report-large">
          <p className="eyebrow">Conversión del embudo</p>
          <h2>De lead a cierre</h2>
          <div className="report-funnel">
            {(
              [
                ["48", "Leads"],
                ["38", "Contactados"],
                ["24", "Presentaciones"],
                ["14", "Preselección"],
                ["10", "Negociación"],
                ["7", "Cierres"],
              ] as const
            ).map(([value, label], index) => (
              <div style={{ width: `${100 - index * 10}%` }} key={label}>
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </article>
        <article className="panel">
          <p className="eyebrow">Leads por canal</p>
          <h2>Origen de captación</h2>
          <div className="donut">
            <strong>48</strong>
            <span>leads</span>
          </div>
          <div className="legend">
            <span>
              <i className="gold" />
              YouTube 58%
            </span>
            <span>
              <i className="navy" />
              Web 22%
            </span>
            <span>
              <i className="blue" />
              WhatsApp 14%
            </span>
            <span>
              <i className="gray" />
              Referidos 6%
            </span>
          </div>
        </article>
        <article className="panel">
          <p className="eyebrow">Zonas calientes</p>
          <h2>Interés por ubicación</h2>
          <div className="horizontal-bars">
            {(
              [
                ["Punta Cana", 88],
                ["Bávaro", 68],
                ["Cap Cana", 45],
                ["Las Terrenas", 28],
              ] as const
            ).map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <div>
                  <i style={{ width: `${value}%` }} />
                </div>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </article>
        <article className="panel">
          <p className="eyebrow">Motivos de pérdida</p>
          <h2>Por qué no avanzan</h2>
          <div className="loss-list">
            {(
              [
                ["Precio", 12],
                ["No responde", 8],
                ["Compró otro", 5],
                ["Sin financiamiento", 4],
              ] as const
            ).map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
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
            <span>Jul</span>
            <span>Ago</span>
            <span>Sep</span>
            <span>Oct</span>
            <span>Nov</span>
            <span>Dic</span>
          </div>
          <div className="projection-total">
            <span>Proyección trimestral</span>
            <strong>US$1.42M</strong>
            <small>Confianza estimada 72%</small>
          </div>
        </article>
      </div>
    </>
  );
}
