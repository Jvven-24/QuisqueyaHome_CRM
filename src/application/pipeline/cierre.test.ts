/**
 * Pruebas del cierre transaccional de ocho pasos (`cierre.ts`) con dobles en
 * memoria, tanto de punta a punta (`cambiarEtapaDeNegocio` hacia una etapa
 * `won`) como llamando directamente a `cerrarNegocioGanado`.
 *
 * Límite honesto de estas pruebas: en memoria no hay concurrencia. Que el
 * bloqueo de fila y el upsert de metas son atómicos lo garantizan el
 * `FOR UPDATE` y el `ON CONFLICT` del adaptador Drizzle, no estos dobles. Lo
 * que sí se comprueba es que el caso de uso USA `bloquearNegocio` (la etapa que
 * el bloqueo revela es la que decide) y el único método atómico de metas.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { ConflictError, NotFoundError } from "../../domain/errors.ts";
import type { Actor } from "../../domain/rbac.ts";
import {
  calcularComision,
  evaluarNivelBroker,
  DEFAULT_AGENCY_SHARE_BASIS_POINTS,
  DEFAULT_BROKER_SHARE_BASIS_POINTS,
} from "../../domain/cierre-negocio.ts";
import { fechaSantoDomingo } from "../../domain/zona-horaria.ts";
import { normalizarCodigoUnidad } from "../../domain/unidades.ts";
import { outboxEnMemoria } from "../testing/outbox-en-memoria.ts";
import { auditoriaEnMemoria } from "../testing/auditoria-en-memoria.ts";
import { unidadDeTrabajoEnMemoria } from "../testing/unidad-de-trabajo-en-memoria.ts";
import { cerrarNegocioGanado } from "./cierre.ts";
import { cambiarEtapaDeNegocio } from "./casos-de-uso.ts";
import { pipelineEnMemoria, type ActividadEnMemoria, type SemillaPipeline } from "./en-memoria.ts";
import type { CompromisosPort, EtapaPipeline, Negocio, PropiedadDeNegocio } from "./puertos.ts";

const broker: Actor = { userId: 5, roleSlug: "broker", permissions: [{ resource: "projects", action: "view", scope: "all" }] };
const admin: Actor = { userId: 1, roleSlug: "administrador", permissions: [{ resource: "projects", action: "view", scope: "all" }] };

const MENSAJE_SIN_COMISION = "Para cerrar el negocio hace falta el porcentaje de comisión.";

function etapa(id: number, kind: EtapaPipeline["kind"], position: number): EtapaPipeline {
  return {
    id,
    slug: `etapa-${id}`,
    name: `Etapa ${id}`,
    position,
    kind,
    defaultProbability: null,
    isActive: true,
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z"),
  };
}

const ETAPAS = [etapa(1, "open", 1), etapa(5, "open", 5), etapa(6, "won", 6), etapa(7, "lost", 7)];
test("S-303-H: legado no se reabre por esta vía; un legado reabierto exige unidad al cerrar", async () => {
  const cerrado = montar({ negocios: [negocio({ id: 1, stageId: 6, closedAt: new Date() })], propiedades: [principal({ id: 1, unitId: null })] });
  await assert.rejects(cambiarEtapaDeNegocio(cerrado.deps, broker, "own", 1, { stageId: 1 }), /ya está cerrado/);
  // Estado reabierto representativo; no se introduce una vía de reapertura fuera de la tarea.
  const { deps, pipeline, outbox, auditoria } = montar({ negocios: [negocio({ id: 1, stageId: 5, closedAt: new Date() })], propiedades: [principal({ id: 1, unitId: null })] });
  const antes = structuredClone({ negocios: pipeline.negocios, historial: pipeline.historial, ventas: pipeline.ventas });
  await assert.rejects(cambiarEtapaDeNegocio(deps, broker, "own", 1, { stageId: 6 }), /unidad/i);
  assert.deepEqual({ negocios: pipeline.negocios, historial: pipeline.historial, ventas: pipeline.ventas }, antes);
  const eventos = outbox.eventos.length;
  const registros = auditoria.registros.length;
  await cambiarEtapaDeNegocio(deps, broker, "own", 1, { stageId: 6, unitId: 100 });
  assert.equal(pipeline.ventas.length, 1);
  assert.equal(outbox.eventos.length, eventos + 1); assert.equal(auditoria.registros.length, registros + 1);
});

function negocio(parcial: Partial<Negocio> & { id: number }): Negocio {
  return {
    contactId: 1,
    leadId: null,
    title: null,
    stageId: 5,
    sourceId: null,
    brokerId: 5,
    operationType: "sale",
    currency: "USD",
    amountCents: 40_000_000,
    probability: 80,
    commissionBasisPoints: 300,
    expectedCloseDate: "2026-12-01",
    nextActivityId: null,
    stageChangedAt: null,
    closedAt: null,
    lossReasonId: null,
    lossComment: null,
    notes: null,
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z"),
    createdBy: 5,
    updatedBy: 5,
    deletedAt: null,
    ...parcial,
  };
}

function principal(parcial: Partial<PropiedadDeNegocio> & { id: number }): PropiedadDeNegocio {
  return {
    dealId: 1,
    projectId: 10,
    unitId: 100,
    isPrimary: true,
    createdAt: new Date("2025-01-01T00:00:00Z"),
    createdBy: 5,
    ...parcial,
  };
}

function actividad(parcial: Partial<ActividadEnMemoria> & { id: number }): ActividadEnMemoria {
  return {
    dealId: 1,
    activityType: "call",
    status: "pending",
    assigneeId: 5,
    startsAt: new Date("2099-01-01T00:00:00Z"),
    deletedAt: null,
    ...parcial,
  };
}

const PERFIL = { userId: 5, monthlyTargetDeals: 4, annualSalesCents: 0, level: "junior" as const };
const UNIDAD = { id: 100, projectId: 10, status: "available", deletedAt: null };

function montar(semilla: SemillaPipeline = {}) {
  const pipeline = pipelineEnMemoria({
    etapas: ETAPAS,
    negocios: [negocio({ id: 1 })],
    propiedades: [principal({ id: 1 })],
    perfiles: [PERFIL],
    unidades: [UNIDAD],
    proyectos: [{ id: 10, brokerId: 5, deletedAt: null }],
    ...semilla,
  });
  const auditoria = auditoriaEnMemoria();
  const outbox = outboxEnMemoria();
  const compromisos: CompromisosPort = {
    async cerrarVenta({ unitId, projectId, dealId, actorId }) {
      const fila = await pipeline.bloquearUnidad(unitId, projectId);
      if (!fila) throw new NotFoundError();
      if (fila.status !== "available") throw new ConflictError("La unidad ya no está disponible para este cierre.");
      await pipeline.registrarVenta({ unitId, projectId, dealId, actorId, unitCodeNormalized: normalizarCodigoUnidad(fila.code) });
      await pipeline.marcarUnidad({ unitId, estado: "sold", actorId });
      return new Date();
    },
    async cerrarAlquiler({ unitId, projectId, actorId }) {
      const fila = await pipeline.bloquearUnidad(unitId, projectId);
      if (!fila) throw new NotFoundError();
      if (fila.status !== "available") throw new ConflictError("La unidad ya no está disponible para este cierre.");
      await pipeline.marcarUnidad({ unitId, estado: "reserved", actorId });
      return new Date();
    },
  };
  const repos = { pipeline, compromisos, auditoria, outbox };
  const unidad = unidadDeTrabajoEnMemoria(repos, [pipeline, auditoria, outbox]);
  return { ...repos, unidad, deps: { unidad }, repos };
}

/** Periodo (año, mes) de un instante en hora de Santo Domingo, como lo calcula el cierre. */
function periodoDe(fecha: Date): { anio: number; mes: number } {
  const [anio, mes] = fechaSantoDomingo(fecha).split("-").map(Number) as [number, number];
  return { anio, mes };
}

