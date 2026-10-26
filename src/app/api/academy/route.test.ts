import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { RepositorioAcademyEnMemoria } from "../../../application/academy/en-memoria.ts";
import {
  completarContenidoAcademy,
  listarContenidosAcademy,
  obtenerResumenProgresoBroker,
} from "../../../application/academy/casos-de-uso.ts";
import { ForbiddenError, UnauthorizedError } from "../../../domain/errors.ts";
import { requireScope, type Actor } from "../../../domain/rbac.ts";

// Ejecuta el handler real con el actor y el repositorio aislados, sin DB ni sesión externa.
function academyRoute(repo: RepositorioAcademyEnMemoria, actor: Actor | null) {
  const source = readFileSync(new URL("./route.ts", import.meta.url), "utf8");
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports: Record<string, unknown> = {};
  const dependencies: Record<string, unknown> = {
    "@/application/academy/casos-de-uso": { listarContenidosAcademy, obtenerResumenProgresoBroker },
    "@/domain/rbac": { requireScope },
    "@/infrastructure/auth/actor": {
      requireActor: async () => {
        if (!actor) throw new UnauthorizedError();
        return actor;
      },
    },
    "@/infrastructure/contenedor/academy": { academyRepositorio: () => ({ ejecutar: async (fn: (repo: RepositorioAcademyEnMemoria) => unknown) => fn(repo) }) },
    "@/infrastructure/http": {
      errorResponse: (error: unknown) => {
        if (error instanceof UnauthorizedError) return Response.json({ error: error.message }, { status: 401 });
        if (error instanceof ForbiddenError) return Response.json({ error: error.message }, { status: 403 });
        throw error;
      },
    },
  };
  runInNewContext(code, {
    exports, Request, Response, URL,
    require: (name: string) => {
      assert.ok(Object.hasOwn(dependencies, name), `Dependencia no aislada: ${name}`);
      return dependencies[name];
    },
  });
  return exports.GET as (request: Request) => Promise<Response>;
}

const allowed: Actor = {
  userId: 42,
  roleSlug: "broker",
  permissions: [{ resource: "academy", action: "view", scope: "all" }],
};
const denied: Actor = { userId: 42, roleSlug: "broker", permissions: [] };
const request = () => new Request("http://localhost:9311/api/academy");

test("GET Academy: 401 anónimo y 403 sin academy:view no filtran resumen", async () => {
  const repo = new RepositorioAcademyEnMemoria();
  for (const [actor, status] of [[null, 401], [denied, 403]] as const) {
    const response = await academyRoute(repo, actor)(request());
    assert.equal(response.status, status);
    const body = await response.json();
    assert.equal(Object.hasOwn(body, "resumen"), false);
  }
});

test("GET Academy: 0% y 100% solo publican conteos y porcentaje", async () => {
  const repo = new RepositorioAcademyEnMemoria();
  const get = academyRoute(repo, allowed);
  const initial = await get(request());
  assert.equal(initial.status, 200);
  assert.deepEqual((await initial.json()).resumen, { totalItems: 4, completedItems: 0, percent: 0 });

  for (const id of [1, 2, 3, 4]) {
    await completarContenidoAcademy(repo, allowed.userId, id, 100, true);
  }
  const completed = await get(request());
  assert.equal(completed.status, 200);
  const body = await completed.json();
  assert.deepEqual(body.resumen, { totalItems: 4, completedItems: 4, percent: 100 });
  assert.equal(Object.hasOwn(body.resumen, "isCertified"), false);
});
