/**
 * Pruebas del filtro de alcance (T3, lado SQL).
 *
 * `domain/rbac.test.ts` prueba **si** se puede. Esto prueba lo otro: que el
 * alcance concedido se convierte en el `WHERE` correcto. Es la mitad que de
 * verdad impide que un broker lea la cartera ajena — la decisión sin el filtro
 * no protege nada.
 *
 * No hace falta base de datos: se compila la condición y se inspecciona el SQL
 * que produce. Las pruebas de columna usan una tabla sintética; las relaciones
 * M40 usan el esquema real para comprobar sus caminos y aliases.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { and, eq, sql, type SQL } from "drizzle-orm";
import { alias, integer, pgTable, PgDialect, timestamp } from "drizzle-orm/pg-core";
import {
  scopeCondition, visibleRows, visibleHolds, visibleReservas, visiblePlanes, visiblePagos,
} from "./rbac-filter.ts";
import {
  holds, reservations, paymentPlans, payments, paymentInstallments, paymentPlanVersions,
  paymentAllocations, paymentReversals,
} from "./db/schema.ts";

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

test("team sin equipo filtra igual que own", () => {
  const own = compilar(scopeCondition(broker, "own", tabla.brokerId));
  const team = compilar(scopeCondition(broker, "team", tabla.brokerId));
  assert.equal(team.sql, own.sql);
  assert.deepEqual(team.params, own.params);
});

test("team con equipo incluye al gerente y a sus miembros, nadie más", () => {
  const gerente = { userId: 10, roleSlug: "manager", permissions: [], teamUserIds: [21, 22] };
  const { sql, params } = compilar(scopeCondition(gerente, "team", tabla.brokerId));
  assert.match(sql, /"broker_id"\s+in\s+\(\$1, \$2, \$3\)/);
  assert.deepEqual(params, [10, 21, 22]);
});

test("own ignora teamUserIds: no hay escalada por pertenecer a un equipo", () => {
  const gerente = { userId: 10, roleSlug: "manager", permissions: [], teamUserIds: [21] };
  const { params } = compilar(scopeCondition(gerente, "own", tabla.brokerId));
  assert.deepEqual(params, [10]);
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

// TX-43: compilación PostgreSQL de la relación real, incluyendo aliases de la
// tabla exterior. No acredita permisos SQL/RLS ni endpoints aún no construidos.
const recursosM40 = [
  { nombre: "hold", tabla: holds, filtro: visibleHolds, origenes: 1 },
  { nombre: "reserva", tabla: reservations, filtro: visibleReservas, origenes: 1 },
  { nombre: "plan", tabla: paymentPlans, filtro: visiblePlanes, origenes: 2 },
  { nombre: "pago", tabla: payments, filtro: visiblePagos, origenes: 2 },
] as const;

for (const recurso of recursosM40) {
  for (const alcance of ["own", "team"] as const) {
    test(`TX-43 ${recurso.nombre}: ${alcance} hereda responsable del negocio para brokers A/B`, () => {
      const a = compilar(recurso.filtro(broker, alcance));
      const b = compilar(recurso.filtro({ ...broker, userId: 8 }, alcance));
      assert.equal(a.sql, b.sql);
      assert.deepEqual(a.params, Array(recurso.origenes).fill(7));
      assert.deepEqual(b.params, Array(recurso.origenes).fill(8));
      assert.equal((a.sql.match(/"rbac_deal"\."broker_id"\s*=\s*\$\d+/g) ?? []).length, recurso.origenes);
      assert.equal((a.sql.match(/"rbac_deal"\."deleted_at"\s+is\s+null/gi) ?? []).length, recurso.origenes);
      assert.doesNotMatch(a.sql, /"(?:holder_id|payer_id|created_by|beneficiary_id)"/);
      assert.match(a.sql, /exists\s*\(/i);
    });
  }

  test(`TX-43 ${recurso.nombre}: all conserva padres existentes y excluye negocios borrados`, () => {
    const { sql: query, params } = compilar(recurso.filtro(broker, "all"));
    assert.deepEqual(params, []);
    assert.doesNotMatch(query, /"broker_id"/);
    assert.equal((query.match(/"rbac_deal"\."deleted_at"\s+is\s+null/gi) ?? []).length, recurso.origenes);
    assert.equal((query.match(/"rbac_deal"\."id"\s*=/g) ?? []).length, recurso.origenes);
  });

  test(`TX-43 ${recurso.nombre}: none cierra todos los caminos aunque se omita requireScope`, () => {
    const { sql: query, params } = compilar(recurso.filtro(broker, "none"));
    assert.equal((query.match(/\bfalse\b/g) ?? []).length, recurso.origenes);
    assert.deepEqual(params, []);
  });
}

for (const recurso of [
  { tabla: holds, filtro: visibleHolds },
  { tabla: reservations, filtro: visibleReservas },
] as const) {
  test(`TX-43 ${recurso.tabla === holds ? "hold" : "reserva"}: EXISTS correlacionado al negocio de la fila exterior`, () => {
    const fila = alias(recurso.tabla, "expediente");
    const { sql: query } = compilar(recurso.filtro(broker, "own", fila));
    assert.match(query, /from "deals" as "rbac_deal"/);
    assert.match(query, /"rbac_deal"\."id" = "expediente"\."deal_id"/);
    assert.doesNotMatch(query, /"(?:holds|reservations)"\."deal_id"/);
  });
}

for (const recurso of [
  { tabla: paymentPlans, filtro: visiblePlanes },
  { tabla: payments, filtro: visiblePagos },
] as const) {
  test(`TX-43 ${recurso.tabla === paymentPlans ? "plan" : "pago"}: origen exclusivo, legacy y aliases correlacionados`, () => {
    const fila = alias(recurso.tabla, "expediente");
    const { sql: query } = compilar(recurso.filtro(broker, "own", fila));
    assert.match(query, /"expediente"\."reservation_id" is not null and "expediente"\."legacy_unit_sale_id" is null/);
    assert.match(query, /"expediente"\."reservation_id" is null and "expediente"\."legacy_unit_sale_id" is not null/);
    assert.match(query, /from "reservations" as "rbac_reservation"/);
    assert.match(query, /"rbac_reservation"\."id" = "expediente"\."reservation_id"/);
    assert.match(query, /"rbac_deal"\."id" = "rbac_reservation"\."deal_id"/);
    assert.match(query, /from "unit_sales" as "rbac_sale"/);
    assert.match(query, /"rbac_sale"\."id" = "expediente"\."legacy_unit_sale_id"/);
    assert.match(query, /"rbac_deal"\."id" = "rbac_sale"\."deal_id"/);
    assert.doesNotMatch(query, /"(?:payment_plans|payments)"\./);
  });
}

test("TX-43: listado, detalle por UUID, total y exportación usan el mismo predicado", () => {
  const filtro = visiblePagos(broker, "own");
  const listado = compilar(sql`select ${payments.publicId} from ${payments} where ${filtro}`);
  const detalle = compilar(sql`select ${payments.publicId} from ${payments} where ${and(eq(payments.publicId, "00000000-0000-4000-8000-000000000001"), filtro)}`);
  const total = compilar(sql`select count(*) from ${payments} where ${filtro}`);
  const exportacion = compilar(sql`select ${payments.publicId}, ${payments.amountCents} from ${payments} where ${filtro}`);
  for (const consulta of [listado, total, exportacion]) {
    assert.ok(consulta.sql.endsWith(compilar(filtro).sql));
    assert.deepEqual(consulta.params, [7, 7]);
  }
  assert.deepEqual(detalle.params, ["00000000-0000-4000-8000-000000000001", 7, 7]);
  assert.match(detalle.sql, /"payments"\."public_id" = \$1/);
  assert.equal((detalle.sql.match(/"rbac_deal"\."broker_id"/g) ?? []).length, 2);
});

test("TX-43: cuotas se filtran por su plan; aplicaciones y reversos por su pago", () => {
  const plan = alias(paymentPlans, "plan_padre");
  const pago = alias(payments, "pago_padre");
  const consultas = [
    sql`select ${paymentInstallments.id} from ${paymentInstallments} where exists (
      select 1 from ${paymentPlanVersions} join ${paymentPlans} as "plan_padre"
        on ${plan.id} = ${paymentPlanVersions.planId}
      where ${paymentPlanVersions.id} = ${paymentInstallments.versionId}
        and ${visiblePlanes(broker, "own", plan)}
    )`,
    sql`select ${paymentAllocations.id} from ${paymentAllocations} where exists (
      select 1 from ${payments} as "pago_padre"
      where ${pago.id} = ${paymentAllocations.paymentId} and ${visiblePagos(broker, "own", pago)}
    )`,
    sql`select ${paymentReversals.id} from ${paymentReversals} where exists (
      select 1 from ${payments} as "pago_padre"
      where ${pago.id} = ${paymentReversals.paymentId} and ${visiblePagos(broker, "own", pago)}
    )`,
  ];
  for (const consulta of consultas) {
    const { sql: query, params } = compilar(consulta);
    assert.deepEqual(params, [7, 7]);
    assert.equal((query.match(/\bexists\s*\(/gi) ?? []).length, 5);
    assert.doesNotMatch(query, /"(?:holder_id|payer_id|created_by)"/);
  }
});
