import assert from "node:assert/strict";
import { test } from "node:test";
import { alternarEtapa, leerPreferencias, PREFERENCIAS_INICIALES } from "./preferencias.ts";
import { guardarVista, leerVistas, limpiarConsulta, MAX_VISTAS, vistaActiva, VISTAS_SISTEMA } from "./vistas-guardadas.ts";
import { aplicarFiltrosCliente, filasACsv, hayFiltrosCliente, leerFiltrosCliente, origenesDisponibles } from "./filtros-cliente.ts";
import { descuentoEfectivo, nivelRequerido, puedeAprobar, transicionSolicitud, validarUsoAprobacion } from "./negociacion.ts";
import { alternarSeleccion, cuotasPlan, destacados, diferenciasDePrecio, estadoVigencia, MAX_COMPARAR, type OpcionUnidad } from "./propuestas.ts";
import { avanceChecklist, checklistCierre, pasosEmbudo, valorPonderadoNegocio } from "./expediente.ts";
import type { Etapa } from "./logica.ts";

/* ------------------------------ UI-014 ------------------------------ */

test("preferencias: valores desconocidos o corruptos vuelven a los iniciales", () => {
  assert.deepEqual(leerPreferencias(null), PREFERENCIAS_INICIALES);
  assert.deepEqual(leerPreferencias("{roto"), PREFERENCIAS_INICIALES);
  const p = leerPreferencias(JSON.stringify({ tarjeta: { monto: false, inventado: true, proxima: "si" }, compacta: true, etapasOcultas: [3, 3, -1, "x"] }));
  assert.equal(p.tarjeta.monto, false);
  assert.equal(p.tarjeta.proxima, true);
  assert.equal("inventado" in p.tarjeta, false);
  assert.equal(p.compacta, true);
  assert.deepEqual(p.etapasOcultas, [3]);
});

test("preferencias: no se pueden ocultar todas las etapas", () => {
  let p = alternarEtapa(PREFERENCIAS_INICIALES, 1, 2);
  assert.deepEqual(p.etapasOcultas, [1]);
  assert.equal(alternarEtapa(p, 2, 2), p);
  p = alternarEtapa(p, 1, 2);
  assert.deepEqual(p.etapasOcultas, []);
});

test("vistas guardadas: solo claves conocidas, orden estable y comparación exacta", () => {
  assert.equal(limpiarConsulta("resultado=open&hack=1&brokerId=3"), "brokerId=3&resultado=open");
  assert.equal(vistaActiva("resultado=open", VISTAS_SISTEMA), "activos");
  assert.equal(vistaActiva("sinAccion=1&resultado=open&cursor=abc", VISTAS_SISTEMA), "sin-accion");
  assert.equal(vistaActiva("", VISTAS_SISTEMA), "todas");
  assert.equal(vistaActiva("brokerId=9", VISTAS_SISTEMA), null);
});

test("vistas guardadas: nombre obligatorio, sin duplicados y con límite", () => {
  assert.equal(guardarVista("  ", "q=a", [], "u-1").ok, false);
  assert.equal(guardarVista("negocios activos", "q=a", [], "u-1").ok, false, "choca con una del sistema");
  const r = guardarVista("Mis cierres", "resultado=won&x=1", [], "u-1");
  assert.ok(r.ok);
  if (r.ok) assert.deepEqual(r.vistas, [{ id: "u-1", nombre: "Mis cierres", consulta: "resultado=won" }]);
  const llenas = Array.from({ length: MAX_VISTAS }, (_, i) => ({ id: `u-${i}`, nombre: `V${i}`, consulta: "" }));
  assert.equal(guardarVista("Otra", "", llenas, "u-x").ok, false);
  assert.deepEqual(leerVistas(JSON.stringify([{ id: "u-a", nombre: "Ok", consulta: "q=1&mal=2" }, { id: "../x", nombre: "No", consulta: "" }])), [{ id: "u-a", nombre: "Ok", consulta: "q=1" }]);
});

