import { createHash } from "node:crypto";
import type { Actor, PermissionScope } from "../../domain/rbac.ts";
import type { UnidadDeTrabajo } from "../compartido/unidad-de-trabajo.ts";
import type {
  EntradaCambiarUnidadReserva,
  EntradaCancelarReserva,
  EntradaConfirmarReserva,
  EntradaCrearReserva,
  ReposReservas,
  Reserva,
} from "./puertos.ts";

export type DepsReservas = {
  unidad: UnidadDeTrabajo<ReposReservas>;
};

export async function crearReserva(
  deps: DepsReservas,
  actor: Actor,
  _scope: PermissionScope,
  entrada: Omit<EntradaCrearReserva, "actorId" | "requestHash">,
): Promise<Reserva> {
  const canonicalPayload = JSON.stringify({
    operacion: "RESERVA_CREAR",
    dealId: entrada.dealId,
    holdId: entrada.holdId ?? null,
    status: entrada.status ?? "pendiente_pago",
    currency: entrada.currency,
    totalCents: entrada.totalCents.toString(),
    adjustmentCents: (entrada.adjustmentCents ?? 0n).toString(),
    depositRequiredCents: entrada.depositRequiredCents.toString(),
    conditionsVersion: entrada.conditionsVersion,
    conditionsDocumentId: entrada.conditionsDocumentId,
    conditionsHash: entrada.conditionsHash,
    expiresAt: entrada.expiresAt ? entrada.expiresAt.toISOString() : null,
    reason: entrada.reason,
    parties: [...entrada.parties]
      .map(p => ({
        contactId: p.contactId,
        role: p.role,
        representationEvidenceId: p.representationEvidenceId ?? null,
      }))
      .sort((a, b) => a.contactId - b.contactId),
    units: [...entrada.units]
      .map(u => ({
        unitId: u.unitId,
        priceCents: u.priceCents.toString(),
        currency: u.currency,
        componentRole: u.componentRole,
      }))
      .sort((a, b) => a.unitId - b.unitId),
  });
  const requestHash = createHash("sha256").update(canonicalPayload).digest("hex");

  return deps.unidad.ejecutar(async ({ reservas }) => {
    return reservas.crearReserva({
      ...entrada,
      actorId: actor.userId,
      requestHash,
    });
  });
}

export async function confirmarReserva(
  deps: DepsReservas,
  actor: Actor,
  _scope: PermissionScope,
  id: number | string,
  entrada: Omit<EntradaConfirmarReserva, "id" | "actorId" | "requestHash">,
): Promise<Reserva> {
  const canonicalPayload = JSON.stringify({
    operacion: "RESERVA_CONFIRMAR",
    id,
    expectedVersion: entrada.expectedVersion,
    confirmationEvidenceId: entrada.confirmationEvidenceId,
    reason: entrada.reason,
  });
  const requestHash = createHash("sha256").update(canonicalPayload).digest("hex");

  return deps.unidad.ejecutar(async ({ reservas }) => {
    return reservas.confirmarReserva({
      ...entrada,
      id,
      actorId: actor.userId,
      requestHash,
    });
  });
}

export async function cambiarUnidadReserva(
  deps: DepsReservas,
  actor: Actor,
  _scope: PermissionScope,
  id: number | string,
  entrada: Omit<EntradaCambiarUnidadReserva, "id" | "actorId" | "requestHash">,
): Promise<Reserva> {
  const canonicalPayload = JSON.stringify({
    operacion: "RESERVA_CAMBIO_UNIDAD",
    id,
    expectedVersion: entrada.expectedVersion,
    oldUnitId: entrada.oldUnitId,
    newUnit: {
      unitId: entrada.newUnit.unitId,
      priceCents: entrada.newUnit.priceCents.toString(),
      currency: entrada.newUnit.currency,
      componentRole: entrada.newUnit.componentRole,
    },
    releaseReason: entrada.releaseReason,
    reason: entrada.reason,
  });
  const requestHash = createHash("sha256").update(canonicalPayload).digest("hex");

  return deps.unidad.ejecutar(async ({ reservas }) => {
    return reservas.cambiarUnidad({
      ...entrada,
      id,
      actorId: actor.userId,
      requestHash,
    });
  });
}

export async function cancelarReserva(
  deps: DepsReservas,
  actor: Actor,
  _scope: PermissionScope,
  id: number | string,
  entrada: Omit<EntradaCancelarReserva, "id" | "actorId" | "requestHash">,
): Promise<Reserva> {
  const canonicalPayload = JSON.stringify({
    operacion: "RESERVA_CANCELAR",
    id,
    expectedVersion: entrada.expectedVersion,
    action: entrada.action ?? "cancelar",
    reason: entrada.reason,
  });
  const requestHash = createHash("sha256").update(canonicalPayload).digest("hex");

  return deps.unidad.ejecutar(async ({ reservas }) => {
    return reservas.cancelarReserva({
      ...entrada,
      id,
      actorId: actor.userId,
      requestHash,
    });
  });
}
