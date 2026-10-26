/**
 * Adaptador Drizzle de Leads (`application/leads/puertos.ts`).
 *
 * Garantías de concurrencia que NO deben simplificarse:
 * - reserva transaccional de la clave externa antes de cualquier efecto,
 *   con recibo durable en la auditoría (F05);
 * - lectura con alcance y bloqueo de fila para convertir (F06);
 *
 * - `crearLeadExternoSiNoExiste`: `INSERT ... ON CONFLICT DO NOTHING` sobre el
 *   índice único PARCIAL `leads_external_id_unq`, con su `where`, y solo si no
 *   insertó, un `SELECT` de respaldo de la fila activa. Es la defensa final
 *   contra escritores que no respeten la reserva (decisión #20).
 *
 * Acepta la transacción o la conexión suelta (`Ejecutor`) porque las lecturas
 * previas (duplicados, contacto, candidatos a broker) corren fuera del `BEGIN`,
 * como antes. Los `update` arman el `set` campo por campo, nunca esparciendo un
 * parámetro.
 */

import { createHash } from "node:crypto";
import { and, asc, eq, isNull, or, sql } from "drizzle-orm";
import { ConflictError } from "../../../domain/errors";
import type {
  CandidatoBroker,
  Contacto,
  Lead,
  Negocio,
  RepositorioLeads,
  ReposLeads,
} from "../../../application/leads/puertos";
import type { Db } from "../client";
import { auditLog, brokerProfiles, contacts, deals, leads, pipelineStages, users } from "../schema";
import { visibleRows } from "../../rbac-filter";
import { auditoriaDrizzle, type Tx } from "./compartido";

/** La transacción o la conexión suelta. */
export type Ejecutor = Tx | Db;