const n = (id: number, extra: Record<string, unknown>) => ({
  id, contactName: `Contacto ${id}`, sourceName: null, nextActivityTitle: null, stageChangedAt: null, probability: null,
  proyectoPrincipal: null, brokerName: null, contactPhone: null, contactPhoneDisplay: null, stageId: 1, currency: "USD",
  createdAt: new Date("2026-10-01T00:00:00Z"), ...extra,
}) as never;

test("filtros avanzados: texto sin tildes, origen, sin próxima acción, días y probabilidad", () => {
  const ahora = new Date("2026-10-19T12:00:00Z");
  const filas = [
    n(1, { contactName: "Sofía Almonte", sourceName: "Instagram", nextActivityTitle: "Llamar", stageChangedAt: "2026-10-01T00:00:00Z", probability: 60 }),
    n(2, { contactName: "Juan Pérez", proyectoPrincipal: { projectName: "Torre Piantini", unitCode: "A-1" }, stageChangedAt: "2026-10-18T00:00:00Z", probability: 20 }),
    n(3, { contactName: "Ana Ruiz", sourceName: "Instagram", stageChangedAt: null }),
  ];
  const f = (q: Record<string, string>) => aplicarFiltrosCliente(filas, leerFiltrosCliente((k) => q[k] ?? null), ahora).map((x: { id: number }) => x.id);
  assert.deepEqual(f({ q: "almonte" }), [1]);
  assert.deepEqual(f({ q: "piantini" }), [2]);
  assert.deepEqual(f({ origen: "Instagram" }), [1, 3]);
  assert.deepEqual(f({ origen: "Directo" }), [2]);
  assert.deepEqual(f({ sinAccion: "1" }), [2, 3]);
  assert.deepEqual(f({ diasMin: "14" }), [1], "sin fecha de etapa no cuenta como estancado");
  assert.deepEqual(f({ probMin: "50" }), [1]);
  assert.equal(hayFiltrosCliente(leerFiltrosCliente(() => null)), false);
  assert.equal(leerFiltrosCliente((k) => (k === "diasMin" ? "abc" : null)).diasMin, null);
  assert.deepEqual(origenesDisponibles(filas), ["Directo", "Instagram"]);
});

test("exportar CSV: escapa comillas, neutraliza fórmulas y omite montos si el rol no los trae", () => {
  const csv = filasACsv([n(1, { contactName: '=HYPERLINK("x")', amountCents: 12345 })], () => "Nuevo");
  assert.ok(csv.startsWith('"Contacto","Teléfono","Etapa","Proyecto","Unidad","Moneda","Monto"'));
  assert.ok(csv.includes(`"'=HYPERLINK(""x"")"`));
  assert.ok(csv.includes('"123.45"'));
  assert.ok(!filasACsv([n(2, {})], () => "Nuevo").includes("Monto"));
});

/* ------------------------------ UI-017 ------------------------------ */

test("descuento efectivo incluye incentivos y extras, no solo el porcentaje visible", () => {
  const d = descuentoEfectivo(20_000_000, 19_400_000, [{ concepto: "Línea blanca", montoCents: 300_000 }, { concepto: "Parqueo extra", montoCents: 700_000 }]);
  assert.equal(d.descuentoPrecioCents, 600_000);
  assert.equal(d.porcentajeVisible, 3);
  assert.equal(d.porcentajeEfectivo, 8);
  assert.deepEqual(descuentoEfectivo(0, 10), { descuentoPrecioCents: 0, incentivosCents: 0, totalCents: 0, porcentajeVisible: 0, porcentajeEfectivo: 0 });
  assert.equal(descuentoEfectivo(1000, 1200).descuentoPrecioCents, 0, "un precio mayor no es descuento negativo");
});

