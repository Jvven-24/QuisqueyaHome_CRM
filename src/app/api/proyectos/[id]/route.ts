/**
 * M5 · Propiedades — edición y borrado lógico de proyecto
 * (`docs/F2_ANALISIS_Y_PLAN.md` paso 1).
 *
 * Mismo patrón que `api/contactos/[id]/route.ts`: se relee dentro de la
 * transacción con `visibleRows` aplicado, así que un id fuera del alcance del
 * actor responde igual que uno inexistente.
 */

import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { NotFoundError } from "@/domain/errors";
import { can, requireScope } from "@/domain/rbac";
import { OPERATION_TYPES, PROJECT_TYPES } from "@/domain/catalogs";
import { requireActor } from "@/infrastructure/auth/actor";
import { auditar } from "@/infrastructure/audit";
import { transaction, type Db } from "@/infrastructure/db/client";
import { projects } from "@/infrastructure/db/schema";
import { errorResponse, parseInput, vaciosANull } from "@/infrastructure/http";
import { visibleRows } from "@/infrastructure/rbac-filter";

const EditarProyectoInput = z.object({
  name: z.string().min(1, "Escribe el nombre del proyecto.").optional(),
  zone: z.string().nullable().optional(),
  projectType: z.enum(PROJECT_TYPES).optional(),
  operationType: z.enum(OPERATION_TYPES).optional(),
  developer: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
  estimatedDeliveryDate: z.string().nullable().optional(),
  internalPriceCents: z.union([z.coerce.number().int().nonnegative(), z.null()]).optional(),
  publicRangeMinCents: z.union([z.coerce.number().int().nonnegative(), z.null()]).optional(),
  publicRangeMaxCents: z.union([z.coerce.number().int().nonnegative(), z.null()]).optional(),
  progressPercent: z.coerce.number().int().min(0).max(100).optional(),
  brokerId: z.union([z.coerce.number().int().positive(), z.null()]).optional(),
  isPublished: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

async function proyectoVisible(tx: Tx, id: number, actor: Awaited<ReturnType<typeof requireActor>>, scope: Parameters<typeof visibleRows>[1]) {
  const [fila] = await tx
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), visibleRows(actor, scope, projects.brokerId, projects.deletedAt)))
    .limit(1);
  return fila;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params;
    const id = Number(idParam);
    if (!Number.isInteger(id) || id <= 0) throw new NotFoundError();

    const datos = parseInput(
      EditarProyectoInput,
      vaciosANull(await request.json().catch(() => ({})), [
        "zone",
        "developer",
        "description",
        "startDate",
        "estimatedDeliveryDate",
        "internalPriceCents",
        "publicRangeMinCents",
        "publicRangeMaxCents",
        "brokerId",
      ]),
    );
    const actor = await requireActor();
    const scope = requireScope(actor, "projects", "edit");

    // Precio real, restringido por campo (decisión #26 / hallazgo P1): un
    // actor con `projects:edit` pero sin `unit_real_price:edit` no debe poder
    // fijarlo ni borrarlo — el formulario siempre lo envía, así que se
    // descarta en silencio en vez de rechazar el resto de la edición.
    if (!can(actor, "unit_real_price", "edit")) delete datos.internalPriceCents;

    const proyecto = await transaction(async (tx) => {
      const anterior = await proyectoVisible(tx, id, actor, scope);
      if (!anterior) throw new NotFoundError();

      const cambios: Partial<typeof projects.$inferInsert> = { updatedBy: actor.userId };
      if (datos.name !== undefined) cambios.name = datos.name;
      if ("zone" in datos) cambios.zone = datos.zone;
      if (datos.projectType !== undefined) cambios.projectType = datos.projectType;
      if (datos.operationType !== undefined) cambios.operationType = datos.operationType;
      if ("developer" in datos) cambios.developer = datos.developer;
      if ("description" in datos) cambios.description = datos.description;
      if ("startDate" in datos) cambios.startDate = datos.startDate;
      if ("estimatedDeliveryDate" in datos) cambios.estimatedDeliveryDate = datos.estimatedDeliveryDate;
      if ("internalPriceCents" in datos) cambios.internalPriceCents = datos.internalPriceCents;
      if ("publicRangeMinCents" in datos) cambios.publicRangeMinCents = datos.publicRangeMinCents;
      if ("publicRangeMaxCents" in datos) cambios.publicRangeMaxCents = datos.publicRangeMaxCents;
      if (datos.progressPercent !== undefined) cambios.progressPercent = datos.progressPercent;
      if ("brokerId" in datos) cambios.brokerId = datos.brokerId;
      if (datos.isPublished !== undefined) cambios.isPublished = datos.isPublished;
      if (datos.isActive !== undefined) cambios.isActive = datos.isActive;

      const [fila] = await tx.update(projects).set(cambios).where(eq(projects.id, id)).returning();

      await auditar(tx, actor, { accion: "editar", entidad: "project", entidadId: id, antes: anterior, despues: fila });

      return fila;
    });

    return Response.json({ ok: true, proyecto });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params;
    const id = Number(idParam);
    if (!Number.isInteger(id) || id <= 0) throw new NotFoundError();

    const actor = await requireActor();
    const scope = requireScope(actor, "projects", "delete");

    await transaction(async (tx) => {
      const anterior = await proyectoVisible(tx, id, actor, scope);
      if (!anterior) throw new NotFoundError();

      // Borrado lógico: nunca `DELETE` real (§9). `visibleRows` ya excluye
      // `deleted_at` no nulo de cualquier lectura futura.
      const [fila] = await tx
        .update(projects)
        .set({ deletedAt: new Date(), updatedBy: actor.userId })
        .where(eq(projects.id, id))
        .returning();

      await auditar(tx, actor, { accion: "eliminar", entidad: "project", entidadId: id, antes: anterior, despues: fila });
    });

    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
