import assert from "node:assert/strict";
import { test } from "node:test";
import { RepositorioAcademyEnMemoria } from "./en-memoria.ts";
import {
  listarContenidosAcademy,
  obtenerDetalleContenido,
  completarContenidoAcademy,
  marcarPasoChecklist,
  obtenerResumenProgresoBroker,
} from "./casos-de-uso.ts";

test("Academy: listar contenidos devuelve los módulos iniciales con 0% de progreso", async () => {
  const repo = new RepositorioAcademyEnMemoria();
  const userId = 42;

  const contenidos = await listarContenidosAcademy(repo, userId);
  assert.equal(contenidos.length, 4);
  assert.equal(contenidos[0]!.progressPercent, 0);
  assert.equal(contenidos[0]!.isCompleted, false);

  const resumen = await obtenerResumenProgresoBroker(repo, userId);
  assert.equal(resumen.totalItems, 4);
  assert.equal(resumen.completedItems, 0);
  assert.equal(resumen.percent, 0);
  assert.equal(resumen.isCertified, false);
});

test("Academy: filtrar contenidos por categoría", async () => {
  const repo = new RepositorioAcademyEnMemoria();
  const userId = 42;

  const ventas = await listarContenidosAcademy(repo, userId, "Ventas");
  assert.equal(ventas.length, 1);
  assert.equal(ventas[0]!.title, "Manejo de objeciones en venta de planos");

  const leyes = await listarContenidosAcademy(repo, userId, "Leyes y Finanzas");
  assert.equal(leyes.length, 1);
  assert.equal(leyes[0]!.title, "Leyes Inmobiliarias & Exenciones Confotur (Ley 158-01)");
});

test("Academy: completar un video actualiza el estado y la fecha de finalización", async () => {
  const repo = new RepositorioAcademyEnMemoria();
  const userId = 42;

  const res = await completarContenidoAcademy(repo, userId, 1, 100, true);
  assert.equal(res.progressPercent, 100);
  assert.equal(res.isCompleted, true);

  const detalle = await obtenerDetalleContenido(repo, userId, 1);
  assert.equal(detalle.isCompleted, true);
  assert.ok(detalle.completedAt !== null);

  const resumen = await obtenerResumenProgresoBroker(repo, userId);
  assert.equal(resumen.completedItems, 1);
  assert.equal(resumen.percent, 25);
  assert.equal(resumen.isCertified, false);
});

test("Academy: marcar pasos de un checklist recalcula el porcentaje del módulo", async () => {
  const repo = new RepositorioAcademyEnMemoria();
  const userId = 42;

  // Item 3 tiene 6 pasos: 101, 102, 103, 104, 105, 106
  await marcarPasoChecklist(repo, userId, 101, true);
  await marcarPasoChecklist(repo, userId, 102, true);
  await marcarPasoChecklist(repo, userId, 103, true);

  const detalle = await obtenerDetalleContenido(repo, userId, 3);
  // 3 de 6 = 50%
  assert.equal(detalle.progressPercent, 50);
  assert.equal(detalle.isCompleted, false);

  // Completar los 3 restantes
  await marcarPasoChecklist(repo, userId, 104, true);
  await marcarPasoChecklist(repo, userId, 105, true);
  await marcarPasoChecklist(repo, userId, 106, true);

  const detalleFinal = await obtenerDetalleContenido(repo, userId, 3);
  assert.equal(detalleFinal.progressPercent, 100);
  assert.equal(detalleFinal.isCompleted, true);
});

test("Academy: al completar todos los contenidos se otorga la certificación del broker", async () => {
  const repo = new RepositorioAcademyEnMemoria();
  const userId = 42;

  await completarContenidoAcademy(repo, userId, 1, 100, true);
  await completarContenidoAcademy(repo, userId, 2, 100, true);
  await completarContenidoAcademy(repo, userId, 3, 100, true);
  await completarContenidoAcademy(repo, userId, 4, 100, true);

  const resumen = await obtenerResumenProgresoBroker(repo, userId);
  assert.equal(resumen.completedItems, 4);
  assert.equal(resumen.percent, 100);
  assert.equal(resumen.isCertified, true);
});
