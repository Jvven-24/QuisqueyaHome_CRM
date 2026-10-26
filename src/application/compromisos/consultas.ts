import type { Actor, PermissionScope } from "../../domain/rbac.ts";
import { NotFoundError } from "../../domain/errors.ts";
import type { DepsCompromisos } from "./casos-de-uso.ts";
import type { FiltrosHolds, Hold } from "./puertos.ts";

export async function consultarHoldPorPublicId(
  deps: DepsCompromisos,
  actor: Actor,
  scope: PermissionScope,
  publicId: string,
): Promise<Hold> {
  const hold = await deps.unidad.ejecutar(async ({ compromisos }) => {
    return compromisos.buscarHoldPorPublicId(publicId, actor, scope);
  });
  if (!hold) throw new NotFoundError("Hold no encontrado.");
  return hold;
}

export async function consultarHoldPorId(
  deps: DepsCompromisos,
  actor: Actor,
  scope: PermissionScope,
  id: number,
): Promise<Hold> {
  const hold = await deps.unidad.ejecutar(async ({ compromisos }) => {
    return compromisos.buscarHoldPorId(id, actor, scope);
  });
  if (!hold) throw new NotFoundError("Hold no encontrado.");
  return hold;
}

export async function listarHolds(
  deps: DepsCompromisos,
  actor: Actor,
  scope: PermissionScope,
  filtros: FiltrosHolds = {},
): Promise<Hold[]> {
  return deps.unidad.ejecutar(async ({ compromisos }) => {
    return compromisos.listarHolds(filtros, actor, scope);
  });
}
