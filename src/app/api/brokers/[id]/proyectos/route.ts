/**
 * M7 · Brokers — "Asignar propiedades" (`docs/F3_ANALISIS_Y_PLAN.md` §4.4,
 * decisión #38, issue #33). La única escritura nueva del módulo: el resto de
 * la pantalla son consultas sobre lo que M13, M5 y el cierre ya escriben.
 *
 * `projects:edit` no basta con cualquier alcance: solo `all` puede reasignar
 * el proyecto de otro broker (admin y asistente, según `db/seed.sql`) — un
 * broker con `projects:view own` no tiene este permiso, y aunque lo tuviera
 * con `own` no tendría sentido: no puede "asignarse a sí mismo" un proyecto
 * ajeno sin verlo primero.
 *
 * El diff (qué se asigna, qué se suelta) es `domain/asignacion-propiedades.ts`,
 * probado aparte; el caso de uso (`asignarProyectosABroker`) lo aplica dentro
 * de una transacción y audita cada proyecto que de verdad cambió — nunca los
 * que ya estaban como deben quedar.
 */

import { z } from "zod";
import { asignarProyectosABroker } from "@/application/brokers/casos-de-uso";
import { NotFoundError } from "@/domain/errors";
import { requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { brokersParaEscritura } from "@/infrastructure/contenedor/brokers";
import { errorResponse, parseInput } from "@/infrastructure/http";

const AsignarProyectosInput = z.object({
  projectIds: z.array(z.number().int().positive()),
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params;
    const brokerId = Number(idParam);
    if (!Number.isInteger(brokerId) || brokerId <= 0) throw new NotFoundError();

    const datos = parseInput(AsignarProyectosInput, await request.json().catch(() => ({})));
    const actor = await requireActor();
    const scope = requireScope(actor, "projects", "edit");

    const proyectosActualizados = await asignarProyectosABroker(
      brokersParaEscritura(),
      actor,
      scope,
      brokerId,
      datos.projectIds,
    );

    return Response.json({ ok: true, proyectos: proyectosActualizados });
  } catch (error) {
    return errorResponse(error);
  }
}
