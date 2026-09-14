/**
 * M5 · Propiedades — alta de unidad (`docs/F2_ANALISIS_Y_PLAN.md` paso 1).
 *
 * Nace bajo su proyecto (`/api/proyectos/[id]/unidades`): una unidad no existe
 * sin proyecto, y así el `id` de la URL ya resuelve a qué `projects` pertenece
 * sin repetirlo en el body.
 *
 * `brokerId` no se acepta aquí a propósito — el responsable de una unidad se
 * asigna desde M7 (`docs/F2_ANALISIS_Y_PLAN.md` §4.2, "asignación masiva de
 * propiedades a brokers"), no desde el alta.
 */

import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { NotFoundError } from "@/domain/errors";
import { requireScope } from "@/domain/rbac";
import { OPERATION_TYPES, PRICE_PERIODS, UNIT_STATUSES } from "@/domain/catalogs";
import { requireActor } from "@/infrastructure/auth/actor";
import { auditar } from "@/infrastructure/audit";
import { getDb, transaction } from "@/infrastructure/db/client";
import { projects, units } from "@/infrastructure/db/schema";
import { errorResponse, parseInput } from "@/infrastructure/http";

const CrearUnidadInput = z.object({
  code: z.string({ error: "Escribe el código de la unidad." }).min(1, "Escribe el código de la unidad."),
  unitType: z.string().optional(),
  bedrooms: z.coerce.number().int().nonnegative().optional(),
  bathrooms: z.coerce.number().nonnegative().optional(),
  builtAreaM2: z.coerce.number().nonnegative().optional(),
  operationType: z.enum(OPERATION_TYPES).optional(),
  pricePeriod: z.enum(PRICE_PERIODS).optional(),
  realPriceCents: z.coerce.number().int().nonnegative().optional(),
  publicRangeMinCents: z.coerce.number().int().nonnegative().optional(),
  publicRangeMaxCents: z.coerce.number().int().nonnegative().optional(),
  status: z.enum(UNIT_STATUSES).optional(),
});

function limpiarVacios(cuerpo: unknown): unknown {
  if (typeof cuerpo !== "object" || cuerpo === null) return cuerpo;
  const copia: Record<string, unknown> = { ...(cuerpo as Record<string, unknown>) };
  for (const campo of ["unitType", "bedrooms", "bathrooms", "builtAreaM2", "operationType", "pricePeriod", "realPriceCents", "publicRangeMinCents", "publicRangeMaxCents", "status"]) {
    if (copia[campo] === "") delete copia[campo];
  }
  return copia;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params;
    const projectId = Number(idParam);
    if (!Number.isInteger(projectId) || projectId <= 0) throw new NotFoundError();

    const datos = parseInput(CrearUnidadInput, limpiarVacios(await request.json().catch(() => ({}))));
    const actor = await requireActor();
    requireScope(actor, "units", "create");

    // El proyecto padre existe y no está borrado — no hace falta comprobar
    // aquí el alcance del actor sobre `projects`: ya lo hizo `page-guard` al
    // entrar al detalle, y `units` no lleva su propio filtro de fila (§4.2).
    const [proyecto] = await getDb()
      .select({ id: projects.id })
      .from(projects)
      .where(and(eq(projects.id, projectId), isNull(projects.deletedAt)))
      .limit(1);
    if (!proyecto) throw new NotFoundError("El proyecto indicado no existe.");

    const resultado = await transaction(async (tx) => {
      const [unidad] = await tx
        .insert(units)
        .values({
          projectId,
          code: datos.code,
          unitType: datos.unitType ?? null,
          bedrooms: datos.bedrooms ?? null,
          bathrooms: datos.bathrooms ?? null,
          builtAreaM2: datos.builtAreaM2 ?? null,
          operationType: datos.operationType,
          pricePeriod: datos.pricePeriod,
          realPriceCents: datos.realPriceCents ?? null,
          publicRangeMinCents: datos.publicRangeMinCents ?? null,
          publicRangeMaxCents: datos.publicRangeMaxCents ?? null,
          status: datos.status,
          createdBy: actor.userId,
          updatedBy: actor.userId,
        })
        .returning();

      await auditar(tx, actor, { accion: "crear", entidad: "unit", entidadId: unidad!.id, despues: unidad });

      return unidad!;
    });

    return Response.json({ ok: true, unidad: resultado });
  } catch (error) {
    return errorResponse(error);
  }
}
