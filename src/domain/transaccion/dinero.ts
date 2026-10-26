import { ValidationError } from "../errors.ts";

export const CURRENCIES = ["USD", "DOP"] as const;
export type Currency = (typeof CURRENCIES)[number];
export const MIN_CENTS = -9223372036854775808n;
export const MAX_CENTS = 9223372036854775807n;
export type Money = Readonly<{ cents: bigint; currency: Currency }>;
export const ROUNDING_MODES = ["towards_zero", "floor", "ceil", "half_even"] as const;
export type RoundingMode = (typeof ROUNDING_MODES)[number];

export function createMoney(cents: bigint, currency: Currency): Money {
  if (typeof cents !== "bigint" || cents < MIN_CENTS || cents > MAX_CENTS) {
    throw new ValidationError("Los centavos deben ser enteros dentro del rango monetario admitido.");
  }
  if (!CURRENCIES.includes(currency)) throw new ValidationError("Moneda no admitida.");
  return Object.freeze({ cents, currency });
}

export function requireNonNegative(money: Money): void {
  createMoney(money.cents, money.currency);
  if (money.cents < 0n) throw new ValidationError("El importe no puede ser negativo.");
}

export function requireSameCurrency(left: Money, right: Money): void {
  createMoney(left.cents, left.currency);
  createMoney(right.cents, right.currency);
  if (left.currency !== right.currency) throw new ValidationError("Las monedas deben coincidir.");
}

export function sumMoney(values: readonly Money[], currency: Currency): Money {
  let cents = 0n;
  const zero = createMoney(0n, currency);
  for (const value of values) {
    requireSameCurrency(zero, value);
    cents += value.cents;
  }
  return createMoney(cents, currency);
}

/** División racional exacta; la política viene del acuerdo, nunca de un default. */
export function divideRounded(numerator: bigint, denominator: bigint, mode: RoundingMode): bigint {
  if (typeof numerator !== "bigint" || typeof denominator !== "bigint" || denominator <= 0n || !ROUNDING_MODES.includes(mode)) {
    throw new ValidationError("División o criterio de redondeo inválidos.");
  }
  const quotient = numerator / denominator;
  const remainder = numerator % denominator;
  if (remainder === 0n || mode === "towards_zero") return quotient;
  const sign = numerator < 0n ? -1n : 1n;
  if (mode === "floor") return numerator < 0n ? quotient - 1n : quotient;
  if (mode === "ceil") return numerator > 0n ? quotient + 1n : quotient;
  const twice = (remainder < 0n ? -remainder : remainder) * 2n;
  return twice > denominator || (twice === denominator && quotient % 2n !== 0n) ? quotient + sign : quotient;
}

/** TX-11: truncar cada cuota salvo la última, que absorbe TODO el residual. */
export function allocateInstallments(total: Money, weights: readonly bigint[]): readonly Money[] {
  requireNonNegative(total);
  if (weights.length === 0 || weights.some(weight => typeof weight !== "bigint" || weight <= 0n)) {
    throw new ValidationError("Se requieren ponderaciones enteras positivas.");
  }
  const denominator = weights.reduce((sum, weight) => sum + weight, 0n);
  let allocated = 0n;
  return weights.map((weight, index) => {
    const cents = index === weights.length - 1 ? total.cents - allocated : total.cents * weight / denominator;
    if (cents <= 0n) throw new ValidationError("Cada cuota debe ser positiva.");
    allocated += cents;
    return createMoney(cents, total.currency);
  });
}

export type CommissionShare = Readonly<{ beneficiaryId: string; weight: bigint }>;

/** El receptor del residual es explícito; el orden no depende del locale ni de la entrada. */
export function allocateCommission(total: Money, shares: readonly CommissionShare[], residualBeneficiaryId: string) {
  requireNonNegative(total);
  if (shares.length === 0 || shares.some(share => !share.beneficiaryId.trim() || typeof share.weight !== "bigint" || share.weight <= 0n)
    || new Set(shares.map(share => share.beneficiaryId)).size !== shares.length
    || !shares.some(share => share.beneficiaryId === residualBeneficiaryId)) {
    throw new ValidationError("El reparto y el receptor del residual deben estar definidos.");
  }
  const ordered = [...shares].sort((left, right) => left.beneficiaryId < right.beneficiaryId ? -1 : left.beneficiaryId > right.beneficiaryId ? 1 : 0);
  const denominator = ordered.reduce((sum, share) => sum + share.weight, 0n);
  const truncated = ordered.map(share => ({ beneficiaryId: share.beneficiaryId, cents: total.cents * share.weight / denominator }));
  const residual = total.cents - truncated.reduce((sum, share) => sum + share.cents, 0n);
  return {
    residual: createMoney(residual, total.currency),
    residualBeneficiaryId,
    shares: truncated.map(share => ({ beneficiaryId: share.beneficiaryId, amount: createMoney(share.cents + (share.beneficiaryId === residualBeneficiaryId ? residual : 0n), total.currency) })),
  };
}

