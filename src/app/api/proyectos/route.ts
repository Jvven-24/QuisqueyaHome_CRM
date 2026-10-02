/**
 * R3.4: entrada HTTP; validación, permiso y traducción, no SQL.
 * Referencias: `src/application/README.md` §4 y `docs/R_ANALISIS_Y_PLAN.md` §7.
 * El permiso se comprueba antes de tocar datos y la entrada se copia campo a
 * campo para que el cliente no elija columnas no autorizadas.
 */
import { z } from "zod";
import { OPERATION_TYPES, PROJECT_TYPES } from "@/domain/catalogs";
import { can, requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { proyectosParaEscritura } from "@/infrastructure/contenedor/proyectos";
import { errorResponse, parseInput } from "@/infrastructure/http";
import { crearProyecto } from "@/application/proyectos/casos-de-uso";

const Entrada = z.object({
  name: z.string({ error: "Escribe el nombre del proyecto." }).min(1, "Escribe el nombre del proyecto."),
  zone: z.string().optional(),
  projectType: z.enum(PROJECT_TYPES).optional(),
  operationType: z.enum(OPERATION_TYPES).optional(),
  developer: z.string().optional(),
  description: z.string().optional(),
  startDate: z.string().optional(),
  estimatedDeliveryDate: z.string().optional(),
  currency: z.string().optional(),
  internalPriceCents: z.coerce.number().int().nonnegative().optional(),
  publicRangeMinCents: z.coerce.number().int().nonnegative().optional(),
  publicRangeMaxCents: z.coerce.number().int().nonnegative().optional(),
  progressPercent: z.coerce.number().int().min(0).max(100).optional(),
  brokerId: z.coerce.number().int().positive().optional(),
});
function limpiarVacios(cuerpo: unknown): unknown {
  if (typeof cuerpo !== "object" || cuerpo === null) return cuerpo;
  const copia: Record<string, unknown> = { ...(cuerpo as Record<string, unknown>) };
  for (const campo of [
    "zone", "projectType", "operationType", "developer", "description",
    "startDate", "estimatedDeliveryDate", "currency", "internalPriceCents",
    "publicRangeMinCents", "publicRangeMaxCents", "progressPercent", "brokerId",
  ]) {
    if (copia[campo] === "") delete copia[campo];
  }
  return copia;
}

export async function POST(request: Request) {
  try {
    const datos = parseInput(Entrada, limpiarVacios(await request.json().catch(() => ({}))));
    const actor = await requireActor();
    requireScope(actor, "projects", "create");
    if (!can(actor, "unit_real_price", "edit")) delete datos.internalPriceCents;
    const base = datos.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "proyecto";
    const proyecto = await crearProyecto(proyectosParaEscritura(), actor, {
      name: datos.name,
      zone: datos.zone,
      projectType: datos.projectType,
      operationType: datos.operationType,
      developer: datos.developer,
      description: datos.description,
      startDate: datos.startDate,
      estimatedDeliveryDate: datos.estimatedDeliveryDate,
      currency: datos.currency,
      internalPriceCents: datos.internalPriceCents,
      publicRangeMinCents: datos.publicRangeMinCents,
      publicRangeMaxCents: datos.publicRangeMaxCents,
      progressPercent: datos.progressPercent,
      brokerId: datos.brokerId,
      slug: base,
      createdBy: actor.userId,
      updatedBy: actor.userId,
    });
    return Response.json({ ok: true, proyecto });
  } catch (error) {
    return errorResponse(error);
  }
}
