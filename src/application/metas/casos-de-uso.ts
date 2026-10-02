/**
 * Caso de uso de Metas: fijar la meta mensual (decisión #35). `brokerId: null`
 * es la meta de la compañía. Nunca toca lo alcanzado: eso solo lo escribe el
 * cierre de pipeline (ver `puertos.ts`).
 */

import { ForbiddenError, NotFoundError } from "../../domain/errors.ts";
import { reaches, type Actor, type PermissionScope } from "../../domain/rbac.ts";
import type { UnidadDeTrabajo } from "../compartido/unidad-de-trabajo.ts";
import type { Meta, ReposMetas } from "./puertos.ts";

export type DepsMetas = { unidad: UnidadDeTrabajo<ReposMetas> };

export type EntradaFijarMeta = {
  brokerId: number | null;
  year: number;
  month: number;
  targetDeals: number;
  targetAmountCents?: number;
};

export async function fijarMetaMensual(
  deps: DepsMetas,
  actor: Actor,
  alcance: PermissionScope,
  entrada: EntradaFijarMeta,
): Promise<Meta> {
  // El alcance de `goals:edit` no basta por sí solo: con alcance `own`, quien
  // tiene el permiso solo puede fijar su propia meta, nunca la de otro broker ni
  // la de la compañía (`brokerId` nulo, que `reaches` trata como inalcanzable
  // salvo con alcance `all`).
  if (!reaches(actor, alcance, entrada.brokerId)) {
    throw new ForbiddenError("No tienes permiso para fijar esta meta.");
  }

  return deps.unidad.ejecutar(async ({ metas, auditoria }) => {
    if (entrada.brokerId != null) {
      if (!(await metas.existePerfilDeBroker(entrada.brokerId))) {
        throw new NotFoundError("El broker indicado no tiene perfil de broker.");
      }
    }

    const { anterior, meta } = await metas.fijarMetaMensual({
      brokerId: entrada.brokerId,
      year: entrada.year,
      month: entrada.month,
      targetDeals: entrada.targetDeals,
      ...(entrada.targetAmountCents !== undefined ? { targetAmountCents: entrada.targetAmountCents } : {}),
      actorId: actor.userId,
    });

    await auditoria.registrar(actor, {
      accion: anterior ? "editar" : "crear",
      entidad: "goal",
      entidadId: meta.id,
      antes: anterior,
      despues: meta,
    });

    return meta;
  });
}
