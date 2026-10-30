/**
 * Inicia el consentimiento OAuth de un servicio (Google o Meta). Solo administrador.
 * GET /api/integraciones/oauth/{google|meta}/conectar?servicio=gmail&extra=enviar
 * Guarda state + verificador PKCE en una cookie httpOnly cifrada y redirige al proveedor.
 */
import { errorResponse } from "@/infrastructure/http";
import { requireFullScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { soloAdministrador } from "@/infrastructure/conexiones-oauth/guardia";
import { cabeceraCookie, iniciarFlujo } from "@/infrastructure/conexiones-oauth/flujo";
import * as G from "@/infrastructure/conexiones-oauth/google";
import * as M from "@/infrastructure/conexiones-oauth/meta";
import { servicioPorId, urlPublica, variablesFaltantes } from "@/infrastructure/conexiones-oauth/servicios";

export async function GET(request: Request, ctx: { params: Promise<{ proveedor: string }> }) {
  try {
    const actor = await requireActor();
    requireFullScope(actor, "settings", "edit");
    soloAdministrador(actor);
    const { proveedor } = await ctx.params;
    const q = new URL(request.url).searchParams;
    const servicio = servicioPorId(q.get("servicio") ?? "");
    if (!servicio || servicio.proveedor !== proveedor || proveedor === "google" && servicio.id === "calendar") {
      return Response.json({ error: "Servicio no válido para este proveedor." }, { status: 400 });
    }
    const faltan = variablesFaltantes(servicio.proveedor);
    if (faltan.length) return Response.redirect(`${urlPublica() || new URL(request.url).origin}/configuracion?tab=conexiones&conexion=sin-configurar&servicio=${servicio.id}`, 302);
    const extras = (servicio.extras ?? []).map((e) => e.id).filter((id) => q.getAll("extra").includes(id));
    const f = iniciarFlujo({ proveedor: servicio.proveedor, servicio: servicio.id, userId: actor.userId, extras });
    const destino = servicio.proveedor === "google"
      ? G.urlAutorizacion({ servicio, extras, state: f.state, desafio: f.desafio })
      : M.urlAutorizacion({ servicio, state: f.state });
    return new Response(null, { status: 302, headers: { Location: destino, "Set-Cookie": cabeceraCookie(f.cookie), "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}
