import assert from "node:assert/strict";
import { test } from "node:test";
import {
  columnasOptimistas, crearEstadoKanban, idsDeColumna, leerOrden, moverEnLista, ordenarSegun,
  previsualizarArrastre, reducirKanban, resumenOptimista, serializarOrden, type EstadoKanban,
} from "./kanban-estado.ts";
import type { Etapa } from "./logica.ts";

const etapas: Etapa[] = [
  { id: 1, slug: "nuevo", name: "Nuevo", position: 1, kind: "open", defaultProbability: 10 },
  { id: 2, slug: "negociacion", name: "Negociación", position: 2, kind: "open", defaultProbability: 80 },
  { id: 3, slug: "cierre", name: "Cierre", position: 3, kind: "won", defaultProbability: 100 },
  { id: 4, slug: "perdido", name: "Perdido", position: 4, kind: "lost", defaultProbability: 0 },
];
const fila = (id: number, stageId: number, amountCents = 10000, currency = "USD") =>
  ({ id, stageId, stageKind: etapas.find((e) => e.id === stageId)!.kind, currency, amountCents, contactName: `C${id}` }) as never;

const negocios = [fila(1, 1), fila(2, 1), fila(3, 1), fila(4, 2, 50000), fila(5, 2, 7000, "DOP")];
const resumen = [
  { stageId: 1, kind: "open", currency: "USD", count: 3, amountCents: 30000 },
  { stageId: 2, kind: "open", currency: "USD", count: 1, amountCents: 50000 },
  { stageId: 2, kind: "open", currency: "DOP", count: 1, amountCents: 7000 },
] as never[];

function inicial(): EstadoKanban {
  return crearEstadoKanban(negocios);
}

test("mover: la tarjeta aterriza al instante en la columna destino y en la posición pedida", () => {
  const e = reducirKanban(inicial(), { tipo: "mover", dealId: 2, hacia: 2, indice: 1, estado: "enviando" });
  assert.deepEqual(idsDeColumna(e, 1), [1, 3]);
  assert.deepEqual(idsDeColumna(e, 2), [4, 2, 5]);
  assert.equal(e.pendientes[2]!.desde, 1);
  assert.equal(e.pendientes[2]!.estado, "enviando");
});

test("mover: sin índice entra arriba; a la misma etapa o con otro pendiente no hace nada", () => {
  const e = reducirKanban(inicial(), { tipo: "mover", dealId: 1, hacia: 2, estado: "enviando" });
  assert.equal(idsDeColumna(e, 2)[0], 1);
  assert.equal(reducirKanban(e, { tipo: "mover", dealId: 1, hacia: 1, estado: "enviando" }), e, "segundo movimiento del mismo negocio en curso");
  const mismo = inicial();
  assert.equal(reducirKanban(mismo, { tipo: "mover", dealId: 4, hacia: 2, estado: "enviando" }), mismo);
  assert.equal(reducirKanban(mismo, { tipo: "mover", dealId: 999, hacia: 2, estado: "enviando" }), mismo);
});

test("totales optimistas: contador y monto pasan de la etapa origen a la destino sin mezclar monedas", () => {
  const e = reducirKanban(inicial(), { tipo: "mover", dealId: 1, hacia: 2, estado: "enviando" });
  const cols = columnasOptimistas(etapas, e, resumen);
  assert.equal(cols[0]!.total, 2);
  assert.deepEqual(cols[0]!.totales, [{ currency: "USD", count: 2, amountCents: 20000 }]);
  assert.equal(cols[1]!.total, 3);
  assert.deepEqual(cols[1]!.totales, [
    { currency: "USD", count: 2, amountCents: 60000 },
    { currency: "DOP", count: 1, amountCents: 7000 },
  ]);
});

test("totales optimistas: mover a Cierre crea la fila de la etapa ganada y la saca del valor activo", () => {
  const e = reducirKanban(inicial(), { tipo: "mover", dealId: 4, hacia: 3, estado: "dialogo" });
  const r = resumenOptimista(resumen, e, etapas);
  assert.ok(!r.some((x) => x.stageId === 2 && x.currency === "USD"), "la etapa origen queda sin fila USD");
  assert.deepEqual(r.find((x) => x.stageId === 3), { stageId: 3, kind: "won", currency: "USD", count: 1, amountCents: 50000 });
});

