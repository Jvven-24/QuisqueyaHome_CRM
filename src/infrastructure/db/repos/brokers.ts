/**
 * Adaptador Drizzle de Brokers (`application/brokers/puertos.ts`).
 *
 * SQL calcado del que vivía en `api/brokers/[id]/proyectos/route.ts`. Una sola
 * consulta (`proyectosRelevantes`, con `OR`) cubre validar los proyectos pedidos
 * y la foto "antes" de la auditoría. El universo es "activo, no borrado":
 * exactamente lo que el modal de `/brokers` ofrece marcar; un proyecto inactivo
 * asignado hoy a este broker no entra, así que nunca cae en "a quitar" (bug de
 * la revisión de spec, issue #33).
 */

import { and, eq, inArray, isNull, or } from "drizzle-orm";
import type { BrokerAsignable, Proyecto, RepositorioBrokers, ReposBrokers } from "../../../application/brokers/puertos";
import { brokerProfiles, projects, users } from "../schema";
import { auditoriaDrizzle, type Tx } from "./compartido";

export function repositorioBrokers(tx: Tx): RepositorioBrokers {
  return {
    async buscarBroker(brokerId): Promise<BrokerAsignable | undefined> {
      const [broker] = await tx
        .select({ userId: brokerProfiles.userId, isActive: users.isActive, deletedAt: users.deletedAt })
        .from(brokerProfiles)
        .innerJoin(users, eq(users.id, brokerProfiles.userId))
        .where(eq(brokerProfiles.userId, brokerId))
        .limit(1);
      return broker;
    },

    async proyectosRelevantes(brokerId, idsSolicitados): Promise<Proyecto[]> {
      const universoCondicion = and(eq(projects.isActive, true), isNull(projects.deletedAt));
      return idsSolicitados.length > 0
        ? tx
            .select()
            .from(projects)
            .where(
              and(or(inArray(projects.id, [...idsSolicitados]), eq(projects.brokerId, brokerId)), universoCondicion),
            )
        : tx.select().from(projects).where(and(eq(projects.brokerId, brokerId), universoCondicion));
    },

    async asignar(ids, brokerId, actorId): Promise<Proyecto[]> {
      return tx
        .update(projects)
        .set({ brokerId, updatedBy: actorId })
        .where(inArray(projects.id, [...ids]))
        .returning();
    },

    async desasignar(ids, actorId): Promise<Proyecto[]> {
      return tx
        .update(projects)
        .set({ brokerId: null, updatedBy: actorId })
        .where(inArray(projects.id, [...ids]))
        .returning();
    },
  };
}

/** El juego transaccional: el repositorio del módulo más la auditoría, ambos ligados a `tx`. */
export function reposBrokers(tx: Tx): ReposBrokers {
  return { brokers: repositorioBrokers(tx), auditoria: auditoriaDrizzle(tx) };
}
