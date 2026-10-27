/** Callback OAuth Google: valida state anti-CSRF, canjea código, guarda la cuenta cifrada y sus calendarios. */
import { requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { errorResponse } from "@/infrastructure/http";
import { canjearCodigo, perfil, STATE_COOKIE, validarState } from "@/infrastructure/google-cuentas";
import { guardarCuentaConectada } from "@/infrastructure/db/repos/google-cuentas";

const volver = (origin: string, q: string) => new Response(null, { status: 302, headers: {
  Location: `${origin}/agenda?google=${q}`,
  "Set-Cookie": `${STATE_COOKIE}=; Path=/api/integraciones/google; HttpOnly; Secure; SameSite=Lax; Max-Age=0`,
} });

export async function GET(request: Request) {
  try {
    const actor = await requireActor();
    requireScope(actor, "activities", "view");
    const url = new URL(request.url);
    // Detrás del proxy `url.origin` es el host interno; el redirect registrado es la fuente fiable.
    const origin = process.env.GOOGLE_OAUTH_REDIRECT_URI ? new URL(process.env.GOOGLE_OAUTH_REDIRECT_URI).origin : url.origin;
    const cookie = request.headers.get("cookie")?.match(new RegExp(`(?:^|; )${STATE_COOKIE}=([^;]+)`))?.[1] ?? null;
    if (!validarState(url.searchParams.get("state"), cookie, actor.userId)) return volver(origin, "estado-invalido");
    if (url.searchParams.get("error")) return volver(origin, "cancelado");
    const code = url.searchParams.get("code");
    if (!code) return volver(origin, "sin-codigo");
    const tokens = await canjearCodigo(code);
    await guardarCuentaConectada(actor.userId, tokens, await perfil(tokens.accessToken));
    return volver(origin, "conectada");
  } catch (error) {
    return errorResponse(error);
  }
}
