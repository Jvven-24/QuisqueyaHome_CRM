import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import ts from "typescript";
import { PgDialect } from "drizzle-orm/pg-core";
import type { SQL } from "drizzle-orm";
import * as errors from "../domain/errors.ts";
import * as rbac from "../domain/rbac.ts";
import * as administration from "../application/permisos/administracion.ts";
import * as schema from "./db/schema.ts";
const require = createRequire(import.meta.url);
function load<T>(path: string, deps: Record<string, unknown>): T {
  const code = ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  new Function("require", "exports", code)((name: string) => deps[name] ?? require(name), exports);
  return exports as T;
}

/** Ejecuta la fuente real del adaptador: el doble solo registra el protocolo ORM. */
function repository(target: administration.PermissionUser | undefined) {
  const writes: { table: unknown; value: unknown; conflict?: unknown }[] = [];
  const audits: unknown[][] = [];
  const previous = { userId: 7, resource: "leads", action: "view", scope: "all", reason: "Anterior" };
  const queue = [[target].filter(Boolean), [previous]];
  const locks: unknown[][] = [];
  const tx = {
    select() {
      const rows = queue.shift() ?? [];
      const query = { from: () => query, innerJoin: () => query, where: () => query,
        for: (...args: unknown[]) => { locks.push(args); return query; },
        then: (resolve: (value: unknown) => unknown) => Promise.resolve(rows).then(resolve) };
      return query;
    },
    insert(table: unknown) { return { values(value: unknown) { const entry = { table, value } as typeof writes[number]; writes.push(entry); return { onConflictDoUpdate: async (conflict: unknown) => { entry.conflict = conflict; } }; } }; },
    delete(table: unknown) { return { where: async () => { writes.push({ table, value: "delete" }); } }; },
  };
  const loaded = load<{ changeUserPermission: (actor: rbac.Actor, id: number, change: administration.OverrideChange) => Promise<void> }>("./db/repos/permisos.ts", {
    "@/application/permisos/administracion": administration, "@/domain/errors": errors, "@/domain/rbac": rbac,
    "@/infrastructure/audit": { auditar: async (...args: unknown[]) => { audits.push(args); } },
    "../client": { transaction: async (callback: (value: unknown) => unknown) => callback(tx) }, "../schema": schema,
  });
  return { ...loaded, writes, audits, locks, previous };
}
const admin: rbac.Actor = { userId: 1, roleSlug: "admin", permissions: [{ resource: "settings", action: "edit", scope: "all" }] };
const broker: administration.PermissionUser = { id: 7, roleId: 3, fullName: "Broker", roleSlug: "broker", isProtected: false };
const change: administration.OverrideChange = { resource: "leads", action: "view", scope: "none", reason: "Revocar acceso aprobado" };

test("adaptador protege admin y usuario inexistente antes de cualquier escritura o auditoría", async () => {
  for (const target of [undefined, { ...broker, isProtected: true }, { ...broker, roleSlug: "admin" }]) {
    const repo = repository(target);
    await assert.rejects(repo.changeUserPermission(admin, 7, change), target ? errors.ForbiddenError : errors.NotFoundError);
    assert.deepEqual(repo.writes, []); assert.deepEqual(repo.audits, []);
  }
});

test("override none se persiste explícitamente con autor/motivo; antes/después se auditan en misma transacción", async () => {
  const repo = repository(broker);
  await repo.changeUserPermission(admin, 7, change);
  assert.deepEqual(repo.writes[0]?.value, { userId: 7, resource: "leads", action: "view", scope: "none", reason: change.reason, grantedBy: 1 });
  assert.equal(repo.locks[0]?.[0], "update");
  const audit = repo.audits[0]?.[2] as { antes: unknown; despues: { scope: string; restoredToRole: boolean } };
  assert.deepEqual(audit.antes, repo.previous);
  assert.equal(audit.despues.scope, "none"); assert.equal(audit.despues.restoredToRole, false);
  assert.equal(repo.audits[0]?.[1], admin);
});

test("restablecer elimina solo la excepción, conserva motivo en auditoría y no altera el rol", async () => {
  const repo = repository(broker);
  await repo.changeUserPermission(admin, 7, { ...change, scope: null });
  assert.equal(repo.writes.length, 1); assert.equal(repo.writes[0]?.table, schema.userPermissionOverrides); assert.equal(repo.writes[0]?.value, "delete");
  const audit = repo.audits[0]?.[2] as { despues: { scope: null; reason: string; restoredToRole: boolean } };
  assert.deepEqual(audit.despues, { resource: "leads", action: "view", scope: null, reason: change.reason, restoredToRole: true });
});

test("actor real aplica overrides y carga líderes/supervisores activos antes de construir team", async () => {
  const where: { sql: string; params: unknown[] }[] = [];
  const queue: unknown[][] = [
    [{ userId: 7 }],
    [{ userId: 7, roleSlug: "manager", isProtected: false, resource: "leads", action: "view", scope: "team" }, { userId: 7, roleSlug: "manager", isProtected: false, resource: "projects", action: "view", scope: "team" }],
    [{ resource: "projects", action: "view", scope: "all" }, { resource: "leads", action: "edit", scope: "none" }],
    [{ id: 20 }, { id: 21 }],
    [{ userId: 11 }, { userId: 12 }, { userId: 11 }],
  ];
  const db = {
    select() {
      const result = queue.shift() ?? [];
      const query = { from: () => query, innerJoin: () => query, leftJoin: () => query, orderBy: () => query, limit: () => query,
        where: (predicate: SQL) => { where.push(new PgDialect().sqlToQuery(predicate)); return query; },
        then: (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve) };
      return query;
    },
  };
  const loaded = load<{ getEvaluationActor: (role: string) => Promise<rbac.Actor | null> }>("./auth/actor.ts", {
    "@/domain/rbac": rbac, "@/domain/errors": errors, "../db/client": { getDb: () => db }, "../db/schema": schema,
    "next/headers": { headers: async () => new Headers({ host: "localhost:9300" }) }, react: { cache: (fn: unknown) => fn },
    "../env": { evaluationLoginAllowed: () => true }, "./supabase": {}, "./session-cookie": {},
  });
  const actor = await loaded.getEvaluationActor("manager");
  assert.ok(actor);
  assert.equal(rbac.scopeFor(actor, "projects", "view"), "all");
  assert.equal(rbac.scopeFor(actor, "leads", "edit"), "none");
  assert.deepEqual(actor.teamUserIds, [11, 12]);
  assert.equal(rbac.reaches(actor, "team", 7), true);
  assert.equal(rbac.reaches(actor, "team", 11), true);
  assert.equal(rbac.reaches(actor, "team", 99), false);
  const supervision = where.find(p => p.sql.includes('"manager_scopes"."manager_id"'));
  assert.ok(supervision);
  assert.match(supervision.sql, /"teams"\."is_active"/);
  assert.match(supervision.sql, /"teams"\."leader_id"/);
  assert.match(supervision.sql, / or /i);
  assert.deepEqual(supervision.params, [true, 7, 7]);
  const members = where.at(-1)!;
  assert.match(members.sql, /"team_members"\."team_id" in/);
  assert.match(members.sql, /"users"\."is_active"/);
  assert.match(members.sql, /"users"\."deleted_at" is null/);
  assert.deepEqual(members.params, [20, 21, true]);
});
