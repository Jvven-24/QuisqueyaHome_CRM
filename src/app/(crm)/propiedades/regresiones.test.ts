import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
const leer = (ruta: string) => readFileSync(new URL(ruta, import.meta.url), "utf8");
test("proyecto: el nombre HTML se muestra como texto y nunca se inyecta como HTML", () => {
  const html = renderToStaticMarkup(createElement("h2", null, "<script>alert(1)</script>"));
  assert.ok(html.includes("&lt;script&gt;")); assert.equal(html.includes("<script>"), false);
  for (const file of ["./vista.tsx", "./[slug]/vista.tsx", "../avances/vista.tsx"]) assert.doesNotMatch(leer(file), /dangerouslySetInnerHTML/);
});
test("proyecto: los tres lectores derivan el avance de fases, sin usar el caché como dato real", () => {
  for (const file of ["./page.tsx", "../avances/page.tsx"]) {
    const fuente = leer(file); assert.match(fuente, /avg\(\$\{constructionPhases.progressPercent\}/); assert.doesNotMatch(fuente, /progressPercent: projects.progressPercent/);
  }
  assert.match(leer("./[slug]/page.tsx"), /avg\(\$\{constructionPhases.progressPercent\}/);
  assert.match(leer("../avances/vista.tsx"), /promedioAvance\(fases.map/);
});
test("comunicaciones: sin salud ficticia, destinatarios de ejemplo ni semillas durante una lectura", () => {
  const vista = leer("../comunicaciones/vista.tsx");
  assert.doesNotMatch(vista, /Latencia: ~120ms|Carlos Gómez|Cap Cana Luxury Lofts|DESTINATARIOS_RAPIDOS|ventana24hActiva|4G/);
  const repo = leer("../../../infrastructure/db/repos/comunicaciones.ts");
  assert.doesNotMatch(repo, /PLANTILLAS_SEMILLA|process.env|0\.045|0\.001/);
});

test("cotizador: sin precio real de catálogo no se abre usando un importe de ejemplo", () => {
  const fuente = leer("./[slug]/vista.tsx");
  assert.doesNotMatch(fuente, /18500000/);
  assert.match(fuente, /disabled=\{proyecto.publicRangeMinCents == null && proyecto.publicRangeMaxCents == null\}/);
  assert.equal((fuente.match(/disabled=\{precioCotizar <= 0\}/g) ?? []).length, 2);
});
