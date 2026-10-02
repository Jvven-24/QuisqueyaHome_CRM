/**
 * M13 · Catálogos — edición (`docs/F2_ANALISIS_Y_PLAN.md` paso 5). `slug` no
 * se edita: es la identidad estable que usa el código (mismo criterio que
 * las etapas del pipeline, decisión #29) — solo el nombre, el orden y si
 * está activo.
 */

import { z } from "zod";
import { editarEntradaCatalogo, esTipoCatalogo } from "@/application/catalogos/casos-de-uso";
import type { CambiosEntradaCatalogo } from "@/application/catalogos/puertos";
import { NotFoundError } from "@/domain/errors";
import { requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { catalogosParaEscritura } from "@/infrastructure/contenedor/catalogos";
import { errorResponse, parseInput } from "@/infrastructure/http";

const EditarEntradaInput = z.object({
  name: z.string().min(1, "Escribe el nombre.").optional(),
  position: z.coerce.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ tipo: string; id: string }> }) {
  try {
    const { tipo, id: idParam } = await params;
    const id = Number(idParam);
    if (!esTipoCatalogo(tipo) || !Number.isInteger(id) || id <= 0) throw new NotFoundError();

    const datos = parseInput(EditarEntradaInput, await request.json().catch(() => ({})));
    const actor = await requireActor();
    requireScope(actor, "settings", "edit");

    const cambios: CambiosEntradaCatalogo = {};
    if (datos.name !== undefined) cambios.name = datos.name;
    if (datos.position !== undefined) cambios.position = datos.position;
    if (datos.isActive !== undefined) cambios.isActive = datos.isActive;

    const entrada = await editarEntradaCatalogo(catalogosParaEscritura(), actor, tipo, id, cambios);

    return Response.json({ ok: true, entrada });
  } catch (error) {
    return errorResponse(error);
  }
}
