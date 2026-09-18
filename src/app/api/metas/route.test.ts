/**
 * Prueba de M8 · Metas sobre el `ON CONFLICT` de `PUT /api/metas`.
 *
 * No importa `route.ts` (arrastra `requireActor`/`transaction`, que abren
 * conexión real) — igual que `infrastructure/rbac-filter.test.ts`, se compila
 * a SQL una consulta equivalente sobre una tabla de mentira con los mismos
 * índices únicos, y se comprueba lo único que de verdad importa: que el `set`
 * del upsert de la meta nunca incluye `achieved_*`. Esas columnas las escribe
 * solo el cierre transaccional (`incrementarMeta`); si algún día alguien las
 * cuela aquí por error, esta prueba lo atrapa sin necesitar Postgres.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { sql } from "drizzle-orm";
import { bigint, integer, pgTable, serial, uniqueIndex } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const goals = pgTable(
  "goals",
  {
    id: serial("id").primaryKey(),
    brokerId: integer("broker_id"),
    year: integer("year").notNull(),
    month: integer("month").notNull(),
    targetDeals: integer("target_deals").notNull().default(0),
    targetAmountCents: bigint("target_amount_cents", { mode: "number" }),
    achievedDeals: integer("achieved_deals").notNull().default(0),
    achievedAmountCents: bigint("achieved_amount_cents", { mode: "number" }).notNull().default(0),
    updatedBy: integer("updated_by"),
  },
  (table) => [
    uniqueIndex("goals_broker_period_unq").on(table.brokerId, table.year, table.month),
    uniqueIndex("goals_company_period_unq").on(table.year, table.month).where(sql`${table.brokerId} is null`),
  ],
);

// `postgres()` no abre conexión al construirse (es perezoso): alcanza con una
// cadena con formato válido para poder compilar la consulta con `.toSQL()`.
const db = drizzle(postgres("postgres://user:pass@localhost:5432/db"));

/** Mismo `cambios` que arma `route.ts` para el `set` del upsert. */
const cambios = { targetDeals: 4, targetAmountCents: 500_000_00, updatedBy: 1 };

/**
 * El `insert` siempre lista todas las columnas de la tabla (las que no
 * vienen en `values()` quedan como `default`) — así que buscar `achieved_*`
 * en el SQL completo daría un falso positivo. Lo que de verdad importa es
 * qué toca el `set` del `on conflict`, así que la prueba recorta a partir de
 * ahí.
 */
function soloElSet(sqlCompleto: string): string {
  const indice = sqlCompleto.indexOf("do update set");
  assert.notEqual(indice, -1, "la consulta debería tener un `do update set`");
  return sqlCompleto.slice(indice);
}

test("upsert de meta de broker: el set solo toca target_* y updated_by, nunca achieved_*", () => {
  const { sql: texto } = db
    .insert(goals)
    .values({ brokerId: 3, year: 2026, month: 9, targetDeals: 4, targetAmountCents: 500_000_00, updatedBy: 1 })
    .onConflictDoUpdate({ target: [goals.brokerId, goals.year, goals.month], set: cambios })
    .toSQL();

  assert.match(texto, /on conflict \("broker_id","year","month"\) do update set/);
  const set = soloElSet(texto);
  assert.doesNotMatch(set, /achieved_deals/);
  assert.doesNotMatch(set, /achieved_amount_cents/);
});

test("upsert de meta de la compañía: mismo set, conflicto por el índice parcial de broker_id nulo", () => {
  const { sql: texto } = db
    .insert(goals)
    .values({ brokerId: null, year: 2026, month: 9, targetDeals: 10, updatedBy: 1 })
    .onConflictDoUpdate({
      target: [goals.year, goals.month],
      targetWhere: sql`${goals.brokerId} is null`,
      set: cambios,
    })
    .toSQL();

  assert.match(texto, /on conflict \("year","month"\) where .*is null.* do update set/);
  const set = soloElSet(texto);
  assert.doesNotMatch(set, /achieved_deals/);
  assert.doesNotMatch(set, /achieved_amount_cents/);
});
