/**
 * R3.4: edición y borrado de proyecto, con alcance aplicado en el caso de uso.
 * Referencias: `src/application/README.md` §4 y `docs/R_ANALISIS_Y_PLAN.md` §7.
 * La ruta conserva los mensajes, respuestas y el filtrado de precio original.
 */
import { z } from "zod";
import { OPERATION_TYPES, PROJECT_TYPES } from "@/domain/catalogs";
import { can, requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { proyectosParaEscritura } from "@/infrastructure/contenedor/proyectos";
import { errorResponse, idsDeRuta, parseInput, vaciosANull } from "@/infrastructure/http";
import { borrarProyecto, editarProyecto } from "@/application/proyectos/casos-de-uso";

const Entrada = z.object({
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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const [id] = idsDeRuta((await params).id);
    const datos = parseInput(
      Entrada,
      vaciosANull(
        await request.json().catch(() => ({})),
        [
          "zone", "developer", "description", "startDate",
          "estimatedDeliveryDate", "internalPriceCents",
          "publicRangeMinCents", "publicRangeMaxCents", "brokerId",
        ],
      ),
    );
    const actor = await requireActor();
    const alcance = requireScope(actor, "projects", "edit");
    if (!can(actor, "unit_real_price", "edit")) delete datos.internalPriceCents;
    const cambios: import("@/application/proyectos/puertos").CambiosProyecto = {};
    if ("name" in datos) cambios.name = datos.name;
    if ("zone" in datos) cambios.zone = datos.zone;
    if ("projectType" in datos) cambios.projectType = datos.projectType;
    if ("operationType" in datos) cambios.operationType = datos.operationType;
    if ("developer" in datos) cambios.developer = datos.developer;
    if ("description" in datos) cambios.description = datos.description;
    if ("startDate" in datos) cambios.startDate = datos.startDate;
    if ("estimatedDeliveryDate" in datos) cambios.estimatedDeliveryDate = datos.estimatedDeliveryDate;
    if ("internalPriceCents" in datos) cambios.internalPriceCents = datos.internalPriceCents;
    if ("publicRangeMinCents" in datos) cambios.publicRangeMinCents = datos.publicRangeMinCents;
    if ("publicRangeMaxCents" in datos) cambios.publicRangeMaxCents = datos.publicRangeMaxCents;
    if ("progressPercent" in datos) cambios.progressPercent = datos.progressPercent;
    if ("brokerId" in datos) cambios.brokerId = datos.brokerId;
    if ("isPublished" in datos) cambios.isPublished = datos.isPublished;
    if ("isActive" in datos) cambios.isActive = datos.isActive;
    const proyecto = await editarProyecto(
      proyectosParaEscritura(),
      actor,
      alcance,
      id,
      cambios,
    );
    return Response.json({ ok: true, proyecto });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const [id] = idsDeRuta((await params).id);
    const actor = await requireActor();
    const alcance = requireScope(actor, "projects", "delete");
    await borrarProyecto(proyectosParaEscritura(), actor, alcance, id);
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}

