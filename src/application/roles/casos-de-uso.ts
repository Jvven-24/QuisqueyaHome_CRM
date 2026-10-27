/** Caso de uso de la matriz de permisos (`docs/R_ANALISIS_Y_PLAN.md` §7 R3.5; decisión #27). */

import { ForbiddenError, NotFoundError } from "../../domain/errors.ts";
import type { Actor } from "../../domain/rbac.ts";
import type { UnidadDeTrabajo } from "../compartido/unidad-de-trabajo.ts";
import type { Permiso, ReposRoles } from "./puertos.ts";

const MENSAJE_ADMIN = "Los permisos del rol administrador no son editables.";

export async function editarPermisos(
  deps: { unidad: UnidadDeTrabajo<ReposRoles> },
  actor: Actor,
  roleId: number,
  permisos: Permiso[],
): Promise<{ roleId: number }> {
  return deps.unidad.ejecutar(async ({ roles, auditoria }) => {
    const rol = await roles.buscar(roleId);
    if (!rol) throw new NotFoundError("El rol indicado no existe.");
    // Protección de auditoría del 29/09/2026: el rol administrador mantiene
    // sus permisos fijos; quitarla permitiría editar el perímetro del sistema.
    if (rol.isProtected) {
      throw new ForbiddenError(MENSAJE_ADMIN);
    }
    const antes = await roles.listarPermisos(roleId);
    for (const permiso of permisos) await roles.guardarPermiso(roleId, permiso);
    const claves = new Set(permisos.map((permiso) => `${permiso.resource}:${permiso.action}`));
    for (const permiso of antes) {
      if (!claves.has(`${permiso.resource}:${permiso.action}`)) await roles.borrarPermiso(roleId, permiso);
    }
    await auditoria.registrar(actor, { accion: "editar", entidad: "role", entidadId: roleId, antes: { permisos: antes }, despues: { permisos } });
    return { roleId };
  });
}
