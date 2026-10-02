/**
 * Pruebas de los casos de uso de Pipeline (cambio simple de etapa, pérdida,
 * edición del negocio y propiedades de interés) con dobles en memoria. El doble
 * imita a `visibleRows` en proyectos y el caso de uso aplica `reaches` a los
 * negocios, así que las pruebas de alcance ejercitan la regla de verdad.
 *
 * El cierre de ocho pasos tiene su archivo: `cierre.test.ts`.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { ConflictError, NotFoundError } from "../../domain/errors.ts";
import type { Actor } from "../../domain/rbac.ts";
import { auditoriaEnMemoria } from "../testing/auditoria-en-memoria.ts";
import { unidadDeTrabajoEnMemoria } from "../testing/unidad-de-trabajo-en-memoria.ts";
import {
  asociarPropiedad,
  cambiarEtapaDeNegocio,
  editarNegocio,
  marcarPropiedadPrincipal,
  quitarPropiedad,
} from "./casos-de-uso.ts";
import { pipelineEnMemoria, type SemillaPipeline } from "./en-memoria.ts";
import type { EtapaPipeline, Negocio, PropiedadDeNegocio } from "./puertos.ts";

const broker: Actor = { userId: 5, roleSlug: "broker", permissions: [] };
const otroBroker: Actor = { userId: 7, roleSlug: "broker", permissions: [] };

const MENSAJE_SIN_MOTIVO =
  "Para marcar el negocio como perdido hace falta un motivo del catálogo de motivos de pérdida.";
const MENSAJE_SIN_CONTACTO =
  "Para mover el negocio a esta etapa hace falta registrar al menos una actividad de contacto.";
const MENSAJE_CERRADO_EDICION = "Este negocio ya está cerrado; no se puede editar.";

function etapa(id: number, kind: EtapaPipeline["kind"], position: number, parcial: Partial<EtapaPipeline> = {}): EtapaPipeline {
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
    ...parcial,
  };
}

/** Las siete etapas del seed (`db/seed.sql`) más una inactiva (id 8). */
const ETAPAS: EtapaPipeline[] = [
  etapa(1, "open", 1),
  etapa(2, "open", 2),
  etapa(3, "open", 3),
  etapa(4, "open", 4),
  etapa(5, "open", 5),
  etapa(6, "won", 6),
  etapa(7, "lost", 7),
  etapa(8, "open", 8, { isActive: false }),
];