test("umbrales: el nivel sale del porcentaje efectivo", () => {
  const u = { agente: 2, gerente: 5, director: 8 };
  assert.equal(nivelRequerido(2, u), "agente");
  assert.equal(nivelRequerido(3, u), "gerente");
  assert.equal(nivelRequerido(8, u), "director");
  assert.equal(nivelRequerido(8.01, u), "comite");
});

test("aprobación: sin autoaprobación ni por debajo del nivel requerido", () => {
  assert.equal(puedeAprobar({ solicitanteId: 1, aprobadorId: 1, nivelAprobador: "director", requerido: "gerente" }).ok, false);
  assert.equal(puedeAprobar({ solicitanteId: 1, aprobadorId: 2, nivelAprobador: "gerente", requerido: "director" }).ok, false);
  assert.equal(puedeAprobar({ solicitanteId: 1, aprobadorId: 2, nivelAprobador: "director", requerido: "gerente" }).ok, true);
});

test("una aprobación fijada no se reutiliza para otra unidad, comprador, moneda, precio menor ni vencida", () => {
  const a = { unitId: 10, compradorId: 5, moneda: "USD", precioAprobadoCents: 19_000_000, vigenteHasta: "2026-10-31" };
  const uso = { unitId: 10, compradorId: 5, moneda: "USD", precioCents: 19_000_000, fecha: "2026-10-20" };
  assert.deepEqual(validarUsoAprobacion(a, uso), { ok: true });
  for (const cambio of [{ unitId: 11 }, { compradorId: 6 }, { moneda: "DOP" }, { precioCents: 18_000_000 }, { fecha: "2026-11-01" }]) {
    const r = validarUsoAprobacion(a, { ...uso, ...cambio });
    assert.equal(r.ok, false, JSON.stringify(cambio));
    if (!r.ok) assert.ok(r.motivo.length > 10);
  }
});

test("solo una solicitud pendiente cambia de estado", () => {
  assert.equal(transicionSolicitud("pendiente", "retirada").ok, true);
  assert.equal(transicionSolicitud("aprobada", "rechazada").ok, false);
});

/* ------------------------------ UI-016 ------------------------------ */

const op = (id: number, precio: number, m2: number, moneda = "USD"): OpcionUnidad => ({
  id, proyecto: "P", unidad: `U${id}`, tipo: "Apto", m2, habitaciones: 2, banos: 2, piso: 3, vista: "Mar", moneda,
  precioCents: precio, gastosCierreCents: 0, mantenimientoMensualCents: 0, entrega: "2027-T2", disponible: true,
  plan: { separacionPct: 10, construccionPct: 30, entregaPct: 60 },
});

test("comparador: hasta cuatro opciones", () => {
  let s = { ids: [] as number[], error: null as string | null };
  for (let i = 1; i <= MAX_COMPARAR; i++) s = alternarSeleccion(s.ids, i);
  assert.deepEqual(s.ids, [1, 2, 3, 4]);
  const extra = alternarSeleccion(s.ids, 5);
  assert.deepEqual(extra.ids, [1, 2, 3, 4]);
  assert.ok(extra.error);
  assert.deepEqual(alternarSeleccion(s.ids, 2).ids, [1, 3, 4]);
});

test("comparador: destaca solo con una moneda; con mezcla no elige «mejor precio»", () => {
  const d = destacados([op(1, 20_000_000, 100), op(2, 18_000_000, 80), op(3, 25_000_000, 140)]);
  assert.equal(d.menorPrecio, 2);
  assert.equal(d.menorPrecioM2, 3);
  assert.equal(d.mayorSuperficie, 3);
  const mezcla = destacados([op(1, 1, 100), op(2, 1, 50, "DOP")]);
  assert.equal(mezcla.menorPrecio, null);
  assert.equal(mezcla.monedasMezcladas, true);
});

