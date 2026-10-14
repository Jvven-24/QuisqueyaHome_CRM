import assert from "node:assert/strict";
import { test } from "node:test";
import {
  antiguedadPorEtapa, armarColumnas, conteoPorEtapa, estadoContenido, monedasDelResumen, resultadosDelResumen,
  siguienteOrden, totalNegocios, totalesPorEtapa, valorActivoPorDivisa, valorPonderado, valorPorEtapa,
  type Etapa,
} from "./logica.ts";
import { diasEnEtapa, tipoAntiguedad } from "./antiguedad.ts";

const etapas: Etapa[] = [
  { id: 1, slug: "nuevo", name: "Nuevo", position: 1, kind: "open", defaultProbability: 10 },
  { id: 2, slug: "negociacion", name: "Negociación", position: 2, kind: "open", defaultProbability: 80 },
  { id: 3, slug: "cierre", name: "Cierre", position: 3, kind: "won", defaultProbability: 100 },
  { id: 4, slug: "perdido", name: "Perdido", position: 4, kind: "lost", defaultProbability: 0 },
];
const fila = (id: number, stageId: number, extra: Record<string, unknown> = {}) =>
  ({ id, stageId, stageKind: etapas.find((e) => e.id === stageId)!.kind, currency: "USD", probability: 50, stageChangedAt: null, ...extra }) as never;

const resumen = [
  { stageId: 1, kind: "open", currency: "USD", count: 3, amountCents: 30000 },
  { stageId: 1, kind: "open", currency: "DOP", count: 1, amountCents: 5000 },
  { stageId: 2, kind: "open", currency: "USD", count: 2, amountCents: 20000 },
  { stageId: 3, kind: "won", currency: "USD", count: 4, amountCents: 90000 },
  { stageId: 4, kind: "lost", currency: "USD", count: 1, amountCents: 1000 },
] as never[];

test("totales por etapa suman por divisa sin mezclar monedas", () => {
  assert.deepEqual(totalesPorEtapa(resumen, 1), [
    { currency: "USD", count: 3, amountCents: 30000 },
    { currency: "DOP", count: 1, amountCents: 5000 },
  ]);
  assert.equal(totalNegocios(resumen), 11);
});

test("valor activo cuenta solo abiertos y separa divisas", () => {
  assert.deepEqual(valorActivoPorDivisa(resumen), [
    { currency: "USD", amountCents: 50000 },
    { currency: "DOP", amountCents: 5000 },
  ]);
});

test("rol sin montos (asistente): el resumen no trae amountCents y nada se inventa", () => {
  const sinMonto = resumen.map((r) => {
    const copia = { ...(r as unknown as Record<string, unknown>) };
    delete copia.amountCents;
    return copia;
  }) as never[];
  assert.deepEqual(valorActivoPorDivisa(sinMonto), []);
  assert.equal(valorPorEtapa(etapas, sinMonto, "USD"), null);
  assert.deepEqual(totalesPorEtapa(sinMonto, 1).map((t) => "amountCents" in t), [false, false]);
});

test("columnas: el total real viene del resumen aunque solo haya parte de las tarjetas cargadas", () => {
  const columnas = armarColumnas(etapas, [fila(10, 1), fila(11, 1), fila(12, 2)], resumen);
  assert.equal(columnas[0]!.filas.length, 2);
  assert.equal(columnas[0]!.total, 4);
  assert.equal(columnas[1]!.total, 2);
  assert.equal(columnas[2]!.filas.length, 0);
  assert.equal(columnas[2]!.total, 4);
});

test("estado de contenido distingue cartera vacía de filtros sin resultados", () => {
  assert.equal(estadoContenido(0, false), "cartera-vacia");
  assert.equal(estadoContenido(0, true), "sin-resultados");
  assert.equal(estadoContenido(5, true), "con-datos");
});

test("análisis: conteos, resultados y monedas salen del resumen real", () => {
  assert.deepEqual(conteoPorEtapa(etapas, resumen).map((c) => c.count), [4, 2, 4, 1]);
  assert.deepEqual(resultadosDelResumen(resumen), { abiertos: 6, ganados: 4, perdidos: 1 });
  assert.deepEqual(monedasDelResumen(resumen), ["DOP", "USD"]);
  assert.deepEqual(valorPorEtapa(etapas, resumen, "USD")!.map((v) => v.unidades), [300, 200, 900, 10]);
});

test("valor ponderado: usa la probabilidad guardada y cuenta lo que no puede calcular", () => {
  const filas = [
    fila(1, 1, { amountCents: 100000, probability: 50 }),
    fila(2, 1, { amountCents: 100000, probability: null }),
    fila(3, 2, { amountCents: null, probability: 80 }),
    fila(4, 3, { amountCents: 999999, probability: 100 }),
    fila(5, 1, { amountCents: 5000, probability: 10, currency: "DOP" }),
  ];
  assert.deepEqual(valorPonderado(filas, "USD"), { unidades: 500, considerados: 1, sinProbabilidad: 1, sinMonto: 1 });
});

test("antigüedad por etapa promedia solo negocios con fecha y reporta los que no la tienen", () => {
  const ahora = new Date("2026-10-14T12:00:00Z");
  const filas = [
    fila(1, 1, { stageChangedAt: new Date("2026-10-10T12:00:00Z") }),
    fila(2, 1, { stageChangedAt: new Date("2026-10-04T12:00:00Z") }),
    fila(3, 1, { stageChangedAt: null }),
    fila(4, 2, { stageChangedAt: null }),
  ];
  const puntos = antiguedadPorEtapa(etapas, filas, ahora);
  assert.deepEqual(puntos[0], { id: "1", label: "Nuevo", dias: 7, conFecha: 2, sinFecha: 1 });
  assert.equal(puntos[1]!.dias, null);
  assert.equal(puntos.length, 2, "solo etapas abiertas");
});

test("«Sin fecha de etapa» no se confunde con 0 días", () => {
  const ahora = new Date("2026-10-14T12:00:00Z");
  assert.equal(tipoAntiguedad(null, ahora), "sin-fecha");
  assert.equal(diasEnEtapa(null, ahora), null);
  assert.equal(tipoAntiguedad(new Date("2026-10-14T11:00:00Z"), ahora), "dias");
  assert.equal(diasEnEtapa(new Date("2026-10-14T11:00:00Z"), ahora), 0);
});

test("orden: repetir columna invierte; columna nueva usa su dirección natural", () => {
  assert.deepEqual(siguienteOrden({ campo: "createdAt", direccion: "desc" }, "createdAt"), { campo: "createdAt", direccion: "asc" });
  assert.deepEqual(siguienteOrden({ campo: "createdAt", direccion: "desc" }, "amountCents"), { campo: "amountCents", direccion: "desc" });
  assert.deepEqual(siguienteOrden({ campo: "amountCents", direccion: "desc" }, "id"), { campo: "id", direccion: "asc" });
});
