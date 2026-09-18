/**
 * M6 · Avances de obra — alta de fase (`docs/F3_ANALISIS_Y_PLAN.md` §4.3,
 * issue #32). Nace bajo su proyecto, mismo criterio que
 * `api/proyectos/[id]/unidades/route.ts`: una fase no existe sin proyecto.
 *
 * Dos formas de body: `{ plantilla: true }` crea las 8 fases estándar de una
 * vez (solo si el proyecto todavía no tiene ninguna — 409 si ya tiene), o
 * `{ title }` agrega una fase suelta al final (`position` = máximo + 1; sin
 * renumerar al borrar, ver `[faseId]/route.ts`).
 */

import { eq } from "drizzle-orm";
import { z } from "zod";
import { ConflictError, NotFoundError } from "@/domain/errors";
import { requireScope } from "@/domain/rbac";
import { FASES_ESTANDAR } from "@/domain/avance-obra";
import { requireActor } from "@/infrastructure/auth/actor";
import { auditar } from "@/infrastructure/audit";
import { transaction } from "@/infrastructure/db/client";
import { constructionPhases } from "@/infrastructure/db/schema";
import { errorResponse, parseInput } from "@/infrastructure/http";
import { idsDeRuta, proyectoVisible, recalcularProgreso } from "./_fase";

const CrearFaseInput = z.union([
  z.object({ plantilla: z.literal(true) }),
  z.object({ title: z.string({ error: "Escribe el título de la fase." }).min(1, "Escribe el título de la fase.") }),
]);

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params;
    const [projectId] = idsDeRuta(idParam);

    const datos = parseInput(CrearFaseInput, await request.json().catch(() => ({})));
    const actor = await requireActor();
    const scope = requireScope(actor, "construction_phases", "create");

    const fases = await transaction(async (tx) => {
      // Bloquea la fila del proyecto (`for update`) antes de leer las fases
      // existentes: sin esto, dos altas concurrentes sobre el mismo proyecto
      // leen el mismo estado bajo READ COMMITTED y la segunda choca con el
      // índice único de `position` en vez de un 409/posición correcta.
      const proyecto = await proyectoVisible(tx, actor, scope, projectId, true);
      if (!proyecto) throw new NotFoundError();

      const existentes = await tx
        .select({ position: constructionPhases.position })
        .from(constructionPhases)
        .where(eq(constructionPhases.projectId, projectId));

      if ("plantilla" in datos) {
        if (existentes.length > 0) {
          throw new ConflictError("El proyecto ya tiene fases: la plantilla solo aplica a un proyecto sin ninguna.");
        }

        const filas = await tx
          .insert(constructionPhases)
          .values(
            FASES_ESTANDAR.map((title, indice) => ({
              projectId,
              position: indice + 1,
              title,
              createdBy: actor.userId,
              updatedBy: actor.userId,
            })),
          )
          .returning();

        for (const fila of filas) {
          await auditar(tx, actor, { accion: "crear", entidad: "construction_phase", entidadId: fila.id, despues: fila });
        }
        await recalcularProgreso(tx, projectId);
        return filas;
      }

      const siguientePosicion = existentes.reduce((max, f) => Math.max(max, f.position), 0) + 1;
      const [fila] = await tx
        .insert(constructionPhases)
        .values({
          projectId,
          position: siguientePosicion,
          title: datos.title,
          createdBy: actor.userId,
          updatedBy: actor.userId,
        })
        .returning();

      await auditar(tx, actor, { accion: "crear", entidad: "construction_phase", entidadId: fila!.id, despues: fila });
      await recalcularProgreso(tx, projectId);
      return [fila!];
    });

    return Response.json({ ok: true, fases });
  } catch (error) {
    return errorResponse(error);
  }
}