export type FxRate = Readonly<{
  base: Currency;
  quote: Currency;
  numerator: bigint;
  denominator: bigint;
  rounding: RoundingMode;
  source: string;
  version: string;
}>;

/** NUMERIC(24,12), expresado en unidades cotizadas por una unidad base. */
export function createFxRate(base: Currency, quote: Currency, decimal: string, rounding: RoundingMode, source: string, version: string): FxRate {
  createMoney(0n, base);
  createMoney(0n, quote);
  if (base === quote || typeof decimal !== "string" || !/^(0|[1-9]\d{0,11})(\.\d{1,12})?$/.test(decimal)
    || !ROUNDING_MODES.includes(rounding) || !source.trim() || !version.trim()) {
    throw new ValidationError("La tasa requiere monedas distintas, valor decimal exacto, fuente, versión y redondeo.");
  }
  const [integer, fraction = ""] = decimal.split(".");
  const numerator = BigInt(integer! + fraction);
  if (numerator <= 0n) throw new ValidationError("La tasa debe ser positiva.");
  return Object.freeze({ base, quote, numerator, denominator: 10n ** BigInt(fraction.length), rounding, source, version });
}

export function convertMoney(amount: Money, target: Currency, rate: FxRate): Money {
  createMoney(amount.cents, amount.currency);
  // También valida un snapshot recibido de persistencia, no solo el factory.
  if (rate.base === rate.quote || !CURRENCIES.includes(rate.base) || !CURRENCIES.includes(rate.quote)
    || typeof rate.numerator !== "bigint" || typeof rate.denominator !== "bigint" || rate.numerator <= 0n || rate.denominator <= 0n
    || !rate.source.trim() || !rate.version.trim()) throw new ValidationError("Snapshot de tasa inválido.");
  if (amount.currency === rate.base && target === rate.quote) {
    return createMoney(divideRounded(amount.cents * rate.numerator, rate.denominator, rate.rounding), target);
  }
  if (amount.currency === rate.quote && target === rate.base) {
    return createMoney(divideRounded(amount.cents * rate.denominator, rate.numerator, rate.rounding), target);
  }
  throw new ValidationError("La dirección solicitada no corresponde a la tasa pactada.");
}

/** Solo información de reporte: no cambia el snapshot ni el importe contractual. */
export function fxDifference(baseAmount: Money, contracted: FxRate, reference: FxRate): Money {
  if (baseAmount.currency !== contracted.base || contracted.base !== reference.base || contracted.quote !== reference.quote) {
    throw new ValidationError("Las tasas deben tener la misma dirección.");
  }
  const agreed = convertMoney(baseAmount, contracted.quote, contracted);
  const reported = convertMoney(baseAmount, reference.quote, reference);
  return createMoney(agreed.cents - reported.cents, agreed.currency);
}

export function payoutNet(gross: Money, withholding: Money, adjustment: Money): Money {
  requireNonNegative(gross);
  requireNonNegative(withholding);
  requireSameCurrency(gross, withholding);
  requireSameCurrency(gross, adjustment);
  if (withholding.cents > gross.cents) throw new ValidationError("La retención excede el bruto.");
  const net = createMoney(gross.cents - withholding.cents + adjustment.cents, gross.currency);
  requireNonNegative(net);
  return net;
}

export function moneyToDecimal(amount: Money): string {
  createMoney(amount.cents, amount.currency);
  const absolute = amount.cents < 0n ? -amount.cents : amount.cents;
  return `${amount.cents < 0n ? "-" : ""}${absolute / 100n}.${(absolute % 100n).toString().padStart(2, "0")}`;
}
