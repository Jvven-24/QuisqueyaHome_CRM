/**
 * M11 · Comunicaciones — API de actualización de una plantilla de mensajería.
 */

import { z } from "zod";
import { actualizarPlantillaMensaje } from "@/application/comunicaciones/casos-de-uso";
import { requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { comunicacionesRepositorio } from "@/infrastructure/contenedor/comunicaciones";
import { errorResponse, parseInput } from "@/infrastructure/http";

const ActualizarPlantillaInput = z.object({
  name: z.string().min(1).optional(),
  category: z.string().optional().nullable(),
  channel: z.enum(["telegram", "whatsapp", "email", "sms", "webhook"]).optional(),
  body: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireActor();
    requireScope(actor, "communications", "edit");

    const params = await props.params;
    const plantillaId = Number(params.id);
    if (!Number.isInteger(plantillaId) || plantillaId <= 0) {
      return Response.json({ error: "ID de plantilla inválido." }, { status: 400 });
    }

    const cuerpo = await request.json().catch(() => ({}));
    const datos = parseInput(ActualizarPlantillaInput, cuerpo);

    const plantilla = await comunicacionesRepositorio().ejecutar(async (repo) => {
      return actualizarPlantillaMensaje(repo, plantillaId, datos);
    });

    return Response.json({ ok: true, plantilla });
  } catch (error) {
    return errorResponse(error);
  }
}
