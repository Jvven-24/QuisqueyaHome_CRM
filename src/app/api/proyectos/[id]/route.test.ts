import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { test } from "node:test";
import ts from "typescript";
import { z } from "zod";
import { OPERATION_TYPES, PROJECT_TYPES } from "../../../../domain/catalogs.ts";
import { can, requireScope, stripRestrictedPrices, type Actor } from "../../../../domain/rbac.ts";
import { ValidationError } from "../../../../domain/errors.ts";
import { crearProyecto, editarProyecto } from "../../../../application/proyectos/casos-de-uso.ts";
import { proyectosEnMemoria } from "../../../../application/proyectos/en-memoria.ts";
import { auditoriaEnMemoria } from "../../../../application/testing/auditoria-en-memoria.ts";
import { unidadDeTrabajoEnMemoria } from "../../../../application/testing/unidad-de-trabajo-en-memoria.ts";

test("G2-08: PATCH usa la misma validación HTML y no llama a escritura con nombre inválido", async () => {
  const actor: Actor = { userId: 1, roleSlug: "admin", permissions: [{ resource: "projects", action: "edit", scope: "all" }] };
  const proyectos = proyectosEnMemoria();
  const auditoria = auditoriaEnMemoria();
  const escritura = { proyectos, unidad: unidadDeTrabajoEnMemoria({ proyectos, auditoria }, [proyectos, auditoria]) };
  await crearProyecto(escritura, actor, { name: "Araya", slug: "araya", createdBy: 1, updatedBy: 1 });
  const deps: Record<string, unknown> = {
    zod: { z }, "@/domain/catalogs": { OPERATION_TYPES, PROJECT_TYPES },
    "@/domain/rbac": { can, requireScope, stripRestrictedPrices },
    "@/infrastructure/auth/actor": { requireActor: async () => actor },
    "@/infrastructure/contenedor/proyectos": { proyectosParaEscritura: () => escritura },
    "@/application/proyectos/casos-de-uso": { editarProyecto },
    "@/infrastructure/http": {
      idsDeRuta: (id: string) => [Number(id)], vaciosANull: (body: unknown) => body,
      parseInput(schema: z.ZodType, body: unknown) { const r = schema.safeParse(body); if (!r.success) throw new ValidationError(r.error.issues[0]!.message, { name: r.error.issues[0]!.message }); return r.data; },
      errorResponse: (error: ValidationError) => Response.json({ error: error.message, fields: error.fields }, { status: 400 }),
    },
  };
  const code = ts.transpileModule(readFileSync(new URL("./route.ts", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const exports: Record<string, unknown> = {};
  runInNewContext(code, { exports, Response, require: (name: string) => { assert.ok(Object.hasOwn(deps, name), name); return deps[name]; } });
  const patch = exports.PATCH as (request: Request, context: { params: Promise<{ id: string }> }) => Promise<Response>;
  for (const name of ["<script>alert(1)</script>", "Araya <b>Beach</b>"]) {
    const response = await patch(new Request("http://localhost/x", { method: "PATCH", body: JSON.stringify({ name }) }), { params: Promise.resolve({ id: "1" }) });
    assert.equal(response.status, 400);
    assert.match((await response.json()).fields.name, /sin etiquetas HTML/);
  }
  assert.equal(proyectos.proyectos[0]!.name, "Araya");
  assert.equal(auditoria.registros.length, 1); // Solo el alta inicial.
  assert.equal((await patch(new Request("http://localhost/x", { method: "PATCH", body: JSON.stringify({ name: "Bávaro & Sol" }) }), { params: Promise.resolve({ id: "1" }) })).status, 200);
  assert.equal(auditoria.registros.length, 2);
});
