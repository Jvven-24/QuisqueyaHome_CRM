import { randomUUID } from "node:crypto";
import { and, asc, eq, isNull, lte, sql } from "drizzle-orm";
import type { OutboxCrm } from "@/application/compartido/crm";
import type { Db } from "@/infrastructure/db/client";
import { externalRefs, outbox, outboxDead } from "@/infrastructure/db/schema";
import type { ColaOutbox } from "./worker";

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

export function outboxDrizzle(tx: Tx): OutboxCrm {
  return {
    async emitir(evento) {
      const eventId = randomUUID();
      await tx.insert(outbox).values({
        eventId, eventType: evento.tipo, version: 1, aggregateId: evento.aggregateId,
        correlationId: eventId, payload: evento.payload, idempotencyKey: eventId,
      });
    },
  };
}

/** Solo adaptador local en esta fase. Una llamada externa no debe mantener el lock. */
export function colaOutboxDrizzle(db: Db): ColaOutbox {
  return {
    conSiguiente(cuando, procesar) {
      return db.transaction(async (tx) => {
        const [evento] = await tx.select().from(outbox)
          .where(and(isNull(outbox.sentAt), isNull(outbox.deadAt), lte(outbox.availableAt, cuando)))
          .orderBy(asc(outbox.createdAt), asc(outbox.eventId)).limit(1).for("update", { skipLocked: true });
        if (!evento) return false;
        const intento = evento.attempts + 1;
        await procesar({
          evento,
          async enviado(ref, entityType, localId, fecha) {
            await tx.insert(externalRefs).values({ entityType, localId, system: ref.system, externalId: ref.externalId, version: evento.version, syncedAt: fecha })
              .onConflictDoUpdate({
                target: [externalRefs.entityType, externalRefs.localId, externalRefs.system],
                set: { externalId: ref.externalId, version: evento.version, syncedAt: fecha },
                setWhere: sql`${externalRefs.version} <= ${evento.version}`,
              });
            await tx.update(outbox).set({ sentAt: fecha, attempts: intento, lastFailure: null,
              attemptHistory: [...evento.attemptHistory, { attempt: intento, at: fecha.toISOString(), outcome: "SENT" }],
            }).where(eq(outbox.eventId, evento.eventId));
          },
          async fallido(clase, proximo, fecha) {
            await tx.update(outbox).set({
              attempts: intento, lastFailure: clase,
              availableAt: proximo ?? evento.availableAt, deadAt: proximo === null ? fecha : null,
              attemptHistory: [...evento.attemptHistory, { attempt: intento, at: fecha.toISOString(), outcome: clase }],
            }).where(eq(outbox.eventId, evento.eventId));
            if (proximo === null) await tx.insert(outboxDead).values({ eventId: evento.eventId, reason: clase, failedAt: fecha });
          },
        });
        return true;
      });
    },
  };
}
