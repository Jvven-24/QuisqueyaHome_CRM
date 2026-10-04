"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { COMMISSION_STATUSES, type CommissionStatus } from "@/domain/catalogs";
import { COMMISSION_STATUS_LABELS } from "@/domain/comision-estado";
import { formatearMonto } from "../_ui/formato";
import { Metric, PageHeader } from "../_ui/prototipo-ui";
import { DataTable, type Columna } from "@/components/ui/data-table";
import { Insignia } from "@/components/ui/bits";
import { type Tone } from "@/components/ui/tone";
import { BadgeDollarSign, Ban, Check, DollarSign, Pencil } from "lucide-react";
import { nombreMes } from "@/domain/metas";

export type FilaComisionVista = {
  id: number;
  status: CommissionStatus;
  currency: string;
  saleAmountCents: number;
  commissionBasisPoints: number;
  totalCommissionCents: number;
  brokerShareBasisPoints: number;
  agencyShareBasisPoints: number;
  brokerAmountCents: number;
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
};

export type OpcionPeriodo = { value: string; label: string };

const ESTADO_TONE: Record<CommissionStatus, Tone> = {
  pending: "neutral",
  approved: "gold",
  paid: "ok",
  void: "danger",
};

/** Puntos básicos a porcentaje, sin decimales de sobra: 500 → "5%", 450 → "4.5%". */
function formatearPorcentaje(basisPoints: number): string {
  const valor = basisPoints / 100;
  return `${Number.isInteger(valor) ? valor : valor.toFixed(1)}%`;
}

/** "AAAA-MM" → "septiembre 2026"; `"todos"` → "todos los periodos" (etiqueta del KPI). */
function etiquetaPeriodo(periodo: string): string {
  if (periodo === "todos") return "todos los periodos";
  const [anio, mes] = periodo.split("-").map(Number);
  return `${nombreMes(mes!)} ${anio}`;
}

