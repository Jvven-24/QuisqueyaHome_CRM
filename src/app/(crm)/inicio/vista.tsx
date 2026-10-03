"use client";

import Link from "next/link";
import type { DashboardMetrics } from "@/application/dashboard/puertos";
import { Avatar, Badge, Metric, PageHeader } from "../_ui/prototipo-ui";

export function InicioVista({
  roleSlug,
  metricas,
}: {
  roleSlug: string;
  metricas: DashboardMetrics;
}) {
  const isBroker = roleSlug === "broker";
  const isAssistant = roleSlug === "assistant";
  const leads = metricas.leadsRecientes;

  return (
    <>
      <PageHeader
        eyebrow={isBroker ? "Mi operación" : "Resumen operativo"}
        title={
          isBroker
            ? `Hola, ${metricas.saludoNombre}`
            : isAssistant
            ? `Hola, ${metricas.saludoNombre}`
            : `Buenos días, ${metricas.saludoNombre}`
        }
        subtitle={
          isBroker
            ? "Tu cartera y próximas acciones de hoy."
            : "Prioridades, actividad comercial y decisiones pendientes."
        }
        action={<div className="date-chip">{metricas.fechaTexto}</div>}
      />
      <section className="metrics-row">
        {isBroker ? (
          <>
            <Metric label="Mis leads" value={String(metricas.misLeadsCount)} note="Cartera activa asignada" />
            <Metric label="Citas esta semana" value={String(metricas.citasSemanaCount)} note="Reuniones en agenda" />
            <Metric label="Meta del mes" value={metricas.metaMesLabel} note={`${metricas.metaPorcentaje}% de cumplimiento`} />
            <Metric label="Mi nivel" value={metricas.miNivel} note="Nivel de corretaje" />
          </>
        ) : isAssistant ? (
          <>
            <Metric label="Leads sin asignar" value={String(metricas.leadsSinAsignarCount)} note="Pendientes de asignación" />
            <Metric label="Citas de hoy" value={String(metricas.citasHoyCount)} note="Coordinadas con clientes" />
            <Metric label="Tareas pendientes" value={String(metricas.tareasPendientesCount)} note="Por completar" />
            <Metric label="Avances por revisar" value={String(metricas.avancesPorRevisarCount)} note="En fase de inspección" />
          </>
        ) : (
          <>
            <Metric label="Leads del mes" value={String(metricas.leadsMesCount)} note="Captados en embudo" />
            <Metric label="Negocios activos" value={String(metricas.negociosActivosCount)} note={`${metricas.volumenPipelineDisplay} en pipeline`} />
            <Metric label="Cierres del mes" value={String(metricas.cierresMesCount)} note="Negocios ganados" />
            <Metric label="Conversión" value={metricas.conversionPorcentaje} note="Ratio lead a cierre" />
          </>
        )}
      </section>
      <section className="dashboard-grid">
        <div className="panel span-2">
          <div className="panel-title">
            <div>
              <p className="eyebrow">Acción inmediata</p>
              <h2>{isBroker ? "Mis leads recientes" : "Leads que requieren atención"}</h2>
            </div>
            <span>{leads.length} visibles</span>
          </div>
          <div className="compact-list">
            {leads.slice(0, 4).map((lead) => (
              <Link key={lead.id} href="/leads" className="lead-row">
                <Avatar name={lead.name} small />
                <span>
                  <strong>{lead.name}</strong>
                  <small>
                    {lead.project} · {lead.source}
                  </small>
                </span>
                <Badge tone={lead.stage === "Nuevo" ? "gold" : "blue"}>{lead.stage}</Badge>
                <span className="row-next">{lead.next}</span>
              </Link>
            ))}
          </div>
        </div>
        <div className="panel">
          <div className="panel-title">
            <div>
              <p className="eyebrow">{isBroker ? "Mi avance" : "Embudo"}</p>
              <h2>{isBroker ? "Meta mensual" : "Conversión por etapa"}</h2>
            </div>
          </div>
          {isBroker ? (
            <div className="goal-ring-wrap">
              <div
                className="goal-ring"
                style={{ "--progress": `${metricas.metaPorcentaje}%` } as React.CSSProperties}
              >
                <strong>{metricas.metaPorcentaje}%</strong>
              </div>
              <p>{metricas.metaMesLabel} negocios cerrados</p>
              <div className="progress-line">
                <span style={{ width: `${metricas.metaPorcentaje}%` }} />
              </div>
              <small>Progreso hacia meta del periodo</small>
            </div>
          ) : (
            <div className="funnel">
              {(
                [
                  ["Nuevo", metricas.leadsMesCount, 100],
                  ["Contactado", Math.round(metricas.leadsMesCount * 0.75), 75],
                  ["Presentación", Math.round(metricas.leadsMesCount * 0.5), 50],
                  ["Preselección", Math.round(metricas.leadsMesCount * 0.3), 30],
                  ["Negociación", Math.round(metricas.leadsMesCount * 0.2), 20],
                  ["Cierre", metricas.cierresMesCount, 15],
                ] as const
              ).map(([label, value, width]) => (
                <div key={label}>
                  <span>{label}</span>
                  <div>
                    <i style={{ width: `${width}%` }} />
                  </div>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="panel">
          <div className="panel-title">
            <div>
              <p className="eyebrow">Agenda</p>
              <h2>Próximas actividades</h2>
            </div>
          </div>
          <div className="timeline-list">
            <div>
              <time>10:00</time>
              <span>
                <strong>Presentación con cliente</strong>
                <small>Bávaro · Seguimiento</small>
              </span>
            </div>
            <div>
              <time>11:30</time>
              <span>
                <strong>Cita virtual / Llamada</strong>
                <small>Cap Cana · Coordinación</small>
              </span>
            </div>
            <div>
              <time>15:00</time>
              <span>
                <strong>Envío de cotización Confotur</strong>
                <small>Plan de pagos y amortización</small>
              </span>
            </div>
          </div>
        </div>
        <div className="panel">
          <div className="panel-title">
            <div>
              <p className="eyebrow">{isBroker ? "Academy" : "Demanda"}</p>
              <h2>{isBroker ? "Continúa tu capacitación" : "Proyectos más consultados"}</h2>
            </div>
          </div>
          {isBroker ? (
            <div className="course-mini">
              <div className="course-art">QH Academy</div>
              <strong>Ley Confotur y Cierre de Ventas</strong>
              <div className="progress-line">
                <span style={{ width: "85%" }} />
              </div>
              <small>85% completado · Certificado disponible</small>
            </div>
          ) : (
            <div className="ranking">
              {[
                { name: "Cap Cana Luxury Villas", leads: 24 },
                { name: "Bávaro Green Suites", leads: 18 },
                { name: "Piantini Urban Tower", leads: 12 },
              ].map((proj, index) => (
                <div key={proj.name}>
                  <span>{index + 1}</span>
                  <strong>{proj.name}</strong>
                  <small>{proj.leads} leads</small>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
