/** Desconectar: revoca en el proveedor y borra los tokens cifrados. Solo administrador. */
import { errorResponse, idsDeRuta } from "@/infrastructure/http";
import { requireFullScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { soloAdministrador } from "@/infrastructure/conexiones-oauth/guardia";
import { desconectarConexion } from "@/infrastructure/db/repos/oauth-conexiones";

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireActor();
    requireFullScope(actor, "settings", "edit");
    soloAdministrador(actor);
    const [id] = idsDeRuta((await ctx.params).id);
    return Response.json({ ok: true, ...(await desconectarConexion(id)) });
  } catch (error) {
    return errorResponse(error);
  }
}
