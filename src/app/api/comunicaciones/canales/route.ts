/**
 * M11 · Comunicaciones — API de estado y configuración de canales.
 */

import { consultarEstadosCanales } from "@/application/comunicaciones/casos-de-uso";
import { requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { comunicacionesRepositorio } from "@/infrastructure/contenedor/comunicaciones";
import { errorResponse } from "@/infrastructure/http";

export async function GET() {
  try {
    const actor = await requireActor();
    requireScope(actor, "communications", "view");

    const canales = await comunicacionesRepositorio().ejecutar(async (repo) => {
      return consultarEstadosCanales(repo);
    });

    return Response.json({ ok: true, canales });
  } catch (error) {
    return errorResponse(error);
  }
}
