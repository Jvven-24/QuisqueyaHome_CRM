import { editarEtapaSchema } from "@/application/etapas/entrada";
import { editarEtapa } from "@/application/etapas/casos-de-uso";
import type { CambiosEtapa } from "@/application/etapas/puertos";
import { NotFoundError } from "@/domain/errors";
import { requireFullScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { etapasParaEscritura } from "@/infrastructure/contenedor/etapas";
import { errorResponse, parseInput } from "@/infrastructure/http";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params;
    const id = Number(idParam);
    if (!Number.isInteger(id) || id <= 0) throw new NotFoundError();

    const datos = parseInput(editarEtapaSchema, await request.json().catch(() => ({})));
    const actor = await requireActor();
    requireFullScope(actor, "settings", "edit");

    const cambios: CambiosEtapa = {};
    if (datos.name !== undefined) cambios.name = datos.name;
    if (datos.kind !== undefined) cambios.kind = datos.kind;
    if (datos.position !== undefined) cambios.position = datos.position;
    if ("defaultProbability" in datos) cambios.defaultProbability = datos.defaultProbability;
    if (datos.isActive !== undefined) cambios.isActive = datos.isActive;

    const etapa = await editarEtapa(etapasParaEscritura(), actor, id, cambios);

    return Response.json({ ok: true, etapa });
  } catch (error) {
    return errorResponse(error);
  }
}
