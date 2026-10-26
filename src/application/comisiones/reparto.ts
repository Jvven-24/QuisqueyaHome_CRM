import { ValidationError } from "../../domain/errors.ts";
import { calcularComision } from "../../domain/cierre-negocio.ts";

export function prepararReparto(totalCents: number, porcentaje: string) {
  if (!/^\d+(?:\.\d{1,2})?$/.test(porcentaje) || Number(porcentaje) > 100) {
    throw new ValidationError("Revisa el reparto.", { brokerShareBasisPoints: "Escribe un porcentaje entre 0 y 100, con hasta dos decimales." });
  }
  const brokerShareBasisPoints = Math.round(Number(porcentaje) * 100);
  const agencyShareBasisPoints = 10000 - brokerShareBasisPoints;
  const montos = calcularComision({ saleAmountCents: totalCents, commissionBasisPoints: 10000, brokerShareBasisPoints, agencyShareBasisPoints });
  return { brokerShareBasisPoints, agencyShareBasisPoints, ...montos };
}
