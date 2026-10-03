/**
 * Endpoint de Cotización Confotur y Amortización Inmobiliaria
 *
 * Calcula los ahorros fiscales bajo la Ley 158-01 (Confotur RD) y el desglose
 * del plan de pagos durante construcción y contra entrega.
 */

import { z } from "zod";
import { generarCotizacionConfotur } from "@/application/confotur/casos-de-uso";
import { requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { errorResponse, parseInput } from "@/infrastructure/http";

const CotizadorConfoturInput = z.object({
  precioVentaCents: z.coerce.number().int().positive("El precio de venta debe ser mayor a 0."),
  moneda: z.string().optional().default("USD"),
  reservaCents: z.coerce.number().int().nonnegative().optional().default(200000),
  porcentajeInicial: z.coerce.number().min(0).max(100).optional().default(20),
  porcentajeConstruccion: z.coerce.number().min(0).max(100).optional().default(30),
  porcentajeContraEntrega: z.coerce.number().min(0).max(100).optional().default(50),
  mesesConstruccion: z.coerce.number().int().positive().optional().default(24),
  anosExencionIpi: z.coerce.number().int().positive().optional().default(15),
  roiAnualEstimado: z.coerce.number().min(0).max(1).optional().default(0.09),
});

export async function POST(request: Request) {
  try {
    const actor = await requireActor();
    requireScope(actor, "projects", "view");

    const cuerpo = await request.json().catch(() => ({}));
    const datos = parseInput(CotizadorConfoturInput, cuerpo);

    const resultado = generarCotizacionConfotur({
      precioVentaCents: datos.precioVentaCents,
      moneda: datos.moneda,
      reservaCents: datos.reservaCents,
      porcentajeInicial: datos.porcentajeInicial,
      porcentajeConstruccion: datos.porcentajeConstruccion,
      porcentajeContraEntrega: datos.porcentajeContraEntrega,
      mesesConstruccion: datos.mesesConstruccion,
      anosExencionIpi: datos.anosExencionIpi,
      roiAnualEstimado: datos.roiAnualEstimado,
    });

    return Response.json({ ok: true, cotizacion: resultado });
  } catch (error) {
    return errorResponse(error);
  }
}
