import { z } from "zod";
import { CURRENCIES, MAX_CENTS, MIN_CENTS, createMoney } from "../../domain/transaccion/dinero.ts";
import type { Currency, Money } from "../../domain/transaccion/dinero.ts";
import { ValidationError } from "../../domain/errors.ts";

export const CentavosNoNegativos = z.string().max(19).regex(/^(0|[1-9]\d*)$/)
  .transform(value => BigInt(value)).pipe(z.bigint().min(0n).max(MAX_CENTS));
export const CentavosPositivos = CentavosNoNegativos.refine(value => value > 0n, "El importe debe ser positivo.");
export const CentavosFirmados = z.string().max(20).regex(/^(0|-?[1-9]\d*)$/)
  .transform(value => BigInt(value)).pipe(z.bigint().min(MIN_CENTS).max(MAX_CENTS));
export const EntradaDinero = z.strictObject({ cents: CentavosNoNegativos, currency: z.enum(CURRENCIES) });
export type MoneyDto = Readonly<{ cents: string; currency: Currency }>;

export function moneyToDto(money: Money): MoneyDto {
  createMoney(money.cents, money.currency);
  return { cents: money.cents.toString(), currency: money.currency };
}

/** Frontera legacy explícita; el number jamás entra en cálculos nuevos. */
export function toLegacyCents(cents: bigint): number {
  createMoney(cents, "USD");
  if (cents < BigInt(Number.MIN_SAFE_INTEGER) || cents > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new ValidationError("El DTO antiguo no puede representar este importe; se requiere el contrato de texto.");
  }
  return Number(cents);
}

export function fromLegacyCents(cents: number): bigint {
  if (!Number.isSafeInteger(cents)) throw new ValidationError("El importe antiguo debe releerse como texto exacto.");
  return BigInt(cents);
}
