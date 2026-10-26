import { NotFoundError } from "../../domain/errors.ts";
import type { Actor, PermissionScope } from "../../domain/rbac.ts";
import type { DepsReservas } from "./casos-de-uso.ts";
import type { FiltrosReservas, Reserva } from "./puertos.ts";

export async function consultarReservaPorPublicId(
  deps: DepsReservas,
  actor: Actor,
  scope: PermissionScope,
  publicId: string,
): Promise<Reserva> {
  return deps.unidad.ejecutar(async ({ reservas }) => {
    const reserva = await reservas.buscarReservaPorPublicId(publicId, actor, scope);
    if (!reserva) {
      throw new NotFoundError("Reserva no encontrada.");
    }
    return reserva;
  });
}

export async function consultarReservaPorId(
  deps: DepsReservas,
  actor: Actor,
  scope: PermissionScope,
  id: number,
): Promise<Reserva> {
  return deps.unidad.ejecutar(async ({ reservas }) => {
    const reserva = await reservas.buscarReservaPorId(id, actor, scope);
    if (!reserva) {
      throw new NotFoundError("Reserva no encontrada.");
    }
    return reserva;
  });
}

export async function listarReservas(
  deps: DepsReservas,
  actor: Actor,
  scope: PermissionScope,
  filtros: FiltrosReservas,
): Promise<Reserva[]> {
  return deps.unidad.ejecutar(async ({ reservas }) => {
    return reservas.listarReservas(filtros, actor, scope);
  });
}
