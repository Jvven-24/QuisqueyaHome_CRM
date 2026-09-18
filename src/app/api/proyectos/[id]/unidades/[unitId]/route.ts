/**
 * M5 · Propiedades — edición y borrado lógico de unidad
 * (`docs/F2_ANALISIS_Y_PLAN.md` paso 1). Mismo patrón que
 * `api/proyectos/[id]/route.ts`.
 */

import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { NotFoundError } from "@/domain/errors";
import { can, requireScope } from "@/domain/rbac";
import { OPERATION_TYPES, PRICE_PERIODS, UNIT_STATUSES } from "@/domain/catalogs";
import { requireActor } from "@/infrastructure/auth/actor";
import { auditar } from "@/infrastructure/audit";
import { transaction, type Db } from "@/infrastructure/db/client";
import { units } from "@/infrastructure/db/schema";
import { errorResponse, idsDeRuta, parseInput, vaciosANull } from "@/infrastructure/http";

const EditarUnidadInput = z.object({
  code: z.string().min(1, "Escribe el código de la unidad.").optional(),
  unitType: z.string().nullable().optional(),
  bedrooms: z.union([z.coerce.number().int().nonnegative(), z.null()]).optional(),
  bathrooms: z.union([z.coerce.number().nonnegative(), z.null()]).optional(),
  builtAreaM2: z.union([z.coerce.number().nonnegative(), z.null()]).optional(),
  operationType: z.enum(OPERATION_TYPES).optional(),
  pricePeriod: z.enum(PRICE_PERIODS).optional(),
  realPriceCents: z.union([z.coerce.number().int().nonnegative(), z.null()]).optional(),
  publicRangeMinCents: z.union([z.coerce.number().int().nonnegative(), z.null()]).optional(),
  publicRangeMaxCents: z.union([z.coerce.number().int().nonnegative(), z.null()]).optional(),
  status: z.enum(UNIT_STATUSES).optional(),
});

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

async function unidadVisible(tx: Tx, projectId: number, unitId: number) {
  const [fila] = await tx
    .select()
    .from(units)
    .where(and(eq(units.id, unitId), eq(units.projectId, projectId), isNull(units.deletedAt)))
    .limit(1);
  return fila;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; unitId: string }> }) {
  try {
    const { id: idParam, unitId: unitIdParam } = await params;
    const [projectId, unitId] = idsDeRuta(idParam, unitIdParam);

    const datos = parseInput(
      EditarUnidadInput,
      vaciosANull(await request.json().catch(() => ({})), [
        "unitType",
        "bedrooms",
        "bathrooms",
        "builtAreaM2",
        "realPriceCents",
        "publicRangeMinCents",
        "publicRangeMaxCents",
      ]),
    );
    const actor = await requireActor();
    requireScope(actor, "units", "edit");

    // Precio real, restringido por campo (decisión #26 / hallazgo P1): ver
    // el mismo comentario en `api/proyectos/[id]/route.ts`.
    if (!can(actor, "unit_real_price", "edit")) delete datos.realPriceCents;

    const unidad = await transaction(async (tx) => {
      const anterior = await unidadVisible(tx, projectId, unitId);
      if (!anterior) throw new NotFoundError();

      const cambios: Partial<typeof units.$inferInsert> = { updatedBy: actor.userId };
      if (datos.code !== undefined) cambios.code = datos.code;
      if ("unitType" in datos) cambios.unitType = datos.unitType;
      if ("bedrooms" in datos) cambios.bedrooms = datos.bedrooms;
      if ("bathrooms" in datos) cambios.bathrooms = datos.bathrooms;
      if ("builtAreaM2" in datos) cambios.builtAreaM2 = datos.builtAreaM2;
      if (datos.operationType !== undefined) cambios.operationType = datos.operationType;
      if (datos.pricePeriod !== undefined) cambios.pricePeriod = datos.pricePeriod;
      if ("realPriceCents" in datos) cambios.realPriceCents = datos.realPriceCents;
      if ("publicRangeMinCents" in datos) cambios.publicRangeMinCents = datos.publicRangeMinCents;
      if ("publicRangeMaxCents" in datos) cambios.publicRangeMaxCents = datos.publicRangeMaxCents;
      if (datos.status !== undefined) cambios.status = datos.status;

      const [fila] = await tx.update(units).set(cambios).where(eq(units.id, unitId)).returning();

      await auditar(tx, actor, { accion: "editar", entidad: "unit", entidadId: unitId, antes: anterior, despues: fila });

      return fila;
    });

    return Response.json({ ok: true, unidad });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string; unitId: string }> }) {
  try {
    const { id: idParam, unitId: unitIdParam } = await params;
    const [projectId, unitId] = idsDeRuta(idParam, unitIdParam);

    const actor = await requireActor();
    requireScope(actor, "units", "delete");

    await transaction(async (tx) => {
      const anterior = await unidadVisible(tx, projectId, unitId);
      if (!anterior) throw new NotFoundError();

      const [fila] = await tx
        .update(units)
        .set({ deletedAt: new Date(), updatedBy: actor.userId })
        .where(eq(units.id, unitId))
        .returning();

      await auditar(tx, actor, { accion: "eliminar", entidad: "unit", entidadId: unitId, antes: anterior, despues: fila });
    });

    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
