/**
 * Callback OAuth de Google y Meta para las conexiones de la organización.
 * Valida sesión de administrador, state (cookie cifrada) y PKCE; canjea el código en el servidor,
 * confirma permisos, guarda los tokens cifrados y verifica la cuenta con una llamada real.
 */
import { errorResponse } from "@/infrastructure/http";
import { requireFullScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { soloAdministrador } from "@/infrastructure/conexiones-oauth/guardia";
import { cabeceraBorrarCookie, COOKIE_OAUTH, validarCallback } from "@/infrastructure/conexiones-oauth/flujo";
import * as G from "@/infrastructure/conexiones-oauth/google";
import * as M from "@/infrastructure/conexiones-oauth/meta";
import { scopesFaltantes, servicioPorId, urlPublica, type ProveedorId } from "@/infrastructure/conexiones-oauth/servicios";
import { guardarConexion, verificarConexion } from "@/infrastructure/db/repos/oauth-conexiones";

const leerCookie = (request: Request, nombre: string) =>
  request.headers.get("cookie")?.match(new RegExp(`(?:^|; )${nombre}=([^;]+)`))?.[1] ?? null;

export async function GET(request: Request, ctx: { params: Promise<{ proveedor: string }> }) {
  const url = new URL(request.url);
  const { proveedor } = await ctx.params;
  const origen = urlPublica() || url.origin;
  let servicioId = "";
  const volver = (motivo: string) => new Response(null, {
    status: 302, headers: { Location: `${origen}/configuracion?tab=conexiones&conexion=${motivo}${servicioId ? `&servicio=${servicioId}` : ""}`, "Set-Cookie": cabeceraBorrarCookie(), "Cache-Control": "no-store" },
  });
  if (proveedor !== "google" && proveedor !== "meta") return Response.json({ error: "Proveedor no válido." }, { status: 404 });
  try {
    const actor = await requireActor();
    requireFullScope(actor, "settings", "edit");
    soloAdministrador(actor);
    const v = validarCallback({ cookie: leerCookie(request, COOKIE_OAUTH), state: url.searchParams.get("state"), userId: actor.userId, proveedor: proveedor as ProveedorId });
    if (!v.ok) return volver("estado-invalido");
    servicioId = v.sesion.s;
    if (url.searchParams.get("error")) return volver("cancelado");
    const code = url.searchParams.get("code");
    if (!code) return volver("sin-codigo");
    const servicio = servicioPorId(v.sesion.s);
    if (!servicio || servicio.proveedor !== proveedor) return volver("estado-invalido");

    if (proveedor === "google") {
      const tokens = await G.canjearCodigo(code, v.sesion.v);
      if (scopesFaltantes(servicio, tokens.scopes).length) {
        await G.revocar(tokens.refreshToken ?? tokens.accessToken).catch(() => false);
        return volver("permisos-incompletos");
      }
      const id = await guardarConexion({ servicio, connectedBy: actor.userId, tokens, perfil: await G.perfil(tokens.accessToken) });
      await verificarConexion(id);
    } else {
      const tokens = await M.canjearCodigo(code, "");
      const concedidos = await M.permisosConcedidos(tokens.accessToken);
      if (servicio.scopes.some((s) => !concedidos.includes(s))) {
        await M.revocar(tokens.accessToken).catch(() => false);
        return volver("permisos-incompletos");
      }
      const id = await guardarConexion({ servicio, connectedBy: actor.userId, tokens: { ...tokens, scopes: concedidos.join(" ") }, perfil: await M.perfil(tokens.accessToken) });
      await verificarConexion(id);
    }
    return volver("conectada");
  } catch (error) {
    console.error("oauth-callback:", proveedor, error instanceof Error ? error.message : "desconocido");
    if (error instanceof Error && ["ForbiddenError", "UnauthorizedError"].includes(error.name)) return errorResponse(error);
    return volver("fallo");
  }
}
