/**
 * M3 · Negocios — asociar unidad o proyecto de interés (deuda de F1, issue
 * #21). Sin esto, un negocio no podía cumplir por su cuenta el requisito de
 * §10.1 para → Preselección («al menos una fila en `deal_properties`»).
 *
 * `unitId` es opcional (el esquema permite interés a nivel de proyecto sin
 * unidad, decisión #4); marcar `isPrimary` en la misma llamada desmarca
 * cualquier otra fila del negocio que ya lo fuera — un negocio tiene como
 * mucho una unidad principal, nunca dos.
 */

import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { NotFoundError } from "@/domain/errors";
import { requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { auditar } from "@/infrastructure/audit";
import { transaction } from "@/infrastructure/db/client";
import { dealProperties } from "@/infrastructure/db/schema";
import { errorResponse, parseInput } from "@/infrastructure/http";
import { negocioAbiertoVisible } from "../_negocio-abierto";

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

    const propiedad = await transaction(async (tx) => {
      await negocioAbiertoVisible(tx, dealId, actor, scope);

      if (datos.isPrimary) {
        await tx.update(dealProperties).set({ isPrimary: false }).where(and(eq(dealProperties.dealId, dealId), eq(dealProperties.isPrimary, true)));
      }

      const [fila] = await tx
        .insert(dealProperties)
        .values({
          dealId,
          projectId: datos.projectId,
          unitId: datos.unitId ?? null,
          isPrimary: datos.isPrimary ?? false,
          createdBy: actor.userId,
        })
        .returning();

      await auditar(tx, actor, { accion: "crear", entidad: "deal_property", entidadId: fila!.id, despues: fila });

      return fila!;
    });

    return Response.json({ ok: true, propiedad });
  } catch (error) {
    return errorResponse(error);
  }
}
