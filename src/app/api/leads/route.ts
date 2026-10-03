/**
 * M2 · Leads — alta manual (`docs/F1_ANALISIS_Y_PLAN.md` paso 4).
 *
 * Ruta delgada: `parseInput` → `requireActor` + `requireScope` → `crearLead`
 * (`application/leads`), que hace la detección de duplicados (decisión #19), la
 * sugerencia de broker (#21), la transacción y la auditoría → `errorResponse`.
 *
 * Un lead nace de un contacto: si no llega `contactId`, el caso de uso crea el
 * contacto en la misma operación. Se avisa con 409 y candidatos, no se bloquea,
 * y `crear_igual: true` fuerza la creación.
 */

import { z } from "zod";
import { crearLead } from "@/application/leads/casos-de-uso";
import { OPERATION_TYPES } from "@/domain/catalogs";
import { requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { leadsParaEscritura } from "@/infrastructure/contenedor/leads";
import { errorResponse, parseInput } from "@/infrastructure/http";

const CrearLeadInput = z
  .object({
    /** Lead de un contacto ya existente. Si no llega, se crea uno nuevo con los tres campos siguientes. */
    contactId: z.coerce.number().int().positive().optional(),
    fullName: z.string().optional(),
    phone: z.string().optional(),
    email: z.email("Escribe un correo válido.").optional(),

    sourceId: z.coerce.number().int().positive().optional(),
    projectId: z.coerce.number().int().positive().optional(),
    projectInterestText: z.string().optional(),
    zoneInterest: z.string().optional(),
    operationType: z.enum(OPERATION_TYPES).optional(),
    budgetMinCents: z.coerce.number().int().nonnegative().optional(),
    budgetMaxCents: z.coerce.number().int().nonnegative().optional(),
    currency: z.string().optional(),

    campaign: z.string().optional(),
    utmSource: z.string().optional(),
    utmMedium: z.string().optional(),
    utmCampaign: z.string().optional(),
    originalMessage: z.string().optional(),
    sourceVideoUrl: z.string().optional(),

    /** Forzar la creación del contacto pese a candidatos de duplicado (decisión #19). */
    crear_igual: z.boolean().optional(),
  })
  // `contactId` XOR los datos para crear uno: sin esto, un `fullName` vacío
  // con un `contactId` presente pasaría desapercibido hasta el `insert`.
  .refine((datos) => Boolean(datos.contactId) || Boolean(datos.fullName?.trim()), {
    message: "Indica un contacto existente o el nombre para crear uno nuevo.",
    path: ["fullName"],
  });

/** Igual que en `api/contactos/route.ts`: "" desde un formulario vacío no es un valor. */
function limpiarVacios(cuerpo: unknown): unknown {
  if (typeof cuerpo !== "object" || cuerpo === null) return cuerpo;
  const copia: Record<string, unknown> = { ...(cuerpo as Record<string, unknown>) };
  for (const campo of [
    "phone",
    "email",
    "sourceId",
    "projectId",
    "projectInterestText",
    "zoneInterest",
    "operationType",
    "budgetMinCents",
    "budgetMaxCents",
    "currency",
    "campaign",
    "utmSource",
    "utmMedium",
    "utmCampaign",
    "originalMessage",
    "sourceVideoUrl",
  ]) {
    if (copia[campo] === "") delete copia[campo];
  }
  return copia;
}

export async function POST(request: Request) {
  try {
    const datos = parseInput(CrearLeadInput, limpiarVacios(await request.json().catch(() => ({}))));
    const actor = await requireActor();
    requireScope(actor, "leads", "create");

    // Campo por campo, nunca `...datos`; `crear_igual` (HTTP) pasa a `crearIgual`.
    const lead = await crearLead(leadsParaEscritura(), actor, {
      contactId: datos.contactId,
      fullName: datos.fullName,
      phone: datos.phone,
      email: datos.email,
      sourceId: datos.sourceId,
      projectId: datos.projectId,
      projectInterestText: datos.projectInterestText,
      zoneInterest: datos.zoneInterest,
      operationType: datos.operationType,
      budgetMinCents: datos.budgetMinCents,
      budgetMaxCents: datos.budgetMaxCents,
      currency: datos.currency,
      campaign: datos.campaign,
      utmSource: datos.utmSource,
      utmMedium: datos.utmMedium,
      utmCampaign: datos.utmCampaign,
      originalMessage: datos.originalMessage,
      sourceVideoUrl: datos.sourceVideoUrl,
      crearIgual: datos.crear_igual,
    });

    return Response.json({ ok: true, lead });
  } catch (error) {
    return errorResponse(error);
  }
}
