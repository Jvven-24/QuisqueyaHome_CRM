/** M4 · Pack de tareas: alta atómica de varias actividades (todas o ninguna). */

import { z } from "zod";
import { crearActividadesEnLote } from "@/application/actividades/casos-de-uso";
import { requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { actividadesParaEscritura } from "@/infrastructure/contenedor/actividades";
import { errorResponse, parseInput } from "@/infrastructure/http";
import { conIdempotencia } from "@/infrastructure/idempotencia-db";
import { aEntradaCrear, CrearActividadInput, limpiarVacios } from "../_entrada";

const LoteInput = z.object({ actividades: z.array(z.preprocess(limpiarVacios, CrearActividadInput)).min(1, "El pack no tiene tareas.").max(20, "Un pack admite hasta 20 tareas.") });

async function crearLote(request: Request) {
  try {
    const datos = parseInput(LoteInput, await request.json().catch(() => ({})));
    const actor = await requireActor();
    const alcance = requireScope(actor, "activities", "create");
    const actividades = await crearActividadesEnLote(actividadesParaEscritura(), actor, alcance, datos.actividades.map(aEntradaCrear));
    return Response.json({ ok: true, creadas: actividades.length, actividades });
  } catch (error) {
    return errorResponse(error);
  }
}

export const POST = conIdempotencia("ACTIVIDADES_LOTE", crearLote);
