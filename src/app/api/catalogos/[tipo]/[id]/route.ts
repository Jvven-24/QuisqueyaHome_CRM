/**
 * M13 · Catálogos — edición (`docs/F2_ANALISIS_Y_PLAN.md` paso 5). `slug` no
 * se edita: es la identidad estable que usa el código (mismo criterio que
 * las etapas del pipeline, decisión #29) — solo el nombre, el orden y si
 * está activo.
 */

import { eq } from "drizzle-orm";
import { z } from "zod";
import { NotFoundError } from "@/domain/errors";
import { requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { auditar } from "@/infrastructure/audit";
import { transaction } from "@/infrastructure/db/client";
import { errorResponse, parseInput } from "@/infrastructure/http";
import { resolverCatalogo } from "../_tablas";

const EditarEntradaInput = z.object({
  name: z.string().min(1, "Escribe el nombre.").optional(),
  position: z.coerce.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ tipo: string; id: string }> }) {
  try {
    const { tipo, id: idParam } = await params;
    const catalogo = resolverCatalogo(tipo);
    const id = Number(idParam);
    if (!catalogo || !Number.isInteger(id) || id <= 0) throw new NotFoundError();

    const datos = parseInput(EditarEntradaInput, await request.json().catch(() => ({})));
    const actor = await requireActor();
    requireScope(actor, "settings", "edit");

    const entrada = await transaction(async (tx) => {
      const [anterior] = await tx.select().from(catalogo.tabla).where(eq(catalogo.tabla.id, id)).limit(1);
      if (!anterior) throw new NotFoundError();

      const cambios: { name?: string; position?: number; isActive?: boolean } = {};
      if (datos.name !== undefined) cambios.name = datos.name;
      if (datos.position !== undefined) cambios.position = datos.position;
      if (datos.isActive !== undefined) cambios.isActive = datos.isActive;

      const [fila] = await tx.update(catalogo.tabla).set(cambios).where(eq(catalogo.tabla.id, id)).returning();

      await auditar(tx, actor, { accion: "editar", entidad: catalogo.entidad, entidadId: id, antes: anterior, despues: fila });

      return fila;
    });

    return Response.json({ ok: true, entrada });
  } catch (error) {
    return errorResponse(error);
  }
}
