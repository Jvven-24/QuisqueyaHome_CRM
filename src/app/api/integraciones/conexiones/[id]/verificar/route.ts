/** Vuelve a comprobar una conexión con una llamada real al proveedor (renueva el token si hace falta). */
import { errorResponse, idsDeRuta } from "@/infrastructure/http";
import { requireFullScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { soloAdministrador } from "@/infrastructure/conexiones-oauth/guardia";
import { verificarConexion } from "@/infrastructure/db/repos/oauth-conexiones";

export async function POST(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireActor();
    requireFullScope(actor, "settings", "edit");
    soloAdministrador(actor);
    const [id] = idsDeRuta((await ctx.params).id);
    return Response.json({ ok: true, conexion: await verificarConexion(id) });
  } catch (error) {
    return errorResponse(error);
  }
}
