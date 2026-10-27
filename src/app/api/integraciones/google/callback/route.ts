/**
 * Callback OAuth Google (único redirect URI registrado). Dos flujos según el state:
 * - userId 0 → "Iniciar sesión con Google" (público, sin alta automática).
 * - userId real → conectar calendario (exige sesión del mismo usuario).
 */
import { requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { loginConGoogle } from "@/infrastructure/auth/google-login";
import { errorResponse } from "@/infrastructure/http";
import { canjearCodigo, LOGIN_COOKIE, perfil, STATE_COOKIE, usuarioDelState, validarState } from "@/infrastructure/google-cuentas";
import { guardarCuentaConectada } from "@/infrastructure/db/repos/google-cuentas";

const leerCookie = (request: Request, nombre: string) =>
  request.headers.get("cookie")?.match(new RegExp(`(?:^|; )${nombre}=([^;]+)`))?.[1] ?? null;
const borrar = (nombre: string) => `${nombre}=; Path=/api/integraciones/google; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
const ir = (location: string, cookie: string) => new Response(null, { status: 302, headers: { Location: location, "Set-Cookie": cookie } });

export async function GET(request: Request) {
  const url = new URL(request.url);
  // Detrás del proxy `url.origin` es el host interno; el redirect registrado es la fuente fiable.
  const origin = process.env.GOOGLE_OAUTH_REDIRECT_URI ? new URL(process.env.GOOGLE_OAUTH_REDIRECT_URI).origin : url.origin;
  const state = url.searchParams.get("state");

  if (usuarioDelState(state) === "0") {
    const login = (q: string) => ir(`${origin}/login?google=${q}`, borrar(LOGIN_COOKIE));
    if (!validarState(state, leerCookie(request, LOGIN_COOKIE), 0)) return login("estado-invalido");
    if (url.searchParams.get("error")) return login("cancelado");
    const code = url.searchParams.get("code");
    if (!code) return login("sin-codigo");
    try {
      const r = await loginConGoogle(code);
      return r === "ok" ? ir(`${origin}/inicio`, borrar(LOGIN_COOKIE)) : login(r);
    } catch (e) {
      console.error("google-login:", e instanceof Error ? e.message : "desconocido");
      return login("fallo");
    }
  }

  const volver = (q: string) => ir(`${origin}/agenda?google=${q}`, borrar(STATE_COOKIE));
  try {
    const actor = await requireActor();
    requireScope(actor, "activities", "view");
    if (!validarState(state, leerCookie(request, STATE_COOKIE), actor.userId)) return volver("estado-invalido");
    if (url.searchParams.get("error")) return volver("cancelado");
    const code = url.searchParams.get("code");
    if (!code) return volver("sin-codigo");
    const tokens = await canjearCodigo(code);
    await guardarCuentaConectada(actor.userId, tokens, await perfil(tokens.accessToken));
    return volver("conectada");
  } catch (error) {
    return errorResponse(error);
  }
}
