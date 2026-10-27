/**
 * Google multi-cuenta: cifrado de tokens, state anti-CSRF, OAuth, refresh,
 * calendarios y revocación. Lógica pura con `fetch` inyectable (tests con mocks).
 * Nunca registra tokens.
 */
import { createCipheriv, createDecipheriv, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

type Env = Record<string, string | undefined>;
type Fetch = typeof fetch;
const v = (env: Env, k: string) => env[k]?.trim() || "";

export const GOOGLE_SCOPES = [
  "openid", "email",
  "https://www.googleapis.com/auth/calendar.calendarlist.readonly",
  "https://www.googleapis.com/auth/calendar.events",
];
export const STATE_COOKIE = "qh_google_state";
/** Cookie del flujo "Iniciar sesión con Google" (state con userId 0, mismo callback). */
export const LOGIN_COOKIE = "qh_google_login";
export const LOGIN_SCOPES = ["openid", "email"];

function clave(env: Env): Buffer {
  const raw = v(env, "GOOGLE_TOKEN_ENC_KEY");
  const k = /^[0-9a-f]{64}$/i.test(raw) ? Buffer.from(raw, "hex") : Buffer.from(raw, "base64");
  if (k.length !== 32) throw new Error("GOOGLE_TOKEN_ENC_KEY debe ser 32 bytes (hex o base64).");
  return k;
}
export function cifrar(texto: string, env: Env = process.env): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", clave(env), iv);
  const enc = Buffer.concat([c.update(texto, "utf8"), c.final()]);
  return ["v1", iv.toString("base64"), c.getAuthTag().toString("base64"), enc.toString("base64")].join(".");
}
export function descifrar(sobre: string, env: Env = process.env): string {
  const [ver, iv, tag, enc] = sobre.split(".");
  if (ver !== "v1" || !iv || !tag || !enc) throw new Error("Token cifrado inválido.");
  const d = createDecipheriv("aes-256-gcm", clave(env), Buffer.from(iv, "base64"));
  d.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([d.update(Buffer.from(enc, "base64")), d.final()]).toString("utf8");
}