// --- el cierre completo -----------------------------------------------------

test("cierre completo: ocurren los ocho pasos, en una sola unidad de trabajo", async () => {
  const pasadaPendiente = actividad({ id: 1, startsAt: new Date("2001-01-01T00:00:00Z") });
  const futuraPendiente = actividad({ id: 2 });
  const sinFecha = actividad({ id: 3, startsAt: null });
  const futuraCompletada = actividad({ id: 4, status: "completed" });
  const deOtroNegocio = actividad({ id: 5, dealId: 2 });
  const { deps, pipeline, auditoria, unidad } = montar({
    actividades: [pasadaPendiente, futuraPendiente, sinFecha, futuraCompletada, deOtroNegocio],
  });
  const antes = pipeline.negocios[0]!;

  const antesDeCerrar = new Date();
  const fila = await cambiarEtapaDeNegocio(deps, broker, "own", 1, { stageId: 6, amountCents: 50_000_000 });
  const despuesDeCerrar = new Date();

  // Paso 1: negocio sellado con closedAt y el monto final (el del body gana).
  assert.equal(fila.stageId, 6);
  assert.equal(fila.amountCents, 50_000_000);
  assert.ok(fila.closedAt instanceof Date);
  assert.ok(fila.closedAt >= antesDeCerrar && fila.closedAt <= despuesDeCerrar);
  assert.deepEqual(fila.stageChangedAt, fila.closedAt);
  assert.equal(fila.updatedBy, 5);
  assert.deepEqual(pipeline.negocios[0], fila);

  // Paso 2: historial.
  assert.deepEqual(pipeline.historial, [{ dealId: 1, fromStageId: 5, toStageId: 6, changedBy: 5 }]);

  // Paso 3: la unidad principal queda vendida.
  assert.equal(pipeline.unidades[0]!.status, "sold");

  // Paso 4: meta del broker Y de la compañía, del periodo de Santo Domingo.
  const { anio, mes } = periodoDe(fila.closedAt);
  assert.deepEqual(pipeline.metas, [
    { brokerId: 5, year: anio, month: mes, targetDeals: 4, achievedDeals: 1, achievedAmountCents: 50_000_000, updatedBy: 5 },
    { brokerId: null, year: anio, month: mes, targetDeals: 0, achievedDeals: 1, achievedAmountCents: 50_000_000, updatedBy: 5 },
  ]);

  // Paso 5: perfil recalculado con su nivel.
  assert.equal(pipeline.perfiles[0]!.annualSalesCents, 50_000_000);
  assert.equal(pipeline.perfiles[0]!.level, evaluarNivelBroker(50_000_000));

  // Paso 6: comisión pending con los importes de `calcularComision`.
  const esperada = calcularComision({
    saleAmountCents: 50_000_000,
    commissionBasisPoints: 300,
    brokerShareBasisPoints: DEFAULT_BROKER_SHARE_BASIS_POINTS,
    agencyShareBasisPoints: DEFAULT_AGENCY_SHARE_BASIS_POINTS,
  });
  assert.deepEqual(pipeline.comisiones, [
    {
      dealId: 1,
      brokerId: 5,
      currency: "USD",
      saleAmountCents: 50_000_000,
      commissionBasisPoints: 300,
      totalCommissionCents: esperada.totalCommissionCents,
      brokerShareBasisPoints: DEFAULT_BROKER_SHARE_BASIS_POINTS,
      agencyShareBasisPoints: DEFAULT_AGENCY_SHARE_BASIS_POINTS,
      brokerAmountCents: esperada.brokerAmountCents,
      agencyAmountCents: esperada.agencyAmountCents,
      status: "pending",
      closedDate: fechaSantoDomingo(fila.closedAt),
      createdBy: 5,
      updatedBy: 5,
    },
  ]);
  assert.equal(esperada.totalCommissionCents, 1_500_000);

  // Paso 7: las pendientes futuras (y las sin fecha) se cancelan; la pasada, la
  // completada y la de otro negocio quedan como estaban.
  const estados = Object.fromEntries(pipeline.actividades.map((a) => [a.id, a.status]));
  assert.deepEqual(estados, { 1: "pending", 2: "cancelled", 3: "cancelled", 4: "completed", 5: "pending" });

  // Paso 8: auditoría `cerrar`, con el negocio bloqueado como antes.
  assert.deepEqual(auditoria.registros, [
    { accion: "cerrar", entidad: "deal", entidadId: 1, antes, despues: fila, actorId: 5 },
  ]);

  // Y la defensa 2 se ejerció: el negocio se bloqueó, una vez.
  assert.deepEqual(pipeline.bloqueos, [1]);
  assert.equal(unidad.confirmadas, 1);
  assert.equal(unidad.revertidas, 0);
});

