/** Caso de uso de la matriz de permisos (`docs/R_ANALISIS_Y_PLAN.md` §7 R3.5; decisión #27). */

import { ForbiddenError, NotFoundError, ValidationError } from "../../domain/errors.ts";
import { scopeFor, type Actor } from "../../domain/rbac.ts";
import type { UnidadDeTrabajo } from "../compartido/unidad-de-trabajo.ts";
import type { Permiso, ReposRoles } from "./puertos.ts";

const RANGO = { none: 0, own: 1, team: 2, all: 3 } as const;

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
    // Celdas duplicadas: la última ganaría en silencio; se rechazan.
    const vistas = new Set<string>();
    for (const permiso of permisos) {
      const clave = `${permiso.resource}:${permiso.action}`;
      if (vistas.has(clave)) throw new ValidationError("Hay permisos duplicados en la matriz.", { permisos: `Celda duplicada: ${clave}.` });
      vistas.add(clave);
    }
    // Anti-escalada: fuera del administrador nadie edita su propio rol ni
    // concede un alcance mayor que el que él mismo tiene.
    if (actor.roleSlug !== "admin") {
      if (rol.slug && rol.slug === actor.roleSlug) throw new ForbiddenError("No puedes editar los permisos de tu propio rol.");
      for (const permiso of permisos) {
        if (RANGO[permiso.scope] > RANGO[scopeFor(actor, permiso.resource, permiso.action)]) {
          throw new ForbiddenError("No puedes conceder un permiso mayor que el tuyo.");
        }
      }
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
