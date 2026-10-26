import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import * as preferencias from "./preferencias.ts";
import { planificarLote } from "./lote.ts";
import { calcularAntiguedad } from "./antiguedad.ts";
const require = createRequire(import.meta.url);
type Nodo = { type: unknown; props: Record<string, unknown> };
function nodos(v: unknown): Nodo[] { if (Array.isArray(v)) return v.flatMap(nodos); if (!v || typeof v !== "object" || !("props" in v)) return []; const n = v as Nodo; return [n, ...nodos(n.props.children)]; }
function cargar(file: string, deps: Record<string, unknown>, fetch?: () => void) {
  const js = ts.transpileModule(readFileSync(new URL(file, import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports: Record<string, unknown> = {};
  new Function("require", "exports", "fetch", js)((id: string) => deps[id] ?? require(id), exports, fetch);
  return exports;
}
test("preferencias locales normalizan orden, no filtran campos por permiso y no guardan PII", () => {
  const p = preferencias.leerPreferencias(JSON.stringify({ ordenColumnas: ["probabilidad", "proyecto", "probabilidad", "secreto"], columnasLista: { probabilidad: true }, contactName: "persona" }));
  assert.deepEqual(p.ordenColumnas.slice(0, 2), ["probabilidad", "proyecto"]);
  assert.equal(p.ordenColumnas.length, preferencias.COLUMNAS_LISTA.length);
  assert.ok(!preferencias.columnasVisibles(p, false).includes("monto"));
  assert.equal(preferencias.desplazarColumna(p, "probabilidad", -1), p);
  assert.equal(preferencias.desplazarColumna(p, "probabilidad", 1).ordenColumnas[1], "probabilidad");
  const texto = preferencias.serializarPreferencias({ ...p, contactName: "persona", dealId: 99 } as typeof p);
  assert.ok(!texto.includes("persona") && !texto.includes("dealId"));
  assert.deepEqual(preferencias.leerPreferencias(texto), p);
});
test("lista real aplica orden/visibilidad en tabla y móvil; monto no recibido sigue oculto", () => {
  const mod = cargar("./lista.tsx", { "./preferencias": preferencias, "./antiguedad": { calcularAntiguedad }, "../_ui/formato": { formatearMonto: (n: number) => "importe-" + n }, "../_ui/prototipo-ui": { Badge: ({ children }: { children: React.ReactNode }) => React.createElement("span", null, children) } });
  const Lista = mod.ListaNegocios as React.ComponentType<Record<string, unknown>>;
  const p = preferencias.leerPreferencias(JSON.stringify({ ordenColumnas: ["probabilidad", "proyecto"], columnasLista: { probabilidad: true, broker: false } }));
  const props = { filas: [{ id: 1, contactName: "Contacto de ejemplo", stageId: 1, stageKind: "open", amountCents: 9999, currency: "USD", probability: 40, brokerName: "Broker oculto", sourceName: null, nextActivityTitle: null, createdAt: new Date("2026-01-01"), stageChangedAt: null, proyectoPrincipal: { projectName: "Proyecto visible", unitCode: null } }], etapas: [{ id: 1, name: "Nuevo" }], orden: { campo: "createdAt", direccion: "desc" }, seleccionadoId: null, preferencias: p, onOrden() {}, onVerFicha() {}, veMontos: false };
  for (const esMovil of [false, true]) {
    const html = renderToStaticMarkup(React.createElement(Lista, { ...props, esMovil }));
    assert.ok(html.indexOf("Probabilidad") < html.indexOf("Proyecto"), "orden configurado real");
    assert.ok(!html.includes("Broker oculto") && !html.includes("importe-9999"));
    assert.ok(html.includes("40%") && html.includes("Proyecto visible"));
  }
});
test("plan masivo muestra omisiones y resultados por negocio, sin enviar cambios", () => {
  const filas = [{ id: 1, contactName: "Abierto", stageKind: "open", stageId: 1 }, { id: 2, contactName: "Cerrado", stageKind: "won", stageId: 3 }, { id: 3, contactName: "Ya movido", stageKind: "open", stageId: 2 }];
  const r = planificarLote(filas, { accion: "etapa", stageId: 2, detalle: "Seguimiento", puedeEditar: true });
  assert.match(r[0]!.motivo, /No enviado.*endpoint/); assert.match(r[1]!.motivo, /Omitido.*cerrado/); assert.match(r[2]!.motivo, /Omitido.*elegida/);
  let cursor = 0; const slots: unknown[] = []; let peticiones = 0;
  const react = { ...React, useState(v: unknown) { const i = cursor++; if (!(i in slots)) slots[i] = v; return [slots[i], (x: unknown) => { slots[i] = x; }]; } };
  // El módulo importa "react"; no se sustituye el flujo del formulario ni el planificador.
  const m = cargar("./acciones-masivas.tsx", { "react": react, "./lote": { planificarLote }, "@/components/ui/dialog": { Dialog: "dialog", DialogContent: "content", DialogHeader: "header", DialogTitle: "title", DialogDescription: "description" } }, () => { peticiones++; });
  const componente = m.AccionesMasivas as (p: Record<string, unknown>) => Nodo;
  const render = () => { cursor = 0; return componente({ filas, etapas: [{ id: 2, name: "Contactado", kind: "open" }], puedeEditar: true, sinConexion: false, ocupado: false }); };
  let tree = render();
  (nodos(tree).find((n) => n.type === "button")!.props.onClick as () => void)();
  tree = render();
  const selects = nodos(tree).filter((n) => n.type === "select");
  (selects[1]!.props.onChange as (e: unknown) => void)({ target: { value: "2" } });
  (nodos(tree).find((n) => n.type === "textarea")!.props.onChange as (e: unknown) => void)({ target: { value: "Seguimiento" } });
  tree = render();
  (nodos(tree).find((n) => n.type === "form")!.props.onSubmit as (e: unknown) => void)({ preventDefault() {} });
  tree = render();
  assert.ok(JSON.stringify(tree).includes("0 cambios enviados"));
  assert.equal(peticiones, 0);
});

test("lista real conserva venta/alquiler cerrados y fecha de próxima acción en tabla y móvil", () => {
  const mod = cargar("./lista.tsx", { "./preferencias": preferencias, "./antiguedad": { calcularAntiguedad }, "../_ui/formato": { formatearMonto: (n: number) => String(n) }, "../_ui/prototipo-ui": { Badge: ({ children }: { children: React.ReactNode }) => React.createElement("span", null, children) } });
  const Lista = mod.ListaNegocios as React.ComponentType<Record<string, unknown>>;
  const p = preferencias.leerPreferencias(JSON.stringify({ ordenColumnas: ["etapa", "proxima"], columnasLista: { ...Object.fromEntries(preferencias.COLUMNAS_LISTA.map((c) => [c, false])), etapa: true, proxima: true } }));
  const base = { stageId: 3, stageKind: "won", amountCents: undefined, currency: "USD", probability: 100, brokerName: null, sourceName: null, createdAt: new Date("2026-01-01"), stageChangedAt: null, proyectoPrincipal: null };
  const props = { filas: [
    { ...base, id: 1, contactName: "Alquiler ejemplo", operationType: "rent", nextActivityTitle: "Visita acordada", nextActivityStartsAt: "2026-11-12T12:00:00Z" },
    { ...base, id: 2, contactName: "Venta ejemplo", operationType: "sale", nextActivityTitle: "Seguimiento pendiente", nextActivityStartsAt: null },
    { ...base, id: 3, contactName: "Sin actividad ejemplo", operationType: "sale", nextActivityTitle: null, nextActivityStartsAt: null },
  ], etapas: [{ id: 3, name: "Cierre" }], orden: { campo: "createdAt", direccion: "desc" }, seleccionadoId: null, preferencias: p, onOrden() {}, onVerFicha() {}, veMontos: false };
  for (const esMovil of [false, true]) {
    const html = renderToStaticMarkup(React.createElement(Lista, { ...props, esMovil }));
    assert.ok(html.includes("Alquiler cerrado"), "el alquiler conserva su significado comercial");
    assert.ok(html.includes("Venta cerrada"), "la venta conserva su significado comercial");
    assert.match(html, /Visita acordada[\s\S]*?12[\s\S]*?nov/, "la fecha sigue junto a la próxima acción");
    assert.ok(html.includes("Seguimiento pendiente") && html.includes("Sin próxima acción"));
    assert.ok(!html.includes("Invalid Date"));
  }
});
