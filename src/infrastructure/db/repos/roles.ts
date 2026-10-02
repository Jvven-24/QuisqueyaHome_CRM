/** Adaptador de Roles (`application/roles/puertos.ts`; R3.5; decisiones #27 y #41). */

import { and, eq } from "drizzle-orm";
import type { Permiso, RepositorioRoles, Rol } from "../../../application/roles/puertos";
import type { Db } from "../client";
import { permissions, roles } from "../schema";
import type { Tx } from "./compartido";

type Ejecutor = Pick<Tx | Db, "select" | "insert" | "delete">;

export function repositorioRoles(ejecutor: Ejecutor): RepositorioRoles {
  return {
    async buscar(id): Promise<Rol | undefined> {
      const [fila] = await ejecutor
        .select({
          id: roles.id,
          isProtected: roles.isProtected,
        })
        .from(roles)
        .where(eq(roles.id, id))
        .limit(1);
      return fila;
    },
    async listarPermisos(roleId): Promise<Permiso[]> {
      return ejecutor
        .select({
          resource: permissions.resource,
          action: permissions.action,
          scope: permissions.scope,
        })
        .from(permissions)
        .where(eq(permissions.roleId, roleId));
    },
    async guardarPermiso(roleId, permiso) {
      await ejecutor
        .insert(permissions)
        .values({
          roleId,
          resource: permiso.resource,
          action: permiso.action,
          scope: permiso.scope,
        })
        .onConflictDoUpdate({
          target: [permissions.roleId, permissions.resource, permissions.action],
          set: { scope: permiso.scope },
        });
    },
    async borrarPermiso(roleId, permiso) {
      await ejecutor
        .delete(permissions)
        .where(
          and(
            eq(permissions.roleId, roleId),
            eq(permissions.resource, permiso.resource),
            eq(permissions.action, permiso.action),
          ),
        );
    },
  };
}

export function reposRoles(tx: Tx) {
  return { roles: repositorioRoles(tx) };
}
