/** Enlaces de seguimiento por video o anuncio: validación, destino final con UTM y URL corta. Sin E/S. */
import { z } from "zod";
import { marcaWhatsApp } from "./codigo.ts";

const texto = (max: number) => z.string().trim().max(max, `Máximo ${max} caracteres.`);
const opcional = (max: number) => z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), texto(max).optional());
const etiquetaUtm = z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), z.string().trim().max(80).regex(/^[a-z0-9._-]+$/i, "Usa letras, números, punto, guion o guion bajo.").optional());

export const PLANTILLA_WHATSAPP = "Hola, vi su video y quiero información. {codigo}";

export const CrearEnlaceInput = z.object({
  name: z.string({ error: "Ponle un nombre al enlace." }).trim().min(1, "Ponle un nombre al enlace.").max(120),
  destination: z.enum(["portal", "whatsapp"], { error: "Elige el destino: portal o WhatsApp." }),
  portalPath: opcional(300),
  whatsappPhone: z.preprocess((v) => (typeof v === "string" ? v.replace(/\D/g, "") : v), z.string().regex(/^\d{8,15}$/, "Escribe el número con código de país, solo dígitos.").optional()),
  whatsappText: opcional(300),
  videoUrl: z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), z.url({ protocol: /^https?$/, error: "Escribe una URL http(s) válida." }).max(500).optional()),
  videoTitle: opcional(160),
  campaign: opcional(160),
  utmSource: etiquetaUtm,
  utmMedium: etiquetaUtm,
  utmCampaign: etiquetaUtm,
  utmContent: etiquetaUtm,
  utmTerm: etiquetaUtm,
  adId: z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), z.string().trim().regex(/^\d{5,30}$/, "El ID de anuncio de Meta son solo dígitos.").optional()),
  creativeId: z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), z.string().trim().regex(/^\d{5,30}$/, "El ID de creativo son solo dígitos.").optional()),
}).superRefine((d, ctx) => {
  if (d.destination === "whatsapp" && !d.whatsappPhone) ctx.addIssue({ code: "custom", path: ["whatsappPhone"], message: "Indica el número de WhatsApp de destino." });
});
export type CrearEnlace = z.infer<typeof CrearEnlaceInput>;

export function slug(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}

/** Valores por defecto: Facebook / video y la campaña tomada del nombre. */
export function conDefectos(d: CrearEnlace): CrearEnlace & { utmSource: string; utmMedium: string; utmCampaign: string } {
  return { ...d, utmSource: d.utmSource ?? "facebook", utmMedium: d.utmMedium ?? "video", utmCampaign: d.utmCampaign ?? (slug(d.campaign ?? d.name) || "sin-campana") };
}

/**
 * Solo el portal propio: una ruta relativa o una URL cuyo host coincide con el origen del portal.
 * Evita que `/v/<codigo>` sirva de redirección abierta hacia sitios ajenos.
 */
export function validarDestinoPortal(ruta: string | undefined, origenPortal: string): string {
  if (!origenPortal) throw new Error("Falta configurar PORTAL_PUBLIC_URL para crear enlaces hacia el portal.");
  const base = new URL(origenPortal);
  if (!ruta) return "/";
  if (ruta.startsWith("//") || ruta.includes("\\")) throw new Error("La ruta del portal no es válida.");
  if (ruta.startsWith("/")) return ruta;
  const u = new URL(ruta);
  if (u.host !== base.host || u.protocol !== base.protocol) throw new Error("El destino debe estar en el dominio del portal.");
  return `${u.pathname}${u.search}${u.hash}` || "/";
}

export type EnlaceDestino = {
  code: string; destination: "portal" | "whatsapp"; portalPath: string | null; whatsappPhone: string | null; whatsappText: string | null;
  utmSource: string; utmMedium: string; utmCampaign: string | null; utmContent: string | null; utmTerm: string | null;
  adId: string | null; creativeId: string | null;
};

/** Texto prellenado de WhatsApp con la marca `[QH-codigo]` (sustituye `{codigo}` o la añade al final). */
export function textoWhatsApp(l: Pick<EnlaceDestino, "code" | "whatsappText">): string {
  const marca = marcaWhatsApp(l.code);
  const plantilla = l.whatsappText?.trim() || PLANTILLA_WHATSAPP;
  return plantilla.includes("{codigo}") ? plantilla.replace("{codigo}", marca) : `${plantilla} ${marca}`;
}

/**
 * Destino final de `/v/<codigo>`. Portal: ruta + utm_* + qh_c (código) + qh_v (visitante) para que el formulario
 * del portal los reenvíe a `/api/leads/externo`. WhatsApp: wa.me con el código en el texto.
 */
export function construirDestino(l: EnlaceDestino, p: { origenPortal: string; visitorId: string }): string {
  if (l.destination === "whatsapp") return `https://wa.me/${l.whatsappPhone}?text=${encodeURIComponent(textoWhatsApp(l))}`;
  const url = new URL(validarDestinoPortal(l.portalPath ?? undefined, p.origenPortal), p.origenPortal);
  const q = url.searchParams;
  q.set("utm_source", l.utmSource); q.set("utm_medium", l.utmMedium);
  if (l.utmCampaign) q.set("utm_campaign", l.utmCampaign);
  if (l.utmContent) q.set("utm_content", l.utmContent);
  if (l.utmTerm) q.set("utm_term", l.utmTerm);
  q.set("qh_c", l.code); q.set("qh_v", p.visitorId);
  return url.toString();
}

export const urlCorta = (origen: string, code: string): string => `${origen.replace(/\/+$/, "")}/v/${code}`;

/** Quien pre-visualiza el enlace (Facebook, WhatsApp, Slack…) no es una visita real. */
export function esRastreador(userAgent: string | null): boolean {
  return !userAgent || /facebookexternalhit|facebot|whatsapp|twitterbot|slackbot|telegrambot|linkedinbot|discordbot|googlebot|bingbot|bot\b|crawler|spider|preview/i.test(userAgent);
}
