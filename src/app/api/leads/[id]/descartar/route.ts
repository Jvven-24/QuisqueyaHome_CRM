/**
 * M2 · Leads — descarte con motivo (`docs/F1_ANALISIS_Y_PLAN.md` paso 4).
 *
 * Mismo patrón que `../convertir/route.ts`: se lee el lead dentro de la
 * transacción y se comprueba el alcance en memoria con `reaches` (el `SELECT`
 * ya ocurrió por `id`, no hace falta reconstruir la condición de `visibleRows`).
 *
 * `discardReason` es texto obligatorio — a diferencia de "eliminar" (borrado
 * lógico de un registro que no debió existir), descartar es una transición de
 * negocio: el lead sí existió y no prosperó, y el motivo es lo que alimenta
 * cualquier reporte futuro de "por qué se pierden leads" antes de llegar a ser
 * negocio.
 */

import { eq } from "drizzle-orm";
import { ConflictError, NotFoundError, ValidationError } from "@/domain/errors";
import { reaches, requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { auditar } from "@/infrastructure/audit";
import { transaction } from "@/infrastructure/db/client";
import { leads } from "@/infrastructure/db/schema";
import { errorResponse } from "@/infrastructure/http";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params;
    const id = Number(idParam);
    if (!Number.isInteger(id) || id <= 0) throw new NotFoundError();

    const cuerpo = await request.json().catch(() => ({}));
    const discardReason =
      typeof cuerpo?.discardReason === "string" ? cuerpo.discardReason.trim() : "";
    if (!discardReason) {
      throw new ValidationError("Escribe el motivo del descarte.", {
        discardReason: "Escribe el motivo del descarte.",
      });
    }

    const actor = await requireActor();
    const scope = requireScope(actor, "leads", "edit");

    const resultado = await transaction(async (tx) => {
      const [lead] = await tx.select().from(leads).where(eq(leads.id, id)).limit(1);
      if (!lead || lead.deletedAt) throw new NotFoundError();
      if (!reaches(actor, scope, lead.brokerId)) throw new NotFoundError();

      if (lead.status === "converted") {
        throw new ConflictError("Este lead ya fue convertido a negocio; no se puede descartar.");
      }
      if (lead.status === "discarded") {
        throw new ConflictError("Este lead ya está descartado.");
      }

      const [leadActualizado] = await tx
        .update(leads)
        .set({ status: "discarded", discardReason, updatedBy: actor.userId })
        .where(eq(leads.id, id))
        .returning();

      await auditar(tx, actor, {
        accion: "descartar",
        entidad: "lead",
        entidadId: id,
        antes: lead,
        despues: leadActualizado,
      });

      return leadActualizado;
    });

    return Response.json({ ok: true, lead: resultado });
  } catch (error) {
    return errorResponse(error);
  }
}