test("cierre sin monto en el body usa el monto que ya tenía el negocio", async () => {
  const { deps } = montar();
  const fila = await cambiarEtapaDeNegocio(deps, broker, "own", 1, { stageId: 6 });
  assert.equal(fila.amountCents, 40_000_000);
});

test("cierre de un alquiler deja la unidad reservada, no vendida", async () => {
  const { deps, pipeline } = montar({ negocios: [negocio({ id: 1, operationType: "rent" })] });
  await cambiarEtapaDeNegocio(deps, broker, "own", 1, { stageId: 6 });
  assert.equal(pipeline.unidades[0]!.status, "reserved");
});

test("cierre sin unidad principal resuelta: ConflictError de transicion-etapa y nada escrito", async () => {
  // Interés a nivel de proyecto, sin unidad: no alcanza para cerrar.
  const { deps, pipeline, auditoria } = montar({ propiedades: [principal({ id: 1, unitId: null })] });

  await assert.rejects(cambiarEtapaDeNegocio(deps, broker, "own", 1, { stageId: 6 }), (error) => {
    assert.ok(error instanceof ConflictError);
    assert.equal(
      error.message,
      "Para cerrar el negocio hace falta definir la unidad principal entre las propiedades de interés.",
    );
    return true;
  });
  assert.deepEqual(pipeline.bloqueos, [1]);
  assert.deepEqual(pipeline.comisiones, []);
  assert.deepEqual(auditoria.registros, []);
});

// --- metas: upsert (crea o suma) --------------------------------------------

