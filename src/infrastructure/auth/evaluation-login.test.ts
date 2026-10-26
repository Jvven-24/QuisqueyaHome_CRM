import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { z } from "zod";
import { UnauthorizedError } from "../../domain/errors.ts";
import { requireScope, reaches } from "../../domain/rbac.ts";
import type { Actor } from "../../domain/rbac.ts";

// Ejecuta las fuentes reales con dependencias aisladas. No requiere aliases de
// Node, Auth, Next en ejecución ni conexión DB; no copia la lógica de seguridad.
function loadSource<T>(path: string, dependencies: Record<string, unknown>, env: Record<string, string | undefined> = {}): T {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  runInNewContext(code, {
    exports, process: { env },
    require: (name: string) => {
      assert.ok(Object.hasOwn(dependencies, name), `Dependencia no aislada: ${name}`);
      return dependencies[name];
    },
  });
  return exports as T;
}

type CatalogRow = Record<string, unknown>;
type Predicate = (row: CatalogRow) => boolean;
const catalog: CatalogRow[] = [
  { userId: 27, authUserId: "real-broker", roleSlug: "broker", isActive: true, deletedAt: null, resource: "leads", action: "view", scope: "own" },
  { userId: 27, authUserId: "real-broker", roleSlug: "broker", isActive: true, deletedAt: null, resource: "academy", action: "view", scope: "all" },
  { userId: 42, authUserId: "real-assistant", roleSlug: "assistant", isActive: true, deletedAt: null, resource: "contacts", action: "view", scope: "all" },
  { userId: 50, roleSlug: "inactive", isActive: false, deletedAt: null, resource: "users", action: "edit", scope: "all" },
  { userId: 51, roleSlug: "deleted", isActive: true, deletedAt: "deleted", resource: "users", action: "edit", scope: "all" },
  { userId: 52, roleSlug: "empty", isActive: true, deletedAt: null, resource: null, action: null, scope: null },
];

class RequestUrl extends URL {
  clone() { return new RequestUrl(this.href); }
}

