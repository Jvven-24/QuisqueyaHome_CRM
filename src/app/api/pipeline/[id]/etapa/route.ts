/**
 * M3b · Pipeline — cambio de etapa (`docs/F1_ANALISIS_Y_PLAN.md` paso 6,
 * `MAPEO_FRONTEND_CRM.md` §10.1 y §10.2).
 *
 * Mismo patrón que el resto de F1: `parseInput` → `requireActor` +
 * `requireScope` → `transaction` con `auditar` dentro → `errorResponse`. La
 * pieza propia de este módulo es la resolución del `ContextoTransicion` que
 * pide `validarTransicion` (`domain/transicion-etapa.ts`) — cuatro consultas
 * que traducen el estado real del negocio a los booleanos que esa función
 * pura necesita, sin que ella tenga que saber qué es una `activities` o una
 * `deal_properties`.
 *
 * Si `etapaDestino.kind === "won"`, esto no es "un cambio de etapa más": se
 * delega en `cerrarNegocioGanado` (`./_cierre.ts`), que hace los ocho pasos de
 * §10.2 dentro de la misma `transaction()` abierta aquí.
 */

import { and, eq, inArray, isNull } from "drizzle-orm";
import { z } from "zod";
import { ConflictError, NotFoundError } from "@/domain/errors";
import { reaches, requireScope } from "@/domain/rbac";
import {
  validarTransicion,
  type ContextoTransicion,
  type Negocio,
} from "@/domain/transicion-etapa";
import { requireActor } from "@/infrastructure/auth/actor";
import { auditar } from "@/infrastructure/audit";
import { transaction } from "@/infrastructure/db/client";
import { activities, dealProperties, deals, dealStageHistory, pipelineStages } from "@/infrastructure/db/schema";
import { errorResponse, parseInput } from "@/infrastructure/http";
import { cerrarNegocioGanado } from "./_cierre";

const CambiarEtapaInput = z.object({
  stageId: z.coerce.number().int().positive(),
  /** Obligatorio cuando la etapa destino es `lost` — se valida más abajo, no aquí: Zod no conoce todavía el `kind` de la etapa. */
  lossReasonId: z.coerce.number().int().positive().optional(),
  lossComment: z.string().optional(),
  /** Monto final del cierre. Si no llega, se usa el que ya tenía el negocio (encargo, punto 4.1). */
  amountCents: z.coerce.number().int().nonnegative().optional(),
});

/**
 * Tipos de actividad que cuentan como "contacto" para el requisito de §10.1
 * (→ Contactado): una interacción real con el cliente, no una tarea pendiente
 * (`task`) ni una nota interna (`note`) que no implica que se le haya
 * hablado. Se documenta aquí porque es un criterio, no un dato del esquema.
 */
const TIPOS_ACTIVIDAD_DE_CONTACTO = ["call", "meeting", "whatsapp", "email"] as const;

