/**
 * Hallazgo D21/D12 (2026-10-14): despachar mensajes externos exigía solo
 * `communications:view`. Ejecuta el `route.ts` real con dobles aislados (sin DB
 * ni sesión) y comprueba que ahora hace falta `communications:create` con
 * alcance `all`, y que cada despacho deja rastro.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { z } from "zod";
import { despacharMensajeAuditado } from "../../../../application/comunicaciones/casos-de-uso.ts";
import type { MensajeADespachar, RegistroDespacho } from "../../../../application/comunicaciones/puertos.ts";
import { ForbiddenError, UnauthorizedError, ValidationError } from "../../../../domain/errors.ts";
import { requireFullScope, type Actor, type Permission } from "../../../../domain/rbac.ts";

function cargar(actor: Actor | null) {
  const despachados: MensajeADespachar[] = [];
  const registros: { actorId: number; registro: RegistroDespacho }[] = [];
  const source = readFileSync(new URL("./route.ts", import.meta.url), "utf8");
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports: Record<string, unknown> = {};
  const dependencies: Record<string, unknown> = {
    zod: { z },
    "@/application/comunicaciones/casos-de-uso": { despacharMensajeAuditado },
    "@/domain/rbac": { requireFullScope },
    "@/infrastructure/auth/actor": {
      requireActor: async () => {
        if (!actor) throw new UnauthorizedError();
        return actor;
      },
    },
    "@/infrastructure/contenedor/comunicaciones": {
      proveedorDespacho: () => ({
        despachar: async (m: MensajeADespachar) => {
          despachados.push(m);
          return { ok: true, canal: m.canal, mensajeId: "m-1", enviadoAt: new Date() };
        },
      }),
      auditoriaDespachos: () => ({
        registrar: async (a: Actor, registro: RegistroDespacho) => { registros.push({ actorId: a.userId, registro }); },
      }),
    },
    "@/infrastructure/http": {
      parseInput: (schema: z.ZodType, input: unknown) => {
        const r = schema.safeParse(input);
        if (r.success) return r.data;
        throw new ValidationError("Revisa los datos enviados.", {});
      },
      errorResponse: (error: unknown) => {
        if (error instanceof UnauthorizedError) return Response.json({ error: error.message }, { status: 401 });
        if (error instanceof ForbiddenError) return Response.json({ error: error.message }, { status: 403 });
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
  return { post: exports.POST as (request: Request) => Promise<Response>, despachados, registros };
}

const actorCon = (roleSlug: string, ...permisos: Permission[]): Actor => ({ userId: 9, roleSlug, permissions: permisos });
const soloVer = actorCon("broker", { resource: "communications", action: "view", scope: "all" });
const creaPropio = actorCon("broker",
  { resource: "communications", action: "view", scope: "all" },
  { resource: "communications", action: "create", scope: "own" });
const asistente = actorCon("assistant",
  { resource: "communications", action: "view", scope: "all" },
  { resource: "communications", action: "create", scope: "all" });

const peticion = () => new Request("http://localhost/api/comunicaciones/despachar", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ canal: "whatsapp", destinatario: "+18095550142", cuerpoOPlantilla: "Hola {nombre}", variables: { nombre: "Ana" } }),
});

test("despachar: 401 anónimo; 403 con solo communications:view o con create de alcance own; nada se envía", async () => {
  for (const [actor, status] of [[null, 401], [soloVer, 403], [creaPropio, 403], [actorCon("x"), 403]] as const) {
    const ruta = cargar(actor);
    const respuesta = await ruta.post(peticion());
    assert.equal(respuesta.status, status);
    assert.equal(ruta.despachados.length, 0, "no debe llegar al proveedor");
    assert.equal(ruta.registros.length, 0);
  }
});

test("despachar: con communications:create/all envía y deja un registro con el destinatario enmascarado", async () => {
  const ruta = cargar(asistente);
  const respuesta = await ruta.post(peticion());
  assert.equal(respuesta.status, 200);
  const cuerpo = await respuesta.json();
  assert.equal(cuerpo.ok, true);
  assert.equal(cuerpo.auditado, true);
  assert.equal(ruta.despachados.length, 1);
  assert.equal(ruta.despachados[0]!.mensaje, "Hola Ana");
  assert.equal(ruta.despachados[0]!.metadata?.solicitadoPorUserId, 9);
  assert.equal(ruta.registros.length, 1);
  assert.equal(ruta.registros[0]!.actorId, 9);
  assert.equal(ruta.registros[0]!.registro.destinatarioEnmascarado, "***142");
  assert.ok(!JSON.stringify(ruta.registros).includes("5550142"));
});

test("despachar: cuerpo inválido es 400 y no se envía ni se registra", async () => {
  const ruta = cargar(asistente);
  const respuesta = await ruta.post(new Request("http://localhost/x", { method: "POST", body: "{}" }));
  assert.equal(respuesta.status, 400);
  assert.equal(ruta.despachados.length, 0);
  assert.equal(ruta.registros.length, 0);
});
