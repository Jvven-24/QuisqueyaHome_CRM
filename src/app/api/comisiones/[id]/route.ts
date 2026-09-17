/**
 * M9 · Comisiones — transición de estado y reparto (`docs/F3_ANALISIS_Y_PLAN.md`
 * §3 hallazgo 6, decisión #36, issue #31).
 *
 * Mismo patrón que `api/contactos/[id]/route.ts`: `parseInput` → `requireActor`
 * + `requireScope` → `transaction` con la fila bloqueada (`for("update")`) y
 * `auditar` dentro → `errorResponse`. `reaches` sobre `commissions.broker_id`
 * cubre el alcance `own`: un broker con `commissions:edit` (hoy nadie lo
 * tiene según `db/seed.sql`, pero la ruta no debe asumirlo) solo tocaría las
 * suyas.
 *
 * Las reglas de negocio —qué transición vale, cuándo se puede tocar el
 * reparto— viven en `domain/comision-estado.ts`, probadas aparte; aquí solo
 * se aplican y se traduce el `ConflictError` a 409 vía `errorResponse`.
 */

import { eq } from "drizzle-orm";
import { z } from "zod";
import { calcularComision } from "@/domain/cierre-negocio";
import { validarRepartoEditable, validarTransicionComision } from "@/domain/comision-estado";
import { NotFoundError } from "@/domain/errors";
import { reaches, requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { auditar } from "@/infrastructure/audit";
import { transaction } from "@/infrastructure/db/client";
import { commissions, deals } from "@/infrastructure/db/schema";
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

    const comision = await transaction(async (tx) => {
      // `for("update", { of: commissions })` bloquea solo la fila de
      // `commissions` (mismo criterio que `_cierre.ts`): dos aprobaciones casi
      // simultáneas sobre la misma comisión no deben leer ambas el estado
      // viejo antes de decidir si la transición vale. El join a `deals` es
      // para el chequeo de abajo, no necesita su propio candado.
      const [bloqueada] = await tx
        .select({ comision: commissions, dealDeletedAt: deals.deletedAt })
        .from(commissions)
        .innerJoin(deals, eq(deals.id, commissions.dealId))
        .where(eq(commissions.id, id))
        .for("update", { of: commissions });
      // "No existe", "el negocio se borró" y "existe pero fuera de tu
      // alcance" responden igual (`domain/errors.ts`): un broker no debe
      // poder confirmar por la respuesta que la comisión de otro existe, ni
      // que existió un negocio detrás de una comisión ya sin uno vigente.
      if (!bloqueada || bloqueada.dealDeletedAt != null || !reaches(actor, scope, bloqueada.comision.brokerId)) {
        throw new NotFoundError();
      }
      const anterior = bloqueada.comision;

      const cambios: Partial<typeof commissions.$inferInsert> = { updatedBy: actor.userId };

      if (datos.status !== undefined) {
        validarTransicionComision(anterior.status, datos.status);
        cambios.status = datos.status;
        if (datos.status === "approved") {
          cambios.approvedBy = actor.userId;
          cambios.approvedAt = new Date();
        }
        if (datos.status === "paid") {
          cambios.paidAt = new Date();
        }
      }

      if (datos.brokerShareBasisPoints !== undefined) {
        // Se valida contra el estado *actual* de la fila, no contra el
        // `status` que este mismo body pudiera estar cambiando a la vez: la
        // UI nunca envía los dos juntos, y decidir un orden implícito aquí
        // solo escondería la regla.
        validarRepartoEditable(anterior.status);
        // El total no cambia (`saleAmountCents`/`commissionBasisPoints`
        // siguen siendo los del cierre): solo se recalcula cómo se reparte.
        const { brokerAmountCents, agencyAmountCents } = calcularComision({
          saleAmountCents: anterior.saleAmountCents,
          commissionBasisPoints: anterior.commissionBasisPoints,
          brokerShareBasisPoints: datos.brokerShareBasisPoints,
        });
        cambios.brokerShareBasisPoints = datos.brokerShareBasisPoints;
        cambios.agencyShareBasisPoints = 10_000 - datos.brokerShareBasisPoints;
        cambios.brokerAmountCents = brokerAmountCents;
        cambios.agencyAmountCents = agencyAmountCents;
      }

      const [fila] = await tx.update(commissions).set(cambios).where(eq(commissions.id, id)).returning();

      await auditar(tx, actor, {
        accion: "editar",
        entidad: "commission",
        entidadId: id,
        antes: anterior,
        despues: fila,
      });

      return fila;
    });

    return Response.json({ ok: true, comision });
  } catch (error) {
    return errorResponse(error);
  }
}
