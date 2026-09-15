/**
 * M13 · Permisos — matriz real (`docs/F2_ANALISIS_Y_PLAN.md` paso 4,
 * decisión #27).
 *
 * Reemplaza las 8 casillas del prototipo por el modelo real: `permissions`
 * ya es recurso × acción × alcance (decisión #2), así que esta ruta recibe
 * la matriz completa de un rol y la aplica de una vez, no celda por celda —
 * es una acción de "Guardar cambios", no 126 clics independientes.
 *
 * El rol administrador está bloqueado (R10, §10.4): sus permisos no se
 * pueden editar, y esto se decide aquí, en servidor, no ocultando el botón.
 */

import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { ForbiddenError, NotFoundError } from "@/domain/errors";
import { PERMISSION_ACTIONS, PERMISSION_RESOURCES, PERMISSION_SCOPES } from "@/domain/catalogs";
import { requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { auditar } from "@/infrastructure/audit";
import { transaction } from "@/infrastructure/db/client";
import { permissions, roles } from "@/infrastructure/db/schema";
import { errorResponse, parseInput } from "@/infrastructure/http";

const CeldaPermiso = z.object({
  resource: z.enum(PERMISSION_RESOURCES),
  action: z.enum(PERMISSION_ACTIONS),
  scope: z.enum(PERMISSION_SCOPES),
});

const GuardarPermisosInput = z.object({
  // Solo las celdas que tienen un alcance distinto de "ninguno" — una celda
  // ausente de la lista se interpreta como "none" (ver `borrarSinTocar`
  // abajo), igual que ya hace `scopeFor` con un recurso sin fila.
  permisos: z.array(CeldaPermiso),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params;
    const roleId = Number(idParam);
    if (!Number.isInteger(roleId) || roleId <= 0) throw new NotFoundError();

    const datos = parseInput(GuardarPermisosInput, await request.json().catch(() => ({})));
    const actor = await requireActor();
    requireScope(actor, "settings", "edit");

    const resultado = await transaction(async (tx) => {
      const [rol] = await tx.select().from(roles).where(eq(roles.id, roleId)).limit(1);
      if (!rol) throw new NotFoundError("El rol indicado no existe.");
      if (rol.isProtected) {
        throw new ForbiddenError("Los permisos del rol administrador no son editables.");
      }

      const antes = await tx.select({ resource: permissions.resource, action: permissions.action, scope: permissions.scope }).from(permissions).where(eq(permissions.roleId, roleId));

      // Sin `DELETE` + `INSERT` (perdería el `id` y el `created_at` de cada
      // fila sin necesidad): un `upsert` por celda que sí trae la petición,
      // y un `DELETE` solo de las que quedaron en "ninguno" y ya no vienen.
      for (const celda of datos.permisos) {
        await tx
          .insert(permissions)
          .values({ roleId, resource: celda.resource, action: celda.action, scope: celda.scope })
          .onConflictDoUpdate({
            target: [permissions.roleId, permissions.resource, permissions.action],
            set: { scope: celda.scope },
          });
      }
      const clavesEnviadas = new Set(datos.permisos.map((c) => `${c.resource}:${c.action}`));
      const aBorrar = antes.filter((fila) => !clavesEnviadas.has(`${fila.resource}:${fila.action}`));
      for (const fila of aBorrar) {
        await tx
          .delete(permissions)
          .where(and(eq(permissions.roleId, roleId), eq(permissions.resource, fila.resource), eq(permissions.action, fila.action)));
      }

      await auditar(tx, actor, {
        accion: "editar",
        entidad: "role",
        entidadId: roleId,
        antes: { permisos: antes },
        despues: { permisos: datos.permisos },
      });

      return { roleId };
    });

    return Response.json({ ok: true, ...resultado });
  } catch (error) {
    return errorResponse(error);
  }
}
