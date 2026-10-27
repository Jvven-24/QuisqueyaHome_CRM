/**
 * R3.4: alta de unidad; el caso de uso valida el proyecto y su alcance.
 * El precio real se conserva restringido por el permiso original de la API.
 */
import { z } from "zod";
import { OPERATION_TYPES, PRICE_PERIODS, UNIT_STATUSES } from "@/domain/catalogs";
import { can, requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { proyectosParaEscritura } from "@/infrastructure/contenedor/proyectos";
import { errorResponse, idsDeRuta, parseInput } from "@/infrastructure/http";
import { crearUnidad } from "@/application/proyectos/casos-de-uso";

const Entrada = z.object({
  code: z.string({ error: "Escribe el código de la unidad." })
    .min(1, "Escribe el código de la unidad."),
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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const [projectId] = idsDeRuta((await params).id);
    const datos = parseInput(Entrada, await request.json().catch(() => ({})));
    const actor = await requireActor();
    const alcance = requireScope(actor, "units", "create");
    if (!can(actor, "unit_real_price", "edit")) delete datos.realPriceCents;
    const unidad = await crearUnidad(proyectosParaEscritura(), actor, alcance, {
      projectId,
      code: datos.code,
      unitType: datos.unitType ?? null,
      bedrooms: datos.bedrooms ?? null,
      bathrooms: datos.bathrooms ?? null,
      builtAreaM2: datos.builtAreaM2 ?? null,
      operationType: datos.operationType ?? "sale",
      pricePeriod: datos.pricePeriod ?? "one_time",
      realPriceCents: datos.realPriceCents ?? null,
      publicRangeMinCents: datos.publicRangeMinCents ?? null,
      publicRangeMaxCents: datos.publicRangeMaxCents ?? null,
      status: datos.status ?? "available",
      createdBy: actor.userId,
      updatedBy: actor.userId,
    });
    return Response.json({ ok: true, unidad });
  } catch (error) {
    return errorResponse(error);
  }
}

