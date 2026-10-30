/**
 * Meta (Facebook Login for Business) para Marketing API. Código → token corto →
 * token de larga duración (~60 días). Meta no emite refresh_token: la renovación es
 * canjear de nuevo el token largo (`fb_exchange_token`) antes de que venza.
 * PKCE no está documentado por Meta para este flujo; la protección es state + cookie
 * cifrada ligada al usuario + secreto de la app solo en servidor.
 */
import { redirectUri, type ServicioDef } from "./servicios.ts";
import { leerError, type Fetch, type PerfilCuenta, type ResultadoVerificacion, type Tokens } from "./tipos.ts";
import type { Env } from "./cripto.ts";

const v = (env: Env, k: string) => env[k]?.trim() ?? "";
export const versionGraph = (env: Env = process.env) => v(env, "META_GRAPH_VERSION") || "v24.0";
const graph = (env: Env, ruta: string) => `https://graph.facebook.com/${versionGraph(env)}${ruta}`;

export function urlAutorizacion(p: { servicio: ServicioDef; state: string; env?: Env }): string {
  const env = p.env ?? process.env;
  const q = new URLSearchParams({ client_id: v(env, "META_APP_ID"), redirect_uri: redirectUri("meta", env), state: p.state, response_type: "code" });
  const config = v(env, "META_LOGIN_CONFIG_ID");
  // Facebook Login for Business: los permisos viven en la configuración (config_id) y `scope` no se usa.
  if (config) { q.set("config_id", config); q.set("override_default_response_type", "true"); }
  else q.set("scope", p.servicio.scopes.join(","));
  return `https://www.facebook.com/${versionGraph(env)}/dialog/oauth?${q}`;
}

type RespuestaToken = { access_token: string; expires_in?: number };
const aTokens = (d: RespuestaToken, scopes: string): Tokens => ({
  accessToken: d.access_token,
  // Sin expires_in el token no vence por tiempo (apps con acceso Standard a Marketing API).
  expiresAt: d.expires_in ? new Date(Date.now() + d.expires_in * 1000) : null,
  scopes,
});

async function pedir(env: Env, f: Fetch, params: Record<string, string>): Promise<RespuestaToken> {
  const r = await f(graph(env, `/oauth/access_token?${new URLSearchParams(params)}`));
  if (!r.ok) throw await leerError("Meta", r);
  return (await r.json()) as RespuestaToken;
}

/** Canjea el código y lo convierte en token de larga duración. */
export async function canjearCodigo(code: string, scopes: string, env: Env = process.env, f: Fetch = fetch): Promise<Tokens> {
  const id = { client_id: v(env, "META_APP_ID"), client_secret: v(env, "META_APP_SECRET") };
  const corto = await pedir(env, f, { ...id, redirect_uri: redirectUri("meta", env), code });
  const largo = await pedir(env, f, { ...id, grant_type: "fb_exchange_token", fb_exchange_token: corto.access_token });
  return aTokens(largo, scopes);
}

/** Renueva un token largo vigente canjeándolo otra vez. */
export async function renovar(tokenActual: string, scopes: string, env: Env = process.env, f: Fetch = fetch): Promise<Tokens> {
  const d = await pedir(env, f, { grant_type: "fb_exchange_token", client_id: v(env, "META_APP_ID"), client_secret: v(env, "META_APP_SECRET"), fb_exchange_token: tokenActual });
  return aTokens(d, scopes);
}

export async function perfil(accessToken: string, env: Env = process.env, f: Fetch = fetch): Promise<PerfilCuenta> {
  const r = await f(graph(env, "/me?fields=id,name,email"), { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!r.ok) throw await leerError("Meta", r);
  const d = (await r.json()) as { id: string; name?: string; email?: string };
  return { id: d.id, etiqueta: d.name ?? d.email ?? d.id };
}

/** Permisos concedidos (Meta puede dejar al usuario rechazar algunos). */
export async function permisosConcedidos(accessToken: string, env: Env = process.env, f: Fetch = fetch): Promise<string[]> {
  const r = await f(graph(env, "/me/permissions"), { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!r.ok) throw await leerError("Meta", r);
  const d = (await r.json()) as { data?: { permission: string; status: string }[] };
  return (d.data ?? []).filter((p) => p.status === "granted").map((p) => p.permission);
}

/** Revoca todos los permisos de la app para ese usuario de Meta. */
export async function revocar(accessToken: string, env: Env = process.env, f: Fetch = fetch): Promise<boolean> {
  const r = await f(graph(env, "/me/permissions"), { method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` } });
  return r.ok;
}

export async function verificar(accessToken: string, env: Env = process.env, f: Fetch = fetch): Promise<ResultadoVerificacion> {
  const r = await f(graph(env, "/me/adaccounts?fields=account_id,name,account_status&limit=100"), { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!r.ok) throw await leerError("Meta", r);
  const n = ((await r.json()) as { data?: unknown[] }).data?.length ?? 0;
  return { recursos: n, resumen: `${n} ${n === 1 ? "cuenta publicitaria" : "cuentas publicitarias"}` };
}
