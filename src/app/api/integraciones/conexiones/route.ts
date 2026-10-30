/** Lista las conexiones (sin tokens) y qué variables faltan por proveedor. Solo administrador. */
import { errorResponse } from "@/infrastructure/http";
import { requireFullScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { soloAdministrador } from "@/infrastructure/conexiones-oauth/guardia";
import { variablesFaltantes } from "@/infrastructure/conexiones-oauth/servicios";
import { listarConexiones } from "@/infrastructure/db/repos/oauth-conexiones";

export async function GET() {
  try {
    const actor = await requireActor();
    requireFullScope(actor, "settings", "edit");
    soloAdministrador(actor);
    return Response.json({ ok: true, conexiones: await listarConexiones(), faltan: { google: variablesFaltantes("google"), meta: variablesFaltantes("meta") } });
  } catch (error) {
    return errorResponse(error);
  }
}
