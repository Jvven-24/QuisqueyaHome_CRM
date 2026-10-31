"use client";

import Link from "next/link";
import { EstadoConexion } from "./estado-conexion";
import type { DashboardMetrics } from "@/application/dashboard/puertos";
import { formatNumber } from "@/lib/formato-analitica";
import { ResumenCompacto } from "@/components/ui/resumen-compacto";
import { mostrarDemo } from "@/lib/flags";
import { ETIQUETAS_ESTADO } from "@/application/leads/presentacion";
import {
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  Clock,
  MessageCircle,
  Plus,
  Users,
} from "lucide-react";

export type InicioPermissions = {
  leads: boolean;
  deals: boolean;
  activities: boolean;
  projects: boolean;
  goals: boolean;
  academy: boolean;
  createLead: boolean;
};

export function InicioVista({
  roleSlug,
  metricas,
  nombre,
  permissions,
}: {
  roleSlug: string;
  metricas: DashboardMetrics;
  nombre: string;
  permissions: InicioPermissions;
}) {
  const isBroker = roleSlug === "broker";
  const isAssistant = roleSlug === "assistant" || roleSlug === "asistente";

  const leads = metricas.leadsRecientes ?? [];
  const citas = metricas.activities ?? [];
  const embudo = metricas.funnel ?? [];
  const proyectos = metricas.projects ?? [];


  return (
    <div className="min-w-0 space-y-4 sm:space-y-6 animate-in fade-in duration-300">
      <EstadoConexion />
      {/* ── CABECERA COMPACTA: fecha, título y acciones primarias ─────────── */}
      <header className="flex flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="m-0 text-[13px] font-semibold text-ink-muted">{metricas.fechaTexto || "Jornada actual"}</p>
          <h1 className="m-0 font-heading text-xl font-bold tracking-tight text-navy-950 sm:text-2xl">
            {isBroker ? "Mi jornada" : "Inicio"}
            <span className="sr-only"> · {nombre?.trim() || "Usuario"}</span>
          </h1>
        </div>

        {(permissions.createLead || permissions.deals) && (
          <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
            {permissions.createLead && (
              <Link
                href="/leads?crear=1" prefetch={false}
                className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-navy-950 px-4 text-sm font-bold text-white shadow-sm transition-colors hover:bg-navy-900 ${permissions.deals ? "" : "col-span-2"}`}
              >
                <Plus className="size-4 text-gold-400" />
                <span>Registrar lead</span>
              </Link>
            )}
            {permissions.deals && (
              <Link
                href="/negocios" prefetch={false}
                className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 text-sm font-bold text-navy-950 transition-colors hover:border-gold-600/50 hover:bg-surface-alt ${permissions.createLead ? "" : "col-span-2"}`}
              >
                <Briefcase className="size-4 text-navy-700" />
                <span>Tablero</span>
              </Link>
            )}
          </div>
        )}
      </header>

      {/* ── HOY: accesos a la carga del día, sin texto de relleno ─────────── */}
      <nav aria-label="Pendientes de hoy" className="flex gap-2 overflow-x-auto overscroll-x-contain pb-1">
        {permissions.leads && <Link className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-line bg-surface px-4 text-[13px] font-semibold text-navy-950 hover:bg-surface-alt" href="/leads?cola=1" prefetch={false}><Users className="size-4 text-gold-700" aria-hidden="true" />Primer contacto</Link>}
        {permissions.activities && <Link className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-line bg-surface px-4 text-[13px] font-semibold text-navy-950 hover:bg-surface-alt" href="/tareas" prefetch={false}>Tareas <span className="rounded-full bg-surface-alt px-2 tabular-nums">{metricas.tareasPendientesCount}</span></Link>}
        {permissions.activities && <Link className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-line bg-surface px-4 text-[13px] font-semibold text-navy-950 hover:bg-surface-alt" href="/agenda" prefetch={false}><Clock className="size-4 text-gold-700" aria-hidden="true" />Citas hoy <span className="rounded-full bg-surface-alt px-2 tabular-nums">{metricas.citasHoyCount}</span></Link>}
        {!isBroker && mostrarDemo() && <Link className="inline-flex min-h-11 shrink-0 items-center rounded-full border border-line bg-surface px-4 text-[13px] font-semibold text-navy-950 hover:bg-surface-alt" href="/aprobaciones" prefetch={false}>Aprobaciones</Link>}
      </nav>

      {/* ── INDICADORES: tarjetas compactas; la tarjeta completa es el enlace ── */}
      <section aria-label="Indicadores operativos por rol" className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
        {(isAssistant ? [
          {label:"Leads sin asignar",value:metricas.leadsSinAsignarCount,help:"Requieren responsable",href:"/leads/asignacion",allowed:permissions.leads},
          {label:"Citas de hoy",value:metricas.citasHoyCount,help:"Agenda operativa",href:"/agenda",allowed:permissions.activities},
          {label:"Tareas pendientes",value:metricas.tareasPendientesCount,help:"Dentro de tu alcance",href:"/tareas",allowed:permissions.activities},
          {label:"Aprobaciones",value:"Consultar",help:"Contador aún no disponible",href:"/aprobaciones",allowed:true},
        ] : isBroker ? [
          {label:"Mis leads activos",value:metricas.misLeadsCount,help:"Tu cartera",href:"/leads",allowed:permissions.leads},
          {label:"Citas de la semana",value:metricas.citasSemanaCount,help:"En tu agenda",href:"/agenda",allowed:permissions.activities},
          {label:"Meta mensual",value:metricas.metaMesLabel,help:metricas.metaPorcentaje+"% · "+metricas.miNivel,href:"/metas",allowed:permissions.goals},
          {label:"Mi formación",value:metricas.academy?metricas.academy.progressPercent+"%":"Sin curso",help:"Progreso en Academy",href:"/academy",allowed:permissions.academy},
        ] : [
          {label:"Leads del mes",value:metricas.leadsMesCount,help:"Captaciones del mes",href:"/leads",allowed:permissions.leads},
          {label:"Negocios activos",value:metricas.negociosActivosCount,help:metricas.volumenPipelineDisplay,href:"/negocios",allowed:permissions.deals},
          {label:"Cierres del mes",value:metricas.cierresMesCount,help:"Negocios ganados",href:"/negocios",allowed:permissions.deals},
          {label:"Cierres / captaciones",value:metricas.conversionPorcentaje,help:"Poblaciones distintas, no cohorte",href:"/reportes",allowed:permissions.leads&&permissions.deals},
        ]).map(kpi=>kpi.allowed
          ? <Link key={kpi.label} href={kpi.href} prefetch={false} className="block min-w-0 rounded-xl transition-colors hover:[&>article]:border-gold-600/60"><ResumenCompacto etiqueta={kpi.label} valor={typeof kpi.value === "number" ? formatNumber(kpi.value) : kpi.value} detalle={kpi.help} className="h-full" /></Link>
          : <ResumenCompacto key={kpi.label} etiqueta={kpi.label} detalle="Sin permiso para este indicador." />)}
      </section>

      {/* ── CUADRÍCULA PRINCIPAL DE TRABAJO (2 Columnas) ───────────────────────── */}
      <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-12">
        {/* COLUMNA IZQUIERDA (7 Columnas): Leads Prioritarios y Embudo */}
        <div className="min-w-0 space-y-4 xl:col-span-7">
          {/* PANEL 1: LEADS QUE REQUIEREN ATENCIÓN INMEDIATA */}
          <div className="min-w-0 rounded-xl border border-line bg-surface p-4 sm:p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-line pb-3">
              <div className="min-w-0 flex-1">
                <h2 className="m-0 text-base sm:text-xl font-bold font-heading text-navy-950">
                  {isBroker ? "Mis leads prioritarios" : "Leads que requieren atención"}
                </h2>
              </div>
              <Link
                href="/leads"
                className="inline-flex min-h-12 shrink-0 items-center gap-1.5 rounded-lg px-2 text-[13px] font-semibold text-navy-900 transition-colors hover:bg-surface-alt"
              >
                <span className="whitespace-nowrap">Ver todos ({leads.length})</span>
                <ArrowRight className="size-4" />
              </Link>
            </div>

            {leads.length === 0 ? (
              <div className="text-center py-8 px-4 text-ink-muted text-sm space-y-2">
                <p>No hay leads pendientes en este momento.</p>
                {permissions.createLead && (
                  <Link href="/leads" prefetch={false} className="inline-flex min-h-12 items-center gap-1.5 text-sm font-bold text-gold-700 hover:underline">
                    <span>Crear un nuevo lead</span>
                    <ArrowRight className="size-4" />
                  </Link>
                )}
              </div>
            ) : (
              <div className="divide-y divide-line/70">
                {leads.slice(0, 5).map((lead) => {
                  const iniciales = lead.name
                    .split(" ")
                    .slice(0, 2)
                    .map((p) => p[0])
                    .join("")
                    .toUpperCase();

                  // El resumen trae el código del estado (`contacted`); se muestra su etiqueta.
                  const etapa = (ETIQUETAS_ESTADO as Record<string, string>)[lead.stage] ?? lead.stage;
                  const isNuevo = lead.stage === "new" || etapa === "Nuevo";
                  const isContactado = lead.stage === "contacted" || etapa === "Contactado";

                  return (
                    <div
                      key={lead.id}
                      className="grid min-w-0 gap-2 rounded-lg px-1 py-3 transition-colors hover:bg-surface-alt/70 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="size-10 rounded-full bg-navy-950 text-white font-bold font-heading text-xs flex items-center justify-center shrink-0 border border-gold-500/40 shadow-xs">
                          {iniciales}
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/leads/${lead.id}`} prefetch={false}
                            className="flex min-h-11 items-center break-words text-sm font-semibold text-navy-950 transition-colors hover:text-gold-700"
                          >
                            {lead.name}
                          </Link>
                          <p className="m-0 break-words text-[13px] text-ink-muted">
                            {lead.project} <span className="text-line-strong">·</span> {lead.source}
                          </p>
                        </div>
                      </div>

                      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 pl-[52px] sm:justify-end sm:pl-0">
                        <span
                          className={`max-w-full rounded-full border px-2.5 py-1 text-[13px] font-semibold ${
                            isNuevo
                              ? "bg-gold-50 text-gold-800 border-gold-600/30"
                              : isContactado
                              ? "bg-sky-50 text-sky-800 border-sky-300"
                              : "bg-surface-alt text-slate-700 border-line"
                          }`}
                        >
                          {etapa}
                        </span>

                        <span className="hidden max-w-[150px] break-words rounded-md bg-surface-alt px-2.5 py-1.5 text-[13px] font-medium text-ink-muted sm:inline-block">
                          {lead.next}
                        </span>

                        <a
                          href={`https://wa.me/?text=Hola%20${encodeURIComponent(lead.name)},%20te%20contacto%20de%20Quisqueya%20Home%20sobre%20el%20proyecto%20${encodeURIComponent(lead.project)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors"
                          title={`Chatear con ${lead.name} por WhatsApp`}
                          aria-label={`Chatear con ${lead.name} por WhatsApp`}
                        >
                          <MessageCircle className="size-4.5" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* PANEL 2: EMBUDO COMERCIAL POR ETAPA (Visual Sales Funnel) */}
          <div className="min-w-0 rounded-xl border border-line bg-surface p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-line pb-3">
              <div className="min-w-0 flex-1">
                <h2 className="m-0 text-base sm:text-xl font-bold font-heading text-navy-950">
                  Conversión de negocios
                </h2>
              </div>
              <Link
                href="/negocios"
                className="inline-flex min-h-12 items-center gap-1.5 px-3 rounded-lg text-[13px] font-bold text-navy-900 hover:text-gold-700 transition-colors"
              >
                <span className="whitespace-nowrap">Ver negocios</span>
                <ArrowRight className="size-4" />
              </Link>
            </div>

            {embudo.length === 0 ? (
              <p className="text-sm text-ink-muted py-4">Sin datos de embudo registrados.</p>
            ) : (
              <div className="space-y-3.5">
                {embudo.map((etapa) => {
                  const count = etapa.reachedCount;
                  const porcentajeAncho = etapa.widthPercent;

                  return (
                    <div key={etapa.stageId} className="space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[13px] font-semibold">
                        <span className="text-navy-950 font-bold">{etapa.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-ink-muted tabular-nums">{count}<span className="hidden sm:inline"> alcanzaron esta etapa</span></span>
                          {etapa.passRatePercent !== null && (
                            <span className="text-[13px] font-bold text-gold-900 bg-gold-50 px-2 py-0.5 rounded border border-gold-200 tabular-nums">
                              {etapa.passRatePercent}% pase
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 rounded-lg h-3 overflow-hidden p-0.5">
                        <div
                          className="h-full rounded-md bg-navy-900 transition-[width] duration-200 motion-reduce:transition-none"
                          style={{ width: `${porcentajeAncho}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA (5 Columnas): Agenda, Demanda & Formación */}
        <div className="min-w-0 space-y-4 xl:col-span-5">
          {/* PANEL 3: AGENDA DE HOY Y ACTIVIDADES */}
          <div className="min-w-0 rounded-xl border border-line bg-surface p-4 sm:p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-line pb-3">
              <div className="min-w-0 flex-1">
                <h2 className="m-0 text-base sm:text-xl font-bold font-heading text-navy-950">
                  Próximas actividades
                </h2>
              </div>
              <Link
                href="/agenda"
                className="inline-flex min-h-12 items-center gap-1.5 px-3 rounded-lg text-[13px] font-bold text-navy-900 hover:text-gold-700 transition-colors"
              >
                <span>Agenda</span>
                <ArrowRight className="size-4" />
              </Link>
            </div>

            {citas.length === 0 ? (
              <div className="text-center py-6 text-sm text-ink-muted">
                <p>Sin citas registradas para hoy.</p>
                <Link href="/agenda" prefetch={false} className="inline-flex min-h-12 items-center text-gold-700 font-bold hover:underline mt-1">
                  + Programar actividad
                </Link>
              </div>
            ) : (
              <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-line">
                {citas.map((cita) => {
                  const fecha = new Date(cita.startsAt);
                  const hora = isNaN(fecha.getTime())
                    ? "Sin hora registrada"
                    : fecha.toLocaleTimeString("es-DO", { hour: "2-digit", minute: "2-digit", timeZone: "America/Santo_Domingo" });

                  return (
                    <div key={cita.id} className="relative group">
                      <div className="absolute -left-[27px] top-1 size-3 rounded-full border-2 border-white bg-gold-600" />
                      
                      <div className="bg-surface-alt/80 hover:bg-surface-alt border border-line/80 rounded-xl p-3.5 transition-colors">
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1 text-[13px] font-bold text-gold-900 bg-gold-50 px-2.5 py-0.5 rounded-md border border-gold-200 tabular-nums">
                            <Clock className="size-3.5 text-gold-700" />
                            {hora}
                          </span>
                          <span className="min-w-0 break-words text-[13px] text-ink-muted">
                            {cita.location || "Sin ubicación registrada"}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-navy-950 leading-snug">
                          {cita.title}
                        </h3>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* PANEL 4: DEMANDA INMOBILIARIA Y RANKING */}
          <div className="min-w-0 rounded-xl border border-line bg-surface p-4 sm:p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-line pb-3">
              <div className="min-w-0 flex-1">
                <h2 className="m-0 text-base sm:text-xl font-bold font-heading text-navy-950">
                  {isBroker ? "Quisqueya Academy" : "Proyectos más cotizados"}
                </h2>
              </div>
              <Link
                href={isBroker ? "/academy" : "/propiedades"} prefetch={false}
                className="inline-flex min-h-12 items-center gap-1.5 px-3 rounded-lg text-[13px] font-bold text-navy-900 hover:text-gold-700 transition-colors"
              >
                <span>{isBroker ? "Cursos" : "Catálogo"}</span>
                <ArrowRight className="size-4" />
              </Link>
            </div>

            {isBroker ? (metricas.academy ? (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-navy-950 to-navy-900 text-white rounded-xl p-4 border border-gold-600/30">
                  <span className="text-[13px] uppercase font-bold tracking-wider text-gold-400">
                    Certificación en Progreso
                  </span>
                  <h3 className="text-base font-bold font-heading mt-1 mb-2">
                    {metricas.academy.title}
                  </h3>
                  <div className="flex items-center justify-between text-[13px] text-slate-300 mb-1.5">
                    <span>Avance del módulo</span>
                    <span className="font-bold text-gold-400 tabular-nums">{metricas.academy?.progressPercent || 0}%</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden mb-3">
                    <div
                      className="bg-gold-500 h-full rounded-full transition-all"
                      style={{ width: `${metricas.academy?.progressPercent || 0}%` }}
                    />
                  </div>
                  <Link
                    href="/academy"
                    className="inline-flex min-h-12 items-center justify-center w-full py-2.5 px-4 rounded-xl bg-gold-600 hover:bg-gold-500 text-navy-950 font-bold text-sm transition-colors"
                  >
                    Continuar en Quisqueya Academy LMS
                  </Link>
                </div>
              </div>
            ) : <p className="text-sm text-ink-muted">Sin cursos en progreso registrados.</p>) : proyectos.length === 0 ? (
              <p className="text-sm text-ink-muted py-4">Sin proyectos con demanda registrada.</p>
            ) : (
              <div className="space-y-3.5">
                {proyectos.map((proyecto, idx) => (
                  <div
                    key={proyecto.id}
                    className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-line bg-surface-alt/40 p-3 transition-colors hover:bg-surface-alt"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gold-100 font-heading text-[13px] font-bold text-gold-900">
                        #{idx + 1}
                      </span>
                      <div className="min-w-0">
                        <h4 className="m-0 break-words text-sm font-semibold text-navy-950">
                          {proyecto.name}
                        </h4>
                        <span className="text-[13px] text-ink-muted tabular-nums">
                          {formatNumber(proyecto.leads)} prospectos activos
                        </span>
                      </div>
                    </div>
                    <Link
                      href={`/propiedades`} prefetch={false}
                      className="inline-flex min-h-12 min-w-12 shrink-0 items-center justify-center rounded-lg border border-line bg-surface text-ink-muted transition-colors hover:border-gold-600 hover:text-navy-950"
                      title="Ver proyecto"
                      aria-label={`Ver catálogo de proyectos · ${proyecto.name}`}
                    >
                      <ArrowUpRight className="size-4.5" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
