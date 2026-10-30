/** Repositorio de seguimiento de origen (enlaces, clics, atribución). Implementa el puerto de la capa application. */
import { and, count, countDistinct, desc, eq, gte, lte } from "drizzle-orm";
import type { Atribucion, Toque } from "../../../application/seguimiento/atribucion";
import type { Enlace, EnlaceConConteos, NuevoEnlace, RepoSeguimiento } from "../../../application/seguimiento/puertos";
import type { Actor, PermissionScope } from "../../../domain/rbac";
import type { ClicsEnlace, FilaOrigen } from "../../../application/seguimiento/analitica";
import { visibleRows } from "../../rbac-filter";
import { getDb } from "../client";
import { leadAttributions, leads, trackingClicks, trackingLinks } from "../schema";

type Fila = typeof trackingLinks.$inferSelect;
export const aEnlace = (f: Fila): Enlace => ({
  id: f.id, code: f.code, name: f.name, destination: f.destination, portalPath: f.portalPath, whatsappPhone: f.whatsappPhone,
  whatsappText: f.whatsappText, videoUrl: f.videoUrl, videoTitle: f.videoTitle, campaign: f.campaign, utmSource: f.utmSource,
  utmMedium: f.utmMedium, utmCampaign: f.utmCampaign, utmContent: f.utmContent, utmTerm: f.utmTerm, adId: f.adId,
  creativeId: f.creativeId, adName: f.adName, isActive: f.isActive, createdAt: f.createdAt,
});

const aToque = (a: typeof leadAttributions.$inferSelect): Toque => ({
  linkId: a.linkId, code: a.code, videoUrl: a.videoUrl, campaign: a.campaign, utmSource: a.utmSource, utmMedium: a.utmMedium,
  utmCampaign: a.utmCampaign, utmContent: a.utmContent, adId: a.adId, creativeId: a.creativeId, canal: a.channel, via: a.matchedBy, en: a.touchedAt,
});
const deToque = (leadId: number, model: "first" | "last", t: Toque) => ({
  leadId, model, linkId: t.linkId, code: t.code, videoUrl: t.videoUrl, campaign: t.campaign, utmSource: t.utmSource, utmMedium: t.utmMedium,
  utmCampaign: t.utmCampaign, utmContent: t.utmContent, adId: t.adId, creativeId: t.creativeId, channel: t.canal, matchedBy: t.via, touchedAt: t.en,
});

export function repoSeguimiento(): RepoSeguimiento {
  const db = () => getDb();
  return {
    async insertarEnlace(d: NuevoEnlace, code: string) {
      const [f] = await db().insert(trackingLinks).values({
        code, name: d.name, destination: d.destination, portalPath: d.portalPath, whatsappPhone: d.whatsappPhone, whatsappText: d.whatsappText,
        videoUrl: d.videoUrl, videoTitle: d.videoTitle, campaign: d.campaign, utmSource: d.utmSource, utmMedium: d.utmMedium,
        utmCampaign: d.utmCampaign, utmContent: d.utmContent, utmTerm: d.utmTerm, adId: d.adId, creativeId: d.creativeId, adName: d.adName, createdBy: d.createdBy,
      }).onConflictDoNothing({ target: trackingLinks.code }).returning();
      return f ? aEnlace(f) : "codigo-repetido";
    },
    async enlacePorCodigo(code) {
      const [f] = await db().select().from(trackingLinks).where(eq(trackingLinks.code, code));
      return f ? aEnlace(f) : null;
    },
    async enlacePorAdId(adId) {
      const [f] = await db().select().from(trackingLinks).where(and(eq(trackingLinks.adId, adId), eq(trackingLinks.isActive, true))).orderBy(desc(trackingLinks.id)).limit(1);
      return f ? aEnlace(f) : null;
    },
    async listarEnlaces(): Promise<EnlaceConConteos[]> {
      const filas = await db().select().from(trackingLinks).orderBy(desc(trackingLinks.createdAt));
      const clics = await db().select({ id: trackingClicks.linkId, clics: count(), visitantes: countDistinct(trackingClicks.visitorId) })
        .from(trackingClicks).where(eq(trackingClicks.isBot, false)).groupBy(trackingClicks.linkId);
      const leadsPorEnlace = await db().select({ id: leadAttributions.linkId, n: count() }).from(leadAttributions)
        .where(eq(leadAttributions.model, "first")).groupBy(leadAttributions.linkId);
      return filas.map((f) => ({
        ...aEnlace(f),
        clics: clics.find((c) => c.id === f.id)?.clics ?? 0,
        visitantes: clics.find((c) => c.id === f.id)?.visitantes ?? 0,
        leads: leadsPorEnlace.find((l) => l.id === f.id)?.n ?? 0,
      }));
    },
    async cambiarActivo(id, activo) {
      const r = await db().update(trackingLinks).set({ isActive: activo, updatedAt: new Date() }).where(eq(trackingLinks.id, id)).returning({ id: trackingLinks.id });
      return r.length > 0;
    },
    async registrarClic(c) {
      await db().insert(trackingClicks).values({ linkId: c.linkId, visitorId: c.visitorId, referrer: c.referrer, userAgent: c.userAgent, isBot: c.esBot, clickedAt: c.en });
    },
    async clicsDeVisitante(visitorId, desde) {
      const filas = await db().select({ l: trackingLinks, en: trackingClicks.clickedAt }).from(trackingClicks)
        .innerJoin(trackingLinks, eq(trackingLinks.id, trackingClicks.linkId))
        .where(and(eq(trackingClicks.visitorId, visitorId), eq(trackingClicks.isBot, false), gte(trackingClicks.clickedAt, desde)));
      return filas.map((f) => ({ enlace: aEnlace(f.l), en: f.en }));
    },
    async atribucionDeContacto(contactId) {
      // La atribución más antigua del contacto en cualquiera de sus leads (el primer toque no se pierde).
      const todas = await db().select({ a: leadAttributions }).from(leadAttributions)
        .innerJoin(leads, eq(leads.id, leadAttributions.leadId))
        .where(eq(leads.contactId, contactId)).orderBy(leadAttributions.touchedAt);
      const first = todas.filter((t) => t.a.model === "first")[0]?.a;
      const last = [...todas.filter((t) => t.a.model === "last")].reverse()[0]?.a;
      return first ? { first: aToque(first), last: aToque(last ?? first) } : null;
    },
    async guardarAtribucion(leadId, a: Atribucion) {
      // El par se guarda junto: nunca queda un primer toque sin último toque.
      await db().transaction(async (tx) => {
        for (const [model, t] of [["first", a.first], ["last", a.last]] as const) {
          const v = deToque(leadId, model, t);
          // El primer toque no se reescribe una vez guardado; el último solo avanza (no retrocede por un escritor lento).
          if (model === "first") await tx.insert(leadAttributions).values(v).onConflictDoNothing({ target: [leadAttributions.leadId, leadAttributions.model] });
          else await tx.insert(leadAttributions).values(v).onConflictDoUpdate({ target: [leadAttributions.leadId, leadAttributions.model], set: { ...v }, setWhere: lte(leadAttributions.touchedAt, v.touchedAt) });
        }
      });
    },
  };
}

