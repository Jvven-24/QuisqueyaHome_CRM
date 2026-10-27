/**
 * M3 · Negocios — asociar unidad o proyecto de interés (deuda de F1, issue
 * #21). Sin esto, un negocio no podía cumplir por su cuenta el requisito de
 * §10.1 para → Preselección («al menos una fila en `deal_properties`»).
 *
 * Las verificaciones (negocio abierto y visible, proyecto dentro del alcance
 * sobre `projects`, unidad del proyecto) y la regla de la unidad principal viven
 * en `asociarPropiedad` (`application/pipeline/casos-de-uso.ts`).
 *
 * Aquí se piden los dos permisos: `deals:edit` autoriza a tocar el negocio, y
 * `projects:view` fija el alcance con el que se puede usar un proyecto. Son dos
 * permisos distintos; `requireScope` y no `scopeFor` porque sin ningún alcance
 * sobre proyectos no hay nada legítimo que asociar.
 */

import { z } from "zod";
import { asociarPropiedad, type EntradaAsociarPropiedad } from "@/application/pipeline/casos-de-uso";
import { NotFoundError } from "@/domain/errors";
import { requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { pipelineParaEscritura } from "@/infrastructure/contenedor/pipeline";
import { errorResponse, parseInput } from "@/infrastructure/http";

const AsociarPropiedadInput = z.object({
  projectId: z.coerce.number().int().positive(),
  unitId: z.coerce.number().int().positive().optional(),
  isPrimary: z.coerce.boolean().optional(),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params;
    const dealId = Number(idParam);
    if (!Number.isInteger(dealId) || dealId <= 0) throw new NotFoundError();

    const datos = parseInput(AsociarPropiedadInput, await request.json().catch(() => ({})));
    const actor = await requireActor();
    const scope = requireScope(actor, "deals", "edit");
    // Alcance sobre `projects`, no sobre `deals`: son dos permisos distintos
    // (ver comentario de arriba).
    const projectScope = requireScope(actor, "projects", "view");

    const entrada: EntradaAsociarPropiedad = { projectId: datos.projectId };
    if (datos.unitId !== undefined) entrada.unitId = datos.unitId;
    if (datos.isPrimary !== undefined) entrada.isPrimary = datos.isPrimary;

    const propiedad = await asociarPropiedad(pipelineParaEscritura(), actor, scope, projectScope, dealId, entrada);

    return Response.json({ ok: true, propiedad });
  } catch (error) {
    return errorResponse(error);
  }
}
