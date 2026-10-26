import { randomUUID } from "node:crypto";
import { dtoListaReservas, dtoReserva } from "@/application/reservas/dto";
import { crearReservaSchema, filtrosReservasSchema } from "@/application/reservas/entrada";
import { crearReserva } from "@/application/reservas/casos-de-uso";
import { listarReservas } from "@/application/reservas/consultas";
import { requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { reservasParaEscritura } from "@/infrastructure/contenedor/reservas";
import { errorResponse, parseInput } from "@/infrastructure/http";

export async function POST(request: Request) {
  try {
    const rawBody = await request.json().catch(() => ({}));
    const datos = parseInput(crearReservaSchema, rawBody);
    const actor = await requireActor();
    const scope = requireScope(actor, "reservations", "create");

    const idempotencyKey =
      request.headers.get("idempotency-key") ||
      request.headers.get("x-idempotency-key") ||
      datos.idempotencyKey ||
      randomUUID();

    const correlationId = request.headers.get("x-correlation-id") || randomUUID();

    const expiresAt = datos.expiresAt ? new Date(datos.expiresAt) : null;

    const reserva = await crearReserva(reservasParaEscritura(), actor, scope, {
      dealId: datos.dealId,
      holdId: datos.holdId,
      status: datos.status,
      currency: datos.currency,
      totalCents: datos.totalCents,
      adjustmentCents: datos.adjustmentCents,
      depositRequiredCents: datos.depositRequiredCents,
      conditionsVersion: datos.conditionsVersion,
      conditionsDocumentId: datos.conditionsDocumentId,
      conditionsHash: datos.conditionsHash,
      expiresAt,
      reason: datos.reason,
      parties: datos.parties,
      units: datos.units,
      idempotencyKey,
      correlationId,
      source: "api-reservas",
    });

    return Response.json({ ok: true, reserva: dtoReserva(actor, reserva) }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function GET(request: Request) {
  try {
    const actor = await requireActor();
    const scope = requireScope(actor, "reservations", "view");

    const url = new URL(request.url);
    const rawFiltros: Record<string, unknown> = {};

    const dealIdParam = url.searchParams.get("dealId");
    if (dealIdParam) rawFiltros.dealId = Number(dealIdParam);

    const statusParam = url.searchParams.get("status");
    if (statusParam) rawFiltros.status = statusParam;

    const unitIdParam = url.searchParams.get("unitId");
    if (unitIdParam) rawFiltros.unitId = Number(unitIdParam);

    const idParam = url.searchParams.get("id");
    if (idParam) {
      rawFiltros.id = Number.isInteger(Number(idParam)) ? Number(idParam) : idParam;
    }

    const filtros = parseInput(filtrosReservasSchema, rawFiltros);
    const reservas = await listarReservas(reservasParaEscritura(), actor, scope, filtros);

    return Response.json({ ok: true, reservas: dtoListaReservas(actor, reservas) });
  } catch (error) {
    return errorResponse(error);
  }
}
