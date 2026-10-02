/**
 * Pruebas de los casos de uso de Comisiones con dobles en memoria: la edición
 * (aprobar, pagar, anular, repartir) y la exportación CSV. Las transiciones
 * son del dominio (`domain/comision-estado.ts`): los mensajes se comparan
 * literalmente.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { ConflictError, NotFoundError } from "../../domain/errors.ts";
import type { Actor } from "../../domain/rbac.ts";
import { auditoriaEnMemoria } from "../testing/auditoria-en-memoria.ts";
import { unidadDeTrabajoEnMemoria } from "../testing/unidad-de-trabajo-en-memoria.ts";
import { editarComision, ENCABEZADO_CSV_COMISIONES, exportarComisionesCsv } from "./casos-de-uso.ts";
import { comisionesEnMemoria, lecturaExportacionEnMemoria } from "./en-memoria.ts";
import type { Comision, FilaComision } from "./puertos.ts";

const admin: Actor = { userId: 1, roleSlug: "admin", permissions: [] };
const broker: Actor = { userId: 5, roleSlug: "broker", permissions: [] };

function comision(parcial: Partial<Comision> & { id: number }): Comision {
  return {
    dealId: parcial.id * 10,
    brokerId: 5,
    currency: "USD",
    saleAmountCents: 40_000_000,
    commissionBasisPoints: 300,
    totalCommissionCents: 1_200_000,
    brokerShareBasisPoints: 5000,
    agencyShareBasisPoints: 5000,
    brokerAmountCents: 600_000,
    agencyAmountCents: 600_000,
    status: "pending",
    closedDate: "2026-09-10",
    approvedBy: null,
    approvedAt: null,
    paidAt: null,
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z"),
    createdBy: 1,
    updatedBy: 1,
    ...parcial,
  };
}

function montar(comisiones: Comision[], borrados: number[] = []) {
  const repo = comisionesEnMemoria({
    comisiones,
    negocios: comisiones.map((c) => ({ id: c.dealId, deletedAt: borrados.includes(c.dealId) ? new Date("2026-02-01T00:00:00Z") : null })),
  });
  const auditoria = auditoriaEnMemoria();
  const unidad = unidadDeTrabajoEnMemoria({ comisiones: repo, auditoria }, [repo, auditoria]);
  return { repo, auditoria, unidad, deps: { unidad } };
}

// --- aprobar, pagar, anular -------------------------------------------------

test("aprobar una pendiente: estado, aprobador y fecha, con su auditoría", async () => {
  const { repo, auditoria, deps } = montar([comision({ id: 1 })]);
  const fila = await editarComision(deps, admin, "all", 1, { status: "approved" });

  assert.equal(fila.status, "approved");
  assert.equal(fila.approvedBy, 1);
  assert.ok(fila.approvedAt instanceof Date);
  assert.equal(fila.paidAt, null);
  assert.deepEqual(repo.bloqueos, [1]);
  assert.equal(auditoria.registros.length, 1);
  const registro = auditoria.registros[0]!;
  assert.equal(registro.accion, "editar");
  assert.equal(registro.entidad, "commission");
  assert.equal(registro.entidadId, 1);
  assert.equal(registro.actorId, 1);
  assert.equal((registro.antes as Comision).status, "pending");
  assert.equal((registro.despues as Comision).status, "approved");
});

test("pagar una aprobada: estado y fecha de pago, sin tocar el aprobador", async () => {
  const { auditoria, deps } = montar([comision({ id: 1, status: "approved", approvedBy: 9 })]);
  const fila = await editarComision(deps, admin, "all", 1, { status: "paid" });

  assert.equal(fila.status, "paid");
  assert.ok(fila.paidAt instanceof Date);
  assert.equal(fila.approvedBy, 9);
  assert.equal(auditoria.registros.length, 1);
});

test("anular una pendiente y una aprobada", async () => {
  const { auditoria, deps } = montar([comision({ id: 1 }), comision({ id: 2, status: "approved" })]);
  assert.equal((await editarComision(deps, admin, "all", 1, { status: "void" })).status, "void");
  assert.equal((await editarComision(deps, admin, "all", 2, { status: "void" })).status, "void");
  assert.equal(auditoria.registros.length, 2);
});

test("cambiar el reparto de una pendiente recalcula montos y deja el total", async () => {
  const { auditoria, deps } = montar([comision({ id: 1 })]);
  const fila = await editarComision(deps, admin, "all", 1, { brokerShareBasisPoints: 6000 });

  assert.equal(fila.brokerShareBasisPoints, 6000);
  assert.equal(fila.agencyShareBasisPoints, 4000);
  assert.equal(fila.brokerAmountCents, 720_000);
  assert.equal(fila.agencyAmountCents, 480_000);
  assert.equal(fila.totalCommissionCents, 1_200_000);
  assert.equal(fila.status, "pending");
  assert.equal(auditoria.registros.length, 1);
});

// --- transiciones inválidas: mensaje literal y nada escrito ------------------

const INVALIDAS: { desde: Comision["status"]; hacia: "approved" | "paid" | "void"; mensaje: string }[] = [
  { desde: "pending", hacia: "paid", mensaje: "No se puede pasar una comisión pendiente a pagada." },
  { desde: "approved", hacia: "approved", mensaje: "No se puede pasar una comisión aprobada a aprobada." },
  { desde: "paid", hacia: "void", mensaje: "No se puede pasar una comisión pagada a anulada." },
  { desde: "paid", hacia: "approved", mensaje: "No se puede pasar una comisión pagada a aprobada." },
  { desde: "void", hacia: "approved", mensaje: "No se puede pasar una comisión anulada a aprobada." },
  { desde: "void", hacia: "paid", mensaje: "No se puede pasar una comisión anulada a pagada." },
];

for (const { desde, hacia, mensaje } of INVALIDAS) {
  test(`transición inválida ${desde} → ${hacia}: 409 con el mensaje del dominio y nada escrito`, async () => {
    const original = comision({ id: 1, status: desde });
    const { repo, auditoria, unidad, deps } = montar([original]);

    await assert.rejects(
      () => editarComision(deps, admin, "all", 1, { status: hacia }),
      (error) => error instanceof ConflictError && error.message === mensaje,
    );
    assert.deepEqual(repo.comisiones, [original]);
    assert.equal(auditoria.registros.length, 0);
    assert.equal(unidad.revertidas, 1);
  });
}

test("el reparto de una comisión no pendiente se rechaza con el mensaje literal", async () => {
  const original = comision({ id: 1, status: "approved" });
  const { repo, auditoria, deps } = montar([original]);

  await assert.rejects(
    () => editarComision(deps, admin, "all", 1, { brokerShareBasisPoints: 7000 }),
    (error) =>
      error instanceof ConflictError &&
      error.message === "El reparto solo se puede editar mientras la comisión está pendiente (esta está aprobada).",
  );
  assert.deepEqual(repo.comisiones, [original]);
  assert.equal(auditoria.registros.length, 0);
});

// --- no existe, negocio borrado, fuera de alcance ----------------------------

test("una comisión inexistente es NotFoundError", async () => {
  const { deps } = montar([]);
  await assert.rejects(() => editarComision(deps, admin, "all", 99, { status: "approved" }), NotFoundError);
});

test("la comisión de un negocio borrado responde NotFoundError y no se escribe nada", async () => {
  const original = comision({ id: 1 });
  const { repo, auditoria, deps } = montar([original], [original.dealId]);

  await assert.rejects(() => editarComision(deps, admin, "all", 1, { status: "approved" }), NotFoundError);
  assert.deepEqual(repo.comisiones, [original]);
  assert.equal(auditoria.registros.length, 0);
});

test("una comisión ajena con alcance own es NotFoundError; la propia se edita", async () => {
  const ajena = comision({ id: 1, brokerId: 7 });
  const propia = comision({ id: 2, brokerId: 5 });
  const { repo, auditoria, deps } = montar([ajena, propia]);

  await assert.rejects(() => editarComision(deps, broker, "own", 1, { status: "approved" }), NotFoundError);
  assert.equal(repo.comisiones.find((c) => c.id === 1)!.status, "pending");
  assert.equal(auditoria.registros.length, 0);

  assert.equal((await editarComision(deps, broker, "own", 2, { status: "approved" })).status, "approved");
});

test("una comisión sin broker solo la alcanza `all`", async () => {
  const { deps } = montar([comision({ id: 1, brokerId: null })]);
  await assert.rejects(() => editarComision(deps, broker, "own", 1, { status: "approved" }), NotFoundError);
  assert.equal((await editarComision(deps, admin, "all", 1, { status: "approved" })).status, "approved");
});

// --- el bloqueo --------------------------------------------------------------

test("si al bloquear el estado ya cambió (otra petición ganó), la transición se decide con el estado REAL", async () => {
  const { repo, auditoria, deps } = montar([comision({ id: 1 })]);
  // La otra petición aprueba justo antes de que el bloqueo devuelva la fila.
  repo.alBloquear = (id) => repo.cambiarEstado(id, "approved");

  await assert.rejects(
    () => editarComision(deps, admin, "all", 1, { status: "approved" }),
    (error) => error instanceof ConflictError && error.message === "No se puede pasar una comisión aprobada a aprobada.",
  );
  assert.equal(auditoria.registros.length, 0);
  assert.deepEqual(repo.bloqueos, [1]);
});

test("el reparto también se decide con el estado real tras el bloqueo", async () => {
  const { repo, deps } = montar([comision({ id: 1 })]);
  repo.alBloquear = (id) => repo.cambiarEstado(id, "paid");

  await assert.rejects(
    () => editarComision(deps, admin, "all", 1, { brokerShareBasisPoints: 6000 }),
    (error) =>
      error instanceof ConflictError &&
      error.message === "El reparto solo se puede editar mientras la comisión está pendiente (esta está pagada).",
  );
});

test("un fallo del repositorio al escribir no deja ni cambio ni auditoría", async () => {
  const { repo, auditoria, unidad, deps } = montar([comision({ id: 1 })]);
  const original = repo.comisiones;
  repo.actualizar = async () => {
    throw new Error("fallo de base de datos");
  };
  await assert.rejects(() => editarComision(deps, admin, "all", 1, { status: "approved" }), /fallo de base de datos/);
  assert.deepEqual(repo.comisiones, original);
  assert.equal(auditoria.registros.length, 0);
  assert.equal(unidad.revertidas, 1);
});

// --- exportación CSV ---------------------------------------------------------

function fila(parcial: Partial<FilaComision> & { id: number }): FilaComision {
  return {
    dealId: parcial.id * 10,
    status: "pending",
    closedDate: "2026-09-10",
    currency: "USD",
    saleAmountCents: 40_000_000,
    commissionBasisPoints: 300,
    totalCommissionCents: 1_200_000,
    brokerShareBasisPoints: 5000,
    agencyShareBasisPoints: 5000,
    brokerAmountCents: 600_000,
    agencyAmountCents: 600_000,
    brokerId: 5,
    brokerName: "Ana Pérez",
    contactName: "Cliente Uno",
    projectName: "Torre Azul",
    ...parcial,
  };
}

const TODOS = { brokerId: null, periodo: null, estado: "todos" } as const;
const BOM = "﻿";

test("el CSV lleva el encabezado y el orden de columnas exactos", async () => {
  const leerFilas = lecturaExportacionEnMemoria([fila({ id: 1 })]);
  const { csv, nombreArchivo } = await exportarComisionesCsv({ leerFilas }, admin, "all", TODOS);

  assert.deepEqual(ENCABEZADO_CSV_COMISIONES, [
    "Negocio",
    "Proyecto",
    "Monto de venta",
    "Comisión %",
    "Total comisión",
    "Broker %",
    "Agencia %",
    "Monto broker",
    "Monto agencia",
    "Broker",
    "Estado",
    "Fecha de cierre",
  ]);
  assert.equal(
    csv,
    `${BOM}Negocio,Proyecto,Monto de venta,Comisión %,Total comisión,Broker %,Agencia %,Monto broker,Monto agencia,Broker,Estado,Fecha de cierre\r\n` +
      "Cliente Uno,Torre Azul,400000.00,3,12000.00,50,50,6000.00,6000.00,Ana Pérez,Pendiente,2026-09-10\r\n",
  );
  assert.equal(nombreArchivo, "comisiones-todos.csv");
});

test("sin proyecto, broker ni fecha: vacío, 'Sin asignar' y vacío", async () => {
  const leerFilas = lecturaExportacionEnMemoria([
    fila({ id: 1, projectName: null, brokerId: null, brokerName: null, closedDate: null, status: "void" }),
  ]);
  const { csv } = await exportarComisionesCsv({ leerFilas }, admin, "all", TODOS);
  assert.ok(csv.endsWith("Cliente Uno,,400000.00,3,12000.00,50,50,6000.00,6000.00,Sin asignar,Anulada,\r\n"));
});

test("el CSV de cero filas es solo el encabezado con BOM", async () => {
  const leerFilas = lecturaExportacionEnMemoria([]);
  const { csv } = await exportarComisionesCsv({ leerFilas }, admin, "all", TODOS);
  assert.equal(
    csv,
    `${BOM}${ENCABEZADO_CSV_COMISIONES.join(",")}\r\n`,
  );
});

test("el nombre de archivo lleva el periodo (AAAA-MM) cuando hay filtro", async () => {
  const leerFilas = lecturaExportacionEnMemoria([]);
  const { nombreArchivo } = await exportarComisionesCsv(
    { leerFilas },
    admin,
    "all",
    { brokerId: null, periodo: { year: 2026, month: 9 }, estado: "todos" },
  );
  assert.equal(nombreArchivo, "comisiones-2026-09.csv");
});

test("el alcance filtra: un broker solo exporta lo suyo; all exporta todo", async () => {
  const leerFilas = lecturaExportacionEnMemoria([
    fila({ id: 1, brokerId: 5, contactName: "Mío" }),
    fila({ id: 2, brokerId: 7, contactName: "Ajeno" }),
  ]);
  const propio = await exportarComisionesCsv({ leerFilas }, broker, "own", TODOS);
  assert.ok(propio.csv.includes("Mío"));
  assert.ok(!propio.csv.includes("Ajeno"));

  const todo = await exportarComisionesCsv({ leerFilas }, admin, "all", TODOS);
  assert.ok(todo.csv.includes("Mío") && todo.csv.includes("Ajeno"));
});

test("el caso de uso pasa actor, alcance y filtros a la consulta tal cual", async () => {
  const leerFilas = lecturaExportacionEnMemoria([fila({ id: 1, status: "paid" }), fila({ id: 2, status: "pending" })]);
  const filtros = { brokerId: null, periodo: null, estado: "paid" } as const;
  const { csv } = await exportarComisionesCsv({ leerFilas }, admin, "all", filtros);

  assert.equal(leerFilas.llamadas.length, 1);
  assert.equal(leerFilas.llamadas[0]!.actor, admin);
  assert.equal(leerFilas.llamadas[0]!.alcance, "all");
  assert.equal(leerFilas.llamadas[0]!.filtros, filtros);
  assert.ok(csv.includes("Pagada") && !csv.includes("Pendiente"));
});

test("un nombre que empieza como fórmula sale neutralizado (domain/csv.ts)", async () => {
  const leerFilas = lecturaExportacionEnMemoria([fila({ id: 1, contactName: "=HYPERLINK(\"x\")" })]);
  const { csv } = await exportarComisionesCsv({ leerFilas }, admin, "all", TODOS);
  assert.ok(csv.includes(`"'=HYPERLINK(""x"")"`));
});

// --- la garantía que ningún doble puede probar --------------------------------

test("el adaptador real bloquea SOLO la fila de commissions: .for(\"update\", { of: commissions })", () => {
  // En memoria no hay concurrencia: quitar el bloqueo, o bloquear también `deals`
  // (un `for("update")` sin `of`), no hace fallar ninguna otra prueba. Se lee el
  // código del adaptador (como `arquitectura.test.ts`) en vez de importarlo: abre
  // la conexión al cargarse y usa imports sin extensión que `node --test` no resuelve.
  const infraestructura = new URL("../../infrastructure/", import.meta.url);
  const codigo = readFileSync(new URL("db/repos/comisiones.ts", infraestructura), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

  const bloqueos = codigo.match(/\.for\(/g) ?? [];
  assert.equal(bloqueos.length, 1, "bloquearComision es el único bloqueo del adaptador");
  assert.match(codigo, /\.for\("update",\s*\{\s*of:\s*commissions\s*\}\)/);
});
