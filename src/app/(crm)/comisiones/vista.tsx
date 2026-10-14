"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import type { CommissionStatus } from "@/domain/catalogs";
import { COMMISSION_STATUS_LABELS } from "@/domain/comision-estado";
import { formatearMonto } from "../_ui/formato";
import { PageHeader, Modal } from "../_ui/prototipo-ui";
import { DataTable, type Columna } from "@/components/ui/data-table";
import { Insignia } from "@/components/ui/bits";
import { type Tone } from "@/components/ui/tone";
import {
  AlertTriangle,
  BadgeDollarSign,
  Ban,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  DollarSign,
  Download,
  Pencil,
  Percent,
  Search,
  Wallet,
} from "lucide-react";
import { nombreMes } from "@/domain/metas";

export type FilaComisionVista = {
  id: number;
  dealId?: number;
  status: CommissionStatus;
  closedDate?: string | null;
  currency: string;
  saleAmountCents: number;
  commissionBasisPoints: number;
  totalCommissionCents: number;
  brokerShareBasisPoints: number;
  agencyShareBasisPoints: number;
  brokerAmountCents: number;
  agencyAmountCents?: number;
  brokerId: number | null;
  brokerName: string | null;
  contactName: string;
  projectName: string | null;
};

export type KpisComisiones = {
  totalCents: number;
  totalCount: number;
  pendientesCents: number;
  porAprobarCount: number;
  pagadasCents: number;
  monedaPrincipal?: string;
  porMoneda?: {
    currency: string;
    totalCents: number;
    pendientesCents: number;
    pagadasCents: number;
    totalCount?: number;
    porAprobarCount?: number;
  }[];
};

export type OpcionPeriodo = { value: string; label: string };

const ESTADO_TONE: Record<CommissionStatus, Tone> = {
  pending: "neutral",
  approved: "gold",
  paid: "ok",
  void: "danger",
};

/** Puntos básicos a porcentaje: 500 → "5%", 450 → "4.5%". */
function formatearPorcentaje(basisPoints: number): string {
  const valor = basisPoints / 100;
  return `${Number.isInteger(valor) ? valor : valor.toFixed(1)}%`;
}

/** "AAAA-MM" → "septiembre 2026"; `"todos"` → "todos los periodos". */
function etiquetaPeriodo(periodo: string): string {
  if (periodo === "todos") return "todos los periodos";
  const [anio, mes] = periodo.split("-").map(Number);
  return `${nombreMes(mes!)} ${anio}`;
}

/**
 * M9 · Comisiones — Centro de Liquidaciones y Reparto Financiero.
 * Cumple: Controles >= 44-48px, texto >= 13px, foco gold-700, sin alerts nativos, regla multimoneda M22.
 */
