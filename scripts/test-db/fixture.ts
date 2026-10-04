import assert from 'node:assert/strict';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { getTableColumns, and, eq, sql } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';
import * as schema from '../../src/infrastructure/db/schema.ts';
import { databaseUrl } from '../../src/infrastructure/env.ts';
import type { Actor, Permission } from '../../src/domain/rbac.ts';

type TestContext = { name: string; mode: 'database' | 'schema'; mutation: 'alias' | 'boolean' | null };
const context = (globalThis as typeof globalThis & { [key: symbol]: TestContext })[Symbol.for('qh.test-db')];
assert.ok(context && /^quisqueyahome_crm_test_[a-f0-9]{20}$/.test(context.name), 'ejecutar con npm run test:db');
const destination = new URL(databaseUrl());
assert.ok(['postgres:', 'postgresql:'].includes(destination.protocol));
assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(destination.hostname));
assert.equal(destination.port, '5432');
assert.equal(destination.search, '');
assert.equal(destination.hash, '');
assert.equal(destination.pathname, `/${context.mode === 'schema' ? 'quisqueyahome_crm' : context.name}`);
export const connection = postgres(destination.href, { max: 2, prepare: false, connect_timeout: 5, onnotice: () => {}, connection: { search_path: context.mode === 'schema' ? `${context.name},pg_catalog` : 'public,pg_catalog', statement_timeout: 15000, lock_timeout: 5000 } });
export const db = drizzle(connection, { schema });
const [identity] = await connection`select current_database() as db, current_schema() as schema, inet_server_addr()::text as host, inet_server_port() as port`;
assert.equal(identity!.db, context.mode === 'schema' ? 'quisqueyahome_crm' : context.name);
assert.equal(identity!.schema, context.mode === 'schema' ? context.name : 'public');
assert.ok(['127.0.0.1', '::1'].includes(String(identity!.host).split('/')[0]!));
assert.equal(identity!.port, 5432);

export async function actorFor(roleSlug: string): Promise<Actor> {
  const [user] = await db.select({ userId: schema.users.id, roleId: schema.users.roleId }).from(schema.users)
    .innerJoin(schema.roles, eq(schema.roles.id, schema.users.roleId))
    .where(and(eq(schema.roles.slug, roleSlug), eq(schema.users.isActive, true)))
    .orderBy(schema.users.id).limit(1);
  assert.ok(user, `identidad sintética ${roleSlug}`);
  const permissions: Permission[] = await db.select({ resource: schema.permissions.resource, action: schema.permissions.action, scope: schema.permissions.scope })
    .from(schema.permissions).where(eq(schema.permissions.roleId, user.roleId));
  return { userId: user.userId, roleSlug, permissions };
}

// Validar el contrato persistido sin publicar valores de filas en un fallo.
export function rowShape(table: PgTable, row: unknown) {
  assert.ok(row !== null && typeof row === 'object', 'fila persistida ausente');
  const values = row as Record<string, unknown>;
  for (const [key, column] of Object.entries(getTableColumns(table))) {
    const value = values[key];
    assert.ok(value !== undefined, `columna ausente ${key}`);
    if (value === null) { assert.ok(!column.notNull, `null no permitido ${key}`); continue; }
    if (column.dataType === 'date') assert.ok(value instanceof Date && !Number.isNaN(value.getTime()), `fecha ${key}`);
    else if (column.dataType === 'number') assert.ok(typeof value === 'number' && Number.isFinite(value), `número ${key}`);
    else if (['string', 'boolean', 'bigint'].includes(column.dataType)) assert.ok(typeof value === column.dataType, `tipo ${key}`);
  }
}

// SQLSTATE y mensajes públicos conocidos; nunca Error.cause ni parámetros SQL.
export async function checked<T>(operation: () => Promise<T>): Promise<T> {
  try { return await operation(); }
  catch (error) {
    const cause = error instanceof Error && 'cause' in error ? error.cause : error;
    if (typeof cause === 'object' && cause !== null && 'code' in cause) {
      const code = String(cause.code);
      // AssertionError pertenece a las pruebas sintéticas, no al motor SQL.
      if (cause instanceof assert.AssertionError) throw cause;
      const safe = /^[A-Z0-9_]{1,40}$/.test(code) ? code : 'DRIVER_ERROR';
      const message = safe === '42P01' ? 'referencia de tabla/alias inválida' : safe === '42804' ? 'condición SQL no booleana' : 'error SQL; detalles omitidos';
      throw new Error(`${/^[A-Z0-9]{5}$/.test(safe) ? 'SQLSTATE' : 'DB ERROR'} ${safe}: ${message}`);
    }
    throw error;
  }
}

// Las pruebas pueden bloquear o ejecutar un upsert para observar su SELECT.
// Rollback siempre: ningún caso deja estado para el siguiente.
export async function rollback<T>(operation: (tx: Parameters<Parameters<typeof db.transaction>[0]>[0]) => Promise<T>): Promise<T> {
  const sentinel = new Error('QA rollback');
  let result: T;
  try { await db.transaction(async tx => { result = await operation(tx); throw sentinel; }); }
  catch (error) { if (error !== sentinel) throw error; }
  return result!;
}

export async function visibleCount(table: PgTable, owner: string, actor: Actor, scope: string): Promise<number> {
  const columns = getTableColumns(table);
  const [row] = await db.select({ count: sql<number>`count(*)::int` }).from(table)
    .where(and(columns.deletedAt ? sql`${columns.deletedAt} is null` : undefined, scope === 'all' ? undefined : eq(columns[owner]!, actor.userId)));
  return row!.count;
}
