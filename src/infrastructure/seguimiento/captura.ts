/**
 * Atribución en la captura de leads (externo, WhatsApp, Meta). Todo es «mejor esfuerzo»: un fallo aquí NUNCA
 * debe impedir que el lead se cree, así que se traga el error y deja un aviso en el log.
 */
import { atribuirLead, resolverToques, origenParaCaptura } from "../../application/seguimiento/casos-de-uso";
import type { Senales } from "../../application/seguimiento/puertos";
import { extraerCodigoDeTexto } from "../../application/seguimiento/codigo";
import { repoSeguimiento } from "../db/repos/seguimiento";

export type Toques = Awaited<ReturnType<typeof resolverToques>>;
type Campos = { campaign?: string; utmSource?: string; utmMedium?: string; utmCampaign?: string; sourceVideoUrl?: string };

export async function toquesDeCaptura(s: Senales & { texto?: string | null }): Promise<Toques | null> {
  try {
    const enTexto = !s.codigo && s.texto ? extraerCodigoDeTexto(s.texto) : null;
    // Un código dentro del mensaje significa que la persona escribió por WhatsApp aunque el aviso llegue por la API.
    return await resolverToques(repoSeguimiento(), { ...s, codigo: s.codigo ?? enTexto, canal: enTexto && s.canal === "otro" ? "whatsapp" : s.canal });
  } catch (e) {
    console.warn("[seguimiento] no se pudo resolver el origen:", e instanceof Error ? e.message : "error");
    return null;
  }
}

/** Completa SOLO lo que la captura no trae: lo explícito del formulario manda sobre lo inferido. */
export function conOrigen<T extends Campos>(entrada: T, toques: Toques | null): T {
  if (!toques) return entrada;
  const inferido = origenParaCaptura(toques);
  const salida = { ...entrada };
  for (const k of Object.keys(inferido) as (keyof Campos)[]) if (!salida[k]) salida[k] = inferido[k];
  return salida;
}

export async function guardarAtribucion(lead: { id: number; contactId: number }, toques: Toques | null): Promise<void> {
  if (!toques) return;
  try {
    await atribuirLead(repoSeguimiento(), { leadId: lead.id, contactId: lead.contactId, toques });
  } catch (e) {
    console.warn("[seguimiento] no se pudo guardar la atribución:", e instanceof Error ? e.message : "error");
  }
}
