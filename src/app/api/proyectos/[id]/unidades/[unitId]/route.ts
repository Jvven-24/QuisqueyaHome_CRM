/**
 * R3.4: edición y borrado de unidad, con alcance del proyecto padre.
 * El precio real se conserva restringido por el permiso original de la API.
 */
import { z } from "zod";
import { OPERATION_TYPES, PRICE_PERIODS, UNIT_STATUSES } from "@/domain/catalogs";
import { can, requireScope, stripRestrictedPrices } from "@/domain/rbac";
import { ConflictError } from "@/domain/errors";
import { requireActor } from "@/infrastructure/auth/actor";
import { proyectosParaEscritura } from "@/infrastructure/contenedor/proyectos";
import { errorResponse, idsDeRuta, parseInput, vaciosANull } from "@/infrastructure/http";
import { borrarUnidad, editarUnidad } from "@/application/proyectos/casos-de-uso";

const Entrada = z.object({
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
  expectedVersion: z.coerce.number().int().positive().optional(),
});

const EntradaBorrado = z.object({
  expectedVersion: z.coerce.number().int().positive().optional(),
});

function entrada(zodDatos: z.infer<typeof Entrada>, actorId: number) {
  if ("status" in zodDatos) {
    throw new ConflictError("La disponibilidad requiere el flujo de compromisos de inventario.");
  }
  const cambios: import("@/application/proyectos/puertos").CambiosUnidad = {
    updatedBy: actorId,
  };
  if ("expectedVersion" in zodDatos) cambios.expectedVersion = zodDatos.expectedVersion;
  if ("code" in zodDatos) cambios.code = zodDatos.code;
  if ("unitType" in zodDatos) cambios.unitType = zodDatos.unitType;
  if ("bedrooms" in zodDatos) cambios.bedrooms = zodDatos.bedrooms;
  if ("bathrooms" in zodDatos) cambios.bathrooms = zodDatos.bathrooms;
  if ("builtAreaM2" in zodDatos) cambios.builtAreaM2 = zodDatos.builtAreaM2;
  if ("operationType" in zodDatos) cambios.operationType = zodDatos.operationType;
  if ("pricePeriod" in zodDatos) cambios.pricePeriod = zodDatos.pricePeriod;
  if ("realPriceCents" in zodDatos) cambios.realPriceCents = zodDatos.realPriceCents;
  if ("publicRangeMinCents" in zodDatos) cambios.publicRangeMinCents = zodDatos.publicRangeMinCents;
  if ("publicRangeMaxCents" in zodDatos) cambios.publicRangeMaxCents = zodDatos.publicRangeMaxCents;
  return cambios;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; unitId: string }> },
) {
  try {
    const [projectId, unitId] = idsDeRuta(
      (await params).id,
      (await params).unitId,
    );
    const datos = parseInput(
      Entrada,
      vaciosANull(
        await request.json().catch(() => ({})),
        [
          "unitType", "bedrooms", "bathrooms", "builtAreaM2",
          "realPriceCents", "publicRangeMinCents", "publicRangeMaxCents",
        ],
      ),
    );
    const actor = await requireActor();
    const alcance = requireScope(actor, "units", "edit");
    if (!can(actor, "unit_real_price", "edit")) delete datos.realPriceCents;
    const unidad = await editarUnidad(
      proyectosParaEscritura(),
      actor,
      alcance,
      projectId,
      unitId,
      entrada(datos, actor.userId),
    );
    return Response.json({ ok: true, unidad: stripRestrictedPrices(actor, unidad) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; unitId: string }> },
) {
  try {
    const [projectId, unitId] = idsDeRuta(
      (await params).id,
      (await params).unitId,
    );
    const actor = await requireActor();
    const alcance = requireScope(actor, "units", "delete");

    const url = new URL(request.url);
    const queryVersion = url.searchParams.get("expectedVersion") ?? url.searchParams.get("version");
    let versionRaw: unknown = queryVersion ?? undefined;
    if (versionRaw === undefined) {
      try {
        const body = await request.json();
        if (body && typeof body === "object" && "expectedVersion" in body) {
          versionRaw = body.expectedVersion;
        }
      } catch {
        // sin cuerpo JSON
      }
    }
    const { expectedVersion } = parseInput(
      EntradaBorrado,
      versionRaw !== undefined ? { expectedVersion: versionRaw } : {},
    );

    await borrarUnidad(
      proyectosParaEscritura(),
      actor,
      alcance,
      projectId,
      unitId,
      expectedVersion,
    );
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}

