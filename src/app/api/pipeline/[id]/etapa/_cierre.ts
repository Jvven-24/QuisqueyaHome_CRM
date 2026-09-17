/**
 * M3b · Pipeline — cierre transaccional (`MAPEO_FRONTEND_CRM.md` §10.2,
 * `docs/F1_ANALISIS_Y_PLAN.md` paso 6).
 *
 * Los ocho pasos, en el orden del mapeo. Vive aparte de `route.ts` (mismo
 * criterio que `api/leads/_broker-candidatos.ts`: un archivo `_` no es una
 * ruta, es un helper privado de esta carpeta) porque el route handler ya hace
 * bastante resolviendo el `ContextoTransicion` de `validarTransicion` — separar
 * "cambio simple de etapa" de "cerrar el negocio" en dos funciones es más
 * fácil de leer que un único `if` gigante con las dos ramas mezcladas.
 *
 * **Todo esto corre dentro de la `transaction()` que abre `route.ts`.** Esta
 * función recibe `tx`, nunca abre su propia conexión: si cualquiera de los
 * ocho pasos falla, Postgres revierte los anteriores solo porque comparten la
 * misma transacción — no hay lógica de "deshacer" escrita a mano en ningún
 * sitio de este archivo, y no debería hacer falta.
 */

import { and, eq, gt, isNull, or, sql } from "drizzle-orm";
import { ConflictError, NotFoundError } from "@/domain/errors";
import type { Actor } from "@/domain/rbac";
import {
  calcularComision,
  evaluarNivelBroker,
  DEFAULT_AGENCY_SHARE_BASIS_POINTS,
  DEFAULT_BROKER_SHARE_BASIS_POINTS,
} from "@/domain/cierre-negocio";
import { fechaSantoDomingo } from "@/domain/zona-horaria";
import { auditar } from "@/infrastructure/audit";
import type { Db } from "@/infrastructure/db/client";
import {
  activities,
  brokerProfiles,
  commissions,
  dealProperties,
  dealStageHistory,
  deals,
  goals,
  pipelineStages,
  units,
} from "@/infrastructure/db/schema";

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

type Deal = typeof deals.$inferSelect;
type PipelineStage = typeof pipelineStages.$inferSelect;
type DealProperty = typeof dealProperties.$inferSelect;

/**
 * Cierra un negocio como ganado. `route.ts` ya llamó a `validarTransicion` con
 * los datos leídos al principio de la transacción — pero entre esa lectura y
 * este punto puede haber pasado una fracción de segundo en la que **otra**
 * petición para el mismo negocio hizo exactamente lo mismo (dos clientes
 * arrastrando la misma tarjeta casi a la vez, o un doble clic). Por eso el
 * primer paso de aquí no es de los ocho de §10.2: es la segunda defensa contra
 * el doble cierre (la primera es `validarTransicion` bloqueando un negocio que
 * ya no está `open`; la tercera es `commissions_deal_unq` en la base).
 */