test("dos cierres del mismo periodo SUMAN en la misma fila de meta, no crean otra", async () => {
  const { deps, pipeline } = montar({
    negocios: [negocio({ id: 1 }), negocio({ id: 2 })],
    propiedades: [principal({ id: 1 }), principal({ id: 2, dealId: 2, unitId: 200 })],
    unidades: [UNIDAD, { ...UNIDAD, id: 200 }],
  });

  await cambiarEtapaDeNegocio(deps, broker, "own", 1, { stageId: 6, amountCents: 10_000_000 });
  await cambiarEtapaDeNegocio(deps, broker, "own", 2, { stageId: 6, amountCents: 20_000_000 });

  assert.equal(pipeline.metas.length, 2);
  for (const meta of pipeline.metas) {
    assert.equal(meta.achievedDeals, 2);
    assert.equal(meta.achievedAmountCents, 30_000_000);
  }
  // El upsert nunca toca la meta (`target_*`), solo `achieved_*`.
  assert.equal(pipeline.metas.find((m) => m.brokerId === 5)!.targetDeals, 4);
  assert.equal(pipeline.comisiones.length, 2);
});

test("una meta que ya existe para el periodo se suma, sin tocar su target", async () => {
  const { anio, mes } = periodoDe(new Date());
  const { deps, pipeline } = montar({
    metas: [{ brokerId: 5, year: anio, month: mes, targetDeals: 9, achievedDeals: 3, achievedAmountCents: 1_000, updatedBy: 1 }],
  });

  await cambiarEtapaDeNegocio(deps, broker, "own", 1, { stageId: 6, amountCents: 5_000 });

  const meta = pipeline.metas.find((m) => m.brokerId === 5)!;
  assert.deepEqual(meta, { brokerId: 5, year: anio, month: mes, targetDeals: 9, achievedDeals: 4, achievedAmountCents: 6_000, updatedBy: 5 });
});

// --- perfil y recálculo anual -----------------------------------------------

test("el perfil se RECALCULA con el total ganado del año, no se incrementa", async () => {
  const { anio } = periodoDe(new Date());
  const ganadoEsteAnio = negocio({ id: 2, stageId: 6, amountCents: 7_000_000, closedAt: new Date(`${anio}-01-15T12:00:00Z`) });
  const ganadoElAnioPasado = negocio({ id: 3, stageId: 6, amountCents: 99_000_000, closedAt: new Date(`${anio - 1}-06-15T12:00:00Z`) });
  const ganadoPeroBorrado = negocio({ id: 4, stageId: 6, amountCents: 99_000_000, closedAt: new Date(`${anio}-02-15T12:00:00Z`), deletedAt: new Date() });
  const { deps, pipeline } = montar({
    negocios: [negocio({ id: 1 }), ganadoEsteAnio, ganadoElAnioPasado, ganadoPeroBorrado],
    perfiles: [{ ...PERFIL, annualSalesCents: 123 }],
  });

  await cambiarEtapaDeNegocio(deps, broker, "own", 1, { stageId: 6, amountCents: 50_000_000 });

  // 123 (valor viejo, arrastrado de por vida) no cuenta: solo el SUM del año.
  assert.equal(pipeline.perfiles[0]!.annualSalesCents, 57_000_000);
  assert.equal(pipeline.perfiles[0]!.level, evaluarNivelBroker(57_000_000));
});

test("cierre de un negocio cuyo broker no tiene perfil: no falla y no recalcula nada", async () => {
  const { deps, pipeline, auditoria } = montar({ negocios: [negocio({ id: 1, brokerId: 9 })], perfiles: [] });

  const fila = await cambiarEtapaDeNegocio(deps, admin, "all", 1, { stageId: 6 });

  assert.equal(fila.stageId, 6);
  assert.deepEqual(pipeline.perfiles, []);
  // La meta del broker sin perfil nace con target 0, y la comisión se crea igual.
  assert.equal(pipeline.metas.find((m) => m.brokerId === 9)!.targetDeals, 0);
  assert.ok(pipeline.metas.some((m) => m.brokerId === null));
  assert.equal(pipeline.comisiones.length, 1);
  assert.equal(auditoria.registros[0]!.accion, "cerrar");
});

test("cierre de un negocio sin responsable: solo incrementa la meta de la compañía", async () => {
  const { deps, pipeline } = montar({ negocios: [negocio({ id: 1, brokerId: null })] });

  await cambiarEtapaDeNegocio(deps, admin, "all", 1, { stageId: 6 });

  assert.deepEqual(pipeline.metas.map((m) => m.brokerId), [null]);
  assert.equal(pipeline.comisiones[0]!.brokerId, null);
  assert.equal(pipeline.perfiles[0]!.annualSalesCents, 0);
});

// --- las defensas contra el doble cierre y la guarda de comisión ------------

