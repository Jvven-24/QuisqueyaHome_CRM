import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import ts from "typescript";
import { scopeCondition } from "./rbac-filter.ts";
import * as errors from "../domain/errors.ts";
import * as catalogs from "../domain/catalogs.ts";
import * as rbac from "../domain/rbac.ts";
import * as adminModule from "../application/permisos/administracion.ts";
import type { Actor } from "../domain/rbac.ts";
const require = createRequire(import.meta.url);
function load<T>(path: string, deps: Record<string, unknown>): T {
  const code = ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const loaded = { exports: {} };
  new Function("require", "module", "exports", code)((name: string) => deps[name] ?? require(name), loaded, loaded.exports);
  return loaded.exports as T;
}
const http = load("./http.ts", { "@/domain/errors": errors });
const admin: Actor = { userId: 1, roleSlug: "admin", permissions: [{ resource: "settings", action: "edit", scope: "all" }, { resource: "brokers", action: "view", scope: "all" }] };
type Handler = (request: Pick<Request, "json">, context: { params: Promise<{ id: string }> }) => Promise<Response>;

for (const [path, valid] of [
  ["permisos/usuarios/[id]", { resource: "projects", action: "view", scope: "none", reason: "Restringir catálogo" }],
  ["permisos/equipos/[id]", { leaderId: null, memberIds: [7], supervisorIds: [8] }],
] as const) {
  test(`${path}: autorización ocurre antes del JSON/id y de tocar repositorios`, async () => {
    let actor: Actor | null = null;
    let reads = 0;
    const calls: unknown[][] = [];
    const record = async (...args: unknown[]) => { calls.push(args); };
    const { PATCH } = load<{ PATCH: Handler }>(`../app/api/${path}/route.ts`, {
      "@/application/permisos/administracion": adminModule, "@/domain/errors": errors, "@/domain/rbac": rbac,
      "@/infrastructure/auth/actor": { requireActor: async () => { if (!actor) throw new errors.UnauthorizedError(); return actor; } },
      "@/infrastructure/db/repos/permisos": { changeUserPermission: record, changePermissionTeam: record },
      "@/infrastructure/http": http,
    });
    const request = (body: unknown) => ({ json: async () => { reads++; return body; } });
    const context = { params: Promise.resolve({ id: "7" }) };
    assert.equal((await PATCH(request(valid), context)).status, 401);
    for (const candidate of [{ ...admin, roleSlug: "manager" }, { ...admin, roleSlug: "broker" }, { ...admin, readOnly: true }, { ...admin, permissions: [] }]) {
      actor = candidate;
      assert.equal((await PATCH(request(valid), context)).status, 403);
    }
    assert.equal(reads, 0); assert.equal(calls.length, 0);
    actor = admin;
    assert.equal((await PATCH(request(valid), { params: Promise.resolve({ id: "bad" }) })).status, 404);
    assert.equal(reads, 0);
    assert.equal((await PATCH(request({ ...valid, grantedBy: 999 }), context)).status, 400);
    assert.equal(calls.length, 0);
    assert.equal((await PATCH(request(valid), context)).status, 200);
    assert.deepEqual(calls[0], [admin, 7, valid]);
    if (path.includes("usuarios")) {
      const reset = { ...valid, scope: null };
      assert.equal((await PATCH(request(reset), context)).status, 200);
      assert.deepEqual(calls[1], [admin, 7, reset]);
    }
  });
}

