/** Activar/desactivar (PATCH) o desconectar y revocar (DELETE) una cuenta Google propia. */
import { z } from "zod";
import { requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { errorResponse, idsDeRuta, parseInput } from "@/infrastructure/http";
import { activarCuenta, desconectarCuenta } from "@/infrastructure/db/repos/google-cuentas";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const actor = await requireActor();
    requireScope(actor, "activities", "view");
    const { active } = parseInput(z.object({ active: z.boolean() }), await request.json().catch(() => ({})));
    await activarCuenta(actor.userId, idsDeRuta((await params).id)[0]!, active);
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const actor = await requireActor();
    requireScope(actor, "activities", "view");
    return Response.json({ ok: true, ...(await desconectarCuenta(actor.userId, idsDeRuta((await params).id)[0]!)) });
  } catch (error) {
    return errorResponse(error);
  }
}
