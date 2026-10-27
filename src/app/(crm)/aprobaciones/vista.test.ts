import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const vista = readFileSync(new URL("./vista.tsx", import.meta.url), "utf8");
const tokens = readFileSync(new URL("../../tokens.css", import.meta.url), "utf8");

test("aprobaciones: la vista no muestra selector de estado de demostración", () => {
  assert.doesNotMatch(vista, /Estado de demostración/);
  assert.doesNotMatch(vista, /<select/);
  assert.doesNotMatch(vista, /APPROVAL_STATES/);
});

test("aprobaciones: los botones de la bandeja y de decisión tienen 44px mínimo y ancho completo en móvil", () => {
  assert.match(vista, /className="button private-action w-full sm:w-auto" onClick=\{\(\) => \{setSelected/);
  assert.match(vista, /className="button private-action w-full sm:w-auto" onClick=\{\(\) => setAction\("aprobar"\)\}/);
  assert.match(vista, /className="button private-action w-full sm:w-auto" onClick=\{\(\) => setAction\("rechazar"\)\}/);
  assert.match(tokens, /\.private-action \{ min-height: 44px; min-width: 44px; \}/);
});

test("aprobaciones: ningún botón usa altura fija suelta; todos usan private-action", () => {
  assert.doesNotMatch(vista, /min-h-11/);
});

test("aprobaciones: el filtro de tipo conserva 44px mínimo por token", () => {
  assert.match(vista, /className="private-filter"/);
  assert.match(tokens, /\.private-saved-view, \.private-filter \{ min-height: 44px;/);
});

test("aprobaciones: el modal de decisión ocupa la pantalla completa en móvil", () => {
  assert.match(vista, /<DialogContent showCloseButton=\{false\} className="top-0 left-0 h-dvh max-h-dvh w-full/);
  assert.match(vista, /sm:max-w-lg/);
  assert.match(vista, /<DialogClose className="button private-action shrink-0">Cerrar<\/DialogClose>/);
});