function setup(options: { mode?: string | null; flag?: string | null; host?: string | null; role?: string; authId?: string; sessionCookie?: string; authFails?: boolean; rows?: CatalogRow[] } = {}) {
  const host = options.host === undefined ? "localhost:9300" : options.host;
  let role = options.role ?? "broker";
  let dbCalls = 0;
  let authCalls = 0;
  const writes: unknown[][] = [];
  const env = loadSource<{ evaluationLoginAllowed: (host: string | null) => boolean }>("../env.ts", {}, {
    NODE_ENV: options.mode === null ? undefined : options.mode ?? "development",
    CRM_EVAL_LOGIN: options.flag === null ? undefined : options.flag ?? "1", CRM_DEMO_MODE: "true",
  });
  const store = {
    get: () => ({ value: role }), getAll: () => options.sessionCookie || options.authId ? [{ name: options.sessionCookie ?? "sb-test-auth-token", value: "present" }] : [],
    set: (...args: unknown[]) => { writes.push(args); role = String(args[1]); },
    delete: (...args: unknown[]) => { writes.push(args); },
  };
  const requestHeaders = new Headers(host === null ? {} : { host });
  const nextHeaders = { cookies: async () => store, headers: async () => requestHeaders };
  const auth = { auth: { getUser: async () => { authCalls++; return { data: { user: options.authFails ? null : options.authId ? { id: options.authId } : null } }; } } };
  const sessionCookie = loadSource<{ hasSupabaseSessionCookie: (cookies: { name: string }[]) => boolean }>("./session-cookie.ts", {});
  const schema = {
    users: { id: "userId", roleId: "roleId", authUserId: "authUserId", isActive: "isActive", deletedAt: "deletedAt" },
    roles: { id: "roleId", slug: "roleSlug" },
    permissions: { roleId: "roleId", resource: "resource", action: "action", scope: "scope" },
  };
  const db = {
    select(fields: Record<string, string>) {
      dbCalls++;
      let predicate: Predicate = () => true;
      let limit = Infinity;
      const query = {
        from: () => query, innerJoin: () => query, leftJoin: () => query,
        where: (condition: Predicate) => { predicate = condition; return query; },
        orderBy: () => query, limit: (count: number) => { limit = count; return query; },
        then: (resolve: (rows: CatalogRow[]) => unknown) => Promise.resolve(
          (options.rows ?? catalog).filter(predicate).slice(0, limit).map((row) =>
            Object.fromEntries(Object.entries(fields).map(([key, column]) => [key, row[column]])),
          ),
        ).then(resolve),
      };
      return query;
    },
  };
  const actor = loadSource<{ getActor: () => Promise<Actor | null>; getEvaluationActor: (role: string) => Promise<Actor | null>; requireActor: () => Promise<Actor> }>("./actor.ts", {
    "drizzle-orm": {
      eq: (column: string, value: unknown): Predicate => (row) => row[column] === value,
      isNull: (column: string): Predicate => (row) => row[column] === null,
      and: (...conditions: Predicate[]): Predicate => (row) => conditions.every((condition) => condition(row)),
    },
    "next/headers": nextHeaders, react: { cache: (fn: unknown) => fn },
    "@/domain/errors": { UnauthorizedError }, "../db/client": { getDb: () => db },
    "../db/schema": schema, "../env": env, "./supabase": { serverClient: async () => auth }, "./session-cookie": sessionCookie,
  });
  const nextResponse = {
    next: () => Object.assign(new Response(null), { cookies: store }),
    json: Response.json,
    redirect: (url: URL) => new Response(null, { status: 307, headers: { location: url.href } }),
  };
  const middleware = loadSource<{ middleware: (request: unknown) => Promise<Response> }>("../../middleware.ts", {
    "@supabase/ssr": { createServerClient: () => auth }, "next/server": { NextResponse: nextResponse },
    "@/infrastructure/env": { ...env, supabaseUrl: () => "unused", supabaseAnonKey: () => "unused" }, "@/infrastructure/auth/session-cookie": sessionCookie,
  });
  const route = loadSource<{ POST: (request: Request) => Promise<Response>; DELETE: (request: Request) => Promise<Response> }>("../../app/api/auth/demo/route.ts", {
    "next/headers": nextHeaders, "next/server": { NextResponse: nextResponse }, zod: { z },
    "@/infrastructure/auth/actor": actor, "@/infrastructure/env": env,
  });
  const request = (body: string = JSON.stringify({ role })) => new Request("http://localhost:9300/api/auth/demo", {
    method: "POST", headers: requestHeaders, body,
  });
  const guard = (path: string) => middleware.middleware({ headers: requestHeaders, cookies: store, nextUrl: new RequestUrl(`http://localhost:9300${path}`) });
  return { env, actor, route, request, guard, writes, dbCalls: () => dbCalls, authCalls: () => authCalls };
}

for (const scenario of [
  { name: "producción con flag y antiguo demo activos", mode: "production" },
  { name: "test con flag activo", mode: "test" },
  { name: "sin NODE_ENV", mode: null },
  { name: "sin flag explícito", flag: null },
  { name: "flag desactivado", flag: "0" },
  { name: "flag true en lugar de 1", flag: "true" },
  { name: "host remoto", host: "crm.example.com" },
  { name: "IP no local", host: "192.168.1.20:9300" },
  { name: "subdominio engañoso", host: "localhost.example.com" },
  { name: "lista de hosts", host: "localhost,crm.example.com" },
  { name: "URL en host", host: "http://localhost:9300" },
  { name: "sin host", host: null },
]) {
  test(`evaluación denegada en middleware, actor y demo: ${scenario.name}`, async () => {
    const s = setup(scenario);
    assert.equal((await s.guard("/api/contactos")).status, 401);
    assert.equal((await s.guard("/contactos")).status, 307);
    assert.equal((await s.guard("/login")).status, 200);
    assert.equal(await s.actor.getActor(), null);
    await assert.rejects(s.actor.requireActor(), UnauthorizedError);
    assert.equal((await s.route.POST(s.request("JSON inválido"))).status, 404);
    assert.equal((await s.route.DELETE(s.request())).status, 404);
    assert.equal(s.dbCalls(), 0);
    assert.equal(s.writes.length, 0);
  });
}

for (const host of ["localhost", "localhost:9300", "127.0.0.1", "127.0.0.1:9300"]) {
  test(`evaluación habilitada explícitamente en ${host}`, async () => {
    const s = setup({ host });
    assert.equal((await s.guard("/api/contactos")).status, 200);
    assert.equal((await s.guard("/login")).headers.get("location"), "http://localhost:9300/inicio");
    const response = await s.route.POST(s.request());
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true, role: "broker" });
    assert.equal((s.writes[0]?.[2] as { httpOnly: boolean }).httpOnly, true);
    assert.equal((await s.route.DELETE(s.request())).status, 200);
  });
}

