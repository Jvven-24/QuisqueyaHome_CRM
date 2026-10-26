import { randomUUID } from "node:crypto";
import { dtoHold, dtoListaHolds } from "@/application/compromisos/dto";
import { crearHoldSchema, filtrosHoldsSchema } from "@/application/compromisos/entrada";
import { crearHold } from "@/application/compromisos/casos-de-uso";
import { listarHolds } from "@/application/compromisos/consultas";
import { CupoExcedidoError } from "@/application/compromisos/puertos";
import { requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { compromisosParaEscritura } from "@/infrastructure/contenedor/compromisos";
import { errorResponse, parseInput } from "@/infrastructure/http";

export async function POST(request: Request) {
  try {
    const rawBody = await request.json().catch(() => ({}));
    const datos = parseInput(crearHoldSchema, rawBody);
    const actor = await requireActor();
    const scope = requireScope(actor, "holds", "create");

    const idempotencyKey =
      request.headers.get("idempotency-key") ||
      request.headers.get("x-idempotency-key") ||
      datos.idempotencyKey ||
      randomUUID();

    const correlationId = request.headers.get("x-correlation-id") || randomUUID();

    const hold = await crearHold(compromisosParaEscritura(), actor, scope, {
      dealId: datos.dealId,
      holderId: datos.holderId,
      units: datos.units,
      reason: datos.reason,
      policyVersion: datos.policyVersion,
      durationHours: datos.durationHours,
      idempotencyKey,
      correlationId,
      source: "api-holds",
    });

    return Response.json({ ok: true, hold: dtoHold(actor, hold) }, { status: 201 });
  } catch (error) {
    if (error instanceof CupoExcedidoError) {
      return Response.json(
        { error: error.message, code: "QUOTA_EXCEEDED" },
        { status: 429, headers: { "content-type": "application/json" } },
      );
    }
    return errorResponse(error);
  }
}

export async function GET(request: Request) {
  try {
    const actor = await requireActor();
    const scope = requireScope(actor, "holds", "view");

    const url = new URL(request.url);
    const rawFiltros: Record<string, unknown> = {};

    const dealIdParam = url.searchParams.get("dealId");
    if (dealIdParam) rawFiltros.dealId = Number(dealIdParam);

    const holderIdParam = url.searchParams.get("holderId");
    if (holderIdParam) rawFiltros.holderId = Number(holderIdParam);

    const statusParam = url.searchParams.get("status");
    if (statusParam) rawFiltros.status = statusParam;

    const unitIdParam = url.searchParams.get("unitId");
    if (unitIdParam) rawFiltros.unitId = Number(unitIdParam);

    const idParam = url.searchParams.get("id");
    if (idParam) {
      rawFiltros.id = Number.isInteger(Number(idParam)) ? Number(idParam) : idParam;
    }

    const filtros = parseInput(filtrosHoldsSchema, rawFiltros);
    const holds = await listarHolds(compromisosParaEscritura(), actor, scope, filtros);

    return Response.json({ ok: true, holds: dtoListaHolds(actor, holds) });
  } catch (error) {
    return errorResponse(error);
  }
}
