/**
 * Capa de integraciones por proveedor. Cada adaptador se elige por variables de
 * entorno, así pasar de Viltrum (prueba) a Quisqueya es solo cambiar el env.
 * Nunca registra ni devuelve valores de secretos.
 */
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

type Env = Record<string, string | undefined>;
const v = (env: Env, k: string) => env[k]?.trim() || "";
export type Resultado = { ok: boolean; proveedor: string; id?: string; error?: string; simulado?: boolean };
type Fetch = typeof fetch;
const GRAPH = "https://graph.facebook.com/v21.0";

/** En modo prueba solo se permite enviar a destinos en INTEGRATIONS_TEST_ALLOWLIST. */
export function destinoPermitido(destino: string, env: Env = process.env): boolean {
  if (v(env, "INTEGRATIONS_TEST_MODE") !== "1") return true;
  const lista = v(env, "INTEGRATIONS_TEST_ALLOWLIST").split(",").map((s) => s.trim().replace(/[^+\w@.]/g, "")).filter(Boolean);
  return lista.includes(destino.replace(/[^+\w@.]/g, ""));
}

// ---------- WhatsApp: YCloud o Cloud API ----------
export function proveedorWhatsApp(env: Env = process.env): "ycloud" | "cloud" | "ninguno" {
  const p = v(env, "WHATSAPP_PROVIDER");
  if (p === "ycloud" || (!p && v(env, "YCLOUD_API_KEY"))) return v(env, "YCLOUD_API_KEY") && v(env, "YCLOUD_WHATSAPP_FROM") ? "ycloud" : "ninguno";
  return v(env, "WHATSAPP_API_TOKEN") && v(env, "WHATSAPP_PHONE_NUMBER_ID") ? "cloud" : "ninguno";
}

