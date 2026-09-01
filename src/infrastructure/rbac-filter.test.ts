/**
 * Pruebas del filtro de alcance (T3, lado SQL).
 *
 * `domain/rbac.test.ts` prueba **si** se puede. Esto prueba lo otro: que el
 * alcance concedido se convierte en el `WHERE` correcto. Es la mitad que de
 * verdad impide que un broker lea la cartera ajena — la decisión sin el filtro
 * no protege nada.
 *
 * No hace falta base de datos: se compila la condición y se inspecciona el SQL
 * que produce. La tabla es de mentira a propósito, para que la prueba no dependa
 * del esquema real y siga valiendo cuando el esquema cambie.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import type { SQL } from "drizzle-orm";
import { integer, pgTable, PgDialect, timestamp } from "drizzle-orm/pg-core";
import { scopeCondition, visibleRows } from "./rbac-filter.ts";

const tabla = pgTable("cosas", {
  brokerId: integer("broker_id"),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

const broker = { userId: 7, roleSlug: "broker", permissions: [] };

/** Compila la condición a SQL y parámetros, como haría Drizzle al consultar. */
function compilar(cond: SQL | undefined): { sql: string; params: unknown[] } {
  // Sin condición el `WHERE` queda vacío: cadena vacía, no `null`, para poder
  // afirmar sobre él sin comprobar el tipo en cada prueba.
  if (cond === undefined) return { sql: "", params: [] };
  const q = new PgDialect().sqlToQuery(cond);
  return { sql: q.sql, params: q.params };
}

test("alcance own filtra por el responsable, con el id del actor como parámetro", () => {
  const { sql, params } = compilar(scopeCondition(broker, "own", tabla.brokerId));
  assert.match(sql, /"broker_id"\s*=\s*\$1/);
  assert.deepEqual(params, [7]);
});

test("alcance all no añade condición: no hay nada que restringir", () => {
  assert.equal(scopeCondition(broker, "all", tabla.brokerId), undefined);
});

test("team filtra igual que own mientras no exista modelo de equipos", () => {
  const own = compilar(scopeCondition(broker, "own", tabla.brokerId));
  const team = compilar(scopeCondition(broker, "team", tabla.brokerId));
  assert.equal(team.sql, own.sql);
  assert.deepEqual(team.params, own.params);
});

test("alcance none no devuelve nada, aunque alguien se salte requireScope", () => {
  // Defensa en profundidad: si el 403 falla, la consulta tiene que salir vacía,
  // no devolver la tabla entera.
  const { sql } = compilar(scopeCondition(broker, "none", tabla.brokerId));
  assert.match(sql, /false/);
});

test("visibleRows descarta siempre la papelera además de aplicar el alcance", () => {
  const { sql, params } = compilar(
    visibleRows(broker, "own", tabla.brokerId, tabla.deletedAt),
  );
  assert.match(sql, /"deleted_at"\s+is\s+null/i);
  assert.match(sql, /"broker_id"\s*=\s*\$1/);
  assert.deepEqual(params, [7]);
});

test("visibleRows con alcance all sigue descartando la papelera", () => {
  // El caso que se olvida: un administrador lo ve todo, pero «todo» no incluye
  // lo borrado. Sin esto, la papelera reaparecería en los listados del admin.
  const { sql } = compilar(
    visibleRows(broker, "all", tabla.brokerId, tabla.deletedAt),
  );
  assert.match(sql, /"deleted_at"\s+is\s+null/i);
  assert.doesNotMatch(sql, /"broker_id"/);
});
