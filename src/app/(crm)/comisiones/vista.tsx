"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { COMMISSION_STATUSES, type CommissionStatus } from "@/domain/catalogs";
import { COMMISSION_STATUS_LABELS } from "@/domain/comision-estado";
import { Badge, Metric, PageHeader } from "../_ui/prototipo-ui";
import { Vacio } from "../_ui/estados";

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

const ESTADO_TONE: Record<CommissionStatus, "neutral" | "gold" | "green" | "red" | "blue"> = {
  pending: "neutral",
  approved: "gold",
  paid: "green",
  void: "red",
};

function formatearMonto(cents: number, currency: string): string {
  return new Intl.NumberFormat("es-DO", { style: "currency", currency, maximumFractionDigits: 0 }).format(cents / 100);
}

/** Puntos básicos a porcentaje, sin decimales de sobra: 500 → "5%", 450 → "4.5%". */
function formatearPorcentaje(basisPoints: number): string {
  const valor = basisPoints / 100;
  return `${Number.isInteger(valor) ? valor : valor.toFixed(1)}%`;
}

/** "AAAA-MM" → "septiembre 2026"; `"todos"` → "todos los periodos" (etiqueta del KPI). */
function etiquetaPeriodo(periodo: string): string {
  if (periodo === "todos") return "todos los periodos";
  const [anio, mes] = periodo.split("-").map(Number);
  const fecha = new Date(Date.UTC(anio!, mes! - 1, 1));
  return new Intl.DateTimeFormat("es-DO", { month: "long", year: "numeric" }).format(fecha);
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
        {filas.length === 0 ? (
          <Vacio titulo="Sin comisiones" texto="No hay comisiones para este filtro." />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Negocio</th>
                <th>Monto de venta</th>
                <th>Comisión</th>
                <th>Reparto interno</th>
                <th>Broker</th>
                <th>Estado</th>
                {puedeEditar && <th></th>}
              </tr>
            </thead>
            <tbody>
              {filas.map((fila) => (
                <tr key={fila.id}>
                  <td>
                    {fila.contactName}
                    {fila.projectName ? ` · ${fila.projectName}` : ""}
                  </td>
                  <td>{formatearMonto(fila.saleAmountCents, fila.currency)}</td>
                  <td>{formatearPorcentaje(fila.commissionBasisPoints)}</td>
                  <td>
                    {formatearPorcentaje(fila.brokerShareBasisPoints)} broker / {formatearPorcentaje(fila.agencyShareBasisPoints)}{" "}
                    agencia
                  </td>
                  <td>{fila.brokerName ?? "Sin asignar"}</td>
                  <td>
                    <Badge tone={ESTADO_TONE[fila.status]}>{COMMISSION_STATUS_LABELS[fila.status]}</Badge>
                  </td>
                  {puedeEditar && (
                    <td className="table-actions">
                      {fila.status === "pending" && (
                        <>
                          <button
                            className="icon-button"
                            type="button"
                            disabled={ocupada === fila.id}
                            onClick={() => cambiarEstado(fila, "approved")}
                            aria-label="Aprobar comisión"
                          >
                            ✓
                          </button>
                          <button
                            className="icon-button"
                            type="button"
                            disabled={ocupada === fila.id}
                            onClick={() => editarReparto(fila)}
                            aria-label="Editar reparto"
                          >
                            ✎
                          </button>
                        </>
                      )}
                      {fila.status === "approved" && (
                        <button
                          className="icon-button"
                          type="button"
                          disabled={ocupada === fila.id}
                          onClick={() => cambiarEstado(fila, "paid")}
                          aria-label="Marcar pagada"
                        >
                          💲
                        </button>
                      )}
                      {(fila.status === "pending" || fila.status === "approved") && (
                        <button
                          className="icon-button"
                          type="button"
                          disabled={ocupada === fila.id}
                          onClick={() => cambiarEstado(fila, "void")}
                          aria-label="Anular comisión"
                        >
                          🚫
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
