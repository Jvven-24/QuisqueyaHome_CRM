import type {
  ItemAcademy,
  ChecklistItemAcademy,
  RepositorioAcademy,
  ResumenProgresoAcademy,
} from "./puertos.ts";

export class RepositorioAcademyEnMemoria implements RepositorioAcademy {
  private items: ItemAcademy[] = [
    {
      id: 1,
      title: "Manejo de objeciones en venta de planos",
      itemType: "session",
      description: "Técnicas avanzadas para resolver dudas sobre tiempos de entrega y constructoras.",
      durationMinutes: 48,
      videoUrl: "https://www.youtube.com/watch?v=mock_objeciones",
      position: 1,
      category: "Ventas",
      progressPercent: 0,
      isCompleted: false,
      completedAt: null,
      checklistItems: [],
    },
    {
      id: 2,
      title: "Leyes Inmobiliarias & Exenciones Confotur (Ley 158-01)",
      itemType: "session",
      description: "Guía completa del ahorro del 3% de transferencia y 1% de IPI para inversionistas.",
      durationMinutes: 55,
      videoUrl: "https://www.youtube.com/watch?v=mock_confotur",
      position: 2,
      category: "Leyes y Finanzas",
      progressPercent: 0,
      isCompleted: false,
      completedAt: null,
      checklistItems: [],
    },
    {
      id: 3,
      title: "Proceso de reserva y separación formal",
      itemType: "checklist",
      description: "Pasos operativos obligatorios antes de enviar el contrato de opción a compra.",
      durationMinutes: null,
      videoUrl: null,
      position: 3,
      category: "Operaciones",
      progressPercent: 0,
      isCompleted: false,
      completedAt: null,
      checklistItems: [
        { id: 101, academyItemId: 3, position: 1, label: "Confirmar disponibilidad de unidad con constructora", isCompleted: false },
        { id: 102, academyItemId: 3, position: 2, label: "Solicitar depósito de reserva (US$2,000 - US$5,000)", isCompleted: false },
        { id: 103, academyItemId: 3, position: 3, label: "Completar formulario Conozca a su Cliente (KYC / DGII)", isCompleted: false },
        { id: 104, academyItemId: 3, position: 4, label: "Verificar documento de identidad o pasaporte vigente", isCompleted: false },
        { id: 105, academyItemId: 3, position: 5, label: "Emitir recibo oficial de separación al cliente", isCompleted: false },
        { id: 106, academyItemId: 3, position: 6, label: "Bloquear unidad en el inventario del CRM", isCompleted: false },
      ],
    },
    {
      id: 4,
      title: "Procedimiento de alta y captación de alquileres",
      itemType: "checklist",
      description: "Requisitos para propiedades en renta de corto y largo plazo.",
      durationMinutes: null,
      videoUrl: null,
      position: 4,
      category: "Alquileres",
      progressPercent: 0,
      isCompleted: false,
      completedAt: null,
      checklistItems: [
        { id: 201, academyItemId: 4, position: 1, label: "Inspección fotográfica y de inventario de mobiliario", isCompleted: false },
        { id: 202, academyItemId: 4, position: 2, label: "Validar título de propiedad y autorización del propietario", isCompleted: false },
        { id: 203, academyItemId: 4, position: 3, label: "Fijar comisión (1 mes en largo plazo o % en vacacional)", isCompleted: false },
        { id: 204, academyItemId: 4, position: 4, label: "Publicar en catálogo interno de Quisqueya Home", isCompleted: false },
      ],
    },
  ];

  // Simulación de progresos por usuario: key = `${userId}_${itemId}`
  private userProgress: Map<string, { percent: number; isCompleted: boolean; completedAt: Date | null }> = new Map();
  // Simulación de checklist por usuario: key = `${userId}_${checklistItemId}`
  private userChecklist: Map<string, boolean> = new Map();

  async listarContenidos(userId: number, categoria?: string): Promise<ItemAcademy[]> {
    return this.items
      .filter((item) => !categoria || item.category.toLowerCase() === categoria.toLowerCase())
      .map((item) => {
        const prog = this.userProgress.get(`${userId}_${item.id}`) || {
          percent: 0,
          isCompleted: false,
          completedAt: null,
        };

        const checklistItems = item.checklistItems.map((c) => ({
          ...c,
          isCompleted: this.userChecklist.get(`${userId}_${c.id}`) || false,
        }));

        return {
          ...item,
          progressPercent: prog.percent,
          isCompleted: prog.isCompleted,
          completedAt: prog.completedAt,
          checklistItems,
        };
      });
  }

  async obtenerContenidoPorId(userId: number, itemId: number): Promise<ItemAcademy | null> {
    const item = this.items.find((i) => i.id === itemId);
    if (!item) return null;

    const prog = this.userProgress.get(`${userId}_${item.id}`) || {
      percent: 0,
      isCompleted: false,
      completedAt: null,
    };

    const checklistItems = item.checklistItems.map((c) => ({
      ...c,
      isCompleted: this.userChecklist.get(`${userId}_${c.id}`) || false,
    }));

    return {
      ...item,
      progressPercent: prog.percent,
      isCompleted: prog.isCompleted,
      completedAt: prog.completedAt,
      checklistItems,
    };
  }

  async actualizarProgreso(
    userId: number,
    itemId: number,
    progressPercent: number,
    isCompleted: boolean,
  ): Promise<{ progressPercent: number; isCompleted: boolean }> {
    const item = this.items.find((i) => i.id === itemId);
    if (!item) throw new Error("Contenido de Academy no encontrado.");

    const percent = Math.min(100, Math.max(0, progressPercent));
    const completed = isCompleted || percent === 100;
    const completedAt = completed ? new Date() : null;

    this.userProgress.set(`${userId}_${itemId}`, {
      percent,
      isCompleted: completed,
      completedAt,
    });

    return { progressPercent: percent, isCompleted: completed };
  }

  async marcarPasoChecklist(
    userId: number,
    checklistItemId: number,
    isCompleted: boolean,
  ): Promise<boolean> {
    let encontrado: ChecklistItemAcademy | undefined;
    for (const item of this.items) {
      const match = item.checklistItems.find((c) => c.id === checklistItemId);
      if (match) {
        encontrado = match;
        break;
      }
    }
    if (!encontrado) throw new Error("Paso de checklist no encontrado.");

    this.userChecklist.set(`${userId}_${checklistItemId}`, isCompleted);

    // Recalcular el porcentaje del checklist del item padre
    const padre = this.items.find((i) => i.id === encontrado!.academyItemId)!;
    const pasos = padre.checklistItems;
    const completados = pasos.filter(
      (p) => this.userChecklist.get(`${userId}_${p.id}`) === true,
    ).length;
    const percent = Math.round((completados / pasos.length) * 100);
    const itemCompleted = completados === pasos.length;

    this.userProgress.set(`${userId}_${padre.id}`, {
      percent,
      isCompleted: itemCompleted,
      completedAt: itemCompleted ? new Date() : null,
    });

    return isCompleted;
  }

  async obtenerResumenProgreso(userId: number): Promise<ResumenProgresoAcademy> {
    const totalItems = this.items.length;
    if (totalItems === 0) return { totalItems: 0, completedItems: 0, percent: 0, isCertified: false };

    let completedItems = 0;
    for (const item of this.items) {
      const p = this.userProgress.get(`${userId}_${item.id}`);
      if (p?.isCompleted) completedItems++;
    }

    const percent = Math.round((completedItems / totalItems) * 100);
    const isCertified = percent === 100;

    return {
      totalItems,
      completedItems,
      percent,
      isCertified,
    };
  }
}
