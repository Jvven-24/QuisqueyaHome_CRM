import { createHash } from "node:crypto";
import { ForbiddenError } from "../../domain/errors.ts";
import type { Actor } from "../../domain/rbac.ts";
import type {
  ChecklistItemAcademy,
  ConstanciaAcademy,
  ItemAcademy,
  PerfilActorAcademy,
  RepositorioAcademy,
  ResumenProgresoAcademy,
  SolicitudRevisionAcademy,
  UsuarioCrmAcademy,
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

  private userProgress: Map<string, { percent: number; isCompleted: boolean; completedAt: Date | null }> = new Map();
  private userChecklist: Map<string, boolean> = new Map();

  public solicitudes: SolicitudRevisionAcademy[] = [];
  public constancias: ConstanciaAcademy[] = [];
  public vinculosMoodle: Map<number, number> = new Map();
  public usuarios: UsuarioCrmAcademy[] = [
    {
      id: 1,
      fullName: "Admin de Prueba",
      email: "admin.prueba@quisqueyahome.do",
      roleSlug: "admin",
      moodleUserId: 6,
      proyectosCount: 0,
    },
    {
      id: 2,
      fullName: "Broker de Prueba",
      email: "broker.prueba@quisqueyahome.do",
      roleSlug: "broker",
      moodleUserId: 8,
      proyectosCount: 3,
    },
  ];

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
    if (totalItems === 0) return { totalItems: 0, completedItems: 0, percent: 0 };

    let completedItems = 0;
    for (const item of this.items) {
      const p = this.userProgress.get(`${userId}_${item.id}`);
      if (p?.isCompleted) completedItems++;
    }

    const percent = Math.round((completedItems / totalItems) * 100);
    return {
      totalItems,
      completedItems,
      percent,
    };
  }

  async obtenerPerfilActor(userId: number): Promise<PerfilActorAcademy | null> {
    const u = this.usuarios.find((x) => x.id === userId);
    if (!u) return null;
    return {
      userId: u.id,
      fullName: u.fullName,
      email: u.email,
      roleSlug: u.roleSlug,
      moodleUserId: u.moodleUserId,
      proyectosAsignados:
        u.roleSlug === "broker"
          ? [{ id: 1, name: "Olea at Cap Cana", zone: "Cap Cana" }]
          : [],
    };
  }

  async listarUsuariosCrm(filtroRol?: string): Promise<UsuarioCrmAcademy[]> {
    return this.usuarios.filter((u) => !filtroRol || u.roleSlug === filtroRol);
  }

  async guardarVinculoMoodle(localUserId: number, moodleUserId: number): Promise<void> {
    this.vinculosMoodle.set(localUserId, moodleUserId);
  }

  async listarSolicitudesRevision(brokerIdFiltro?: number): Promise<SolicitudRevisionAcademy[]> {
    return this.solicitudes.filter(
      (s) => brokerIdFiltro === undefined || s.brokerId === brokerIdFiltro,
    );
  }

  async obtenerSolicitudRevisionPorId(id: number): Promise<SolicitudRevisionAcademy | null> {
    return this.solicitudes.find((s) => s.id === id) ?? null;
  }

  async crearSolicitudRevision(
    _actor: Actor,
    datos: {
      brokerId: number;
      courseCode: string;
      courseName: string;
      moodleCourseId: number;
      progressPercent: number;
      gradePercent: number | null;
      evidenceHash: string;
      evidencePayload: Record<string, unknown>;
    },
  ): Promise<SolicitudRevisionAcademy> {
    const u = this.usuarios.find((x) => x.id === datos.brokerId);
    const nueva: SolicitudRevisionAcademy = {
      id: this.solicitudes.length + 1,
      publicId: `00000000-0000-4000-8000-${String(this.solicitudes.length + 1).padStart(12, "0")}`,
      brokerId: datos.brokerId,
      brokerNombre: u?.fullName ?? "Broker",
      brokerEmail: u?.email ?? "broker@quisqueyahome.do",
      courseCode: datos.courseCode,
      courseName: datos.courseName,
      moodleCourseId: datos.moodleCourseId,
      progressPercent: datos.progressPercent,
      gradePercent: datos.gradePercent,
      evidenceHash: datos.evidenceHash,
      evidencePayload: datos.evidencePayload,
      status: "pendiente",
      decisionBy: null,
      decisionByNombre: null,
      decisionReason: null,
      decidedAt: null,
      createdAt: new Date(),
    };
    this.solicitudes.push(nueva);
    return nueva;
  }

  async decidirSolicitudRevision(
    actor: Actor,
    datos: {
      solicitudId: number;
      decision: "aprobado" | "rechazado";
      motivo: string;
    },
  ) {
    const sol = this.solicitudes.find((s) => s.id === datos.solicitudId);
    if (!sol) throw new Error("Solicitud no encontrada");
    if (actor.userId === sol.brokerId) {
      throw new ForbiddenError(
        "Regla Q-C1-03: ningún usuario puede aprobar o decidir su propia solicitud de certificación.",
      );
    }
    sol.status = datos.decision;
    sol.decisionBy = actor.userId;
    sol.decisionByNombre = "Admin de Prueba";
    sol.decisionReason = datos.motivo;
    sol.decidedAt = new Date();

    let constancia: ConstanciaAcademy | null = null;
    if (datos.decision === "aprobado") {
      const snapshot = {
        solicitudPublicId: sol.publicId,
        brokerId: sol.brokerId,
        courseCode: sol.courseCode,
        evidenceHash: sol.evidenceHash,
        approvedBy: actor.userId,
      };
      const hash = createHash("sha256").update(JSON.stringify(snapshot)).digest("hex");
      constancia = {
        id: this.constancias.length + 1,
        publicId: `11111111-1111-4111-8111-${String(this.constancias.length + 1).padStart(12, "0")}`,
        reviewRequestId: sol.id,
        brokerId: sol.brokerId,
        brokerNombre: sol.brokerNombre,
        brokerEmail: sol.brokerEmail,
        courseCode: sol.courseCode,
        courseName: sol.courseName,
        verificationCode: `QHA-2026-000${sol.id}-${hash.slice(0, 6).toUpperCase()}`,
        cryptographicHash: hash,
        evidenceSnapshot: snapshot,
        approvedBy: actor.userId,
        approvedByNombre: "Admin de Prueba",
        status: "vigente",
        revokedBy: null,
        revokedReason: null,
        revokedAt: null,
        issuedAt: new Date(),
      };
      this.constancias.push(constancia);
    }
    return { solicitud: sol, constancia };
  }

  async revocarConstancia(
    actor: Actor,
    datos: { constanciaId: number; motivo: string },
  ): Promise<ConstanciaAcademy> {
    const cert = this.constancias.find((c) => c.id === datos.constanciaId);
    if (!cert) throw new Error("Constancia no encontrada");
    if (actor.userId === cert.brokerId) {
      throw new ForbiddenError("Regla Q-C1-03: prohibido autogestionar constancias.");
    }
    cert.status = "revocada";
    cert.revokedBy = actor.userId;
    cert.revokedReason = datos.motivo;
    cert.revokedAt = new Date();
    return cert;
  }

  async listarConstancias(brokerIdFiltro?: number): Promise<ConstanciaAcademy[]> {
    return this.constancias.filter(
      (c) => brokerIdFiltro === undefined || c.brokerId === brokerIdFiltro,
    );
  }
}
