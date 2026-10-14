"use client";

import { usePathname, useRouter } from "next/navigation";
import { type FormEvent, useId, useMemo, useRef, useState } from "react";
import type { BrokerLevel } from "@/domain/catalogs";
import { BROKER_LEVEL_LABELS } from "@/domain/cierre-negocio";
import { cumplimientoPorcentaje, esMetaCumplida, formatoPeriodo, nombreMes } from "@/domain/metas";
import { Modal, PageHeader } from "../_ui/prototipo-ui";
import { Vacio } from "../_ui/estados";
import {
  Calendar,
  CheckCircle2,
  Pencil,
  Trophy,
} from "lucide-react";

export type HeroMeta = { targetDeals: number; achievedDeals: number } | null;
export type BrokerMetaFila = {
  userId: number;
  fullName: string;
  level: BrokerLevel;
  targetDeals: number;
  achievedDeals: number;
  tendencia: number[];
};
export type MesMetaFila = { month: number; targetDeals: number; achievedDeals: number };
export type OpcionPeriodo = { value: string; label: string };

const MESES_CORTOS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

/**
 * M8 · Metas — Panel ejecutivo de cumplimiento, leaderboard con podio y sparklines,
 * y comparativa de ventas mes a mes.
 * Cumple: Controles >= 44-48px, texto >= 13px, foco gold-700, sin alerts nativos, regla multimoneda M22.
 */
