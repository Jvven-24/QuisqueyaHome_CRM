import { requireScope, reaches } from "@/domain/rbac";
import { NotFoundError } from "@/domain/errors";
import { QualificationInput, qualifyLead } from "@/application/leads/calificacion";
import { requireActor } from "@/infrastructure/auth/actor";
import { leadsParaEscritura } from "@/infrastructure/contenedor/leads";
import { errorResponse, parseInput } from "@/infrastructure/http";
export async function PATCH(request: Request, { params }: {
    params: Promise<{
        id: string;
    }>;
}) {
    try {
        const actor = await requireActor();
        const view = requireScope(actor, "leads", "view");
        const edit = requireScope(actor, "leads", "edit");
        const { id } = await params;
        if (!/^[1-9]\d{0,9}$/.test(id) || Number(id) > 2147483647)
            throw new NotFoundError();
        const input = parseInput(QualificationInput, await request.json().catch(() => ({})));
        const deps = leadsParaEscritura();
        const current = await deps.leads.buscarLead(Number(id));
        if (!current || current.deletedAt || !reaches(actor, view, current.brokerId) || !reaches(actor, edit, current.brokerId))
            throw new NotFoundError();
        const lead = await qualifyLead(deps, actor, Number(id), { budgetMinCents: input.budgetMinCents, budgetMaxCents: input.budgetMaxCents, currency: input.currency, projectInterestText: input.projectInterestText, zoneInterest: input.zoneInterest, operationType: input.operationType });
        return Response.json({ ok: true, lead }, { headers: { "cache-control": "no-store" } });
    }
    catch (error) {
        return errorResponse(error);
    }
}
