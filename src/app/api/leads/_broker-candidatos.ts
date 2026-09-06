/**
 * M2 · Leads — candidatos para la asignación sugerida (decisión #21).
 *
 * Pequeño helper de consulta, compartido por el alta manual
 * (`app/api/leads/route.ts`) y el endpoint externo (`app/api/leads/externo/route.ts`):
 * las dos vías necesitan la misma lista de brokers activos con perfil, y
 * duplicar la consulta en dos archivos es el tipo de cosa que diverge sola con
 * el tiempo. No es un repositorio (decisión #16): es una consulta de Drizzle
 * de una sola tabla, sin interfaz ni implementación alternativa — vive junto a
 * las rutas que la usan, no en `infrastructure/`.
 *
 * La decisión de a cuál sugerir es dominio puro (`domain/asignacion-lead.ts`);
 * esto solo arma la lista de candidatos que esa función recibe.
 */

import { and, eq, isNull } from "drizzle-orm";
import type { BrokerCandidato } from "@/domain/asignacion-lead";
import { getDb, type Db } from "@/infrastructure/db/client";
import { brokerProfiles, users } from "@/infrastructure/db/schema";

export async function candidatosBroker(
  db: Db = getDb(),
): Promise<BrokerCandidato[]> {
  const filas = await db
    .select({
      userId: brokerProfiles.userId,
      specialty: brokerProfiles.specialty,
      handlesRentals: brokerProfiles.handlesRentals,
      annualSalesCents: brokerProfiles.annualSalesCents,
    })
    .from(brokerProfiles)
    .innerJoin(users, eq(users.id, brokerProfiles.userId))
    .where(and(eq(users.isActive, true), isNull(users.deletedAt)));

  return filas;
}
