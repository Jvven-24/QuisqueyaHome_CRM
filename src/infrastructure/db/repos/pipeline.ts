/**
 * Adaptador Drizzle de Pipeline (`application/pipeline/puertos.ts`).
 *
 * El SQL está calcado del que vivía en `api/pipeline/**`, sin "mejorarlo". Tres
 * sentencias son garantías de concurrencia o de fechas y NO deben simplificarse
 * (cada una tiene su comentario donde vive):
 *
 * - `bloquearNegocio`: `SELECT ... FOR UPDATE`, defensa 2 contra el doble cierre.
 * - `incrementarMetaAlcanzada`: `INSERT ... ON CONFLICT DO UPDATE` atómico, con
 *   `targetWhere` para el índice único parcial de la compañía.
 * - `totalGanadoDelAnio`: `SUM` en SQL con `at time zone 'America/Santo_Domingo'`.
 *
 * El filtro de alcance sobre proyectos vive en `visibleRows` (`convenciones.md`):
 * ningún método escribe su propio `WHERE broker_id`. Los `update` arman el `set`
 * campo por campo, nunca esparciendo el parámetro.
 *
 * Todo recibe `Tx`: el módulo solo escribe dentro de una transacción.
 */

import { and, eq, gt, inArray, isNull, or, sql } from "drizzle-orm";
import { NotFoundError } from "../../../domain/errors";
import {
  TIPOS_ACTIVIDAD_DE_CONTACTO,
  type EtapaPipeline,
  type Negocio,
  type PropiedadDeNegocio,
  type RepositorioPipeline,
  type ReposPipeline,
} from "../../../application/pipeline/puertos";
import {
  activities,
  brokerProfiles,
  commissions,
  dealProperties,
  dealStageHistory,
  deals,
  goals,
  pipelineStages,
  projects,
  units,
} from "../schema";
import { visibleRows } from "../../rbac-filter";
import { auditoriaDrizzle, type Tx } from "./compartido";

