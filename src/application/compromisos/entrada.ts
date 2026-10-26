import { z } from "zod";
import { CURRENCIES } from "../../domain/transaccion/dinero.ts";
import { CentavosPositivos } from "../compartido/dinero.ts";
import { ValidationError } from "../../domain/errors.ts";

const id = z.number().int().positive().max(2147483647);
const uuid = z.string().uuid();

export const unidadHoldEntradaSchema = z.object({
  unitId: id,
  priceVersion: z.number().int().positive().max(2147483647).default(1),
  priceCents: CentavosPositivos,
  currency: z.enum(CURRENCIES),
  componentRole: z.string().trim().min(1, "El rol de componente es requerido.").max(100).default("principal"),
}).strict();

export const crearHoldSchema = z.object({
  dealId: id,
  holderId: id.optional(),
  units: z.array(unidadHoldEntradaSchema).min(1, "Debe incluir al menos una unidad para el hold."),
  reason: z.string().trim().min(1, "El motivo del hold es requerido.").max(1000),
  policyVersion: z.number().int().positive().max(2147483647).optional().default(1),
  durationHours: z.number().int().min(1).max(168).optional().default(48),
  idempotencyKey: uuid.optional(),
}).strict();

export const extenderHoldSchema = z.object({
  expectedVersion: z.number().int().positive(),
  reason: z.string().trim().min(1, "El motivo de la extensión es requerido.").max(1000),
  additionalHours: z.number().int().min(1).max(72).optional().default(24),
  idempotencyKey: uuid.optional(),
}).strict();

export const cancelarHoldSchema = z.object({
  expectedVersion: z.number().int().positive(),
  reason: z.string().trim().min(1, "El motivo de cancelación es requerido.").max(1000),
  idempotencyKey: uuid.optional(),
}).strict();

export const filtrosHoldsSchema = z.object({
  dealId: id.optional(),
  holderId: id.optional(),
  status: z.enum(["activo", "convertido", "cancelado", "expirado"]).optional(),
  unitId: id.optional(),
  id: z.union([id, uuid]).optional(),
}).strict();

export function validarEntrada<T>(schema: z.ZodType<T>, entrada: unknown): T {
  const result = schema.safeParse(entrada);
  if (!result.success) {
    const fields: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = issue.path.join(".") || "_";
      fields[key] ??= issue.message;
    }
    throw new ValidationError("Revisa los datos enviados.", fields);
  }
  return result.data;
}
