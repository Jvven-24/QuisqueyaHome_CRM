/**
 * M11 · Comunicaciones — API de listado y creación de plantillas de mensajería.
 */

import { z } from "zod";
import {
  listarPlantillasMensajes,
  crearPlantillaMensaje,
} from "@/application/comunicaciones/casos-de-uso";
import { requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { comunicacionesRepositorio } from "@/infrastructure/contenedor/comunicaciones";
import { errorResponse, parseInput } from "@/infrastructure/http";

const CrearPlantillaInput = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio"),
  category: z.string().optional().nullable(),
  channel: z.enum(["telegram", "whatsapp", "email", "sms", "webhook"]),
  body: z.string().trim().min(1, "El cuerpo del mensaje es obligatorio"),
  isActive: z.boolean().optional().default(true),
});

export async function GET(request: Request) {
  try {
    const actor = await requireActor();
    requireScope(actor, "communications", "view");

    const url = new URL(request.url);
    const canal = url.searchParams.get("canal") || undefined;
    const categoria = url.searchParams.get("categoria") || undefined;

    const plantillas = await comunicacionesRepositorio().ejecutar(async (repo) => {
      return listarPlantillasMensajes(repo, canal, categoria);
    });

    return Response.json({ ok: true, plantillas });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireActor();
    requireScope(actor, "communications", "create");

    const cuerpo = await request.json().catch(() => ({}));
    const datos = parseInput(CrearPlantillaInput, cuerpo);

    const plantilla = await comunicacionesRepositorio().ejecutar(async (repo) => {
      return crearPlantillaMensaje(repo, datos);
    });

    return Response.json({ ok: true, plantilla }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
