/**
 * Conversión transaccional de un lead a negocio.
 *
 * Toca dos recursos (`leads`, `deals`); la ruta exige permiso sobre los dos
 * antes de llamar aquí, y este caso de uso recibe el alcance sobre `leads`.
 *
 * El lead siempre llega con `contactId` resuelto: la columna es `notNull` en el
 * esquema porque nace enlazado a un contacto existente o recién creado en la
 * misma alta — no hay un paso de "crear o enlazar contacto" que hacer aquí.
 *
 * `leads.converted_deal_id` no tiene clave foránea a propósito (decisión #8,
 * evita el ciclo `leads` → `deals` → `leads`): lo que garantiza su integridad es
 * que las tres escrituras —crear el negocio, marcar el lead convertido y
 * sellar ese campo— ocurran en la misma unidad de trabajo.
 *
 * Pasos, en este orden (el mismo de la ruta original): leer el lead → alcance →
 * guardas de estado → primera etapa abierta → crear el negocio → marcar el lead
 * → auditar.
 */

import { ConflictError, NotFoundError } from "../../domain/errors.ts";
import { reaches, type Actor, type PermissionScope } from "../../domain/rbac.ts";
import type { UnidadDeTrabajo } from "../compartido/unidad-de-trabajo.ts";
import type { Lead, Negocio, ReposLeads } from "./puertos.ts";

export async function convertirLead(
  deps: { unidad: UnidadDeTrabajo<ReposLeads> },
  actor: Actor,
  alcance: PermissionScope,
  id: number,
): Promise<{ lead: Lead; deal: Negocio }> {
  return deps.unidad.ejecutar(async ({ leads, auditoria }) => {
    const lead = await leads.buscarLead(id);
    if (!lead) throw new NotFoundError();

    // El alcance se comprueba en memoria contra la fila ya leída: un id fuera
    // del alcance del actor (o en la papelera) responde igual que uno
    // inexistente — nunca le confirma a un broker que el lead de otro existe.
    if (lead.deletedAt || !reaches(actor, alcance, lead.brokerId)) throw new NotFoundError();

    if (lead.status === "converted") {
      throw new ConflictError("Este lead ya fue convertido a negocio.");
    }
    if (lead.status === "discarded") {
      throw new ConflictError("Este lead fue descartado; no se puede convertir.");
    }

    // La primera etapa abierta del embudo, por posición — nunca un id fijo: el
    // administrador puede reordenar o renombrar etapas (decisión #1).
    const primeraEtapa = await leads.primeraEtapaAbierta();
    if (!primeraEtapa) {
      throw new ConflictError("No hay una etapa inicial configurada en el embudo.");
    }

    const deal = await leads.crearNegocioDeLead({
      contactId: lead.contactId,
      leadId: lead.id,
      stageId: primeraEtapa.id,
      sourceId: lead.sourceId,
      // El broker confirmado del lead, nunca la sugerencia sin confirmar
      // (decisión #21) — `suggested_broker_id` es una propuesta, no una
      // asignación. Si nadie lo asignó antes de convertir, el negocio se queda
      // con quien convierte (issue #22): así no vuelve a nacer un negocio sin
      // dueño.
      brokerId: lead.brokerId ?? actor.userId,
      operationType: lead.operationType ?? "sale",
      currency: lead.currency,
      stageChangedAt: new Date(),
      createdBy: actor.userId,
      updatedBy: actor.userId,
    });

    const leadActualizado = await leads.marcarConvertido(id, deal.id, actor.userId);

    await auditoria.registrar(actor, {
      accion: "convertir",
      entidad: "lead",
      entidadId: id,
      antes: lead,
      despues: leadActualizado,
    });

    return { lead: leadActualizado, deal };
  });
}
