/**
 * M3 · Negocios — marcar unidad principal y quitar una propiedad de interés
 * (deuda de F1, issue #21). Mismo negocio que `../route.ts` (`POST`), y misma
 * regla: marcar `isPrimary` desmarca cualquier otra fila del negocio.
 *
 * Retirada logica con actor, fecha y motivo. Conserva el vinculo historico.
 */

import { z } from "zod";
import { retirarPropiedadSchema } from "@/application/pipeline/entrada";
import { dtoMutacionPropiedad } from "@/application/pipeline/dto";
import { marcarPropiedadPrincipal, quitarPropiedad } from "@/application/pipeline/casos-de-uso";
import { NotFoundError } from "@/domain/errors";
import { requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { pipelineParaEscritura } from "@/infrastructure/contenedor/pipeline";
import { errorResponse, idsDeRuta, parseInput } from "@/infrastructure/http";

const MarcarPrincipalInput = z.object({ isPrimary: z.literal(true) }).strict();

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; propId: string }> }) {
  try {
    const { id: idParam, propId: propIdParam } = await params;
    const [dealId, propId] = idsDeRuta(idParam, propIdParam);
    if (dealId > 2147483647 || propId > 2147483647) throw new NotFoundError();

    parseInput(MarcarPrincipalInput, await request.json().catch(() => ({})));
    const actor = await requireActor();
    const scope = requireScope(actor, "deals", "edit");

    const propiedad = await marcarPropiedadPrincipal(pipelineParaEscritura(), actor, scope, dealId, propId);

    return Response.json({ ok: true, propiedad: dtoMutacionPropiedad(actor, propiedad) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string; propId: string }> }) {
  try {
    const { id: idParam, propId: propIdParam } = await params;
    const [dealId, propId] = idsDeRuta(idParam, propIdParam);
    if (dealId > 2147483647 || propId > 2147483647) throw new NotFoundError();

    const actor = await requireActor();
    const scope = requireScope(actor, "deals", "edit");

    const datos = parseInput(retirarPropiedadSchema, await request.json().catch(() => ({})));
    await quitarPropiedad(pipelineParaEscritura(), actor, scope, dealId, propId, datos.motivo);

    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
