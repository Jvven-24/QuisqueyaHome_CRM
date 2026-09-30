/**
 * M2 · Leads — captura externa idempotente (decisión #20, paso 4 de
 * `docs/F1_ANALISIS_Y_PLAN.md`).
 *
 * **Excepción explícita al patrón de RBAC, no un olvido.** Es la única entrada
 * pública del sistema: no hay sesión de Supabase, así que no hay `Actor` del
 * que resolver permiso. Por eso esta ruta **no llama a `requireActor` ni a
 * `requireScope`** — el filtro es un token compartido en la cabecera
 * `x-webhook-token`, comparado con `leadsWebhookToken()` (`infrastructure/env.ts`).
 * No se generaliza este atajo a ninguna otra ruta. `coincideToken` se queda en
 * ESTE archivo: `seguridad.test.ts` lo exige para aceptar la ruta como pública.
 *
 * La idempotencia (decisión #20) la da `capturarLeadExterno`
 * (`application/leads`) con un upsert atómico sobre `leads_external_id_unq`;
 * esta ruta solo autentica el token, valida el cuerpo y responde.
 */

import { z } from "zod";
import { capturarLeadExterno } from "@/application/leads/casos-de-uso";
import { OPERATION_TYPES } from "@/domain/catalogs";
import { leadsParaEscritura } from "@/infrastructure/contenedor/leads";
import { leadsWebhookToken } from "@/infrastructure/env";
import { errorResponse, parseInput } from "@/infrastructure/http";

const LeadExternoInput = z.object({
  /** Obligatorio aquí (a diferencia del alta manual): es la clave de idempotencia. */
  externalId: z.string({ error: "externalId es obligatorio." }).min(1, "externalId es obligatorio."),
  fullName: z.string({ error: "Falta el nombre del contacto." }).min(1, "Falta el nombre del contacto."),
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
});

/**
 * Comparación en tiempo constante para el token. No es un dato secreto de
 * longitud variable comparándose contra sí mismo (no hay hash), pero cuesta lo
 * mismo que `===` y evita el hábito de comparar tokens con `===` que
 * `security-review` marcaría en cualquier otro endpoint — sencillo, así que se
 * hace bien desde el principio.
 */
function coincideToken(recibido: string, esperado: string): boolean {
  if (recibido.length !== esperado.length) return false;
  let diferencia = 0;
  for (let i = 0; i < recibido.length; i++) {
    diferencia |= recibido.charCodeAt(i) ^ esperado.charCodeAt(i);
  }
  return diferencia === 0;
}

export async function POST(request: Request) {
  try {
    const token = request.headers.get("x-webhook-token");
    // 401 sin distinguir "falta la cabecera" de "token incorrecto": lo mismo
    // que `NotFoundError` en RBAC, no hay que confirmarle nada a quien pregunta.
    if (!token || !coincideToken(token, leadsWebhookToken())) {
      return Response.json({ error: "No autorizado." }, { status: 401 });
    }

    const datos = parseInput(LeadExternoInput, await request.json().catch(() => ({})));

    // Campo por campo, nunca `...datos`.
    const resultado = await capturarLeadExterno(leadsParaEscritura(), {
      externalId: datos.externalId,
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
    });

    return Response.json({ ok: true, ...resultado });
  } catch (error) {
    return errorResponse(error);
  }
}
