import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const require = createRequire(import.meta.url);
const source = await import("node:fs").then(({ readFileSync }) => readFileSync(new URL("./resumen-compacto.tsx", import.meta.url), "utf8"));
const javascript = ts.transpileModule(source, {
  fileName: "resumen-compacto.tsx",
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX },
}).outputText
  .replace(/from "react\/jsx-runtime"/g, `from ${JSON.stringify(pathToFileURL(require.resolve("react/jsx-runtime")).href)}`)
  .replace(/from "react"/g, `from ${JSON.stringify(pathToFileURL(require.resolve("react")).href)}`);
const { ResumenCompacto } = await import(`data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`);

test("ResumenCompacto conserva jerarquía compacta, valor tabular y textos extensos sin ensanchar la tarjeta", () => {
  const html = renderToStaticMarkup(React.createElement(ResumenCompacto, {
    etiqueta: "Proyección ponderada de oportunidades",
    valor: "US$ 1,250,000.00",
    detalle: "Volumen proyectado USD para el periodo actual",
  }));
  assert.match(html, /Proyección ponderada de oportunidades/);
  assert.match(html, /US\$ 1,250,000\.00/);
  assert.match(html, /tabular-nums/);
  assert.match(html, /min-w-0/);
  assert.match(html, /overflow-wrap:anywhere/);
  assert.match(html, /line-clamp-2/);
});

test("ResumenCompacto presenta variación con dirección textual y soporte para periodo", () => {
  const html = renderToStaticMarkup(React.createElement(ResumenCompacto, {
    etiqueta: "Cierres",
    valor: 12,
    variacion: { valor: "8 %", direccion: "sube", periodo: "vs. mes anterior", etiquetaAccesible: "Aumentó" },
  }));
  assert.match(html, /↑/);
  assert.match(html, /Aumentó 8 %/);
  assert.match(html, /vs\. mes anterior/);
});

test("ResumenCompacto interactivo es un botón accesible con estado pressed", () => {
  const html = renderToStaticMarkup(React.createElement(ResumenCompacto, {
    etiqueta: "Leads nuevos",
    valor: 3,
    onClick: () => {},
    pressed: true,
  }));
  assert.match(html, /^<button/);
  assert.match(html, /aria-pressed="true"/);
  assert.match(html, /focus-visible:outline/);
});
