"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import type { DashboardMetrics } from "@/application/dashboard/puertos";
import { Avatar, Badge, Metric, PageHeader } from "../_ui/prototipo-ui";

export function InicioVista({
  roleSlug,
  metricas,
  nombre,
}: {
  roleSlug: string;
  metricas: DashboardMetrics;
  nombre: string;
}) {
  const isBroker = roleSlug === "broker";
  const isAssistant = roleSlug === "assistant";
  const leads = metricas.leadsRecientes;

  return (
    <>
      <PageHeader
        eyebrow={isBroker ? "Mi operación" : "Resumen operativo"}
        title={nombre.trim() ? `Hola, ${nombre.trim()}` : "Hola"}
        subtitle={
          isBroker
            ? "Tu cartera y próximas acciones de hoy."
            : "Prioridades, actividad comercial y decisiones pendientes."
        }
        action={
          <div className="flex items-center gap-2.5">
            <div className="h-9 px-3 inline-flex items-center text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg shadow-2xs font-mono">
              {metricas.fechaTexto}
            </div>
            <Link
              href="/leads"
              className="h-9 px-3.5 inline-flex items-center gap-1.5 rounded-lg bg-navy-900 hover:bg-navy-800 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="size-3.5 text-gold-400" />
              <span>Registrar Lead</span>
            </Link>
          </div>
        }
      />
      <section className="metrics-row inicio-metrics">
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
            <Metric label="Avances por revisar" value={metricas.avancesPorRevisarCount === null ? "—" : String(metricas.avancesPorRevisarCount)} note="Sin registro de revisión" />
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
            {leads.length === 0 && <p className="empty">Sin leads visibles.</p>}
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
              {metricas.funnel.length === 0 && <p className="empty">Sin etapas visibles.</p>}
              {metricas.funnel.map((step) => (
                <div key={step.stageId}>
                  <span>{step.label}</span>
                  <div>
                    <i style={{ width: `${step.widthPercent}%` }} />
                  </div>
                  <strong>{step.reachedCount}</strong>
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
            {metricas.activities.length === 0 && <p className="empty">Sin próximas actividades.</p>}
            {metricas.activities.map((activity) => <div key={activity.id}>
              <time dateTime={activity.startsAt}>{new Intl.DateTimeFormat("es-DO", { timeZone: "America/Santo_Domingo", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(activity.startsAt))}</time>
              <span>
                <strong>{activity.title}</strong>
                <small>{activity.location ?? "Sin ubicación"}</small>
              </span>
            </div>)}
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
            metricas.academy ? <div className="course-mini">
              <div className="course-art">QH Academy</div>
              <strong>{metricas.academy.title}</strong>
              <div className="progress-line">
                <span style={{ width: `${metricas.academy.progressPercent}%` }} />
              </div>
              <small>{metricas.academy.progressPercent}% completado</small>
            </div> : <p className="empty">Sin cursos en progreso.</p>
          ) : (
            <div className="ranking">
              {metricas.projects.length === 0 && <p className="empty">Sin demanda registrada.</p>}
              {metricas.projects.map((proj, index) => (
                <div key={proj.id}>
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