test("totales optimistas: un rol sin montos no recibe montos inventados", () => {
  const sinMontos = [{ stageId: 1, kind: "open", currency: "USD", count: 3 }] as never[];
  const e = reducirKanban(inicial(), { tipo: "mover", dealId: 1, hacia: 2, estado: "enviando" });
  const r = resumenOptimista(sinMontos, e, etapas);
  assert.deepEqual(r, [{ stageId: 1, kind: "open", currency: "USD", count: 2 }, { stageId: 2, kind: "open", currency: "USD", count: 1 }]);
});

test("revertir: si el servidor falla la tarjeta vuelve a su columna y a su posición exactas", () => {
  let e = reducirKanban(inicial(), { tipo: "reordenar", etapaId: 1, dealId: 3, indice: 0 });
  assert.deepEqual(idsDeColumna(e, 1), [3, 1, 2]);
  const antes = e;
  e = reducirKanban(e, { tipo: "mover", dealId: 1, hacia: 2, indice: 2, estado: "enviando" });
  e = reducirKanban(e, { tipo: "revertir", dealId: 1 });
  assert.deepEqual(idsDeColumna(e, 1), [3, 1, 2]);
  assert.deepEqual(idsDeColumna(e, 2), [4, 5]);
  assert.deepEqual(e.pendientes, {});
  assert.deepEqual(e.orden, antes.orden);
  assert.deepEqual(columnasOptimistas(etapas, e, resumen).map((c) => c.total), [3, 2, 0, 0], "los contadores vuelven a su valor");
});

test("revertir tras cancelar el diálogo de cierre o de pérdida deja todo como estaba", () => {
  for (const hacia of [3, 4]) {
    const base = inicial();
    let e = reducirKanban(base, { tipo: "mover", dealId: 2, hacia, estado: "dialogo" });
    assert.equal(idsDeColumna(e, hacia)[0], 2);
    e = reducirKanban(e, { tipo: "revertir", dealId: 2 });
    assert.deepEqual(idsDeColumna(e, 1), [1, 2, 3]);
    assert.deepEqual(e.orden, {});
  }
});

test("revertir sin pendiente no cambia nada", () => {
  const e = inicial();
  assert.equal(reducirKanban(e, { tipo: "revertir", dealId: 1 }), e);
});

test("enviar y confirmar cambian el estado del pendiente sin moverlo", () => {
  let e = reducirKanban(inicial(), { tipo: "mover", dealId: 2, hacia: 4, estado: "dialogo" });
  e = reducirKanban(e, { tipo: "enviar", dealId: 2 });
  assert.equal(e.pendientes[2]!.estado, "enviando");
  e = reducirKanban(e, { tipo: "confirmar", dealId: 2 });
  assert.equal(e.pendientes[2]!.estado, "confirmado");
  assert.equal(idsDeColumna(e, 4)[0], 2);
});

test("sincronizar: los datos nuevos del servidor sueltan los pendientes ya reflejados y conservan los que esperan", () => {
  let e = reducirKanban(inicial(), { tipo: "mover", dealId: 1, hacia: 2, estado: "enviando" });
  e = reducirKanban(e, { tipo: "mover", dealId: 2, hacia: 3, estado: "dialogo" });
  e = reducirKanban(e, { tipo: "confirmar", dealId: 1 });
  const servidor = [fila(1, 2), fila(2, 1), fila(3, 1), fila(4, 2, 50000), fila(5, 2, 7000, "DOP")];
  e = reducirKanban(e, { tipo: "sincronizar", negocios: servidor });
  assert.equal(e.pendientes[1], undefined, "confirmado y reflejado");
  assert.equal(e.pendientes[2]?.estado, "dialogo", "el diálogo de cierre sigue abierto");
  assert.ok(idsDeColumna(e, 2).includes(1));
  assert.ok(idsDeColumna(e, 3).includes(2));
});