/**
 * Datos para la analítica de origen. Los leads se filtran con el alcance del actor (un broker con alcance «own»
 * solo ve su propio origen); los clics son del enlace, no de una persona, y se muestran solo a quien ve todo.
 * Sin fila de atribución se usan los campos de origen del propio lead (leads antiguos o cargados a mano).
 */
export async function datosAnaliticaOrigen(p: { actor: Actor; alcance: Exclude<PermissionScope, "none">; modelo: "first" | "last"; desde: Date; hasta: Date }): Promise<{ filas: FilaOrigen[]; clics: ClicsEnlace[] | null }> {
  const db = getDb();
  const filas = await db.select({
    leadId: leads.id, receivedAt: leads.receivedAt, firstContactedAt: leads.firstContactedAt, status: leads.status,
    leadVideo: leads.sourceVideoUrl, leadCampaign: leads.campaign, leadSource: leads.utmSource, leadMedium: leads.utmMedium, leadUtmCampaign: leads.utmCampaign,
    linkId: leadAttributions.linkId, linkName: trackingLinks.name, linkVideoTitle: trackingLinks.videoTitle,
    aVideo: leadAttributions.videoUrl, aCampaign: leadAttributions.campaign, aUtmCampaign: leadAttributions.utmCampaign, aSource: leadAttributions.utmSource, aMedium: leadAttributions.utmMedium,
    aAd: leadAttributions.adId, aId: leadAttributions.id,
  }).from(leads)
    .leftJoin(leadAttributions, and(eq(leadAttributions.leadId, leads.id), eq(leadAttributions.model, p.modelo)))
    .leftJoin(trackingLinks, eq(trackingLinks.id, leadAttributions.linkId))
    .where(and(visibleRows(p.actor, p.alcance, leads.brokerId, leads.deletedAt), gte(leads.receivedAt, p.desde), lte(leads.receivedAt, p.hasta)))
    .orderBy(leads.receivedAt);
  const salida: FilaOrigen[] = filas.map((r) => ({
    leadId: r.leadId, receivedAt: r.receivedAt, firstContactedAt: r.firstContactedAt, status: r.status,
    linkId: r.linkId, linkName: r.linkName, videoTitle: r.linkVideoTitle,
    videoUrl: r.aId ? r.aVideo : r.leadVideo, campaign: (r.aId ? r.aCampaign ?? r.aUtmCampaign ?? r.leadCampaign : r.leadCampaign) ?? r.leadUtmCampaign,
    utmSource: r.aId ? r.aSource : r.leadSource, utmMedium: r.aId ? r.aMedium : r.leadMedium, adId: r.aAd, atribuido: r.aId != null,
  }));
  let clics: ClicsEnlace[] | null = null; // null = este alcance no ve los clics (no es lo mismo que cero)
  if (p.alcance === "all") {
    const enlaces = await db.select({ id: trackingLinks.id, name: trackingLinks.name }).from(trackingLinks);
    const c = await db.select({ id: trackingClicks.linkId, clics: count(), visitantes: countDistinct(trackingClicks.visitorId) }).from(trackingClicks)
      .where(and(eq(trackingClicks.isBot, false), gte(trackingClicks.clickedAt, p.desde), lte(trackingClicks.clickedAt, p.hasta))).groupBy(trackingClicks.linkId);
    clics = enlaces.map((e) => ({ linkId: e.id, nombre: e.name, clics: c.find((x) => x.id === e.id)?.clics ?? 0, visitantes: c.find((x) => x.id === e.id)?.visitantes ?? 0 }));
  }
  return { filas: salida, clics };
}
