export type TareaFila = {
  id: number;
  title: string;
  description?: string | null;
  activityType: string;
  priority: string;
  status?: string;
  startsAt: Date | null;
  completedAt?: Date | null;
  location?: string | null;
  assigneeId: number | null;
  assigneeName: string | null;
  projectId?: number | null;
  projectName?: string | null;
  projectZone?: string | null;
  dealId?: number | null;
  dealTitle?: string | null;
  contactId?: number | null;
  contactName?: string | null;
};

export type CargaEquipoFila = {
  assigneeId: number | null;
  assigneeName: string | null;
  total: number;
};

export type PersonaOpcion = { id: number; fullName: string };

export type ProyectoOpcion = {
  id: number;
  name: string;
  zone: string | null;
  confoturEligible: boolean;
};

export type NegocioOpcion = {
  id: number;
  title: string;
  contactId: number | null;
  brokerId: number | null;
};

export type ContactoOpcion = {
  id: number;
  fullName: string;
  phone: string | null;
  brokerId: number | null;
};

export type Urgencia = "vencidas" | "hoy" | "proximas";
export type ModoVista = "lista" | "brokers" | "tablero" | "playbooks";
export type FiltroEstado = "pending" | "completed" | "all";

export const TAMANO_PAGINA = 25;

/**
 * Catálogo REA (Resources · Events · Agents) de Playbooks Inmobiliarios
 * inspirado en el modelo contable-operativo REA, prolinkinfo/RealEstateCRM y Follow Up Boss Action Plans.
 */
export type PlaybookInmobiliario = {
  id: string;
  categoriaRea: string;
  etiqueta: string;
  titulo: string;
  prioridad: "high" | "normal" | "low";
  slaDias: number;
  ubicacionSugerida: string;
  resumen: string;
  pasosChecklist: readonly string[];
  secuenciaMultiTarea: readonly {
    titulo: string;
    prioridad: "high" | "normal" | "low";
    offsetDias: number;
    pasos: readonly string[];
  }[];
};
