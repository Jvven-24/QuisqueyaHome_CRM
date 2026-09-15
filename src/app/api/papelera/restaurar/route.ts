/**
 * M13 · Papelera — restauración (`docs/F2_ANALISIS_Y_PLAN.md` paso 5).
 *
 * Un solo endpoint para las seis tablas con borrado lógico: `entityType` en
 * el body dice cuál. Reutiliza `PERMISSION_RESOURCES` para el permiso —
 * quien puede borrar un contacto puede restaurarlo, es la acción espejo.
 *
 * ponytail: la papelera completa exige `settings:edit` en vez de comprobar el
 * permiso de cada recurso por separado — en el seed actual solo el
 * administrador tiene `delete` en ningún recurso salvo el suyo propio, así
 * que separar el permiso por entidad no cambia quién puede usarla hoy. Si
 * algún día el asistente gana `delete` sobre `contacts`, aquí es donde se
 * ajusta: un `requireScope(actor, TABLAS_PAPELERA[entityType].recurso,
 * "delete")` en vez del `settings` fijo.
 */

import { eq } from "drizzle-orm";
import { z } from "zod";
import { NotFoundError } from "@/domain/errors";
import { requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { auditar } from "@/infrastructure/audit";
import { transaction } from "@/infrastructure/db/client";
import { errorResponse, parseInput } from "@/infrastructure/http";
import { TABLAS_PAPELERA } from "../_tablas";

const RestaurarInput = z.object({
  entityType: z.enum(["contact", "lead", "deal", "project", "unit", "user"]),
  id: z.coerce.number().int().positive(),
});

export async function POST(request: Request) {
  try {
    const datos = parseInput(RestaurarInput, await request.json().catch(() => ({})));
    const actor = await requireActor();
    requireScope(actor, "settings", "edit");

    const tabla = TABLAS_PAPELERA[datos.entityType];

    const fila = await transaction(async (tx) => {
      const [anterior] = await tx.select().from(tabla).where(eq(tabla.id, datos.id)).limit(1);
      if (!anterior || !("deletedAt" in anterior) || anterior.deletedAt === null) throw new NotFoundError();

      const [restaurada] = await tx.update(tabla).set({ deletedAt: null }).where(eq(tabla.id, datos.id)).returning();

      await auditar(tx, actor, { accion: "restaurar", entidad: datos.entityType, entidadId: datos.id, antes: anterior, despues: restaurada });

      return restaurada;
    });

    return Response.json({ ok: true, fila });
  } catch (error) {
    return errorResponse(error);
  }
}