test("cierre sin commissionBasisPoints: ConflictError con el mensaje exacto y nada escrito", async () => {
  const { deps, pipeline, auditoria } = montar({
    negocios: [negocio({ id: 1, commissionBasisPoints: null })],
    actividades: [actividad({ id: 1 })],
  });

  await assert.rejects(cambiarEtapaDeNegocio(deps, broker, "own", 1, { stageId: 6 }), (error) => {
    assert.ok(error instanceof ConflictError);
    assert.equal(error.message, MENSAJE_SIN_COMISION);
    return true;
  });

  assert.equal(pipeline.negocios[0]!.stageId, 5);
  assert.equal(pipeline.negocios[0]!.closedAt, null);
  assert.deepEqual(pipeline.historial, []);
  assert.equal(pipeline.unidades[0]!.status, "available");
  assert.deepEqual(pipeline.metas, []);
  assert.deepEqual(pipeline.comisiones, []);
  assert.equal(pipeline.actividades[0]!.status, "pending");
  assert.deepEqual(auditoria.registros, []);
});

test("defensa 2: si el bloqueo revela que la etapa ya no es open, ConflictError del doble cierre y nada escrito", async () => {
  const { deps, pipeline, auditoria, unidad } = montar();
  // La otra petición gana la carrera justo cuando esta pide el bloqueo: antes,
  // `validarTransicion` vio el negocio todavía abierto.
  pipeline.alBloquear = (id) => pipeline.moverNegocioAEtapa(id, 7);

  await assert.rejects(cambiarEtapaDeNegocio(deps, broker, "own", 1, { stageId: 6 }), (error) => {
    assert.ok(error instanceof ConflictError);
    assert.equal(error.message, "Este negocio ya está cerrado (ganado o perdido) y no puede cambiar de etapa.");
    return true;
  });

  assert.deepEqual(pipeline.bloqueos, [1]);
  assert.deepEqual(pipeline.historial, []);
  assert.equal(pipeline.unidades[0]!.status, "available");
  assert.deepEqual(pipeline.metas, []);
  assert.deepEqual(pipeline.comisiones, []);
  assert.deepEqual(auditoria.registros, []);
  assert.equal(unidad.revertidas, 1);
});

test("defensa 2 también frente a una pérdida que ganó la carrera", async () => {
  const { deps, pipeline } = montar();
  pipeline.alBloquear = (id) => pipeline.moverNegocioAEtapa(id, 7);

  await assert.rejects(cambiarEtapaDeNegocio(deps, broker, "own", 1, { stageId: 6 }), (error) => {
    assert.ok(error instanceof ConflictError);
    assert.equal(error.message, "Este negocio ya está cerrado (ganado o perdido) y no puede cambiar de etapa.");
    return true;
  });
  assert.deepEqual(pipeline.comisiones, []);
});

test("cerrarNegocioGanado directo: un negocio que no existe detrás del bloqueo es NotFoundError", async () => {
  const { repos } = montar();
  await assert.rejects(
    cerrarNegocioGanado(repos, broker, {
      dealId: 99,
      etapaDestino: ETAPAS[2]!,
      unidadPrincipal: principal({ id: 1 }) as PropiedadDeNegocio & { unitId: number },
      amountCentsFinal: 1,
    }),
    NotFoundError,
  );
  assert.deepEqual(repos.pipeline.bloqueos, [99]);
});

// --- todo o nada ------------------------------------------------------------

test("un fallo a mitad del cierre no deja nada escrito", async () => {
  const { deps, pipeline, auditoria, unidad } = montar({
    actividades: [actividad({ id: 1 })],
    perfiles: [{ ...PERFIL, annualSalesCents: 10 }],
  });
  // El paso 6 falla DESPUÉS de los pasos 1 a 5 (negocio, historial, unidad,
  // metas y perfil): en Postgres el rollback los deshace, y aquí el reversible.
  const fallo = new Error("fallo simulado en la comisión");
  pipeline.fallarEnCrearComision = fallo;

  await assert.rejects(cambiarEtapaDeNegocio(deps, broker, "own", 1, { stageId: 6 }), (error) => {
    assert.equal(error, fallo);
    return true;
  });

  assert.equal(pipeline.negocios[0]!.stageId, 5);
  assert.equal(pipeline.negocios[0]!.closedAt, null);
  assert.deepEqual(pipeline.historial, []);
  assert.equal(pipeline.unidades[0]!.status, "available");
  assert.deepEqual(pipeline.metas, []);
  assert.equal(pipeline.perfiles[0]!.annualSalesCents, 10);
  assert.equal(pipeline.perfiles[0]!.level, "junior");
  assert.deepEqual(pipeline.comisiones, []);
  assert.equal(pipeline.actividades[0]!.status, "pending");
  assert.deepEqual(auditoria.registros, []);
  assert.equal(unidad.revertidas, 1);
  assert.equal(unidad.confirmadas, 0);
});

// --- las garantías que ningún doble puede probar (hallazgo H33) ---------------

