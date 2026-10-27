/** Cuentas Google del usuario actual con sus calendarios (sin tokens). */
import { requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { errorResponse } from "@/infrastructure/http";
import { configuradoGoogle } from "@/infrastructure/google-cuentas";
import { listarCuentas } from "@/infrastructure/db/repos/google-cuentas";

export async function GET() {
  try {
    const actor = await requireActor();
    requireScope(actor, "activities", "view");
    return Response.json({ ok: true, falta: configuradoGoogle(), cuentas: await listarCuentas(actor.userId) });
  } catch (error) {
    return errorResponse(error);
  }
}
