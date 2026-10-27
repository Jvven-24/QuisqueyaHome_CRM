/**
 * M15 · Notificaciones: ejecuta el `route.ts` real con dobles aislados (sin DB ni
 * sesión). Verifica autenticación, permiso `dashboard:view`, que solo se leen o
 * marcan notificaciones del propio actor y la validación del id.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { z } from "zod";
import { ForbiddenError, UnauthorizedError, ValidationError } from "../../../domain/errors.ts";
import { requireScope, type Actor } from "../../../domain/rbac.ts";

type Filas = { id: number; userId: number; isRead: boolean }[];
function cargar(actor: Actor | null, filas: Filas = []) {
  const consultas: unknown[] = [];
  const updates: { set: Record<string, unknown>; where: unknown }[] = [];
  const db = {
    select: () => ({ from: () => ({ where: (w: unknown) => { consultas.push(w); return { orderBy: () => ({ limit: async (n: number) => filas.filter(f => f.userId === actor!.userId).slice(0, n) }) }; } }) }),
    update: () => ({ set: (set: Record<string, unknown>) => ({ where: async (where: unknown) => { updates.push({ set, where }); } }) }),
  };
  const source = readFileSync(new URL("./route.ts", import.meta.url), "utf8");
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports: Record<string, unknown> = {};
  const deps: Record<string, unknown> = {
    zod: { z },
    "drizzle-orm": { and: (...a: unknown[]) => ({ and: a }), desc: (c: unknown) => ({ desc: c }), eq: (c: unknown, v: unknown) => ({ eq: [c, v] }) },
    "@/domain/rbac": { requireScope },
    "@/infrastructure/auth/actor": { requireActor: async () => { if (!actor) throw new UnauthorizedError(); return actor; } },
    "@/infrastructure/db/client": { getDb: () => db },
    "@/infrastructure/db/schema": { notifications: { id: "id", userId: "userId", createdAt: "createdAt" } },
    "@/infrastructure/http": {
      parseInput: (s: z.ZodType, i: unknown) => { const r = s.safeParse(i); if (r.success) return r.data; throw new ValidationError("Revisa los datos enviados.", {}); },
      errorResponse: (e: unknown) => {
        if (e instanceof UnauthorizedError) return Response.json({ error: e.message }, { status: 401 });
        if (e instanceof ForbiddenError) return Response.json({ error: e.message }, { status: 403 });
        if (e instanceof ValidationError) return Response.json({ error: e.message }, { status: 400 });
        throw e;
      },
    },
  };
  runInNewContext(code, { exports, Request, Response, URL, Date, require: (n: string) => { assert.ok(Object.hasOwn(deps, n), `Dependencia no aislada: ${n}`); return deps[n]; } });
  return { get: exports.GET as () => Promise<Response>, patch: exports.PATCH as (r: Request) => Promise<Response>, consultas, updates };
}
const broker: Actor = { userId: 7, roleSlug: "broker", permissions: [{ resource: "dashboard", action: "view", scope: "own" }] };
const sinPermiso: Actor = { userId: 7, roleSlug: "broker", permissions: [] };
const patchReq = (body: unknown) => new Request("http://x/api/notificaciones", { method: "PATCH", body: JSON.stringify(body) });

test("GET sin sesión responde 401", async () => { assert.equal((await cargar(null).get()).status, 401); });
test("GET sin dashboard:view responde 403", async () => { assert.equal((await cargar(sinPermiso).get()).status, 403); });
test("GET filtra por el actor y cuenta no leídas", async () => {
  const r = cargar(broker, [{ id: 1, userId: 7, isRead: false }, { id: 2, userId: 7, isRead: true }, { id: 3, userId: 8, isRead: false }]);
  const res = await r.get(); const body = await res.json();
  assert.equal(res.status, 200); assert.equal(body.notificaciones.length, 2); assert.equal(body.unreadCount, 1);
  assert.deepEqual(r.consultas[0], { eq: ["userId", 7] });
});
test("PATCH con id marca solo la notificación propia", async () => {
  const r = cargar(broker); const res = await r.patch(patchReq({ id: "5" }));
  assert.equal(res.status, 200); assert.equal(r.updates.length, 1); assert.equal(r.updates[0]!.set.isRead, true);
  assert.deepEqual(r.updates[0]!.where, { and: [{ eq: ["id", 5] }, { eq: ["userId", 7] }] });
});
test("PATCH sin id marca todas las del actor y nada ajeno", async () => {
  const r = cargar(broker); await r.patch(patchReq({}));
  assert.deepEqual(r.updates[0]!.where, { eq: ["userId", 7] });
});
test("PATCH con id inválido responde 400 sin escribir", async () => {
  const r = cargar(broker); const res = await r.patch(patchReq({ id: -3 }));
  assert.equal(res.status, 400); assert.equal(r.updates.length, 0);
});
test("PATCH sin sesión responde 401 sin escribir", async () => {
  const r = cargar(null); assert.equal((await r.patch(patchReq({}))).status, 401); assert.equal(r.updates.length, 0);
});
