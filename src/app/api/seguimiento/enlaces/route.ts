/** Enlaces de seguimiento por video/anuncio: listar (con clics y leads) y crear. */
import { crearEnlace } from "@/application/seguimiento/casos-de-uso";
import { urlCorta } from "@/application/seguimiento/enlaces";
import { requireFullScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { urlPublica } from "@/infrastructure/conexiones-oauth/servicios";
import { seguimientoParaEscritura, seguimientoParaLectura } from "@/infrastructure/contenedor/seguimiento";
import { errorResponse } from "@/infrastructure/http";
import { leerJsonLimitado } from "@/infrastructure/limites";

export async function GET() {
  try {
    const actor = await requireActor();
    requireFullScope(actor, "integrations", "view");
    const origen = urlPublica();
    const enlaces = (await seguimientoParaLectura().listarEnlaces()).map((e) => ({ ...e, urlCorta: urlCorta(origen, e.code) }));
    return Response.json({ ok: true, enlaces, portalConfigurado: Boolean(process.env.PORTAL_PUBLIC_URL?.trim()) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireActor();
    requireFullScope(actor, "integrations", "create");
    const cuerpo = await leerJsonLimitado(request, 8 * 1024);
    if (cuerpo instanceof Response) return cuerpo;
    const { repo, enriquecer } = seguimientoParaEscritura();
    const enlace = await crearEnlace(repo, cuerpo, { origenPortal: process.env.PORTAL_PUBLIC_URL?.trim() ?? "", creadoPor: actor.userId, enriquecer });
    return Response.json({ ok: true, enlace: { ...enlace, urlCorta: urlCorta(urlPublica(), enlace.code) } }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
