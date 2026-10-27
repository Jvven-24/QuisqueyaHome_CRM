/** Adaptador Postgres de `idempotencia.ts` sobre `transaction_commands`. */

import { and, eq, lt, sql } from "drizzle-orm";
import { requireActor } from "./auth/actor";
import { getDb } from "./db/client";
import { httpIdempotency } from "./db/schema";
import { errorResponse } from "./http";
import { claveIdempotencia, ejecutarIdempotente, type AlmacenIdempotencia } from "./idempotencia";

function donde(actorId: number, operation: string, key: string) {
  return and(eq(httpIdempotency.actorId, actorId), eq(httpIdempotency.operation, operation), eq(httpIdempotency.idempotencyKey, key));
}

export const almacenIdempotenciaDb: AlmacenIdempotencia = {
  async reservar(actorId, operation, key, requestHash) {
    const db = getDb();
    // Una reserva `processing` de más de 2 min es de un proceso caído: se libera.
    await db.delete(httpIdempotency).where(and(donde(actorId, operation, key), eq(httpIdempotency.status, "processing"), lt(httpIdempotency.createdAt, sql`clock_timestamp() - interval '2 minutes'`)));
    const insertado = await db
      .insert(httpIdempotency)
      .values({ actorId, operation, idempotencyKey: key, requestHash, status: "processing" })
      .onConflictDoNothing({ target: [httpIdempotency.actorId, httpIdempotency.operation, httpIdempotency.idempotencyKey] })
      .returning({ id: httpIdempotency.id });
    if (insertado.length) return null;
    const [fila] = await db
      .select({ status: httpIdempotency.status, requestHash: httpIdempotency.requestHash })
      .from(httpIdempotency)
      .where(donde(actorId, operation, key))
      .limit(1);
    return fila ?? { status: "processing", requestHash };
  },
  async completar(actorId, operation, key, httpStatus) {
    await getDb()
      .update(httpIdempotency)
      .set({ status: "completed", httpStatus, completedAt: sql`clock_timestamp()` })
      .where(donde(actorId, operation, key));
  },
  async liberar(actorId, operation, key) {
    await getDb().delete(httpIdempotency).where(and(donde(actorId, operation, key), eq(httpIdempotency.status, "processing")));
  },
};

/** Envuelve un handler de ruta: respeta `Idempotency-Key` si la UI lo manda. */
export function conIdempotencia<C>(operation: string, handler: (request: Request, contexto: C) => Promise<Response>) {
  return async (request: Request, contexto: C): Promise<Response> => {
    const key = claveIdempotencia(request);
    if (!key) return handler(request, contexto);
    try {
      const actor = await requireActor();
      const cuerpo = await request.clone().text();
      const ruta = new URL(request.url).pathname;
      return await ejecutarIdempotente(almacenIdempotenciaDb, { actorId: actor.userId, operation: `${operation} ${request.method} ${ruta}`, key, cuerpo }, () => handler(request, contexto));
    } catch (error) {
      return errorResponse(error);
    }
  };
}
