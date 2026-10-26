import { sql } from "drizzle-orm";
import type { EstadoOutbox } from "@/application/compartido/outbox-estado";
import type { Db } from "@/infrastructure/db/client";
import { outbox } from "@/infrastructure/db/schema";

/**
 * Conteos reales de la cola. Solo lectura; no toca ni reintenta eventos.
 * `tiposConsumidos` son los tipos con manejador registrado: los pendientes de cualquier otro tipo
 * se cuentan aparte como «sin consumidor» (siguen pendientes, el worker no los reclama).
 */
export async function consultarEstadoOutbox(db: Db, tiposConsumidos: readonly string[]): Promise<EstadoOutbox> {
  const sinConsumidor = tiposConsumidos.length === 0
    ? sql`true`
    : sql`${outbox.eventType} not in (${sql.join(tiposConsumidos.map((tipo) => sql`${tipo}`), sql`, `)})`;
  const [fila] = await db
    .select({
      pendientes: sql<number>`count(*) filter (where ${outbox.sentAt} is null and ${outbox.deadAt} is null)::int`,
      enviados: sql<number>`count(*) filter (where ${outbox.sentAt} is not null)::int`,
      fallidos: sql<number>`count(*) filter (where ${outbox.deadAt} is not null)::int`,
      sinConsumidor: sql<number>`count(*) filter (where ${outbox.sentAt} is null and ${outbox.deadAt} is null and ${sinConsumidor})::int`,
      ultimoEnviadoAt: sql<Date | string | null>`max(${outbox.sentAt})`,
    })
    .from(outbox);
  return {
    pendientes: fila?.pendientes ?? 0,
    enviados: fila?.enviados ?? 0,
    fallidos: fila?.fallidos ?? 0,
    sinConsumidor: fila?.sinConsumidor ?? 0,
    ultimoEnviadoAt: fila?.ultimoEnviadoAt ? new Date(fila.ultimoEnviadoAt) : null,
  };
}
