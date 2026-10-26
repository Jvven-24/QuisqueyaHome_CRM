import { randomUUID } from "node:crypto";
import { dtoHold } from "@/application/compromisos/dto";
import { extenderHoldSchema } from "@/application/compromisos/entrada";
import { extenderHold } from "@/application/compromisos/casos-de-uso";
import { requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { compromisosParaEscritura } from "@/infrastructure/contenedor/compromisos";
import { errorResponse, parseInput } from "@/infrastructure/http";
import { visibleHolds } from "@/infrastructure/rbac-filter";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: idParam } = await params;
    const actor = await requireActor();
    const scope = requireScope(actor, "holds", "edit");

    // Candado relacional central (seguridad-rutas-id.test.ts)
    visibleHolds(actor, scope);

    const rawBody = await request.json().catch(() => ({}));
    const datos = parseInput(extenderHoldSchema, rawBody);

    const idempotencyKey =
      request.headers.get("idempotency-key") ||
      request.headers.get("x-idempotency-key") ||
      datos.idempotencyKey ||
      randomUUID();

    const correlationId = request.headers.get("x-correlation-id") || randomUUID();

    const holdId = Number.isInteger(Number(idParam)) && Number(idParam) > 0
      ? Number(idParam)
      : idParam;

    const hold = await extenderHold(compromisosParaEscritura(), actor, scope, holdId, {
      expectedVersion: datos.expectedVersion,
      reason: datos.reason,
      additionalHours: datos.additionalHours,
      idempotencyKey,
      correlationId,
      source: "api-holds-extensiones",
    });

    return Response.json({ ok: true, hold: dtoHold(actor, hold) }, { status: 200 });
  } catch (error) {
    return errorResponse(error);
  }
}
