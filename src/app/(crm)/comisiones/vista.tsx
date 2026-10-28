"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";
import { prepararReparto } from "@/application/comisiones/reparto";
import { ValidationError } from "@/domain/errors";
import type { CommissionStatus } from "@/domain/catalogs";
import { COMMISSION_STATUS_LABELS } from "@/domain/comision-estado";
import { enlacesEstadoComisiones } from "./_navegacion";
import { montoExacto as formatearMonto } from "../reservas/_finanzas/calculos";
import { Modal } from "../_ui/prototipo-ui";
import { ModuleTabs, PageHeader, Section as Panel } from "@/components/modulo";
import { DataTable, type Columna } from "@/components/ui/data-table";
import { Insignia } from "@/components/ui/bits";
import { ResumenCompacto } from "@/components/ui/resumen-compacto";
import { type Tone } from "@/components/ui/tone";
import { mostrarToast } from "@/components/ui/toast";
import {
  BadgeDollarSign,
  Ban,
  Building2,
  Calculator,
  Check,
  Download,
  Pencil,
  Search,
} from "lucide-react";


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
    totalCents: string | number;
    pendientesCents: string | number;
    pagadasCents: string | number;
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


/**
 * M9 · Comisiones — Centro de Liquidaciones, Fiscalidad DGII RD y Reparto Financiero.
 * Cumple: Controles >= 44-48px, texto >= 13px, foco gold-700, sin alerts nativos, regla multimoneda M22.
 */
