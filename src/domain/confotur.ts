/**
 * Motor de Incentivos Fiscales Confotur (Ley 158-01 de República Dominicana)
 * y Amortización Inmobiliaria.
 *
 * Dominio puro: sin dependencias externas, sin base de datos, sin Next.js.
 *
 * Beneficios contemplados por Ley 158-01 y sus modificaciones (Ley 195-13):
 *  1. Exención del Impuesto de Transferencia Inmobiliaria (3% del valor de compra, Ley 173-07).
 *  2. Exención del Impuesto al Patrimonio Inmobiliario (IPI, 1% anual durante 15 años).
 *  3. Exención de impuestos sobre constitución de sociedades y aumentos de capital.
 */

export type ParametrosConfotur = {
  /** Precio total de venta en centavos (ej. 15000000 = US$150,000.00). */
  precioVentaCents: number;
  /** Moneda de la operación (default "USD"). */
  moneda?: string;
  /** Monto de bloqueo/reserva en centavos (default US$2,000.00 = 200000 centavos). */
  reservaCents?: number;
  /** Porcentaje de separación/inicial (default 20%). */
  porcentajeInicial?: number;
  /** Porcentaje a pagar durante construcción (default 30%). */
  porcentajeConstruccion?: number;
  /** Porcentaje contra entrega (default 50%). */
  porcentajeContraEntrega?: number;
  /** Meses de construcción disponibles para amortizar el inicial en cuotas (default 24). */
  mesesConstruccion?: number;
  /** Años de exención del IPI (default 15 años por ley). */
  anosExencionIpi?: number;
  /** Tasa estimada de ocupación anual para retorno estimado (ej. 0.09 = 9% anual). */
  roiAnualEstimado?: number;
};

export type CuotaMensualConstruccion = {
  numeroCuota: number;
  montoCents: number;
};

export type PlanDePagoConfotur = {
  reservaCents: number;
  separacionCents: number;
  duranteConstruccionCents: number;
  cuotaMensualConstruccionCents: number;
  mesesConstruccion: number;
  cuotasDesglose: CuotaMensualConstruccion[];
  contraEntregaCents: number;
};

export type AhorroFiscalConfotur = {
  /** Ahorro en impuesto de transferencia (3% fijo del precio). */
  ahorroTransferencia3PorcientoCents: number;
  /** Ahorro en IPI anual (1% del precio por cada año de exención). */
  ahorroIpiAnualCents: number;
  /** Ahorro total acumulado de IPI en el periodo de exención (15 años). */
  ahorroIpiTotalPeriodoCents: number;
  /** Ahorro fiscal total (Transferencia + IPI a 15 años). */
  ahorroFiscalTotalCents: number;
  anosExencionIpi: number;
};

export type CotizacionConfoturResultado = {
  precioVentaCents: number;
  moneda: string;
  planDePago: PlanDePagoConfotur;
  ahorroFiscal: AhorroFiscalConfotur;
  /** Precio neto equivalente considerando el ahorro fiscal directo. */
  precioEfectivoConAhorroCents: number;
  /** Retorno anual proyectado en alquiler vacacional si aplica. */
  ingresoBrutoAnualEstimadoCents: number;
};

export function calcularCotizacionConfotur(params: ParametrosConfotur): CotizacionConfoturResultado {
  const precio = Math.max(0, Math.round(params.precioVentaCents));
  const moneda = params.moneda || "USD";
  const reserva = Math.min(precio, Math.max(0, Math.round(params.reservaCents ?? 200000)));

  const pInicial = params.porcentajeInicial ?? 20;
  const pConstruccion = params.porcentajeConstruccion ?? 30;
  const pContraEntrega = params.porcentajeContraEntrega ?? 50;

  // Validación de suma de porcentajes (tolerancia de redondeo)
  const sumaPorcentajes = pInicial + pConstruccion + pContraEntrega;
  if (Math.abs(sumaPorcentajes - 100) > 0.01) {
    throw new Error(`La suma de porcentajes debe ser 100% (actual: ${sumaPorcentajes}%).`);
  }

  const meses = Math.max(1, Math.round(params.mesesConstruccion ?? 24));
  const anosIpi = Math.max(1, Math.round(params.anosExencionIpi ?? 15));

  // 1. Cálculos de Pagos
  const montoInicialTotal = Math.round((precio * pInicial) / 100);
  // La separación es el inicial menos la reserva ya entregada
  const separacionCents = Math.max(0, montoInicialTotal - reserva);

  const duranteConstruccionCents = Math.round((precio * pConstruccion) / 100);
  const cuotaMensualConstruccionCents = Math.round(duranteConstruccionCents / meses);

  const contraEntregaCents = Math.max(0, precio - reserva - separacionCents - duranteConstruccionCents);

  const cuotasDesglose: CuotaMensualConstruccion[] = [];
  let acumuladoCuotas = 0;
  for (let i = 1; i <= meses; i++) {
    // La última cuota absorbe los centavos sobrantes del redondeo
    const cuota = i === meses ? duranteConstruccionCents - acumuladoCuotas : cuotaMensualConstruccionCents;
    acumuladoCuotas += cuota;
    cuotasDesglose.push({ numeroCuota: i, montoCents: cuota });
  }

  // 2. Cálculos Fiscales Ley 158-01 (Confotur)
  // 3% de transferencia inmobiliaria
  const ahorroTransferencia3PorcientoCents = Math.round(precio * 0.03);
  // 1% anual de IPI
  const ahorroIpiAnualCents = Math.round(precio * 0.01);
  const ahorroIpiTotalPeriodoCents = ahorroIpiAnualCents * anosIpi;
  const ahorroFiscalTotalCents = ahorroTransferencia3PorcientoCents + ahorroIpiTotalPeriodoCents;

  const precioEfectivoConAhorroCents = Math.max(0, precio - ahorroFiscalTotalCents);

  const roiRate = params.roiAnualEstimado ?? 0.09; // 9% anual estimado
  const ingresoBrutoAnualEstimadoCents = Math.round(precio * roiRate);

  return {
    precioVentaCents: precio,
    moneda,
    planDePago: {
      reservaCents: reserva,
      separacionCents,
      duranteConstruccionCents,
      cuotaMensualConstruccionCents,
      mesesConstruccion: meses,
      cuotasDesglose,
      contraEntregaCents,
    },
    ahorroFiscal: {
      ahorroTransferencia3PorcientoCents,
      ahorroIpiAnualCents,
      ahorroIpiTotalPeriodoCents,
      ahorroFiscalTotalCents,
      anosExencionIpi: anosIpi,
    },
    precioEfectivoConAhorroCents,
    ingresoBrutoAnualEstimadoCents,
  };
}
