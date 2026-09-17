/**
 * CSV puro (M9 · Comisiones, `docs/F3_ANALISIS_Y_PLAN.md` §3 hallazgo 7,
 * decisión #37). Mismo criterio que `domain/ics.ts`: texto generado a mano,
 * sin librería de hojas de cálculo — Excel abre CSV directo. Sin base de
 * datos ni Next: se prueba entero con `node --test`.
 */

/**
 * Prefijos con los que Excel, Google Sheets y LibreOffice leen un campo como
 * **fórmula** en vez de texto (inyección CSV/"CSV injection", OWASP): un
 * contacto o proyecto con un nombre que empiece así, si viene de un dato que
 * un usuario externo pudo escribir (una web a través de M2 · Leads,
 * eventualmente), ejecutaría esa fórmula en la hoja de quien abre el reporte.
 */
const PREFIJOS_FORMULA = new Set(["=", "+", "-", "@", "\t", "\r"]);

/** Antepone un `'` si el campo empieza por uno de `PREFIJOS_FORMULA`: Excel lo toma como "esto es texto" y no lo muestra. */
function neutralizarFormula(valor: string): string {
  return PREFIJOS_FORMULA.has(valor[0] ?? "") ? `'${valor}` : valor;
}

/**
 * Escapa un campo de **texto** según RFC 4180 (comillas si trae coma, comilla
 * o salto de línea) y neutraliza una posible fórmula (`neutralizarFormula`).
 * Solo para texto: un monto se pasa a `filaCsv` como `number`, no como
 * cadena, así que nunca entra aquí — un monto negativo legítimo (no se
 * espera ninguno hoy, pero por si acaso) no debe llevar el `'` de escape que
 * sí necesita un campo de texto que empiece con `-`.
 */
export function escaparCampoCsv(valor: string): string {
  const seguro = neutralizarFormula(valor);
  if (/[",\n\r]/.test(seguro)) {
    return `"${seguro.replaceAll('"', '""')}"`;
  }
  return seguro;
}

/**
 * Une una fila con comas. El texto se escapa (`escaparCampoCsv`, con la
 * neutralización de fórmula); un número se serializa tal cual —
 * `escaparCampoCsv` es solo para texto, y un número nunca trae coma, comilla
 * ni salto de línea que necesite comillas.
 */
export function filaCsv(campos: readonly (string | number)[]): string {
  return campos.map((campo) => (typeof campo === "number" ? String(campo) : escaparCampoCsv(campo))).join(",");
}

/**
 * Arma el CSV completo (encabezado + filas) con BOM UTF-8 al inicio: sin él,
 * Excel en Windows abre el archivo asumiendo la codificación local y muestra
 * los acentos rotos.
 */
export function generarCsv(encabezado: readonly string[], filas: readonly (readonly (string | number)[])[]): string {
  const lineas = [encabezado, ...filas].map(filaCsv);
  return "﻿" + lineas.join("\r\n") + "\r\n";
}