export async function cerrarNegocioGanado(
  tx: Tx,
  actor: Actor,
  params: {
    dealId: number;
    etapaDestino: PipelineStage;
    /** Fila de `deal_properties` con `isPrimary: true` y `unitId` resuelto — ya la validó `validarTransicion` vía `tieneUnidadPrincipal`. */
    unidadPrincipal: DealProperty & { unitId: number };
    /** `amountCents` ya resuelto (el del body si vino, si no el que ya tenía el negocio). `validarTransicion` garantiza que no es `null`. */
    amountCentsFinal: number;
  },
): Promise<{ deal: Deal }> {
  const { dealId, etapaDestino, unidadPrincipal, amountCentsFinal } = params;

  // --- Defensa 2 contra el doble cierre ------------------------------------
  // `for("update")` bloquea la fila hasta que esta transacción termine. Si dos
  // peticiones llegaron casi juntas, la segunda espera aquí a que la primera
  // confirme (o revierta) — y cuando por fin lee, ve la etapa *real*, no la
  // que leyó `route.ts` antes de que la otra petición ganara la carrera.
  const [dealBloqueado] = await tx
    .select()
    .from(deals)
    .where(eq(deals.id, dealId))
    .for("update");
  if (!dealBloqueado || dealBloqueado.deletedAt) throw new NotFoundError();

  const [etapaActual] = await tx
    .select()
    .from(pipelineStages)
    .where(eq(pipelineStages.id, dealBloqueado.stageId))
    .limit(1);
  if (!etapaActual || etapaActual.kind !== "open") {
    throw new ConflictError(
      "Este negocio ya fue cerrado o marcado como perdido por otra operación mientras se procesaba este cambio.",
    );
  }

  // Guardia adicional, fuera de `validarTransicion` a propósito: la tabla
  // `commissions.commission_basis_points` es `NOT NULL` (`db/schema.ts`), así
  // que sin este dato el paso 6 rompería con un error de Postgres poco claro
  // en vez de un 409 que el usuario entiende. `validarTransicion` solo exige
  // `commissionBasisPoints` para *entrar* a Negociación (§10.1); un negocio
  // puede saltarse esa etapa y llegar a Cierre sin haber pasado por ahí.
  if (dealBloqueado.commissionBasisPoints == null) {
    throw new ConflictError(
      "Para cerrar el negocio hace falta el porcentaje de comisión.",
    );
  }

  const now = new Date();
  // Hora de Santo Domingo, no la del servidor (issue #24): en un VPS en UTC,
  // un cierre nocturno contaría en el día o el mes siguiente.
  const fechaCierre = fechaSantoDomingo(now);
  const [anio, mes] = fechaCierre.split("-").map(Number) as [number, number];

  // --- Paso 1: sellar closed_at y el monto final ---------------------------
  const [dealCerrado] = await tx
    .update(deals)
    .set({
      stageId: etapaDestino.id,
      stageChangedAt: now,
      closedAt: now,
      amountCents: amountCentsFinal,
      updatedBy: actor.userId,
    })
    .where(eq(deals.id, dealId))
    .returning();
  if (!dealCerrado) throw new NotFoundError();

  // --- Paso 2: deal_stage_history -------------------------------------------
  await tx.insert(dealStageHistory).values({
    dealId,
    fromStageId: etapaActual.id,
    toStageId: etapaDestino.id,
    changedBy: actor.userId,
  });

  // --- Paso 3: unidad principal → sold / reserved --------------------------
  // Un alquiler no "se vende": la unidad queda reservada para el inquilino, no
  // fuera del inventario disponible de forma permanente como una venta. Una
  // venta sí agota la unidad del inventario vendible. Es la lectura más
  // simple de `operation_type` sobre `unit_status` que no inventa un tercer
  // estado que el esquema (congelado) no tiene.
  const estadoUnidad = dealCerrado.operationType === "rent" ? "reserved" : "sold";
  await tx
    .update(units)
    .set({ status: estadoUnidad, updatedBy: actor.userId })
    .where(eq(units.id, unidadPrincipal.unitId));

  // --- Paso 4: metas del broker y de la compañía ---------------------------
  // Dos filas distintas, cada una con su propio índice único parcial en el
  // esquema (`goals_broker_period_unq`, `goals_company_period_unq`) — el
  // `INSERT ... ON CONFLICT` es atómico en Postgres: no hay ventana entre
  // "leer si existe" y "escribir" en la que dos cierres del mismo periodo se
  // pisen entre sí, que es justo el problema que un `SELECT` + `UPDATE`
  // manual tendría aquí.
  if (dealCerrado.brokerId != null) {
    await incrementarMeta(tx, {
      brokerId: dealCerrado.brokerId,
      anio,
      mes,
      amountCents: amountCentsFinal,
      actor,
    });
  }
  await incrementarMeta(tx, {
    brokerId: null,
    anio,
    mes,
    amountCents: amountCentsFinal,
    actor,
  });

  // --- Paso 5: broker_profiles.annual_sales_cents + nivel ------------------
  if (dealCerrado.brokerId != null) {
    const [perfil] = await tx
      .select()
      .from(brokerProfiles)
      .where(eq(brokerProfiles.userId, dealCerrado.brokerId))
      .limit(1);
    // Un usuario con rol distinto de "broker" (p. ej. quien cierra el negocio
    // es el administrador, actuando por un broker sin perfil creado) no tiene
    // fila en `broker_profiles` — el esquema lo permite (no hay perfil para
    // todos los `users`). No hay nada que recalcular en ese caso; el cierre
    // no debe fallar por la ausencia de un perfil que no le corresponde tener.
    if (perfil) {
      // Recalculado con un SUM en vez de incrementado (issue #24): nadie
      // reiniciaba `annual_sales_cents`, así que acumulaba de por vida y el
      // nivel del broker solo podía subir. El `SELECT` ya ve este negocio
      // (paso 1 lo dejó `closedAt: now` dentro de esta misma transacción), así
      // que no hace falta sumarle `amountCentsFinal` aparte.
      const [fila] = await tx
        .select({ total: sql<number>`coalesce(sum(${deals.amountCents}), 0)::bigint` })
        .from(deals)
        .innerJoin(pipelineStages, eq(pipelineStages.id, deals.stageId))
        .where(
          and(
            eq(deals.brokerId, dealCerrado.brokerId),
            eq(pipelineStages.kind, "won"),
            isNull(deals.deletedAt),
            sql`extract(year from ${deals.closedAt} at time zone 'America/Santo_Domingo') = ${anio}`,
          ),
        );
      // `coalesce(sum(...), 0)` sin `GROUP BY` siempre trae una fila, aunque
      // no haya negocios que sumar — `fila` nunca es `undefined` en la
      // práctica, pero Drizzle tipa cualquier `select()` como posible arreglo
      // vacío.
      const nuevoAnual = Number(fila?.total ?? 0);
      await tx
        .update(brokerProfiles)
        .set({ annualSalesCents: nuevoAnual, level: evaluarNivelBroker(nuevoAnual) })
        .where(eq(brokerProfiles.userId, dealCerrado.brokerId));
    }
  }

  // --- Paso 6: commissions, estado pending ---------------------------------
  const { totalCommissionCents, brokerAmountCents, agencyAmountCents } = calcularComision({
    saleAmountCents: amountCentsFinal,
    commissionBasisPoints: dealCerrado.commissionBasisPoints!,
    brokerShareBasisPoints: DEFAULT_BROKER_SHARE_BASIS_POINTS,
    agencyShareBasisPoints: DEFAULT_AGENCY_SHARE_BASIS_POINTS,
  });
  await tx.insert(commissions).values({
    dealId,
    brokerId: dealCerrado.brokerId,
    currency: dealCerrado.currency,
    saleAmountCents: amountCentsFinal,
    commissionBasisPoints: dealCerrado.commissionBasisPoints!,
    totalCommissionCents,
    brokerShareBasisPoints: DEFAULT_BROKER_SHARE_BASIS_POINTS,
    agencyShareBasisPoints: DEFAULT_AGENCY_SHARE_BASIS_POINTS,
    brokerAmountCents,
    agencyAmountCents,
    status: "pending",
    closedDate: fechaCierre,
    createdBy: actor.userId,
    updatedBy: actor.userId,
  });
  // Si dos cierres llegaran a ejecutar este `insert` para el mismo `dealId`
  // (no debería pasar: la defensa 2 de arriba ya lo impide), `commissions_deal_unq`
  // —índice único ya existente en el esquema— es quien lo detiene en último
  // término, a nivel de base de datos y no de una condición que alguien podría
  // desactivar sin darse cuenta.

  // --- Paso 7: cancelar actividades futuras pendientes ---------------------
  // `startsAt` es nulable: una pendiente sin fecha no es "pasada", así que
  // `gt` sola la deja viva para siempre. `isNull` la trata como futura.
  await tx
    .update(activities)
    .set({ status: "cancelled", updatedBy: actor.userId })
    .where(
      and(
        eq(activities.dealId, dealId),
        eq(activities.status, "pending"),
        or(isNull(activities.startsAt), gt(activities.startsAt, now)),
      ),
    );

  // --- Paso 8: auditoría -----------------------------------------------------
  await auditar(tx, actor, {
    accion: "cerrar",
    entidad: "deal",
    entidadId: dealId,
    antes: dealBloqueado,
    despues: dealCerrado,
  });

  return { deal: dealCerrado };
}

