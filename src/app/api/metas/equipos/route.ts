/** M8 · Equipos comerciales (crear/editar con miembros). Solo Administrador. */
import { GuardarEquipoInput } from "@/application/metas/alcances-validacion";
import { guardarEquipo } from "@/application/metas/alcances";
import { requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { metasAlcanceParaEscritura } from "@/infrastructure/contenedor/metas-alcances";
import { errorResponse, parseInput } from "@/infrastructure/http";

export async function PUT(request: Request) {
  try {
    const datos = parseInput(GuardarEquipoInput, await request.json().catch(() => ({})));
    const actor = await requireActor();
    const scope = requireScope(actor, "goals", "edit");
    const equipo = await guardarEquipo(metasAlcanceParaEscritura(), actor, scope, {
      ...(datos.id != null ? { id: datos.id } : {}),
      name: datos.name,
      leaderId: datos.leaderId ?? null,
      memberIds: datos.memberIds,
    });
    return Response.json({ ok: true, equipo });
  } catch (error) {
    return errorResponse(error);
  }
}
