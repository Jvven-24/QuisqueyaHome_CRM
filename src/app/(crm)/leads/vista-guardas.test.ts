/**
 * Guardas estructurales de la vista de Leads (M01 / M2 · Private Desk).
 * Verifica criterios de accesibilidad, Decisión #47 y ausencia de diálogos nativos.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const BASE = "src/app/(crm)/leads/";
const ARCHIVOS_VISTA = ["inspector.tsx", "vista.tsx"];
const fuente = (archivo: string) => readFileSync(BASE + archivo, "utf8");

test("Leads: sin diálogos nativos del navegador (confirm/alert)", () => {
  for (const archivo of ARCHIVOS_VISTA) {
    const texto = fuente(archivo);
    assert.ok(
      !/\b(alert|confirm|prompt)\(/.test(texto),
      `${archivo}: usa diálogos nativos del navegador`,
    );
  }
});

test("Leads: controles táctiles de 48 px y sin clases prohibidas", () => {
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

test("Leads: tipografía >= 13 px en elementos visibles", () => {
  for (const archivo of ARCHIVOS_VISTA) {
    const texto = fuente(archivo);
    assert.ok(
      !/\btext-xs\b|text-\[(?:9|10|11|12)(?:\.\d+)?px\]/.test(texto),
      `${archivo}: contiene tipografía menor de 13 px`,
    );
  }
});

test("Leads Inspector: respeta Decisión #47 (reasignación solo admin y toma de lead por broker)", () => {
  const inspector = fuente("inspector.tsx");
  assert.ok(
    inspector.includes("esAdmin") && inspector.includes("tomarLead"),
    "inspector.tsx debe separar la reasignación de admin de la toma de lead por broker",
  );
  assert.ok(
    inspector.includes("Tomar este lead"),
    "inspector.tsx debe ofrecer la acción de tomar lead no asignado",
  );
});
