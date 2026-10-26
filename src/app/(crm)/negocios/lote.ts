export type FilaPlan = { id: number; contactName: string; stageKind: string; stageId: number };
export function planificarLote(filas: FilaPlan[], plan: { accion: string; stageId: number | null; puedeEditar: boolean; detalle: string }) {
  return filas.map((f) => ({ id: f.id, contacto: f.contactName, motivo: !plan.puedeEditar ? "Omitido: permiso insuficiente." : f.stageKind !== "open" ? "Omitido: el negocio está cerrado." : plan.accion === "etapa" && f.stageId === plan.stageId ? "Omitido: ya está en la etapa elegida." : !plan.detalle.trim() || (plan.accion === "etapa" && !plan.stageId) ? "No enviado: completa los datos del plan." : "No enviado: falta el endpoint transaccional y su autorización por registro. Usa las acciones individuales disponibles." }));
}
