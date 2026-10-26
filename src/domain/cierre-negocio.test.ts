/**
 * Pruebas de los cálculos puros del cierre transaccional (M3b). Mismo estilo
 * que `transicion-etapa.test.ts`: sin base de datos, `node --test`.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { calcularComision, evaluarNivelBroker } from "./cierre-negocio.ts";

test("calcularComision: reparto 50/50 sobre un monto y comisión sin decimales exactos", () => {
  const resultado = calcularComision({
    saleAmountCents: 15_000_000_00, // US$15,000,000.00
    commissionBasisPoints: 450, // 4,5 %
  });

  // 15,000,000.00 * 4.5% = 675,000.00
  assert.equal(resultado.totalCommissionCents, 675_000_00);
  assert.equal(resultado.brokerAmountCents, 337_500_00);
  assert.equal(resultado.agencyAmountCents, 337_500_00);
  assert.equal(resultado.brokerAmountCents + resultado.agencyAmountCents, resultado.totalCommissionCents);
});

test("calcularComision: la suma broker + agencia siempre cuadra con el total, incluso cuando el reparto no divide exacto", () => {
  // Un monto que produce una comisión total impar en centavos, para forzar el
  // caso donde redondear los dos lados por separado dejaría un centavo suelto.
  const resultado = calcularComision({
    saleAmountCents: 333_333,
    commissionBasisPoints: 333,
    brokerShareBasisPoints: 6000,
    agencyShareBasisPoints: 4000,
  });

  assert.equal(resultado.brokerAmountCents + resultado.agencyAmountCents, resultado.totalCommissionCents);
});

test("calcularComision: sin reparto explícito usa el 50/50 por defecto del esquema", () => {
  const resultado = calcularComision({ saleAmountCents: 100_000_00, commissionBasisPoints: 1000 });
  // 100,000.00 * 10% = 10,000.00, repartido 50/50 = 5,000.00 cada uno.
  assert.equal(resultado.totalCommissionCents, 10_000_00);
  assert.equal(resultado.brokerAmountCents, 5_000_00);
  assert.equal(resultado.agencyAmountCents, 5_000_00);
});

test("evaluarNivelBroker: por debajo del primer corte es junior", () => {
  assert.equal(evaluarNivelBroker(0), "junior");
  assert.equal(evaluarNivelBroker(499_999_99), "junior");
});

test("evaluarNivelBroker: exactamente en el corte confirmado por el prototipo sube a senior", () => {
  assert.equal(evaluarNivelBroker(500_000_00), "senior");
});

test("evaluarNivelBroker: sube de nivel en cada corte sucesivo", () => {
  assert.equal(evaluarNivelBroker(900_000_00), "senior_plus");
  assert.equal(evaluarNivelBroker(1_200_000_00), "top_producer");
  assert.equal(evaluarNivelBroker(2_000_000_00), "top_leader");
});

test("evaluarNivelBroker: un valor muy por encima del último corte se queda en el nivel máximo", () => {
  assert.equal(evaluarNivelBroker(50_000_000_00), "top_leader");
});
