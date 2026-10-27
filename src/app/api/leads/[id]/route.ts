/**
 * M2 · Leads — asignar responsable (issue #22).
 *
 * Ruta delgada: valida el id y el cuerpo, exige el permiso y delega en
 * `asignarResponsableDeLead` (`application/leads`), que valida que el broker sea
 * un candidato activo, aplica el alcance con `reaches` y audita. Hallazgo H16:
 * reasignar un lead propio no exige alcance `all` (ver el caso de uso).
 */

import { z } from "zod";
import { asignarResponsableDeLead } from "@/application/leads/casos-de-uso";
import { NotFoundError } from "@/domain/errors";
import { requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { leadsParaEscritura } from "@/infrastructure/contenedor/leads";
import { errorResponse, parseInput } from "@/infrastructure/http";

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

    const lead = await asignarResponsableDeLead(leadsParaEscritura(), actor, scope, id, { brokerId: datos.brokerId });

    return Response.json({ ok: true, lead });
  } catch (error) {
    return errorResponse(error);
  }
}
