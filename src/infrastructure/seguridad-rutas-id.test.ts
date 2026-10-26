/**
 * Candado de las rutas dinámicas (`[id]`, `[tipo]`, ...) de `src/app/api`.
 *
 * Revisión D12 (2026-10-14) del hallazgo del inventario D21: 25 rutas
 * dinámicas no nombran `visibleRows`/`reaches` en su propio `route.ts`. Se
 * comprobó una por una que NINGUNA es un hueco: o el caso de uso aplica el
 * alcance por fila, o el recurso es global (sin responsable por fila) y se
 * protege con un permiso de alcance total, o solo toca filas del propio actor.
 *
 * Esta prueba deja esa revisión ejecutable: una ruta dinámica nueva que no
 * aplique el alcance en su archivo ni figure aquí con su razón comprobable
 * rompe `npm test`; y si una de las listadas pierde la garantía citada, también.
 */

import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";

const raiz = new URL("../../", import.meta.url);

type Garantia = { motivo: string; archivo: string; patron: RegExp };

const ruta = (p: string): Garantia["archivo"] => `src/app/api/${p}`;
const CU = (modulo: string, archivo = "casos-de-uso.ts"): string => `src/application/${modulo}/${archivo}`;

const propio = (p: string): Garantia => ({ motivo: "toca solo filas del actor (actor.userId)", archivo: ruta(p), patron: /\bactor\.userId\b/ });
const global = (p: string, recurso: string): Garantia => ({
  motivo: `recurso global sin responsable por fila; exige ${recurso}`,
  archivo: ruta(p),
  patron: new RegExp(`require(?:Full)?Scope\\(actor, "${recurso.split(":")[0]}"`),
});
const caso = (modulo: string, patron: RegExp, archivo?: string): Garantia => ({
  motivo: "el caso de uso aplica el alcance por fila",
  archivo: CU(modulo, archivo),
  patron,
});

/** Ruta (relativa a src/app/api) -> garantía comprobable. */
const REVISADAS: Record<string, Garantia> = {
  "academy/[id]/progreso/route.ts": propio("academy/[id]/progreso/route.ts"),
  "academy/checklist/[id]/route.ts": propio("academy/checklist/[id]/route.ts"),
  "actividades/[id]/route.ts": caso("actividades", /buscarVisible\(actor, alcance, id\)/),
  "brokers/[id]/proyectos/route.ts": caso("brokers", /alcance !== "all"/),
  "catalogos/[tipo]/[id]/route.ts": global("catalogos/[tipo]/[id]/route.ts", "settings:edit"),
  "catalogos/[tipo]/route.ts": global("catalogos/[tipo]/route.ts", "settings:create"),
  "comunicaciones/plantillas/[id]/route.ts": global("comunicaciones/plantillas/[id]/route.ts", "communications:edit"),
  "etapas/[id]/route.ts": global("etapas/[id]/route.ts", "settings:edit"),
  "leads/[id]/convertir/route.ts": caso("leads", /reaches\(actor, alcance, lead\.brokerId\)/, "conversion.ts"),
  "leads/[id]/descartar/route.ts": caso("leads", /reaches\(actor, alcance, lead\.brokerId\)/),
  "pipeline/[id]/etapa/route.ts": caso("pipeline", /reaches\(actor, alcance, deal\.brokerId\)/),
  "pipeline/[id]/propiedades/[propId]/route.ts": caso("pipeline", /negocioAbiertoVisible\(pipeline, dealId, actor, alcance\)/),
  "pipeline/[id]/propiedades/route.ts": caso("pipeline", /negocioAbiertoVisible\(pipeline, dealId, actor, alcance\)/),
  "pipeline/[id]/route.ts": caso("pipeline", /negocioAbiertoVisible\(pipeline, id, actor, alcance\)/),
  "proyectos/[id]/fases/[faseId]/fotos/[fileId]/route.ts": caso("proyectos", /faseVisible\(actor, alcance, projectId, faseId\)/),
  "proyectos/[id]/fases/[faseId]/fotos/route.ts": caso("proyectos", /faseVisible\(actor, alcance, entrada\.projectId, entrada\.faseId\)/),
  "proyectos/[id]/fases/[faseId]/route.ts": caso("proyectos", /faseVisible\(actor, alcance, projectId, id\)/),
  "proyectos/[id]/fases/route.ts": caso("proyectos", /proyectoVisible\(actor, alcance, projectId, true\)/),
  "proyectos/[id]/route.ts": caso("proyectos", /proyectoVisible\(actor, alcance, id\)/),
  "proyectos/[id]/unidades/[unitId]/route.ts": caso("proyectos", /unidadVisible\(actor, alcance, projectId, id\)/),
  "proyectos/[id]/unidades/route.ts": caso("proyectos", /proyectoVisible\(actor, alcance, entrada\.projectId\)/),
  "roles/[id]/permisos/route.ts": global("roles/[id]/permisos/route.ts", "settings:edit"),
  "usuarios/[id]/invitacion/route.ts": { motivo: "users no tiene responsable por fila; alcance total", archivo: ruta("usuarios/[id]/invitacion/route.ts"), patron: /requireFullScope\(actor, "users", "edit"\)/ },
};

