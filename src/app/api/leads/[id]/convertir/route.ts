/**
 * M2 · Leads — conversión transaccional a negocio (`docs/F1_ANALISIS_Y_PLAN.md`
 * paso 4). Toca dos recursos (`leads`, `deals`), así que exige permiso sobre
 * los dos antes de tocar la base — no basta con poder editar el lead si no se
 * puede crear el negocio en el que se convierte.
 *
 * El lead siempre llega con `contactId` resuelto: la columna es `notNull` en
 * el esquema (`infrastructure/db/schema.ts`, `leads.contact_id`) porque nace
 * enlazado a un contacto existente o recién creado en la misma alta
 * (`app/api/leads/route.ts` y `.../externo/route.ts`) — no hay un paso de
 * "crear o enlazar contacto" que hacer aquí, ya está hecho.
 *
 * `leads.converted_deal_id` no tiene clave foránea a propósito (decisión #8,
 * evita el ciclo `leads` → `deals` → `leads`): lo que garantiza su integridad
 * es que las tres escrituras —crear el negocio, marcar el lead convertido y
 * sellar ese campo— ocurran en la misma `transaction()`.
 */

import { asc, eq } from "drizzle-orm";
import { ConflictError, NotFoundError } from "@/domain/errors";
import { reaches, requireScope, type Actor, type PermissionScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { auditar } from "@/infrastructure/audit";
import { transaction } from "@/infrastructure/db/client";
import { deals, leads, pipelineStages } from "@/infrastructure/db/schema";
import { errorResponse } from "@/infrastructure/http";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params;
    const id = Number(idParam);
    if (!Number.isInteger(id) || id <= 0) throw new NotFoundError();

    const actor = await requireActor();
    // La conversión escribe en los dos recursos: sin permiso sobre alguno de
    // los dos, no se empieza — mejor un 403 antes que un negocio a medio crear.
    const scopeLeads = requireScope(actor, "leads", "edit");
    requireScope(actor, "deals", "create");

    const resultado = await transaction(async (tx) => {
      const [lead] = await tx.select().from(leads).where(eq(leads.id, id)).limit(1);
      if (!lead) throw new NotFoundError();

      // El alcance se comprueba en memoria contra la fila ya leída (mismo
      // criterio que `contactoVisible` en `api/contactos/[id]/route.ts`, pero
      // en línea porque aquí solo se usa una vez): un id fuera del alcance del
      // actor responde igual que uno inexistente — nunca le confirma a un
      // broker que el lead de otro existe.
      if (!dentroDeAlcance(lead, actor, scopeLeads)) throw new NotFoundError();

      if (lead.status === "converted") {
        throw new ConflictError("Este lead ya fue convertido a negocio.");
      }
      if (lead.status === "discarded") {
        throw new ConflictError("Este lead fue descartado; no se puede convertir.");
      }

      // La primera etapa abierta del embudo, por posición — nunca un id fijo:
      // el administrador puede reordenar o renombrar etapas (decisión #1).
      const [primeraEtapa] = await tx
        .select({ id: pipelineStages.id })
        .from(pipelineStages)
        .where(eq(pipelineStages.kind, "open"))
        .orderBy(asc(pipelineStages.position))
        .limit(1);
      if (!primeraEtapa) {
        throw new ConflictError("No hay una etapa inicial configurada en el embudo.");
      }

      const [deal] = await tx
        .insert(deals)
        .values({
          contactId: lead.contactId,
          leadId: lead.id,
          stageId: primeraEtapa.id,
          sourceId: lead.sourceId,
          // El broker confirmado del lead, nunca la sugerencia sin confirmar
          // (decisión #21) — `suggested_broker_id` es una propuesta, no una
          // asignación.
          brokerId: lead.brokerId,
          operationType: lead.operationType ?? "sale",
          currency: lead.currency,
          stageChangedAt: new Date(),
          createdBy: actor.userId,
          updatedBy: actor.userId,
        })
        .returning();

      const [leadActualizado] = await tx
        .update(leads)
        .set({
          status: "converted",
          convertedDealId: deal!.id,
          updatedBy: actor.userId,
        })
        .where(eq(leads.id, id))
        .returning();

      await auditar(tx, actor, {
        accion: "convertir",
        entidad: "lead",
        entidadId: id,
        antes: lead,
        despues: leadActualizado,
      });

      return { lead: leadActualizado, deal };
    });

    return Response.json({ ok: true, ...resultado });
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * `visibleRows` está pensado para filtrar un `SELECT` (`WHERE`), no para
 * comprobar una fila ya leída. Aquí se necesita lo segundo porque el lead ya
 * se leyó por `id` dentro de la transacción — así que se usa `reaches` del
 * dominio (la misma decisión, aplicada en memoria) en vez de reconstruir la
 * condición SQL o repetir el `SELECT` con `visibleRows` añadido.
 */
function dentroDeAlcance(
  lead: { brokerId: number | null; deletedAt: Date | null },
  actor: Actor,
  scope: PermissionScope,
): boolean {
  if (lead.deletedAt) return false;
  return reaches(actor, scope, lead.brokerId);
}
