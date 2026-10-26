import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { after, test } from "node:test";
import { eq, sql } from "drizzle-orm";
import { db, connection, checked, rollback } from "./fixture.ts";
import * as schema from "../../src/infrastructure/db/schema.ts";

after(async () => {
  await connection.end({ timeout: 5 });
});

const check = (name: string, fn: () => Promise<unknown>) =>
  test(`DB unidades row_version ${name}`, { concurrency: false }, async () => {
    await checked(fn);
  });

check("TX-30 / b1i3b: la migración 0012_m40_unidad_version está registrada en el journal", async () => {
  const journal = JSON.parse(readFileSync(new URL("../../drizzle/meta/_journal.json", import.meta.url), "utf8")) as {
    entries: { idx: number; tag: string; when: number }[];
  };
  const entry0012 = journal.entries.find((e) => e.idx === 12 && e.tag === "0012_m40_unidad_version");
  assert.ok(entry0012, "0012_m40_unidad_version presente en _journal.json");
  assert.equal(entry0012.idx, 12);
  const previous = journal.entries.find((e) => e.idx === 11);
  assert.equal(previous?.tag, "0011_m40_outbox_tipos");
});

check("b1i3b: columna row_version existe en tabla units como integer NOT NULL DEFAULT 1", async () => {
  const [column] = await connection`
    select column_name, data_type, column_default, is_nullable
    from information_schema.columns
    where table_schema = current_schema()
      and table_name = 'units'
      and column_name = 'row_version'
  `;
  assert.ok(column, "columna row_version existe en units");
  assert.equal(column.data_type, "integer");
  assert.equal(column.is_nullable, "NO");
  assert.match(String(column.column_default), /1/);
});

check("b1i3b: restricción CHECK units_row_version_check existe y exige row_version > 0", async () => {
  const [constraint] = await connection`
    select conname, pg_get_constraintdef(oid) as def
    from pg_constraint
    where conrelid = 'units'::regclass
      and conname = 'units_row_version_check'
  `;
  assert.ok(constraint, "restricción units_row_version_check existe en units");
  assert.match(constraint.def, /row_version > 0/);
});

check("b1i3b: todas las unidades sembradas tienen row_version >= 1", async () => {
  const [invalid] = await connection`
    select count(*)::int as count
    from units
    where row_version is null or row_version < 1
  `;
  assert.equal(invalid!.count, 0, "ninguna unidad con row_version nulo o menor a 1");
});

check("b1i3b: inserción de unidad sin version toma default 1, con version explícita la respeta", async () => {
  await rollback(async (tx) => {
    const [project] = await tx.select({ id: schema.projects.id }).from(schema.projects).limit(1);
    assert.ok(project);

    // Inserción con default
    const [unitDefault] = await tx
      .insert(schema.units)
      .values({
        projectId: project.id,
        code: "QA-VER-001",
        operationType: "sale",
        status: "available",
      })
      .returning({ id: schema.units.id, rowVersion: schema.units.rowVersion });

    assert.ok(unitDefault);
    assert.equal(unitDefault.rowVersion, 1, "rowVersion por defecto es 1");

    // Inserción con valor explícito
    const [unitExplicit] = await tx
      .insert(schema.units)
      .values({
        projectId: project.id,
        code: "QA-VER-002",
        operationType: "sale",
        status: "available",
        rowVersion: 5,
      })
      .returning({ id: schema.units.id, rowVersion: schema.units.rowVersion });

    assert.ok(unitExplicit);
    assert.equal(unitExplicit.rowVersion, 5, "rowVersion explícito es respetado");
  });
});

check("b1i3b: CHECK units_row_version_check rechaza row_version = 0", async () => {
  await rollback(async (tx) => {
    const [project] = await tx.select({ id: schema.projects.id }).from(schema.projects).limit(1);
    assert.ok(project);

    await assert.rejects(
      async () => {
        await tx.insert(schema.units).values({
          projectId: project.id,
          code: "QA-VER-ZERO",
          rowVersion: 0,
        });
      },
      (error: unknown) => {
        const causa = (error as { cause?: { code?: string; constraint_name?: string } }).cause ?? (error as { code?: string });
        return (causa as { code?: string }).code === "23514";
      },
      "rechaza row_version = 0 con 23514 check_violation"
    );
  });
});

check("b1i3b: CHECK units_row_version_check rechaza row_version < 0", async () => {
  await rollback(async (tx) => {
    const [project] = await tx.select({ id: schema.projects.id }).from(schema.projects).limit(1);
    assert.ok(project);

    await assert.rejects(
      async () => {
        await tx.insert(schema.units).values({
          projectId: project.id,
          code: "QA-VER-NEG",
          rowVersion: -1,
        });
      },
      (error: unknown) => {
        const causa = (error as { cause?: { code?: string; constraint_name?: string } }).cause ?? (error as { code?: string });
        return (causa as { code?: string }).code === "23514";
      },
      "rechaza row_version negativo con 23514 check_violation"
    );
  });
});

check("b1i3b: actualización optimista incrementa row_version y detecta conflicto de versión", async () => {
  await rollback(async (tx) => {
    const [project] = await tx.select({ id: schema.projects.id }).from(schema.projects).limit(1);
    assert.ok(project);

    const [created] = await tx
      .insert(schema.units)
      .values({
        projectId: project.id,
        code: "QA-VER-CONC",
        operationType: "sale",
        status: "available",
      })
      .returning();
    assert.equal(created!.rowVersion, 1);

    // 1. Actualización concurrente simulada: con expectedVersion = 1, actualiza a version 2
    const updated = await tx
      .update(schema.units)
      .set({
        builtAreaM2: 85.5,
        rowVersion: sql`${schema.units.rowVersion} + 1`,
      })
      .where(sql`${schema.units.id} = ${created!.id} and ${schema.units.rowVersion} = 1`)
      .returning({ id: schema.units.id, rowVersion: schema.units.rowVersion, builtAreaM2: schema.units.builtAreaM2 });

    assert.equal(updated.length, 1);
    assert.equal(updated[0]!.rowVersion, 2);
    assert.equal(updated[0]!.builtAreaM2, 85.5);

    // 2. Intento de actualización con versión obsoleta (expectedVersion = 1 cuando la fila ya está en versión 2)
    const staleUpdate = await tx
      .update(schema.units)
      .set({
        builtAreaM2: 90.0,
        rowVersion: sql`${schema.units.rowVersion} + 1`,
      })
      .where(sql`${schema.units.id} = ${created!.id} and ${schema.units.rowVersion} = 1`)
      .returning();

    assert.equal(staleUpdate.length, 0, "conflicto concurrente detectado: 0 filas afectadas con versión obsoleta");

    // 3. Verificamos que los datos no cambiaron tras el intento fallido
    const [current] = await tx.select().from(schema.units).where(eq(schema.units.id, created!.id));
    assert.equal(current!.rowVersion, 2);
    assert.equal(current!.builtAreaM2, 85.5);
  });
});