function negocio(parcial: Partial<Negocio> & { id: number }): Negocio {
  return {
    contactId: 1,
    leadId: null,
    title: null,
    stageId: 1,
    sourceId: null,
    brokerId: 5,
    operationType: "sale",
    currency: "USD",
    amountCents: 40_000_000,
    probability: 50,
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

function propiedad(parcial: Partial<PropiedadDeNegocio> & { id: number }): PropiedadDeNegocio {
  return {
    dealId: 1,
    projectId: 10,
    unitId: null,
    isPrimary: false,
    createdAt: new Date("2025-01-01T00:00:00Z"),
    createdBy: 5,
    ...parcial,
  };
}

function montar(semilla: SemillaPipeline = {}) {
  const pipeline = pipelineEnMemoria({ etapas: ETAPAS, negocios: [negocio({ id: 1 })], ...semilla });
  const auditoria = auditoriaEnMemoria();
  const unidad = unidadDeTrabajoEnMemoria({ pipeline, auditoria }, [pipeline, auditoria]);
  return { pipeline, auditoria, unidad, deps: { unidad } };
}

const llamadaDeContacto = {
  id: 1,
  dealId: 1,
  activityType: "call",
  status: "completed" as const,
  assigneeId: 5,
  startsAt: new Date("2025-06-01T00:00:00Z"),
  deletedAt: null,
};

// --- cambio simple de etapa -------------------------------------------------

test("cambio simple: escribe el historial y audita cambiar_etapa con antes y despues", async () => {
  const { deps, pipeline, auditoria } = montar({ actividades: [llamadaDeContacto] });
  const antes = pipeline.negocios[0]!;

  const fila = await cambiarEtapaDeNegocio(deps, broker, "own", 1, { stageId: 2 });

  assert.equal(fila.stageId, 2);
  assert.ok(fila.stageChangedAt instanceof Date);
  assert.equal(fila.updatedBy, 5);
  assert.equal(fila.closedAt, null);
  assert.deepEqual(pipeline.historial, [{ dealId: 1, fromStageId: 1, toStageId: 2, changedBy: 5 }]);
  assert.deepEqual(auditoria.registros, [
    { accion: "cambiar_etapa", entidad: "deal", entidadId: 1, antes, despues: fila, actorId: 5 },
  ]);
  // Un cambio simple no es un cierre: ni metas, ni comisión, ni bloqueo.
  assert.deepEqual(pipeline.metas, []);
  assert.deepEqual(pipeline.comisiones, []);
  assert.deepEqual(pipeline.bloqueos, []);
});

test("cambio a una etapa con requisito sin cumplir: ConflictError de transicion-etapa y nada escrito", async () => {
  // Una tarea completada no cuenta como actividad de contacto.
  const tarea = { ...llamadaDeContacto, activityType: "task" };
  const { deps, pipeline, auditoria } = montar({ actividades: [tarea] });

  await assert.rejects(cambiarEtapaDeNegocio(deps, broker, "own", 1, { stageId: 2 }), (error) => {
    assert.ok(error instanceof ConflictError);
    assert.equal(error.message, MENSAJE_SIN_CONTACTO);
    return true;
  });

  assert.equal(pipeline.negocios[0]!.stageId, 1);
  assert.deepEqual(pipeline.historial, []);
  assert.deepEqual(auditoria.registros, []);
});

test("presentación exige una próxima acción vigente: pendiente, con responsable y fecha", async () => {
  const pendiente = { ...llamadaDeContacto, id: 9, status: "pending" as const };
  const { deps } = montar({
    negocios: [negocio({ id: 1, stageId: 2, nextActivityId: 9 })],
    actividades: [pendiente],
  });
  const fila = await cambiarEtapaDeNegocio(deps, broker, "own", 1, { stageId: 3 });
  assert.equal(fila.stageId, 3);

  // Completada ya no es "próxima acción".
  const completada = { ...pendiente, status: "completed" as const };
  const otra = montar({ negocios: [negocio({ id: 1, stageId: 2, nextActivityId: 9 })], actividades: [completada] });
  await assert.rejects(
    cambiarEtapaDeNegocio(otra.deps, broker, "own", 1, { stageId: 3 }),
    /próxima acción con responsable y fecha/,
  );
});

test("un negocio ya cerrado no cambia de etapa", async () => {
  const { deps, auditoria } = montar({ negocios: [negocio({ id: 1, stageId: 7, lossReasonId: 2 })] });
  await assert.rejects(cambiarEtapaDeNegocio(deps, broker, "own", 1, { stageId: 2 }), (error) => {
    assert.ok(error instanceof ConflictError);
    assert.equal(error.message, "Este negocio ya está cerrado (ganado o perdido) y no puede cambiar de etapa.");
    return true;
  });
  assert.deepEqual(auditoria.registros, []);
});

// --- pérdida ----------------------------------------------------------------

test("pérdida con motivo: audita marcar_perdido y guarda lossReasonId y lossComment", async () => {
  const { deps, pipeline, auditoria } = montar();
  const antes = pipeline.negocios[0]!;

  const fila = await cambiarEtapaDeNegocio(deps, broker, "own", 1, {
    stageId: 7,
    lossReasonId: 3,
    lossComment: "Compró con otra agencia",
  });

  assert.equal(fila.stageId, 7);
  assert.equal(fila.lossReasonId, 3);
  assert.equal(fila.lossComment, "Compró con otra agencia");
  assert.equal(fila.closedAt, null);
  assert.deepEqual(pipeline.historial, [{ dealId: 1, fromStageId: 1, toStageId: 7, changedBy: 5 }]);
  assert.deepEqual(auditoria.registros, [
    { accion: "marcar_perdido", entidad: "deal", entidadId: 1, antes, despues: fila, actorId: 5 },
  ]);
  assert.deepEqual(pipeline.comisiones, []);
});

test("pérdida sin comentario guarda lossComment en null", async () => {
  const { deps } = montar();
  const fila = await cambiarEtapaDeNegocio(deps, broker, "own", 1, { stageId: 7, lossReasonId: 3 });
  assert.equal(fila.lossComment, null);
});

test("pérdida sin motivo: el ConflictError de transicion-etapa y nada escrito", async () => {
  const { deps, pipeline, auditoria } = montar();

  await assert.rejects(cambiarEtapaDeNegocio(deps, broker, "own", 1, { stageId: 7, lossComment: "sin motivo" }), (error) => {
    assert.ok(error instanceof ConflictError);
    assert.equal(error.message, MENSAJE_SIN_MOTIVO);
    return true;
  });

  assert.equal(pipeline.negocios[0]!.stageId, 1);
  assert.equal(pipeline.negocios[0]!.lossComment, null);
  assert.deepEqual(pipeline.historial, []);
  assert.deepEqual(auditoria.registros, []);
});

// --- alcance y existencia ---------------------------------------------------

test("negocio de otro broker con alcance own: NotFoundError, igual que uno inexistente", async () => {
  const { deps, pipeline, auditoria } = montar();

  await assert.rejects(cambiarEtapaDeNegocio(deps, otroBroker, "own", 1, { stageId: 7, lossReasonId: 3 }), NotFoundError);
  await assert.rejects(cambiarEtapaDeNegocio(deps, broker, "own", 99, { stageId: 7, lossReasonId: 3 }), NotFoundError);

  assert.equal(pipeline.negocios[0]!.stageId, 1);
  assert.deepEqual(auditoria.registros, []);
});

test("con alcance all un administrador mueve el negocio de otro broker", async () => {
  const admin: Actor = { userId: 1, roleSlug: "administrador", permissions: [] };
  const { deps } = montar();
  const fila = await cambiarEtapaDeNegocio(deps, admin, "all", 1, { stageId: 7, lossReasonId: 3 });
  assert.equal(fila.stageId, 7);
  assert.equal(fila.updatedBy, 1);
});

test("negocio en la papelera: NotFoundError", async () => {
  const { deps } = montar({ negocios: [negocio({ id: 1, deletedAt: new Date("2025-02-01T00:00:00Z") })] });
  await assert.rejects(cambiarEtapaDeNegocio(deps, broker, "own", 1, { stageId: 7, lossReasonId: 3 }), NotFoundError);
});

test("etapa destino inexistente o inactiva: NotFoundError con su mensaje", async () => {
  const { deps, auditoria } = montar();

  for (const stageId of [99, 8]) {
    await assert.rejects(cambiarEtapaDeNegocio(deps, broker, "own", 1, { stageId }), (error) => {
      assert.ok(error instanceof NotFoundError);
      assert.equal(error.message, "La etapa indicada no existe.");
      return true;
    });
  }
  assert.deepEqual(auditoria.registros, []);
});

test("etapa actual que ya no existe en el embudo: ConflictError", async () => {
  const { deps } = montar({ negocios: [negocio({ id: 1, stageId: 50 })] });
  await assert.rejects(cambiarEtapaDeNegocio(deps, broker, "own", 1, { stageId: 2 }), (error) => {
    assert.ok(error instanceof ConflictError);
    assert.equal(error.message, "La etapa actual del negocio no existe en el embudo.");
    return true;
  });
});

// --- editar negocio ---------------------------------------------------------

test("editar: null borra el campo, ausente lo deja, y audita editar con antes y despues", async () => {
  const { deps, pipeline, auditoria } = montar();
  const antes = pipeline.negocios[0]!;

  const fila = await editarNegocio(deps, broker, "own", 1, { probability: null, amountCents: 1_000 });

  assert.equal(fila.probability, null);
  assert.equal(fila.amountCents, 1_000);
  assert.equal(fila.commissionBasisPoints, 300);
  assert.equal(fila.expectedCloseDate, "2026-12-01");
  assert.equal(fila.stageId, 1);
  assert.equal(fila.updatedBy, 5);
  assert.deepEqual(auditoria.registros, [
    { accion: "editar", entidad: "deal", entidadId: 1, antes, despues: fila, actorId: 5 },
  ]);
});

test("editar un negocio cerrado: ConflictError y nada escrito", async () => {
  const { deps, auditoria } = montar({ negocios: [negocio({ id: 1, stageId: 6 })] });
  await assert.rejects(editarNegocio(deps, broker, "own", 1, { amountCents: 5 }), (error) => {
    assert.ok(error instanceof ConflictError);
    assert.equal(error.message, MENSAJE_CERRADO_EDICION);
    return true;
  });
  assert.deepEqual(auditoria.registros, []);
});

test("editar un negocio ajeno, borrado o inexistente: NotFoundError", async () => {
  const { deps } = montar({ negocios: [negocio({ id: 1 }), negocio({ id: 2, deletedAt: new Date() })] });
  await assert.rejects(editarNegocio(deps, otroBroker, "own", 1, { amountCents: 5 }), NotFoundError);
  await assert.rejects(editarNegocio(deps, broker, "own", 2, { amountCents: 5 }), NotFoundError);
  await assert.rejects(editarNegocio(deps, broker, "own", 3, { amountCents: 5 }), NotFoundError);
});

// --- propiedades ------------------------------------------------------------

const PROYECTOS = [
  { id: 10, brokerId: 5, deletedAt: null },
  { id: 11, brokerId: 9, deletedAt: null },
];
const UNIDADES = [
  { id: 100, projectId: 10, status: "available", deletedAt: null },
  { id: 110, projectId: 11, status: "available", deletedAt: null },
];

test("asociar: crea la propiedad, desmarca la principal anterior y audita crear deal_property", async () => {
  const previa = propiedad({ id: 1, unitId: 100, isPrimary: true });
  const { deps, pipeline, auditoria } = montar({ proyectos: PROYECTOS, unidades: UNIDADES, propiedades: [previa] });

  const fila = await asociarPropiedad(deps, broker, "own", "own", 1, { projectId: 10, isPrimary: true });

  assert.equal(fila.dealId, 1);
  assert.equal(fila.unitId, null);
  assert.equal(fila.isPrimary, true);
  assert.equal(fila.createdBy, 5);
  assert.equal(pipeline.propiedades.find((p) => p.id === 1)!.isPrimary, false);
  assert.deepEqual(auditoria.registros, [
    { accion: "crear", entidad: "deal_property", entidadId: fila.id, despues: fila, actorId: 5 },
  ]);
});

test("asociar sin isPrimary no toca la principal existente", async () => {
  const previa = propiedad({ id: 1, unitId: 100, isPrimary: true });
  const { deps, pipeline } = montar({ proyectos: PROYECTOS, unidades: UNIDADES, propiedades: [previa] });
  const fila = await asociarPropiedad(deps, broker, "own", "own", 1, { projectId: 10 });
  assert.equal(fila.isPrimary, false);
  assert.equal(pipeline.propiedades.find((p) => p.id === 1)!.isPrimary, true);
});

test("asociar un proyecto fuera del alcance sobre projects: NotFoundError con su mensaje", async () => {
  const { deps, pipeline, auditoria } = montar({ proyectos: PROYECTOS, unidades: UNIDADES });

  await assert.rejects(asociarPropiedad(deps, broker, "own", "own", 1, { projectId: 11 }), (error) => {
    assert.ok(error instanceof NotFoundError);
    assert.equal(error.message, "El proyecto indicado no existe.");
    return true;
  });
  // Con alcance all sobre proyectos sí se puede.
  await asociarPropiedad(deps, broker, "own", "all", 1, { projectId: 11 });

  assert.equal(pipeline.propiedades.length, 1);
  assert.equal(auditoria.registros.length, 1);
});

test("asociar una unidad de otro proyecto: NotFoundError con su mensaje y nada escrito", async () => {
  const { deps, pipeline, auditoria } = montar({ proyectos: PROYECTOS, unidades: UNIDADES });

  await assert.rejects(asociarPropiedad(deps, broker, "own", "all", 1, { projectId: 10, unitId: 110 }), (error) => {
    assert.ok(error instanceof NotFoundError);
    assert.equal(error.message, "La unidad indicada no existe en ese proyecto.");
    return true;
  });
  assert.deepEqual(pipeline.propiedades, []);
  assert.deepEqual(auditoria.registros, []);
});

test("asociar a un negocio cerrado: ConflictError", async () => {
  const { deps } = montar({ negocios: [negocio({ id: 1, stageId: 6 })], proyectos: PROYECTOS });
  await assert.rejects(asociarPropiedad(deps, broker, "own", "own", 1, { projectId: 10 }), (error) => {
    assert.ok(error instanceof ConflictError);
    assert.equal(error.message, MENSAJE_CERRADO_EDICION);
    return true;
  });
});

test("marcar principal: desmarca las demás y audita editar con antes y despues", async () => {
  const a = propiedad({ id: 1, unitId: 100, isPrimary: true });
  const b = propiedad({ id: 2, projectId: 10, unitId: null });
  const { deps, pipeline, auditoria } = montar({ propiedades: [a, b] });

  const fila = await marcarPropiedadPrincipal(deps, broker, "own", 1, 2);

  assert.equal(fila.isPrimary, true);
  assert.deepEqual(pipeline.propiedades.map((p) => [p.id, p.isPrimary]), [[1, false], [2, true]]);
  assert.deepEqual(auditoria.registros, [
    { accion: "editar", entidad: "deal_property", entidadId: 2, antes: b, despues: fila, actorId: 5 },
  ]);
});

test("marcar o quitar una propiedad de otro negocio: NotFoundError", async () => {
  const ajena = propiedad({ id: 5, dealId: 2 });
  const { deps, pipeline } = montar({ negocios: [negocio({ id: 1 }), negocio({ id: 2 })], propiedades: [ajena] });

  await assert.rejects(marcarPropiedadPrincipal(deps, broker, "own", 1, 5), NotFoundError);
  await assert.rejects(quitarPropiedad(deps, broker, "own", 1, 5), NotFoundError);
  assert.equal(pipeline.propiedades.length, 1);
});

test("quitar: borra la propiedad y audita eliminar solo con antes", async () => {
  const a = propiedad({ id: 1, unitId: 100 });
  const { deps, pipeline, auditoria } = montar({ propiedades: [a] });

  await quitarPropiedad(deps, broker, "own", 1, 1);

  assert.deepEqual(pipeline.propiedades, []);
  assert.deepEqual(auditoria.registros, [
    { accion: "eliminar", entidad: "deal_property", entidadId: 1, antes: a, actorId: 5 },
  ]);
});

test("quitar en un negocio cerrado: ConflictError y la propiedad sigue", async () => {
  const { deps, pipeline } = montar({ negocios: [negocio({ id: 1, stageId: 7 })], propiedades: [propiedad({ id: 1 })] });
  await assert.rejects(quitarPropiedad(deps, broker, "own", 1, 1), ConflictError);
  assert.equal(pipeline.propiedades.length, 1);
});
