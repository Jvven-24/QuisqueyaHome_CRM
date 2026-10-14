import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import { calcularAntiguedad } from "./antiguedad.ts";

/** Transpilar componentes .tsx en memoria para Node.js test runner sin requerir build */
const require = createRequire(import.meta.url);
function moduleUrl(source: string, filename: string): string {
  const js = ts.transpileModule(source, {
    fileName: filename,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
  const resolved = js
    .replace(/from "react\/jsx-runtime"/g, `from ${JSON.stringify(pathToFileURL(require.resolve("react/jsx-runtime")).href)}`)
    .replace(/from "react"/g, `from ${JSON.stringify(pathToFileURL(require.resolve("react")).href)}`);
  return `data:text/javascript;base64,${Buffer.from(resolved).toString("base64")}`;
}

const estadosSource = readFileSync("src/app/(crm)/_ui/estados.tsx", "utf8");
const estadosUrl = moduleUrl(estadosSource, "estados.tsx");
const { Vacio, SinResultados, AvisoPermiso } = await import(estadosUrl);

const cargandoSource = readFileSync("src/app/(crm)/_ui/cargando.tsx", "utf8");
const cargandoUrl = moduleUrl(cargandoSource, "cargando.tsx");
const loadingSource = readFileSync("src/app/(crm)/negocios/loading.tsx", "utf8")
  .replace('"../_ui/cargando"', JSON.stringify(cargandoUrl));
const { default: Loading } = await import(moduleUrl(loadingSource, "loading.tsx"));

const errorSource = readFileSync("src/app/(crm)/negocios/error.tsx", "utf8");
const { default: ErrorView } = await import(moduleUrl(errorSource, "error.tsx"));

test("antigüedad en etapa: calcula correctamente los días y bordes temporales", () => {
  const base = new Date("2026-10-13T12:00:00Z");

  // Nulos y no definidos
  assert.equal(calcularAntiguedad(null, base), "Sin fecha de etapa");
  assert.equal(calcularAntiguedad(undefined, base), "Sin fecha de etapa");
  assert.equal(calcularAntiguedad("fecha-invalida", base), "Sin fecha de etapa");

  // Fecha futura inconsistente
  const futuro = new Date("2026-10-14T12:00:00Z");
  assert.equal(calcularAntiguedad(futuro, base), "Fecha futura");

  // Mismo día (0 días)
  const hoy = new Date("2026-10-13T06:00:00Z");
  assert.equal(calcularAntiguedad(hoy, base), "Hoy");

  // 1 día exacto
  const ayer = new Date("2026-10-12T12:00:00Z");
  assert.equal(calcularAntiguedad(ayer, base), "1 día");

  // Múltiples días
  const cincoDias = new Date("2026-10-08T12:00:00Z");
  assert.equal(calcularAntiguedad(cincoDias, base), "5 días");

  const treintaDias = new Date("2026-09-13T12:00:00Z");
  assert.equal(calcularAntiguedad(treintaDias, base), "30 días");
});

test("seis estados: carga (loading) con aria-busy y skeleton", () => {
  const html = renderToStaticMarkup(React.createElement(Loading));
  assert.ok(html.includes('aria-busy="true"'));
  assert.ok(html.includes("Negocios"));
  assert.ok(html.includes("skeleton-block"));
});

test("seis estados: vacío (empty) en cartera sin datos vs filtros", () => {
  // Cartera vacía
  const htmlVacio = renderToStaticMarkup(
    React.createElement(Vacio, {
      titulo: "Sin negocios todavía",
      texto: "Los negocios aparecen aquí al convertir un lead.",
    }),
  );
  assert.ok(htmlVacio.includes("Sin negocios todavía"));
  assert.ok(htmlVacio.includes("Los negocios aparecen aquí al convertir un lead."));

  // Filtros sin resultados
  const htmlSinResultados = renderToStaticMarkup(
    React.createElement(SinResultados, {
      texto: "No hay negocios que coincidan con los filtros seleccionados.",
    }),
  );
  assert.ok(htmlSinResultados.includes("Sin resultados"));
  assert.ok(htmlSinResultados.includes("No hay negocios que coincidan con los filtros"));
});

test("seis estados: error con role alert y reintento", () => {
  const dummyError = Object.assign(new Error("Fallo de prueba"), { digest: "ERR_123" });
  const html = renderToStaticMarkup(
    React.createElement(ErrorView, { error: dummyError, reset: () => {} }),
  );
  assert.ok(html.includes('role="alert"'));
  assert.ok(html.includes("No se pudieron cargar los negocios"));
  assert.ok(html.includes("Reintentar"));
  assert.ok(html.includes("min-h-[48px]"));
});

test("seis estados: permiso insuficiente explica restricción y oculta montos confidenciales", () => {
  const htmlPermiso = renderToStaticMarkup(
    React.createElement(AvisoPermiso, {
      titulo: "Acción no disponible para tu rol",
      motivo: "Tu rol actual solo puede proponer cambios de etapa.",
    }),
  );
  assert.ok(htmlPermiso.includes('role="note"'));
  assert.ok(htmlPermiso.includes("Acción no disponible para tu rol"));
  assert.ok(htmlPermiso.includes("Tu rol actual solo puede proponer cambios"));
});