export async function enviarWhatsApp(to: string, texto: string, env: Env = process.env, f: Fetch = fetch): Promise<Resultado> {
  const p = proveedorWhatsApp(env);
  if (p === "ninguno") return { ok: false, proveedor: p, error: "WhatsApp sin configurar" };
  if (!destinoPermitido(to, env)) return { ok: false, proveedor: p, error: "Destino fuera de la lista de prueba" };
  const r = p === "ycloud"
    ? await f("https://api.ycloud.com/v2/whatsapp/messages/sendDirectly", {
        method: "POST", headers: { "Content-Type": "application/json", "X-API-Key": v(env, "YCLOUD_API_KEY") },
        body: JSON.stringify({ from: v(env, "YCLOUD_WHATSAPP_FROM"), to, type: "text", text: { body: texto } }),
      })
    : await f(`${GRAPH}/${v(env, "WHATSAPP_PHONE_NUMBER_ID")}/messages`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${v(env, "WHATSAPP_API_TOKEN")}` },
        body: JSON.stringify({ messaging_product: "whatsapp", to: to.replace(/^\+/, ""), type: "text", text: { body: texto } }),
      });
  const data = (await r.json().catch(() => ({}))) as { id?: string; messages?: { id: string }[] };
  return r.ok ? { ok: true, proveedor: p, id: data.id ?? data.messages?.[0]?.id } : { ok: false, proveedor: p, error: `HTTP ${r.status}` };
}

/** Normaliza un webhook entrante (YCloud o Cloud API) a mensajes simples. */
export function parsearWebhookWhatsApp(body: unknown): { de: string; texto: string; id: string }[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const b = body as Record<string, any>;
  if (b?.type === "whatsapp.inbound_message.received" && b.whatsappInboundMessage) {
    const m = b.whatsappInboundMessage;
    return [{ de: m.from, texto: m.text?.body ?? `[${m.type}]`, id: m.id ?? m.wamid }];
  }
  const out: { de: string; texto: string; id: string }[] = [];
  for (const e of b?.entry ?? []) for (const c of e.changes ?? []) for (const m of c.value?.messages ?? [])
    out.push({ de: `+${m.from}`, texto: m.text?.body ?? `[${m.type}]`, id: m.id });
  return out;
}

/** Firma YCloud: cabecera "t=...,s=..." con HMAC-SHA256 de `${t}.${body}`. */
export function firmaYCloudValida(raw: string, cabecera: string | null, secreto: string): boolean {
  if (!secreto || !cabecera) return false;
  const partes = Object.fromEntries(cabecera.split(",").map((p) => p.split("=") as [string, string]));
  if (!partes.t || !partes.s) return false;
  return igual(createHmac("sha256", secreto).update(`${partes.t}.${raw}`).digest("hex"), partes.s);
}

// ---------- Meta: webhook (Lead Ads / IG / WA Cloud) y CAPI ----------
export function firmaMetaValida(raw: string, cabecera: string | null, appSecret: string): boolean {
  if (!appSecret || !cabecera?.startsWith("sha256=")) return false;
  return igual(createHmac("sha256", appSecret).update(raw).digest("hex"), cabecera.slice(7));
}

export function verificarRetoMeta(params: URLSearchParams, env: Env = process.env): string | null {
  const token = v(env, "META_WEBHOOK_VERIFY_TOKEN");
  return token && params.get("hub.mode") === "subscribe" && params.get("hub.verify_token") === token ? params.get("hub.challenge") : null;
}

export function leadgenIds(body: unknown): { leadId: string; formId?: string; pageId?: string; adId?: string }[] {
  const out: { leadId: string; formId?: string; pageId?: string; adId?: string }[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const e of (body as any)?.entry ?? []) for (const c of e.changes ?? [])
    if (c.field === "leadgen" && c.value?.leadgen_id) out.push({ leadId: String(c.value.leadgen_id), formId: c.value.form_id, pageId: c.value.page_id, adId: c.value.ad_id ? String(c.value.ad_id) : undefined });
  return out;
}

export async function leerLeadMeta(leadId: string, env: Env = process.env, f: Fetch = fetch) {
  const r = await f(`${GRAPH}/${encodeURIComponent(leadId)}?access_token=${encodeURIComponent(v(env, "META_PAGE_ACCESS_TOKEN"))}`);
  if (!r.ok) return null;
  const d = (await r.json()) as { field_data?: { name: string; values: string[] }[] };
  return Object.fromEntries((d.field_data ?? []).map((x) => [x.name, x.values?.[0] ?? ""]));
}

const sha = (s: string) => createHash("sha256").update(s.trim().toLowerCase()).digest("hex");

export async function eventoCAPI(evento: { nombre: "Lead" | "Schedule" | "Contact" | "Purchase"; email?: string; telefono?: string; id: string },
  env: Env = process.env, f: Fetch = fetch): Promise<Resultado> {
  const pixel = v(env, "META_PIXEL_ID"), token = v(env, "META_CAPI_ACCESS_TOKEN");
  if (!pixel || !token) return { ok: false, proveedor: "meta_capi", error: "CAPI sin configurar" };
  const user_data: Record<string, string[]> = {};
  if (evento.email) user_data.em = [sha(evento.email)];
  if (evento.telefono) user_data.ph = [sha(evento.telefono.replace(/\D/g, ""))];
  const body: Record<string, unknown> = { data: [{ event_name: evento.nombre, event_time: Math.floor(Date.now() / 1000), event_id: evento.id, action_source: "system_generated", user_data }] };
  if (v(env, "META_CAPI_TEST_EVENT_CODE")) body.test_event_code = v(env, "META_CAPI_TEST_EVENT_CODE");
  const r = await f(`${GRAPH}/${pixel}/events?access_token=${encodeURIComponent(token)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return r.ok ? { ok: true, proveedor: "meta_capi" } : { ok: false, proveedor: "meta_capi", error: `HTTP ${r.status}` };
}

// ---------- Correo: Resend, SMTP (vía Supabase Auth) o simulado ----------
export function proveedorCorreo(env: Env = process.env): "resend" | "smtp" | "simulado" {
  if (v(env, "RESEND_API_KEY") && v(env, "RESEND_FROM")) return "resend";
  if (v(env, "SMTP_HOST") && v(env, "SMTP_FROM")) return "smtp";
  return "simulado";
}

export async function enviarCorreo(para: string, asunto: string, html: string, env: Env = process.env, f: Fetch = fetch): Promise<Resultado> {
  const p = proveedorCorreo(env);
  if (!destinoPermitido(para, env)) return { ok: false, proveedor: p, error: "Destino fuera de la lista de prueba" };
  if (p === "resend") {
    const r = await f("https://api.resend.com/emails", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${v(env, "RESEND_API_KEY")}` },
      body: JSON.stringify({ from: v(env, "RESEND_FROM"), to: [para], subject: asunto, html }) });
    const d = (await r.json().catch(() => ({}))) as { id?: string };
    return r.ok ? { ok: true, proveedor: p, id: d.id } : { ok: false, proveedor: p, error: `HTTP ${r.status}` };
  }
  // SMTP: el reset de contraseña lo envía Supabase Auth con su SMTP configurado (GOTRUE_SMTP_*).
  return { ok: true, proveedor: p, simulado: true, id: `sim_${Date.now()}` };
}

// ---------- Google Calendar / Drive (OAuth 2.0) ----------
export const GOOGLE_SCOPES = ["https://www.googleapis.com/auth/calendar.events", "https://www.googleapis.com/auth/drive.file", "openid", "email"];
export function urlAutorizacionGoogle(state: string, env: Env = process.env): string | null {
  const id = v(env, "GOOGLE_OAUTH_CLIENT_ID"), redirect = v(env, "GOOGLE_OAUTH_REDIRECT_URI");
  if (!id || !redirect) return null;
  const q = new URLSearchParams({ client_id: id, redirect_uri: redirect, response_type: "code", scope: GOOGLE_SCOPES.join(" "), access_type: "offline", prompt: "consent", state });
  return `https://accounts.google.com/o/oauth2/v2/auth?${q}`;
}
export async function canjearCodigoGoogle(code: string, env: Env = process.env, f: Fetch = fetch) {
  const r = await f("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: v(env, "GOOGLE_OAUTH_CLIENT_ID"), client_secret: v(env, "GOOGLE_OAUTH_CLIENT_SECRET"), redirect_uri: v(env, "GOOGLE_OAUTH_REDIRECT_URI"), grant_type: "authorization_code" }) });
  return r.ok ? ((await r.json()) as { access_token: string; refresh_token?: string; expires_in: number }) : null;
}
export async function crearEventoCalendar(accessToken: string, e: { titulo: string; inicio: string; fin: string; descripcion?: string }, f: Fetch = fetch): Promise<Resultado> {
  const r = await f("https://www.googleapis.com/calendar/v3/calendars/primary/events", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ summary: e.titulo, description: e.descripcion, start: { dateTime: e.inicio, timeZone: "America/Santo_Domingo" }, end: { dateTime: e.fin, timeZone: "America/Santo_Domingo" } }) });
  const d = (await r.json().catch(() => ({}))) as { id?: string };
  return r.ok ? { ok: true, proveedor: "google_calendar", id: d.id } : { ok: false, proveedor: "google_calendar", error: `HTTP ${r.status}` };
}
export async function listarDrive(accessToken: string, carpetaId: string, f: Fetch = fetch) {
  const q = new URLSearchParams({ q: `'${carpetaId.replace(/'/g, "")}' in parents and trashed=false`, fields: "files(id,name,mimeType,webViewLink)" });
  const r = await f(`https://www.googleapis.com/drive/v3/files?${q}`, { headers: { Authorization: `Bearer ${accessToken}` } });
  return r.ok ? ((await r.json()) as { files: { id: string; name: string; webViewLink: string }[] }).files : null;
}

// ---------- Estado para Configuración ----------
export function estadoProveedores(env: Env = process.env) {
  const falta = (ks: string[]) => ks.filter((k) => !v(env, k));
  const wa = proveedorWhatsApp(env);
  return [
    { id: "whatsapp", nombre: "WhatsApp", proveedor: wa, falta: wa === "ninguno" ? (v(env, "WHATSAPP_PROVIDER") === "ycloud" || v(env, "YCLOUD_API_KEY") ? falta(["YCLOUD_API_KEY", "YCLOUD_WHATSAPP_FROM"]) : falta(["WHATSAPP_API_TOKEN", "WHATSAPP_PHONE_NUMBER_ID"])) : [] },
    { id: "correo", nombre: "Correo", proveedor: proveedorCorreo(env), falta: proveedorCorreo(env) === "simulado" ? ["RESEND_API_KEY", "RESEND_FROM"] : [] },
    { id: "meta_webhook", nombre: "Meta Lead Ads (webhook)", proveedor: "meta", falta: falta(["META_APP_SECRET", "META_WEBHOOK_VERIFY_TOKEN", "META_PAGE_ACCESS_TOKEN"]) },
    { id: "meta_capi", nombre: "Meta CAPI", proveedor: "meta", falta: falta(["META_PIXEL_ID", "META_CAPI_ACCESS_TOKEN"]) },
    { id: "google", nombre: "Google Calendar/Drive", proveedor: "google", falta: falta(["GOOGLE_OAUTH_CLIENT_ID", "GOOGLE_OAUTH_CLIENT_SECRET", "GOOGLE_OAUTH_REDIRECT_URI"]) },
  ].map((x) => ({ ...x, conectado: x.falta.length === 0 && x.proveedor !== "ninguno" && x.proveedor !== "simulado", modoPrueba: v(env, "INTEGRATIONS_TEST_MODE") === "1" }));
}

function igual(a: string, b: string) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
