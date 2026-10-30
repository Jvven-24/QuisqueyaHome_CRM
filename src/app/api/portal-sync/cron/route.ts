/**
 * Trabajo de reconciliación CRM → portal para el temporizador de la VPS (sin sesión de usuario).
 * Excepción explícita al patrón de RBAC: la protege una firma HMAC-SHA256 con `PORTAL_SYNC_SECRET` sobre
 * `<timestamp>.POST.<ruta>.` (ventana de 5 min). Sin la bandera `PORTAL_SYNC_ENABLED` responde 409. Es idempotente:
 * repetir la petición no cambia nada.
 */
import { reconciliarPortal } from "@/application/portal-sync/casos-de-uso";
import { verificarFirma } from "@/application/portal-sync/firma";
import { portalSyncDeps } from "@/infrastructure/contenedor/portal-sync";
import { errorResponse } from "@/infrastructure/http";

export async function POST(request: Request) {
  try {
    const secreto = process.env.PORTAL_SYNC_SECRET?.trim() ?? "";
    const ok = verificarFirma(secreto, {
      timestamp: Number(request.headers.get("x-qh-timestamp")), metodo: "POST", ruta: new URL(request.url).pathname, cuerpo: "",
      firma: request.headers.get("x-qh-signature") ?? "",
    });
    if (!ok) return Response.json({ error: "Firma inválida." }, { status: 401 });
    return Response.json({ ok: true, resultado: await reconciliarPortal(portalSyncDeps()) });
  } catch (error) {
    return errorResponse(error);
  }
}
