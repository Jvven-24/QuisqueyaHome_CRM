import { randomUUID } from "node:crypto";
import { dtoReserva } from "@/application/reservas/dto";
import { cancelarReservaSchema } from "@/application/reservas/entrada";
import { cancelarReserva } from "@/application/reservas/casos-de-uso";
import { requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { reservasParaEscritura } from "@/infrastructure/contenedor/reservas";
import { errorResponse, parseInput } from "@/infrastructure/http";
import { visibleReservas } from "@/infrastructure/rbac-filter";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: idParam } = await params;
    const actor = await requireActor();
    const scope = requireScope(actor, "reservations", "edit");

    // Candado relacional central (seguridad-rutas-id.test.ts)
    visibleReservas(actor, scope);

    const rawBody = await request.json().catch(() => ({}));
    const datos = parseInput(cancelarReservaSchema, rawBody);

    const idempotencyKey =
      request.headers.get("idempotency-key") ||
      request.headers.get("x-idempotency-key") ||
      datos.idempotencyKey ||
      randomUUID();

    const correlationId = request.headers.get("x-correlation-id") || randomUUID();

    const reservaId = Number.isInteger(Number(idParam)) && Number(idParam) > 0
      ? Number(idParam)
      : idParam;

    const reserva = await cancelarReserva(reservasParaEscritura(), actor, scope, reservaId, {
      expectedVersion: datos.expectedVersion,
      action: datos.action,
      reason: datos.reason,
      idempotencyKey,
      correlationId,
      source: "api-reservas-cancelacion",
    });

    return Response.json({ ok: true, reserva: dtoReserva(actor, reserva) }, { status: 200 });
  } catch (error) {
    return errorResponse(error);
  }
}
