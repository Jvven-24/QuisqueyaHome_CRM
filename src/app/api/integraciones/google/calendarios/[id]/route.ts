/** Activa/desactiva un calendario o lo marca como predeterminado para visitas. */
import { z } from "zod";
import { requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { errorResponse, idsDeRuta, parseInput } from "@/infrastructure/http";
import { ajustarCalendario } from "@/infrastructure/db/repos/google-cuentas";

const Cambios = z.object({ selected: z.boolean().optional(), defaultForVisits: z.boolean().optional() });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireActor();
    requireScope(actor, "activities", "view");
    const cambios = parseInput(Cambios, await request.json().catch(() => ({})));
    await ajustarCalendario(actor.userId, idsDeRuta((await params).id)[0]!, cambios);
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