/**
 * Lee el código del adaptador en vez de importarlo: `repos/pipeline.ts` abre la
 * conexión al cargarse y usa imports sin extensión que `node --test` no resuelve.
 * Los comentarios se quitan antes de afirmar, porque este mismo archivo los
 * menciona y un docblock no es una garantía.
 *
 * Por qué hace falta: en memoria no hay concurrencia, así que **ninguna** prueba
 * de caso de uso ve un `FOR UPDATE` que falta ni un `targetWhere` borrado. Lo
 * descubrimos al migrar comisiones (R3.6): quitar su bloqueo no hizo caer
 * ninguna de las 300 pruebas de entonces. Es la misma técnica que usan
 * `seguridad.test.ts` para exigir `requireScope` en cada ruta y
 * `arquitectura.test.ts` para la dirección de las capas: cuando una propiedad no
 * se puede observar por comportamiento, se vigila el texto que la produce.
 *
 * Es un sustituto, y conviene decirlo: lo honesto serían dos transacciones
 * concurrentes contra Postgres real, y el milestone decidió no tener esa
 * infraestructura (decisión 3). Entre vigilar el texto y no vigilar nada, se
 * vigila el texto.
 */
function codigoDelAdaptador(nombre: string): string {
  return readFileSync(new URL(`../../infrastructure/db/repos/${nombre}`, import.meta.url), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

test("el adaptador real bloquea la fila del negocio: bloquearNegocio usa .for(\"update\")", () => {
  const codigo = codigoDelAdaptador("pipeline.ts") + codigoDelAdaptador("compromisos.ts");
  const bloqueos = codigo.match(/\.for\(/g) ?? [];
  assert.equal(bloqueos.length, 4, "negocio, unidad, proyecto de alta y compromisos del cierre");
  assert.match(codigo, /async bloquearNegocio[\s\S]*?from\(deals\)[\s\S]*?\.for\("update"\)/);
  assert.match(codigo, /async bloquearUnidad[\s\S]*?from\(units\)[\s\S]*?\.for\("update"\)/);
  assert.match(codigo, /async resolverUnidadDeCierre[\s\S]*?from\(projects\)[\s\S]*?\.for\("update"\)/);
  assert.match(codigo, /from\(inventoryCommitments\)[\s\S]*?orderBy\(inventoryCommitments.id\)\.for\("update"\)/);
});

test("el upsert de la meta de compañía conserva el targetWhere de su índice parcial", () => {
  const codigo = codigoDelAdaptador("pipeline.ts");
  // `goals` tiene DOS índices únicos y el de la compañía es parcial
  // (`WHERE broker_id IS NULL`). Sin el `targetWhere`, Drizzle no sabe contra
  // cuál resolver el conflicto y Postgres responde "no unique or exclusion
  // constraint" en vez de aplicar el upsert: el cierre fallaría con un 500.
  assert.match(codigo, /targetWhere:\s*sql`\$\{goals\.brokerId\}\s*is null`/);
  const upserts = codigo.match(/\.onConflictDoUpdate\(/g) ?? [];
  assert.equal(upserts.length, 2, "las dos ramas del upsert de metas: broker y compañía");
});

test("el recálculo anual conserva la zona horaria de Santo Domingo", () => {
  // Arreglo del issue #24: con la hora del servidor (UTC en el VPS), un cierre
  // nocturno contaría en el año siguiente y el nivel del broker saldría mal.
  assert.match(codigoDelAdaptador("pipeline.ts"), /at time zone 'America\/Santo_Domingo'/);
});

test("b2: fallo del outbox revierte venta, unidad, negocio y los ocho efectos", async () => {
  const { deps, pipeline, auditoria, outbox } = montar({ actividades: [actividad({ id: 1 })] });
  const anterior = structuredClone({ negocios: pipeline.negocios, unidades: pipeline.unidades, perfiles: pipeline.perfiles, actividades: pipeline.actividades });
  outbox.emitir = async () => { throw new Error("QA outbox"); };
  await assert.rejects(cambiarEtapaDeNegocio(deps, broker, "own", 1, { stageId: 6 }), /QA outbox/);
  assert.deepEqual({ negocios: pipeline.negocios, unidades: pipeline.unidades, perfiles: pipeline.perfiles, actividades: pipeline.actividades }, anterior);
  assert.deepEqual(pipeline.ventas, []); assert.deepEqual(pipeline.comisiones, []); assert.deepEqual(pipeline.metas, []);
  assert.deepEqual(pipeline.historial, []); assert.deepEqual(auditoria.registros, []); assert.deepEqual(outbox.eventos, []);
});
test("b2: cierre repetido no duplica venta, comision, metas ni outbox", async () => {
  const { deps, pipeline, outbox } = montar();
  await cambiarEtapaDeNegocio(deps, broker, "own", 1, { stageId: 6 });
  await cambiarEtapaDeNegocio(deps, broker, "own", 1, { stageId: 6 });
  assert.equal(pipeline.ventas.length, 1); assert.equal(pipeline.comisiones.length, 1); assert.equal(pipeline.historial.length, 1);
  assert.ok(pipeline.metas.every(m => m.achievedDeals === 1));
  assert.deepEqual(outbox.eventos, [{ tipo: "NegocioCambioEtapa", aggregateId: 1, payload: { id: 1, stageId: 6 } }]);
});
test("b2: otro negocio no cierra la misma unidad vendida y no deja efectos", async () => {
  const { deps, pipeline, outbox } = montar({ negocios: [negocio({ id: 1 }), negocio({ id: 2 })], propiedades: [principal({ id: 1 }), principal({ id: 2, dealId: 2 })] });
  await cambiarEtapaDeNegocio(deps, broker, "own", 1, { stageId: 6 });
  await assert.rejects(cambiarEtapaDeNegocio(deps, broker, "own", 2, { stageId: 6 }), ConflictError);
  assert.equal(pipeline.negocios[1]!.stageId, 5);
  assert.equal(pipeline.ventas.length, 1); assert.equal(pipeline.comisiones.length, 1); assert.equal(outbox.eventos.length, 1);
});

test("S-303-N: cierre crea unidad mínima y fija interés de proyecto sin unidad", async () => {
  const { deps, pipeline } = montar({ unidades: [], propiedades: [principal({ id: 1, unitId: null })] });
  await cambiarEtapaDeNegocio(deps, broker, "own", 1, { stageId: 6, unitCode: " á_101 " });
  assert.equal(pipeline.unidades.length, 1);
  assert.equal(pipeline.unidades[0]!.code, "A-101");
  assert.equal(pipeline.propiedades[0]!.unitId, pipeline.unidades[0]!.id);
  assert.equal(pipeline.ventas[0]!.unitCodeNormalized, "A-101");
});

test("S-303-N: reutiliza coincidencia activa; rechaza archivada y proyecto ajeno", async () => {
  const active = montar({ unidades: [{ ...UNIDAD, code: "a 101" }], propiedades: [principal({ id: 1, unitId: null })] });
  await cambiarEtapaDeNegocio(active.deps, broker, "own", 1, { stageId: 6, unitCode: "A–101" });
  assert.equal(active.pipeline.unidades.length, 1); assert.equal(active.pipeline.propiedades[0]!.unitId, 100);
  const archived = montar({ unidades: [{ ...UNIDAD, code: "a 101", deletedAt: new Date() }], propiedades: [principal({ id: 1, unitId: null })] });
  await assert.rejects(cambiarEtapaDeNegocio(archived.deps, broker, "own", 1, { stageId: 6, unitCode: "A-101" }), /archivada/);
  assert.equal(archived.pipeline.unidades.length, 1); assert.equal(archived.pipeline.ventas.length, 0);
  const foreign = montar({ proyectos: [{ id: 10, brokerId: 99, deletedAt: null }], unidades: [], propiedades: [principal({ id: 1, unitId: null })] });
  await assert.rejects(cambiarEtapaDeNegocio(foreign.deps, { ...broker, permissions: [{ resource: "projects", action: "view", scope: "own" }] }, "own", 1, { stageId: 6, unitCode: "A-101" }), NotFoundError);
  assert.equal(foreign.pipeline.unidades.length, 0);
});

test("S-303-N: fallo outbox revierte también alta mínima y asignación de unidad", async () => {
  const { deps, pipeline, outbox } = montar({ unidades: [], propiedades: [principal({ id: 1, unitId: null })] });
  outbox.emitir = async () => { throw new Error("QA alta outbox"); };
  await assert.rejects(cambiarEtapaDeNegocio(deps, broker, "own", 1, { stageId: 6, unitCode: "A-101" }), /QA alta/);
  assert.equal(pipeline.unidades.length, 0); assert.equal(pipeline.propiedades[0]!.unitId, null);
  assert.equal(pipeline.negocios[0]!.stageId, 5); assert.equal(pipeline.ventas.length, 0);
});

test("S-303-N: duplicados normalizados activos, código blanco y entradas ambiguas no dejan efectos", async () => {
  const duplicate = montar({ unidades: [{ ...UNIDAD, code: "a 101" }, { ...UNIDAD, id: 101, code: "A-101" }], propiedades: [principal({ id: 1, unitId: null })] });
  await assert.rejects(cambiarEtapaDeNegocio(duplicate.deps, broker, "own", 1, { stageId: 6, unitCode: "A-101" }), ConflictError);
  const existing = montar({ propiedades: [principal({ id: 1, unitId: null }), principal({ id: 2, isPrimary: false })] });
  await assert.rejects(cambiarEtapaDeNegocio(existing.deps, broker, "own", 1, { stageId: 6, unitId: 100 }), /márcala como principal/);
  assert.equal(existing.pipeline.propiedades[0]!.unitId, null); assert.equal(existing.pipeline.ventas.length, 0);
  for (const entrada of [{ stageId: 6, unitCode: "  " }, { stageId: 6, unitCode: "A-101", unitId: 100 }]) {
    const m = montar({ propiedades: [principal({ id: 1, unitId: null })] });
    await assert.rejects(cambiarEtapaDeNegocio(m.deps, broker, "own", 1, entrada));
    assert.equal(m.pipeline.propiedades[0]!.unitId, null); assert.equal(m.pipeline.ventas.length, 0);
  }
});

test("M40 b1i: la venta delega inventario y usa la hora que devuelve CompromisosPort", async () => {
  const m = montar();
  const effectiveAt = new Date("2026-12-31T23:30:00Z");
  const llamadas: unknown[] = [];
  m.compromisos.cerrarVenta = async params => { llamadas.push(params); return effectiveAt; };
  // Si cierre.ts vuelve a escribir directamente, esta prueba debe fallar.
  m.pipeline.bloquearUnidad = async () => { throw new Error("Bloqueo fuera del puerto"); };
  m.pipeline.registrarVenta = async () => { throw new Error("Venta fuera del puerto"); };
  m.pipeline.marcarUnidad = async () => { throw new Error("Estado fuera del puerto"); };
  const cerrado = await cambiarEtapaDeNegocio(m.deps, broker, "own", 1, { stageId: 6 });
  assert.deepEqual(llamadas, [{ unitId: 100, projectId: 10, dealId: 1, actorId: 5 }]);
  assert.deepEqual(cerrado.closedAt, effectiveAt);
  assert.equal(m.pipeline.comisiones[0]!.closedDate, "2026-12-31");
  assert.ok(m.pipeline.metas.every(meta => meta.year === 2026 && meta.month === 12));
});

test("M40 b1i: conflicto del puerto no deja cierre ni proyecciones", async () => {
  const m = montar();
  m.compromisos.cerrarVenta = async () => { throw new ConflictError("Compromiso ajeno"); };
  await assert.rejects(cambiarEtapaDeNegocio(m.deps, broker, "own", 1, { stageId: 6 }), /Compromiso ajeno/);
  assert.equal(m.pipeline.negocios[0]!.stageId, 5);
  assert.equal(m.pipeline.unidades[0]!.status, "available");
  assert.equal(m.pipeline.historial.length, 0);
  assert.equal(m.pipeline.metas.length, 0);
  assert.equal(m.pipeline.comisiones.length, 0);
  assert.equal(m.pipeline.ventas.length, 0);
  assert.equal(m.auditoria.registros.length, 0);
  assert.equal(m.outbox.eventos.length, 0);
});

test("M40 b1i3e: el alquiler delega inventario y usa la hora que devuelve CompromisosPort", async () => {
  const m = montar({ negocios: [negocio({ id: 1, operationType: "rent" })] });
  const effectiveAt = new Date("2026-12-31T23:30:00Z");
  const llamadas: unknown[] = [];
  m.compromisos.cerrarAlquiler = async params => { llamadas.push(params); return effectiveAt; };
  // Si cierre.ts vuelve a escribir directamente, esta prueba debe fallar.
  m.pipeline.bloquearUnidad = async () => { throw new Error("Bloqueo fuera del puerto"); };
  m.pipeline.registrarVenta = async () => { throw new Error("Venta fuera del puerto"); };
  m.pipeline.marcarUnidad = async () => { throw new Error("Estado fuera del puerto"); };
  const cerrado = await cambiarEtapaDeNegocio(m.deps, broker, "own", 1, { stageId: 6 });
  assert.deepEqual(llamadas, [{ unitId: 100, projectId: 10, dealId: 1, actorId: 5 }]);
  assert.deepEqual(cerrado.closedAt, effectiveAt);
  assert.equal(m.pipeline.comisiones[0]!.closedDate, "2026-12-31");
  assert.ok(m.pipeline.metas.every(meta => meta.year === 2026 && meta.month === 12));
  assert.equal(m.pipeline.ventas.length, 0, "el alquiler nunca registra en unit_sales");
});

test("M40 b1i3e: conflicto del puerto en alquiler no deja cierre ni proyecciones", async () => {
  const m = montar({ negocios: [negocio({ id: 1, operationType: "rent" })] });
  m.compromisos.cerrarAlquiler = async () => { throw new ConflictError("Compromiso ajeno en alquiler"); };
  await assert.rejects(cambiarEtapaDeNegocio(m.deps, broker, "own", 1, { stageId: 6 }), /Compromiso ajeno en alquiler/);
  assert.equal(m.pipeline.negocios[0]!.stageId, 5);
  assert.equal(m.pipeline.unidades[0]!.status, "available");
  assert.equal(m.pipeline.historial.length, 0);
  assert.equal(m.pipeline.metas.length, 0);
  assert.equal(m.pipeline.comisiones.length, 0);
  assert.equal(m.pipeline.ventas.length, 0);
  assert.equal(m.auditoria.registros.length, 0);
  assert.equal(m.outbox.eventos.length, 0);
});

