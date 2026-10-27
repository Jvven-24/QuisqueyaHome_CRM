/** M8 · Publica una versión nueva de la regla de atribución (queda aprobada y activa). */
import { PublicarReglaInput } from "@/application/metas/alcances-validacion";
import { publicarReglaAtribucion } from "@/application/metas/alcances";
import { requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { metasAlcanceParaEscritura } from "@/infrastructure/contenedor/metas-alcances";
import { conIdempotencia } from "@/infrastructure/idempotencia-db";
import { errorResponse, parseInput } from "@/infrastructure/http";

async function POSTSinIdempotencia(request: Request) {
  try {
    const datos = parseInput(PublicarReglaInput, await request.json().catch(() => ({})));
    const actor = await requireActor();
    const scope = requireScope(actor, "goals", "edit");
    const regla = await publicarReglaAtribucion(metasAlcanceParaEscritura(), actor, scope, { scope: datos.scope, rule: datos.rule, equipo: datos.equipo });
    return Response.json({ ok: true, regla });
  } catch (error) {
    return errorResponse(error);
  }
}

export const POST = conIdempotencia("META_ATRIBUCION", POSTSinIdempotencia);
