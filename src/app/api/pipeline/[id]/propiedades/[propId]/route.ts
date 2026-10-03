/**
 * M3 · Negocios — marcar unidad principal y quitar una propiedad de interés
 * (deuda de F1, issue #21). Mismo negocio que `../route.ts` (`POST`), y misma
 * regla: marcar `isPrimary` desmarca cualquier otra fila del negocio.
 *
 * `deal_properties` no tiene `deleted_at` — es una tabla de unión, no una
 * entidad con historial propio (§9 aplica a entidades, no a filas N:M); quitar
 * un interés es un `DELETE` real (`quitarPropiedad`).
 */

import { z } from "zod";
import { marcarPropiedadPrincipal, quitarPropiedad } from "@/application/pipeline/casos-de-uso";
import { requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { pipelineParaEscritura } from "@/infrastructure/contenedor/pipeline";
import { errorResponse, idsDeRuta, parseInput } from "@/infrastructure/http";

const MarcarPrincipalInput = z.object({ isPrimary: z.literal(true) });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; propId: string }> }) {
  try {
    const { id: idParam, propId: propIdParam } = await params;
    const [dealId, propId] = idsDeRuta(idParam, propIdParam);

    parseInput(MarcarPrincipalInput, await request.json().catch(() => ({})));
    const actor = await requireActor();
    const scope = requireScope(actor, "deals", "edit");

    const propiedad = await marcarPropiedadPrincipal(pipelineParaEscritura(), actor, scope, dealId, propId);

    return Response.json({ ok: true, propiedad });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string; propId: string }> }) {
  try {
    const { id: idParam, propId: propIdParam } = await params;
    const [dealId, propId] = idsDeRuta(idParam, propIdParam);

    const actor = await requireActor();
    const scope = requireScope(actor, "deals", "edit");

    await quitarPropiedad(pipelineParaEscritura(), actor, scope, dealId, propId);

    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
