/**
 * M10 · Academy — API de listado y estado de formación.
 */

import { listarContenidosAcademy, obtenerResumenProgresoBroker } from "@/application/academy/casos-de-uso";
import { requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { academyRepositorio } from "@/infrastructure/contenedor/academy";
import { errorResponse } from "@/infrastructure/http";

export async function GET(request: Request) {
  try {
    const actor = await requireActor();
    requireScope(actor, "academy", "view");

    const url = new URL(request.url);
    const categoria = url.searchParams.get("categoria") || undefined;

    const { contenidos, resumen } = await academyRepositorio().ejecutar(async (repo) => {
      const items = await listarContenidosAcademy(repo, actor.userId, categoria);
      const res = await obtenerResumenProgresoBroker(repo, actor.userId);
      return { contenidos: items, resumen: res };
    });

    return Response.json({ ok: true, contenidos, resumen });
  } catch (error) {
    return errorResponse(error);
  }
}
