/** Google OAuth 2.0 (código + PKCE S256, autorización incremental, acceso offline). `fetch` inyectable. */
import { redirectUri, scopesFaltantes, scopesSolicitados, SCOPES_IDENTIDAD_GOOGLE, type ServicioDef } from "./servicios.ts";
import { leerError, ProveedorError, type Fetch, type PerfilCuenta, type ResultadoVerificacion, type Tokens } from "./tipos.ts";
import type { Env } from "./cripto.ts";

const v = (env: Env, k: string) => env[k]?.trim() ?? "";
const AUTH = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN = "https://oauth2.googleapis.com/token";

export function urlAutorizacion(p: { servicio: ServicioDef; extras?: string[]; state: string; desafio: string; env?: Env }): string {
  const env = p.env ?? process.env;
  const q = new URLSearchParams({
    client_id: v(env, "GOOGLE_OAUTH_CLIENT_ID"),
    redirect_uri: redirectUri("google", env),
    response_type: "code",
    scope: [...SCOPES_IDENTIDAD_GOOGLE, ...scopesSolicitados(p.servicio, p.extras)].join(" "),
    state: p.state,
    code_challenge: p.desafio,
    code_challenge_method: "S256",
    access_type: "offline",
    // Autorización incremental: se suman los permisos ya concedidos sin volver a pedirlos.
    include_granted_scopes: "true",
    // select_account permite elegir/añadir otra cuenta; consent asegura el refresh_token.
    prompt: "select_account consent",
  });
  return `${AUTH}?${q}`;
}

async function pedirToken(cuerpo: Record<string, string>, f: Fetch): Promise<Tokens> {
  const r = await f(TOKEN, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(cuerpo) });
  if (!r.ok) throw await leerError("Google", r);
  const d = (await r.json()) as { access_token: string; refresh_token?: string; expires_in: number; scope?: string };
  return { accessToken: d.access_token, refreshToken: d.refresh_token, expiresAt: new Date(Date.now() + (d.expires_in - 60) * 1000), scopes: d.scope ?? "" };
}

export function canjearCodigo(code: string, verificador: string, env: Env = process.env, f: Fetch = fetch): Promise<Tokens> {
  return pedirToken({
    code, code_verifier: verificador, grant_type: "authorization_code",
    client_id: v(env, "GOOGLE_OAUTH_CLIENT_ID"), client_secret: v(env, "GOOGLE_OAUTH_CLIENT_SECRET"), redirect_uri: redirectUri("google", env),
  }, f);
}

export async function refrescar(refreshToken: string, env: Env = process.env, f: Fetch = fetch): Promise<Tokens> {
  const t = await pedirToken({ refresh_token: refreshToken, grant_type: "refresh_token", client_id: v(env, "GOOGLE_OAUTH_CLIENT_ID"), client_secret: v(env, "GOOGLE_OAUTH_CLIENT_SECRET") }, f);
  return { ...t, refreshToken: undefined };
}

export async function perfil(accessToken: string, f: Fetch = fetch): Promise<PerfilCuenta> {
  const r = await f("https://openidconnect.googleapis.com/v1/userinfo", { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!r.ok) throw await leerError("Google", r);
  const d = (await r.json()) as { sub: string; email?: string };
  return { id: d.sub, etiqueta: d.email ?? d.sub };
}

/** Revoca el token en Google. 400 = ya estaba revocado o vencido (se considera hecho). */
export async function revocar(token: string, f: Fetch = fetch): Promise<boolean> {
  const r = await f("https://oauth2.googleapis.com/revoke", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ token }) });
  return r.ok || r.status === 400;
}

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

/** Llamada de comprobación mínima por servicio: confirma que el token y los permisos funcionan. */
export async function verificar(servicio: ServicioDef, accessToken: string, f: Fetch = fetch): Promise<ResultadoVerificacion> {
  const h = { headers: { Authorization: `Bearer ${accessToken}` } };
  const get = async <T>(url: string): Promise<T> => {
    const r = await f(url, h);
    if (!r.ok) throw await leerError("Google", r);
    return (await r.json()) as T;
  };
  switch (servicio.id) {
    case "search_console": {
      const d = await get<{ siteEntry?: unknown[] }>("https://www.googleapis.com/webmasters/v3/sites");
      const n = d.siteEntry?.length ?? 0;
      return { recursos: n, resumen: plural(n, "sitio accesible", "sitios accesibles") };
    }
    case "analytics": {
      const d = await get<{ accountSummaries?: { propertySummaries?: unknown[] }[] }>("https://analyticsadmin.googleapis.com/v1beta/accountSummaries?pageSize=200");
      const n = (d.accountSummaries ?? []).reduce((t, a) => t + (a.propertySummaries?.length ?? 0), 0);
      return { recursos: n, resumen: plural(n, "propiedad GA4", "propiedades GA4") };
    }
    case "gmail": {
      const d = await get<{ emailAddress?: string; messagesTotal?: number }>("https://gmail.googleapis.com/gmail/v1/users/me/profile");
      return { recursos: d.messagesTotal ?? 0, resumen: `Buzón ${d.emailAddress ?? ""} · ${(d.messagesTotal ?? 0).toLocaleString("es-DO")} mensajes`.trim() };
    }
    case "calendar": {
      const d = await get<{ items?: unknown[] }>("https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=writer");
      const n = d.items?.length ?? 0;
      return { recursos: n, resumen: plural(n, "calendario con permiso de escritura", "calendarios con permiso de escritura") };
    }
    default:
      throw new ProveedorError("Google", 400, "servicio_no_google");
  }
}

export { scopesFaltantes };
