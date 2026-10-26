import type { Actor } from "../../domain/rbac.ts";
import { camposNegocios } from "./consultas.ts";
import type { Negocio, PropiedadDeNegocio } from "./puertos.ts";

/** La misma política financiera de b1, whitelist para las filas de mutación. */
export function dtoMutacionNegocio(actor: Actor, n: Negocio) {
  const dto: Pick<Negocio, "id" | "contactId" | "brokerId" | "stageId" | "operationType" | "currency" | "probability" | "expectedCloseDate" | "closedAt" | "lossReasonId" | "lossComment"> & {
    amountCents?: number | null; commissionBasisPoints?: number | null;
  } = {
    id: n.id, contactId: n.contactId, brokerId: n.brokerId, stageId: n.stageId,
    operationType: n.operationType, currency: n.currency, probability: n.probability,
    expectedCloseDate: n.expectedCloseDate, closedAt: n.closedAt,
    lossReasonId: n.lossReasonId, lossComment: n.lossComment,
  };
  const campos = camposNegocios(actor);
  if (campos.monto) dto.amountCents = n.amountCents;
  if (campos.comision) dto.commissionBasisPoints = n.commissionBasisPoints;
  return dto;
}
export function dtoMutacionPropiedad(_actor: Actor, p: PropiedadDeNegocio) {
  return { id: p.id, projectId: p.projectId, unitId: p.unitId, isPrimary: p.isPrimary };
}
