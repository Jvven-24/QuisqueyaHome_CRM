/**
 * M10 · Academy — actualizar estado de un paso de checklist operativo.
 */

import { z } from "zod";
import { marcarPasoChecklist } from "@/application/academy/casos-de-uso";
import { can, requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { academyRepositorio } from "@/infrastructure/contenedor/academy";
import { errorResponse, parseInput } from "@/infrastructure/http";

const ChecklistInput = z.object({
  isCompleted: z.boolean(),
});

export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireActor();
    requireScope(actor, "academy", "view");

    const params = await props.params;
    const checklistItemId = Number(params.id);
    if (!Number.isInteger(checklistItemId) || checklistItemId <= 0) {
      return Response.json({ error: "ID de checklist inválido." }, { status: 400 });
    }

    const cuerpo = await request.json().catch(() => ({}));
    const datos = parseInput(ChecklistInput, cuerpo);
    // Anti-autocertificación (auditoría 27/10/2026): solo quien edita Academy
    // (tutor o administrador) puede dar un contenido o paso por completado.
    if ((datos.isCompleted) && !can(actor, "academy", "edit")) {
      return Response.json({ error: "Un tutor o administrador debe validar la finalización. Pídele que marque este paso." }, { status: 403 });
    }

    const resultado = await academyRepositorio().ejecutar(async (repo) => {
      return marcarPasoChecklist(
        repo,
        actor.userId,
        checklistItemId,
        datos.isCompleted,
      );
    });

    return Response.json({ ok: true, isCompleted: resultado });
  } catch (error) {
    return errorResponse(error);
  }
}

export const PATCH = PUT;

