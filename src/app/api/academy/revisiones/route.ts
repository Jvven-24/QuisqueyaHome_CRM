/**
 * M13 · Academy — API de decisión administrativa sobre solicitudes de revisión
 * (aprobar / rechazar) y revocación de constancias emitidas.
 *
 * Cumple la regla firmada Q-C1-03:
 * - Solo un Administrador distinto del broker puede aprobar o revocar.
 * - El hash criptográfico SHA-256 se calcula en servidor sobre la evidencia de Moodle.
 * - Toda decisión y revocación se registra en `audit_log` mediante `auditar`.
 */

import { z } from "zod";
import {
  decidirRevisionCursoAcademy,
  revocarConstanciaAcademy,
} from "@/application/academy/comandos";
import { requireFullScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { academyRepositorio } from "@/infrastructure/contenedor/academy";
import { errorResponse, parseInput } from "@/infrastructure/http";

const decidirRevisionSchema = z.object({
  solicitudId: z.number().int().positive("El identificador de la solicitud es obligatorio."),
  decision: z.enum(["aprobado", "rechazado"]),
  motivo: z
    .string()
    .trim()
    .min(3, "Debes indicar un dictamen o motivo de al menos 3 caracteres.")
    .max(1000),
});

const revocarConstanciaSchema = z.object({
  constanciaId: z.number().int().positive("El identificador de la constancia es obligatorio."),
  motivo: z
    .string()
    .trim()
    .min(3, "Debes indicar un motivo de revocación de al menos 3 caracteres.")
    .max(1000),
});

export async function POST(request: Request) {
  try {
    const actor = await requireActor();
    requireFullScope(actor, "academy", "edit");

    const cuerpo = await request.json().catch(() => ({}));
    const parsed = parseInput(decidirRevisionSchema, cuerpo);
    const resultado = await academyRepositorio().ejecutar((repo) =>
      decidirRevisionCursoAcademy(repo, actor, {
        solicitudId: parsed.solicitudId,
        decision: parsed.decision,
        motivo: parsed.motivo,
      }),
    );

    return Response.json({
      ok: true,
      solicitud: resultado.solicitud,
      constancia: resultado.constancia,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const actor = await requireActor();
    requireFullScope(actor, "academy", "edit");

    const cuerpo = await request.json().catch(() => ({}));
    const parsed = parseInput(revocarConstanciaSchema, cuerpo);
    const constancia = await academyRepositorio().ejecutar((repo) =>
      revocarConstanciaAcademy(repo, actor, {
        constanciaId: parsed.constanciaId,
        motivo: parsed.motivo,
      }),
    );

    return Response.json({
      ok: true,
      constancia,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