test("plan orientativo suma exacto y vigencia avisa vencimiento", () => {
  const c = cuotasPlan(10_000_001, { separacionPct: 10, construccionPct: 30, entregaPct: 60 });
  assert.equal(c.separacionCents + c.construccionCents + c.entregaCents, 10_000_001);
  assert.equal(c.valido, true);
  assert.equal(cuotasPlan(100, { separacionPct: 10, construccionPct: 10, entregaPct: 10 }).valido, false);
  assert.equal(estadoVigencia("2026-10-18", "2026-10-19"), "vencida");
  assert.equal(estadoVigencia("2026-10-21", "2026-10-19"), "por-vencer");
  assert.equal(estadoVigencia("2026-11-30", "2026-10-19"), "vigente");
});

test("una versión emitida conserva su precio congelado y detecta cambios de lista", () => {
  const v = { version: 1, estado: "emitida" as const, emitidaEl: "2026-10-01", validaHasta: "2026-10-30", idioma: "es" as const, destinatario: "x", opciones: [{ unidadId: 1, precioCongeladoCents: 100, moneda: "USD" }, { unidadId: 2, precioCongeladoCents: 200, moneda: "USD" }] };
  assert.deepEqual(diferenciasDePrecio(v, (id) => (id === 1 ? 120 : 200)), [{ unidadId: 1, congelado: 100, actual: 120 }]);
  assert.equal(v.opciones[0]!.precioCongeladoCents, 100);
});

/* --------------------------- UI-015 / UI-018 --------------------------- */

const etapas: Etapa[] = [
  { id: 1, slug: "nuevo", name: "Nuevo", position: 1, kind: "open", defaultProbability: 10 },
  { id: 2, slug: "contactado", name: "Contactado", position: 2, kind: "open", defaultProbability: 20 },
  { id: 5, slug: "negociacion", name: "Negociación", position: 5, kind: "open", defaultProbability: 80 },
  { id: 6, slug: "cierre", name: "Cierre", position: 6, kind: "won", defaultProbability: 100 },
  { id: 7, slug: "perdido", name: "Perdido", position: 7, kind: "lost", defaultProbability: 0 },
];

test("checklist de cierre: marca lo que falta y lo que el rol no ve como no visible", () => {
  const negocio = { amountCents: 100, probability: null, commissionBasisPoints: undefined, expectedCloseDate: "2026-12-01", nextActivityTitle: null } as never;
  const lista = checklistCierre(negocio, [{ id: 1, projectId: 1, projectName: "Torre", unitId: null, unitCode: null, isPrimary: true }], null);
  const estado = Object.fromEntries(lista.map((r) => [r.id, r.estado]));
  assert.deepEqual(estado, { proyecto: "ok", unidad: "falta", monto: "ok", probabilidad: "falta", comision: "no-visible", fecha: "ok", proxima: "falta", reserva: "no-visible" });
  assert.deepEqual(avanceChecklist(lista), { cumplidos: 3, evaluables: 6, porcentaje: 50 });
  const conReserva = checklistCierre(negocio, [], [{ status: "confirmada" }]);
  assert.equal(conReserva.find((r) => r.id === "reserva")!.estado, "ok");
});

test("pasos del embudo por posición y negocio cerrado", () => {
  assert.deepEqual(pasosEmbudo(etapas, { stageId: 2, stageKind: "open" }).map((p) => p.estado), ["hecho", "actual", "pendiente"]);
  const cerrado = pasosEmbudo(etapas, { stageId: 7, stageKind: "lost" });
  assert.deepEqual(cerrado.map((p) => `${p.nombre}:${p.estado}`), ["Nuevo:hecho", "Contactado:hecho", "Negociación:hecho", "Perdido:actual"]);
});

test("valor ponderado solo con monto y probabilidad", () => {
  assert.equal(valorPonderadoNegocio({ amountCents: 10_000, probability: 25 }), 2_500);
  assert.equal(valorPonderadoNegocio({ amountCents: undefined, probability: 25 }), null);
  assert.equal(valorPonderadoNegocio({ amountCents: 10_000, probability: null }), null);
});
