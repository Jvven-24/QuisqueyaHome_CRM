import assert from "node:assert/strict";
import { test } from "node:test";
import { calcularCotizacionConfotur } from "./confotur.ts";

test("Confotur: cálculo estándar de US$150,000 con 24 meses de construcción", () => {
  const resultado = calcularCotizacionConfotur({
    precioVentaCents: 15000000, // US$150,000.00
    reservaCents: 200000, // US$2,000.00
    porcentajeInicial: 20, // 20% = US$30,000
    porcentajeConstruccion: 30, // 30% = US$45,000
    porcentajeContraEntrega: 50, // 50% = US$75,000
    mesesConstruccion: 24,
    anosExencionIpi: 15,
  });

  // Ahorro fiscal
  // 3% transferencia = US$4,500
  assert.equal(resultado.ahorroFiscal.ahorroTransferencia3PorcientoCents, 450000);
  // 1% IPI anual = US$1,500 * 15 = US$22,500
  assert.equal(resultado.ahorroFiscal.ahorroIpiAnualCents, 150000);
  assert.equal(resultado.ahorroFiscal.ahorroIpiTotalPeriodoCents, 2250000);
  // Total ahorro fiscal = US$27,000
  assert.equal(resultado.ahorroFiscal.ahorroFiscalTotalCents, 2700000);
  // Precio efectivo con ahorro = US$123,000
  assert.equal(resultado.precioEfectivoConAhorroCents, 12300000);

  // Plan de pagos
  // Reserva = US$2,000
  assert.equal(resultado.planDePago.reservaCents, 200000);
  // Separación = Inicial (US$30,000) - Reserva (US$2,000) = US$28,000
  assert.equal(resultado.planDePago.separacionCents, 2800000);
  // Durante construcción = US$45,000
  assert.equal(resultado.planDePago.duranteConstruccionCents, 4500000);
  // Contra entrega = US$75,000
  assert.equal(resultado.planDePago.contraEntregaCents, 7500000);

  // Cuadre exacto al centavo del precio total
  const sumaPagos =
    resultado.planDePago.reservaCents +
    resultado.planDePago.separacionCents +
    resultado.planDePago.duranteConstruccionCents +
    resultado.planDePago.contraEntregaCents;
  assert.equal(sumaPagos, 15000000);

  // Cuadre exacto de las cuotas mensuales durante construcción
  const sumaCuotas = resultado.planDePago.cuotasDesglose.reduce((acc, c) => acc + c.montoCents, 0);
  assert.equal(sumaCuotas, resultado.planDePago.duranteConstruccionCents);
  assert.equal(resultado.planDePago.cuotasDesglose.length, 24);
});

test("Confotur: propiedad de lujo de US$500,000", () => {
  const resultado = calcularCotizacionConfotur({
    precioVentaCents: 50000000, // US$500,000.00
    reservaCents: 500000, // US$5,000.00
    porcentajeInicial: 10, // 10%
    porcentajeConstruccion: 40, // 40%
    porcentajeContraEntrega: 50, // 50%
    mesesConstruccion: 36,
  });

  // 3% transferencia = US$15,000 = 1,500,000 centavos
  assert.equal(resultado.ahorroFiscal.ahorroTransferencia3PorcientoCents, 1500000);
  // IPI a 15 años = US$5,000 * 15 = US$75,000 = 7,500,000 centavos
  assert.equal(resultado.ahorroFiscal.ahorroIpiTotalPeriodoCents, 7500000);
  // Ahorro total = US$90,000
  assert.equal(resultado.ahorroFiscal.ahorroFiscalTotalCents, 9000000);
});

test("Confotur: rechaza si la suma de porcentajes no da 100%", () => {
  assert.throws(
    () =>
      calcularCotizacionConfotur({
        precioVentaCents: 10000000,
        porcentajeInicial: 20,
        porcentajeConstruccion: 30,
        porcentajeContraEntrega: 40, // Suma 90%, no 100%
      }),
    /La suma de porcentajes debe ser 100%/,
  );
});
