import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const vista = readFileSync(new URL("./vista.tsx", import.meta.url), "utf8");

test("aprobaciones: la vista no muestra selector de estado de demostración", () => {
  assert.doesNotMatch(vista, /Estado de demostración/);
  assert.doesNotMatch(vista, /<select/);
  assert.doesNotMatch(vista, /APPROVAL_STATES/);
});

test("aprobaciones: los botones de la bandeja y de decisión tienen 44px mínimo y ancho completo en móvil", () => {
  assert.match(vista, /className="button min-h-11 w-full sm:w-auto" onClick=\{\(\) => \{setSelected/);
  assert.match(vista, /className="button min-h-11 w-full sm:w-auto" onClick=\{\(\) => setAction\("aprobar"\)\}/);
  assert.match(vista, /className="button min-h-11 w-full sm:w-auto" onClick=\{\(\) => setAction\("rechazar"\)\}/);
});
