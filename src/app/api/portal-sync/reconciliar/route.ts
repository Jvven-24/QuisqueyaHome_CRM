/** Sincronización CRM → portal. GET = simulacro (qué haría); POST = ejecutar. Solo administración; detrás de PORTAL_SYNC_ENABLED. */
import { reconciliarPortal } from "@/application/portal-sync/casos-de-uso";
import { requireFullScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { portalSyncDeps } from "@/infrastructure/contenedor/portal-sync";
import { errorResponse } from "@/infrastructure/http";

export async function GET() {
  try {
    const actor = await requireActor();
    requireFullScope(actor, "settings", "view");
    return Response.json({ ok: true, resultado: await reconciliarPortal(portalSyncDeps(), { simulacro: true }) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST() {
  try {
    const actor = await requireActor();
    requireFullScope(actor, "settings", "edit");
    return Response.json({ ok: true, resultado: await reconciliarPortal(portalSyncDeps()) });
  } catch (error) {
    return errorResponse(error);
  }
}
