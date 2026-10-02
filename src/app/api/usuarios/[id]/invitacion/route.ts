/** M13 · Usuarios — reenvío (`docs/R_ANALISIS_Y_PLAN.md` §7 R3.5; decisión #28). */

import { NotFoundError } from "@/domain/errors";
import { requireFullScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { reenviarInvitacion } from "@/application/usuarios/casos-de-uso";
import { usuariosParaEscritura } from "@/infrastructure/contenedor/usuarios";
import { errorResponse } from "@/infrastructure/http";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params;
    const id = Number(idParam);
    if (!Number.isInteger(id) || id <= 0) throw new NotFoundError();
    const actor = await requireActor();
    // users no tiene responsable por fila; nunca relajar a requireScope.
    requireFullScope(actor, "users", "edit");
    await reenviarInvitacion(usuariosParaEscritura(), id);
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