function rutasDinamicas(): string[] {
  const dir = new URL("src/app/api/", raiz);
  return (readdirSync(dir, { recursive: true }) as string[])
    .map((f) => f.replaceAll("\\", "/"))
    .filter((f) => f.endsWith("/route.ts") && f.includes("["));
}

test("rutas dinámicas sin reaches/visibleRows en el route.ts están todas revisadas y listadas", () => {
  const sinAlcanceEnRuta = rutasDinamicas().filter((r) => !/\b(?:visibleRows|reaches|visibleHolds|visibleReservas|visiblePlanes|visiblePagos)\b/.test(readFileSync(new URL(`src/app/api/${r}`, raiz), "utf8")));
  assert.deepEqual(
    sinAlcanceEnRuta.sort(),
    Object.keys(REVISADAS).sort(),
    "Ruta dinámica nueva (o que dejó de necesitar la excepción) sin revisar: aplica visibleRows/reaches en el caso de uso y regístrala en REVISADAS con la prueba de su garantía.",
  );
});

/** TX-43: los recursos sin broker_id deben recorrer el padre autorizado. */
function filtroRelacionalM40(r: string): string | undefined {
  if (r.startsWith("holds/")) return "visibleHolds";
  if (r.startsWith("reservas/")) return "visibleReservas";
  if (r.startsWith("cobros/planes/")) return "visiblePlanes";
  if (r.startsWith("cobros/pagos/")) return "visiblePagos";
  return undefined;
}

function usaFiltroRelacional(codigo: string, filtro: string): boolean {
  // Un comentario o un import sin uso no acreditan que se filtre la consulta.
  const sinComentarios = codigo.replace(/\/\*[\s\S]*?\*\/|\/\/[^\r\n]*/g, "");
  return /from\s+["'][^"']*rbac-filter(?:\.ts)?["']/.test(sinComentarios)
    && new RegExp(`\\b${filtro}\\s*\\(`).test(sinComentarios);
}

test("TX-43: rutas M40 por ID e hijos conservan el filtro relacional central, también al delegar", () => {
  for (const r of rutasDinamicas()) {
    const filtro = filtroRelacionalM40(r);
    if (!filtro) continue;
    const codigo = readFileSync(new URL(`src/app/api/${r}`, raiz), "utf8");
    if (usaFiltroRelacional(codigo, filtro)) continue;
    const garantia = REVISADAS[r];
    assert.ok(garantia, `${r}: exige ${filtro} o una delegación revisada explícita; reaches/visibleRows sobre titular/pagador no basta.`);
    const delegado = readFileSync(new URL(garantia.archivo, raiz), "utf8");
    assert.ok(usaFiltroRelacional(delegado, filtro), `${r}: ${garantia.archivo} perdió ${filtro}; registrar el adaptador que filtra el padre.`);
  }
});

test("TX-43: el candado reconoce rutas anidadas y rechaza un filtro por pagador o un comentario", () => {
  for (const [r, esperado] of [
    ["holds/[id]/extensiones/route.ts", "visibleHolds"],
    ["reservas/[id]/cambio-unidad/route.ts", "visibleReservas"],
    ["cobros/planes/[id]/reestructuraciones/route.ts", "visiblePlanes"],
    ["cobros/pagos/[id]/reversos/route.ts", "visiblePagos"],
  ] as const) assert.equal(filtroRelacionalM40(r), esperado);
  assert.equal(filtroRelacionalM40("pipeline/[id]/route.ts"), undefined);
  assert.equal(usaFiltroRelacional('reaches(actor, scope, pago.payerId)', "visiblePagos"), false);
  assert.equal(usaFiltroRelacional('visibleRows(actor, scope, pago.payerId)', "visiblePagos"), false);
  assert.equal(usaFiltroRelacional('// visiblePagos(actor, scope)', "visiblePagos"), false);
  const importar = 'import { visiblePagos } from "@/infrastructure/rbac-filter";';
  assert.equal(usaFiltroRelacional(importar, "visiblePagos"), false);
  assert.equal(usaFiltroRelacional(`${importar}\n/* visiblePagos(actor, scope) */`, "visiblePagos"), false);
  assert.equal(usaFiltroRelacional(`${importar}\nvisiblePagos(actor, scope)`, "visiblePagos"), true);
  assert.equal(usaFiltroRelacional(`${importar}\nvisibleReservas(actor, scope)`, "visiblePagos"), false);
});

test("cada excepción conserva la garantía que justifica su revisión", () => {
  assert.ok(Object.keys(REVISADAS).length > 0);
  for (const [r, garantia] of Object.entries(REVISADAS)) {
    const codigo = readFileSync(new URL(garantia.archivo, raiz), "utf8");
    assert.match(codigo, garantia.patron, `${r}: falta la garantía (${garantia.motivo}) en ${garantia.archivo}`);
  }
});
