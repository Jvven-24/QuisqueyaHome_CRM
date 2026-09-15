/**
 * M5 · Propiedades — alta de proyecto (`docs/F2_ANALISIS_Y_PLAN.md` paso 1).
 *
 * Mismo patrón que `api/contactos/route.ts`: `parseInput` → `requireActor` +
 * `requireScope` → `transaction` con `auditar` dentro → `errorResponse`.
 *
 * `brokerId` se acepta aquí (a diferencia de `units`, que lo deja para M7):
 * es la columna que `visibleRows` ya usa para R6 ("el broker solo ve sus
 * proyectos"), y no tiene sentido esperar a la pantalla de asignación de M7
 * para poder probar esa regla.
 */

import { and, isNull, like, or } from "drizzle-orm";
import { z } from "zod";
import { OPERATION_TYPES, PROJECT_TYPES } from "@/domain/catalogs";
import { slugify } from "@/domain/slug";
import { can, requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { auditar } from "@/infrastructure/audit";
import { transaction } from "@/infrastructure/db/client";
import { projects } from "@/infrastructure/db/schema";
import { errorResponse, parseInput } from "@/infrastructure/http";

const CrearProyectoInput = z.object({
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

/** Igual que en `api/contactos/route.ts`: "" desde un formulario vacío no es un valor. */
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
    const datos = parseInput(CrearProyectoInput, limpiarVacios(await request.json().catch(() => ({}))));
    const actor = await requireActor();
    requireScope(actor, "projects", "create");

    // Precio real, restringido por campo (decisión #26 / hallazgo P1): quien
    // puede crear un proyecto no necesariamente puede fijar su precio
    // interno — el formulario siempre lo renderiza (no sabe distinguir), así
    // que aquí se descarta en silencio en vez de rechazar el alta entera.
    if (!can(actor, "unit_real_price", "edit")) delete datos.internalPriceCents;

    const resultado = await transaction(async (tx) => {
      // Slug único entre los no borrados (el índice es parcial, `WHERE
      // deleted_at IS NULL`): un proyecto eliminado no reserva su slug para
      // siempre. Se comprueba dentro de la transacción para no dejar una
      // ventana entre "contar" e "insertar" — a esta frecuencia de altas
      // (un administrador, de vez en cuando) no hace falta más que eso.
      const base = slugify(datos.name) || "proyecto";
      const existentes = await tx
        .select({ slug: projects.slug })
        .from(projects)
        .where(and(isNull(projects.deletedAt), or(like(projects.slug, base), like(projects.slug, `${base}-%`))));
      const slug = existentes.length === 0 ? base : `${base}-${existentes.length + 1}`;

      const [proyecto] = await tx
        .insert(projects)
        .values({
          name: datos.name,
          slug,
          zone: datos.zone ?? null,
          projectType: datos.projectType,
          operationType: datos.operationType,
          developer: datos.developer ?? null,
          description: datos.description ?? null,
          startDate: datos.startDate ?? null,
          estimatedDeliveryDate: datos.estimatedDeliveryDate ?? null,
          currency: datos.currency,
          internalPriceCents: datos.internalPriceCents ?? null,
          publicRangeMinCents: datos.publicRangeMinCents ?? null,
          publicRangeMaxCents: datos.publicRangeMaxCents ?? null,
          progressPercent: datos.progressPercent ?? 0,
          brokerId: datos.brokerId ?? null,
          createdBy: actor.userId,
          updatedBy: actor.userId,
        })
        .returning();

      await auditar(tx, actor, {
        accion: "crear",
        entidad: "project",
        entidadId: proyecto!.id,
        despues: proyecto,
      });

      return proyecto!;
    });

    return Response.json({ ok: true, proyecto: resultado });
  } catch (error) {
    return errorResponse(error);
  }
}
