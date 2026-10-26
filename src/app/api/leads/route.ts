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

import { CrearLeadInput } from "@/application/leads/entrada";
import { crearLead } from "@/application/leads/casos-de-uso";
import { requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { leadsParaEscritura } from "@/infrastructure/contenedor/leads";
import { errorResponse, parseInput } from "@/infrastructure/http";

export async function POST(request: Request) {
  try {
    const datos = parseInput(CrearLeadInput, await request.json().catch(() => ({})));
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
