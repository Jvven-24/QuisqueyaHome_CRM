"use client";

import Link from "next/link";
import type { DashboardMetrics } from "@/application/dashboard/puertos";
import { formatNumber } from "@/lib/formato-analitica";
import {
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  Building2,
  CheckCircle2,
  Clock,
  Compass,
  GraduationCap,
  MessageCircle,
  Percent,
  Plus,
  Sparkles,
  TrendingUp,
  Trophy,
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
  const isAssistant = roleSlug === "assistant";

  const leads = metricas.leadsRecientes ?? [];
  const citas = metricas.activities ?? [];
  const embudo = metricas.funnel ?? [];
  const proyectos = metricas.projects ?? [];

  const maxAlcanzado = Math.max(...embudo.map((e) => e.reachedCount || e.count || 1), 1);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* ── CABECERA EJECUTIVA QUISQUEYA DESK ─────────────────────────────────── */}
      <section className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pb-6 border-b border-line/70">
        <div className="space-y-1.5 max-w-3xl">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-bold tracking-wider uppercase bg-gold-50 text-gold-800 border border-gold-600/30">
              <Sparkles className="size-3.5 text-gold-600" />
              Operación Inmobiliaria Privada
            </span>
            <span className="text-sm text-ink-muted">·</span>
            <span className="text-[13px] font-semibold text-navy-800/80">
              {metricas.fechaTexto || "Jornada actual"}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-navy-950 tracking-tight font-heading">
            {isBroker ? "Hola, " : "Buenos días, "}
            <span className="text-gold-700">{nombre?.trim() || "Usuario"}</span>
          </h1>
          <p className="text-sm sm:text-base text-ink-muted leading-relaxed">
            {isBroker
              ? "Tu cartera activa, próximas acciones de seguimiento y avance hacia tu meta comercial."
              : "Consola de control patrimonial: prioridades comerciales, conversión del embudo y actividad del equipo."}
          </p>
        </div>

        {/* Acciones Rápidas Primarias */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {permissions.createLead && (
            <Link
              href="/leads"
              className="inline-flex min-h-12 items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-navy-950 text-white hover:bg-navy-900 border border-white/10 shadow-sm font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="size-4 text-gold-400" />
              <span>Registrar Lead</span>
            </Link>
          )}

          {permissions.deals && (
            <Link
              href="/negocios"
              className="inline-flex min-h-12 items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-surface border border-line hover:border-gold-600/50 hover:bg-surface-alt text-navy-950 font-bold text-sm shadow-2xs transition-all"
            >
              <Briefcase className="size-4 text-navy-700" />
              <span>Tablero de Negocios</span>
            </Link>
          )}
        </div>
      </section>

      {/* ── 4 TARJETAS KPI MAESTRAS (Banca Patrimonial & Luxury Style) ──────────── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* KPI 1 */}
        <div className="bg-surface border border-line rounded-2xl p-5 shadow-xs hover:border-gold-600/40 hover:shadow-md transition-all group relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] font-bold uppercase tracking-wider text-ink-muted group-hover:text-gold-700 transition-colors">
              {isBroker ? "Mis Leads Activos" : isAssistant ? "Leads sin Asignar" : "Leads del Mes"}
            </span>
            <div className="size-10 rounded-xl bg-navy-100/70 text-navy-900 flex items-center justify-center">
              <Users className="size-5 text-navy-800" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-navy-950 tracking-tight font-heading tabular-nums">
              {formatNumber(isBroker ? metricas.misLeadsCount : isAssistant ? metricas.leadsSinAsignarCount : metricas.leadsMesCount)}
            </span>
            <span className="inline-flex items-center gap-1 text-[13px] font-bold text-success bg-success-bg px-2.5 py-1 rounded-md">
              <TrendingUp className="size-3.5" />
              Activos
            </span>
          </div>
          <p className="text-[13px] text-ink-muted">
            {isBroker ? "Cartera asignada con seguimiento" : isAssistant ? "Requieren asignación a broker" : "Captación consolidada del equipo"}
          </p>
        </div>

        {/* KPI 2 */}
        <div className="bg-surface border border-line rounded-2xl p-5 shadow-xs hover:border-gold-600/40 hover:shadow-md transition-all group relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] font-bold uppercase tracking-wider text-ink-muted group-hover:text-gold-700 transition-colors">
              {isBroker ? "Citas Esta Semana" : "Negocios Activos"}
            </span>
            <div className="size-10 rounded-xl bg-gold-100 text-gold-900 flex items-center justify-center">
              <Briefcase className="size-5 text-gold-700" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-navy-950 tracking-tight font-heading tabular-nums">
              {isBroker ? formatNumber(metricas.citasSemanaCount) : formatNumber(metricas.negociosActivosCount)}
            </span>
            <span className="text-[13px] font-bold text-gold-900 bg-gold-100 px-2.5 py-1 rounded-md border border-gold-200">
              {metricas.volumenPipelineDisplay || "Activos"}
            </span>
          </div>
          <p className="text-[13px] text-ink-muted">
            {isBroker ? "Citas registradas en agenda" : "Volumen en negociación abierta"}
          </p>
        </div>

        {/* KPI 3 */}
        <div className="bg-surface border border-line rounded-2xl p-5 shadow-xs hover:border-gold-600/40 hover:shadow-md transition-all group relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] font-bold uppercase tracking-wider text-ink-muted group-hover:text-gold-700 transition-colors">
              {isBroker ? "Meta Mensual" : "Cierres del Mes"}
            </span>
            <div className="size-10 rounded-xl bg-navy-100/70 text-navy-900 flex items-center justify-center">
              <Trophy className="size-5 text-navy-800" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-navy-950 tracking-tight font-heading tabular-nums">
              {isBroker ? metricas.metaMesLabel : formatNumber(metricas.cierresMesCount)}
            </span>
            <span className="text-[13px] font-bold text-navy-800 bg-navy-100 px-2.5 py-1 rounded-md">
              {isBroker ? `${metricas.metaPorcentaje}%` : "Cierres ganados"}
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mt-1 mb-1.5">
            <div
              className="bg-gradient-to-r from-gold-600 to-gold-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(isBroker ? metricas.metaPorcentaje : (metricas.cierresMesCount * 10), 100)}%` }}
            />
          </div>
          <p className="text-[13px] text-ink-muted">
            {isBroker ? `${metricas.miNivel}` : "Unidades con contrato cerrado"}
          </p>
        </div>

        {/* KPI 4 */}
        <div className="bg-surface border border-line rounded-2xl p-5 shadow-xs hover:border-gold-600/40 hover:shadow-md transition-all group relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] font-bold uppercase tracking-wider text-ink-muted group-hover:text-gold-700 transition-colors">
              {isBroker ? "Mi Formación" : "Tasa de Conversión"}
            </span>
            <div className="size-10 rounded-xl bg-success-bg text-success flex items-center justify-center">
              <Percent className="size-5 text-success" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-navy-950 tracking-tight font-heading tabular-nums">
              {isBroker ? (metricas.academy ? `${metricas.academy.progressPercent}%` : "Al día") : metricas.conversionPorcentaje}
            </span>
            <span className="inline-flex items-center gap-1 text-[13px] font-bold text-success bg-success-bg px-2.5 py-1 rounded-md">
              <CheckCircle2 className="size-3.5" />
              Efectiva
            </span>
          </div>
          <p className="text-[13px] text-ink-muted">
            {isBroker ? "Progreso en Quisqueya Academy" : "Cierres sobre captaciones"}
          </p>
        </div>
      </section>

      {/* ── BANDEJA DE ACCESOS RÁPIDOS OPERATIVOS ─────────────────────────────── */}
      <section className="bg-gradient-to-r from-navy-950 to-navy-900 border border-gold-600/30 rounded-2xl p-4 sm:p-5 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-xl bg-gold-600/20 border border-gold-500/40 flex items-center justify-center shrink-0">
              <Compass className="size-5 text-gold-400" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold font-heading text-white">
                Accesos Directos de la Jornada
              </h2>
              <p className="text-[13px] text-slate-300">
                Herramientas rápidas para acelerar tu gestión comercial diaria.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/leads"
              className="inline-flex min-h-12 items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-[13px] font-semibold text-white transition-colors"
            >
              <Users className="size-4 text-gold-400" />
              Bandeja de Leads
            </Link>
            <Link
              href="/negocios"
              className="inline-flex min-h-12 items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-[13px] font-semibold text-white transition-colors"
            >
              <Briefcase className="size-4 text-gold-400" />
              Negocios en Curso
            </Link>
            <Link
              href="/propiedades"
              className="inline-flex min-h-12 items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-[13px] font-semibold text-white transition-colors"
            >
              <Building2 className="size-4 text-gold-400" />
              Inventario de Propiedades
            </Link>
            <Link
              href="/academy"
              className="inline-flex min-h-12 items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-[13px] font-semibold text-white transition-colors"
            >
              <GraduationCap className="size-4 text-gold-400" />
              Academy LMS (Moodle)
            </Link>
            <Link
              href="/comunicaciones"
              className="inline-flex min-h-12 items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-[13px] font-semibold text-white transition-colors"
            >
              <MessageCircle className="size-4 text-emerald-400" />
              Plantillas WhatsApp
            </Link>
          </div>
        </div>
      </section>

      {/* ── CUADRÍCULA PRINCIPAL DE TRABAJO (2 Columnas) ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        {/* COLUMNA IZQUIERDA (7 Columnas): Leads Prioritarios y Embudo */}
        <div className="lg:col-span-7 space-y-6 sm:space-y-8">
          {/* PANEL 1: LEADS QUE REQUIEREN ATENCIÓN INMEDIATA */}
          <div className="bg-surface border border-line rounded-2xl p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-line mb-4">
              <div className="space-y-0.5">
                <span className="text-[13px] font-bold uppercase tracking-wider text-gold-700">
                  Acción Inmediata
                </span>
                <h2 className="text-lg sm:text-xl font-bold font-heading text-navy-950">
                  {isBroker ? "Mis Leads Prioritarios" : "Leads que Requieren Atención"}
                </h2>
              </div>
              <Link
                href="/leads"
                className="inline-flex min-h-12 items-center gap-1.5 px-3 rounded-lg text-[13px] font-bold text-navy-900 hover:text-gold-700 transition-colors"
              >
                <span>Ver todos ({leads.length})</span>
                <ArrowRight className="size-4" />
              </Link>
            </div>

            {leads.length === 0 ? (
              <div className="text-center py-8 px-4 text-ink-muted text-sm space-y-2">
                <p>No hay leads pendientes en este momento.</p>
                {permissions.createLead && (
                  <Link href="/leads" className="inline-flex min-h-12 items-center gap-1.5 text-sm font-bold text-gold-700 hover:underline">
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

                  const isNuevo = lead.stage === "Nuevo";
                  const isContactado = lead.stage === "Contactado";

                  return (
                    <div
                      key={lead.id}
                      className="py-3.5 flex items-center justify-between gap-3 hover:bg-surface-alt/70 px-2 rounded-xl transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="size-10 rounded-full bg-navy-950 text-white font-bold font-heading text-xs flex items-center justify-center shrink-0 border border-gold-500/40 shadow-xs">
                          {iniciales}
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/leads?lead=${lead.id}`}
                            className="font-bold text-sm text-navy-950 hover:text-gold-700 transition-colors block truncate"
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
                          {lead.stage}
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
          <div className="bg-surface border border-line rounded-2xl p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-line mb-5">
              <div className="space-y-0.5">
                <span className="text-[13px] font-bold uppercase tracking-wider text-gold-700">
                  Embudo de Ventas
                </span>
                <h2 className="text-lg sm:text-xl font-bold font-heading text-navy-950">
                  Conversión de Negocios
                </h2>
              </div>
              <Link
                href="/negocios"
                className="inline-flex min-h-12 items-center gap-1.5 px-3 rounded-lg text-[13px] font-bold text-navy-900 hover:text-gold-700 transition-colors"
              >
                <span>Ver Negocios</span>
                <ArrowRight className="size-4" />
              </Link>
            </div>

            {embudo.length === 0 ? (
              <p className="text-sm text-ink-muted py-4">Sin datos de embudo registrados.</p>
            ) : (
              <div className="space-y-3.5">
                {embudo.map((etapa) => {
                  const count = etapa.count ?? etapa.reachedCount ?? 0;
                  const porcentajeAncho = Math.max(Math.round((count / maxAlcanzado) * 100), 8);

                  return (
                    <div key={etapa.stageId} className="space-y-1">
                      <div className="flex items-center justify-between text-[13px] font-semibold">
                        <span className="text-navy-950 font-bold">{etapa.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-ink-muted tabular-nums">{count} negocios</span>
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
        <div className="lg:col-span-5 space-y-6 sm:space-y-8">
          {/* PANEL 3: AGENDA DE HOY Y ACTIVIDADES */}
          <div className="bg-surface border border-line rounded-2xl p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-line mb-4">
              <div className="space-y-0.5">
                <span className="text-[13px] font-bold uppercase tracking-wider text-gold-700">
                  Agenda del Día
                </span>
                <h2 className="text-lg sm:text-xl font-bold font-heading text-navy-950">
                  Próximas Actividades
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
                <Link href="/agenda" className="inline-flex min-h-12 items-center text-gold-700 font-bold hover:underline mt-1">
                  + Programar actividad
                </Link>
              </div>
            ) : (
              <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-line">
                {citas.map((cita) => {
                  const fecha = new Date(cita.startsAt);
                  const hora = isNaN(fecha.getTime())
                    ? "10:00 AM"
                    : fecha.toLocaleTimeString("es-DO", { hour: "2-digit", minute: "2-digit" });

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
                            {cita.location || "Santo Domingo"}
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
          <div className="bg-surface border border-line rounded-2xl p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-line mb-4">
              <div className="space-y-0.5">
                <span className="text-[13px] font-bold uppercase tracking-wider text-gold-700">
                  {isBroker ? "Formación Continua" : "Demanda de Proyectos"}
                </span>
                <h2 className="text-lg sm:text-xl font-bold font-heading text-navy-950">
                  {isBroker ? "Quisqueya Academy" : "Proyectos más Cotizados"}
                </h2>
              </div>
              <Link
                href={isBroker ? "/academy" : "/propiedades"}
                className="inline-flex min-h-12 items-center gap-1.5 px-3 rounded-lg text-[13px] font-bold text-navy-900 hover:text-gold-700 transition-colors"
              >
                <span>{isBroker ? "Cursos" : "Catálogo"}</span>
                <ArrowRight className="size-4" />
              </Link>
            </div>

            {isBroker ? (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-navy-950 to-navy-900 text-white rounded-xl p-4 border border-gold-600/30">
                  <span className="text-[13px] uppercase font-bold tracking-wider text-gold-400">
                    Certificación en Progreso
                  </span>
                  <h3 className="text-base font-bold font-heading mt-1 mb-2">
                    {metricas.academy?.title || "Certificación Oficial Quisqueya Academy"}
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
            ) : proyectos.length === 0 ? (
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
                      href={`/propiedades`}
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
