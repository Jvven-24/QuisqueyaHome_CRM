/** M13 · Permisos (`docs/R_ANALISIS_Y_PLAN.md` §7 R3.5; decisión #27). */

import { z } from "zod";
import { NotFoundError } from "@/domain/errors";
import { PERMISSION_ACTIONS, PERMISSION_RESOURCES, PERMISSION_SCOPES } from "@/domain/catalogs";
import { requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { editarPermisos } from "@/application/roles/casos-de-uso";
import { rolesParaEscritura } from "@/infrastructure/contenedor/roles";
import { errorResponse, parseInput } from "@/infrastructure/http";

const CeldaPermiso = z.object({
  resource: z.enum(PERMISSION_RESOURCES),
  action: z.enum(PERMISSION_ACTIONS),
  scope: z.enum(PERMISSION_SCOPES),
});

const GuardarPermisosInput = z.object({
  permisos: z.array(CeldaPermiso),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params;
    const roleId = Number(idParam);
    if (!Number.isInteger(roleId) || roleId <= 0) throw new NotFoundError("El rol indicado no existe.");
    const datos = parseInput(GuardarPermisosInput, await request.json().catch(() => ({})));
    const actor = await requireActor();
    requireScope(actor, "settings", "edit");
    const resultado = await editarPermisos(rolesParaEscritura(), actor, roleId, datos.permisos);
    return Response.json({
      ok: true,
      roleId: resultado.roleId,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
