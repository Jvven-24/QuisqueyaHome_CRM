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

import { z } from "zod";
import { fijarMetaMensual, type EntradaFijarMeta } from "@/application/metas/casos-de-uso";
import { requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { metasParaEscritura } from "@/infrastructure/contenedor/metas";
import { errorResponse, parseInput } from "@/infrastructure/http";

const FijarMetaInput = z.object({
  brokerId: z.number().int().positive().nullable(),
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
  targetDeals: z.number().int().nonnegative(),
  targetAmountCents: z.number().int().nonnegative().optional(),
});

export async function PUT(request: Request) {
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
