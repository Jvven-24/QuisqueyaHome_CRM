import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import ts from "typescript";
import * as rbac from "../../../domain/rbac.ts";
import type { Actor } from "../../../domain/rbac.ts";
const require = createRequire(import.meta.url);

test("auditoría: settings all no sustituye audit_log:view all; permiso se verifica antes de consultar eventos", async () => {
  let consultas = 0;
  let actor: Actor = { userId: 1, roleSlug: "administrador", permissions: [] };
  const deps: Record<string, unknown> = {
    "@/domain/rbac": rbac,
    "next/navigation": { forbidden() { throw new Error("403-auditoria"); } },
    "@/infrastructure/auth/actor": { requireActor: async () => actor },
    "@/infrastructure/page-guard": { requireScopeInPage: (a: Actor) => rbac.requireScope(a, "settings", "view") },
    "@/infrastructure/contenedor/outbox": {},
    "@/infrastructure/db/client": { getDb: () => ({ select() { consultas++; throw new Error("lectura indebida"); } }) },
    "@/infrastructure/db/schema": {},
    "@/infrastructure/env": {},
    "@/infrastructure/proveedores-externos": {},
    "@/application/configuracion/integraciones-catalogo": {},
    "@/application/configuracion/auditoria": {},
    "@/infrastructure/db/repos/configuracion-auditoria": {},
    "./vista": {},
  };
  const code = ts.transpileModule(readFileSync(new URL("./page.tsx", import.meta.url), "utf8"), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const exports: Record<string, unknown> = {};
  new Function("require", "exports", code)((id: string) => deps[id] ?? require(id), exports);
  const page = exports.default as (p: { searchParams: Promise<Record<string, string>> }) => Promise<unknown>;
  for (const scope of ["none", "own", "team"] as const) {
    actor = { ...actor, permissions: [{ resource: "settings", action: "view", scope: "all" }, { resource: "audit_log", action: "view", scope }] };
    await assert.rejects(page({ searchParams: Promise.resolve({ tab: "auditoria" }) }), /403-auditoria/);
  }
  assert.equal(consultas, 0);
});
