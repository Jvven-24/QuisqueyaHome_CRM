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
      <header className="flex flex-col gap-3 border-b border-line/70 pb-4 sm:flex-row sm:items-end sm:justify-between">
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
      <nav aria-label="Pendientes de hoy" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 no-scrollbar">
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* COLUMNA IZQUIERDA (7 Columnas): Leads Prioritarios y Embudo */}
        <div className="lg:col-span-7 space-y-4 sm:space-y-6">
          {/* PANEL 1: LEADS QUE REQUIEREN ATENCIÓN INMEDIATA */}
          <div className="bg-surface border border-line rounded-2xl p-4 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-line mb-3">
              <div className="space-y-0.5">
                <span className="hidden text-[13px] font-bold uppercase tracking-wider text-gold-700 sm:block">
                  Acción Inmediata
                </span>
                <h2 className="m-0 text-base sm:text-xl font-bold font-heading text-navy-950">
                  {isBroker ? "Mis leads prioritarios" : "Leads que requieren atención"}
                </h2>
              </div>
              <Link
                href="/leads"
                className="inline-flex min-h-12 items-center gap-1.5 px-3 rounded-lg text-[13px] font-bold text-navy-900 hover:text-gold-700 transition-colors"
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
                      className="py-2.5 flex items-center justify-between gap-3 hover:bg-surface-alt/70 px-1 rounded-xl transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="size-10 rounded-full bg-navy-950 text-white font-bold font-heading text-xs flex items-center justify-center shrink-0 border border-gold-500/40 shadow-xs">
                          {iniciales}
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/leads/${lead.id}`} prefetch={false}
                            className="font-bold text-sm text-navy-950 hover:text-gold-700 transition-colors block break-words"
                          >
                            {lead.name}
                          </Link>
                          <p className="text-[13px] text-ink-muted truncate">
                            {lead.project} <span className="text-line-strong">·</span> {lead.source}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        <span
                          className={`text-[13px] font-bold px-2.5 py-1 rounded-full border ${
                            isNuevo
                              ? "bg-gold-50 text-gold-800 border-gold-600/30"
                              : isContactado
                              ? "bg-sky-50 text-sky-800 border-sky-300"
                              : "bg-surface-alt text-slate-700 border-line"
                          }`}
                        >
                          {etapa}
                        </span>

                        <span className="hidden sm:inline-block text-[13px] text-slate-700 bg-slate-100 px-2.5 py-1.5 rounded-md font-medium max-w-[150px] truncate">
                          {lead.next}
                        </span>

                        <a
                          href={`https://wa.me/?text=Hola%20${encodeURIComponent(lead.name)},%20te%20contacto%20de%20Quisqueya%20Home%20sobre%20el%20proyecto%20${encodeURIComponent(lead.project)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors"
                          title={`Chatear con ${lead.name} por WhatsApp`}
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
          <div className="bg-surface border border-line rounded-2xl p-4 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-line mb-4">
              <div className="space-y-0.5">
                <span className="hidden text-[13px] font-bold uppercase tracking-wider text-gold-700 sm:block">
                  Embudo de Ventas
                </span>
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
                      <div className="flex items-center justify-between text-[13px] font-semibold">
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
                          className="bg-gradient-to-r from-navy-900 via-navy-800 to-gold-600 h-full rounded-md transition-all duration-500"
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
        <div className="lg:col-span-5 space-y-4 sm:space-y-6">
          {/* PANEL 3: AGENDA DE HOY Y ACTIVIDADES */}
          <div className="bg-surface border border-line rounded-2xl p-4 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-line mb-3">
              <div className="space-y-0.5">
                <span className="hidden text-[13px] font-bold uppercase tracking-wider text-gold-700 sm:block">
                  Agenda del Día
                </span>
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
                      <div className="absolute -left-[27px] top-1 size-3 rounded-full bg-gold-600 border-2 border-white shadow-xs group-hover:scale-125 transition-transform" />
                      
                      <div className="bg-surface-alt/80 hover:bg-surface-alt border border-line/80 rounded-xl p-3.5 transition-colors">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="inline-flex items-center gap-1 text-[13px] font-bold text-gold-900 bg-gold-50 px-2.5 py-0.5 rounded-md border border-gold-200 tabular-nums">
                            <Clock className="size-3.5 text-gold-700" />
                            {hora}
                          </span>
                          <span className="text-[13px] text-ink-muted">
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
          <div className="bg-surface border border-line rounded-2xl p-4 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-line mb-3">
              <div className="space-y-0.5">
                <span className="hidden text-[13px] font-bold uppercase tracking-wider text-gold-700 sm:block">
                  {isBroker ? "Formación Continua" : "Demanda de Proyectos"}
                </span>
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
                    className="flex items-center justify-between p-3 rounded-xl border border-line bg-surface-alt/40 hover:bg-surface-alt transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="size-8 rounded-lg bg-gold-100 text-gold-900 font-black text-[13px] flex items-center justify-center font-heading">
                        #{idx + 1}
                      </span>
                      <div>
                        <h4 className="font-bold text-sm text-navy-950">
                          {proyecto.name}
                        </h4>
                        <span className="text-[13px] text-ink-muted tabular-nums">
                          {formatNumber(proyecto.leads)} prospectos activos
                        </span>
                      </div>
                    </div>
                    <Link
                      href={`/propiedades`} prefetch={false}
                      className="inline-flex min-h-12 min-w-12 rounded-xl bg-white border border-line items-center justify-center text-slate-600 hover:text-navy-950 hover:border-gold-600 transition-colors shadow-2xs"
                      title="Ver proyecto"
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
