import { requireScope, reaches } from "@/domain/rbac";
import { NotFoundError } from "@/domain/errors";
import { takeLead } from "@/application/leads/toma";
import { requireActor } from "@/infrastructure/auth/actor";
import { leadsParaEscritura } from "@/infrastructure/contenedor/leads";
import { errorResponse } from "@/infrastructure/http";
export async function POST(_request: Request, { params }: {
    params: Promise<{
        id: string;
    }>;
}) { try {
    const actor = await requireActor();
    requireScope(actor, "leads", "view");
    requireScope(actor, "leads", "edit");
    const { id } = await params;
    if (!/^[1-9]\d{0,9}$/.test(id) || Number(id) > 2147483647)
        throw new NotFoundError();
    const lead = await takeLead(leadsParaEscritura(), actor, Number(id));
    if (!reaches(actor, "own", lead.brokerId))
        throw new NotFoundError();
    return Response.json({ ok: true, lead }, { headers: { "cache-control": "no-store" } });
}
catch (error) {
    return errorResponse(error);
} }
