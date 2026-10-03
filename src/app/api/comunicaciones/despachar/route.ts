/**
 * M11 · Comunicaciones — API para despachar un mensaje multicanal.
 */

import { z } from "zod";
import { prepararYDespacharMensaje } from "@/application/comunicaciones/casos-de-uso";
import { requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { proveedorDespacho } from "@/infrastructure/contenedor/comunicaciones";
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
    requireScope(actor, "communications", "view");

    const cuerpo = await request.json().catch(() => ({}));
    const datos = parseInput(DespacharInput, cuerpo);

    const proveedor = proveedorDespacho();
    const resultado = await prepararYDespacharMensaje(proveedor, {
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

    return Response.json({ ok: resultado.ok, resultado });
  } catch (error) {
    return errorResponse(error);
  }
}
