/**
 * M2 · Leads — asignar responsable (issue #22).
 *
 * Mismo patrón que `./descartar/route.ts`: se lee el lead dentro de la
 * transacción y se comprueba el alcance en memoria con `reaches` (el
 * `SELECT` ya ocurrió por `id`, no hace falta reconstruir `visibleRows`). El
 * broker que se asigna tiene que ser un candidato válido (activo, con perfil
 * de broker) — se reutiliza `candidatosBroker`, la misma lista que arma la
 * sugerencia, en vez de escribir una segunda condición "es broker activo".
 */

import { eq } from "drizzle-orm";
import { z } from "zod";
import { NotFoundError, ValidationError } from "@/domain/errors";
import { reaches, requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { auditar } from "@/infrastructure/audit";
import { transaction } from "@/infrastructure/db/client";
import { leads } from "@/infrastructure/db/schema";
import { errorResponse, parseInput } from "@/infrastructure/http";
import { candidatosBroker } from "../_broker-candidatos";

const AsignarBrokerInput = z.object({
  brokerId: z.coerce.number().int().positive(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params;
    const id = Number(idParam);
    if (!Number.isInteger(id) || id <= 0) throw new NotFoundError();

    const datos = parseInput(AsignarBrokerInput, await request.json().catch(() => ({})));
    const actor = await requireActor();
    const scope = requireScope(actor, "leads", "edit");

    const candidatos = await candidatosBroker();
    if (!candidatos.some((candidato) => candidato.userId === datos.brokerId)) {
      throw new ValidationError("Ese usuario no es un broker activo.", {
        brokerId: "Elige un broker activo.",
      });
    }

    const resultado = await transaction(async (tx) => {
      const [lead] = await tx.select().from(leads).where(eq(leads.id, id)).limit(1);
      if (!lead || lead.deletedAt) throw new NotFoundError();
      if (!reaches(actor, scope, lead.brokerId)) throw new NotFoundError();

      const [leadActualizado] = await tx
        .update(leads)
        .set({ brokerId: datos.brokerId, updatedBy: actor.userId })
        .where(eq(leads.id, id))
        .returning();

      await auditar(tx, actor, {
        accion: "asignar",
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
