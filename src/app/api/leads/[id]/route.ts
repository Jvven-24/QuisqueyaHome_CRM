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
  // Sin broker, `coerce` daba NaN y el 400 decía "expected number, received NaN".
  brokerId: z.preprocess(
    (valor) => (valor === undefined || valor === null || valor === "" ? undefined : valor),
    z.coerce.number({ error: "Elige un broker." }).int("Elige un broker.").positive("Elige un broker."),
  ),
  reason: z.string().trim().min(1,"Escribe una justificación.").max(1000,"Usa hasta 1000 caracteres.").optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params;
    const id = Number(idParam);
    if (!/^[1-9]\d{0,9}$/.test(idParam) || id > 2147483647) throw new NotFoundError();

    const datos = parseInput(AsignarBrokerInput, await request.json().catch(() => ({})));
    const actor = await requireActor();
    const scope = requireScope(actor, "leads", "edit");

    const lead = await asignarResponsableDeLead(leadsParaEscritura(), actor, scope, id, { brokerId: datos.brokerId, reason: datos.reason });

    return Response.json({ ok: true, lead });
  } catch (error) {
    return errorResponse(error);
  }
}