test("sincronizar: un confirmado que el servidor no refleja se descarta (manda el servidor)", () => {
  let e = reducirKanban(inicial(), { tipo: "mover", dealId: 1, hacia: 2, estado: "enviando" });
  e = reducirKanban(e, { tipo: "confirmar", dealId: 1 });
  e = reducirKanban(e, { tipo: "sincronizar", negocios });
  assert.deepEqual(e.pendientes, {});
  assert.ok(idsDeColumna(e, 1).includes(1));
});

test("sincronizar: un negocio que sale de la página suelta su pendiente", () => {
  let e = reducirKanban(inicial(), { tipo: "mover", dealId: 5, hacia: 1, estado: "enviando" });
  e = reducirKanban(e, { tipo: "sincronizar", negocios: negocios.slice(0, 4) });
  assert.deepEqual(e.pendientes, {});
});

test("reordenar dentro de la columna conserva el resto y no cambia si la posición es la misma", () => {
  const e = reducirKanban(inicial(), { tipo: "reordenar", etapaId: 1, dealId: 1, indice: 2 });
  assert.deepEqual(idsDeColumna(e, 1), [2, 3, 1]);
  const igual = reducirKanban(e, { tipo: "reordenar", etapaId: 1, dealId: 1, indice: 2 });
  assert.equal(igual, e);
  assert.equal(reducirKanban(e, { tipo: "reordenar", etapaId: 2, dealId: 1, indice: 0 }), e, "no está en esa columna");
});

test("ordenarSegun: lo que no figura en el orden manual conserva el orden del servidor, detrás", () => {
  assert.deepEqual(ordenarSegun([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }], [3, 1]).map((x) => x.id), [3, 1, 2, 4]);
  assert.deepEqual(ordenarSegun([{ id: 1 }], undefined).map((x) => x.id), [1]);
});

test("previsualizarArrastre abre el hueco en la columna destino sin tocar los totales", () => {
  const cols = columnasOptimistas(etapas, inicial(), resumen);
  const vista = previsualizarArrastre(cols, { dealId: 1, hacia: 2, indice: 1 });
  assert.deepEqual(vista[0]!.filas.map((f) => f.id), [2, 3]);
  assert.deepEqual(vista[1]!.filas.map((f) => f.id), [4, 1, 5]);
  assert.equal(vista[0]!.total, 3);
  assert.equal(previsualizarArrastre(cols, null), cols);
  assert.equal(previsualizarArrastre(cols, { dealId: 1, hacia: 1, indice: 0 }), cols, "misma columna: lo anima el ordenable");
});

test("moverEnLista replica arrayMove", () => {
  assert.deepEqual(moverEnLista([1, 2, 3, 4], 0, 2), [2, 3, 1, 4]);
  assert.deepEqual(moverEnLista([1, 2, 3, 4], 3, 0), [4, 1, 2, 3]);
});

test("orden manual: se serializa y se lee descartando datos corruptos", () => {
  assert.deepEqual(leerOrden(serializarOrden({ 1: [3, 1], 2: [4] })), { 1: [3, 1], 2: [4] });
  assert.deepEqual(leerOrden(null), {});
  assert.deepEqual(leerOrden("{no json"), {});
  assert.deepEqual(leerOrden("[1,2]"), {});
  assert.deepEqual(leerOrden(JSON.stringify({ x: [1], 0: [1], 2: ["a", 5, 5, -1, 2.5] })), { 2: [5] });
});

test("restaurarOrden no pisa un orden que el usuario ya cambió en esta sesión", () => {
  let e = reducirKanban(inicial(), { tipo: "reordenar", etapaId: 1, dealId: 3, indice: 0 });
  e = reducirKanban(e, { tipo: "restaurarOrden", orden: { 1: [2, 1, 3], 2: [5, 4] } });
  assert.deepEqual(idsDeColumna(e, 1), [3, 1, 2]);
  assert.deepEqual(idsDeColumna(e, 2), [5, 4]);
});