test("broker conserva permisos del catálogo, identidad real y aislamiento own", async () => {
  const actor = await setup().actor.getActor();
  assert.ok(actor);
  assert.equal(actor.userId, 27);
  assert.equal(actor.permissions.length, 2);
  const scope = requireScope(actor, "leads", "view");
  assert.equal(scope, "own");
  assert.equal(reaches(actor, scope, 27), true);
  assert.equal(reaches(actor, scope, 28), false);
  assert.throws(() => requireScope(actor, "users", "edit"));
  assert.throws(() => requireScope(actor, "unit_real_price", "view"));
});

test("assistant no obtiene administración, borrado ni precios internos", async () => {
  const actor = await setup({ role: "assistant" }).actor.getActor();
  assert.ok(actor);
  assert.equal(actor.userId, 42);
  assert.equal(actor.permissions.length, 1);
  assert.equal(requireScope(actor, "contacts", "view"), "all");
  for (const resource of ["users", "roles", "unit_real_price"] as const) {
    assert.throws(() => requireScope(actor, resource, "view"));
  }
  assert.throws(() => requireScope(actor, "contacts", "delete"));
});

for (const role of ["unknown", "inactive", "deleted", ""]) {
  test(`cookie/rol ${role || "vacío"} no se convierte en administrador`, async () => {
    const s = setup({ role });
    assert.equal(await s.actor.getActor(), null);
    assert.equal((await s.route.POST(s.request())).status, 400);
    assert.equal(s.writes.length, 0);
  });
}

test("catálogo sin permisos deniega y cambios de permisos se reflejan", async () => {
  const empty = await setup({ role: "empty" }).actor.getActor();
  assert.ok(empty);
  assert.equal(empty.permissions.length, 0);
  assert.throws(() => requireScope(empty, "leads", "view"));
  const changed = await setup({ rows: catalog.map((row) => ({ ...row, scope: "none" })) }).actor.getActor();
  assert.ok(changed);
  assert.throws(() => requireScope(changed, "leads", "view"));
});

test("JSON inválido, ausente o con campos extra no crea cookie", async () => {
  const s = setup();
  for (const body of ["invalid", "{}", "null", '{"role":42}', '{"role":"broker","permissions":"all"}']) {
    assert.equal((await s.route.POST(s.request(body))).status, 400);
  }
  assert.equal(s.writes.length, 0);
});

test("fallo DB devuelve mensaje genérico sin detalles internos", async () => {
  const s = setup();
  s.actor.getEvaluationActor = async () => { throw new Error("detalle interno sintético"); };
  const response = await s.route.POST(s.request());
  assert.equal(response.status, 500);
  assert.equal((await response.text()).includes("detalle interno"), false);
  assert.equal(s.writes.length, 0);
});

test("sesión Supabase válida sigue funcionando en producción sin aceptar rol de cookie", async () => {
  const s = setup({ mode: "production", role: "admin", authId: "real-broker" });
  const actor = await s.actor.getActor();
  assert.ok(actor);
  assert.equal(actor.roleSlug, "broker");
  assert.equal(actor.userId, 27);
  assert.equal((await s.guard("/api/contactos")).status, 200);
  assert.equal((await s.route.POST(s.request())).status, 404);
});


test("evaluación local sin sesión evita consultar Auth", async () => {
  const s = setup();
  assert.equal((await s.guard("/api/contactos")).status, 200);
  assert.equal((await s.actor.getActor())?.roleSlug, "broker");
  assert.equal(s.authCalls(), 0);
});

for (const sessionCookie of ["sb-test-auth-token", "sb-test-auth-token.0", "sb-127-auth-token.10"]) {
  test(`cookie de sesión ${sessionCookie} obliga a verificar Auth y no cae a admin`, async () => {
    const failed = setup({ role: "admin", sessionCookie, authFails: true });
    assert.equal((await failed.guard("/api/contactos")).status, 401);
    assert.equal(await failed.actor.getActor(), null);
    assert.equal(failed.authCalls(), 2);
    const real = setup({ role: "admin", sessionCookie, authId: "real-broker" });
    assert.equal((await real.guard("/api/contactos")).status, 200);
    assert.equal((await real.actor.getActor())?.roleSlug, "broker");
    assert.equal(real.authCalls(), 2);
  });
}
