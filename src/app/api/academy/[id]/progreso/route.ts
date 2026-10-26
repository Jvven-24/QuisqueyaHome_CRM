/**
 * M10 · Academy — actualizar progreso de un contenido.
 */

import { z } from "zod";
import { completarContenidoAcademy } from "@/application/academy/casos-de-uso";
import { requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { academyRepositorio } from "@/infrastructure/contenedor/academy";
import { errorResponse, parseInput } from "@/infrastructure/http";

const ProgresoInput = z.object({
  progressPercent: z.coerce.number().int().min(0).max(100).optional().default(100),
  isCompleted: z.boolean().optional().default(true),
});

export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireActor();
    requireScope(actor, "academy", "view");

    const params = await props.params;
    const itemId = Number(params.id);
    if (!Number.isInteger(itemId) || itemId <= 0) {
      return Response.json({ error: "ID de contenido inválido." }, { status: 400 });
    }

    const cuerpo = await request.json().catch(() => ({}));
    const datos = parseInput(ProgresoInput, cuerpo);

    const resultado = await academyRepositorio().ejecutar(async (repo) => {
      return completarContenidoAcademy(
        repo,
        actor.userId,
        itemId,
        datos.progressPercent,
        datos.isCompleted,
      );
    });

    return Response.json({ ok: true, progreso: resultado });
  } catch (error) {
    return errorResponse(error);
  }
}
