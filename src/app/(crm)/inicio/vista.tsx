"use client";

import Link from "next/link";
import { initialLeads, properties } from "../_ui/datos-muestra";
import { Avatar, Badge, Metric, PageHeader } from "../_ui/prototipo-ui";

/**
 * ponytail: datos de muestra portados de `referencia-prototipo/app/page.tsx`
 * (componente `Dashboard`). M14 · Inicio se construye en F4
 * (`docs/F1_ANALISIS_Y_PLAN.md`); hasta entonces esta vista solo demuestra el
 * layout aprobado con datos fijos.
 *
 * Simplificación frente al prototipo: allí el clic en un lead del panel abría
 * el inspector de Leads sin cambiar de URL (estado compartido en un único
 * componente). Aquí cada módulo es su propia ruta, así que el enlace navega a
 * `/leads` en vez de abrir el inspector in-place.
 */
export function InicioVista({ roleSlug }: { roleSlug: string }) {
  const isBroker = roleSlug === "broker";
  const isAssistant = roleSlug === "assistant";
  const leads = isBroker
    ? initialLeads.filter((lead) => lead.broker === "Yostar Medina")
    : initialLeads;

  return (
    <>
      <PageHeader
        eyebrow={isBroker ? "Mi operación" : "Resumen operativo"}
        title={isBroker ? "Hola, Yostar" : isAssistant ? "Hola, Alexandra" : "Buenos días, Ismael"}
        subtitle={
          isBroker
            ? "Tu cartera y próximas acciones de hoy."
            : "Prioridades, actividad comercial y decisiones pendientes."
        }
        action={<div className="date-chip">24 julio 2026</div>}
      />
      <section className="metrics-row">
        {isBroker ? (
          <>
            <Metric label="Mis leads" value="5" note="2 requieren seguimiento" />
            <Metric label="Citas esta semana" value="3" note="Próxima a las 10:00 AM" />
            <Metric label="Meta del mes" value="2 / 4" note="50% de cumplimiento" />
            <Metric label="Mi nivel" value="Junior" note="US$415K para Senior" />
          </>
        ) : isAssistant ? (
          <>
            <Metric label="Leads sin asignar" value="2" note="1 de alquiler sugerido a Yostar" />
            <Metric label="Citas de hoy" value="3" note="Primera a las 10:00 AM" />
            <Metric label="Tareas pendientes" value="4" note="1 vencida" />
            <Metric label="Avances por revisar" value="1" note="Praderas, Fase 3" />
          </>
        ) : (
          <>
            <Metric label="Leads del mes" value="48" note="+12% frente a junio" />
            <Metric label="Negocios activos" value="21" note="US$2.8M en pipeline" />
            <Metric label="Cierres del mes" value="7" note="Meta del equipo: 10" />
            <Metric label="Conversión" value="14.6%" note="+2.1 puntos este mes" />
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
              <div className="goal-ring" style={{ "--progress": "50%" } as React.CSSProperties}>
                <strong>50%</strong>
              </div>
              <p>2 de 4 negocios cerrados</p>
              <div className="progress-line">
                <span style={{ width: "17%" }} />
              </div>
              <small>US$85,000 de US$500,000 para nivel Senior</small>
            </div>
          ) : (
            <div className="funnel">
              {(
                [
                  ["Nuevo", 48, 100],
                  ["Contactado", 38, 79],
                  ["Presentación", 24, 50],
                  ["Preselección", 14, 29],
                  ["Negociación", 10, 21],
                  ["Cierre", 7, 15],
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
                <strong>Presentación con Elisa</strong>
                <small>Vista Cana · Yostar</small>
              </span>
            </div>
            <div>
              <time>11:30</time>
              <span>
                <strong>Cita con María</strong>
                <small>Praderas · Ismael</small>
              </span>
            </div>
            <div>
              <time>15:00</time>
              <span>
                <strong>Seguimiento a José</strong>
                <small>Llamada · Alexandra</small>
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
              <strong>Cómo dar de alta un alquiler</strong>
              <div className="progress-line">
                <span style={{ width: "70%" }} />
              </div>
              <small>70% completado</small>
            </div>
          ) : (
            <div className="ranking">
              {properties.slice(0, 3).map((property, index) => (
                <div key={property.name}>
                  <span>{index + 1}</span>
                  <strong>{property.name}</strong>
                  <small>{[18, 14, 9][index]} leads</small>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
