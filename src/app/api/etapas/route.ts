import { crearEtapa } from "@/application/etapas/casos-de-uso";
import { crearEtapaSchema } from "@/application/etapas/entrada";
import { requireFullScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { etapasParaEscritura } from "@/infrastructure/contenedor/etapas";
import { errorResponse, parseInput } from "@/infrastructure/http";

export async function POST(request: Request) {
  try {
    const actor = await requireActor();
    requireFullScope(actor, "settings", "edit");
    const datos = parseInput(crearEtapaSchema, await request.json().catch(() => ({})));
    const etapa = await crearEtapa(etapasParaEscritura(), actor, {
      name: datos.name, position: datos.position, kind: datos.kind,
      defaultProbability: datos.defaultProbability, isActive: datos.isActive,
    });
    return Response.json({ ok: true, etapa }, { status: 201 });
  } catch (error) { return errorResponse(error); }
}