export function MetasVista({
  periodo,
  opcionesPeriodo,
  esVistaCompleta,
  puedeEditar,
  heroMeta,
  brokers,
  filasDelAnio,
}: {
  periodo: { year: number; month: number };
  opcionesPeriodo: OpcionPeriodo[];
  esVistaCompleta: boolean;
  puedeEditar: boolean;
  heroMeta: HeroMeta;
  brokers: BrokerMetaFila[];
  filasDelAnio: MesMetaFila[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [editandoCompania, setEditandoCompania] = useState(false);
  const [editandoBroker, setEditandoBroker] = useState<BrokerMetaFila | null>(null);

  const periodoActual = formatoPeriodo(periodo);
  const porcentajeHero = heroMeta ? cumplimientoPorcentaje(heroMeta.achievedDeals, heroMeta.targetDeals) : null;
  const maxAnual = Math.max(1, ...filasDelAnio.map((fila) => fila.achievedDeals));
  const totalAnualCierres = filasDelAnio.reduce((acc, f) => acc + f.achievedDeals, 0);

  // Leaderboard ordenado: mayor cantidad de negocios logrados, luego mayor porcentaje
  const leaderboard = useMemo(() => {
    return [...brokers].sort((a, b) => {
      if (b.achievedDeals !== a.achievedDeals) {
        return b.achievedDeals - a.achievedDeals;
      }
      const pctA = cumplimientoPorcentaje(a.achievedDeals, a.targetDeals) ?? 0;
      const pctB = cumplimientoPorcentaje(b.achievedDeals, b.targetDeals) ?? 0;
      return pctB - pctA;
    });
  }, [brokers]);

  // Mes con mayor volumen
  const mesPico = useMemo(() => {
    let mayor = filasDelAnio[0];
    for (const f of filasDelAnio) {
      if (f.achievedDeals > (mayor?.achievedDeals ?? 0)) {
        mayor = f;
      }
    }
    return mayor;
  }, [filasDelAnio]);

  return (
    <>
      <PageHeader
        eyebrow="Rendimiento y Objetivos"
        title={esVistaCompleta ? "Metas y Desempeño Comercial" : "Mis Metas y Rendimiento"}
        subtitle="Monitoreo de cumplimiento de objetivos mensuales, tabla de clasificación de asesores y comparativa anual."
        action={
          <div className="flex items-center gap-3">
            <select
              className="min-h-[46px] px-4 rounded-xl border border-line bg-surface text-navy-950 text-[13.5px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-gold-700 focus:border-gold-700 shadow-2xs cursor-pointer"
              value={periodoActual}
              onChange={(event) => router.push(`${pathname}?periodo=${event.target.value}`)}
            >
              {opcionesPeriodo.map((opcion) => (
                <option key={opcion.value} value={opcion.value}>
                  {opcion.label}
                </option>
              ))}
            </select>
          </div>
        }
      />

      {/* Hero: Donut Circular SVG de Cumplimiento (Goal Ring) */}
      <section className="bg-surface border border-line/80 rounded-2xl p-6 md:p-8 shadow-xs mb-8">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          {/* Donut Circular SVG */}
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8 w-full lg:w-auto">
            <div className="relative shrink-0 flex items-center justify-center">
              <GoalRingSvg porcentaje={porcentajeHero} />
            </div>

            <div className="text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1.5">
                <span className="text-[13px] font-bold text-ink-muted uppercase tracking-wider">
                  {esVistaCompleta ? "Objetivo Global del Equipo" : "Tu Meta Personal"}
                </span>
                {porcentajeHero !== null && porcentajeHero >= 100 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[13px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="size-3.5" />
                    ¡Meta Lograda!
                  </span>
                )}
              </div>

              {heroMeta && porcentajeHero !== null ? (
                <>
                  <h2 className="font-heading font-black text-2xl md:text-3xl text-navy-950 m-0 tracking-tight">
                    <span className="tabular-nums text-gold-700">{heroMeta.achievedDeals}</span> de{" "}
                    <span className="tabular-nums">{heroMeta.targetDeals}</span> negocios cerrados
                  </h2>
                  <p className="text-[13.5px] text-ink-muted mt-2 mb-0 max-w-md leading-relaxed">
                    Periodo evaluado: <strong className="text-navy-950">{nombreMes(periodo.month)} {periodo.year}</strong>.
                    Los cierres de ventas alimentan este indicador en tiempo real.
                  </p>
                </>
              ) : (
                <>
                  <h2 className="font-heading font-black text-2xl md:text-3xl text-navy-950 m-0">
                    Sin meta fijada para este mes
                  </h2>
                  <p className="text-[13.5px] text-ink-muted mt-2 mb-0 max-w-md leading-relaxed">
                    Establece el objetivo de ventas para comenzar el seguimiento del periodo.
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Botón de acción para editar meta global si tiene permiso */}
          {puedeEditar && esVistaCompleta && (
            <div className="shrink-0 w-full sm:w-auto text-center sm:text-right">
              <button
                className="inline-flex items-center justify-center gap-2 min-h-[46px] px-5 rounded-xl border border-line bg-surface hover:bg-surface-alt text-navy-950 text-[13.5px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-gold-700 shadow-2xs cursor-pointer w-full sm:w-auto"
                type="button"
                onClick={() => setEditandoCompania(true)}
              >
                <Pencil className="size-4 text-gold-600" />
                <span>Editar meta de la compañía</span>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Grid: Leaderboard con Podio + Comparativa Mes a Mes */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 mb-8">
        {/* Columna Izquierda: Leaderboard de Asesores con Podio y Sparklines (7 cols) */}
        <section className="xl:col-span-7 bg-surface border border-line/80 rounded-2xl p-6 md:p-7 shadow-xs">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-line">
            <div className="flex items-center gap-2.5">
              <Trophy className="size-5 text-gold-600" />
              <div>
                <h2 className="font-heading font-bold text-xl text-navy-950 m-0">
                  {esVistaCompleta ? "Leaderboard de Asesores" : "Desempeño y Posición"}
                </h2>
                <p className="text-[13px] text-ink-muted m-0">
                  Clasificación por volumen de cierres y tendencia anual.
                </p>
              </div>
            </div>
            <span className="text-[13px] text-ink-muted font-medium">
              Mes de <strong className="text-navy-950">{nombreMes(periodo.month)}</strong>
            </span>
          </div>

          {leaderboard.length === 0 ? (
            <Vacio titulo="Sin brokers en este periodo" texto="No hay asesores asignados a este alcance." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-line text-[13px] font-bold text-ink-muted uppercase tracking-wider">
                    <th className="pb-3 pl-2">Posición / Asesor</th>
                    <th className="pb-3 text-center hidden sm:table-cell">Tendencia</th>
                    <th className="pb-3 text-center">Meta</th>
                    <th className="pb-3 text-center">Logrados</th>
                    <th className="pb-3">Cumplimiento</th>
                    {puedeEditar && <th className="pb-3 pr-2 text-right">Acción</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/70">
                  {leaderboard.map((broker, index) => {
                    const porcentaje = cumplimientoPorcentaje(broker.achievedDeals, broker.targetDeals);
                    const posicion = index + 1;
                    const esPodio = posicion <= 3;
                    const cumplida = broker.targetDeals > 0 && broker.achievedDeals >= broker.targetDeals;

                    return (
                      <tr
                        key={broker.userId}
                        className={`hover:bg-surface-alt/50 transition-colors ${
                          esPodio && posicion === 1 ? "bg-amber-50/20" : ""
                        }`}
                      >
                        {/* Posición y Avatar con Asesor */}
                        <td className="py-4 pl-2">
                          <div className="flex items-center gap-3">
                            <span className="shrink-0 flex items-center justify-center">
                              {posicion === 1 ? (
                                <span
                                  className="size-8 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950 font-black text-sm flex items-center justify-center shadow-xs border border-amber-200"
                                  title="Primer Lugar"
                                >
                                  🥇
                                </span>
                              ) : posicion === 2 ? (
                                <span
                                  className="size-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-400 text-slate-900 font-black text-sm flex items-center justify-center shadow-xs border border-slate-300"
                                  title="Segundo Lugar"
                                >
                                  🥈
                                </span>
                              ) : posicion === 3 ? (
                                <span
                                  className="size-8 rounded-full bg-gradient-to-br from-amber-600/30 to-amber-700/50 text-amber-950 font-black text-sm flex items-center justify-center shadow-xs border border-amber-700/30"
                                  title="Tercer Lugar"
                                >
                                  🥉
                                </span>
                              ) : (
                                <span className="size-8 rounded-full bg-surface-alt text-ink-muted font-bold text-[13px] flex items-center justify-center border border-line">
                                  #{posicion}
                                </span>
                              )}
                            </span>

                            <div className="min-w-0">
                              <strong className="block font-bold text-[13.5px] text-navy-950 truncate">
                                {broker.fullName}
                              </strong>
                              <span className="text-[13px] text-ink-muted block mt-0.5">
                                {BROKER_LEVEL_LABELS[broker.level]}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Sparkline de tendencia anual */}
                        <td className="py-4 text-center hidden sm:table-cell">
                          <Sparkline datos={broker.tendencia} mesActual={periodo.month} />
                        </td>

                        {/* Meta asignada */}
                        <td className="py-4 text-center font-semibold text-[13.5px] text-navy-950 tabular-nums">
                          {broker.targetDeals}
                        </td>

                        {/* Logrados */}
                        <td className="py-4 text-center font-black text-[13.5px] text-navy-950 tabular-nums">
                          {broker.achievedDeals}
                        </td>

                        {/* Barra de cumplimiento y porcentaje */}
                        <td className="py-4">
                          {porcentaje === null ? (
                            <span className="text-[13px] text-ink-muted">Sin meta</span>
                          ) : (
                            <div className="flex items-center gap-2.5">
                              <div className="w-20 bg-slate-100 rounded-full h-2 overflow-hidden border border-line">
                                <div
                                  className={`h-full rounded-full ${
                                    cumplida
                                      ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                                      : "bg-gradient-to-r from-gold-600 to-amber-400"
                                  }`}
                                  style={{ width: `${Math.min(porcentaje, 100)}%` }}
                                />
                              </div>
                              <span
                                className={`text-[13px] font-bold tabular-nums ${
                                  cumplida ? "text-emerald-700" : "text-navy-950"
                                }`}
                              >
                                {porcentaje}%
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Acción para editar meta */}
                        {puedeEditar && (
                          <td className="py-4 pr-2 text-right">
                            <button
                              className="inline-flex size-11 items-center justify-center rounded-xl text-ink-muted hover:text-navy-950 hover:bg-surface-alt transition-colors focus:outline-none focus:ring-2 focus:ring-gold-700 cursor-pointer"
                              type="button"
                              onClick={() => setEditandoBroker(broker)}
                              aria-label={`Editar meta de ${broker.fullName}`}
                              title={`Editar meta de ${broker.fullName}`}
                            >
                              <Pencil className="size-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Columna Derecha: Comparativa de Ventas Mes a Mes (5 cols) */}
        <section className="xl:col-span-5 bg-surface border border-line/80 rounded-2xl p-6 md:p-7 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-line">
              <div className="flex items-center gap-2.5">
                <Calendar className="size-5 text-gold-600" />
                <div>
                  <h2 className="font-heading font-bold text-xl text-navy-950 m-0">Comparativa Mensual</h2>
                  <p className="text-[13px] text-ink-muted m-0">Evolución de cierres durante {periodo.year}.</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-[13px] font-bold bg-gold-100 text-gold-900 border border-gold-300 tabular-nums">
                {totalAnualCierres} cierres en {periodo.year}
              </span>
            </div>

            {/* Resumen del Rendimiento Anual */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-surface-alt/70 border border-line rounded-xl p-3.5">
                <span className="text-[13px] text-ink-muted font-semibold block uppercase">Mes Pico</span>
                <strong className="text-[14px] font-bold text-navy-950 block mt-0.5">
                  {mesPico ? `${nombreMes(mesPico.month)} (${mesPico.achievedDeals} cierres)` : "—"}
                </strong>
              </div>
              <div className="bg-surface-alt/70 border border-line rounded-xl p-3.5">
                <span className="text-[13px] text-ink-muted font-semibold block uppercase">Promedio Mensual</span>
                <strong className="text-[14px] font-bold text-navy-950 block mt-0.5 tabular-nums">
                  {(totalAnualCierres / 12).toFixed(1)} cierres / mes
                </strong>
              </div>
            </div>

            {/* Gráfico de Barras Mensual */}
            <div className="h-56 flex items-end justify-between gap-1.5 pt-6 pb-2 px-1 border-b border-line/80">
              {filasDelAnio.map((fila) => {
                const esMesSeleccionado = fila.month === periodo.month;
                const cumplida = esMetaCumplida(fila.achievedDeals, fila.targetDeals);
                const alturaPorcentaje = Math.max(10, Math.round((fila.achievedDeals / maxAnual) * 100));

                return (
                  <div
                    key={fila.month}
                    className="flex-1 flex flex-col items-center gap-2 group relative cursor-pointer"
                    onClick={() =>
                      router.push(`${pathname}?periodo=${formatoPeriodo({ year: periodo.year, month: fila.month })}`)
                    }
                  >
                    {/* Tooltip con datos */}
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-navy-950 text-white text-[13px] font-bold px-2 py-1 rounded-md shadow-md whitespace-nowrap z-10 tabular-nums">
                      {fila.achievedDeals} / {fila.targetDeals}
                    </div>

                    {/* Barra */}
                    <div className="w-full flex justify-center items-end h-40">
                      <div
                        className={`w-full max-w-[24px] rounded-t-lg transition-all duration-300 ${
                          esMesSeleccionado
                            ? "bg-gradient-to-t from-gold-600 to-amber-400 ring-2 ring-gold-700"
                            : cumplida
                              ? "bg-gradient-to-t from-emerald-600 to-teal-400"
                              : "bg-slate-200 group-hover:bg-slate-300"
                        }`}
                        style={{ height: `${alturaPorcentaje}%` }}
                      />
                    </div>

                    {/* Etiqueta del mes */}
                    <span
                      className={`text-[13px] font-bold tracking-tight ${
                        esMesSeleccionado ? "text-gold-700" : "text-ink-muted group-hover:text-navy-950"
                      }`}
                    >
                      {MESES_CORTOS[fila.month - 1]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Leyenda del Gráfico */}
          <div className="flex items-center justify-between text-[13px] text-ink-muted pt-4">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="size-3 rounded-full bg-gold-600" />
                <span>Mes seleccionado</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-3 rounded-full bg-emerald-500" />
                <span>Meta lograda</span>
              </span>
            </div>
            <span className="font-semibold text-navy-950">Haz clic en un mes para filtrar</span>
          </div>
        </section>
      </div>

      {/* Modal para editar meta de la compañía */}
      {editandoCompania && (
        <FormularioMetaModal
          titulo="Editar Meta Global de la Compañía"
          subtitulo={`Objetivo consolidado de cierres para ${nombreMes(periodo.month)} ${periodo.year}.`}
          brokerId={null}
          anio={periodo.year}
          mes={periodo.month}
          targetDeals={heroMeta?.targetDeals ?? 0}
          onClose={() => setEditandoCompania(false)}
        />
      )}

      {/* Modal para editar meta de un broker */}
      {editandoBroker && (
        <FormularioMetaModal
          titulo={`Editar Meta — ${editandoBroker.fullName}`}
          subtitulo={`Asignación de objetivo individual para ${nombreMes(periodo.month)} ${periodo.year}.`}
          brokerId={editandoBroker.userId}
          anio={periodo.year}
          mes={periodo.month}
          targetDeals={editandoBroker.targetDeals}
          onClose={() => setEditandoBroker(null)}
        />
      )}
    </>
  );
}

/**
 * Donut circular SVG de cumplimiento del equipo (Goal Ring) con porcentaje en tiempo real.
 */
function GoalRingSvg({ porcentaje }: { porcentaje: number | null }) {
  const radius = 62;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius; // ≈ 389.55
  const normalizedPct = porcentaje === null ? 0 : Math.min(100, Math.max(0, porcentaje));
  const strokeDashoffset = circumference - (normalizedPct / 100) * circumference;
  const gradientId = useId();
  const esCumplida = porcentaje !== null && porcentaje >= 100;

  return (
    <div className="relative size-44 flex items-center justify-center">
      <svg className="size-44 -rotate-90 transform" viewBox="0 0 160 160">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            {esCumplida ? (
              <>
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#14b8a6" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#c59b27" />
                <stop offset="100%" stopColor="#f59e0b" />
              </>
            )}
          </linearGradient>
        </defs>

        {/* Pista de fondo */}
        <circle
          cx="80"
          cy="80"
          r={radius}
          stroke="#f1f5f9"
          strokeWidth={strokeWidth}
          fill="transparent"
        />

        {/* Anillo de progreso */}
        <circle
          cx="80"
          cy="80"
          r={radius}
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-700 ease-out"
        />
      </svg>

      {/* Contenido central del Donut */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
        <span className="font-heading font-black text-3xl md:text-4xl text-navy-950 tabular-nums tracking-tight">
          {porcentaje === null ? "—" : `${porcentaje}%`}
        </span>
        <span className="text-[13px] font-bold text-ink-muted uppercase tracking-wider mt-0.5">
          Cumplimiento
        </span>
      </div>
    </div>
  );
}

/**
 * Sparkline SVG para tendencia mensual por asesor.
 */
function Sparkline({ datos, mesActual }: { datos: number[]; mesActual: number }) {
  if (!datos || datos.length === 0) return <span className="text-[13px] text-ink-muted">—</span>;

  const max = Math.max(1, ...datos);
  const width = 100;
  const height = 28;
  const paddingY = 4;
  const usableHeight = height - paddingY * 2;

  // Mapear cada mes a una coordenada (x, y)
  const puntos = datos.map((val, idx) => {
    const x = (idx / (datos.length - 1)) * (width - 8) + 4;
    const y = height - paddingY - (val / max) * usableHeight;
    return { x, y, val };
  });

  const pathD = puntos.reduce((acc, p, idx) => `${acc} ${idx === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`, "");
  const areaD = `${pathD} L ${puntos[puntos.length - 1]!.x.toFixed(1)} ${height} L ${puntos[0]!.x.toFixed(1)} ${height} Z`;

  const puntoActual = puntos[mesActual - 1];

  return (
    <div className="inline-flex items-center justify-center">
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          <linearGradient id="sparklineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c59b27" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#c59b27" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Área sombreada */}
        <path d={areaD} fill="url(#sparklineGrad)" />

        {/* Línea del gráfico */}
        <path
          d={pathD}
          fill="none"
          stroke="#c59b27"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Punto en el mes evaluado */}
        {puntoActual && (
          <circle
            cx={puntoActual.x}
            cy={puntoActual.y}
            r="3.5"
            className="fill-gold-600 stroke-white stroke-2 shadow-sm"
          />
        )}
      </svg>
    </div>
  );
}

/**
 * Modal accesible de edición de metas sin alerts nativos.
 */
function FormularioMetaModal({
  titulo,
  subtitulo,
  brokerId,
  anio,
  mes,
  targetDeals,
  onClose,
}: {
  titulo: string;
  subtitulo: string;
  brokerId: number | null;
  anio: number;
  mes: number;
  targetDeals: number;
  onClose: () => void;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!formRef.current) return;
    setEnviando(true);
    setErrores({});

    const form = new FormData(formRef.current);
    const datos = {
      brokerId,
      year: anio,
      month: mes,
      targetDeals: Number(form.get("targetDeals")),
    };

    try {
      const respuesta = await fetch("/api/metas", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(datos),
      });
      const cuerpo = await respuesta.json().catch(() => ({}));
      if (!respuesta.ok) {
        setErrores(cuerpo.fields ?? { _: cuerpo.error ?? "No se pudo guardar la meta." });
        return;
      }
      router.refresh();
      onClose();
    } catch {
      setErrores({ _: "Error de conexión al guardar la meta." });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal title={titulo} onClose={onClose}>
      <p className="text-[13.5px] text-ink-muted mb-5 leading-relaxed">{subtitulo}</p>

      <form ref={formRef} onSubmit={enviar}>
        <div className="mb-5">
          <label className="block text-[13px] font-bold text-navy-950 uppercase tracking-wider mb-2">
            Cantidad de Negocios Objetivo
          </label>
          <input
            name="targetDeals"
            type="number"
            min="0"
            required
            defaultValue={targetDeals}
            autoFocus
            className="w-full min-h-[48px] px-4 rounded-xl border border-line bg-surface text-navy-950 text-[14px] font-bold focus:outline-none focus:ring-2 focus:ring-gold-700 focus:border-gold-700 shadow-2xs"
          />
          {errores.targetDeals && (
            <p className="text-[13px] text-danger font-medium mt-1.5">{errores.targetDeals}</p>
          )}
        </div>

        {errores._ && (
          <div className="p-3 mb-5 rounded-xl bg-danger-bg text-danger border border-danger/20 text-[13px] font-medium">
            {errores._}
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
            type="submit"
            disabled={enviando}
          >
            {enviando ? "Guardando…" : "Guardar Meta"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
