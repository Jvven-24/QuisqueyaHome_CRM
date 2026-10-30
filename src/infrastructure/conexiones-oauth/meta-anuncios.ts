/**
 * Marketing API (solo lectura): dado un `ad_id`, devuelve creativo, nombre del anuncio y campaña para completar un
 * enlace de seguimiento. Usa el token de la conexión «Meta Ads» (permiso ads_read). Nunca lanza: si falta
 * conexión, permiso o el anuncio no existe, devuelve null y el enlace se crea igual.
 */
import { versionGraph } from "./meta.ts";

type Env = Record<string, string | undefined>;
type Fetch = typeof fetch;
export type DatosAnuncio = { creativeId?: string; adName?: string; campaign?: string };

export async function leerAnuncioMeta(adId: string, accessToken: string, env: Env = process.env, f: Fetch = fetch): Promise<DatosAnuncio | null> {
  if (!/^\d{5,30}$/.test(adId)) return null;
  const campos = "name,campaign{id,name},creative{id,name}";
  try {
    const r = await f(`https://graph.facebook.com/${versionGraph(env)}/${adId}?fields=${encodeURIComponent(campos)}`, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!r.ok) return null;
    const d = (await r.json()) as { name?: string; campaign?: { name?: string }; creative?: { id?: string } };
    const out: DatosAnuncio = {};
    if (d.creative?.id) out.creativeId = String(d.creative.id);
    if (d.name) out.adName = d.name;
    if (d.campaign?.name) out.campaign = d.campaign.name;
    return out;
  } catch {
    return null;
  }
}