export function repositorioPipeline(tx: Tx): RepositorioPipeline {
  return {
    // --- lecturas para resolver el contexto de la transición ---------------

    async buscarNegocio(id): Promise<Negocio | undefined> {
      const [fila] = await tx.select().from(deals).where(eq(deals.id, id)).limit(1);
      return fila;
    },

    async buscarEtapa(id): Promise<EtapaPipeline | undefined> {
      const [fila] = await tx.select().from(pipelineStages).where(eq(pipelineStages.id, id)).limit(1);
      return fila;
    },

    async buscarEtapaActiva(id): Promise<EtapaPipeline | undefined> {
      const [fila] = await tx
        .select()
        .from(pipelineStages)
        .where(and(eq(pipelineStages.id, id), eq(pipelineStages.isActive, true)))
        .limit(1);
      return fila;
    },

    async tieneActividadDeContacto(dealId): Promise<boolean> {
      const [fila] = await tx
        .select({ id: activities.id })
        .from(activities)
        .where(
          and(
            eq(activities.dealId, dealId),
            isNull(activities.deletedAt),
            eq(activities.status, "completed"),
            inArray(activities.activityType, TIPOS_ACTIVIDAD_DE_CONTACTO),
          ),
        )
        .limit(1);
      return Boolean(fila);
    },

    async buscarProximaAccionVigente(actividadId) {
      const [actividad] = await tx.select().from(activities).where(eq(activities.id, actividadId)).limit(1);
      if (
        actividad &&
        !actividad.deletedAt &&
        actividad.status === "pending" &&
        actividad.assigneeId != null &&
        actividad.startsAt != null
      ) {
        return { responsableId: actividad.assigneeId, fecha: actividad.startsAt.toISOString() };
      }
      return null;
    },

    async propiedadesDelNegocio(dealId): Promise<PropiedadDeNegocio[]> {
      return tx.select().from(dealProperties).where(eq(dealProperties.dealId, dealId));
    },

    // --- escrituras del cambio de etapa y del cierre -----------------------

    async bloquearNegocio(id): Promise<Negocio | undefined> {
      // `for("update")` bloquea la fila hasta que termine la transacción: una
      // segunda petición espera aquí y, cuando lee, ve la etapa REAL. Es la
      // defensa 2 contra el doble cierre; no la conviertas en un `select` normal.
      const [fila] = await tx.select().from(deals).where(eq(deals.id, id)).for("update");
      return fila;
    },

    async aplicarCambioDeEtapa({ dealId, etapaDestinoId, cuando, perdida, actorId }): Promise<Negocio> {
      const [fila] = await tx
        .update(deals)
        .set({
          stageId: etapaDestinoId,
          stageChangedAt: cuando,
          ...(perdida ? { lossReasonId: perdida.lossReasonId, lossComment: perdida.lossComment } : {}),
          updatedBy: actorId,
        })
        .where(eq(deals.id, dealId))
        .returning();
      return fila!;
    },

    async registrarHistorialDeEtapa({ dealId, desdeEtapaId, hastaEtapaId, actorId }): Promise<void> {
      await tx.insert(dealStageHistory).values({
        dealId,
        fromStageId: desdeEtapaId,
        toStageId: hastaEtapaId,
        changedBy: actorId,
      });
    },

    async sellarCierre({ dealId, etapaDestinoId, cuando, amountCents, actorId }): Promise<Negocio> {
      const [fila] = await tx
        .update(deals)
        .set({
          stageId: etapaDestinoId,
          stageChangedAt: cuando,
          closedAt: cuando,
          amountCents,
          updatedBy: actorId,
        })
        .where(eq(deals.id, dealId))
        .returning();
      if (!fila) throw new NotFoundError();
      return fila;
    },

    async marcarUnidad({ unitId, estado, actorId }): Promise<void> {
      await tx.update(units).set({ status: estado, updatedBy: actorId }).where(eq(units.id, unitId));
    },

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
     *
     * Es atómico: no hay ventana entre "leer si existe" y "escribir". Por eso el
     * puerto expone este único método y no `buscarMeta` + `crearMeta`.
     */
    async incrementarMetaAlcanzada({ brokerId, anio, mes, amountCents, actorId }): Promise<void> {
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
        createdBy: actorId,
        updatedBy: actorId,
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
              updatedBy: actorId,
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
            updatedBy: actorId,
          },
        });
    },

    async buscarPerfilDeBroker(brokerId) {
      const [perfil] = await tx
        .select({ userId: brokerProfiles.userId })
        .from(brokerProfiles)
        .where(eq(brokerProfiles.userId, brokerId))
        .limit(1);
      return perfil;
    },

    async totalGanadoDelAnio(brokerId, anio): Promise<number> {
      const [fila] = await tx
        .select({ total: sql<number>`coalesce(sum(${deals.amountCents}), 0)::bigint` })
        .from(deals)
        .innerJoin(pipelineStages, eq(pipelineStages.id, deals.stageId))
        .where(
          and(
            eq(deals.brokerId, brokerId),
            eq(pipelineStages.kind, "won"),
            isNull(deals.deletedAt),
            sql`extract(year from ${deals.closedAt} at time zone 'America/Santo_Domingo') = ${anio}`,
          ),
        );
      // `coalesce(sum(...), 0)` sin `GROUP BY` siempre trae una fila, aunque
      // no haya negocios que sumar — `fila` nunca es `undefined` en la
      // práctica, pero Drizzle tipa cualquier `select()` como posible arreglo
      // vacío.
      return Number(fila?.total ?? 0);
    },

    async actualizarPerfilDeBroker({ brokerId, annualSalesCents, nivel }): Promise<void> {
      await tx
        .update(brokerProfiles)
        .set({ annualSalesCents, level: nivel })
        .where(eq(brokerProfiles.userId, brokerId));
    },

    async crearComision(datos): Promise<void> {
      await tx.insert(commissions).values({
        dealId: datos.dealId,
        brokerId: datos.brokerId,
        currency: datos.currency,
        saleAmountCents: datos.saleAmountCents,
        commissionBasisPoints: datos.commissionBasisPoints,
        totalCommissionCents: datos.totalCommissionCents,
        brokerShareBasisPoints: datos.brokerShareBasisPoints,
        agencyShareBasisPoints: datos.agencyShareBasisPoints,
        brokerAmountCents: datos.brokerAmountCents,
        agencyAmountCents: datos.agencyAmountCents,
        status: datos.status,
        closedDate: datos.closedDate,
        createdBy: datos.createdBy,
        updatedBy: datos.updatedBy,
      });
    },

    async cancelarActividadesFuturasPendientes({ dealId, ahora, actorId }): Promise<void> {
      // `startsAt` es nulable: una pendiente sin fecha no es "pasada", así que
      // `gt` sola la deja viva para siempre. `isNull` la trata como futura.
      await tx
        .update(activities)
        .set({ status: "cancelled", updatedBy: actorId })
        .where(
          and(
            eq(activities.dealId, dealId),
            eq(activities.status, "pending"),
            or(isNull(activities.startsAt), gt(activities.startsAt, ahora)),
          ),
        );
    },

    // --- edición del negocio y propiedades de interés ----------------------

    async buscarNegocioConEtapa(id) {
      const [fila] = await tx
        .select({ deal: deals, kind: pipelineStages.kind })
        .from(deals)
        .innerJoin(pipelineStages, eq(pipelineStages.id, deals.stageId))
        .where(eq(deals.id, id))
        .limit(1);
      return fila ? { negocio: fila.deal, etapaKind: fila.kind } : undefined;
    },

    async actualizarNegocio(id, cambios): Promise<Negocio> {
      // Asignación campo por campo, nunca `...cambios` (AGENTS.md).
      const set: Partial<typeof deals.$inferInsert> = { updatedBy: cambios.updatedBy };
      if (cambios.amountCents !== undefined) set.amountCents = cambios.amountCents;
      if (cambios.probability !== undefined) set.probability = cambios.probability;
      if (cambios.commissionBasisPoints !== undefined) set.commissionBasisPoints = cambios.commissionBasisPoints;
      if (cambios.expectedCloseDate !== undefined) set.expectedCloseDate = cambios.expectedCloseDate;

      const [fila] = await tx.update(deals).set(set).where(eq(deals.id, id)).returning();
      return fila!;
    },

    async proyectoVisible(actor, alcance, projectId) {
      const [proyecto] = await tx
        .select({ id: projects.id })
        .from(projects)
        .where(and(eq(projects.id, projectId), visibleRows(actor, alcance, projects.brokerId, projects.deletedAt)))
        .limit(1);
      return proyecto;
    },

    async unidadDelProyecto(unitId, projectId) {
      const [unidad] = await tx
        .select({ id: units.id })
        .from(units)
        .where(and(eq(units.id, unitId), eq(units.projectId, projectId), isNull(units.deletedAt)))
        .limit(1);
      return unidad;
    },

    async buscarPropiedad(dealId, propId): Promise<PropiedadDeNegocio | undefined> {
      const [fila] = await tx
        .select()
        .from(dealProperties)
        .where(and(eq(dealProperties.id, propId), eq(dealProperties.dealId, dealId)))
        .limit(1);
      return fila;
    },

    async desmarcarPrincipales(dealId): Promise<void> {
      await tx
        .update(dealProperties)
        .set({ isPrimary: false })
        .where(and(eq(dealProperties.dealId, dealId), eq(dealProperties.isPrimary, true)));
    },

    async crearPropiedad(datos): Promise<PropiedadDeNegocio> {
      const [fila] = await tx
        .insert(dealProperties)
        .values({
          dealId: datos.dealId,
          projectId: datos.projectId,
          unitId: datos.unitId,
          isPrimary: datos.isPrimary,
          createdBy: datos.createdBy,
        })
        .returning();
      return fila!;
    },

    async marcarPrincipal(propId): Promise<PropiedadDeNegocio> {
      const [fila] = await tx
        .update(dealProperties)
        .set({ isPrimary: true })
        .where(eq(dealProperties.id, propId))
        .returning();
      return fila!;
    },

    async eliminarPropiedad(propId): Promise<void> {
      await tx.delete(dealProperties).where(eq(dealProperties.id, propId));
    },
  };
}

/** El juego transaccional: el repositorio del módulo más la auditoría, ambos ligados a `tx`. */
export function reposPipeline(tx: Tx): ReposPipeline {
  return { pipeline: repositorioPipeline(tx), auditoria: auditoriaDrizzle(tx) };
}
