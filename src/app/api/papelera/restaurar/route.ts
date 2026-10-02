/**
 * M13 · Papelera — restauración (`docs/F2_ANALISIS_Y_PLAN.md` paso 5).
 *
 * Un solo endpoint para las seis tablas con borrado lógico: `entityType` en
 * el body dice cuál. Reutiliza `PERMISSION_RESOURCES` para el permiso —
 * quien puede borrar un contacto puede restaurarlo, es la acción espejo.
 *
 * ponytail: la papelera completa exige `settings:edit` en vez de comprobar el
 * permiso de cada recurso por separado — en el seed actual solo el
 * administrador tiene `delete` en ningún recurso salvo el suyo propio, así
 * que separar el permiso por entidad no cambia quién puede usarla hoy. Si
 * algún día el asistente gana `delete` sobre `contacts`, aquí es donde se
 * ajusta: un `requireScope(actor, <recurso de la entidad>, "delete")` en vez
 * del `settings` fijo (el mapa entidad → tabla vive ahora en
 * el adaptador de papelera, en la carpeta de repos; el recurso por entidad
 * habría que declararlo en esta ruta).
 */

import { z } from "zod";
import { restaurarDePapelera } from "@/application/papelera/casos-de-uso";
import { requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { papeleraParaEscritura } from "@/infrastructure/contenedor/papelera";
import { errorResponse, parseInput } from "@/infrastructure/http";

const RestaurarInput = z.object({
  entityType: z.enum(["contact", "lead", "deal", "project", "unit", "user"]),
  id: z.coerce.number().int().positive(),
});

export async function POST(request: Request) {
  try {
    const datos = parseInput(RestaurarInput, await request.json().catch(() => ({})));
    const actor = await requireActor();
    requireScope(actor, "settings", "edit");

    const fila = await restaurarDePapelera(papeleraParaEscritura(), actor, datos.entityType, datos.id);

    return Response.json({ ok: true, fila });
  } catch (error) {
    return errorResponse(error);
  }
}
