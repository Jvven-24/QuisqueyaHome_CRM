import { z } from "zod";
import { CURRENCIES } from "../../domain/transaccion/dinero.ts";
import { CentavosFirmados, CentavosNoNegativos, CentavosPositivos } from "../compartido/dinero.ts";
import { ValidationError } from "../../domain/errors.ts";

const id = z.number().int().positive().max(2147483647);
const uuid = z.string().uuid();

export const reservaPartyEntradaSchema = z
  .object({
    contactId: id,
    role: z.enum(["titular", "representante"]),
    representationEvidenceId: id.optional(),
  })
  .strict()
  .refine(
    party => party.role !== "representante" || party.representationEvidenceId != null,
    {
      message: "El representante exige evidencia documental de representación.",
      path: ["representationEvidenceId"],
    },
  );

export const unidadReservaEntradaSchema = z
  .object({
    unitId: id,
    priceCents: CentavosPositivos,
    currency: z.enum(CURRENCIES),
    componentRole: z.string().trim().min(1, "El rol de componente es requerido.").max(100).default("principal"),
  })
  .strict();

export const crearReservaSchema = z
  .object({
    dealId: id,
    holdId: id.optional(),
    status: z.enum(["borrador", "pendiente_pago", "en_verificacion"]).optional().default("pendiente_pago"),
    currency: z.enum(CURRENCIES),
    totalCents: CentavosPositivos,
    adjustmentCents: CentavosFirmados.optional().default(0n),
    depositRequiredCents: CentavosNoNegativos,
    conditionsVersion: z.number().int().positive().max(2147483647).default(1),
    conditionsDocumentId: id,
    conditionsHash: z
      .string()
      .regex(/^[0-9a-f]{64}$/, "conditionsHash debe ser un hash SHA-256 de 64 caracteres hexadecimales."),
    expiresAt: z.string().datetime({ offset: true }).optional().nullable(),
    reason: z.string().trim().min(1, "El motivo de la reserva es requerido.").max(1000),
    parties: z.array(reservaPartyEntradaSchema).min(1, "Debe incluir al menos un titular para la reserva."),
    units: z.array(unidadReservaEntradaSchema).min(1, "Debe incluir al menos una unidad para la reserva."),
    idempotencyKey: uuid.optional(),
  })
  .strict()
  .refine(data => data.parties.some(p => p.role === "titular"), {
    message: "La reserva debe tener al menos un contacto con rol titular.",
    path: ["parties"],
  })
  .refine(data => data.units.every(u => u.currency === data.currency), {
    message: "La moneda de cada unidad debe coincidir con la moneda de la reserva.",
    path: ["units"],
  })
  .refine(data => data.depositRequiredCents <= data.totalCents, {
    message: "El depósito requerido no puede exceder el total pactado.",
    path: ["depositRequiredCents"],
  })
  .refine(
    data => {
      const sumUnidades = data.units.reduce((acc, u) => acc + u.priceCents, 0n);
      return sumUnidades + data.adjustmentCents === data.totalCents;
    },
    {
      message: "La suma de las unidades más los ajustes debe coincidir exactamente con el total pactado.",
      path: ["totalCents"],
    },
  );

export const confirmarReservaSchema = z
  .object({
    expectedVersion: z.number().int().positive(),
    confirmationEvidenceId: id,
    reason: z.string().trim().min(1, "El motivo de la confirmación es requerido.").max(1000),
    idempotencyKey: uuid.optional(),
  })
  .strict();

export const cambiarUnidadReservaSchema = z
  .object({
    expectedVersion: z.number().int().positive(),
    oldUnitId: id,
    newUnit: unidadReservaEntradaSchema,
    releaseReason: z.string().trim().min(1, "El motivo de liberación de la unidad anterior es requerido.").max(1000),
    reason: z.string().trim().min(1, "El motivo del cambio de unidad es requerido.").max(1000),
    idempotencyKey: uuid.optional(),
  })
  .strict();

export const cancelarReservaSchema = z
  .object({
    expectedVersion: z.number().int().positive(),
    action: z.enum(["solicitar", "cancelar"]).optional().default("cancelar"),
    reason: z.string().trim().min(1, "El motivo de cancelación es requerido.").max(1000),
    idempotencyKey: uuid.optional(),
  })
  .strict();

export const filtrosReservasSchema = z
  .object({
    dealId: id.optional(),
    status: z.enum([
      "borrador",
      "pendiente_pago",
      "en_verificacion",
      "confirmada",
      "expirada",
      "cancelacion_solicitada",
      "cancelada",
    ]).optional(),
    unitId: id.optional(),
    id: z.union([id, uuid]).optional(),
  })
  .strict();

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
