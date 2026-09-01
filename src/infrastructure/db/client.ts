/**
 * Cliente de base de datos (T4). Única puerta a Postgres.
 *
 * Ningún módulo abre su propia conexión: una conexión por módulo agota el pool
 * de Supabase con tres personas trabajando a la vez.
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { databaseUrl } from "../env";
import * as schema from "./schema";

/**
 * En desarrollo, Next.js recarga los módulos en caliente y cada recarga abriría
 * un pool nuevo. Se cachea en `globalThis`, que sí sobrevive a la recarga.
 */
const globalForDb = globalThis as unknown as {
  crmDb?: ReturnType<typeof build>;
};

function build() {
  const sql = postgres(databaseUrl(), {
    // Supabase enruta por PgBouncer en modo transacción, que no admite
    // sentencias preparadas.
    prepare: false,
    max: 10,
  });
  return drizzle(sql, { schema });
}

/**
 * La conexión se arma en la primera consulta, no al importar el módulo: el
 * `next build` carga todos los módulos para descubrir las rutas, y ahí todavía
 * no hay variables de entorno de base de datos.
 */
export function getDb() {
  const existing = globalForDb.crmDb ?? build();
  if (process.env.NODE_ENV !== "production") globalForDb.crmDb = existing;
  return existing;
}

export type Db = ReturnType<typeof getDb>;

/**
 * Transacción. Es el único camino para una operación que toca más de una tabla.
 *
 * Existe por el cierre transaccional de `MAPEO_FRONTEND_CRM.md` §10.2: siete
 * pasos que deben aplicarse todos o ninguno. Un fallo parcial ahí no da error,
 * deja metas y comisiones incorrectas en silencio.
 */
export function transaction<T>(
  fn: (tx: Parameters<Parameters<Db["transaction"]>[0]>[0]) => Promise<T>,
): Promise<T> {
  return getDb().transaction(fn);
}
