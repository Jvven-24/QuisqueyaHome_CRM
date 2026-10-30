/**
 * Hallazgo D19 (2026-10-14): el Portal lee `result.leadId` pero el CRM respondía
 * `{ ok, lead, creado }`. Ejecuta el `route.ts` real con dobles aislados y
 * comprueba el acuse aditivo, el orden token -> cuerpo y la validación.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { z } from "zod";
import { ValidationError } from "../../../../domain/errors.ts";
import * as limites from "../../../../infrastructure/limites.ts";

const TOKEN = "token-de-prueba-0123456789";

type Captura = Record<string, unknown>;

function cargar(opciones: { creado?: boolean } = {}) {
  const capturas: Captura[] = [];
  const source = readFileSync(new URL("./route.ts", import.meta.url), "utf8");
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports: Record<string, unknown> = {};
  const dependencies: Record<string, unknown> = {
    zod: { z },
    "@/application/leads/casos-de-uso": {
      capturarLeadExterno: async (_deps: unknown, entrada: Captura) => {
        capturas.push(entrada);
        return { lead: { id: 4321, contactId: 7, utmSource: entrada.utmSource ?? null }, creado: opciones.creado ?? true };
      },
    },
    "@/domain/catalogs": { OPERATION_TYPES: ["sale", "rent"] },
    "@/infrastructure/contenedor/leads": { leadsParaEscritura: () => ({}) },
    // Seguimiento de origen: mejor esfuerzo, sin clic ni código no cambia nada (lo prueba seguimiento/rutas.test.ts).
    "@/infrastructure/seguimiento/captura": { toquesDeCaptura: async () => null, conOrigen: <T,>(entrada: T) => entrada, guardarAtribucion: async () => {} },
    "@/infrastructure/env": { leadsWebhookToken: () => TOKEN },
    "@/infrastructure/limites": limites,
    "@/infrastructure/http": {
      parseInput: (schema: z.ZodType, input: unknown) => {
        const r = schema.safeParse(input);
        if (r.success) return r.data;
        throw new ValidationError("Revisa los datos enviados.", {});
      },
      errorResponse: (error: unknown) => {
        if (error instanceof ValidationError) return Response.json({ error: error.message }, { status: 400 });
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
  return { post: exports.POST as (request: Request) => Promise<Response>, capturas };
}

const valido = { externalId: "portal_inquiry_abc", fullName: "Ana Pérez", phone: "8095550142" };
const pedir = (cuerpo: unknown, token: string | null = TOKEN) =>
  new Request("http://localhost/api/leads/externo", {
    method: "POST",
    headers: token === null ? {} : { "x-webhook-token": token },
    body: JSON.stringify(cuerpo),
  });

test("leads/externo: responde 200 con leadId igual a lead.id y conserva ok, lead y creado", async () => {
  const ruta = cargar();
  const respuesta = await ruta.post(pedir(valido));
  assert.equal(respuesta.status, 200);
  const cuerpo = await respuesta.json();
  assert.equal(cuerpo.ok, true);
  assert.equal(cuerpo.creado, true);
  assert.equal(cuerpo.lead.id, 4321);
  assert.equal(cuerpo.leadId, 4321);
  assert.equal(cuerpo.leadId, cuerpo.lead.id);
});

test("leads/externo: un reintento idempotente devuelve el mismo leadId con creado=false", async () => {
  const ruta = cargar({ creado: false });
  const cuerpo = await (await ruta.post(pedir(valido))).json();
  assert.equal(cuerpo.creado, false);
  assert.equal(cuerpo.leadId, 4321);
});

test("leads/externo: sin token o con token incorrecto es 401, sin leadId y sin tocar el caso de uso", async () => {
  for (const token of [null, "", "otro-token", TOKEN.slice(0, -1)]) {
    const ruta = cargar();
    const respuesta = await ruta.post(pedir(valido, token));
    assert.equal(respuesta.status, 401);
    const cuerpo = await respuesta.json();
    assert.equal(Object.hasOwn(cuerpo, "leadId"), false);
    assert.equal(ruta.capturas.length, 0);
  }
});

test("leads/externo: el token se comprueba ANTES de leer el cuerpo", async () => {
  const ruta = cargar();
  let leido = false;
  const peticion = new Request("http://localhost/api/leads/externo", { method: "POST", body: "{}" });
  Object.defineProperty(peticion, "json", { value: async () => { leido = true; return {}; } });
  Object.defineProperty(peticion, "text", { value: async () => { leido = true; return "{}"; } });
  const respuesta = await ruta.post(peticion);
  assert.equal(respuesta.status, 401);
  assert.equal(leido, false);
});

test("leads/externo: valida con Zod (400) y no deja pasar campos desconocidos al caso de uso", async () => {
  for (const malo of [{}, { fullName: "Sin id" }, { ...valido, email: "no-es-correo" }, { ...valido, projectId: -3 }]) {
    const ruta = cargar();
    assert.equal((await ruta.post(pedir(malo))).status, 400);
    assert.equal(ruta.capturas.length, 0);
  }
  const ruta = cargar();
  await ruta.post(pedir({ ...valido, brokerId: 99, isAdmin: true, utmSource: "facebook", projectId: "12" }));
  assert.equal(ruta.capturas.length, 1);
  const entrada = ruta.capturas[0]!;
  assert.equal(Object.hasOwn(entrada, "brokerId"), false);
  assert.equal(Object.hasOwn(entrada, "isAdmin"), false);
  assert.equal(entrada.utmSource, "facebook");
  assert.equal(entrada.projectId, 12);
});
