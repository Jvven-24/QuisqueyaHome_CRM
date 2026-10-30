/**
 * Atribución de un lead a un video/anuncio: primer toque (first-touch) y último toque (last-touch). Sin E/S.
 *
 * Toques posibles, de más a menos fiables:
 *  - código de WhatsApp en el mensaje (la persona llegó por ese enlace);
 *  - clic del mismo visitante en el portal (cookie/qh_v) dentro de la ventana de atribución;
 *  - anuncio de Meta Lead Ads (ad_id) o UTM sueltos del formulario.
 */
export const VENTANA_ATRIBUCION_DIAS = 30;

export type Via = "codigo_whatsapp" | "clic_visitante" | "meta_form" | "utm";
export type Toque = {
  linkId: number | null; code: string | null; videoUrl: string | null; campaign: string | null;
  utmSource: string | null; utmMedium: string | null; utmCampaign: string | null; utmContent: string | null;
  adId: string | null; creativeId: string | null; canal: "portal" | "whatsapp" | "meta_lead_ads" | "otro";
  via: Via; en: Date;
};
export type Atribucion = { first: Toque; last: Toque };

export function decidirAtribucion(p: {
  /** Atribución previa del mismo contacto (otro lead u otro mensaje): el primer toque no se pierde. */
  previa?: Atribucion | null;
  /** Clics del visitante identificado, ya filtrados a la ventana. */
  clics: readonly Toque[];
  /** Señal explícita de esta captura (código en el mensaje, anuncio, UTM). */
  directo?: Toque | null;
}): Atribucion | null {
  const todos = [...(p.previa ? [p.previa.first] : []), ...p.clics, ...(p.directo ? [p.directo] : [])];
  if (todos.length === 0) return null;
  const first = todos.reduce((a, b) => (b.en < a.en ? b : a));
  // Último toque: la señal directa de esta captura gana; si no hay, el más reciente entre los clics y el último previo
  // (un clic viejo no puede hacer retroceder el último toque ya registrado).
  const candidatos = [...p.clics, ...(p.previa ? [p.previa.last] : [])].sort((a, b) => b.en.getTime() - a.en.getTime());
  const last = p.directo ?? candidatos[0]!;
  return { first, last };
}

export function dentroDeVentana(clic: Date, ahora: Date, dias = VENTANA_ATRIBUCION_DIAS): boolean {
  const ms = ahora.getTime() - clic.getTime();
  return ms >= 0 && ms <= dias * 24 * 3600 * 1000;
}

/** Texto de los campos de origen del lead (los que ya muestran Leads y Reportes) a partir del primer toque. */
export function camposOrigenDeLead(t: Toque): { sourceVideoUrl?: string; campaign?: string; utmSource?: string; utmMedium?: string; utmCampaign?: string } {
  const o: ReturnType<typeof camposOrigenDeLead> = {};
  if (t.videoUrl) o.sourceVideoUrl = t.videoUrl;
  if (t.campaign) o.campaign = t.campaign;
  if (t.utmSource) o.utmSource = t.utmSource;
  if (t.utmMedium) o.utmMedium = t.utmMedium;
  if (t.utmCampaign) o.utmCampaign = t.utmCampaign;
  return o;
}
