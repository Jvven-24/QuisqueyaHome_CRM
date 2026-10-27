"use client";
import { Checkbox } from "@/components/ui/checkbox";
import { ResumenCompacto } from "@/components/ui/resumen-compacto";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import type { BrokerLevel } from "@/domain/catalogs";
import { BROKER_LEVEL_LABELS } from "@/domain/cierre-negocio";
import { FormularioUsuario, type RolOpcion } from "../configuracion/_usuarios";
import { formatearMonto } from "../_ui/formato";
import { Avatar, Badge, Modal, PageHeader } from "../_ui/prototipo-ui";
import { Vacio } from "../_ui/estados";
import {
  Award,
  Briefcase,
  DollarSign,
  LayoutGrid,
  List,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";

export type BrokerFila = {
  userId: number;
  fullName: string;
  email?: string;
  jobTitle: string;
  specialty: string | null;
  level: BrokerLevel;
  annualSalesCents: number;
  negociosActivos: number;
  /** `null` = sin meta fijada este mes (`domain/metas.ts#cumplimientoPorcentaje`). */
  porcentajeMeta: number | null;
  targetDeals?: number;
  achievedDeals?: number;
};

export type ProyectoAsignable = { id: number; name: string; brokerId: number | null; brokerName: string | null };

const LEVEL_ORDER: BrokerLevel[] = ["junior", "senior", "senior_plus", "top_producer", "top_leader"];

const LEVEL_STYLES: Record<
  BrokerLevel,
  { label: string; tone: "neutral" | "gold" | "green" | "blue"; accent: string; badgeCls: string }
> = {
  junior: {
    label: "Junior",
    tone: "neutral",
    accent: "border-slate-200 bg-slate-50 text-slate-700",
    badgeCls: "bg-slate-100 text-slate-800 border-slate-300",
  },
  senior: {
    label: "Senior",
    tone: "blue",
    accent: "border-blue-200 bg-blue-50/50 text-blue-800",
    badgeCls: "bg-blue-50 text-blue-700 border-blue-200 font-semibold",
  },
  senior_plus: {
    label: "Senior+",
    tone: "blue",
    accent: "border-indigo-200 bg-indigo-50/50 text-indigo-800",
    badgeCls: "bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold",
  },
  top_producer: {
    label: "Top Producer",
    tone: "gold",
    accent: "border-gold-300 bg-gold-50/60 text-gold-900",
    badgeCls: "bg-gold-100 text-gold-900 border-gold-400 font-bold",
  },
  top_leader: {
    label: "Top Leader",
    tone: "gold",
    accent: "border-amber-400 bg-amber-50/80 text-amber-950",
    badgeCls: "bg-amber-100 text-amber-950 border-amber-400 font-extrabold shadow-2xs",
  },
};

/**
 * M7 · Brokers — Roster ejecutivo de la fuerza comercial, Leaderboard de Honor y Co-Broking.
 * Cumple: Controles >= 44-48px, texto >= 13px, foco gold-700, sin alerts nativos, regla multimoneda M22.
 */
export function BrokersVista({
  brokers,
  puedeAsignar,
  puedeInvitar,
  proyectosAsignables,
  roles,
}: {
  brokers: BrokerFila[];
  puedeAsignar: boolean;
  puedeInvitar: boolean;
  proyectosAsignables: ProyectoAsignable[];
  roles: RolOpcion[];
}) {
  const searchParams = useSearchParams();
  const [invitando, setInvitando] = useState(() => puedeInvitar && searchParams.get("invitar") === "1");
  const [asignando, setAsignando] = useState<BrokerFila | null>(null);
  const [modoRoster, setModoRoster] = useState<"tarjetas" | "tabla" | "leaderboard">("tarjetas");
  const [filtroTexto, setFiltroTexto] = useState("");
  const [nivelSeleccionado, setNivelSeleccionado] = useState<BrokerLevel | "todos">("todos");

  // Métricas maestras del equipo comercial visible
  const resumen = useMemo(() => {
    const totalBrokers = brokers.length;
    const carteraTotal = brokers.reduce((sum, b) => sum + b.negociosActivos, 0);
    const volumenTotalCents = brokers.reduce((sum, b) => sum + b.annualSalesCents, 0);
    const conMeta = brokers.filter((b) => b.porcentajeMeta !== null);
    const cumplimientoPromedio =
      conMeta.length > 0 ? Math.round(conMeta.reduce((sum, b) => sum + (b.porcentajeMeta ?? 0), 0) / conMeta.length) : null;

    return { totalBrokers, carteraTotal, volumenTotalCents, cumplimientoPromedio };
  }, [brokers]);

  // Filtrado reactivo en cliente
  const brokersFiltrados = useMemo(() => {
    return brokers.filter((broker) => {
      const matchNivel = nivelSeleccionado === "todos" || broker.level === nivelSeleccionado;
      const textoLower = filtroTexto.toLowerCase().trim();
      const matchTexto =
        !textoLower ||
        broker.fullName.toLowerCase().includes(textoLower) ||
        (broker.specialty ?? "").toLowerCase().includes(textoLower) ||
        broker.jobTitle.toLowerCase().includes(textoLower);
      return matchNivel && matchTexto;
    });
  }, [brokers, nivelSeleccionado, filtroTexto]);

  const rankingHonor = useMemo(() => {
    return [...brokersFiltrados].sort(
      (a, b) => b.annualSalesCents - a.annualSalesCents || (b.porcentajeMeta ?? 0) - (a.porcentajeMeta ?? 0),
    );
  }, [brokersFiltrados]);

  return (
    <>
      <PageHeader
        eyebrow="Equipo y Asesoría"
        title="Brokers y Asesores"
        subtitle="Equipo comercial, niveles de desarrollo profesional y clasificación de asesores."
        action={
          <div className="flex flex-wrap items-center gap-2.5">
            {puedeInvitar && (
              <button
                className="inline-flex items-center justify-center gap-2 px-5 min-h-[46px] rounded-xl bg-navy-950 hover:bg-navy-900 text-white text-[13.5px] font-semibold tracking-wide border border-gold-500/30 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-gold-700 focus:border-gold-700 cursor-pointer"
                type="button"
                onClick={() => setInvitando(true)}
              >
                <Plus className="size-4 text-gold-400" />
                <span>Invitar broker</span>
              </button>
            )}
          </div>
        }
      />

      {/* KPI Maestros del Equipo Comercial */}
      <section aria-label="Indicadores del equipo comercial" className="grid grid-cols-2 gap-3 mb-6 xl:grid-cols-4">
        <ResumenCompacto etiqueta="Fuerza Comercial" valor={resumen.totalBrokers} detalle="Asesores activos en roster" icono={<Users className="size-5 text-navy-800" />} />
        <ResumenCompacto etiqueta="Cartera en Gestión" valor={resumen.carteraTotal} detalle="Negocios activos asignados" icono={<Briefcase className="size-5 text-blue-700" />} />
        <ResumenCompacto etiqueta="Volumen Acumulado" valor={formatearMonto(resumen.volumenTotalCents, "USD")} detalle="Ventas cerradas del año (USD)" icono={<DollarSign className="size-5 text-gold-800" />} />
        <ResumenCompacto etiqueta="Cumplimiento Medio" valor={resumen.cumplimientoPromedio === null ? "—" : `${resumen.cumplimientoPromedio}%`} detalle="Avance contra metas del mes" icono={<TrendingUp className="size-5 text-emerald-700" />} />
      </section>

      {/* Escala Interactiva de Carrera */}
      <div className="bg-surface border border-line/80 rounded-2xl p-4 md:p-5 mb-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Award className="size-5 text-gold-600 shrink-0" />
            <div>
              <h2 className="text-[14px] font-bold text-navy-950 m-0">Niveles de Carrera y Escalamiento</h2>
              <p className="text-[13px] text-ink-muted m-0">
                Filtra por jerarquía para evaluar la distribución del talento.
              </p>
            </div>
          </div>

          <div className="flex min-w-0 max-w-full items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <button
              type="button"
              onClick={() => setNivelSeleccionado("todos")}
              className={`px-3.5 min-h-[44px] rounded-xl text-[13px] font-semibold border transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold-700 ${
                nivelSeleccionado === "todos"
                  ? "bg-navy-950 text-white border-navy-950 shadow-xs"
                  : "bg-surface-alt hover:bg-navy-100 text-ink-muted border-line"
              }`}
            >
              Todos ({brokers.length})
            </button>
            {LEVEL_ORDER.map((nivel) => {
              const cant = brokers.filter((b) => b.level === nivel).length;
              const activo = nivelSeleccionado === nivel;
              return (
                <button
                  key={nivel}
                  type="button"
                  onClick={() => setNivelSeleccionado(nivel)}
                  className={`px-3.5 min-h-[44px] rounded-xl text-[13px] font-semibold border whitespace-nowrap transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold-700 ${
                    activo
                      ? "bg-gold-600 text-white border-gold-600 shadow-xs"
                      : "bg-surface-alt hover:bg-navy-100 text-ink-muted border-line"
                  }`}
                >
                  {BROKER_LEVEL_LABELS[nivel]} ({cant})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Barra de Búsqueda, Selector de Vista y Filtros Rápidos */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 mb-6">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-ink-muted pointer-events-none" />
          <input
            type="text"
            value={filtroTexto}
            onChange={(e) => setFiltroTexto(e.target.value)}
            placeholder="Buscar asesor por nombre, especialidad o cargo…"
            className="w-full min-h-[46px] pl-10 pr-4 rounded-xl border border-line bg-surface text-[13.5px] text-navy-950 placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-gold-700 focus:border-gold-700 transition-colors shadow-2xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="inline-flex rounded-xl bg-surface-alt p-1 border border-line">
            <button
              type="button"
              onClick={() => setModoRoster("tarjetas")}
              className={`min-h-[38px] px-3 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-colors ${
                modoRoster === "tarjetas" ? "bg-navy-950 text-white" : "text-ink-muted hover:text-navy-950"
              }`}
            >
              <LayoutGrid className="size-3.5" />
              Tarjetas
            </button>
            <button
              type="button"
              onClick={() => setModoRoster("tabla")}
              className={`min-h-[38px] px-3 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-colors ${
                modoRoster === "tabla" ? "bg-navy-950 text-white" : "text-ink-muted hover:text-navy-950"
              }`}
            >
              <List className="size-3.5" />
              Tabla
            </button>
            <button
              type="button"
              onClick={() => setModoRoster("leaderboard")}
              className={`min-h-[38px] px-3 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-colors ${
                modoRoster === "leaderboard" ? "bg-navy-950 text-white" : "text-ink-muted hover:text-navy-950"
              }`}
            >
              <Trophy className="size-3.5 text-gold-500" />
              Leaderboard
            </button>
          </div>

          <div className="text-[13px] text-ink-muted shrink-0">
            Mostrando <strong className="text-navy-950">{brokersFiltrados.length}</strong> de{" "}
            <strong className="text-navy-950">{brokers.length}</strong> asesores
          </div>
        </div>
      </div>

      {/* Roster de Brokers según vista seleccionada */}
      {brokersFiltrados.length === 0 ? (
        <Vacio
          titulo="Sin brokers encontrados"
          texto={
            filtroTexto || nivelSeleccionado !== "todos"
              ? "No hay asesores comerciales que coincidan con los criterios de búsqueda seleccionados."
              : "No hay brokers activos con perfil para este alcance."
          }
        />
      ) : modoRoster === "tabla" ? (
        <div className="bg-surface border border-line rounded-2xl overflow-x-auto shadow-xs">
          <table className="w-full text-left border-collapse text-[13.5px]">
            <thead>
              <tr className="border-b border-line bg-surface-alt/70 text-xs font-bold uppercase tracking-wider text-ink-muted">
                <th className="p-4">Asesor Comercial</th>
                <th className="p-4">Nivel Carrera</th>
                <th className="p-4">Especialidad</th>
                <th className="p-4 text-right">Cartera Activa</th>
                <th className="p-4 text-right">Ventas Anuales</th>
                <th className="p-4 text-right">Meta Mensual</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {brokersFiltrados.map((broker) => {
                const nivelInfo = LEVEL_STYLES[broker.level];
                const porcentaje = broker.porcentajeMeta ?? 0;
                return (
                  <tr key={broker.userId} className="hover:bg-surface-alt/40 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={broker.fullName} small />
                        <div>
                          <div className="font-bold text-navy-950">{broker.fullName}</div>
                          <div className="text-xs text-ink-muted">{broker.jobTitle}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs border ${nivelInfo.badgeCls}`}>
                        {nivelInfo.label}
                      </span>
                    </td>
                    <td className="p-4 text-navy-950">{broker.specialty ?? "General"}</td>
                    <td className="p-4 text-right font-bold tabular-nums text-navy-950">
                      {broker.negociosActivos} negocios
                    </td>
                    <td className="p-4 text-right font-black tabular-nums text-navy-950">
                      {formatearMonto(broker.annualSalesCents, "USD")}
                    </td>
                    <td className="p-4 text-right font-bold tabular-nums">
                      {broker.porcentajeMeta === null ? "—" : `${porcentaje}%`}
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        href={`/brokers/${broker.userId}`}
                        className="inline-flex items-center justify-center min-h-[38px] px-3 rounded-lg border border-line bg-surface hover:bg-surface-alt text-xs font-bold text-navy-950"
                      >
                        Ver perfil
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : modoRoster === "leaderboard" ? (
        <div className="space-y-4">
          {/* Podio Top 3 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {rankingHonor.slice(0, 3).map((b, idx) => (
              <div
                key={b.userId}
                className={`p-5 rounded-2xl border shadow-xs flex items-center justify-between ${
                  idx === 0
                    ? "bg-navy-950 text-white border-gold-500"
                    : "bg-surface text-navy-950 border-line"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`size-10 rounded-xl font-black text-base flex items-center justify-center ${
                      idx === 0
                        ? "bg-gold-500 text-navy-950"
                        : idx === 1
                        ? "bg-slate-200 text-slate-800"
                        : "bg-amber-100 text-amber-900"
                    }`}
                  >
                    #{idx + 1}
                  </div>
                  <div>
                    <div className={`font-bold text-base ${idx === 0 ? "text-white" : "text-navy-950"}`}>
                      {b.fullName}
                    </div>
                    <div className={`text-xs ${idx === 0 ? "text-gold-400" : "text-ink-muted"}`}>
                      {LEVEL_STYLES[b.level].label} · {b.specialty ?? "General"}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-black text-lg tabular-nums ${idx === 0 ? "text-gold-400" : "text-navy-950"}`}>
                    {formatearMonto(b.annualSalesCents, "USD")}
                  </div>
                  <div className={`text-xs ${idx === 0 ? "text-white/80" : "text-ink-muted"}`}>
                    Meta: {b.porcentajeMeta === null ? "Sin meta" : `${b.porcentajeMeta}%`}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Lista completa de clasificación */}
          <div className="bg-surface border border-line rounded-2xl divide-y divide-line">
            {rankingHonor.map((b, idx) => (
              <div key={b.userId} className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="w-7 text-xs font-extrabold text-ink-muted tabular-nums">#{idx + 1}</span>
                  <Avatar name={b.fullName} small />
                  <div>
                    <div className="font-bold text-sm text-navy-950">{b.fullName}</div>
                    <div className="text-xs text-ink-muted">
                      {b.negociosActivos} negocios activos · Meta mensual {b.porcentajeMeta === null ? "sin asignar" : `${b.porcentajeMeta}%`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <strong className="font-black text-sm text-navy-950 tabular-nums">
                    {formatearMonto(b.annualSalesCents, "USD")}
                  </strong>
                  <Link
                    href={`/brokers/${b.userId}`}
                    className="text-xs font-bold text-gold-700 hover:underline"
                  >
                    Perfil →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {brokersFiltrados.map((broker) => {
            const nivelInfo = LEVEL_STYLES[broker.level];
            const esElite = broker.level === "top_producer" || broker.level === "top_leader";
            const porcentaje = broker.porcentajeMeta ?? 0;

            return (
              <article
                className={`group relative bg-surface border rounded-2xl p-6 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between ${
                  esElite ? "border-gold-400/70 hover:border-gold-500" : "border-line/80 hover:border-gold-500/50"
                }`}
                key={broker.userId}
              >
                {/* Cabecera de la tarjeta con foto/avatar y nivel */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3.5">
                      <div className="relative">
                        <Avatar name={broker.fullName} />
                        {esElite && (
                          <span
                            className="absolute -bottom-1 -right-1 size-5 rounded-full bg-gold-600 text-white flex items-center justify-center border-2 border-white shadow-2xs"
                            title="Asesor Élite"
                          >
                            <Sparkles className="size-2.5" />
                          </span>
                        )}
                      </div>
                      <div>
                        <h2 className="font-heading font-bold text-lg text-navy-950 leading-snug group-hover:text-gold-700 transition-colors m-0">
                          {broker.fullName}
                        </h2>
                        <p className="text-[13px] text-ink-muted leading-tight mt-0.5 mb-0">
                          {broker.jobTitle}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[13px] border ${nivelInfo.badgeCls}`}
                    >
                      {nivelInfo.label}
                    </span>
                  </div>

                  {/* Cuadrícula de detalles y métricas clave */}
                  <div className="grid grid-cols-2 gap-2.5 bg-surface-alt/70 border border-line/60 rounded-xl p-3.5 mb-4">
                    <div>
                      <dt className="text-[13px] font-semibold text-ink-muted flex items-center gap-1">
                        Especialidad
                      </dt>
                      <dd className="text-[13.5px] font-medium text-navy-950 mt-0.5 truncate">
                        {broker.specialty ?? "General"}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-[13px] font-semibold text-ink-muted flex items-center gap-1">
                        Cartera Activa
                      </dt>
                      <dd className="text-[13.5px] font-bold text-navy-950 mt-0.5 tabular-nums flex items-center gap-1.5">
                        <Briefcase className="size-3.5 text-blue-600" />
                        <span>{broker.negociosActivos} negocios</span>
                      </dd>
                    </div>

                    <div>
                      <dt className="text-[13px] font-semibold text-ink-muted">
                        Ventas del Año
                      </dt>
                      <dd className="text-[13.5px] font-black text-navy-950 mt-0.5 tabular-nums">
                        {formatearMonto(broker.annualSalesCents, "USD")}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-[13px] font-semibold text-ink-muted">
                        Meta Mensual
                      </dt>
                      <dd className="text-[13.5px] font-bold text-navy-950 mt-0.5 tabular-nums">
                        {broker.porcentajeMeta === null ? (
                          <span className="text-ink-muted font-normal">Sin meta</span>
                        ) : (
                          <span className={porcentaje >= 100 ? "text-emerald-700" : "text-gold-700"}>
                            {porcentaje}%
                          </span>
                        )}
                      </dd>
                    </div>
                  </div>

                  {/* Barra de Progreso hacia la Meta */}
                  <div className="mb-5">
                    <div className="flex items-center justify-between text-[13px] text-ink-muted mb-1.5">
                      <span>Progreso del mes</span>
                      <span className="font-semibold tabular-nums text-navy-950">
                        {broker.achievedDeals ?? 0} / {broker.targetDeals ?? 0} logrados
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden p-0.5 border border-line/60">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          porcentaje >= 100
                            ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                            : "bg-gradient-to-r from-gold-600 to-amber-400"
                        }`}
                        style={{ width: `${Math.min(porcentaje, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Acciones principales con controles >= 44px */}
                <footer className="pt-3 border-t border-line/70 flex items-center justify-between gap-2">
                  <Link
                    className="inline-flex items-center justify-center min-h-[44px] px-4 rounded-xl border border-line bg-surface hover:bg-surface-alt text-navy-950 text-[13px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-gold-700"
                    href={`/brokers/${broker.userId}`}
                  >
                    Ver perfil
                  </Link>
                  {puedeAsignar && (
                    <button
                      className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3.5 rounded-xl text-[13px] font-semibold text-gold-700 hover:text-gold-800 hover:bg-gold-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gold-700 cursor-pointer"
                      type="button"
                      onClick={() => setAsignando(broker)}
                    >
                      <SlidersHorizontal className="size-3.5" />
                      <span>Asignar propiedades</span>
                    </button>
                  )}
                </footer>
              </article>
            );
          })}
        </div>
      )}

      {/* Modal para invitar broker */}
      {invitando && <FormularioUsuario roles={roles} onClose={() => setInvitando(false)} />}

      {/* Modal para asignar propiedades */}
      {asignando && (
        <AsignarPropiedadesModal broker={asignando} proyectos={proyectosAsignables} onClose={() => setAsignando(null)} />
      )}
    </>
  );
}

function AsignarPropiedadesModal({
  broker,
  proyectos,
  onClose,
}: {
  broker: BrokerFila;
  proyectos: ProyectoAsignable[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [seleccionados, setSeleccionados] = useState(
    () => new Set(proyectos.filter((p) => p.brokerId === broker.userId).map((p) => p.id)),
  );
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function alternar(id: number) {
    setSeleccionados((actual) => {
      const copia = new Set(actual);
      if (copia.has(id)) copia.delete(id);
      else copia.add(id);
      return copia;
    });
  }

  const envioEnCurso = useRef(false);

  async function guardar() {
    if (envioEnCurso.current) return;
    envioEnCurso.current = true;
    setEnviando(true);
    setError(null);
    try {
      const respuesta = await fetch(`/api/brokers/${broker.userId}/proyectos`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ projectIds: Array.from(seleccionados) }),
      });
      const cuerpo = await respuesta.json().catch(() => ({}));
      if (!respuesta.ok) {
        setError(cuerpo.error ?? "No se pudo guardar la asignación de propiedades.");
        return;
      }
      router.refresh();
      onClose();
    } catch {
      setError("Error de conexión al guardar la asignación.");
    } finally {
      envioEnCurso.current = false;
      setEnviando(false);
    }
  }

  return (
    <Modal title={`Asignar propiedades a ${broker.fullName}`} onClose={onClose}>
      <p className="text-[13.5px] text-ink-muted mb-4 leading-relaxed">
        Selecciona los desarrollos inmobiliarios y proyectos que estarán bajo la responsabilidad directa de este asesor.
      </p>

      {proyectos.length === 0 ? (
        <Vacio titulo="Sin proyectos activos" texto="No hay proyectos disponibles para asignar en el catálogo actual." />
      ) : (
        <div className="max-h-72 overflow-y-auto border border-line rounded-xl mb-4 divide-y divide-line">
          {proyectos.map((proyecto) => {
            const estaAsignadoAEste = seleccionados.has(proyecto.id);

            return (
              <label
                key={proyecto.id}
                className="flex items-center justify-between gap-3 p-3.5 hover:bg-surface-alt/70 transition-colors cursor-pointer min-h-[48px]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Checkbox checked={estaAsignadoAEste} onCheckedChange={() => alternar(proyecto.id)} aria-label={`Asignar ${proyecto.name}`} />
                  <span className="text-[13.5px] font-semibold text-navy-950 truncate">{proyecto.name}</span>
                </div>
                <div className="shrink-0 text-right">
                  {proyecto.brokerId == null ? (
                    <span className="text-[13px] text-ink-muted">Sin asignar</span>
                  ) : estaAsignadoAEste ? (
                    <Badge tone="blue">Asignado a este broker</Badge>
                  ) : (
                    <span className="text-[13px] text-ink-muted">
                      De: <strong className="text-navy-900">{proyecto.brokerName}</strong>
                    </span>
                  )}
                </div>
              </label>
            );
          })}
        </div>
      )}

      {error && (
        <div className="p-3 mb-4 rounded-xl bg-danger-bg text-danger border border-danger/20 text-[13px] font-medium">
          {error}
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-line">
        <button
          className="inline-flex items-center justify-center min-h-[46px] px-5 rounded-xl border border-line bg-surface hover:bg-surface-alt text-navy-950 text-[13.5px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-gold-700 cursor-pointer"
          type="button"
          onClick={onClose}
        >
          Cancelar
        </button>
        <button
          className="inline-flex items-center justify-center min-h-[46px] px-6 rounded-xl bg-navy-950 hover:bg-navy-900 text-white text-[13.5px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-gold-700 disabled:opacity-50 cursor-pointer shadow-sm"
          type="button"
          disabled={enviando}
          onClick={() => void guardar()}
        >
          {enviando ? "Guardando…" : "Guardar asignación"}
        </button>
      </div>
    </Modal>
  );
}
