export type HoldSnapshot={expiresAt:string;version:number};
/** Proyección mínima: no conserva comprador, holder, motivo, precios ni negocio del DTO. */
export function visibleHoldSnapshots(input:unknown,unitId:number):HoldSnapshot[]{
  if(!input||typeof input!=="object"||!("ok"in input)||input.ok!==true||!("holds"in input)||!Array.isArray(input.holds))throw new Error("Respuesta de holds inválida.");
  const result:HoldSnapshot[]=[];
  for(const candidate of input.holds as unknown[]){
    if(!candidate||typeof candidate!=="object")throw new Error("Respuesta de holds inválida.");
    const row=candidate as Record<string,unknown>;
    if(!row||typeof row!=="object"||typeof row.status!=="string"||typeof row.expiresAt!=="string"||!Number.isFinite(Date.parse(row.expiresAt))||typeof row.rowVersion!=="number"||!Number.isSafeInteger(row.rowVersion)||!Array.isArray(row.units))throw new Error("Respuesta de holds inválida.");
    if(row.status==="activo"&&row.units.some((unit:unknown)=>unit&&typeof unit==="object"&&"unitId"in unit&&unit.unitId===unitId))result.push({expiresAt:row.expiresAt,version:row.rowVersion});
  }
  return result;
}
