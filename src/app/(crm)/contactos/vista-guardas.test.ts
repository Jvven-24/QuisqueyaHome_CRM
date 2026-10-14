/**
 * Guardas estructurales de la vista de Contactos (M1 · Private Desk).
 * Verifica criterios de accesibilidad, ausencia de diálogos nativos y controles táctiles de 48 px.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const BASE = "src/app/(crm)/contactos/";
const ARCHIVOS_VISTA = ["inspector.tsx", "vista.tsx"];
const fuente = (archivo: string) => readFileSync(BASE + archivo, "utf8");

test("Contactos: sin diálogos nativos del navegador (confirm/alert)", () => {
  for (const archivo of ARCHIVOS_VISTA) {
    const texto = fuente(archivo);
    assert.ok(
      !/\b(alert|confirm|prompt)\(/.test(texto),
      `${archivo}: usa diálogos nativos del navegador`,
    );
  }
});

test("Contactos: controles táctiles de 48 px y sin clases prohibidas", () => {
  for (const archivo of ARCHIVOS_VISTA) {
    const texto = fuente(archivo);
    assert.ok(
      !/\bmin-h-(8|9|10|11)\b/.test(texto),
      `${archivo}: contiene controles por debajo de 48 px (min-h-12)`,
    );
    assert.ok(
      !/hidden md:flex|md:hidden/.test(texto),
      `${archivo}: prohibido ocultar con CSS en vez de Javascript`,
    );
  }
});

test("Contactos: tipografía >= 13 px en elementos visibles", () => {
  for (const archivo of ARCHIVOS_VISTA) {
    const texto = fuente(archivo);
    assert.ok(
      !/\btext-xs\b|text-\[(?:9|10|11|12)(?:\.\d+)?px\]/.test(texto),
      `${archivo}: contiene tipografía menor de 13 px`,
    );
  }
});
