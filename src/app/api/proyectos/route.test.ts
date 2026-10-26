import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { z } from "zod";
import { OPERATION_TYPES, PROJECT_TYPES } from "../../../domain/catalogs.ts";
import { can, requireScope, type Actor } from "../../../domain/rbac.ts";
import { UnauthorizedError, ValidationError } from "../../../domain/errors.ts";
import { nombreProyecto, fechaProyecto, monedaProyecto } from "../../../application/proyectos/validacion.ts";
function cargar(actor: Actor | null) {
  let entrada: Record<string, unknown> | undefined;
  const dependencies: Record<string, unknown> = {
    zod: { z }, "@/domain/catalogs": { OPERATION_TYPES, PROJECT_TYPES }, "@/domain/rbac": { can, requireScope },
    "@/application/proyectos/validacion": { nombreProyecto, fechaProyecto, monedaProyecto },
    "@/infrastructure/auth/actor": { async requireActor() { if (!actor) throw new UnauthorizedError(); return actor; } },
    "@/infrastructure/contenedor/proyectos": { proyectosParaEscritura: () => ({}) },
    "@/application/proyectos/casos-de-uso": { async crearProyecto(_deps: unknown, _actor: unknown, datos: Record<string, unknown>) { entrada = datos; return { id: 1, name: datos.name }; } },
    "@/infrastructure/http": {
      parseInput(schema: z.ZodType, input: unknown) { const r = schema.safeParse(input); if (!r.success) throw new ValidationError("Revisa los datos."); return r.data; },
      errorResponse(error: unknown) { return Response.json({ error: error instanceof Error ? error.message : "Error" }, { status: error instanceof UnauthorizedError ? 401 : 400 }); },
    },
  };
  const code = ts.transpileModule(readFileSync(new URL("./route.ts", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports: Record<string, unknown> = {};
  runInNewContext(code, { exports, Response, require: (name: string) => { assert.ok(Object.hasOwn(dependencies, name), name); return dependencies[name]; } });
  return { post: exports.POST as (request: Request) => Promise<Response>, entrada: () => entrada };
}
const admin: Actor = { userId: 1, roleSlug: "admin", permissions: [{ resource: "projects", action: "create", scope: "all" }] };
test("proyecto POST: sesión y permiso se comprueban antes de leer o validar JSON", async () => {
  for (const [actor, status] of [[null, 401], [{ ...admin, permissions: [] }, 403]] as const) {
    let lecturas = 0;
    const request = { json: async () => { lecturas++; return {}; } } as Request;
    const ruta = cargar(actor);
    assert.equal((await ruta.post(request)).status, status); assert.equal(lecturas, 0); assert.equal(ruta.entrada(), undefined);
  }
});
test("proyecto POST: valida fecha/nombre y copia únicamente campos permitidos", async () => {
  for (const body of [{ name: " " }, { name: "<script>alert(1)</script>" }, { name: "Araya", estimatedDeliveryDate: "2026-02-30" }]) {
    const ruta = cargar(admin);
    assert.equal((await ruta.post(new Request("http://localhost/x", { method: "POST", body: JSON.stringify(body) }))).status, 400);
    assert.equal(ruta.entrada(), undefined);
  }
  const ruta = cargar(admin);
  assert.equal((await ruta.post(new Request("http://localhost/x", { method: "POST", body: JSON.stringify({ name: "  Araya  ", isPublished: true, deletedAt: "hoy", internalPriceCents: 999, progressPercent: 87 }) }))).status, 200);
  const entrada = ruta.entrada()!;
  assert.equal(entrada.name, "Araya"); assert.equal(entrada.progressPercent, 0); assert.equal(entrada.isPublished, undefined); assert.equal(entrada.deletedAt, undefined); assert.equal(entrada.internalPriceCents, undefined);
});

test("G2-16: broker recibe 403 con cuerpo vacío o válido, sin validación ni escritura", async () => {
  for (const body of [{}, { name: "Araya" }, { name: "<script>alert(1)</script>" }]) {
    const ruta = cargar({ userId: 5, roleSlug: "broker", permissions: [] });
    assert.equal((await ruta.post(new Request("http://localhost/x", { method: "POST", body: JSON.stringify(body) }))).status, 403);
    assert.equal(ruta.entrada(), undefined);
  }
});

test("proyecto POST: importes ausentes enviados como null permanecen sin precio", async () => {
  const ruta = cargar(admin);
  const respuesta = await ruta.post(new Request("http://localhost/x", { method: "POST", body: JSON.stringify({ name: "Araya", publicRangeMinCents: null, publicRangeMaxCents: null }) }));
  assert.equal(respuesta.status, 200); assert.equal(ruta.entrada()?.publicRangeMinCents, undefined); assert.equal(ruta.entrada()?.publicRangeMaxCents, undefined);
});
