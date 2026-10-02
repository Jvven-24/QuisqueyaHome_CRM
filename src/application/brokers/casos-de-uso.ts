/**
 * Caso de uso de Brokers: "Asignar propiedades" (decisión #38). El diff (qué se
 * asigna, qué se suelta) es `domain/asignacion-propiedades.ts`; aquí se aplica
 * dentro de una transacción y se audita cada proyecto que de verdad cambió —
 * nunca los que ya estaban como deben quedar.
 */

import { diffAsignacion } from "../../domain/asignacion-propiedades.ts";
import { ForbiddenError, NotFoundError } from "../../domain/errors.ts";
import type { Actor, PermissionScope } from "../../domain/rbac.ts";
import type { UnidadDeTrabajo } from "../compartido/unidad-de-trabajo.ts";
import type { Proyecto, ReposBrokers } from "./puertos.ts";

export type DepsBrokers = { unidad: UnidadDeTrabajo<ReposBrokers> };

export async function asignarProyectosABroker(
  deps: DepsBrokers,
  actor: Actor,
  alcance: PermissionScope,
  brokerId: number,
  projectIds: readonly number[],
): Promise<Proyecto[]> {
  // Solo `all` puede reasignar el proyecto de otro broker.
  if (alcance !== "all") {
    throw new ForbiddenError("Se requiere alcance completo sobre proyectos para asignar propiedades.");
  }

  const idsSolicitados = Array.from(new Set(projectIds));

  return deps.unidad.ejecutar(async ({ brokers, auditoria }) => {
    const broker = await brokers.buscarBroker(brokerId);
    if (!broker || !broker.isActive || broker.deletedAt) throw new NotFoundError("El broker indicado no existe.");

    const relevantes = await brokers.proyectosRelevantes(brokerId, idsSolicitados);

    const encontrados = new Set(relevantes.map((fila) => fila.id));
    if (idsSolicitados.some((id) => !encontrados.has(id))) {
      throw new NotFoundError("Alguno de los proyectos indicados no existe o no está activo.");
    }
    const antesPorId = new Map(relevantes.map((fila) => [fila.id, fila]));

    const asignadosActualmente = relevantes.filter((fila) => fila.brokerId === brokerId).map((fila) => fila.id);
    const { aAsignar, aQuitar } = diffAsignacion(asignadosActualmente, idsSolicitados);
    if (aAsignar.length === 0 && aQuitar.length === 0) return [];

    const filas: Proyecto[] = [];
    if (aAsignar.length > 0) filas.push(...(await brokers.asignar(aAsignar, brokerId, actor.userId)));
    if (aQuitar.length > 0) filas.push(...(await brokers.desasignar(aQuitar, actor.userId)));

    for (const fila of filas) {
      await auditoria.registrar(actor, {
        accion: "asignar",
        entidad: "project",
        entidadId: fila.id,
        antes: antesPorId.get(fila.id),
        despues: fila,
      });
    }

    return filas;
  });
}
