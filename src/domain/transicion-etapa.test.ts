/**
 * Pruebas de M3a. Sin base de datos, sin framework: `npm test` las corre con
 * el runner de Node. Una prueba por transición de `MAPEO_FRONTEND_CRM.md`
 * §10.1 (caso que cumple y caso que no cumple), más los casos de frontera que
 * pide `docs/F1_ANALISIS_Y_PLAN.md` §7 paso 5.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { ConflictError } from "./errors.ts";
import {
  validarTransicion,
  type ContextoTransicion,
  type EtapaDestino,
  type Negocio,
} from "./transicion-etapa.ts";

/** Negocio abierto con todos los campos de §10.1 completos, para partir de un caso válido. */
function negocioBase(overrides: Partial<Negocio> = {}): Negocio {
  return {
    etapaActualKind: "open",
    amountCents: 15_000_000,
    probability: 60,
    commissionBasisPoints: 450,
    expectedCloseDate: "2026-10-01",
    lossReasonId: null,
    ...overrides,
  };
}

function contextoBase(overrides: Partial<ContextoTransicion> = {}): ContextoTransicion {
  return {
    tieneActividadDeContacto: true,
    proximaAccion: { responsableId: 7, fecha: "2026-09-10" },
    cantidadPropiedades: 2,
    tieneUnidadPrincipal: true,
    ...overrides,
  };
}

const etapaNuevo: EtapaDestino = { kind: "open", position: 1 };
const etapaContactado: EtapaDestino = { kind: "open", position: 2 };
const etapaPresentacion: EtapaDestino = { kind: "open", position: 3 };
const etapaPreseleccion: EtapaDestino = { kind: "open", position: 4 };
const etapaNegociacion: EtapaDestino = { kind: "open", position: 5 };
const etapaCierre: EtapaDestino = { kind: "won", position: 6 };
const etapaPerdido: EtapaDestino = { kind: "lost", position: 7 };

test("una transición sin requisito propio en §10.1 (la primera del embudo) no lanza nada", () => {
  assert.doesNotThrow(() =>
    validarTransicion(negocioBase(), etapaNuevo, contextoBase()),
  );
});

test("→ Contactado: pasa con actividad de contacto registrada", () => {
  assert.doesNotThrow(() =>
    validarTransicion(
      negocioBase(),
      etapaContactado,
      contextoBase({ tieneActividadDeContacto: true }),
    ),
  );
});

test("→ Contactado: lanza sin ninguna actividad de contacto", () => {
  assert.throws(
    () =>
      validarTransicion(
        negocioBase(),
        etapaContactado,
        contextoBase({ tieneActividadDeContacto: false }),
      ),
    ConflictError,
  );
});

test("→ Presentación: pasa con próxima acción con responsable y fecha", () => {
  assert.doesNotThrow(() =>
    validarTransicion(
      negocioBase(),
      etapaPresentacion,
      contextoBase({ proximaAccion: { responsableId: 3, fecha: "2026-09-12" } }),
    ),
  );
});

test("→ Presentación: lanza sin próxima acción", () => {
  assert.throws(
    () =>
      validarTransicion(
        negocioBase(),
        etapaPresentacion,
        contextoBase({ proximaAccion: null }),
      ),
    ConflictError,
  );
});

test("→ Preselección: pasa con al menos una fila en deal_properties", () => {
  assert.doesNotThrow(() =>
    validarTransicion(
      negocioBase(),
      etapaPreseleccion,
      contextoBase({ cantidadPropiedades: 1 }),
    ),
  );
});

test("→ Preselección: lanza sin ninguna propiedad de interés", () => {
  assert.throws(
    () =>
      validarTransicion(
        negocioBase(),
        etapaPreseleccion,
        contextoBase({ cantidadPropiedades: 0 }),
      ),
    ConflictError,
  );
});

test("→ Negociación: pasa con monto, probabilidad, comisión y fecha estimada", () => {
  assert.doesNotThrow(() =>
    validarTransicion(negocioBase(), etapaNegociacion, contextoBase()),
  );
});

test("→ Negociación: lanza si falta el monto", () => {
  assert.throws(
    () =>
      validarTransicion(
        negocioBase({ amountCents: null }),
        etapaNegociacion,
        contextoBase(),
      ),
    ConflictError,
  );
});

test("→ Negociación: lanza si falta la probabilidad, aunque el resto esté completo", () => {
  assert.throws(
    () =>
      validarTransicion(
        negocioBase({ probability: null }),
        etapaNegociacion,
        contextoBase(),
      ),
    ConflictError,
  );
});

test("→ Negociación: lanza si falta el porcentaje de comisión", () => {
  assert.throws(
    () =>
      validarTransicion(
        negocioBase({ commissionBasisPoints: null }),
        etapaNegociacion,
        contextoBase(),
      ),
    ConflictError,
  );
});

test("→ Negociación: lanza si falta la fecha estimada de cierre", () => {
  assert.throws(
    () =>
      validarTransicion(
        negocioBase({ expectedCloseDate: null }),
        etapaNegociacion,
        contextoBase(),
      ),
    ConflictError,
  );
});

test("→ Cierre (won): pasa con monto final y unidad principal definida", () => {
  assert.doesNotThrow(() =>
    validarTransicion(negocioBase(), etapaCierre, contextoBase()),
  );
});

test("→ Cierre (won): lanza sin monto final, aunque haya unidad principal", () => {
  assert.throws(
    () =>
      validarTransicion(
        negocioBase({ amountCents: null }),
        etapaCierre,
        contextoBase({ tieneUnidadPrincipal: true }),
      ),
    ConflictError,
  );
});

test("→ Cierre (won): lanza sin unidad principal aunque haya monto — son requisitos independientes", () => {
  assert.throws(
    () =>
      validarTransicion(
        negocioBase({ amountCents: 20_000_000 }),
        etapaCierre,
        contextoBase({ tieneUnidadPrincipal: false }),
      ),
    ConflictError,
  );
});

test("→ Perdido (lost): pasa con motivo del catálogo loss_reasons", () => {
  assert.doesNotThrow(() =>
    validarTransicion(
      negocioBase({ lossReasonId: 4 }),
      etapaPerdido,
      contextoBase(),
    ),
  );
});

test("→ Perdido (lost): lanza sin motivo", () => {
  assert.throws(
    () =>
      validarTransicion(
        negocioBase({ lossReasonId: null }),
        etapaPerdido,
        contextoBase(),
      ),
    ConflictError,
  );
});

test("un negocio ya ganado no puede volver a transicionar", () => {
  assert.throws(
    () =>
      validarTransicion(
        negocioBase({ etapaActualKind: "won" }),
        etapaNegociacion,
        contextoBase(),
      ),
    ConflictError,
  );
});

test("un negocio ya perdido no puede volver a transicionar", () => {
  assert.throws(
    () =>
      validarTransicion(
        negocioBase({ etapaActualKind: "lost" }),
        etapaContactado,
        contextoBase(),
      ),
    ConflictError,
  );
});
