import { urlCorta } from "@/application/seguimiento/enlaces";
import { requireFullScope, scopeFor } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { urlPublica } from "@/infrastructure/conexiones-oauth/servicios";
import { seguimientoParaLectura } from "@/infrastructure/contenedor/seguimiento";
import { requireScopeInPage } from "@/infrastructure/page-guard";
import { EnlacesPanel, type EnlaceFila } from "./panel";

export const metadata = { title: "Enlaces de seguimiento · CRM Quisqueya Home" };

export default async function EnlacesPage() {
  const actor = await requireActor();
  requireScopeInPage(actor, "leads", "view");
  const alcance = scopeFor(actor, "integrations", "view");
  if (alcance !== "all") return <EnlacesPanel permitido={false} enlaces={[]} puedeCrear={false} portalConfigurado={false} urlPublicaConfigurada={false} />;
  const origen = urlPublica();
  const enlaces: EnlaceFila[] = (await seguimientoParaLectura().listarEnlaces()).map((e) => ({
    id: e.id, nombre: e.name, codigo: e.code, urlCorta: origen ? urlCorta(origen, e.code) : `/v/${e.code}`, destino: e.destination,
    destinoDetalle: e.destination === "whatsapp" ? `WhatsApp +${e.whatsappPhone}` : `Portal ${e.portalPath ?? "/"}`,
    video: e.videoTitle ?? e.videoUrl, campana: e.campaign, activo: e.isActive, clics: e.clics, visitantes: e.visitantes, leads: e.leads,
    adId: e.adId, creativeId: e.creativeId, creado: e.createdAt.toISOString(),
  }));
  let puedeCrear = true;
  try { requireFullScope(actor, "integrations", "create"); } catch { puedeCrear = false; }
  return <EnlacesPanel permitido enlaces={enlaces} puedeCrear={puedeCrear} portalConfigurado={Boolean(process.env.PORTAL_PUBLIC_URL?.trim())} urlPublicaConfigurada={Boolean(origen)} />;
}
