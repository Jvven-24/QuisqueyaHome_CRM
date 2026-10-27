import { z } from "zod";
import { ValidationError } from "../../domain/errors.ts";

const id = z.number().int().positive().max(2147483647);
const dinero = z.number().int().nonnegative().safe();
export const editarNegocioSchema = z.object({
  amountCents: dinero.nullable().optional(),
  probability: z.number().int().min(0).max(100).nullable().optional(),
  commissionBasisPoints: z.number().int().min(0).max(10000).nullable().optional(),
  expectedCloseDate: z.iso.date().nullable().optional(),
}).strict();
export const cambiarEtapaSchema = z.object({
  expectedStageId: id.optional(), expectedStageChangedAt: z.iso.datetime().nullable().optional(),
  stageId: id, lossReasonId: id.optional(), lossComment: z.string().optional(),
  amountCents: dinero.optional(),
  unitId: id.optional(), unitCode: z.string().max(200).optional(),
}).strict();
export const asociarPropiedadSchema = z.object({ projectId: id, unitId: id.optional(), isPrimary: z.boolean().optional() }).strict();
export const retirarPropiedadSchema = z.object({ motivo: z.string().trim().min(1).max(1000) }).strict();
export function validarEntrada<T>(schema: z.ZodType<T>, entrada: unknown): T {
  const result = schema.safeParse(entrada);
  if (!result.success) throw new ValidationError("Revisa los datos enviados.");
  return result.data;
}
