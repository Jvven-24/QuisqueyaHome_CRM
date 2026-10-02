/**
 * Caso de uso de Etapas: renombrar / reordenar / activar una etapa. Es el
 * comportamiento que vivía en `api/etapas/[id]/route.ts`, movido tal cual.
 */

import { NotFoundError } from "../../domain/errors.ts";
import type { Actor } from "../../domain/rbac.ts";
import type { UnidadDeTrabajo } from "../compartido/unidad-de-trabajo.ts";
import type { CambiosEtapa, Etapa, ReposEtapas } from "./puertos.ts";

export type DepsEtapas = { unidad: UnidadDeTrabajo<ReposEtapas> };

export async function editarEtapa(deps: DepsEtapas, actor: Actor, id: number, entrada: CambiosEtapa): Promise<Etapa> {
  return deps.unidad.ejecutar(async ({ etapas, auditoria }) => {
    const anterior = await etapas.buscar(id);
    if (!anterior) throw new NotFoundError();

    // Campo por campo: aunque llegara un `kind` o un `slug` (en runtime el tipo
    // no lo impide), no se copia. Una clave ausente no se escribe; `null` en
    // `defaultProbability` sí.
    const cambios: CambiosEtapa = {};
    if (entrada.name !== undefined) cambios.name = entrada.name;
    if (entrada.position !== undefined) cambios.position = entrada.position;
    if ("defaultProbability" in entrada) cambios.defaultProbability = entrada.defaultProbability;
    if (entrada.isActive !== undefined) cambios.isActive = entrada.isActive;

    const fila = await etapas.actualizar(id, cambios);

    await auditoria.registrar(actor, { accion: "editar", entidad: "pipeline_stage", entidadId: id, antes: anterior, despues: fila });

    return fila;
  });
}
