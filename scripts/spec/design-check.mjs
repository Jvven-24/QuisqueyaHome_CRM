// Validador objetivo de documentos de diseño PXIL (DS-*.md): cada pantalla debe cumplir una receta mínima.
// Uso: node scripts/spec/design-check.mjs <archivo.md> [--json]
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const RAIZ = resolve(import.meta.dirname, "..", "..");
const CATALOGO = "E:/VILTRUM/VILTRUM DESING/pxil-ecosystem/private-library/catalog-index.json";
const ESTADOS = [["initial|inicial"], ["loading|carga"], ["empty|vac"], ["partial|parcial"], ["error"], ["offline|sin conexi"], ["success|éxito|exito"], ["no_permission|permiso"]];

export function idExiste(id, catalogoTexto) {
  return existsSync(resolve(RAIZ, `.viltrum/design/components/${id}.json`)) || new RegExp(`(?:"id"\s*:\s*"?|\b)${id}\b`).test(catalogoTexto);
}
export function revisar(md, catalogoTexto = "") {
  const bloques = md.split(/^## (?=\d+\.\s*`?SCR-|`?SCR-)/m).slice(1);
  return bloques.map((b) => {
    const titulo = (b.match(/SCR-[A-Z0-9-]+/) ?? ["?"])[0];
    const defectos = [];
    const sub = (re) => re.test(b);
    if (!sub(/Concepto/i)) defectos.push("falta «Concepto a máxima capacidad»");
    if (!/Cobertura|Integrar|Construir|Portar/i.test(b)) defectos.push("no indica cómo se cubre cada capacidad (construir/integrar open source/portar)");
    if (!sub(/Capa visual|capacidades\(\)|proveedor (cae|ca[ií]do)|desconectado/i)) defectos.push("no define la capa visual de sistemas conectados ni el modo degradado");
    if (!sub(/Screen Recipe/i)) defectos.push("falta «Screen Recipe»");
    const receta = (b.split(/Screen Recipe/i)[1] ?? "").split(/Wireframe/i)[0];
    if (receta.length < 1500) defectos.push(`receta demasiado breve (${receta.length} caracteres; mínimo 1500)`);
    const faltan = ESTADOS.filter(([re]) => !new RegExp(re, "i").test(receta)).map(([re]) => re.split("|")[0]);
    if (faltan.length) defectos.push(`estados sin especificar en la receta: ${faltan.join(", ")}`);
    if (!/Datos/i.test(receta) || (receta.match(/`[a-z_]+(\.[a-z_]+)?`/gi) ?? []).length < 4) defectos.push("faltan los datos exactos (campos y consulta)");
    if (!/permiso|rol|admin/i.test(receta)) defectos.push("no define permisos por rol");
    if (!/gr[aá]fic|chart|sparkline|embudo|barra/i.test(b) && /LISTA|RANKING|SALUD|CATALOGO|BANDEJA|TABLERO/.test(titulo)) defectos.push("no define gráficas ni indicadores");
    const bloquesCodigo = (b.match(/```/g) ?? []).length / 2;
    if (bloquesCodigo < 2) defectos.push(`wireframes insuficientes (${Math.floor(bloquesCodigo)}; se piden 390 y 1440)`);
    const ids = [...new Set((b.match(/\b\d{3,5}\b/g) ?? []).filter((n) => !["390", "320", "768", "1440", "2026", "100", "360", "200", "002"].includes(n)))];
    const reales = ids.filter((i) => idExiste(i, catalogoTexto));
    if (reales.length < 2) defectos.push(`menos de 2 componentes de la librería con id verificable (${reales.length})`);
    if (!/criterios? de aceptaci/i.test(b)) defectos.push("faltan criterios de aceptación visuales");
    if (/pipeline/i.test(b)) defectos.push("usa la palabra «pipeline» (vocabulario firmado: «Negocios»)");
    if (/\bvd-[a-z-]+/.test(b)) defectos.push("cita componentes inventados (vd-…)");
    if (/[\u{1F300}-\u{1FAFF}]/u.test(b)) defectos.push("contiene emojis");
    return { pantalla: titulo, defectos, ids_verificados: reales };
  });
}
if (process.argv[1]?.endsWith("design-check.mjs")) {
  const f = process.argv[2];
  const cat = existsSync(CATALOGO) ? readFileSync(CATALOGO, "utf8") : "";
  const r = revisar(readFileSync(resolve(f), "utf8"), cat);
  if (process.argv.includes("--json")) console.log(JSON.stringify(r, null, 1));
  else {
    for (const p of r) console.log(`${p.defectos.length ? "FALLA" : "OK   "} ${p.pantalla}${p.defectos.map((d) => `\n   - ${d}`).join("")}`);
    console.log(`\n${r.filter((p) => !p.defectos.length).length}/${r.length} pantallas completas`);
  }
  process.exit(r.every((p) => !p.defectos.length) ? 0 : 1);
}
