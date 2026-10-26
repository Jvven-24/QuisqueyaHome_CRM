import { notFound } from "next/navigation";
import { consultarReservaPorId, consultarReservaPorPublicId } from "@/application/reservas/consultas";
import { dtoReserva } from "@/application/reservas/dto";
import { NotFoundError } from "@/domain/errors";
import { can } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { requireScopeInPage } from "@/infrastructure/page-guard";
import { reservasParaEscritura } from "@/infrastructure/contenedor/reservas";
export async function visibleReservation(id: string) { const actor = await requireActor(); requireScopeInPage(actor, "deals", "view"); const scope = requireScopeInPage(actor, "reservations", "view"); const numeric = /^[1-9]\d*$/.test(id); if (!numeric && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))
    notFound(); if (numeric && (!Number.isSafeInteger(Number(id)) || Number(id) > 2147483647))
    notFound(); try {
    const deps = reservasParaEscritura();
    const row = numeric ? await consultarReservaPorId(deps, actor, scope, Number(id)) : await consultarReservaPorPublicId(deps, actor, scope, id);
    return { row: dtoReserva(actor, row), canEdit: can(actor, "reservations", "edit") };
}
catch (error) {
    if (error instanceof NotFoundError)
        notFound();
    throw error;
} }
