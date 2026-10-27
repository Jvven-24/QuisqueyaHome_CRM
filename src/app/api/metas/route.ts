/**
 * M8 · Metas — fijar la meta mensual (`docs/F3_ANALISIS_Y_PLAN.md` §4.1,
 * decisión #35). `brokerId: null` es la meta de la compañía.
 *
 * Nunca toca `achieved_*`: eso solo lo escribe el cierre transaccional
 * (`application/pipeline/cierre.ts`, `incrementarMetaAlcanzada`), exactamente
 * una vez por negocio ganado (criterio de terminado #4). El `ON CONFLICT` de
 * `repos/metas.ts` y el de `repos/pipeline.ts` comparten los mismos dos índices
 * únicos de `goals`, en sentido inverso: uno solo escribe `target_*`, el otro
 * solo `achieved_*`. Lo vigila `route.test.ts`.
 */

import { FijarMetaInput } from "@/application/metas/validacion";
import { fijarMetaMensual, reiniciarMetaMensual, type EntradaFijarMeta } from "@/application/metas/casos-de-uso";
import { ReiniciarMetaInput } from "@/application/metas/alcances-validacion";
import { requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { metasParaEscritura } from "@/infrastructure/contenedor/metas";
import { conIdempotencia } from "@/infrastructure/idempotencia-db";
import { errorResponse, parseInput } from "@/infrastructure/http";

async function PUTSinIdempotencia(request: Request) {
  try {
    const datos = parseInput(FijarMetaInput, await request.json().catch(() => ({})));
    const actor = await requireActor();
    const scope = requireScope(actor, "goals", "edit");

    // Campo por campo; `targetAmountCents` solo si vino (ausente conserva el monto).
    const entrada: EntradaFijarMeta = {
      brokerId: datos.brokerId,
      year: datos.year,
      month: datos.month,
      targetDeals: datos.targetDeals,
    };
    if (datos.targetAmountCents !== undefined) entrada.targetAmountCents = datos.targetAmountCents;

    const meta = await fijarMetaMensual(metasParaEscritura(), actor, scope, entrada);

    return Response.json({ ok: true, meta });
  } catch (error) {
    return errorResponse(error);
  }
}

/** Reinicia el objetivo del periodo (solo Administrador). Lo logrado se conserva. */
async function DELETESinIdempotencia(request: Request) {
  try {
    const datos = parseInput(ReiniciarMetaInput, await request.json().catch(() => ({})));
    const actor = await requireActor();
    const scope = requireScope(actor, "goals", "edit");
    const meta = await reiniciarMetaMensual(metasParaEscritura(), actor, scope, { brokerId: datos.brokerId, year: datos.year, month: datos.month });
    return Response.json({ ok: true, meta });
  } catch (error) {
    return errorResponse(error);
  }
}

export const PUT = conIdempotencia("META", PUTSinIdempotencia);

export const DELETE = conIdempotencia("META", DELETESinIdempotencia);