type DealPropertyRow = typeof dealProperties.$inferSelect;

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params;
    const id = Number(idParam);
    if (!Number.isInteger(id) || id <= 0) throw new NotFoundError();

    const datos = parseInput(CambiarEtapaInput, await request.json().catch(() => ({})));
    const actor = await requireActor();
    const scope = requireScope(actor, "deals", "edit");

    const resultado = await transaction(async (tx) => {
      const [deal] = await tx.select().from(deals).where(eq(deals.id, id)).limit(1);
      if (!deal || deal.deletedAt) throw new NotFoundError();
      // Mismo criterio que `dentroDeAlcance` en `api/leads/[id]/convertir/route.ts`:
      // un id fuera del alcance del actor responde igual que uno inexistente.
      if (!reaches(actor, scope, deal.brokerId)) throw new NotFoundError();

      const [etapaActual] = await tx
        .select()
        .from(pipelineStages)
        .where(eq(pipelineStages.id, deal.stageId))
        .limit(1);
      if (!etapaActual) {
        throw new ConflictError("La etapa actual del negocio no existe en el embudo.");
      }

      const [etapaDestino] = await tx
        .select()
        .from(pipelineStages)
        .where(and(eq(pipelineStages.id, datos.stageId), eq(pipelineStages.isActive, true)))
        .limit(1);
      if (!etapaDestino) throw new NotFoundError("La etapa indicada no existe.");

      // --- Resolver el `ContextoTransicion` que pide `validarTransicion` ----
      const [actividadDeContacto] = await tx
        .select({ id: activities.id })
        .from(activities)
        .where(
          and(
            eq(activities.dealId, id),
            isNull(activities.deletedAt),
            eq(activities.status, "completed"),
            inArray(activities.activityType, TIPOS_ACTIVIDAD_DE_CONTACTO),
          ),
        )
        .limit(1);

      // La próxima acción vive en `deals.next_activity_id` (sin FK, decisión
      // #8): se resuelve la actividad que apunta, y solo cuenta si sigue
      // pendiente y trae responsable y fecha — una actividad ya completada o
      // cancelada no es una "próxima acción" vigente.
      let proximaAccion: ContextoTransicion["proximaAccion"] = null;
      if (deal.nextActivityId != null) {
        const [actividad] = await tx
          .select()
          .from(activities)
          .where(eq(activities.id, deal.nextActivityId))
          .limit(1);
        if (
          actividad &&
          !actividad.deletedAt &&
          actividad.status === "pending" &&
          actividad.assigneeId != null &&
          actividad.startsAt != null
        ) {
          proximaAccion = { responsableId: actividad.assigneeId, fecha: actividad.startsAt.toISOString() };
        }
      }

      const propiedades = await tx.select().from(dealProperties).where(eq(dealProperties.dealId, id));
      // La unidad principal exige `unitId` resuelto, no solo `isPrimary`: el
      // esquema permite un interés a nivel de proyecto sin unidad todavía
      // (`deal_properties.unit_id` nulable), y esa fila no alcanza para
      // marcar nada como `sold`/`reserved` en el paso 3 del cierre.
      const unidadPrincipal = propiedades.find(
        (fila): fila is DealPropertyRow & { unitId: number } => fila.isPrimary && fila.unitId != null,
      );

      const negocio: Negocio = {
        etapaActualKind: etapaActual.kind,
        // El monto y el motivo de pérdida se resuelven con el valor que trae
        // el body si viene, o el que ya tenía el negocio — así
        // `validarTransicion` valida el estado *después* de aplicar este
        // cambio, no el de antes de que el usuario lo pidiera.
        amountCents: datos.amountCents ?? deal.amountCents,
        probability: deal.probability,
        commissionBasisPoints: deal.commissionBasisPoints,
        expectedCloseDate: deal.expectedCloseDate,
        lossReasonId: datos.lossReasonId ?? deal.lossReasonId,
      };
      const contexto: ContextoTransicion = {
        tieneActividadDeContacto: Boolean(actividadDeContacto),
        proximaAccion,
        cantidadPropiedades: propiedades.length,
        tieneUnidadPrincipal: unidadPrincipal != null,
      };

      // No se duplica la validación aquí: si algo falta, esto lanza
      // `ConflictError` y el `catch` de abajo lo traduce a 409 con el mensaje
      // exacto que redactó `transicion-etapa.ts`.
      validarTransicion(negocio, { kind: etapaDestino.kind, position: etapaDestino.position }, contexto);

      // --- Cierre (won): delega en los ocho pasos de §10.2 ------------------
      if (etapaDestino.kind === "won") {
        // `validarTransicion` ya garantizó `tieneUnidadPrincipal` y
        // `amountCents != null`; estas dos comprobaciones son para que
        // TypeScript lo sepa también, no para volver a decidir nada.
        if (!unidadPrincipal) throw new ConflictError("Falta la unidad principal para cerrar el negocio.");
        if (negocio.amountCents == null) throw new ConflictError("Falta el monto final para cerrar el negocio.");

        return await cerrarNegocioGanado(tx, actor, {
          dealId: id,
          etapaDestino,
          unidadPrincipal,
          amountCentsFinal: negocio.amountCents,
        });
      }

      // No hace falta comprobar aquí que `datos.lossReasonId` venga cuando
      // `etapaDestino.kind === "lost"`: `negocio.lossReasonId` (arriba) ya es
      // `datos.lossReasonId ?? deal.lossReasonId`, y como un negocio recién
      // llegado a "lost" nunca trae `deal.lossReasonId` de antes,
      // `validarTransicion` ya lanzó el 409 exacto de §10.1 si no vino motivo.
      // Repetir la comprobación aquí sería código muerto: ya se probó
      // manualmente (ver informe de M3b) que el body sin `lossReasonId`
      // nunca llega a este punto.

      // --- Cambio simple de etapa (open intermedio, o lost con motivo) -----
      const [dealActualizado] = await tx
        .update(deals)
        .set({
          stageId: etapaDestino.id,
          stageChangedAt: new Date(),
          ...(etapaDestino.kind === "lost"
            ? { lossReasonId: datos.lossReasonId, lossComment: datos.lossComment ?? null }
            : {}),
          updatedBy: actor.userId,
        })
        .where(eq(deals.id, id))
        .returning();

      await tx.insert(dealStageHistory).values({
        dealId: id,
        fromStageId: etapaActual.id,
        toStageId: etapaDestino.id,
        changedBy: actor.userId,
      });

      await auditar(tx, actor, {
        accion: etapaDestino.kind === "lost" ? "marcar_perdido" : "cambiar_etapa",
        entidad: "deal",
        entidadId: id,
        antes: deal,
        despues: dealActualizado,
      });

      return { deal: dealActualizado };
    });

    return Response.json({ ok: true, ...resultado });
  } catch (error) {
    return errorResponse(error);
  }
}
