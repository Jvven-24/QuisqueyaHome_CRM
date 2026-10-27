import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const fuente = readFileSync(new URL("./data-table.tsx", import.meta.url), "utf8");

test("ficha móvil: sin onAbrir la cabecera no es <button> (evita React #418 por botón anidado)", () => {
  assert.match(fuente, /const CabeceraFicha: ElementType = onAbrir \? "button" : "div";/);
  const ficha = fuente.slice(fuente.indexOf("{medioMovil && <span"));
  const cabecera = ficha.slice(0, ficha.indexOf("</CabeceraFicha>"));
  assert.ok(cabecera.includes("<CabeceraFicha"), "la cabecera usa la etiqueta condicional");
  assert.ok(!/<button\b/.test(cabecera), "no queda un <button> fijo envolviendo el título");
});
