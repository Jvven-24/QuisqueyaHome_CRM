/** Vuelve a leer de Google los calendarios de una cuenta propia. */
import { requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { errorResponse, idsDeRuta } from "@/infrastructure/http";
import { listarCuentas, sincronizarCalendarios } from "@/infrastructure/db/repos/google-cuentas";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireActor();
    requireScope(actor, "activities", "view");
    await sincronizarCalendarios(actor.userId, idsDeRuta((await params).id)[0]!);
    return Response.json({ ok: true, cuentas: await listarCuentas(actor.userId) });
  } catch (error) {
    return errorResponse(error);
  }
}
