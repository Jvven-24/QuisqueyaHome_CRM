/**
 * Casos de uso de Comisiones: editar estado/reparto de una comisión y exportar
 * el CSV. Es el comportamiento que vivía en `api/comisiones/**`, movido tal cual.
 *
 * Las reglas de qué transición vale y cuándo se puede tocar el reparto son del
 * dominio (`domain/comision-estado.ts`); aquí solo se aplican.
 */

import { calcularComision } from "../../domain/cierre-negocio.ts";
import { COMMISSION_STATUS_LABELS, validarRepartoEditable, validarTransicionComision } from "../../domain/comision-estado.ts";
import { generarCsv } from "../../domain/csv.ts";
import { NotFoundError } from "../../domain/errors.ts";
import { formatoPeriodo } from "../../domain/metas.ts";
import { reaches, type Actor, type PermissionScope } from "../../domain/rbac.ts";
import type { UnidadDeTrabajo } from "../compartido/unidad-de-trabajo.ts";
import type { CambiosComision, Comision, FiltrosComisiones, LeerFilasComisiones, ReposComisiones } from "./puertos.ts";

export type DepsComisiones = { unidad: UnidadDeTrabajo<ReposComisiones> };

export type EntradaEditarComision = {
  status?: "approved" | "paid" | "void";
  brokerShareBasisPoints?: number;
};

export async function editarComision(
  deps: DepsComisiones,
  actor: Actor,
  alcance: PermissionScope,
  id: number,
  entrada: EntradaEditarComision,
): Promise<Comision> {
  return deps.unidad.ejecutar(async ({ comisiones, auditoria }) => {
    // Bloqueo de fila (solo `commissions`, ver `puertos.ts`): lo que se lee aquí
    // es el estado REAL aunque otra petición acabe de cambiarlo.
    const bloqueada = await comisiones.bloquearComision(id);
    // "No existe", "el negocio se borró" y "existe pero fuera de tu alcance"
    // responden igual (`domain/errors.ts`): un broker no debe poder confirmar
    // por la respuesta que la comisión de otro existe, ni que existió un negocio
    // detrás de una comisión ya sin uno vigente.
    if (!bloqueada || bloqueada.negocioBorradoEn != null || !reaches(actor, alcance, bloqueada.comision.brokerId)) {
      throw new NotFoundError();
    }
    const anterior = bloqueada.comision;

    const cambios: CambiosComision = { updatedBy: actor.userId };

    if (entrada.status !== undefined) {
      validarTransicionComision(anterior.status, entrada.status);
      cambios.status = entrada.status;
      if (entrada.status === "approved") {
        cambios.approvedBy = actor.userId;
        cambios.approvedAt = new Date();
      }
      if (entrada.status === "paid") {
        cambios.paidAt = new Date();
      }
    }

    if (entrada.brokerShareBasisPoints !== undefined) {
      // Se valida contra el estado *actual* de la fila, no contra el `status`
      // que esta misma entrada pudiera estar cambiando a la vez: la UI nunca
      // envía los dos juntos, y decidir un orden implícito aquí solo escondería
      // la regla.
      validarRepartoEditable(anterior.status);
      // El total no cambia (`saleAmountCents`/`commissionBasisPoints` siguen
      // siendo los del cierre): solo se recalcula cómo se reparte.
      const { brokerAmountCents, agencyAmountCents } = calcularComision({
        saleAmountCents: anterior.saleAmountCents,
        commissionBasisPoints: anterior.commissionBasisPoints,
        brokerShareBasisPoints: entrada.brokerShareBasisPoints,
      });
      cambios.brokerShareBasisPoints = entrada.brokerShareBasisPoints;
      cambios.agencyShareBasisPoints = 10_000 - entrada.brokerShareBasisPoints;
      cambios.brokerAmountCents = brokerAmountCents;
      cambios.agencyAmountCents = agencyAmountCents;
    }

    const fila = await comisiones.actualizar(id, cambios);

    await auditoria.registrar(actor, {
      accion: "editar",
      entidad: "commission",
      entidadId: id,
      antes: anterior,
      despues: fila,
    });

    return fila;
  });
}

export const ENCABEZADO_CSV_COMISIONES = [
  "Negocio",
  "Proyecto",
  "Monto de venta",
  "Comisión %",
  "Total comisión",
  "Broker %",
  "Agencia %",
  "Monto broker",
  "Monto agencia",
  "Broker",
  "Estado",
  "Fecha de cierre",
] as const;

export type DepsExportacionComisiones = { leerFilas: LeerFilasComisiones };

/**
 * Genera el CSV de comisiones con la misma consulta (alcance y filtros) que la
 * pantalla: quien exporta nunca descarga una fila que la tabla no le mostró.
 * Devuelve el texto y el nombre de archivo; las cabeceras HTTP las pone la ruta.
 */
export async function exportarComisionesCsv(
  deps: DepsExportacionComisiones,
  actor: Actor,
  alcance: PermissionScope,
  filtros: FiltrosComisiones,
): Promise<{ csv: string; nombreArchivo: string }> {
  const filas = await deps.leerFilas(actor, alcance, filtros);

  const csv = generarCsv(
    ENCABEZADO_CSV_COMISIONES,
    filas.map((fila) => [
      fila.contactName,
      fila.projectName ?? "",
      (fila.saleAmountCents / 100).toFixed(2),
      (fila.commissionBasisPoints / 100).toString(),
      (fila.totalCommissionCents / 100).toFixed(2),
      (fila.brokerShareBasisPoints / 100).toString(),
      (fila.agencyShareBasisPoints / 100).toString(),
      (fila.brokerAmountCents / 100).toFixed(2),
      (fila.agencyAmountCents / 100).toFixed(2),
      fila.brokerName ?? "Sin asignar",
      COMMISSION_STATUS_LABELS[fila.status],
      fila.closedDate ?? "",
    ]),
  );

  const nombrePeriodo = filtros.periodo ? formatoPeriodo(filtros.periodo) : "todos";
  return { csv, nombreArchivo: `comisiones-${nombrePeriodo}.csv` };
}
