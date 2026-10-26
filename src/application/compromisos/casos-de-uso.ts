import { createHash } from "node:crypto";
import type { Actor, PermissionScope } from "../../domain/rbac.ts";
import type { UnidadDeTrabajo } from "../compartido/unidad-de-trabajo.ts";
import type {
  EntradaCancelarHold,
  EntradaCrearHold,
  EntradaExtenderHold,
  Hold,
  ReposCompromisos,
} from "./puertos.ts";

export type DepsCompromisos = {
  unidad: UnidadDeTrabajo<ReposCompromisos>;
};

export async function crearHold(
  deps: DepsCompromisos,
  actor: Actor,
  _scope: PermissionScope,
  entrada: Omit<EntradaCrearHold, "actorId" | "requestHash">,
): Promise<Hold> {
  const canonicalPayload = JSON.stringify({
    operacion: "HOLD_CREAR",
    dealId: entrada.dealId,
    holderId: entrada.holderId ?? actor.userId,
    units: entrada.units
      .map(u => ({
        unitId: u.unitId,
        priceVersion: u.priceVersion,
        priceCents: u.priceCents.toString(),
        currency: u.currency,
        componentRole: u.componentRole,
      }))
      .sort((a, b) => a.unitId - b.unitId),
    reason: entrada.reason,
    policyVersion: entrada.policyVersion ?? 1,
    durationHours: entrada.durationHours ?? 48,
  });
  const requestHash = createHash("sha256").update(canonicalPayload).digest("hex");

  return deps.unidad.ejecutar(async ({ compromisos }) => {
    return compromisos.crearHold({
      ...entrada,
      holderId: entrada.holderId ?? actor.userId,
      actorId: actor.userId,
      requestHash,
    });
  });
}

export async function extenderHold(
  deps: DepsCompromisos,
  actor: Actor,
  _scope: PermissionScope,
  id: number | string,
  entrada: Omit<EntradaExtenderHold, "id" | "actorId" | "requestHash">,
): Promise<Hold> {
  const canonicalPayload = JSON.stringify({
    operacion: "HOLD_EXTENDER",
    id,
    expectedVersion: entrada.expectedVersion,
    reason: entrada.reason,
    additionalHours: entrada.additionalHours ?? 24,
  });
  const requestHash = createHash("sha256").update(canonicalPayload).digest("hex");

  return deps.unidad.ejecutar(async ({ compromisos }) => {
    return compromisos.extenderHold({
      ...entrada,
      id,
      actorId: actor.userId,
      requestHash,
    });
  });
}

export async function cancelarHold(
  deps: DepsCompromisos,
  actor: Actor,
  _scope: PermissionScope,
  id: number | string,
  entrada: Omit<EntradaCancelarHold, "id" | "actorId" | "requestHash">,
): Promise<Hold> {
  const canonicalPayload = JSON.stringify({
    operacion: "HOLD_CANCELAR",
    id,
    expectedVersion: entrada.expectedVersion,
    reason: entrada.reason,
  });
  const requestHash = createHash("sha256").update(canonicalPayload).digest("hex");

  return deps.unidad.ejecutar(async ({ compromisos }) => {
    return compromisos.cancelarHold({
      ...entrada,
      id,
      actorId: actor.userId,
      requestHash,
    });
  });
}
