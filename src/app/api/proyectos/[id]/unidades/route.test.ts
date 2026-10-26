import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { z } from "zod";
import { OPERATION_TYPES, PRICE_PERIODS, UNIT_STATUSES } from "../../../../../domain/catalogs.ts";
import { can, requireScope, stripRestrictedPrices, type Actor } from "../../../../../domain/rbac.ts";
import { ConflictError, ForbiddenError, ValidationError } from "../../../../../domain/errors.ts";

const actor: Actor = { userId: 5, roleSlug: "broker", permissions: [
  { resource: "units", action: "create", scope: "own" },
  { resource: "units", action: "edit", scope: "own" },
  { resource: "units", action: "delete", scope: "own" },
] };

function cargar(method: "POST" | "PATCH" | "DELETE", usuario = actor, falloEscritura?: Error) {
  let escrito: Record<string, unknown> | undefined;
  let borrado: Record<string, unknown> | undefined;
  const deps: Record<string, unknown> = {
    zod: { z },
    "@/domain/catalogs": { OPERATION_TYPES, PRICE_PERIODS, UNIT_STATUSES },
    "@/domain/rbac": { can, requireScope, stripRestrictedPrices },
    "@/domain/errors": { ConflictError },
    "@/infrastructure/auth/actor": { requireActor: async () => usuario },
    "@/infrastructure/contenedor/proyectos": { proyectosParaEscritura: () => ({}) },
    "@/application/proyectos/casos-de-uso": {
      crearUnidad: async (_deps: unknown, _actor: unknown, _scope: unknown, datos: Record<string, unknown>) => {
        if (falloEscritura) throw falloEscritura;
        escrito = datos; return { id: 1 };
      },
      editarUnidad: async (_deps: unknown, _actor: unknown, _scope: unknown, _projectId: number, _id: number, datos: Record<string, unknown>) => {
        if (falloEscritura) throw falloEscritura;
        escrito = datos; return { id: 1 };
      },
      borrarUnidad: async (_deps: unknown, _actor: unknown, _scope: unknown, _projectId: number, _id: number, version?: number) => {
        if (falloEscritura) throw falloEscritura;
        borrado = { id: _id, expectedVersion: version };
      },
    },
    "@/infrastructure/http": {
      idsDeRuta: (...ids: string[]) => ids.map(Number),
      vaciosANull: (body: unknown) => body,
      parseInput(schema: z.ZodType, body: unknown) {
        const parsed = schema.safeParse(body);
        if (!parsed.success) throw new ValidationError("Revisa los datos.");
        return parsed.data;
      },
      errorResponse: (error: unknown) => {
        const e = error instanceof Error ? error : new Error(String(error));
        return Response.json({ error: e.message }, {
          status: e.name === "ConflictError" || error instanceof ConflictError ? 409 : e.name === "ForbiddenError" || error instanceof ForbiddenError ? 403 : 400,
        });
      },
    },
  };
  const code = ts.transpileModule(readFileSync(new URL(method === "POST" ? "./route.ts" : "./[unitId]/route.ts", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports: Record<string, unknown> = {};
  runInNewContext(code, { exports, Response, URL, require: (name: string) => { assert.ok(Object.hasOwn(deps, name), name); return deps[name]; } });
  const handler = exports[method] as (request: Request, context: { params: Promise<{ id: string; unitId: string }> }) => Promise<Response>;
  return {
    ejecutar: (body?: unknown, url = "http://localhost/x") => handler(new Request(url, { method, body: body !== undefined ? JSON.stringify(body) : undefined }), { params: Promise.resolve({ id: "1", unitId: "2" }) }),
    escrito: () => escrito,
    borrado: () => borrado,
  };
}

test("M40 b1i2 API: POST/PATCH con status responden 409 y no llaman al escritor", async () => {
  for (const method of ["POST", "PATCH"] as const) {
    const ruta = cargar(method);
    for (const status of UNIT_STATUSES) {
      assert.equal((await ruta.ejecutar({ code: "A-1", status })).status, 409);
      assert.equal(ruta.escrito(), undefined);
    }
  }
});

test("M40 b1i2 API: alta usa estado del servidor; edición no transporta status ni campos inyectados", async () => {
  for (const method of ["POST", "PATCH"] as const) {
    const ruta = cargar(method);
    assert.equal((await ruta.ejecutar({ code: "A-1", deletedAt: "2026-01-01", projectId: 99, updatedBy: 99 })).status, 200);
    assert.equal(ruta.escrito()!.status, method === "POST" ? "available" : undefined);
    assert.equal(ruta.escrito()!.deletedAt, undefined);
    assert.equal(ruta.escrito()!.updatedBy, 5);
    assert.equal(ruta.escrito()!.projectId, method === "POST" ? 1 : undefined);
  }
});

test("M40 b1i2 API: sin permiso no hay escritura ni revelación del conflicto", async () => {
  for (const method of ["POST", "PATCH"] as const) {
    const ruta = cargar(method, { ...actor, permissions: [] });
    assert.equal((await ruta.ejecutar({ code: "A-1", status: "available" })).status, 403);
    assert.equal(ruta.escrito(), undefined);
  }
});

test("M40 b1i3d API: PATCH y DELETE pasan expectedVersion y responden 409 ante conflicto de versión", async () => {
  // PATCH transporta expectedVersion
  const rutaPatch = cargar("PATCH");
  const resPatch = await rutaPatch.ejecutar({ code: "A-2", expectedVersion: 3 });
  assert.equal(resPatch.status, 200);
  assert.equal(rutaPatch.escrito()!.expectedVersion, 3);

  // PATCH con fallo de conflicto responde 409
  const rutaPatchConflicto = cargar("PATCH", actor, new ConflictError("Conflicto de versión"));
  const resPatchConflicto = await rutaPatchConflicto.ejecutar({ code: "A-2", expectedVersion: 2 });
  assert.equal(resPatchConflicto.status, 409);

  // DELETE transporta expectedVersion desde query param
  const rutaDeleteQuery = cargar("DELETE");
  const resDeleteQuery = await rutaDeleteQuery.ejecutar(undefined, "http://localhost/x?expectedVersion=4");
  assert.equal(resDeleteQuery.status, 200);
  assert.equal(rutaDeleteQuery.borrado()!.expectedVersion, 4);

  // DELETE transporta expectedVersion desde body JSON
  const rutaDeleteBody = cargar("DELETE");
  const resDeleteBody = await rutaDeleteBody.ejecutar({ expectedVersion: 5 });
  assert.equal(resDeleteBody.status, 200);
  assert.equal(rutaDeleteBody.borrado()!.expectedVersion, 5);

  // DELETE con conflicto responde 409
  const rutaDeleteConflicto = cargar("DELETE", actor, new ConflictError("Conflicto de versión"));
  const resDeleteConflicto = await rutaDeleteConflicto.ejecutar({ expectedVersion: 1 });
  assert.equal(resDeleteConflicto.status, 409);
});
