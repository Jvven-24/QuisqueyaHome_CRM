/**
 * Puertos del módulo Academy (LMS Inmobiliario de Formación y Certificación de Brokers).
 */

export type TipoContenidoAcademy = "session" | "checklist" | "material";

export type ChecklistItemAcademy = {
  id: number;
  academyItemId: number;
  position: number;
  label: string;
  isCompleted: boolean;
};

export type ItemAcademy = {
  id: number;
  title: string;
  itemType: TipoContenidoAcademy;
  description: string | null;
  durationMinutes: number | null;
  videoUrl: string | null;
  position: number;
  category: string;
  progressPercent: number;
  isCompleted: boolean;
  completedAt: Date | null;
  checklistItems: ChecklistItemAcademy[];
};

export type ResumenProgresoAcademy = {
  totalItems: number;
  completedItems: number;
  percent: number;
};

export interface RepositorioAcademy {
  listarContenidos(userId: number, categoria?: string): Promise<ItemAcademy[]>;
  obtenerContenidoPorId(userId: number, itemId: number): Promise<ItemAcademy | null>;
  actualizarProgreso(
    userId: number,
    itemId: number,
    progressPercent: number,
    isCompleted: boolean,
  ): Promise<{ progressPercent: number; isCompleted: boolean }>;
  marcarPasoChecklist(
    userId: number,
    checklistItemId: number,
    isCompleted: boolean,
  ): Promise<boolean>;
  obtenerResumenProgreso(userId: number): Promise<ResumenProgresoAcademy>;
}
