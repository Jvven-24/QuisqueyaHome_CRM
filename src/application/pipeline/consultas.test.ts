import assert from "node:assert/strict";
import { test } from "node:test";
import { NotFoundError, ValidationError } from "../../domain/errors.ts";
import type { Actor, PermissionScope } from "../../domain/rbac.ts";
import { consultarCatalogosNegocios, consultarFichaNegocio, consultarListaNegocios, consultarTableroNegocios, consultarVentasHistoricasSinUnidad, resumirNegocios } from "./consultas.ts";
import { lecturaPipelineEnMemoria, type NegocioLecturaMemoria } from "./lectura-en-memoria.ts";
import type { CatalogosNegocios, FiltrosNegocios, OrdenNegocios } from "./puertos.ts";

const catalogos: CatalogosNegocios = { etapas: [{ id: 1, name: "Presentación", slug: "presentation", kind: "open", position: 1, defaultProbability: 30 }], motivos: [], proyectos: [], brokers: [] };
test("S-303-H: legado sin venta durable, own/none, cursor y DTO sin centinelas", async () => {
  const datos = Array.from({ length: 7 }, (_, i) => fila(i + 1));
  for (const d of datos) d.negocio.stageKind = "won";
  datos[1]!.ventaRegistrada = true;
  // No inferir legado a partir del interés: manda ausencia de unit_sales.
  datos[0]!.negocio.proyectoPrincipal = { dealId: 1, projectName: "QA", unitId: 1, unitCode: "QA" };
  datos[2]!.negocio.operationType = "rent";
  datos[3]!.negocio.stageKind = "open";
  datos[4]!.deletedAt = new Date();
  datos[5]!.negocio.brokerId = 20;
  const repo = lecturaPipelineEnMemoria(datos, catalogos);
  const first = await consultarVentasHistoricasSinUnidad(repo, actor("own"), null, 1);
  assert.deepEqual(first.filas.map(n => n.id), [1]);
  assert.equal(first.resumen.reduce((sum, n) => sum + n.count, 0), 2);
  assert.ok(first.siguiente);
  const second = await consultarVentasHistoricasSinUnidad(repo, actor("own"), first.siguiente, 1);
  assert.deepEqual(second.filas.map(n => n.id), [7]); assert.equal(second.siguiente, null);
  assert.deepEqual((await consultarVentasHistoricasSinUnidad(repo, actor("all"))).filas.map(n => n.id), [1,6,7]);
  const assistant = await consultarVentasHistoricasSinUnidad(repo, actor("own", "assistant"));
  for (const key of ["amountCents", "commissionBasisPoints", "totalCommissionCents"]) assert.ok(assistant.filas.every(n => !(key in n)));
  const none = new Proxy(repo, { get() { throw new Error("lectura prohibida"); } });
  assert.deepEqual(await consultarVentasHistoricasSinUnidad(none, actor("none")), { filas: [], siguiente: null, resumen: [] });
  await assert.rejects(consultarVentasHistoricasSinUnidad(repo, actor("all"), null, 0), ValidationError);
});
function actor(scope: PermissionScope, roleSlug = "broker"): Actor {
  return { userId: 10, roleSlug, permissions: [
    { resource: "deals", action: "view", scope }, { resource: "unit_real_price", action: "view", scope: "all" },
    { resource: "commissions", action: "view", scope: "all" },
  ] };
}
function fila(id: number, brokerId = 10, currency = "USD", amountCents: number | null = 100): NegocioLecturaMemoria {
  return { negocio: { id, brokerId, currency, amountCents, contactId: 1, contactName: "QA", contactPhone: null,
    contactPhoneDisplay: null, sourceName: null, brokerName: "QA", stageId: 1, stageKind: "open", operationType: "sale",
    probability: 30, commissionBasisPoints: 9876, totalCommissionCents: 987654321,
    expectedCloseDate: "2026-10-13", nextActivityTitle: null, nextActivityStartsAt: null,
    stageChangedAt: null, closedAt: null, lossReasonId: null, lossComment: null, notes: null,
    createdAt: new Date("2026-10-13T04:00:00Z"), proyectoPrincipal: null },
    propiedades: [{ id, projectId: 1, projectName: "QA", unitId: id, unitCode: "QA", isPrimary: true, realPriceCents: 123456789 }],
    proyectosDisponibles: [],
  };
}
function montar() {
  const datos = [fila(1), fila(2, 20), fila(3, 10, "DOP", 200), fila(4, 10, "USD", null)];
  datos[0]!.propiedades.push({ ...datos[0]!.propiedades[0]!, id: 20, unitId: 20, isPrimary: false });
  datos.push({ ...fila(5), deletedAt: new Date() });
  return { datos, repo: lecturaPipelineEnMemoria(datos, catalogos) };
}
test("negocios: own/all/team/none y papelera; ID ajeno y none son 404", async () => {
  const { repo } = montar();
  for (const [scope, esperado] of [["own", 3], ["team", 3], ["all", 4], ["none", 0]] as const) {
    const lista = await consultarTableroNegocios(repo, actor(scope));
    assert.equal(lista.filas.length, esperado);
  }
  await assert.rejects(consultarFichaNegocio(repo, actor("own"), 2), NotFoundError);
  await assert.rejects(consultarFichaNegocio(repo, actor("none"), 1), NotFoundError);
  assert.equal((await consultarFichaNegocio(repo, actor("all", "admin"), 2)).negocio.id, 2);
});
test("negocios: none no llama al puerto ni lee catálogos", async () => {
  const repo = new Proxy(montar().repo, { get() { throw new Error("lectura prohibida"); } });
  assert.deepEqual(await consultarCatalogosNegocios(repo, actor("none")), { etapas: [], motivos: [], proyectos: [], brokers: [] });
  assert.deepEqual(await resumirNegocios(repo, actor("none")), []);
  assert.deepEqual((await consultarListaNegocios(repo, actor("none"))).filas, []);
});
test("negocios: filtros combinados, proyecto alternativo y N:M no inflan ni mezclan divisas", async () => {
  const { repo, datos } = montar();
  datos[2]!.propiedades.push({ ...datos[2]!.propiedades[0]!, projectId: 9, isPrimary: false });
  const filtros: FiltrosNegocios = { projectId: 1, brokerId: 10, stageId: 1, resultado: "open", moneda: "USD", montoMin: 100, montoMax: 100 };
  const lista = await consultarListaNegocios(repo, actor("own"), filtros);
  assert.deepEqual(lista.filas.map(n => n.id), [1]);
  assert.equal(lista.resumen[0]!.count, 1);
  assert.equal(lista.resumen[0]!.amountCents, 100);
  assert.deepEqual((await consultarListaNegocios(repo, actor("own"), { projectId: 9 })).filas.map(n => n.id), [3]);
  const resumen = await resumirNegocios(repo, actor("own"));
  assert.equal(resumen.find(n => n.currency === "USD")!.amountCents, 100);
  assert.equal(resumen.find(n => n.currency === "DOP")!.amountCents, 200);
  assert.equal((await consultarListaNegocios(repo, actor("own"), { brokerId: 20 })).filas.length, 0);
});
test("negocios: fechas inclusivas y zona Santo Domingo, fecha estimada y cerrado nulo", async () => {
  const { repo, datos } = montar();
  datos[0]!.negocio.createdAt = new Date("2026-10-14T03:59:59.999Z");
  datos[2]!.negocio.createdAt = new Date("2026-10-13T03:59:59.999Z");
  const result = await consultarListaNegocios(repo, actor("own"), { desde: "2026-10-13", hasta: "2026-10-13" });
  assert.deepEqual(result.filas.map(n => n.id), [1, 4]);
  assert.equal((await consultarListaNegocios(repo, actor("own"), { campoFecha: "expectedCloseDate", desde: "2026-10-13", hasta: "2026-10-13" })).filas.length, 3);
  assert.equal((await consultarListaNegocios(repo, actor("own"), { campoFecha: "closedAt", desde: "2026-10-13" })).filas.length, 0);
});
test("negocios: whitelist del broker elimina centinelas, conserva monto propio; asistente sin importes", async () => {
  const { repo } = montar();
  const broker = await consultarFichaNegocio(repo, actor("own"), 1);
  assert.equal(broker.negocio.amountCents, 100);
  for (const valor of ["9876", "987654321", "123456789"]) assert.ok(!JSON.stringify(broker).includes(valor));
  assert.ok(!("commissionBasisPoints" in broker.negocio));
  assert.ok(!("totalCommissionCents" in broker.negocio));
  assert.ok(!("realPriceCents" in broker.propiedades[0]!));
  const admin = await consultarFichaNegocio(repo, actor("all", "admin"), 1);
  assert.equal(admin.propiedades[0]!.realPriceCents, 123456789);
  assert.equal(admin.negocio.totalCommissionCents, 987654321);
  const assistant = await consultarFichaNegocio(repo, actor("own", "assistant"), 1);
  assert.ok(!("amountCents" in assistant.negocio));
  assert.ok((await resumirNegocios(repo, actor("own", "assistant"))).every(n => !("amountCents" in n)));
});
test("negocios: cursor estable con empate/importe nulo, asc/desc y resumen completo", async () => {
  for (const campo of ["createdAt", "amountCents", "id"] as const) for (const direccion of ["asc", "desc"] as const) {
    const { repo } = montar(); const orden: OrdenNegocios = { campo, direccion };
    const esperado = (await consultarListaNegocios(repo, actor("all"), {}, orden)).filas.map(n => n.id);
    const ids: number[] = []; let cursor = null;
    do {
      const page = await consultarListaNegocios(repo, actor("all"), {}, orden, cursor, 1);
      assert.equal(page.resumen.reduce((s, n) => s + n.count, 0), 4);
      ids.push(...page.filas.map(n => n.id)); cursor = page.siguiente;
    } while (cursor);
    assert.deepEqual(ids, esperado); assert.equal(new Set(ids).size, 4);
  }
});
test("negocios: rechaza fechas imposibles, rangos invertidos, coerción, dinero inseguro y cursor incompatible", async () => {
  const { repo } = montar();
  for (const filtros of [{ desde: "2026-02-30" }, { desde: "2026-10-14", hasta: "2026-10-13" }, { montoMin: 2, montoMax: 1 },
    { montoMin: 1.5 }, { montoMin: Number.MAX_SAFE_INTEGER + 1 }, { projectId: -1 }, { resultado: "true" }, { isPrimary: "true" }]) {
    await assert.rejects(consultarListaNegocios(repo, actor("own"), filtros as FiltrosNegocios), ValidationError);
  }
  await assert.rejects(consultarListaNegocios(repo, actor("own"), {}, undefined, null, 201), ValidationError);
  await assert.rejects(consultarListaNegocios(repo, actor("own"), {}, undefined, false as unknown as import("./puertos.ts").CursorNegocios), ValidationError);
  await assert.rejects(consultarListaNegocios(repo, actor("own", "assistant"), { montoMin: 1 }), ValidationError);
  await assert.rejects(consultarListaNegocios(repo, actor("own"), {}, { campo: "id", direccion: "asc" },
    { id: 1, valor: 1, orden: { campo: "id", direccion: "desc" } }), ValidationError);
});
