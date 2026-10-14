import { sql } from "drizzle-orm";
import type { EstadoOutbox } from "@/application/compartido/outbox-estado";
import type { Db } from "@/infrastructure/db/client";
import { outbox } from "@/infrastructure/db/schema";

/** Conteos reales de la cola. Solo lectura; no toca ni reintenta eventos. */
export async function consultarEstadoOutbox(db: Db): Promise<EstadoOutbox> {
  const [fila] = await db
    .select({
      pendientes: sql<number>`count(*) filter (where ${outbox.sentAt} is null and ${outbox.deadAt} is null)::int`,
      enviados: sql<number>`count(*) filter (where ${outbox.sentAt} is not null)::int`,
      fallidos: sql<number>`count(*) filter (where ${outbox.deadAt} is not null)::int`,
      ultimoEnviadoAt: sql<Date | string | null>`max(${outbox.sentAt})`,
    })
    .from(outbox);
  return {
    pendientes: fila?.pendientes ?? 0,
    enviados: fila?.enviados ?? 0,
    fallidos: fila?.fallidos ?? 0,
    ultimoEnviadoAt: fila?.ultimoEnviadoAt ? new Date(fila.ultimoEnviadoAt) : null,
  };
}
