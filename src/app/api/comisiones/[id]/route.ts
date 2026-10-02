/**
 * M9 · Comisiones — transición de estado y reparto (`docs/F3_ANALISIS_Y_PLAN.md`
 * §3 hallazgo 6, decisión #36, issue #31).
 *
 * Mismo patrón que `api/contactos/[id]/route.ts`: `parseInput` → `requireActor`
 * + `requireScope` → caso de uso (`editarComision`: transacción con la fila
 * bloqueada y auditoría dentro) → `errorResponse`. `reaches` sobre `commissions.broker_id`
 * cubre el alcance `own`: un broker con `commissions:edit` (hoy nadie lo
 * tiene según `db/seed.sql`, pero la ruta no debe asumirlo) solo tocaría las
 * suyas.
 *
 * Las reglas de negocio —qué transición vale, cuándo se puede tocar el
 * reparto— viven en `domain/comision-estado.ts`, probadas aparte, y el caso de
 * uso las aplica; aquí solo se traduce el `ConflictError` a 409 vía `errorResponse`.
 */

import { z } from "zod";
import { editarComision, type EntradaEditarComision } from "@/application/comisiones/casos-de-uso";
import { NotFoundError } from "@/domain/errors";
import { requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { comisionesParaEscritura } from "@/infrastructure/contenedor/comisiones";
import { errorResponse, parseInput } from "@/infrastructure/http";

const EditarComisionInput = z
  .object({
    status: z.enum(["approved", "paid", "void"]).optional(),
    brokerShareBasisPoints: z.number().int().min(0).max(10_000).optional(),
  })
  .refine((datos) => datos.status !== undefined || datos.brokerShareBasisPoints !== undefined, {
    message: "Indica un nuevo estado o un nuevo reparto.",
    path: ["_"],
  });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params;
    const id = Number(idParam);
    if (!Number.isInteger(id) || id <= 0) throw new NotFoundError();

    const datos = parseInput(EditarComisionInput, await request.json().catch(() => ({})));
    const actor = await requireActor();
    const scope = requireScope(actor, "commissions", "edit");

    // Campo por campo y solo las claves presentes, nunca `...datos`.
    const entrada: EntradaEditarComision = {};
    if (datos.status !== undefined) entrada.status = datos.status;
    if (datos.brokerShareBasisPoints !== undefined) entrada.brokerShareBasisPoints = datos.brokerShareBasisPoints;

    const comision = await editarComision(comisionesParaEscritura(), actor, scope, id, entrada);

    return Response.json({ ok: true, comision });
  } catch (error) {
    return errorResponse(error);
  }
}
