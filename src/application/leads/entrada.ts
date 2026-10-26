import { z } from "zod";
import { OPERATION_TYPES } from "../../domain/catalogs.ts";
import { correoOpcional, idOpcional, nombreContacto, telefonoOpcional, textoOpcional } from "../contactos/entrada.ts";

const centavos = z.preprocess(value => value === "" ? undefined : value,
  z.coerce.number({ error: "Indica un importe num\u00e9rico." }).int("Indica centavos enteros.").nonnegative("El importe no puede ser negativo.").max(Number.MAX_SAFE_INTEGER, "El importe supera el rango permitido.").optional());

export const CrearLeadInput = z.object({
  contactId: idOpcional,
  fullName: nombreContacto.optional(),
  phone: telefonoOpcional,
  email: correoOpcional,
  sourceId: idOpcional,
  projectId: idOpcional,
  projectInterestText: textoOpcional,
  zoneInterest: textoOpcional,
  operationType: z.preprocess(value => value === "" ? undefined : value, z.enum(OPERATION_TYPES, { error: "Elige una operación válida." }).optional()),
  budgetMinCents: centavos,
  budgetMaxCents: centavos,
  currency: z.preprocess(value => value === "" ? undefined : value, z.string({ error: "Indica una moneda v\u00e1lida." }).regex(/^[A-Z]{3}$/, "Indica una moneda de tres letras.").optional()),
  campaign: textoOpcional,
  utmSource: textoOpcional,
  utmMedium: textoOpcional,
  utmCampaign: textoOpcional,
  originalMessage: textoOpcional,
  sourceVideoUrl: textoOpcional,
  crear_igual: z.boolean({ error: "Confirma si deseas crear el duplicado." }).optional(),
}).refine(data => Boolean(data.contactId) || Boolean(data.fullName), {
  message: "Escribe el nombre del contacto.", path: ["fullName"],
}).refine(data => data.budgetMinCents === undefined || data.budgetMaxCents === undefined || data.budgetMinCents <= data.budgetMaxCents, {
  message: "El máximo debe ser mayor o igual al mínimo.", path: ["budgetMaxCents"],
});
