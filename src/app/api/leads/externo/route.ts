/**
 * M2 · Leads — captura externa idempotente (decisión #20, paso 4 de
 * `docs/F1_ANALISIS_Y_PLAN.md`).
 *
 * **Excepción explícita al patrón de RBAC, no un olvido.** Es la única entrada
 * pública del sistema: no hay sesión de Supabase, así que no hay `Actor` del
 * que resolver permiso. Por eso esta ruta **no llama a `requireActor` ni a
 * `requireScope`** — el filtro es un token compartido en la cabecera
 * `x-webhook-token`, comparado con `leadsWebhookToken()` (`infrastructure/env.ts`).
 * No se generaliza este atajo a ninguna otra ruta.
 *
 * La idempotencia la garantiza `leads_external_id_unq` (índice único parcial
 * ya aplicado): `insert().onConflictDoNothing()` sobre ese índice, y si no
 * insertó nada porque ya existía, un `SELECT` por `externalId` devuelve el
 * lead existente. Sin tabla de idempotencia, sin cola, sin cabecera
 * `Idempotency-Key` — es justo lo que descarta la decisión #20.
 */

import { and, eq, isNull, or } from "drizzle-orm";
import { z } from "zod";
import { sugerirBroker } from "@/domain/asignacion-lead";
import { OPERATION_TYPES } from "@/domain/catalogs";
import { normalizarTelefono } from "@/domain/telefono";
import { transaction } from "@/infrastructure/db/client";
import { auditLog, contacts, leads } from "@/infrastructure/db/schema";
import { leadsWebhookToken } from "@/infrastructure/env";
import { errorResponse, parseInput } from "@/infrastructure/http";
import { candidatosBroker } from "../_broker-candidatos";

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
    const { phone, phoneDisplay } = normalizarTelefono(datos.phone ?? null);

    // La sugerencia de broker es dominio puro; se calcula antes de la
    // transacción igual que en el alta manual.
    const candidatos = await candidatosBroker();
    const suggestedBrokerId = sugerirBroker(
      {
        projectInterestText: datos.projectInterestText ?? null,
        zoneInterest: datos.zoneInterest ?? null,
        operationType: datos.operationType ?? null,
      },
      candidatos,
    );

    const resultado = await transaction(async (tx) => {
      // Reutiliza un contacto existente por teléfono o correo en vez de crear
      // uno nuevo en cada entrega: a diferencia del alta manual (decisión
      // #19, que avisa porque hay un humano que puede confirmar), aquí no hay
      // nadie a quien preguntarle "¿de todas formas?" — un webhook no puede
      // responder un 409. El criterio #5 sigue cumplido: no se pierde el
      // duplicado, se enlaza al contacto que ya lo representa.
      let idContacto: number | undefined;
      if (phone || datos.email) {
        const [existente] = await tx
          .select({ id: contacts.id })
          .from(contacts)
          .where(
            and(
              isNull(contacts.deletedAt),
              or(
                phone ? eq(contacts.phone, phone) : undefined,
                datos.email ? eq(contacts.email, datos.email) : undefined,
              ),
            ),
          )
          .limit(1);
        idContacto = existente?.id;
      }

      if (!idContacto) {
        const [contacto] = await tx
          .insert(contacts)
          .values({
            fullName: datos.fullName.trim(),
            phone,
            phoneDisplay,
            email: datos.email ?? null,
            sourceId: datos.sourceId ?? null,
            consentAt: new Date(),
            consentSource: "portal_externo",
          })
          .returning();

        // Sin `Actor`: se escribe directamente en `audit_log` con `userId: null`
        // en vez de pasar por `auditar()`, que exige un actor humano — sigue
        // yendo dentro de la misma transacción que el cambio (§18.1 / criterio #2).
        await tx.insert(auditLog).values({
          userId: null,
          action: "crear",
          entityType: "contact",
          entityId: contacto!.id,
          newValue: JSON.stringify(contacto),
        });
        idContacto = contacto!.id;
      }

      // Idempotencia (decisión #20): `onConflictDoNothing` sobre el único
      // parcial de `externalId`, con `returning()` — no un `SELECT` previo
      // que compita con un `INSERT` separado.
      const [insertado] = await tx
        .insert(leads)
        .values({
          contactId: idContacto,
          sourceId: datos.sourceId ?? null,
          projectId: datos.projectId ?? null,
          projectInterestText: datos.projectInterestText ?? null,
          zoneInterest: datos.zoneInterest ?? null,
          operationType: datos.operationType ?? null,
          currency: datos.currency ?? "USD",
          budgetMinCents: datos.budgetMinCents ?? null,
          budgetMaxCents: datos.budgetMaxCents ?? null,
          suggestedBrokerId,
          campaign: datos.campaign ?? null,
          utmSource: datos.utmSource ?? null,
          utmMedium: datos.utmMedium ?? null,
          utmCampaign: datos.utmCampaign ?? null,
          originalMessage: datos.originalMessage ?? null,
          sourceVideoUrl: datos.sourceVideoUrl ?? null,
          externalId: datos.externalId,
        })
        // `leads_external_id_unq` es un índice único **parcial**
        // (`WHERE deleted_at IS NULL`, `db/schema.ts`): Postgres exige que el
        // conflicto declarado calce exactamente con el predicado del índice,
        // o responde "no unique or exclusion constraint" en vez de aplicar el
        // `DO NOTHING`. Por eso `where` repite esa misma condición.
        .onConflictDoNothing({ target: leads.externalId, where: isNull(leads.deletedAt) })
        .returning();

      if (insertado) {
        await tx.insert(auditLog).values({
          userId: null,
          action: "crear",
          entityType: "lead",
          entityId: insertado.id,
          newValue: JSON.stringify(insertado),
        });
        return { lead: insertado, creado: true };
      }

      // Ya existía: el índice único descartó el `insert`. Se devuelve el
      // lead existente, sin auditoría nueva — no hubo cambio que registrar.
      const [existente] = await tx
        .select()
        .from(leads)
        .where(eq(leads.externalId, datos.externalId))
        .limit(1);
      return { lead: existente!, creado: false };
    });

    return Response.json({ ok: true, ...resultado });
  } catch (error) {
    return errorResponse(error);
  }
}
