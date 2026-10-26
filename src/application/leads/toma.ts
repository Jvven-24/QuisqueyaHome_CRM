import { ForbiddenError, NotFoundError, ConflictError } from "../../domain/errors.ts";
import { requireScope, type Actor } from "../../domain/rbac.ts";
import type { UnidadDeTrabajo } from "../compartido/unidad-de-trabajo.ts";
import type { ReposLeads } from "./puertos.ts";
/** #47: la cola de leads nuevos sin responsable es una concesión explícita a brokers activos con permiso de leads. */
export async function takeLead(deps: {
    unidad: UnidadDeTrabajo<ReposLeads>;
}, actor: Actor, id: number) {
    requireScope(actor, "leads", "view");
    requireScope(actor, "leads", "edit");
    if (actor.roleSlug !== "broker")
        throw new ForbiddenError("La toma de leads está reservada a brokers.");
    return deps.unidad.ejecutar(async ({ leads, auditoria }) => {
        // Se consulta internamente con bloqueo; jamás se devuelve una fila ajena.
        const lead = await leads.buscarLeadParaConversion(id, actor, "all");
        if (!lead || lead.deletedAt)
            throw new NotFoundError();
        if (lead.brokerId === actor.userId && lead.status === "assigned")
            return lead;
        if (lead.brokerId !== null)
            throw new NotFoundError();
        if (lead.status !== "new" && lead.status !== "assigned")
            throw new ConflictError("Este lead ya no está disponible en la cola.");
        const updated = await leads.reclamarDisponible(id, actor.userId, actor.userId);
        await auditoria.registrar(actor, { accion: "asignar", entidad: "lead", entidadId: id, antes: lead, despues: updated });
        return updated;
    });
}
