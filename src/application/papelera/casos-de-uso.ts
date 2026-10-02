/**
 * Caso de uso de Papelera: restaurar una fila borrada lógicamente. Es el
 * comportamiento que vivía en `api/papelera/restaurar/route.ts`, movido tal cual.
 */

import { NotFoundError } from "../../domain/errors.ts";
import type { Actor } from "../../domain/rbac.ts";
import type { UnidadDeTrabajo } from "../compartido/unidad-de-trabajo.ts";
import type { EntidadPapelera, FilaPapelera, ReposPapelera } from "./puertos.ts";

export type DepsPapelera = { unidad: UnidadDeTrabajo<ReposPapelera> };

export async function restaurarDePapelera(
  deps: DepsPapelera,
  actor: Actor,
  entidad: EntidadPapelera,
  id: number,
): Promise<FilaPapelera> {
  return deps.unidad.ejecutar(async ({ papelera, auditoria }) => {
    const anterior = await papelera.buscar(entidad, id);
    // No existe, o existe pero no está borrada: la misma respuesta.
    if (!anterior || !("deletedAt" in anterior) || anterior.deletedAt === null) throw new NotFoundError();

    const restaurada = await papelera.restaurar(entidad, id);

    await auditoria.registrar(actor, { accion: "restaurar", entidad, entidadId: id, antes: anterior, despues: restaurada });

    return restaurada;
  });
}
