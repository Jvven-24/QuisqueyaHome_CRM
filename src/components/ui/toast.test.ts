import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { idToast } from "./toast.ts";

test("las repeticiones del mismo aviso comparten ID y Sonner los actualiza", () => {
  assert.equal(idToast("success", "Guardado"), idToast("success", "Guardado"));
  assert.notEqual(idToast("success", "Guardado"), idToast("error", "Guardado"));
  assert.notEqual(idToast("success", "Guardado"), idToast("success", "Actualizado"));
});

test("el Toaster central conserva iconos, tokens semánticos y límites accesibles", () => {
  const source = readFileSync(new URL("./sonner.tsx", import.meta.url), "utf8");
  assert.match(source, /position="top-right"/);
  assert.match(source, /closeButton/);
  assert.match(source, /visibleToasts=\{3\}/);
  const styles = readFileSync("src/app/globals.css", "utf8");
  assert.match(styles, /data-type="success"\].*var\(--success-bg\)/);
  assert.match(styles, /data-type="error"\].*var\(--danger-bg\)/);
  assert.match(styles, /data-type="info"\].*var\(--info-bg\)/);
});

test("Sonner central declara anuncios accesibles y sustituye los avisos locales transitorios", () => {
  const sonnerRuntime = readFileSync("node_modules/sonner/dist/index.mjs", "utf8");
  const layout = readFileSync("src/app/(crm)/layout.tsx", "utf8");
  const comunicaciones = readFileSync("src/app/(crm)/comunicaciones/vista.tsx", "utf8");
  const comisiones = readFileSync("src/app/(crm)/comisiones/vista.tsx", "utf8");
  const papelera = readFileSync("src/app/(crm)/configuracion/_papelera.tsx", "utf8");
  assert.match(sonnerRuntime, /"aria-live": "polite"/);
  assert.equal((layout.match(/<Toaster\s*\/>/g) ?? []).length, 1);
  assert.match(comunicaciones, /mostrarToast\("success"/);
  assert.doesNotMatch(comunicaciones, /errorMensaje|notificacionExito|role="alert"[\s\S]*Cerrar/);
  assert.match(comisiones, /mostrarToast\("error"/);
  assert.doesNotMatch(comisiones, /mensajeNotificacion/);
  assert.match(papelera, /mostrarToast\("success"/);
  assert.doesNotMatch(papelera, /mensajeExito|mensajeError/);
});
