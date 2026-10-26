/**
 * Pruebas de T6 (auditoría). Sin base de datos, sin framework: `npm test` las
 * corre con el runner de Node, igual que `domain/rbac.test.ts` y
 * `infrastructure/rbac-filter.test.ts`.
 *
 * `rbac-filter.test.ts` prueba que el alcance se traduce al SQL correcto sin
 * conectar a Postgres, inspeccionando la condición compilada. Aquí se hace lo
 * equivalente para la escritura: un doble de `tx` que registra lo que
 * `auditar` intenta insertar, sin que exista una base de datos detrás.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { auditar } from "./audit.ts";
import { auditLog } from "./db/schema.ts";
import type { Actor } from "@/domain/rbac";

const actor: Actor = { userId: 3, roleSlug: "broker", permissions: [] };

/**
 * Doble de la transacción de Drizzle. Solo implementa `insert(tabla).values(fila)`
 * — lo único que `auditar` usa — y guarda cada intento en `inserted` en vez de
 * tocar Postgres.
 */
function fakeTx() {
  const inserted: { table: unknown; values: Record<string, unknown> }[] = [];
  const tx = {
    insert(table: unknown) {
      return {
        values(values: Record<string, unknown>) {
          inserted.push({ table, values });
          return Promise.resolve();
        },
      };
    },
  };
  return { tx: tx as unknown as Parameters<typeof auditar>[0], inserted };
}

test("serializa antes/después a JSON y escribe en la tabla audit_log", async () => {
  const { tx, inserted } = fakeTx();

  await auditar(tx, actor, {
    accion: "editar",
    entidad: "contact",
    entidadId: 5,
    antes: { phone: "8091234567" },
    despues: { phone: "8299876543" },
  });

  assert.equal(inserted.length, 1);
  assert.equal(inserted[0]!.table, auditLog);
  const fila = inserted[0]!.values;
  assert.equal(fila.previousValue, JSON.stringify({ phone: "8091234567" }));
  assert.equal(fila.newValue, JSON.stringify({ phone: "8299876543" }));
});

test("deja previousValue y newValue en null cuando antes/después no vienen", async () => {
  const { tx, inserted } = fakeTx();

  await auditar(tx, actor, { accion: "crear", entidad: "lead", entidadId: 9 });

  const fila = inserted[0]!.values;
  assert.equal(fila.previousValue, null);
  assert.equal(fila.newValue, null);
  // No la cadena "undefined": es null de verdad, lo que la columna espera.
  assert.notEqual(fila.previousValue, "undefined");
});

test("registra el autor, la acción y la entidad tal como se le pasan", async () => {
  const { tx, inserted } = fakeTx();

  await auditar(tx, actor, {
    accion: "cerrar",
    entidad: "deal",
    entidadId: 42,
    despues: { status: "won" },
  });

  const fila = inserted[0]!.values;
  assert.equal(fila.userId, actor.userId);
  assert.equal(fila.action, "cerrar");
  assert.equal(fila.entityType, "deal");
  assert.equal(fila.entityId, 42);
});

test("usa la transacción que recibe, no una conexión propia", async () => {
  // Si `auditar` abriera su propia conexión llamaría a `getDb()`, que exige
  // `DATABASE_URL` (ver `infrastructure/env.ts`). Sin esa variable, la
  // llamada solo puede tener éxito si de verdad escribió a través de `tx`.
  const original = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;
  try {
    const { tx, inserted } = fakeTx();
    await auditar(tx, actor, { accion: "crear", entidad: "contact", entidadId: 1 });
    assert.equal(inserted.length, 1);
  } finally {
    if (original !== undefined) process.env.DATABASE_URL = original;
  }
});

test("si la transacción falla (como en un rollback), auditar no absorbe el error", async () => {
  // No hay una base de datos real que revertir en esta prueba. Lo que sí se
  // puede probar sin ella es la precondición que hace posible el rollback: el
  // único camino de escritura de `auditar` es `tx.insert(...).values(...)`. Si
  // ese `tx` rechaza —como haría Drizzle cuando la transacción se revierte por
  // cualquier motivo—, `auditar` debe propagar el rechazo y no dejar constancia
  // de éxito. Un `auditar` que capturase el error y siguiera adelante sería el
  // fallo real: parecería auditado un cambio que nunca se aplicó.
  const txQueFalla = {
    insert() {
      return {
        values() {
          return Promise.reject(new Error("rollback: violación de restricción"));
        },
      };
    },
  } as unknown as Parameters<typeof auditar>[0];

  await assert.rejects(
    auditar(txQueFalla, actor, { accion: "crear", entidad: "contact", entidadId: 1 }),
  );
});
