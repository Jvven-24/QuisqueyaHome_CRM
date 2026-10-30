/** Casos de uso de seguimiento de origen. La autorización la hace quien llama; los repos entran por puerto. */
import { randomUUID } from "node:crypto";
import { ValidationError } from "../../domain/errors.ts";
import { camposOrigenDeLead, decidirAtribucion, dentroDeVentana, VENTANA_ATRIBUCION_DIAS, type Atribucion, type Toque } from "./atribucion.ts";
import { generarCodigo, normalizarCodigo } from "./codigo.ts";
import { conDefectos, construirDestino, CrearEnlaceInput, esRastreador, validarDestinoPortal } from "./enlaces.ts";
import type { Enlace, RepoSeguimiento, Senales } from "./puertos.ts";

export type Enriquecedor = (adId: string) => Promise<{ creativeId?: string; adName?: string; campaign?: string } | null>;

export async function crearEnlace(
  repo: RepoSeguimiento, entrada: unknown,
  ctx: { origenPortal: string; creadoPor: number; enriquecer?: Enriquecedor; codigo?: () => string },
): Promise<Enlace> {
  const parsed = CrearEnlaceInput.safeParse(entrada);
  if (!parsed.success) throw new ValidationError(parsed.error.issues[0]?.message ?? "Datos de enlace no válidos.");
  const d = conDefectos(parsed.data);
  let portalPath: string | null = null;
  if (d.destination === "portal") {
    try { portalPath = validarDestinoPortal(d.portalPath, ctx.origenPortal); } catch (e) { throw new ValidationError(e instanceof Error ? e.message : "Destino no válido."); }
  }
  // Con Meta Ads conectado, completa creativo/nombre/campaña del anuncio; si falla, el enlace se crea igual.
  const extra = d.adId && ctx.enriquecer ? await ctx.enriquecer(d.adId).catch(() => null) : null;
  const datos = {
    name: d.name, destination: d.destination, portalPath, whatsappPhone: d.whatsappPhone ?? null, whatsappText: d.whatsappText ?? null,
    videoUrl: d.videoUrl ?? null, videoTitle: d.videoTitle ?? null, campaign: d.campaign ?? extra?.campaign ?? null,
    utmSource: d.utmSource, utmMedium: d.utmMedium, utmCampaign: d.utmCampaign, utmContent: d.utmContent ?? null, utmTerm: d.utmTerm ?? null,
    adId: d.adId ?? null, creativeId: d.creativeId ?? extra?.creativeId ?? null, adName: extra?.adName ?? null, createdBy: ctx.creadoPor,
  };
  for (let i = 0; i < 6; i++) {
    const r = await repo.insertarEnlace(datos, (ctx.codigo ?? generarCodigo)());
    if (r !== "codigo-repetido") return r;
  }
  throw new ValidationError("No se pudo generar un código único. Inténtalo de nuevo.");
}

export type ResultadoClic = { destino: string; visitorId: string; nuevoVisitante: boolean };

/** `/v/<codigo>`: registra el clic y devuelve el destino. null = código inexistente o enlace desactivado. */
export async function resolverClic(
  repo: RepoSeguimiento,
  p: { codigo: string; visitorId: string | null; referrer: string | null; userAgent: string | null; origenPortal: string; ahora?: Date },
): Promise<ResultadoClic | null> {
  const code = normalizarCodigo(p.codigo);
  if (!code) return null;
  const enlace = await repo.enlacePorCodigo(code);
  if (!enlace || !enlace.isActive) return null;
  const nuevoVisitante = !p.visitorId || !/^[0-9a-f-]{36}$/.test(p.visitorId);
  const visitorId = nuevoVisitante ? randomUUID() : p.visitorId!;
  // Si falla la analítica, la persona llega igual a su destino (WhatsApp o portal).
  await repo.registrarClic({ linkId: enlace.id, visitorId, referrer: p.referrer?.slice(0, 300) ?? null, userAgent: p.userAgent?.slice(0, 200) ?? null, esBot: esRastreador(p.userAgent), en: p.ahora ?? new Date() })
    .catch((e: unknown) => console.error("seguimiento: no se pudo registrar el clic:", e instanceof Error ? e.message : "desconocido"));
  return { destino: construirDestino(enlace, { origenPortal: p.origenPortal, visitorId }), visitorId, nuevoVisitante };
}

