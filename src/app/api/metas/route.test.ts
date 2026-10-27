/**
 * Prueba del invariante de `goals` (M8 · Metas, decisión #35): `goals` la
 * escriben DOS módulos con mitades opuestas. Metas (`repos/metas.ts`) escribe
 * SOLO `target_*`; el cierre de pipeline (`repos/pipeline.ts`,
 * `incrementarMetaAlcanzada`) escribe SOLO `achieved_*`. Nada lo enforcea salvo
 * esta prueba.
 *
 * No importa `route.ts` ni el adaptador real (arrastran `requireActor`/`db`, que
 * abren conexión real, y usan el alias `@/` que `node --test` no resuelve). Dos
 * técnicas, porque cada una cubre lo que la otra no:
 *
 * 1. Se compila a SQL (`.toSQL()`) un upsert equivalente sobre una tabla de
 *    mentira con los mismos índices únicos, como `infrastructure/rbac-filter.test.ts`.
 *    Comprueba el SQL que genera Drizzle para esa forma de `set`, pero es una
 *    COPIA: si alguien cambia el adaptador, esta parte no se entera.
 * 2. Se LEE el código fuente de los dos adaptadores (como `arquitectura.test.ts`)
 *    y se comprueba que el `set` de cada uno solo nombra su mitad. Esta sí cae
 *    si se cuela `achieved_*` en `repos/metas.ts` o `target_*` en `repos/pipeline.ts`.
 *
 * Esta prueba vive aquí y no en `application/metas/` porque `application/` no
 * puede importar `drizzle-orm` (`arquitectura.test.ts`).
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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

// Una prueba que solo comprueba ausencias pasaría también con un upsert vacío:
// se comprueba además lo que SÍ debe escribir.

test("upsert de meta de broker: el set sí escribe target_deals, target_amount_cents y updated_by", () => {
  const { sql: texto } = db
    .insert(goals)
    .values({ brokerId: 3, year: 2026, month: 9, targetDeals: 4, targetAmountCents: 500_000_00, updatedBy: 1 })
    .onConflictDoUpdate({ target: [goals.brokerId, goals.year, goals.month], set: cambios })
    .toSQL();

  const set = soloElSet(texto);
  assert.match(set, /"target_deals" = \$/);
  assert.match(set, /"target_amount_cents" = \$/);
  assert.match(set, /"updated_by" = \$/);
});

test("upsert de meta de la compañía: el set sí escribe target_* y updated_by", () => {
  const { sql: texto } = db
    .insert(goals)
    .values({ brokerId: null, year: 2026, month: 9, targetDeals: 10, updatedBy: 1 })
    .onConflictDoUpdate({
      target: [goals.year, goals.month],
      targetWhere: sql`${goals.brokerId} is null`,
      set: cambios,
    })
    .toSQL();

  const set = soloElSet(texto);
  assert.match(set, /"target_deals" = \$/);
  assert.match(set, /"target_amount_cents" = \$/);
  assert.match(set, /"updated_by" = \$/);
});

// --- el código real de los dos adaptadores -----------------------------------

function leerAdaptador(nombre: string): string {
  // Ruta en dos tramos a propósito: es lectura de texto, no un import, y así el
  // grep de acoplamiento a la base sobre las rutas no la confunde con un import.
  const infraestructura = new URL("../../../infrastructure/", import.meta.url);
  return readFileSync(new URL(`db/repos/${nombre}.ts`, infraestructura), "utf8");
}

/** Quita comentarios (`/* *\/` y `//`) para mirar solo el código. */
function sinComentarios(codigo: string): string {
  return codigo.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

/** Contenido de cada `set: { ... }` (con llaves balanceadas: hay `${...}` dentro). */
function bloquesSet(codigo: string): string[] {
  const bloques: string[] = [];
  for (const m of codigo.matchAll(/\bset:\s*\{/g)) {
    let profundidad = 1;
    let i = m.index! + m[0].length;
    const inicio = i;
    while (i < codigo.length && profundidad > 0) {
      if (codigo[i] === "{") profundidad++;
      else if (codigo[i] === "}") profundidad--;
      i++;
    }
    bloques.push(codigo.slice(inicio, i - 1));
  }
  return bloques;
}

test("adaptador real de metas: ningún achieved_* en el código, dos upserts y el targetWhere de la compañía", () => {
  const codigo = sinComentarios(leerAdaptador("metas"));

  assert.doesNotMatch(codigo, /achieved/i, "repos/metas.ts jamás debe nombrar las columnas de lo alcanzado");
  assert.equal(codigo.match(/\.onConflictDoUpdate\(/g)?.length, 2, "una rama para el broker y otra para la compañía");
  assert.match(codigo, /target:\s*\[goals\.brokerId, goals\.year, goals\.month\]/);
  assert.match(codigo, /target:\s*\[goals\.year, goals\.month\][\s\S]*targetWhere:\s*sql`\$\{goals\.brokerId\} is null`/);
});

test("adaptador real de metas: lo que escribe en el conflicto es target_* y updated_by", () => {
  const codigo = sinComentarios(leerAdaptador("metas"));
  const cambiosDeclarados = codigo.match(/const cambios = \{([\s\S]*?)\};/);
  assert.ok(cambiosDeclarados, "debería existir `const cambios = { ... }`");
  assert.match(cambiosDeclarados[1]!, /targetDeals/);
  assert.match(cambiosDeclarados[1]!, /montoInput/);
  assert.match(cambiosDeclarados[1]!, /updatedBy/);
  assert.equal(codigo.match(/set:\s*cambios/g)?.length, 2);
});

test("adaptador real de pipeline (la otra mitad): el set de incrementarMetaAlcanzada solo escribe achieved_* y updated_by, nunca target_*", () => {
  const codigo = sinComentarios(leerAdaptador("pipeline"));
  const inicio = codigo.indexOf("async incrementarMetaAlcanzada");
  const fin = codigo.indexOf("async buscarPerfilDeBroker");
  assert.ok(inicio !== -1 && fin > inicio, "no se encontró incrementarMetaAlcanzada");

  const sets = bloquesSet(codigo.slice(inicio, fin));
  assert.equal(sets.length, 2, "una rama para el broker y otra para la compañía");
  for (const set of sets) {
    assert.match(set, /achievedDeals/);
    assert.match(set, /achievedAmountCents/);
    assert.match(set, /updatedBy/);
    assert.doesNotMatch(set, /target/i, "el cierre jamás debe escribir la meta");
  }
});
