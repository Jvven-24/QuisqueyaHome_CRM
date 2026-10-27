/** Adaptador Postgres de `idempotencia.ts` sobre `transaction_commands`. */

import { and, eq, sql } from "drizzle-orm";
import { requireActor } from "./auth/actor";
import { getDb } from "./db/client";
import { transactionCommands } from "./db/schema";
import { errorResponse } from "./http";
import { claveIdempotencia, ejecutarIdempotente, type AlmacenIdempotencia } from "./idempotencia";

function donde(actorId: number, operation: string, key: string) {
  return and(eq(transactionCommands.actorId, actorId), eq(transactionCommands.operation, operation), eq(transactionCommands.idempotencyKey, key));
}

export const almacenIdempotenciaDb: AlmacenIdempotencia = {
  async reservar(actorId, operation, key, requestHash) {
    const db = getDb();
    const insertado = await db
      .insert(transactionCommands)
      .values({ actorId, operation, idempotencyKey: key, requestHash, status: "processing" })
      .onConflictDoNothing()
      .returning({ id: transactionCommands.id });
    if (insertado.length) return null;
    const [fila] = await db
      .select({ status: transactionCommands.status, requestHash: transactionCommands.requestHash })
      .from(transactionCommands)
      .where(donde(actorId, operation, key))
      .limit(1);
    return fila ?? { status: "processing", requestHash };
  },
  async completar(actorId, operation, key, httpStatus) {
    await getDb()
      .update(transactionCommands)
      .set({ status: "completed", httpStatus, resultCode: "OK", completedAt: sql`clock_timestamp()`, retainUntil: sql`clock_timestamp() + interval '5 years 1 day'` })
      .where(donde(actorId, operation, key));
  },
  async liberar(actorId, operation, key) {
    await getDb().delete(transactionCommands).where(and(donde(actorId, operation, key), eq(transactionCommands.status, "processing")));
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
