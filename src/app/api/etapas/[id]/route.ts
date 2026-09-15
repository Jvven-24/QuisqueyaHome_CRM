/**
 * M13 · Etapas del pipeline — edición (`docs/F2_ANALISIS_Y_PLAN.md` paso 5,
 * decisión #29).
 *
 * `slug` y `kind` **no están en este esquema Zod a propósito** — no es que
 * se acepten y se ignoren, es que la petición ni siquiera puede traerlos:
 * `kind` decide si un negocio está ganado o perdido (`domain/transicion-etapa.ts`),
 * y cambiarlo reescribiría en silencio el significado de los negocios ya
 * cerrados. El nombre sí se edita (decisión #1: las etapas son renombrables).
 */

import { eq } from "drizzle-orm";
import { z } from "zod";
import { NotFoundError } from "@/domain/errors";
import { requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { auditar } from "@/infrastructure/audit";
import { transaction } from "@/infrastructure/db/client";
import { pipelineStages } from "@/infrastructure/db/schema";
import { errorResponse, parseInput } from "@/infrastructure/http";

const EditarEtapaInput = z.object({
  name: z.string().min(1, "Escribe el nombre de la etapa.").optional(),
  position: z.coerce.number().int().positive().optional(),
  defaultProbability: z.union([z.coerce.number().int().min(0).max(100), z.null()]).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params;
    const id = Number(idParam);
    if (!Number.isInteger(id) || id <= 0) throw new NotFoundError();

    const datos = parseInput(EditarEtapaInput, await request.json().catch(() => ({})));
    const actor = await requireActor();
    requireScope(actor, "settings", "edit");

    const etapa = await transaction(async (tx) => {
      const [anterior] = await tx.select().from(pipelineStages).where(eq(pipelineStages.id, id)).limit(1);
      if (!anterior) throw new NotFoundError();

      const cambios: Partial<typeof pipelineStages.$inferInsert> = {};
      if (datos.name !== undefined) cambios.name = datos.name;
      if (datos.position !== undefined) cambios.position = datos.position;
      if ("defaultProbability" in datos) cambios.defaultProbability = datos.defaultProbability;
      if (datos.isActive !== undefined) cambios.isActive = datos.isActive;

      const [fila] = await tx.update(pipelineStages).set(cambios).where(eq(pipelineStages.id, id)).returning();

      await auditar(tx, actor, { accion: "editar", entidad: "pipeline_stage", entidadId: id, antes: anterior, despues: fila });

      return fila;
    });

    return Response.json({ ok: true, etapa });
  } catch (error) {
    return errorResponse(error);
  }
}