export function repositorioLeads(ejecutor: Ejecutor, transaccional = false): RepositorioLeads {
  async function exigirTransaccion() {
    if (!transaccional) throw new Error("La reserva de Leads requiere una transacción.");
    // Ambas reservas son la primera operación de su unidad de trabajo.
    // Declarar el aislamiento evita heredar un snapshot anterior al ganador.
    await ejecutor.execute(sql`set transaction isolation level read committed`);
  }
  const hash = (valor: string) => createHash("sha256").update(valor).digest("hex");
  const claveCaptura = (externalId: string) => hash(`leads:webhook:v1:${externalId}`);
  return {
    // --- lecturas previas a la transacción ---------------------------------

    async candidatosDuplicados({ phone, email }, actor, alcanceLectura) {
      const coincidencia = or(phone ? eq(contacts.phone, phone) : undefined, email ? eq(contacts.email, email) : undefined);
      // La existencia global conserva el aviso (#19) sin cargar la ficha ajena.
      const [duplicado] = await ejecutor.select({ id: contacts.id }).from(contacts)
        .where(and(isNull(contacts.deletedAt), coincidencia)).limit(1);
      if (!duplicado || alcanceLectura === "none") return { existe: Boolean(duplicado), candidatos: [] };
      const candidatos = await ejecutor
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
            coincidencia,
            visibleRows(actor, alcanceLectura, contacts.brokerId, contacts.deletedAt),
          ),
        );
      return { existe: true, candidatos };
    },

    async contactoExiste(id): Promise<boolean> {
      const [fila] = await ejecutor.select({ id: contacts.id }).from(contacts)
        .where(and(eq(contacts.id, id), isNull(contacts.deletedAt))).limit(1);
      return Boolean(fila);
    },

    async contactoVisible(id, actor, alcance): Promise<boolean> {
      const [fila] = await ejecutor
        .select({ id: contacts.id })
        .from(contacts)
        .where(and(eq(contacts.id, id), visibleRows(actor, alcance, contacts.brokerId, contacts.deletedAt)))
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

    async buscarLeadParaConversion(id, actor, alcance): Promise<Lead | undefined> {
      await exigirTransaccion();
      const [fila] = await ejecutor.select().from(leads)
        .where(and(eq(leads.id, id), visibleRows(actor, alcance, leads.brokerId, leads.deletedAt)))
        .limit(1).for("update", { of: leads });
      return fila;
    },

    async bloquearCapturaExterna(externalId, payload): Promise<Lead | undefined> {
      await exigirTransaccion();
      // Namespace propio, clave parametrizada, bloqueo hasta commit/rollback.
      // READ COMMITTED: la consulta siguiente ve el recibo del ganador tras esperar.
      const clave = claveCaptura(externalId);
      const bloqueo = BigInt.asIntN(64, BigInt(`0x${clave.slice(0, 16)}`)).toString();
      await ejecutor.execute(sql`select pg_advisory_xact_lock(${bloqueo}::bigint)`);
      const [recibo] = await ejecutor.select({ antes: auditLog.previousValue, despues: auditLog.newValue })
        .from(auditLog).where(and(
          eq(auditLog.entityType, "lead"), eq(auditLog.action, "crear"), isNull(auditLog.userId),
          sql`${auditLog.previousValue}::jsonb ->> 'captureKey' = ${clave}`,
        )).limit(1);
      if (recibo) {
        const metadatos = JSON.parse(recibo.antes!);
        if (metadatos.payloadHash !== hash(payload)) {
          throw new ConflictError("La clave externa ya se usó con otros datos.");
        }
        // Snapshot original, no la fila que un usuario pudo editar o borrar.
        const fila: Lead = JSON.parse(recibo.despues!);
        fila.receivedAt = new Date(fila.receivedAt);
        fila.createdAt = new Date(fila.createdAt);
        fila.updatedAt = new Date(fila.updatedAt);
        fila.firstContactedAt = fila.firstContactedAt ? new Date(fila.firstContactedAt) : null;
        fila.deletedAt = fila.deletedAt ? new Date(fila.deletedAt) : null;
        return fila;
      }
      // Claves anteriores al recibo (incluso borradas): no inventar su payload.
      const [historico] = await ejecutor.select({ id: leads.id }).from(leads)
        .where(eq(leads.externalId, externalId)).limit(1);
      if (historico) throw new ConflictError("La captura externa requiere reconciliación.");
      return undefined;
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
      const [existente] = await ejecutor.select().from(leads)
        .where(and(eq(leads.externalId, datos.externalId), isNull(leads.deletedAt))).limit(1);
      if (!existente) throw new ConflictError("La captura externa requiere reconciliación.");
      return { lead: existente!, creado: false };
    },

    async reclamarDisponible(id, brokerId, actorId): Promise<Lead> {
      const [fila] = await ejecutor.update(leads).set({brokerId,status:"assigned",updatedBy:actorId})
        .where(and(eq(leads.id,id),isNull(leads.brokerId),isNull(leads.deletedAt),or(eq(leads.status,"new"),eq(leads.status,"assigned")))).returning();
      if(!fila) throw new ConflictError("Este lead ya no está disponible.");
      return fila;
    },
    async actualizarCalificacion(id, datos, actorId): Promise<Lead> {
      const [fila] = await ejecutor.update(leads).set({
        budgetMinCents: datos.budgetMinCents, budgetMaxCents: datos.budgetMaxCents,
        currency: datos.currency, projectInterestText: datos.projectInterestText,
        zoneInterest: datos.zoneInterest, operationType: datos.operationType, updatedBy: actorId,
      }).where(eq(leads.id, id)).returning();
      return fila!;
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
    async registrarAuditoriaSinActor({ accion, entidad, entidadId, despues, captura }): Promise<void> {
      await ejecutor.insert(auditLog).values({
        userId: null,
        action: accion,
        entityType: entidad,
        entityId: entidadId,
        previousValue: captura ? JSON.stringify({
          captureKey: claveCaptura(captura.externalId),
          payloadHash: hash(captura.payload),
        }) : null,
        newValue: JSON.stringify(despues),
      });
    },
  };
}

/** El juego transaccional: el repositorio del módulo más la auditoría, ambos ligados a `tx`. */
export function reposLeads(tx: Tx): ReposLeads {
  return { leads: repositorioLeads(tx, true), auditoria: auditoriaDrizzle(tx) };
}
