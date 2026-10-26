import type { LEAD_STATUSES } from "../../domain/catalogs.ts";

export const ETIQUETAS_ESTADO: Record<(typeof LEAD_STATUSES)[number], string> = {
  new: "Nuevo", assigned: "Asignado", contacted: "Contactado", converted: "Convertido", discarded: "Descartado",
};