export function ComisionesVista({
  scope,
  conteos,
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
  conteos: Record<CommissionStatus | "todos", number>;
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
  const envioEnCurso = useRef(false);
  const [ocupada, setOcupada] = useState<number | null>(null);
  const [comisionParaAnular, setComisionParaAnular] = useState<FilaComisionVista | null>(null);
  const [comisionParaSplit, setComisionParaSplit] = useState<FilaComisionVista | null>(null);
  const [comisionInspector, setComisionInspector] = useState<FilaComisionVista | null>(null);
  const [filtroTexto, setFiltroTexto] = useState("");

  const esAdmin = scope === "all";


  function irCon(cambios: Record<string, string | undefined>) {
    if (!navigator.onLine) return;
    const params = new URLSearchParams(searchParams.toString());
    for (const [clave, valor] of Object.entries(cambios)) {
      if (valor) params.set(clave, valor);
      else params.delete(clave);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  const aplicar = useCallback(
    async (id: number, body: Record<string, unknown>, mensajeExito: string, errorPorDefecto: string) => {
      if (envioEnCurso.current) return;
      if (!navigator.onLine) { mostrarToast("error", "Sin conexión. Reconecta antes de actualizar la comisión."); return; }
      envioEnCurso.current = true;
      setOcupada(id);
      try {
        const respuesta = await fetch(`/api/comisiones/${id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json", "Idempotency-Key": crypto.randomUUID() },
          body: JSON.stringify(body),
        });
        if (!respuesta.ok) {
          const cuerpo = await respuesta.json().catch(() => ({}));
          mostrarToast("error", cuerpo.error ?? errorPorDefecto);
          return;
        }
        mostrarToast("success", mensajeExito);
        router.refresh();
      } catch {
        mostrarToast("error", errorPorDefecto);
      } finally {
        envioEnCurso.current = false;
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
  const conteosPorEstado = conteos;

  const parametrosExport = new URLSearchParams();
  if (brokerIdSeleccionado != null) parametrosExport.set("broker", String(brokerIdSeleccionado));
  parametrosExport.set("periodo", periodoSeleccionado);
  parametrosExport.set("estado", estadoSeleccionado);

  const estadosTab = enlacesEstadoComisiones(pathname, searchParams.toString(), conteosPorEstado);

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
            <span className="font-black text-navy-900 tabular-nums text-[14px]">
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
      {
        clave: "acciones",
        titulo: "Acciones",
        alinear: "derecha" as const,
        celda: (fila: FilaComisionVista) => (
          <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              className="inline-flex min-h-[42px] px-3 items-center justify-center gap-1.5 rounded-xl bg-surface text-navy-950 hover:bg-surface-alt border border-line text-xs font-bold transition-colors shadow-2xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold-700"
              type="button"
              onClick={() => setComisionInspector(fila)}
              title="Ver detalle de comisión"
            >
              <Calculator className="size-4 text-navy-900" />
              <span>Explicar cálculo</span>
            </button>
            {puedeEditar && fila.status === "pending" && (
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
                    <Pencil className="size-4 text-navy-900" />
                  </button>
                )}
              </>
            )}
            {puedeEditar && fila.status === "approved" && (
              <Link
                href="/comisiones/liquidaciones"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-amber-50 px-3 text-amber-900 hover:bg-amber-100 border border-amber-300 focus:outline-none focus:ring-2 focus:ring-gold-700"
                title="Vista previa de liquidaciones: no registra pagos"
              >
                <BadgeDollarSign className="size-5 text-amber-700" />
                <span>Vista previa de liquidaciones</span>
              </Link>
            )}
            {puedeEditar && (fila.status === "pending" || fila.status === "approved") && (
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
    ],
    [puedeEditar, esAdmin, ocupada, aplicar],
  );

  return (
    <>
      <PageHeader
        eyebrow="Finanzas y Liquidación"
        title="Comisiones"
        description="Control interno de liquidaciones, aprobación de pagos y desglose de reparto entre broker y agencia."
        actions={
          puedeExportar ? (
            <a
              className="inline-flex items-center justify-center gap-2 min-h-[46px] px-5 rounded-xl border border-line bg-surface hover:bg-surface-alt text-navy-950 text-[13.5px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-gold-700 shadow-2xs cursor-pointer"
              download
              href={`/api/comisiones/export?${parametrosExport.toString()}`}
            >
              <Download className="size-4 text-gold-600" />
              <span>Exportar reporte CSV</span>
            </a>
          ) : undefined
        }
      />

      <div className="mb-4 grid gap-3 md:grid-cols-2">{kpis.porMoneda?.map(m=><Panel key={m.currency} title={`Comisiones · ${m.currency}`}><div className="grid grid-cols-2 gap-2"><ResumenCompacto etiqueta="Total registrado" valor={formatearMonto(m.totalCents,m.currency)} /><ResumenCompacto etiqueta="Pendientes y aprobadas" valor={formatearMonto(m.pendientesCents,m.currency)} /><ResumenCompacto etiqueta="Marcadas como pagadas" valor={formatearMonto(m.pagadasCents,m.currency)} /></div></Panel>)}</div>

      {/* Bandeja Interactiva: Pestañas de Estado Semántico */}
      <ModuleTabs
        label="Estados de comisión"
        items={estadosTab}
        queryParam="tab"
        activeTab={estadoSeleccionado}
        panelId="comisiones-panel"
        className="mb-4"
      />

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-ink-muted pointer-events-none" />
          <input
            type="text"
            value={filtroTexto}
            onChange={(e) => setFiltroTexto(e.target.value)}
            aria-label="Buscar por cliente, proyecto o asesor"
            placeholder="Buscar por cliente, proyecto o asesor…"
            className="w-full min-h-[46px] pl-10 pr-4 rounded-xl border border-line bg-surface text-[13.5px] text-navy-950 placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-gold-700 focus:border-gold-700 transition-colors shadow-2xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {esAdmin && (
            <select
              className="min-h-[46px] px-3.5 rounded-xl border border-line bg-surface text-navy-950 text-[13.5px] font-semibold focus:outline-none focus:ring-2 focus:ring-gold-700 shadow-2xs cursor-pointer w-full sm:w-auto"
              aria-label="Broker"
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
            aria-label="Periodo"
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
      <Panel className="overflow-hidden p-0">
      <div id="comisiones-panel" role="tabpanel" aria-labelledby={`comisiones-panel-tab-${estadoSeleccionado}`} tabIndex={0} className="overflow-hidden focus-visible:outline-2 focus-visible:outline-gold-700">
        <DataTable
          filas={filasFiltradas}
          columnas={columnasTabla}
          idDe={(f) => String(f.id)}
          onAbrir={(f) => setComisionInspector(f)}
          etiqueta="Listado de comisiones"
          vacio={{
            titulo: "Sin comisiones",
            cuerpo: "No hay comisiones registradas para el filtro seleccionado.",
          }}
        />
      </div>
      </Panel>

      {/* Modal Inspector 360° Fiscal DGII y Sub-Splits */}
      {comisionInspector && (
        <ModalInspectorComision
          comision={comisionInspector}
          onClose={() => setComisionInspector(null)}
        />
      )}

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

/** Detalle de importes persistidos en la comisión. */
function ModalInspectorComision({ comision, onClose }: { comision: FilaComisionVista; onClose: () => void }) {
  return <Modal title="Explicar cálculo" onClose={onClose}>
    <p>{comision.contactName} · {comision.projectName ?? "Sin proyecto asociado"}</p>
    <p className="my-3 tabular-nums">Venta {formatearMonto(comision.saleAmountCents,comision.currency)} × {formatearPorcentaje(comision.commissionBasisPoints)} = {formatearMonto(comision.totalCommissionCents,comision.currency)}</p>
    <p>Fecha de cierre: {comision.closedDate ?? "Sin fecha registrada"}. Fechas de aprobación y pago no disponibles en esta consulta.</p>
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div><dt>Estado</dt><dd>{COMMISSION_STATUS_LABELS[comision.status]}</dd></div>
      <div><dt>Asesor</dt><dd>{comision.brokerName ?? "Sin asignar"}</dd></div>
      <div><dt>Comisión total</dt><dd>{formatearMonto(comision.totalCommissionCents, comision.currency)}</dd></div>
      <div><dt>Importe del broker ({formatearPorcentaje(comision.brokerShareBasisPoints)})</dt><dd>{formatearMonto(comision.brokerAmountCents, comision.currency)}</dd></div>
      <div><dt>Importe de la agencia ({formatearPorcentaje(comision.agencyShareBasisPoints)})</dt><dd>{comision.agencyAmountCents == null ? "Sin importe registrado" : formatearMonto(comision.agencyAmountCents, comision.currency)}</dd></div>
    </dl>
    <p className="text-[13px] text-ink-muted">No hay información fiscal ni subrepartos registrados para esta comisión.</p>
  </Modal>;
}

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
  const [valorBroker, setValorBroker] = useState(String(comision.brokerShareBasisPoints / 100));
  const [errorReparto, setErrorReparto] = useState<string | null>(null);
  const porcentajeBroker = Number(valorBroker);
  const porcentajeAgencia = 100 - porcentajeBroker;
  let reparto: ReturnType<typeof prepararReparto> | null = null;
  try { reparto = prepararReparto(comision.totalCommissionCents, valorBroker); } catch { /* Se explica al enviar. */ }

  function manejarGuardar() {
    try { onGuardar(prepararReparto(comision.totalCommissionCents, valorBroker).brokerShareBasisPoints); }
    catch (error) {
      setErrorReparto(error instanceof ValidationError ? error.fields.brokerShareBasisPoints! : "No se pudo validar el reparto.");
    }
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
        <strong className="text-xl font-heading font-black text-navy-900 tabular-nums">
          {formatearMonto(comision.totalCommissionCents, comision.currency)}
        </strong>
      </div>

      {/* Barra visual del Split */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-[13px] font-bold mb-2">
          <span className="text-navy-950">Broker: {reparto ? `${porcentajeBroker}%` : "—"}</span>
          <span className="text-navy-900">Agencia: {reparto ? `${porcentajeAgencia}%` : "—"}</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-3.5 overflow-hidden flex shadow-inner">
          <div
            className="bg-navy-950 h-full transition-all duration-150"
            style={{ width: `${reparto ? porcentajeBroker : 0}%` }}
          />
          <div
            className="bg-gold-500 h-full transition-all duration-150"
            style={{ width: `${reparto ? porcentajeAgencia : 0}%` }}
          />
        </div>
      </div>

      {/* Slider y Controles */}
      <div className="mb-6">
        <label className="block text-[13px] font-bold text-navy-950 uppercase tracking-wider mb-2">
          Porcentaje del broker (obligatorio)
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={porcentajeBroker}
            onChange={(e) => setValorBroker(e.target.value)}
            className="w-full accent-gold-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
          />
          <div className="relative shrink-0 w-24">
            <input
              type="number"
              min={0}
              max={100}
              value={valorBroker}
              step="0.01"
              aria-label="Porcentaje del broker (obligatorio)"
              aria-invalid={Boolean(errorReparto)}
              aria-describedby="error-reparto"
              onChange={(e) => setValorBroker(e.target.value)}
              className="w-full min-h-[46px] px-3 pr-7 rounded-xl border border-line bg-surface text-[14px] font-bold text-navy-950 focus:outline-none focus:ring-2 focus:ring-gold-700 tabular-nums text-right"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted text-[13px] font-bold pointer-events-none">
              %
            </span>
          </div>
        </div>
      </div>

      {errorReparto && <p id="error-reparto" role="alert">{errorReparto}</p>}
      {/* Vista previa del reparto sobre la comisión registrada */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="p-3.5 rounded-xl border border-line bg-surface">
          <span className="text-[13px] text-ink-muted font-semibold block">Liquidación Broker</span>
          <strong className="text-lg font-heading font-black text-navy-950 block mt-1 tabular-nums">
            {reparto ? formatearMonto(reparto.brokerAmountCents, comision.currency) : "—"}
          </strong>
        </div>
        <div className="p-3.5 rounded-xl border border-line bg-surface">
          <span className="text-[13px] text-ink-muted font-semibold block">Margen Agencia</span>
          <strong className="text-lg font-heading font-black text-navy-900 block mt-1 tabular-nums">
            {reparto ? formatearMonto(reparto.agencyAmountCents, comision.currency) : "—"}
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

