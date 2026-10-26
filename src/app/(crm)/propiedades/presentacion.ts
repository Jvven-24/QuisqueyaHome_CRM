/** Disponibilidad solo cambia mediante M40; el formulario descriptivo nunca envía status. */
export function unitFormPayload(raw: Record<string, FormDataEntryValue>, options: { editing: boolean; canEditRealPrice: boolean; expectedVersion?: number }): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  for (const key of ["code", "unitType", "operationType", "pricePeriod"] as const) {
    if (typeof raw[key] !== "string") continue;
    const value = String(raw[key]).trim();
    if (value) data[key] = value;
    else if (options.editing && key === "unitType") data[key] = null;
  }
  for (const key of ["bedrooms", "bathrooms", "builtAreaM2"] as const) {
    if (typeof raw[key] !== "string") continue;
    const value = String(raw[key]).trim();
    if (value) data[key] = Number.isFinite(Number(value)) ? Number(value) : value;
    else if (options.editing) data[key] = null;
  }
  for (const [field, target] of [["publicRangeMin", "publicRangeMinCents"], ["publicRangeMax", "publicRangeMaxCents"], ["realPrice", "realPriceCents"]] as const) {
    if (field === "realPrice" && !options.canEditRealPrice) continue;
    if (typeof raw[field] !== "string") continue;
    const value = String(raw[field]).trim();
    if (value) { const cents = Math.round(Number(value) * 100); data[target] = Number.isSafeInteger(cents) ? cents : value; }
    else if (options.editing) data[target] = null;
  }
  if (options.editing && options.expectedVersion !== undefined) data.expectedVersion = options.expectedVersion;
  return data;
}

export function availabilitySummary(sold: number, reserved: number, unavailable: number): string {
  return sold + " " + (sold === 1 ? "vendida" : "vendidas") + " · " + reserved + " " + (reserved === 1 ? "reservada" : "reservadas") + " · " + unavailable + " " + (unavailable === 1 ? "no disponible" : "no disponibles");
}

export type PublicUnitSnapshot={code:string;floorLevel:number|null;status:string;currency:string;publicRangeMinCents:number|null;publicRangeMaxCents:number|null;rowVersion:number};
/** CSV exclusivamente comercial, con protección de fórmulas en etiquetas no confiables. */
export function publicInventoryCsv(rows:readonly PublicUnitSnapshot[],exportedAt:string):string{
 const cell=(value:unknown)=>{let text=String(value??"");if(/^[\s]*[=+@-]/.test(text))text="'"+text;return '"'+text.replaceAll('"','""')+'"';};
 return [["Exportado UTC","Unidad","Piso","Estado registrado","Moneda","Mínimo en centavos","Máximo en centavos","Versión"],...rows.map(row=>[exportedAt,row.code,row.floorLevel,row.status,row.currency,row.publicRangeMinCents,row.publicRangeMaxCents,row.rowVersion])].map(row=>row.map(cell).join(",")).join("\r\n");
}
