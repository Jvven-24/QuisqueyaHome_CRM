/**
 * Adaptador Drizzle de Leads (`application/leads/puertos.ts`).
 *
 * El SQL está calcado del que vivía en `api/leads/**`, sin "mejorarlo". Una
 * sentencia es una garantía de concurrencia y NO debe simplificarse:
 *
 * - `crearLeadExternoSiNoExiste`: `INSERT ... ON CONFLICT DO NOTHING` sobre el
 *   índice único PARCIAL `leads_external_id_unq`, con su `where`, y solo si no
 *   insertó, un `SELECT` de respaldo. Es la idempotencia del webhook
 *   (decisión #20).
 *
 * Acepta la transacción o la conexión suelta (`Ejecutor`) porque las lecturas
 * previas (duplicados, contacto, candidatos a broker) corren fuera del `BEGIN`,
 * como antes. Los `update` arman el `set` campo por campo, nunca esparciendo un
 * parámetro.
 */

import { and, asc, eq, isNull, or } from "drizzle-orm";
import type {
  CandidatoBroker,
  CandidatoDuplicado,
  Contacto,
  Lead,
  Negocio,
  RepositorioLeads,
  ReposLeads,
} from "../../../application/leads/puertos";
import type { Db } from "../client";
import { auditLog, brokerProfiles, contacts, deals, leads, pipelineStages, users } from "../schema";
import { auditoriaDrizzle, type Tx } from "./compartido";

/** La transacción o la conexión suelta. */
export type Ejecutor = Tx | Db;

