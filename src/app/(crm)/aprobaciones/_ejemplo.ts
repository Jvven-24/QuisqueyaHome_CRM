export type ApprovalKind = "descuento" | "hold" | "liquidacion" | "fusion";
export type Approval = { id: string; kind: ApprovalKind; title: string; detail: string; owner: string; date: string; };
export const APPROVAL_KINDS: readonly { id: ApprovalKind; label: string }[] = [
  { id: "descuento", label: "Descuentos" }, { id: "hold", label: "Holds" },
  { id: "liquidacion", label: "Liquidaciones" }, { id: "fusion", label: "Fusiones" },
];
export const APPROVAL_EXAMPLES: readonly Approval[] = [
  { id: "DEMO-01", kind: "descuento", title: "Revisar descuento comercial", detail: "Ejemplo de solicitud de excepción al precio de una unidad.", owner: "Equipo comercial · ejemplo", date: "Pendiente de revisión" },
  { id: "DEMO-02", kind: "hold", title: "Extender un hold de unidad", detail: "Ejemplo de prórroga de retención; requiere confirmar disponibilidad y vigencia.", owner: "Operaciones · ejemplo", date: "Requiere decisión" },
  { id: "DEMO-03", kind: "liquidacion", title: "Validar liquidación de comisión", detail: "Ejemplo de revisión de reparto y comprobantes antes de autorizar un pago.", owner: "Finanzas · ejemplo", date: "Pendiente de revisión" },
  { id: "DEMO-04", kind: "fusion", title: "Revisar fusión de contactos", detail: "Ejemplo de detección de duplicados; requiere elegir el registro que se conserva.", owner: "Equipo comercial · ejemplo", date: "Requiere decisión" },
];