const aToque = (e: Enlace, via: Toque["via"], canal: Toque["canal"], en: Date): Toque => ({
  linkId: e.id, code: e.code, videoUrl: e.videoUrl, campaign: e.campaign, utmSource: e.utmSource, utmMedium: e.utmMedium,
  utmCampaign: e.utmCampaign, utmContent: e.utmContent, adId: e.adId, creativeId: e.creativeId, canal, via, en,
});

/** Traduce las señales de una captura (código, visitante, anuncio, UTM) en toques. */
export async function resolverToques(repo: RepoSeguimiento, s: Senales, ahora = new Date()): Promise<{ directo: Toque | null; clics: Toque[] }> {
  let directo: Toque | null = null;
  const code = s.codigo ? normalizarCodigo(s.codigo) : null;
  const porCodigo = code ? await repo.enlacePorCodigo(code) : null;
  if (porCodigo) directo = aToque(porCodigo, s.canal === "whatsapp" ? "codigo_whatsapp" : "clic_visitante", s.canal, ahora);
  if (!directo && s.adId) {
    const porAd = await repo.enlacePorAdId(s.adId);
    directo = porAd
      ? { ...aToque(porAd, "meta_form", s.canal, ahora), adId: s.adId }
      : { linkId: null, code: null, videoUrl: null, campaign: null, utmSource: s.utm?.source ?? "facebook", utmMedium: s.utm?.medium ?? "lead_ads", utmCampaign: s.utm?.campaign ?? null, utmContent: null, adId: s.adId, creativeId: null, canal: s.canal, via: "meta_form", en: ahora };
  }
  if (!directo && s.utm && (s.utm.source || s.utm.campaign)) {
    directo = { linkId: null, code: null, videoUrl: null, campaign: s.utm.campaign ?? null, utmSource: s.utm.source ?? null, utmMedium: s.utm.medium ?? null, utmCampaign: s.utm.campaign ?? null, utmContent: s.utm.content ?? null, adId: null, creativeId: null, canal: s.canal, via: "utm", en: ahora };
  }
  const desde = new Date(ahora.getTime() - VENTANA_ATRIBUCION_DIAS * 24 * 3600 * 1000);
  const clics = s.visitorId ? (await repo.clicsDeVisitante(s.visitorId, desde)).filter((c) => dentroDeVentana(c.en, ahora)).map((c) => aToque(c.enlace, "clic_visitante", c.enlace.destination === "whatsapp" ? "whatsapp" : "portal", c.en)) : [];
  return { directo, clics };
}

/** Guarda first y last touch del lead. Nunca debe romper la captura: quien llama captura el error. */
export async function atribuirLead(repo: RepoSeguimiento, p: { leadId: number; contactId: number | null; toques: { directo: Toque | null; clics: Toque[] } }): Promise<Atribucion | null> {
  const previa = p.contactId ? await repo.atribucionDeContacto(p.contactId) : null;
  const a = decidirAtribucion({ previa, clics: p.toques.clics, directo: p.toques.directo });
  if (a) await repo.guardarAtribucion(p.leadId, a);
  return a;
}

/** Campos de origen del lead para una captura NUEVA, tomados del primer toque (sin pisar lo que ya venía). */
export function origenParaCaptura(toques: { directo: Toque | null; clics: Toque[] }, previa: Atribucion | null = null): ReturnType<typeof camposOrigenDeLead> {
  const a = decidirAtribucion({ previa, clics: toques.clics, directo: toques.directo });
  return a ? camposOrigenDeLead(a.first) : {};
}