export function repositorioLeads(ejecutor: Ejecutor): RepositorioLeads {
  return {
    // --- lecturas previas a la transacción ---------------------------------

    async candidatosDuplicados({ phone, email }): Promise<CandidatoDuplicado[]> {
      return ejecutor
        .select({
          id: contacts.id,
          fullName: contacts.fullName,
          phone: contacts.phone,
          phoneDisplay: contacts.phoneDisplay,
          email: contacts.email,
        })
        .from(contacts)
        .where(
          and(
            isNull(contacts.deletedAt),
            or(phone ? eq(contacts.phone, phone) : undefined, email ? eq(contacts.email, email) : undefined),
          ),
        );
    },

    async contactoExiste(id): Promise<boolean> {
      const [fila] = await ejecutor
        .select({ id: contacts.id })
        .from(contacts)
        .where(and(eq(contacts.id, id), isNull(contacts.deletedAt)))
        .limit(1);
      return Boolean(fila);
    },

    /** Brokers activos con perfil, sin papelera: la lista de la sugerencia (#21) y de la asignación manual (#22). */
    async candidatosBroker(): Promise<CandidatoBroker[]> {
      return ejecutor
        .select({
          userId: brokerProfiles.userId,
          specialty: brokerProfiles.specialty,
          handlesRentals: brokerProfiles.handlesRentals,
          annualSalesCents: brokerProfiles.annualSalesCents,
          fullName: users.fullName,
        })
        .from(brokerProfiles)
        .innerJoin(users, eq(users.id, brokerProfiles.userId))
        .where(and(eq(users.isActive, true), isNull(users.deletedAt)));
    },

    // --- dentro de la transacción ------------------------------------------

    async buscarLead(id): Promise<Lead | undefined> {
      // Sin `visibleRows` ni filtro de papelera, como antes: el caso de uso
      // decide con `deletedAt` y `reaches` (el `SELECT` ya fue por `id`).
      const [fila] = await ejecutor.select().from(leads).where(eq(leads.id, id)).limit(1);
      return fila;
    },

    async buscarContactoPorTelefonoOCorreo({ phone, email }) {
      const [fila] = await ejecutor
        .select({ id: contacts.id })
        .from(contacts)
        .where(
          and(
            isNull(contacts.deletedAt),
            or(phone ? eq(contacts.phone, phone) : undefined, email ? eq(contacts.email, email) : undefined),
          ),
        )
        .limit(1);
      return fila;
    },

    async crearContactoManual(datos): Promise<Contacto> {
      const [fila] = await ejecutor
        .insert(contacts)
        .values({
          fullName: datos.fullName,
          phone: datos.phone,
          phoneDisplay: datos.phoneDisplay,
          email: datos.email,
          sourceId: datos.sourceId,
          brokerId: datos.brokerId,
          createdBy: datos.createdBy,
          updatedBy: datos.updatedBy,
        })
        .returning();
      return fila!;
    },

    async crearContactoExterno(datos): Promise<Contacto> {
      const [fila] = await ejecutor
        .insert(contacts)
        .values({
          fullName: datos.fullName,
          phone: datos.phone,
          phoneDisplay: datos.phoneDisplay,
          email: datos.email,
          sourceId: datos.sourceId,
          consentAt: datos.consentAt,
          consentSource: datos.consentSource,
        })
        .returning();
      return fila!;
    },

    async crearLead(datos): Promise<Lead> {
      const [fila] = await ejecutor
        .insert(leads)
        .values({
          contactId: datos.contactId,
          sourceId: datos.sourceId,
          projectId: datos.projectId,
          projectInterestText: datos.projectInterestText,
          zoneInterest: datos.zoneInterest,
          operationType: datos.operationType,
          currency: datos.currency,
          budgetMinCents: datos.budgetMinCents,
          budgetMaxCents: datos.budgetMaxCents,
          suggestedBrokerId: datos.suggestedBrokerId,
          campaign: datos.campaign,
          utmSource: datos.utmSource,
          utmMedium: datos.utmMedium,
          utmCampaign: datos.utmCampaign,
          originalMessage: datos.originalMessage,
          sourceVideoUrl: datos.sourceVideoUrl,
          createdBy: datos.createdBy,
          updatedBy: datos.updatedBy,
        })
        .returning();
      return fila!;
    },

    /**
     * Idempotencia de la captura externa (decisión #20): `onConflictDoNothing`
     * sobre el único parcial de `externalId`, con `returning()` — no un `SELECT`
     * previo que compita con un `INSERT` separado. Es atómico: dos entregas
     * simultáneas del mismo `externalId` no pueden insertar las dos. Por eso el
     * puerto expone este único método y no `buscarPorExternalId` + `crearLead`.
     */
    async crearLeadExternoSiNoExiste(datos): Promise<{ lead: Lead; creado: boolean }> {
      const [insertado] = await ejecutor
        .insert(leads)
        .values({
          contactId: datos.contactId,
          sourceId: datos.sourceId,
          projectId: datos.projectId,
          projectInterestText: datos.projectInterestText,
          zoneInterest: datos.zoneInterest,
          operationType: datos.operationType,
          currency: datos.currency,
          budgetMinCents: datos.budgetMinCents,
          budgetMaxCents: datos.budgetMaxCents,
          suggestedBrokerId: datos.suggestedBrokerId,
          campaign: datos.campaign,
          utmSource: datos.utmSource,
          utmMedium: datos.utmMedium,
          utmCampaign: datos.utmCampaign,
          originalMessage: datos.originalMessage,
          sourceVideoUrl: datos.sourceVideoUrl,
          externalId: datos.externalId,
        })
        // `leads_external_id_unq` es un índice único **parcial**
        // (`WHERE deleted_at IS NULL`, `db/schema.ts`): Postgres exige que el
        // conflicto declarado calce exactamente con el predicado del índice, o
        // responde "no unique or exclusion constraint" en vez de aplicar el
        // `DO NOTHING`. Por eso `where` repite esa misma condición.
        .onConflictDoNothing({ target: leads.externalId, where: isNull(leads.deletedAt) })
        .returning();

      if (insertado) return { lead: insertado, creado: true };

      // Ya existía: el índice único descartó el `insert`. Se devuelve el lead
      // existente.
      const [existente] = await ejecutor.select().from(leads).where(eq(leads.externalId, datos.externalId)).limit(1);
      return { lead: existente!, creado: false };
    },

    async asignarResponsable(id, brokerId, actorId): Promise<Lead> {
      const [fila] = await ejecutor
        .update(leads)
        .set({ brokerId, updatedBy: actorId })
        .where(eq(leads.id, id))
        .returning();
      return fila!;
    },

    async marcarDescartado(id, motivo, actorId): Promise<Lead> {
      const [fila] = await ejecutor
        .update(leads)
        .set({ status: "discarded", discardReason: motivo, updatedBy: actorId })
        .where(eq(leads.id, id))
        .returning();
      return fila!;
    },

    async marcarConvertido(id, negocioId, actorId): Promise<Lead> {
      const [fila] = await ejecutor
        .update(leads)
        .set({ status: "converted", convertedDealId: negocioId, updatedBy: actorId })
        .where(eq(leads.id, id))
        .returning();
      return fila!;
    },

    async primeraEtapaAbierta() {
      const [fila] = await ejecutor
        .select({ id: pipelineStages.id })
        .from(pipelineStages)
        .where(eq(pipelineStages.kind, "open"))
        .orderBy(asc(pipelineStages.position))
        .limit(1);
      return fila;
    },

    async crearNegocioDeLead(datos): Promise<Negocio> {
      const [fila] = await ejecutor
        .insert(deals)
        .values({
          contactId: datos.contactId,
          leadId: datos.leadId,
          stageId: datos.stageId,
          sourceId: datos.sourceId,
          brokerId: datos.brokerId,
          operationType: datos.operationType,
          currency: datos.currency,
          stageChangedAt: datos.stageChangedAt,
          createdBy: datos.createdBy,
          updatedBy: datos.updatedBy,
        })
        .returning();
      return fila!;
    },

    /**
     * Sin `Actor`: se escribe directamente en `audit_log` con `userId: null`
     * porque `auditar()` (y el puerto `Auditoria`) exigen un actor humano. Corre
     * con el mismo ejecutor que el cambio, o sea dentro de su transacción.
     */
    async registrarAuditoriaSinActor({ accion, entidad, entidadId, despues }): Promise<void> {
      await ejecutor.insert(auditLog).values({
        userId: null,
        action: accion,
        entityType: entidad,
        entityId: entidadId,
        newValue: JSON.stringify(despues),
      });
    },
  };
}

/** El juego transaccional: el repositorio del módulo más la auditoría, ambos ligados a `tx`. */
export function reposLeads(tx: Tx): ReposLeads {
  return { leads: repositorioLeads(tx), auditoria: auditoriaDrizzle(tx) };
}
