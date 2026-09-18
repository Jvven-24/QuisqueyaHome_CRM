/**
 * Pruebas de `domain/csv.ts`. Sin base de datos, sin framework.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { escaparCampoCsv, filaCsv, generarCsv } from "./csv.ts";

test("un campo sin coma, comilla ni salto de línea se deja tal cual", () => {
  assert.equal(escaparCampoCsv("Laura Gómez"), "Laura Gómez");
});

test("un campo con coma va entre comillas", () => {
  assert.equal(escaparCampoCsv("Bávaro, Punta Cana"), '"Bávaro, Punta Cana"');
});

test("un campo con comillas dobles las duplica y va entre comillas", () => {
  assert.equal(escaparCampoCsv('El "mejor" broker'), '"El ""mejor"" broker"');
});

test("un campo con salto de línea va entre comillas", () => {
  assert.equal(escaparCampoCsv("línea 1\nlínea 2"), '"línea 1\nlínea 2"');
});

test("filaCsv escapa cada campo y los une con comas", () => {
  assert.equal(filaCsv(["Laura Gómez", "Bávaro, Beach", 132000]), 'Laura Gómez,"Bávaro, Beach",132000');
});

// Inyección de fórmula (CSV injection, OWASP): un campo de texto que empiece
// con =, +, -, @, tab o retorno de carro se interpreta como fórmula al
// abrirlo en Excel/Sheets/LibreOffice. Anteponer un `'` lo deja como texto.
test("un campo que empieza con = lleva un ' de escape antes", () => {
  assert.equal(escaparCampoCsv("=SUM(A1:A2)"), "'=SUM(A1:A2)");
});

test("un campo que empieza con +, -, @ o tab también lleva el '", () => {
  assert.equal(escaparCampoCsv("+1234567890"), "'+1234567890");
  assert.equal(escaparCampoCsv("-2+3"), "'-2+3");
  assert.equal(escaparCampoCsv("@alguien"), "'@alguien");
  assert.equal(escaparCampoCsv("\tcomando"), "'\tcomando");
});

test("un campo que empieza con retorno de carro lleva el ' y además va entre comillas (\\r también es un separador RFC 4180)", () => {
  assert.equal(escaparCampoCsv("\rcomando"), '"\'\rcomando"');
});

test("una fórmula que además trae coma queda escapada Y entre comillas", () => {
  assert.equal(escaparCampoCsv("=A1,A2"), '"\'=A1,A2"');
});

test("filaCsv no aplica el escape de fórmula a números: un negativo se serializa tal cual", () => {
  assert.equal(filaCsv([-50, "texto normal"]), "-50,texto normal");
});

test("generarCsv arma encabezado + filas con BOM y \\r\\n", () => {
  const csv = generarCsv(["Nombre", "Monto"], [["Laura", 100], ["Carlos, Peña", 200]]);
  assert.equal(csv, '﻿Nombre,Monto\r\nLaura,100\r\n"Carlos, Peña",200\r\n');
});