/**
 * `INSERT ... ON CONFLICT DO UPDATE` sobre `goals`, para el broker
 * (`brokerId` no nulo, índice `goals_broker_period_unq`) o para la compañía
 * (`brokerId` nulo, índice parcial `goals_company_period_unq` — de ahí el
 * `targetWhere`: sin él, Drizzle no sabría contra cuál de los dos índices
 * únicos de la tabla resolver el conflicto). Si el periodo no tiene fila
 * todavía, nace con la meta del broker (`broker_profiles.monthly_target_deals`,
 * 0 si no tiene perfil — hallazgo 5 de `F3_ANALISIS_Y_PLAN.md` §3) o, para la
 * compañía, en 0 hasta que M8 la fije a mano (decisión #35): un mes sin meta
 * no debe bloquear un cierre real (encargo, punto 4). El `ON CONFLICT` nunca
 * toca `target_*`, solo `achieved_*` — M8 es quien escribe la meta.
 */
async function incrementarMeta(
  tx: Tx,
  params: { brokerId: number | null; anio: number; mes: number; amountCents: number; actor: Actor },
): Promise<void> {
  const { brokerId, anio, mes, amountCents, actor } = params;

  let targetDeals = 0;
  if (brokerId != null) {
    const [perfil] = await tx
      .select({ monthlyTargetDeals: brokerProfiles.monthlyTargetDeals })
      .from(brokerProfiles)
      .where(eq(brokerProfiles.userId, brokerId))
      .limit(1);
    targetDeals = perfil?.monthlyTargetDeals ?? 0;
  }

  const valores = {
    brokerId,
    year: anio,
    month: mes,
    targetDeals,
    targetAmountCents: 0,
    achievedDeals: 1,
    achievedAmountCents: amountCents,
    createdBy: actor.userId,
    updatedBy: actor.userId,
  };

  if (brokerId != null) {
    await tx
      .insert(goals)
      .values(valores)
      .onConflictDoUpdate({
        target: [goals.brokerId, goals.year, goals.month],
        set: {
          achievedDeals: sql`${goals.achievedDeals} + 1`,
          achievedAmountCents: sql`${goals.achievedAmountCents} + ${amountCents}`,
          updatedBy: actor.userId,
        },
      });
    return;
  }

  await tx
    .insert(goals)
    .values(valores)
    .onConflictDoUpdate({
      target: [goals.year, goals.month],
      targetWhere: sql`${goals.brokerId} is null`,
      set: {
        achievedDeals: sql`${goals.achievedDeals} + 1`,
        achievedAmountCents: sql`${goals.achievedAmountCents} + ${amountCents}`,
        updatedBy: actor.userId,
      },
    });
}
