import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

test("ModuleTabs en modo queryParam conserva los demás parámetros de la URL", () => {
  const src = readFileSync(new URL("./module-tabs.tsx", import.meta.url), "utf8");
  assert.match(src, /useSearchParams\(\)/);
  assert.match(src, /k !== queryParam/);
  assert.match(src, /role=\{isTabList \? "tab" : undefined\}/);
  assert.match(src, /aria-selected=\{isTabList \? active : undefined\}/);
  assert.match(src, /role=\{isTabList \? "tablist" : undefined\}/);
});

test("ModuleTabs de rutas identifica el enlace actual y muestra fade según el overflow real", () => {
  const src = readFileSync(new URL("./module-tabs.tsx", import.meta.url), "utf8");
  assert.match(src, /aria-current=\{!isTabList && active \? "page" : undefined\}/);
  assert.match(src, /nav\.scrollLeft \+ nav\.clientWidth < nav\.scrollWidth - 1/);
  assert.match(src, /overflow\.right && <span aria-hidden="true"/);
  assert.match(src, /overflow\.left && <span aria-hidden="true"/);
  assert.match(src, /nav\.addEventListener\("scroll", updateOverflow, \{ passive: true \}\)/);
  assert.match(src, /observer\.observe\(nav\.firstElementChild\)/);
});

test("Automatizaciones: un solo tabpanel con id único ligado a la pestaña activa", () => {
  const src = readFileSync(new URL("../../app/(crm)/automatizaciones/vista.tsx", import.meta.url), "utf8");
  assert.equal(src.match(/id="automatizaciones-panel"/g)?.length, 1);
  assert.match(src, /aria-labelledby=\{`automatizaciones-panel-tab-\$\{tab\}`\}/);
});