/**
 * M9 · Comisiones (F3, issue #31). `commissions` real en vez del mock:
 * filtros por broker/periodo/estado que navegan con `router.push` (mismo
 * patrón que `contactos/vista.tsx`), KPI calculados en el servidor y las
 * acciones de estado/reparto — todas detrás de `puedeEditar`, que ya viene
 * decidido por `commissions:edit` en `page.tsx` (ocultar el botón no es el
 * permiso; el 403 real está en `PATCH /api/comisiones/[id]`).
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
  const [ocupada, setOcupada] = useState<number | null>(null);

  function irCon(cambios: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [clave, valor] of Object.entries(cambios)) {
      if (valor) params.set(clave, valor);
      else params.delete(clave);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  async function aplicar(id: number, body: Record<string, unknown>, errorPorDefecto: string) {
    setOcupada(id);
    try {
      const respuesta = await fetch(`/api/comisiones/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!respuesta.ok) {
        const cuerpo = await respuesta.json().catch(() => ({}));
        alert(cuerpo.error ?? errorPorDefecto);
        return;
      }
      router.refresh();
    } catch {
      // Sin conexión, o el servidor no respondió: mismo mensaje que un 4xx/5xx
      // manejado — el usuario no necesita distinguir la causa, solo saber que
      // no se guardó.
      alert(errorPorDefecto);
    } finally {
      setOcupada(null);
    }
  }

  function cambiarEstado(fila: FilaComisionVista, status: "approved" | "paid" | "void") {
    if (status === "void" && !confirm(`¿Anular la comisión de ${fila.contactName}? Esta acción no se puede deshacer.`)) {
      return;
    }
    void aplicar(fila.id, { status }, "No se pudo actualizar el estado de la comisión.");
  }

  function editarReparto(fila: FilaComisionVista) {
    const actual = fila.brokerShareBasisPoints / 100;
    const respuesta = prompt(`Porcentaje del broker (el resto queda para la agencia):`, String(actual));
    if (respuesta === null) return;
    const porcentaje = Number(respuesta);
    if (!Number.isFinite(porcentaje) || porcentaje < 0 || porcentaje > 100) {
      alert("Escribe un porcentaje entre 0 y 100.");
      return;
    }
    void aplicar(
      fila.id,
      { brokerShareBasisPoints: Math.round(porcentaje * 100) },
      "No se pudo actualizar el reparto.",
    );
  }

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
          <div className="grid leading-tight min-w-0">
            <strong className="text-[13.5px] font-bold text-foreground truncate">{fila.contactName}</strong>
            <span className="text-[11.5px] text-muted-foreground truncate">{fila.projectName ?? "Propiedad directa"}</span>
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
          <span className="font-semibold text-foreground tabular-nums text-[13px]">
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
          <div className="text-right leading-tight">
            <span className="font-bold text-gold-600 tabular-nums text-[13px]">
              {formatearMonto(fila.totalCommissionCents, fila.currency)}
            </span>
            <small className="block text-[11px] text-muted-foreground">
              {formatearPorcentaje(fila.commissionBasisPoints)}
            </small>
          </div>
        ),
        valor: (fila) => fila.totalCommissionCents,
        ordenable: true,
      },
      {
        clave: "reparto",
        titulo: "Reparto Interno",
        celda: (fila) => (
          <span className="text-[12px] text-muted-foreground tabular-nums">
            <strong className="text-foreground">{formatearPorcentaje(fila.brokerShareBasisPoints)}</strong> broker /{" "}
            <strong className="text-foreground">{formatearPorcentaje(fila.agencyShareBasisPoints)}</strong> agencia
          </span>
        ),
        valor: (fila) => fila.brokerShareBasisPoints,
      },
      {
        clave: "broker",
        titulo: "Broker",
        celda: (fila) => (
          <span className="text-[12.5px] font-medium text-foreground">
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
                <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                  {fila.status === "pending" && (
                    <>
                      <button
                        className="inline-flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 transition-colors shadow-2xs cursor-pointer"
                        type="button"
                        disabled={ocupada === fila.id}
                        onClick={() => cambiarEstado(fila, "approved")}
                        title="Aprobar comisión"
                        aria-label="Aprobar comisión"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        className="inline-flex size-7 items-center justify-center rounded-lg bg-muted text-foreground hover:bg-muted/80 border border-border transition-colors shadow-2xs cursor-pointer"
                        type="button"
                        disabled={ocupada === fila.id}
                        onClick={() => editarReparto(fila)}
                        title="Editar reparto"
                        aria-label="Editar reparto"
                      >
                        <Pencil size={13} />
                      </button>
                    </>
                  )}
                  {fila.status === "approved" && (
                    <button
                      className="inline-flex size-7 items-center justify-center rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-300 transition-colors shadow-2xs cursor-pointer"
                      type="button"
                      disabled={ocupada === fila.id}
                      onClick={() => cambiarEstado(fila, "paid")}
                      title="Marcar pagada"
                      aria-label="Marcar pagada"
                    >
                      <BadgeDollarSign size={14} />
                    </button>
                  )}
                  {(fila.status === "pending" || fila.status === "approved") && (
                    <button
                      className="inline-flex size-7 items-center justify-center rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-300 transition-colors shadow-2xs cursor-pointer"
                      type="button"
                      disabled={ocupada === fila.id}
                      onClick={() => cambiarEstado(fila, "void")}
                      title="Anular comisión"
                      aria-label="Anular comisión"
                    >
                      <Ban size={13} />
                    </button>
                  )}
                </div>
              ),
            },
          ] as Columna<FilaComisionVista>[])
        : []),
    ],
    [puedeEditar, ocupada]
  );

  return (
    <>
      <PageHeader
        eyebrow="C9 · Finanzas internas"
        title="Comisiones"
        subtitle="Comisiones de Quisqueya Home, sin colaboración con agencias externas."
        action={
          puedeExportar ? (
            <a className="button secondary" href={`/api/comisiones/export?${parametrosExport.toString()}`}>
              Exportar reporte
            </a>
          ) : undefined
        }
      />
      <section className="metrics-row three">
        <Metric
          label={`Comisiones · ${etiquetaPeriodo(periodoSeleccionado)}`}
          value={formatearMonto(kpis.totalCents, "USD")}
          note={`${kpis.totalCount} negocio${kpis.totalCount === 1 ? "" : "s"} cerrado${kpis.totalCount === 1 ? "" : "s"}`}
        />
        <Metric
          label="Pendientes de pago"
          value={formatearMonto(kpis.pendientesCents, "USD")}
          note={`${kpis.porAprobarCount} por aprobar`}
        />
        <Metric
          label="Pagadas"
          value={formatearMonto(kpis.pagadasCents, "USD")}
          note="Ya liquidadas"
        />
      </section>
      <div className="filter-bar">
        {scope === "all" && (
          <select value={brokerIdSeleccionado ?? ""} onChange={(event) => irCon({ broker: event.target.value || undefined })}>
            <option value="">Todos los brokers</option>
            {brokers.map((broker) => (
              <option key={broker.id} value={broker.id}>
                {broker.fullName}
              </option>
            ))}
          </select>
        )}
        <select value={periodoSeleccionado} onChange={(event) => irCon({ periodo: event.target.value })}>
          <option value="todos">Todos los periodos</option>
          {opcionesPeriodo.map((opcion) => (
            <option key={opcion.value} value={opcion.value}>
              {opcion.label}
            </option>
          ))}
        </select>
        <select
          value={estadoSeleccionado}
          onChange={(event) => irCon({ estado: event.target.value === "todos" ? undefined : event.target.value })}
        >
          <option value="todos">Todos los estados</option>
          {COMMISSION_STATUSES.map((estado) => (
            <option key={estado} value={estado}>
              {COMMISSION_STATUS_LABELS[estado]}
            </option>
          ))}
        </select>
      </div>
      <div className="table-wrap">
        <DataTable
          filas={filas}
          columnas={columnasTabla}
          idDe={(f) => String(f.id)}
          etiqueta="Listado de comisiones"
          vacio={{
            titulo: "Sin comisiones",
            cuerpo: "No hay comisiones registradas para este filtro o periodo.",
          }}
        />
      </div>
    </>
  );
}
