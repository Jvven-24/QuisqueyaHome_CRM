/**
 * Redirector público de enlaces de seguimiento: `/v/<codigo>`.
 *
 * Pública a propósito (la abre cualquiera desde un anuncio de Facebook): no hay `Actor` ni `requireScope`.
 * Lo único que hace es registrar el clic y redirigir 302 a un destino que construye el CRM: el portal propio
 * (host fijado por PORTAL_PUBLIC_URL) o wa.me. Nunca redirige a una URL recibida en la petición.
 * No guarda IP; el visitante se reconoce por la cookie propia `qh_vid` (90 días).
 */
import { NextResponse } from "next/server";
import { resolverClic } from "@/application/seguimiento/casos-de-uso";
import { seguimientoParaLectura } from "@/infrastructure/contenedor/seguimiento";

const COOKIE = "qh_vid";
const NOVENTA_DIAS = 60 * 60 * 24 * 90;

async function atender(request: Request, ctx: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await ctx.params;
  const cookie = /(?:^|;\s*)qh_vid=([0-9a-f-]{36})/.exec(request.headers.get("cookie") ?? "")?.[1] ?? null;
  const portal = process.env.PORTAL_PUBLIC_URL?.trim() ?? "";
  let r;
  try {
    r = await resolverClic(seguimientoParaLectura(), {
      codigo, visitorId: cookie, referrer: request.headers.get("referer"), userAgent: request.headers.get("user-agent"), origenPortal: portal,
    });
  } catch {
    r = null;
  }
  const sinCache = { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" };
  if (!r) {
    // Código desconocido o enlace desactivado: nunca un error técnico para quien viene de un anuncio.
    if (portal) return NextResponse.redirect(portal, { status: 302, headers: sinCache });
    return new NextResponse("Enlace no disponible.", { status: 404, headers: sinCache });
  }
  const res = NextResponse.redirect(r.destino, { status: 302, headers: sinCache });
  if (r.nuevoVisitante) res.cookies.set(COOKIE, r.visitorId, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: NOVENTA_DIAS });
  return res;
}

export const GET = atender;
export const HEAD = atender;
