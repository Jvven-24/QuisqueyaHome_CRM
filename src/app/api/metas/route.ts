/**
 * M8 · Metas — fijar la meta mensual (`docs/F3_ANALISIS_Y_PLAN.md` §4.1,
 * decisión #35). `brokerId: null` es la meta de la compañía.
 *
 * Nunca toca `achieved_*`: eso solo lo escribe el cierre transaccional
 * (`api/pipeline/[id]/etapa/_cierre.ts`, `incrementarMeta`), exactamente una
 * vez por negocio ganado (criterio de terminado #4). El `ON CONFLICT` de aquí
 * y el de allá comparten los mismos dos índices únicos de `goals`, en sentido
 * inverso: uno solo escribe `target_*`, el otro solo `achieved_*`.
 */

import { and, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { ForbiddenError, NotFoundError } from "@/domain/errors";
import { reaches, requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { auditar } from "@/infrastructure/audit";
import { transaction } from "@/infrastructure/db/client";
import { brokerProfiles, goals } from "@/infrastructure/db/schema";
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

    // El scope de `goals:edit` no basta por sí solo: con alcance `own`, quien
    // tiene el permiso solo puede fijar su propia meta, nunca la de otro
    // broker ni la de la compañía (`brokerId` nulo, que `reaches` ya trata
    // como inalcanzable salvo con alcance `all` — no depende de qué diga el
    // seed hoy).
    if (!reaches(actor, scope, datos.brokerId)) {
      throw new ForbiddenError("No tienes permiso para fijar esta meta.");
    }

    const meta = await transaction(async (tx) => {
      if (datos.brokerId != null) {
        const [perfil] = await tx
          .select({ userId: brokerProfiles.userId })
          .from(brokerProfiles)
          .where(eq(brokerProfiles.userId, datos.brokerId))
          .limit(1);
        if (!perfil) throw new NotFoundError("El broker indicado no tiene perfil de broker.");
      }

      const condicionPeriodo =
        datos.brokerId != null
          ? and(eq(goals.brokerId, datos.brokerId), eq(goals.year, datos.year), eq(goals.month, datos.month))
          : and(isNull(goals.brokerId), eq(goals.year, datos.year), eq(goals.month, datos.month));
      const [anterior] = await tx.select().from(goals).where(condicionPeriodo).limit(1);

      // `targetAmountCents` solo se incluye si vino en el body: si se manda
      // `undefined` en `set`, Drizzle igual lo escribiría como NULL y
      // borraría un monto que ya existía en la fila por no venir en esta
      // edición puntual (que solo toca negocios, ver §7 de
      // `F3_ANALISIS_Y_PLAN.md`: "la pantalla aprobada mide negocios").
      const montoInput =
        datos.targetAmountCents !== undefined ? { targetAmountCents: datos.targetAmountCents } : {};

      const valores = {
        brokerId: datos.brokerId,
        year: datos.year,
        month: datos.month,
        targetDeals: datos.targetDeals,
        ...montoInput,
        createdBy: actor.userId,
        updatedBy: actor.userId,
      };
      // Solo `target_*`: el `ON CONFLICT` de esta ruta jamás toca `achieved_*`
      // (eso es exclusivo del cierre, ver docblock de arriba).
      const cambios = {
        targetDeals: datos.targetDeals,
        ...montoInput,
        updatedBy: actor.userId,
      };

      const [fila] =
        datos.brokerId != null
          ? await tx
              .insert(goals)
              .values(valores)
              .onConflictDoUpdate({ target: [goals.brokerId, goals.year, goals.month], set: cambios })
              .returning()
          : await tx
              .insert(goals)
              .values(valores)
              .onConflictDoUpdate({
                target: [goals.year, goals.month],
                targetWhere: sql`${goals.brokerId} is null`,
                set: cambios,
              })
              .returning();

      await auditar(tx, actor, {
        accion: anterior ? "editar" : "crear",
        entidad: "goal",
        entidadId: fila!.id,
        antes: anterior,
        despues: fila,
      });

      return fila!;
    });

    return Response.json({ ok: true, meta });
  } catch (error) {
    return errorResponse(error);
  }
}
