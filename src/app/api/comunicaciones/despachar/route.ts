/**
 * M11 · Comunicaciones — API para despachar un mensaje multicanal.
 *
 * Enviar un mensaje a un tercero es una ESCRITURA con efecto externo, no una
 * lectura: exige `communications:create` con alcance `all` (hallazgo D21/D12
 * 2026-10-14: antes bastaba `view`). Con `all` y no `own` porque el destinatario
 * es texto libre y no se puede acotar a "registros propios"; hoy lo tienen
 * admin y asistente, no el broker. Cada despacho queda en `audit_log`.
 */

import { z } from "zod";
import { despacharMensajeAuditado } from "@/application/comunicaciones/casos-de-uso";
import { requireFullScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { auditoriaDespachos, proveedorDespacho } from "@/infrastructure/contenedor/comunicaciones";
import { errorResponse, parseInput } from "@/infrastructure/http";

const DespacharInput = z.object({
  canal: z.enum(["telegram", "whatsapp", "email", "sms", "webhook"]),
  destinatario: z.string().min(1, "El destinatario es obligatorio"),
  cuerpoOPlantilla: z.string().min(1, "El cuerpo del mensaje es obligatorio"),
  variables: z.record(z.string(), z.union([z.string(), z.number(), z.null()])).optional(),
  asunto: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: Request) {
  try {
    const actor = await requireActor();
    requireFullScope(actor, "communications", "create");

    const cuerpo = await request.json().catch(() => ({}));
    const datos = parseInput(DespacharInput, cuerpo);

    const proveedor = proveedorDespacho();
    const { resultado, auditado } = await despacharMensajeAuditado({ proveedor, auditoria: auditoriaDespachos() }, actor, {
      canal: datos.canal,
      destinatario: datos.destinatario,
      cuerpoOPlantilla: datos.cuerpoOPlantilla,
      variables: datos.variables,
      asunto: datos.asunto,
      metadata: {
        ...datos.metadata,
        solicitadoPorUserId: actor.userId,
      },
    });

    return Response.json({ ok: resultado.ok, resultado, auditado });
  } catch (error) {
    return errorResponse(error);
  }
}