test("ver-como: cookie solo tras validar broker; usuario común no inicia; siempre se puede salir autenticado", async () => {
  let actor: Actor | null = admin;
  let permitTarget = true;
  const writes: unknown[][] = [];
  const previewCalls: unknown[][] = [];
  const route = load<{ POST: (req: Request) => Promise<Response>; DELETE: () => Promise<Response> }>("../app/api/ver-como/route.ts", {
    "@/domain/errors": errors, "@/domain/rbac": rbac,
    "@/infrastructure/auth/actor": { getAuthenticatedActor: async () => actor, brokerPreview: async (...args: unknown[]) => { previewCalls.push(args); if (!permitTarget) throw new errors.ForbiddenError("Broker fuera del equipo."); } },
    "next/headers": { cookies: async () => ({ set: (...args: unknown[]) => writes.push(args), delete: (...args: unknown[]) => writes.push(args) }) },
    "@/infrastructure/rbac-filter": { scopeCondition },
    "@/infrastructure/db/client": {}, "@/infrastructure/db/schema": {}, "@/infrastructure/http": http,
  });
  const request = (body: unknown = { brokerId: 7 }) => new Request("http://localhost/api/ver-como", { method: "POST", body: JSON.stringify(body) });
  actor = { ...admin, roleSlug: "broker" };
  assert.equal((await route.POST(request())).status, 403); assert.equal(writes.length, 0);
  actor = { ...admin, roleSlug: "manager" };
  assert.equal((await route.POST(request({ brokerId: "7" }))).status, 400);
  permitTarget = false;
  assert.equal((await route.POST(request())).status, 403); assert.equal(writes.length, 0);
  permitTarget = true;
  assert.equal((await route.POST(request())).status, 200);
  assert.deepEqual(previewCalls.at(-1), [actor, 7]);
  assert.equal(writes[0]?.[0], "qh_view_as");
  assert.equal(writes[0]?.[1], "7");
  assert.equal((writes[0]?.[2] as { httpOnly: boolean }).httpOnly, true);
  actor = { ...admin, roleSlug: "broker", permissions: [] };
  assert.equal((await route.DELETE()).status, 200, "salir no depende de permisos revocados");
  actor = null;
  assert.equal((await route.DELETE()).status, 401);
});

test("migración de RBAC conserva RLS, unicidad, denegación none, seed idempotente y journal", () => {
  const migration = readFileSync(new URL("../../drizzle/0017_rbac_supervision.sql", import.meta.url), "utf8");
  for (const name of ["user_permission_overrides", "manager_scopes"]) {
    assert.ok(migration.includes(`CREATE TABLE IF NOT EXISTS "${name}"`));
    assert.ok(migration.includes(`ALTER TABLE "${name}" ENABLE ROW LEVEL SECURITY`));
  }
  assert.match(migration, /UNIQUE INDEX IF NOT EXISTS "user_permission_overrides_cell_unq"/);
  assert.match(migration, /CHECK \("scope" IN \('none','own','team','all'\)\)/);
  assert.match(migration, /ON CONFLICT \("slug"\) DO NOTHING/);
  assert.match(migration, /'manager', 'Gerente\/Supervisor'/);
  assert.doesNotMatch(migration, /\('(?:users|roles|settings)'/);
  const journal = JSON.parse(readFileSync(new URL("../../drizzle/meta/_journal.json", import.meta.url), "utf8"));
  assert.ok(journal.entries.some((e: { idx: number; tag: string }) => e.idx === 17 && e.tag === "0017_rbac_supervision"));
});


test("manager con settings all no puede editar la matriz de roles ni delegar administración", async () => {
  let calls = 0;
  const route = load<{ PATCH: Handler }>("../app/api/roles/[id]/permisos/route.ts", {
    "@/domain/errors": errors, "@/domain/rbac": rbac, "@/domain/catalogs": catalogs,
    "@/infrastructure/auth/actor": { requireActor: async () => ({ ...admin, roleSlug: "manager" }) },
    "@/application/roles/casos-de-uso": { editarPermisos: async () => { calls++; } },
    "@/infrastructure/contenedor/roles": { rolesParaEscritura: () => { calls++; } }, "@/infrastructure/http": http,
  });
  const response = await route.PATCH({ json: async () => { calls++; return { permisos: [] }; } }, { params: Promise.resolve({ id: "3" }) });
  assert.equal(response.status, 403); assert.equal(calls, 0);
});