/** State = nonce.userId.firma; el nonce también va en cookie httpOnly (doble verificación). */
export function crearState(userId: number, env: Env = process.env): { state: string; nonce: string } {
  const nonce = randomBytes(16).toString("hex");
  const firma = createHmac("sha256", clave(env)).update(`${nonce}.${userId}`).digest("hex");
  return { state: `${nonce}.${userId}.${firma}`, nonce };
}
/** Lee el userId del state sin validarlo (para elegir flujo); la validación real sigue siendo `validarState`. */
export function usuarioDelState(state: string | null): string | null {
  return state?.split(".")[1] ?? null;
}
export function validarState(state: string | null, cookieNonce: string | null, userId: number, env: Env = process.env): boolean {
  if (!state || !cookieNonce) return false;
  const [nonce, uid, firma] = state.split(".");
  if (!nonce || !firma || uid !== String(userId) || nonce !== cookieNonce) return false;
  const esperado = createHmac("sha256", clave(env)).update(`${nonce}.${uid}`).digest("hex");
  const a = Buffer.from(esperado), b = Buffer.from(firma);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function configuradoGoogle(env: Env = process.env): string[] {
  return ["GOOGLE_OAUTH_CLIENT_ID", "GOOGLE_OAUTH_CLIENT_SECRET", "GOOGLE_OAUTH_REDIRECT_URI", "GOOGLE_TOKEN_ENC_KEY"].filter((k) => !v(env, k));
}

export function urlConsentimiento(state: string, env: Env = process.env, modo: "conectar" | "login" = "conectar"): string {
  const q = new URLSearchParams({
    client_id: v(env, "GOOGLE_OAUTH_CLIENT_ID"), redirect_uri: v(env, "GOOGLE_OAUTH_REDIRECT_URI"),
    response_type: "code", scope: (modo === "login" ? LOGIN_SCOPES : GOOGLE_SCOPES).join(" "),
    ...(modo === "login"
      ? { prompt: "select_account", state }
      // select_account permite conectar otra cuenta distinta; consent asegura refresh_token.
      : { access_type: "offline", prompt: "select_account consent", include_granted_scopes: "true", state }),
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${q}`;
}

export type Tokens = { accessToken: string; refreshToken?: string; expiresAt: Date; scopes: string };
async function token(body: Record<string, string>, f: Fetch): Promise<Tokens> {
  const r = await f("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(body) });
  if (!r.ok) throw new Error(`Google token HTTP ${r.status}`);
  const d = (await r.json()) as { access_token: string; refresh_token?: string; expires_in: number; scope?: string };
  return { accessToken: d.access_token, refreshToken: d.refresh_token, expiresAt: new Date(Date.now() + (d.expires_in - 60) * 1000), scopes: d.scope ?? "" };
}
export function canjearCodigo(code: string, env: Env = process.env, f: Fetch = fetch) {
  return token({ code, client_id: v(env, "GOOGLE_OAUTH_CLIENT_ID"), client_secret: v(env, "GOOGLE_OAUTH_CLIENT_SECRET"), redirect_uri: v(env, "GOOGLE_OAUTH_REDIRECT_URI"), grant_type: "authorization_code" }, f);
}
export function refrescar(refreshToken: string, env: Env = process.env, f: Fetch = fetch) {
  return token({ refresh_token: refreshToken, client_id: v(env, "GOOGLE_OAUTH_CLIENT_ID"), client_secret: v(env, "GOOGLE_OAUTH_CLIENT_SECRET"), grant_type: "refresh_token" }, f);
}
export async function revocar(tokenPlano: string, f: Fetch = fetch): Promise<boolean> {
  const r = await f("https://oauth2.googleapis.com/revoke", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ token: tokenPlano }) });
  return r.ok || r.status === 400; // 400 = ya revocado/expirado
}
export async function perfil(accessToken: string, f: Fetch = fetch): Promise<{ sub: string; email: string; email_verified?: boolean }> {
  const r = await f("https://openidconnect.googleapis.com/v1/userinfo", { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!r.ok) throw new Error(`Google userinfo HTTP ${r.status}`);
  return (await r.json()) as { sub: string; email: string; email_verified?: boolean };
}
export type CalendarioGoogle = { id: string; summary: string; primary: boolean };
export async function listarCalendarios(accessToken: string, f: Fetch = fetch): Promise<CalendarioGoogle[]> {
  const r = await f("https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=writer", { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!r.ok) throw new Error(`Google calendarList HTTP ${r.status}`);
  const d = (await r.json()) as { items?: { id: string; summary: string; primary?: boolean }[] };
  return (d.items ?? []).map((c) => ({ id: c.id, summary: c.summary, primary: Boolean(c.primary) }));
}
export async function crearEvento(accessToken: string, calendarId: string, e: { titulo: string; inicio: string; fin: string; descripcion?: string; lugar?: string }, f: Fetch = fetch): Promise<string> {
  const r = await f(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`, {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ summary: e.titulo, description: e.descripcion, location: e.lugar, start: { dateTime: e.inicio, timeZone: "America/Santo_Domingo" }, end: { dateTime: e.fin, timeZone: "America/Santo_Domingo" } }),
  });
  if (!r.ok) throw new Error(`Google events HTTP ${r.status}`);
  return ((await r.json()) as { id: string }).id;
}

/** Devuelve un access token vigente; si venció, refresca y avisa para persistir. */
export async function tokenVigente(cuenta: { accessTokenEnc: string; refreshTokenEnc: string | null; expiresAt: Date },
  env: Env = process.env, f: Fetch = fetch, ahora = new Date()): Promise<{ accessToken: string; renovado?: Tokens }> {
  if (cuenta.expiresAt.getTime() > ahora.getTime()) return { accessToken: descifrar(cuenta.accessTokenEnc, env) };
  if (!cuenta.refreshTokenEnc) throw new Error("La cuenta Google necesita reconectarse.");
  const t = await refrescar(descifrar(cuenta.refreshTokenEnc, env), env, f);
  return { accessToken: t.accessToken, renovado: t };
}
