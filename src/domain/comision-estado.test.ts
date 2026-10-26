/**
 * Pruebas de M9 · Comisiones. Sin base de datos, sin framework: `npm test`
 * las corre con el runner de Node. Una prueba por transición válida y por
 * las combinaciones inválidas que pide el plan (`paid → pendiente`, editar
 * reparto en `approved`), igual que `transicion-etapa.test.ts`.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { ConflictError } from "./errors.ts";
import { validarRepartoEditable, validarTransicionComision } from "./comision-estado.ts";

test("pending → approved es válida", () => {
  assert.doesNotThrow(() => validarTransicionComision("pending", "approved"));
});

test("approved → paid es válida", () => {
  assert.doesNotThrow(() => validarTransicionComision("approved", "paid"));
});

test("pending → void es válida", () => {
  assert.doesNotThrow(() => validarTransicionComision("pending", "void"));
});

test("approved → void es válida", () => {
  assert.doesNotThrow(() => validarTransicionComision("approved", "void"));
});

test("pending → paid lanza: no se puede saltar la aprobación", () => {
  assert.throws(() => validarTransicionComision("pending", "paid"), ConflictError);
});

test("paid → pending lanza: una comisión pagada no retrocede", () => {
  assert.throws(() => validarTransicionComision("paid", "pending"), ConflictError);
});

test("paid → cualquier otro estado lanza", () => {
  assert.throws(() => validarTransicionComision("paid", "approved"), ConflictError);
  assert.throws(() => validarTransicionComision("paid", "void"), ConflictError);
});

test("void → cualquier otro estado lanza", () => {
  assert.throws(() => validarTransicionComision("void", "pending"), ConflictError);
  assert.throws(() => validarTransicionComision("void", "approved"), ConflictError);
});

test("quedarse en el mismo estado siempre lanza", () => {
  assert.throws(() => validarTransicionComision("pending", "pending"), ConflictError);
  assert.throws(() => validarTransicionComision("approved", "approved"), ConflictError);
  assert.throws(() => validarTransicionComision("paid", "paid"), ConflictError);
  assert.throws(() => validarTransicionComision("void", "void"), ConflictError);
});

test("el reparto se puede editar mientras la comisión está pendiente", () => {
  assert.doesNotThrow(() => validarRepartoEditable("pending"));
});

test("editar el reparto de una comisión aprobada lanza", () => {
  assert.throws(() => validarRepartoEditable("approved"), ConflictError);
});

test("editar el reparto de una comisión pagada o anulada lanza", () => {
  assert.throws(() => validarRepartoEditable("paid"), ConflictError);
  assert.throws(() => validarRepartoEditable("void"), ConflictError);
});
