/**
 * M3 · Negocios — marcar unidad principal y quitar una propiedad de interés
 * (deuda de F1, issue #21). Mismo negocio que `../route.ts` (`POST`), y misma
 * regla: marcar `isPrimary` desmarca cualquier otra fila del negocio.
 *
 * `deal_properties` no tiene `deleted_at` — es una tabla de unión, no una
 * entidad con historial propio (§9 aplica a entidades, no a filas N:M); quitar
 * un interés es un `DELETE` real.
 */

import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { NotFoundError } from "@/domain/errors";
import { requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { auditar } from "@/infrastructure/audit";
import { transaction } from "@/infrastructure/db/client";
import { dealProperties } from "@/infrastructure/db/schema";
import { errorResponse, idsDeRuta, parseInput } from "@/infrastructure/http";
import { negocioAbiertoVisible } from "../../_negocio-abierto";

const MarcarPrincipalInput = z.object({ isPrimary: z.literal(true) });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; propId: string }> }) {
  try {
    const { id: idParam, propId: propIdParam } = await params;
    const [dealId, propId] = idsDeRuta(idParam, propIdParam);

    parseInput(MarcarPrincipalInput, await request.json().catch(() => ({})));
    const actor = await requireActor();
    const scope = requireScope(actor, "deals", "edit");

    const fila = await transaction(async (tx) => {
      await negocioAbiertoVisible(tx, dealId, actor, scope);

      const [anterior] = await tx.select().from(dealProperties).where(and(eq(dealProperties.id, propId), eq(dealProperties.dealId, dealId))).limit(1);
      if (!anterior) throw new NotFoundError();

      await tx.update(dealProperties).set({ isPrimary: false }).where(and(eq(dealProperties.dealId, dealId), eq(dealProperties.isPrimary, true)));
      const [actualizada] = await tx.update(dealProperties).set({ isPrimary: true }).where(eq(dealProperties.id, propId)).returning();

      await auditar(tx, actor, { accion: "editar", entidad: "deal_property", entidadId: propId, antes: anterior, despues: actualizada });

      return actualizada;
    });

    return Response.json({ ok: true, propiedad: fila });
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

    await transaction(async (tx) => {
      await negocioAbiertoVisible(tx, dealId, actor, scope);

      const [anterior] = await tx.select().from(dealProperties).where(and(eq(dealProperties.id, propId), eq(dealProperties.dealId, dealId))).limit(1);
      if (!anterior) throw new NotFoundError();

      await tx.delete(dealProperties).where(eq(dealProperties.id, propId));

      await auditar(tx, actor, { accion: "eliminar", entidad: "deal_property", entidadId: propId, antes: anterior });
    });

    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
