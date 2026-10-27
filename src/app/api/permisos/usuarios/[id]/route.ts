import { OverrideInput, requirePermissionAdministrator } from "@/application/permisos/administracion";
import { NotFoundError } from "@/domain/errors";
import { requireFullScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { changeUserPermission } from "@/infrastructure/db/repos/permisos";
import { errorResponse, parseInput } from "@/infrastructure/http";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireActor();
    requireFullScope(actor, "settings", "edit");
    requirePermissionAdministrator(actor);
    const id = Number((await params).id);
    if (!Number.isSafeInteger(id) || id <= 0 || id > 2147483647) throw new NotFoundError("El usuario no está disponible.");
    const change = parseInput(OverrideInput, await request.json().catch(() => ({})));
    await changeUserPermission(actor, id, change);
    return Response.json({ ok: true });
  } catch (error) { return errorResponse(error); }
}
