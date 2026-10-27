/** Estado de proveedores (solo presencia, nunca valores). Requiere settings:view. */
import { requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { errorResponse } from "@/infrastructure/http";
import { estadoProveedores } from "@/infrastructure/proveedores-externos";

export async function GET() {
  try {
    const actor = await requireActor();
    requireScope(actor, "settings", "view");
    return Response.json({ ok: true, proveedores: estadoProveedores() });
  } catch (error) {
    return errorResponse(error);
  }
}
