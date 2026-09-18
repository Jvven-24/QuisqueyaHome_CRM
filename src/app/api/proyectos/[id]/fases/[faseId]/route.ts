/**
 * M6 · Avances de obra — edición y borrado de fase (`docs/F3_ANALISIS_Y_PLAN.md`
 * §4.3, issue #32). Mismo patrón que `api/proyectos/[id]/unidades/[unitId]/route.ts`.
 *
 * `isPublished`: `true` fija `publishedAt = now()`; `false` lo limpia
 * (`publishedAt = null`) — es la lectura más honesta de "retirado del portal":
 * conservar la fecha de la primera publicación insinuaría que sigue publicada.
 *
 * Borrado: `DELETE` real, no lógico — la tabla no tiene `deleted_at` (esquema
 * congelado). Se audita con el estado anterior completo, y las fotos de la
 * fase (`files`) se borran lógicamente en la misma transacción: la fila de
 * `files` sí tiene papelera, y una fase eliminada no debe dejar fotos
 * huérfanas visibles en ningún listado futuro.
 */

import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { NotFoundError } from "@/domain/errors";
import { PHASE_STATUSES } from "@/domain/catalogs";
import { requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { auditar } from "@/infrastructure/audit";
import { transaction } from "@/infrastructure/db/client";
import { constructionPhases, files } from "@/infrastructure/db/schema";
import { errorResponse, parseInput, vaciosANull } from "@/infrastructure/http";
import { faseVisible, idsDeRuta, recalcularProgreso } from "../_fase";

const EditarFaseInput = z.object({
  title: z.string().min(1, "Escribe el título de la fase.").optional(),
  period: z.string().nullable().optional(),
  status: z.enum(PHASE_STATUSES).optional(),
  progressPercent: z.coerce.number().int().min(0).max(100).optional(),
  statusDate: z
    .union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Escribe la fecha en formato AAAA-MM-DD."), z.null()])
    .optional(),
  videoUrl: z
    .union([z.url({ protocol: /^https?$/, error: "Escribe una URL de video válida (http o https)." }), z.null()])
    .optional(),
  publicNote: z.string().nullable().optional(),
  responsibleId: z.union([z.coerce.number().int().positive(), z.null()]).optional(),
  isPublished: z.boolean().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; faseId: string }> }) {
  try {
    const { id: idParam, faseId: faseIdParam } = await params;
    const [projectId, faseId] = idsDeRuta(idParam, faseIdParam);

    const datos = parseInput(
      EditarFaseInput,
      vaciosANull(await request.json().catch(() => ({})), [
        "period",
        "statusDate",
        "videoUrl",
        "publicNote",
        "responsibleId",
      ]),
    );
    const actor = await requireActor();
    const scope = requireScope(actor, "construction_phases", "edit");

    const fase = await transaction(async (tx) => {
      const anterior = await faseVisible(tx, actor, scope, projectId, faseId);
      if (!anterior) throw new NotFoundError();

      const cambios: Partial<typeof constructionPhases.$inferInsert> = { updatedBy: actor.userId };
      if (datos.title !== undefined) cambios.title = datos.title;
      if ("period" in datos) cambios.period = datos.period;
      if (datos.status !== undefined) cambios.status = datos.status;
      if (datos.progressPercent !== undefined) cambios.progressPercent = datos.progressPercent;
      if ("statusDate" in datos) cambios.statusDate = datos.statusDate;
      if ("videoUrl" in datos) cambios.videoUrl = datos.videoUrl;
      if ("publicNote" in datos) cambios.publicNote = datos.publicNote;
      if ("responsibleId" in datos) cambios.responsibleId = datos.responsibleId;
      if (datos.isPublished !== undefined) {
        cambios.isPublished = datos.isPublished;
        cambios.publishedAt = datos.isPublished ? new Date() : null;
      }

      const [fila] = await tx.update(constructionPhases).set(cambios).where(eq(constructionPhases.id, faseId)).returning();

      await auditar(tx, actor, { accion: "editar", entidad: "construction_phase", entidadId: faseId, antes: anterior, despues: fila });

      if (datos.progressPercent !== undefined) await recalcularProgreso(tx, projectId);

      return fila;
    });

    return Response.json({ ok: true, fase });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string; faseId: string }> }) {
  try {
    const { id: idParam, faseId: faseIdParam } = await params;
    const [projectId, faseId] = idsDeRuta(idParam, faseIdParam);

    const actor = await requireActor();
    const scope = requireScope(actor, "construction_phases", "delete");

    await transaction(async (tx) => {
      const anterior = await faseVisible(tx, actor, scope, projectId, faseId);
      if (!anterior) throw new NotFoundError();

      await tx
        .update(files)
        .set({ deletedAt: new Date() })
        .where(and(eq(files.entityType, "construction_phase"), eq(files.entityId, faseId), isNull(files.deletedAt)));

      await tx.delete(constructionPhases).where(eq(constructionPhases.id, faseId));

      await auditar(tx, actor, { accion: "eliminar", entidad: "construction_phase", entidadId: faseId, antes: anterior });

      // Sin renumerar las posiciones restantes (§4.3): el índice único es
      // (project_id, position), no una secuencia sin huecos — ordenar por
      // `position` alcanza aunque queden huecos.
      await recalcularProgreso(tx, projectId);
    });

    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
