import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

test("ModuleTabs en modo queryParam conserva los demás parámetros de la URL", () => {
  const src = readFileSync(new URL("./module-tabs.tsx", import.meta.url), "utf8");
  assert.match(src, /useSearchParams\(\)/);
  assert.match(src, /k !== queryParam/);
});

test("Automatizaciones: un solo tabpanel con id único ligado a la pestaña activa", () => {
  const src = readFileSync(new URL("../../app/(crm)/automatizaciones/vista.tsx", import.meta.url), "utf8");
  assert.equal(src.match(/id="automatizaciones-panel"/g)?.length, 1);
  assert.match(src, /aria-labelledby=\{`automatizaciones-panel-tab-\$\{tab\}`\}/);
});