export function ComisionesVista({
  scope,
  puedeEditar,
  puedeExportar,
  brokerIdSeleccionado,
  periodoSeleccionado,
  estadoSeleccionado,
  opcionesPeriodo,
  brokers,
  kpis,
  filas,
}: {
  scope: "own" | "team" | "all";
  puedeEditar: boolean;
  puedeExportar: boolean;
  brokerIdSeleccionado: number | null;
  periodoSeleccionado: string;
  estadoSeleccionado: CommissionStatus | "todos";
  opcionesPeriodo: OpcionPeriodo[];
  brokers: { id: number; fullName: string }[];
  kpis: KpisComisiones;
  filas: FilaComisionVista[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Estados locales para diálogos modales (reemplazando alerts/confirms nativos)
  const [ocupada, setOcupada] = useState<number | null>(null);
  const [comisionParaAnular, setComisionParaAnular] = useState<FilaComisionVista | null>(null);
  const [comisionParaSplit, setComisionParaSplit] = useState<FilaComisionVista | null>(null);
  const [mensajeNotificacion, setMensajeNotificacion] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const [filtroTexto, setFiltroTexto] = useState("");

  const esAdmin = scope === "all";
  const monedaKpi = kpis.monedaPrincipal ?? "USD";

  function irCon(cambios: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [clave, valor] of Object.entries(cambios)) {
      if (valor) params.set(clave, valor);
      else params.delete(clave);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  const aplicar = useCallback(
    async (id: number, body: Record<string, unknown>, mensajeExito: string, errorPorDefecto: string) => {
      setOcupada(id);
      setMensajeNotificacion(null);
      try {
        const respuesta = await fetch(`/api/comisiones/${id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!respuesta.ok) {
          const cuerpo = await respuesta.json().catch(() => ({}));
          setMensajeNotificacion({ tipo: "error", texto: cuerpo.error ?? errorPorDefecto });
          return;
        }
        setMensajeNotificacion({ tipo: "ok", texto: mensajeExito });
        router.refresh();
      } catch {
        setMensajeNotificacion({ tipo: "error", texto: errorPorDefecto });
      } finally {
        setOcupada(null);
      }
    },
    [router],
  );

  // Filtrado reactivo en cliente para búsqueda por texto
  const filasFiltradas = useMemo(() => {
    if (!filtroTexto.trim()) return filas;
    const term = filtroTexto.toLowerCase();
    return filas.filter(
      (f) =>
        f.contactName.toLowerCase().includes(term) ||
        (f.projectName ?? "").toLowerCase().includes(term) ||
        (f.brokerName ?? "").toLowerCase().includes(term),
    );
  }, [filas, filtroTexto]);

  // Conteos por estado para las pestañas interactivas
  const conteosPorEstado = useMemo(() => {
    return {
      todos: filas.length,
      pending: filas.filter((f) => f.status === "pending").length,
      approved: filas.filter((f) => f.status === "approved").length,
      paid: filas.filter((f) => f.status === "paid").length,
      void: filas.filter((f) => f.status === "void").length,
    };
  }, [filas]);

  const parametrosExport = new URLSearchParams();
  if (brokerIdSeleccionado != null) parametrosExport.set("broker", String(brokerIdSeleccionado));
  parametrosExport.set("periodo", periodoSeleccionado);
  parametrosExport.set("estado", estadoSeleccionado);

  const columnasTabla: Columna<FilaComisionVista>[] = useMemo(
    () => [
      {
        clave: "negocio",
        titulo: "Negocio / Proyecto",
        movil: "titulo",
        celda: (fila) => (
          <div className="grid leading-snug min-w-0">
            <strong className="text-[14px] font-bold text-navy-950 truncate">{fila.contactName}</strong>
            <span className="text-[13px] text-ink-muted truncate flex items-center gap-1 mt-0.5">
              <Building2 className="size-3.5 text-ink-muted shrink-0" />
              {fila.projectName ?? "Propiedad directa"}
            </span>
          </div>
        ),
        valor: (fila) => `${fila.contactName} ${fila.projectName ?? ""}`,
        ordenable: true,
      },
      {
        clave: "venta",
        titulo: "Monto de Venta",
        movil: "subtitulo",
        alinear: "derecha",
        celda: (fila) => (
          <span className="font-bold text-navy-950 tabular-nums text-[13.5px]">
            {formatearMonto(fila.saleAmountCents, fila.currency)}
          </span>
        ),
        valor: (fila) => fila.saleAmountCents,
        ordenable: true,
      },
      {
        clave: "comision",
        titulo: "Comisión Total",
        alinear: "derecha",
        celda: (fila) => (
          <div className="text-right leading-snug">
            <span className="font-black text-gold-700 tabular-nums text-[14px]">
              {formatearMonto(fila.totalCommissionCents, fila.currency)}
            </span>
            <span className="block text-[13px] font-semibold text-ink-muted">
              {formatearPorcentaje(fila.commissionBasisPoints)} tasa
            </span>
          </div>
        ),
        valor: (fila) => fila.totalCommissionCents,
        ordenable: true,
      },
      // Desglose de Split para Administradores o Broker Share para Asesores
      {
        clave: "reparto",
        titulo: esAdmin ? "Split (Broker / Agencia)" : "Tu Comisión",
        celda: (fila) => {
          const brokerPct = fila.brokerShareBasisPoints / 100;
          const agencyPct = fila.agencyShareBasisPoints / 100;
          const agencyCents = fila.agencyAmountCents ?? fila.totalCommissionCents - fila.brokerAmountCents;

          if (!esAdmin) {
            return (
              <div className="leading-snug">
                <strong className="text-[14px] font-bold text-navy-950 tabular-nums block">
                  {formatearMonto(fila.brokerAmountCents, fila.currency)}
                </strong>
                <span className="text-[13px] text-ink-muted tabular-nums">
                  {formatearPorcentaje(fila.brokerShareBasisPoints)} de participación
                </span>
              </div>
            );
          }

          return (
            <div className="min-w-[170px] leading-snug">
              <div className="flex items-center justify-between text-[13px] font-semibold mb-1">
                <span className="text-navy-950">
                  Broker: <strong className="tabular-nums">{brokerPct}%</strong> ({formatearMonto(fila.brokerAmountCents, fila.currency)})
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden flex mb-1">
                <div
                  className="bg-navy-900 h-full transition-all"
                  style={{ width: `${brokerPct}%` }}
                  title={`Broker: ${brokerPct}%`}
                />
                <div
                  className="bg-gold-500 h-full transition-all"
                  style={{ width: `${agencyPct}%` }}
                  title={`Agencia: ${agencyPct}%`}
                />
              </div>
              <div className="text-[13px] text-ink-muted">
                Agencia: <strong className="text-navy-950 tabular-nums">{agencyPct}%</strong> ({formatearMonto(agencyCents, fila.currency)})
              </div>
            </div>
          );
        },
        valor: (fila) => fila.brokerShareBasisPoints,
      },
      {
        clave: "broker",
        titulo: "Asesor Asignado",
        celda: (fila) => (
          <span className="text-[13.5px] font-semibold text-navy-950">
            {fila.brokerName ?? "Sin asignar"}
          </span>
        ),
        valor: (fila) => fila.brokerName ?? "",
        ordenable: true,
      },
      {
        clave: "estado",
        titulo: "Estado",
        movil: "insignia",
        celda: (fila) => (
          <Insignia
            texto={COMMISSION_STATUS_LABELS[fila.status]}
            tono={ESTADO_TONE[fila.status]}
            punto={true}
          />
        ),
        valor: (fila) => COMMISSION_STATUS_LABELS[fila.status],
      },
      ...(puedeEditar
        ? ([
            {
              clave: "acciones",
              titulo: "Acciones",
              alinear: "derecha" as const,
              celda: (fila: FilaComisionVista) => (
                <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                  {fila.status === "pending" && (
                    <>
                      <button
                        className="inline-flex size-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 transition-colors shadow-2xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold-700"
                        type="button"
                        disabled={ocupada === fila.id}
                        onClick={() =>
                          aplicar(
                            fila.id,
                            { status: "approved" },
                            "Comisión aprobada exitosamente.",
                            "No se pudo aprobar la comisión.",
                          )
                        }
                        title="Aprobar comisión"
                        aria-label="Aprobar comisión"
                      >
                        <Check className="size-5" />
                      </button>
                      {esAdmin && (
                        <button
                          className="inline-flex size-11 items-center justify-center rounded-xl bg-surface text-navy-950 hover:bg-surface-alt border border-line transition-colors shadow-2xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold-700"
                          type="button"
                          disabled={ocupada === fila.id}
                          onClick={() => setComisionParaSplit(fila)}
                          title="Ajustar Split / Reparto"
                          aria-label="Ajustar Split / Reparto"
                        >
                          <Pencil className="size-4 text-gold-700" />
                        </button>
                      )}
                    </>
                  )}
                  {fila.status === "approved" && (
                    <button
                      className="inline-flex size-11 items-center justify-center rounded-xl bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-300 transition-colors shadow-2xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold-700"
                      type="button"
                      disabled={ocupada === fila.id}
                      onClick={() =>
                        aplicar(
                          fila.id,
                          { status: "paid" },
                          "Comisión registrada como pagada.",
                          "No se pudo registrar el pago de la comisión.",
                        )
                      }
                      title="Registrar pago liquidado"
                      aria-label="Registrar pago liquidado"
                    >
                      <BadgeDollarSign className="size-5 text-amber-700" />
                    </button>
                  )}
                  {(fila.status === "pending" || fila.status === "approved") && (
                    <button
                      className="inline-flex size-11 items-center justify-center rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-300 transition-colors shadow-2xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold-700"
                      type="button"
                      disabled={ocupada === fila.id}
                      onClick={() => setComisionParaAnular(fila)}
                      title="Anular comisión"
                      aria-label="Anular comisión"
                    >
                      <Ban className="size-4" />
                    </button>
                  )}
                </div>
              ),
            },
          ] as Columna<FilaComisionVista>[])
        : []),
    ],
    [puedeEditar, esAdmin, ocupada, aplicar],
  );

  return (
    <>
      <PageHeader
        eyebrow="Finanzas y Liquidación"
        title="Comisiones"
        subtitle="Control interno de liquidaciones, aprobación de pagos y desglose de reparto entre broker y agencia."
        action={
          puedeExportar ? (
            <a
              className="inline-flex items-center justify-center gap-2 min-h-[46px] px-5 rounded-xl border border-line bg-surface hover:bg-surface-alt text-navy-950 text-[13.5px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-gold-700 shadow-2xs cursor-pointer"
              href={`/api/comisiones/export?${parametrosExport.toString()}`}
            >
              <Download className="size-4 text-gold-600" />
              <span>Exportar reporte CSV</span>
            </a>
          ) : undefined
        }
      />

      {/* Banner de Feedback accesible en lugar de alerts */}
      {mensajeNotificacion && (
        <div
          className={`flex items-center justify-between p-4 mb-6 rounded-2xl border text-[13.5px] font-semibold transition-all ${
            mensajeNotificacion.tipo === "ok"
              ? "bg-emerald-50 text-emerald-900 border-emerald-300"
              : "bg-rose-50 text-rose-900 border-rose-300"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {mensajeNotificacion.tipo === "ok" ? (
              <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="size-5 text-rose-600 shrink-0" />
            )}
            <span>{mensajeNotificacion.texto}</span>
          </div>
          <button
            type="button"
            className="p-1.5 rounded-lg hover:bg-black/5 text-ink-muted hover:text-navy-950 transition-colors cursor-pointer"
            onClick={() => setMensajeNotificacion(null)}
          >
            ✕
          </button>
        </div>
      )}

      {/* 3 KPIs Financieros Maestros */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {/* KPI 1: Del Mes / Periodo */}
        <div className="bg-surface border border-line/80 rounded-2xl p-6 shadow-xs hover:border-gold-600/40 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-bold text-ink-muted uppercase tracking-wider">
              Comisiones del Periodo
            </span>
            <div className="size-10 rounded-xl bg-gold-100 flex items-center justify-center text-gold-800">
              <DollarSign className="size-5" />
            </div>
          </div>
          <strong className="block font-heading font-black text-2xl md:text-3xl text-navy-950 tabular-nums">
            {formatearMonto(kpis.totalCents, monedaKpi)}
          </strong>
          <small className="text-[13px] text-ink-muted mt-1 block flex items-center gap-1.5">
            <Calendar className="size-3.5 text-ink-muted" />
            <span>
              {kpis.totalCount} cierre{kpis.totalCount === 1 ? "" : "s"} · {etiquetaPeriodo(periodoSeleccionado)}
            </span>
          </small>
        </div>

        {/* KPI 2: Pendientes */}
        <div className="bg-surface border border-line/80 rounded-2xl p-6 shadow-xs hover:border-gold-600/40 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-bold text-ink-muted uppercase tracking-wider">
              Pendientes de Liquidación
            </span>
            <div className="size-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-800">
              <Clock className="size-5" />
            </div>
          </div>
          <strong className="block font-heading font-black text-2xl md:text-3xl text-navy-950 tabular-nums">
            {formatearMonto(kpis.pendientesCents, monedaKpi)}
          </strong>
          <small className="text-[13px] text-ink-muted mt-1 block flex items-center gap-1.5">
            <span className="inline-block size-2 rounded-full bg-amber-500" />
            <span>{kpis.porAprobarCount} por aprobar o pendientes de pago</span>
          </small>
        </div>

        {/* KPI 3: Pagadas */}
        <div className="bg-surface border border-line/80 rounded-2xl p-6 shadow-xs hover:border-gold-600/40 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-bold text-ink-muted uppercase tracking-wider">
              Pagadas y Liquidadas
            </span>
            <div className="size-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-800">
              <Wallet className="size-5" />
            </div>
          </div>
          <strong className="block font-heading font-black text-2xl md:text-3xl text-navy-950 tabular-nums">
            {formatearMonto(kpis.pagadasCents, monedaKpi)}
          </strong>
          <small className="text-[13px] text-ink-muted mt-1 block flex items-center gap-1.5">
            <CheckCircle2 className="size-3.5 text-emerald-600" />
            <span>Fondos completamente transferidos</span>
          </small>
        </div>
      </section>

      {/* Franja Multimoneda M22: si hay DOP u otras monedas además de USD */}
      {kpis.porMoneda && kpis.porMoneda.length > 1 && (
        <div className="p-4 mb-6 rounded-2xl bg-surface-alt/70 border border-line flex flex-wrap items-center gap-6">
          <span className="text-[13px] font-bold text-navy-950 uppercase tracking-wider flex items-center gap-1.5">
            <Percent className="size-4 text-gold-600" />
            Desglose Multimoneda (M22)
          </span>
          {kpis.porMoneda.map((m) => (
            <div key={m.currency} className="text-[13px] text-ink-muted">
              <strong className="text-navy-950">{m.currency}:</strong> Total{" "}
              <span className="font-bold text-navy-950 tabular-nums">{formatearMonto(m.totalCents, m.currency)}</span> ·
              Pendiente:{" "}
              <span className="font-semibold text-amber-800 tabular-nums">{formatearMonto(m.pendientesCents, m.currency)}</span> ·
              Pagada:{" "}
              <span className="font-semibold text-emerald-700 tabular-nums">{formatearMonto(m.pagadasCents, m.currency)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Bandeja Interactiva: Pestañas de Estado Semántico */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 border-b border-line">
        <button
          type="button"
          onClick={() => irCon({ estado: undefined })}
          className={`px-4 min-h-[46px] rounded-xl text-[13.5px] font-semibold border transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold-700 ${
            estadoSeleccionado === "todos"
              ? "bg-navy-950 text-white border-navy-950 shadow-xs"
              : "bg-surface hover:bg-surface-alt text-ink-muted border-line"
          }`}
        >
          Todas ({conteosPorEstado.todos})
        </button>

        <button
          type="button"
          onClick={() => irCon({ estado: "pending" })}
          className={`px-4 min-h-[46px] rounded-xl text-[13.5px] font-semibold border transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold-700 flex items-center gap-2 ${
            estadoSeleccionado === "pending"
              ? "bg-slate-800 text-white border-slate-800 shadow-xs"
              : "bg-surface hover:bg-surface-alt text-ink-muted border-line"
          }`}
        >
          <span className="size-2 rounded-full bg-slate-400" />
          <span>Pendientes ({conteosPorEstado.pending})</span>
        </button>

        <button
          type="button"
          onClick={() => irCon({ estado: "approved" })}
          className={`px-4 min-h-[46px] rounded-xl text-[13.5px] font-semibold border transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold-700 flex items-center gap-2 ${
            estadoSeleccionado === "approved"
              ? "bg-gold-600 text-white border-gold-600 shadow-xs"
              : "bg-surface hover:bg-surface-alt text-ink-muted border-line"
          }`}
        >
          <span className="size-2 rounded-full bg-gold-400" />
          <span>Aprobadas ({conteosPorEstado.approved})</span>
        </button>

        <button
          type="button"
          onClick={() => irCon({ estado: "paid" })}
          className={`px-4 min-h-[46px] rounded-xl text-[13.5px] font-semibold border transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold-700 flex items-center gap-2 ${
            estadoSeleccionado === "paid"
              ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
              : "bg-surface hover:bg-surface-alt text-ink-muted border-line"
          }`}
        >
          <span className="size-2 rounded-full bg-emerald-400" />
          <span>Pagadas ({conteosPorEstado.paid})</span>
        </button>

        <button
          type="button"
          onClick={() => irCon({ estado: "void" })}
          className={`px-4 min-h-[46px] rounded-xl text-[13.5px] font-semibold border transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold-700 flex items-center gap-2 ${
            estadoSeleccionado === "void"
              ? "bg-rose-600 text-white border-rose-600 shadow-xs"
              : "bg-surface hover:bg-surface-alt text-ink-muted border-line"
          }`}
        >
          <span className="size-2 rounded-full bg-rose-400" />
          <span>Anuladas ({conteosPorEstado.void})</span>
        </button>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-ink-muted pointer-events-none" />
          <input
            type="text"
            value={filtroTexto}
            onChange={(e) => setFiltroTexto(e.target.value)}
            placeholder="Buscar por cliente, proyecto o asesor…"
            className="w-full min-h-[46px] pl-10 pr-4 rounded-xl border border-line bg-surface text-[13.5px] text-navy-950 placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-gold-700 focus:border-gold-700 transition-colors shadow-2xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {esAdmin && (
            <select
              className="min-h-[46px] px-3.5 rounded-xl border border-line bg-surface text-navy-950 text-[13.5px] font-semibold focus:outline-none focus:ring-2 focus:ring-gold-700 shadow-2xs cursor-pointer w-full sm:w-auto"
              value={brokerIdSeleccionado ?? ""}
              onChange={(event) => irCon({ broker: event.target.value || undefined })}
            >
              <option value="">Todos los brokers</option>
              {brokers.map((broker) => (
                <option key={broker.id} value={broker.id}>
                  {broker.fullName}
                </option>
              ))}
            </select>
          )}

          <select
            className="min-h-[46px] px-3.5 rounded-xl border border-line bg-surface text-navy-950 text-[13.5px] font-semibold focus:outline-none focus:ring-2 focus:ring-gold-700 shadow-2xs cursor-pointer w-full sm:w-auto"
            value={periodoSeleccionado}
            onChange={(event) => irCon({ periodo: event.target.value })}
          >
            <option value="todos">Todos los periodos</option>
            {opcionesPeriodo.map((opcion) => (
              <option key={opcion.value} value={opcion.value}>
                {opcion.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabla Interactiva de Comisiones */}
      <div className="bg-surface border border-line/80 rounded-2xl overflow-hidden shadow-xs">
        <DataTable
          filas={filasFiltradas}
          columnas={columnasTabla}
          idDe={(f) => String(f.id)}
          etiqueta="Listado de comisiones"
          vacio={{
            titulo: "Sin comisiones",
            cuerpo: "No hay comisiones registradas para el filtro seleccionado.",
          }}
        />
      </div>

      {/* Modal para Anular Comisión (Reemplaza confirm() nativo) */}
      {comisionParaAnular && (
        <ModalConfirmarAnulacion
          comision={comisionParaAnular}
          onConfirmar={() => {
            const id = comisionParaAnular.id;
            setComisionParaAnular(null);
            void aplicar(
              id,
              { status: "void" },
              "Comisión anulada con éxito.",
              "No se pudo anular la comisión.",
            );
          }}
          onClose={() => setComisionParaAnular(null)}
        />
      )}

      {/* Modal para Editar Split / Reparto (Reemplaza prompt() y alert() nativos) */}
      {comisionParaSplit && (
        <ModalEditarSplit
          comision={comisionParaSplit}
          onGuardar={(nuevoBrokerBasisPoints) => {
            const id = comisionParaSplit.id;
            setComisionParaSplit(null);
            void aplicar(
              id,
              { brokerShareBasisPoints: nuevoBrokerBasisPoints },
              "Reparto interno actualizado exitosamente.",
              "No se pudo actualizar el reparto.",
            );
          }}
          onClose={() => setComisionParaSplit(null)}
        />
      )}
    </>
  );
}

/**
 * Modal accesible de confirmación de anulación (reemplaza confirm() nativo).
 */
function ModalConfirmarAnulacion({
  comision,
  onConfirmar,
  onClose,
}: {
  comision: FilaComisionVista;
  onConfirmar: () => void;
  onClose: () => void;
}) {
  return (
    <Modal title="Confirmar Anulación de Comisión" onClose={onClose}>
      <div className="flex items-start gap-4 mb-5">
        <div className="size-12 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-700 shrink-0">
          <Ban className="size-6" />
        </div>
        <div>
          <h3 className="font-heading font-bold text-lg text-navy-950 m-0">
            ¿Anular la comisión de {comision.contactName}?
          </h3>
          <p className="text-[13.5px] text-ink-muted mt-2 leading-relaxed m-0">
            Monto a anular:{" "}
            <strong className="text-navy-950 tabular-nums">
              {formatearMonto(comision.totalCommissionCents, comision.currency)}
            </strong>
            . Esta acción cancela la liquidación financiera y el reparto de este registro de forma permanente.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-line">
        <button
          className="inline-flex items-center justify-center min-h-[46px] px-5 rounded-xl border border-line bg-surface hover:bg-surface-alt text-navy-950 text-[13.5px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-gold-700 cursor-pointer"
          type="button"
          onClick={onClose}
        >
          Cancelar
        </button>
        <button
          className="inline-flex items-center justify-center min-h-[46px] px-6 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[13.5px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-gold-700 cursor-pointer shadow-sm"
          type="button"
          onClick={onConfirmar}
        >
          Confirmar Anulación
        </button>
      </div>
    </Modal>
  );
}

/**
 * Modal interactivo para ajuste de Split (reemplaza prompt() y alert() nativos).
 */
function ModalEditarSplit({
  comision,
  onGuardar,
  onClose,
}: {
  comision: FilaComisionVista;
  onGuardar: (brokerShareBasisPoints: number) => void;
  onClose: () => void;
}) {
  const [porcentajeBroker, setPorcentajeBroker] = useState<number>(() => comision.brokerShareBasisPoints / 100);
  const porcentajeAgencia = 100 - porcentajeBroker;

  const montoBrokerEstimado = Math.round((comision.totalCommissionCents * porcentajeBroker) / 100);
  const montoAgenciaEstimado = comision.totalCommissionCents - montoBrokerEstimado;

  function manejarGuardar() {
    onGuardar(Math.round(porcentajeBroker * 100));
  }

  return (
    <Modal title="Ajustar Split de Comisión" onClose={onClose}>
      <p className="text-[13.5px] text-ink-muted mb-6 leading-relaxed">
        Configura la distribución porcentual entre el asesor y la agencia para el negocio de{" "}
        <strong className="text-navy-950">{comision.contactName}</strong>.
      </p>

      {/* Comisión Total Base */}
      <div className="p-4 mb-6 rounded-xl bg-surface-alt/70 border border-line flex items-center justify-between">
        <span className="text-[13px] font-bold text-ink-muted uppercase">Comisión Total Generada</span>
        <strong className="text-xl font-heading font-black text-gold-700 tabular-nums">
          {formatearMonto(comision.totalCommissionCents, comision.currency)}
        </strong>
      </div>

      {/* Barra visual del Split */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-[13px] font-bold mb-2">
          <span className="text-navy-950">Broker: {porcentajeBroker}%</span>
          <span className="text-gold-700">Agencia: {porcentajeAgencia}%</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-3.5 overflow-hidden flex shadow-inner">
          <div
            className="bg-navy-950 h-full transition-all duration-150"
            style={{ width: `${porcentajeBroker}%` }}
          />
          <div
            className="bg-gold-500 h-full transition-all duration-150"
            style={{ width: `${porcentajeAgencia}%` }}
          />
        </div>
      </div>

      {/* Slider y Controles */}
      <div className="mb-6">
        <label className="block text-[13px] font-bold text-navy-950 uppercase tracking-wider mb-2">
          Porcentaje del Broker
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={porcentajeBroker}
            onChange={(e) => setPorcentajeBroker(Number(e.target.value))}
            className="w-full accent-gold-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
          />
          <div className="relative shrink-0 w-24">
            <input
              type="number"
              min={0}
              max={100}
              value={porcentajeBroker}
              onChange={(e) => {
                const val = Math.min(100, Math.max(0, Number(e.target.value)));
                setPorcentajeBroker(val);
              }}
              className="w-full min-h-[46px] px-3 pr-7 rounded-xl border border-line bg-surface text-[14px] font-bold text-navy-950 focus:outline-none focus:ring-2 focus:ring-gold-700 tabular-nums text-right"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted text-[13px] font-bold pointer-events-none">
              %
            </span>
          </div>
        </div>
      </div>

      {/* Simulación en dinero real */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="p-3.5 rounded-xl border border-line bg-surface">
          <span className="text-[13px] text-ink-muted font-semibold block">Liquidación Broker</span>
          <strong className="text-lg font-heading font-black text-navy-950 block mt-1 tabular-nums">
            {formatearMonto(montoBrokerEstimado, comision.currency)}
          </strong>
        </div>
        <div className="p-3.5 rounded-xl border border-line bg-surface">
          <span className="text-[13px] text-ink-muted font-semibold block">Margen Agencia</span>
          <strong className="text-lg font-heading font-black text-gold-700 block mt-1 tabular-nums">
            {formatearMonto(montoAgenciaEstimado, comision.currency)}
          </strong>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-line">
        <button
          className="inline-flex items-center justify-center min-h-[46px] px-5 rounded-xl border border-line bg-surface hover:bg-surface-alt text-navy-950 text-[13.5px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-gold-700 cursor-pointer"
          type="button"
          onClick={onClose}
        >
          Cancelar
        </button>
        <button
          className="inline-flex items-center justify-center min-h-[46px] px-6 rounded-xl bg-navy-950 hover:bg-navy-900 text-white text-[13.5px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-gold-700 cursor-pointer shadow-sm"
          type="button"
          onClick={manejarGuardar}
        >
          Guardar Reparto
        </button>
      </div>
    </Modal>
  );
}
