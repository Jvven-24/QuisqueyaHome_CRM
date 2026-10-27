import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync, existsSync } from "node:fs";
import { REGISTRO_MODULOS, type ModuloRegistro } from "./registry.ts";
import { PERMISSION_RESOURCES } from "../domain/catalogs.ts";

const SRC = new URL("../", import.meta.url);
const APP_CRM = new URL("app/(crm)/", SRC);

test("registry: rutas base son únicas", () => {
  const rutas = REGISTRO_MODULOS.map((m) => m.rutaBase);
  const unicas = new Set(rutas);
  assert.equal(unicas.size, rutas.length, `Rutas duplicadas: ${rutas}`);
});

test("registry: cada ruta base tiene su page.tsx", () => {
  for (const m of REGISTRO_MODULOS) {
    // normalizar rutaBase sin / inicial para path
    const rel = m.rutaBase.replace(/^\//, "");
    const pagePath = new URL(`${rel}/page.tsx`, APP_CRM);
    assert.ok(
      existsSync(pagePath),
      `Falta page.tsx para módulo ${m.id} ${m.rutaBase} en ${pagePath}`
    );
  }
});

test("registry: todos los recursos RBAC son válidos y cerrados", () => {
  const validos = new Set(PERMISSION_RESOURCES);
  for (const m of REGISTRO_MODULOS) {
    assert.ok(
      validos.has(m.recurso as any),
      `Recurso inválido en ${m.id}/${m.nombre}: ${m.recurso}`
    );
  }
});

test("registry: subrutas empiezan con / y bases son únicas", () => {
  for (const m of REGISTRO_MODULOS) {
    const subs = m.subrutas ?? [m.rutaBase];
    for (const s of subs) {
      assert.ok(s.startsWith("/"), `Subruta sin / : ${s} en ${m.id}`);
    }
  }
  // subrutas pueden solaparse entre grupos (ej. /aprobaciones en Inicio y Aprobaciones) — intencional
});

test("registry: contiene exactamente 22 módulos", () => {
  assert.equal(REGISTRO_MODULOS.length, 22);
});
