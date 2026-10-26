/**
 * F03: ejecuta los PATCH reales con Auth y casos de uso aislados.
 * Sigue evaluation-login.test.ts: transpila los aliases de Next para Node;
 * Zod, RBAC y la traducción HTTP son reales, sin servidor ni base de datos.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { z } from "zod";
import * as catalogs from "../domain/catalogs.ts";
import * as errors from "../domain/errors.ts";
import * as rbac from "../domain/rbac.ts";
import type { Actor } from "../domain/rbac.ts";

function cargarFuente<T>(ruta: string, dependencias: Record<string, unknown>): T {
  const fuente = readFileSync(new URL(ruta, import.meta.url), "utf8");
  const codigo = ts.transpileModule(fuente, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  runInNewContext(codigo, {
    exports, Response, console,
    require(nombre: string) {
      assert.ok(Object.hasOwn(dependencias, nombre), `Dependencia no aislada: ${nombre}`);
      return dependencias[nombre];
    },
  });
  return exports as T;
}

const http = cargarFuente<Record<string, unknown>>("./http.ts", {
  zod: { z }, "@/domain/errors": errors,
});

type Ruta = {
  PATCH(request: Request, context: { params: Promise<{ id: string; unitId: string }> }): Promise<Response>;
};

const recursos = [
  { recurso: "projects", ruta: "../app/api/proyectos/[id]/route.ts", clave: "proyecto", campo: "internalPriceCents", inocuo: { name: "Nombre nuevo" } },
  { recurso: "units", ruta: "../app/api/proyectos/[id]/unidades/[unitId]/route.ts", clave: "unidad", campo: "realPriceCents", inocuo: { code: "A-2" } },
] as const;

for (const recurso of recursos) {
  for (const permisos of [
    { nombre: "sin ver ni editar precio", ver: false, editar: false },
    { nombre: "editar precio sin verlo", ver: false, editar: true },
    { nombre: "ver precio sin editarlo", ver: true, editar: false },
    { nombre: "ver y editar precio", ver: true, editar: true },
  ]) {
    for (const modificacion of ["vacía", "inocua", "precio"] as const) {
      test(`F03 ${recurso.recurso}: edición ${modificacion}, ${permisos.nombre}`, async () => {
        const actor: Actor = {
          userId: 7, roleSlug: "broker",
          permissions: [
            { resource: recurso.recurso, action: "edit", scope: "own" },
            { resource: "unit_real_price", action: "view", scope: permisos.ver ? "all" : "none" },
            { resource: "unit_real_price", action: "edit", scope: permisos.editar ? "all" : "none" },
          ],
        };
        const fila = {
          id: 3, projectId: 2, brokerId: 7, name: "Proyecto", code: "A-1",
          [recurso.campo]: 25_000_000,
          publicRangeMinCents: 20_000_000, publicRangeMaxCents: 30_000_000,
        };
        let cambiosRecibidos: Record<string, unknown> | undefined;
        const editar = async (...argumentos: unknown[]) => {
          assert.equal(argumentos[1], actor);
          assert.equal(argumentos[2], "own");
          cambiosRecibidos = argumentos.at(-1) as Record<string, unknown>;
          return { ...fila, ...cambiosRecibidos };
        };
        const ruta = cargarFuente<Ruta>(recurso.ruta, {
          zod: { z }, "@/domain/catalogs": catalogs, "@/domain/rbac": rbac,
          "@/domain/errors": errors,
          "@/infrastructure/http": http,
          "@/infrastructure/auth/actor": { requireActor: async () => actor },
          "@/infrastructure/contenedor/proyectos": { proyectosParaEscritura: () => ({}) },
          "@/application/proyectos/casos-de-uso": { editarProyecto: editar, editarUnidad: editar },
        });
        const cuerpo = modificacion === "vacía" ? {}
          : modificacion === "inocua" ? recurso.inocuo
          : { [recurso.campo]: 28_000_000 };
        const respuesta = await ruta.PATCH(new Request("http://localhost/api/proyectos/2", {
          method: "PATCH", body: JSON.stringify(cuerpo),
        }), { params: Promise.resolve({ id: "2", unitId: "3" }) });
        assert.equal(respuesta.status, 200);
        const resultado = await respuesta.json();
        assert.equal(resultado.ok, true);
        assert.ok(cambiosRecibidos);
        const esperado = modificacion === "precio" && permisos.editar ? 28_000_000 : 25_000_000;
        assert.equal(resultado[recurso.clave][recurso.campo], permisos.ver ? esperado : null);
        assert.equal(resultado[recurso.clave].publicRangeMinCents, 20_000_000);
        assert.equal(resultado[recurso.clave].publicRangeMaxCents, 30_000_000);
        assert.equal(cambiosRecibidos[recurso.campo], modificacion === "precio" && permisos.editar ? 28_000_000 : undefined);
        if (modificacion === "inocua") {
          for (const [campo, valor] of Object.entries(recurso.inocuo)) {
            assert.equal(cambiosRecibidos[campo], valor);
            assert.equal(resultado[recurso.clave][campo], valor);
          }
        }
        assert.equal(fila[recurso.campo], 25_000_000);
      });
    }
  }
}
