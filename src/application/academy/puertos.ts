/**
 * Puertos del módulo Academy (LMS Inmobiliario de Formación y Certificación de Brokers).
 * Cumple la regla firmada Q-C1-03: Moodle aporta la evidencia formativa (avance y notas);
 * el CRM persiste las solicitudes, exige revisión por un Administrador distinto del broker
 * y emite las constancias verificables con hash SHA-256 en servidor.
 */

import type { Actor } from "@/domain/rbac";

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

export type PerfilActorAcademy = {
  userId: number;
  fullName: string;
  email: string;
  roleSlug: string;
  moodleUserId: number | null;
  proyectosAsignados: Array<{
    id: number;
    name: string;
    zone: string | null;
  }>;
};

export type UsuarioCrmAcademy = {
  id: number;
  fullName: string;
  email: string;
  roleSlug: string;
  moodleUserId: number | null;
  proyectosCount: number;
};

export type EstadoSolicitudAcademy = "pendiente" | "aprobado" | "rechazado" | "revocado";
export type EstadoConstanciaAcademy = "vigente" | "revocada";

export type SolicitudRevisionAcademy = {
  id: number;
  publicId: string;
  brokerId: number;
  brokerNombre: string;
  brokerEmail: string;
  courseCode: string;
  courseName: string;
  moodleCourseId: number;
  progressPercent: number;
  gradePercent: number | null;
  evidenceHash: string;
  evidencePayload: Record<string, unknown>;
  status: EstadoSolicitudAcademy;
  decisionBy: number | null;
  decisionByNombre: string | null;
  decisionReason: string | null;
  decidedAt: Date | null;
  createdAt: Date;
};

export type ConstanciaAcademy = {
  id: number;
  publicId: string;
  reviewRequestId: number;
  brokerId: number;
  brokerNombre: string;
  brokerEmail: string;
  courseCode: string;
  courseName: string;
  verificationCode: string;
  cryptographicHash: string;
  evidenceSnapshot: Record<string, unknown>;
  approvedBy: number;
  approvedByNombre: string;
  status: EstadoConstanciaAcademy;
  revokedBy: number | null;
  revokedReason: string | null;
  revokedAt: Date | null;
  issuedAt: Date;
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

  obtenerPerfilActor(userId: number): Promise<PerfilActorAcademy | null>;
  listarUsuariosCrm(filtroRol?: string): Promise<UsuarioCrmAcademy[]>;
  guardarVinculoMoodle(localUserId: number, moodleUserId: number): Promise<void>;

  listarSolicitudesRevision(brokerIdFiltro?: number): Promise<SolicitudRevisionAcademy[]>;
  obtenerSolicitudRevisionPorId(solicitudId: number): Promise<SolicitudRevisionAcademy | null>;
  crearSolicitudRevision(
    actor: Actor,
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
  ): Promise<SolicitudRevisionAcademy>;
  decidirSolicitudRevision(
    actor: Actor,
    datos: {
      solicitudId: number;
      decision: "aprobado" | "rechazado";
      motivo: string;
    },
  ): Promise<{
    solicitud: SolicitudRevisionAcademy;
    constancia: ConstanciaAcademy | null;
  }>;
  revocarConstancia(
    actor: Actor,
    datos: {
      constanciaId: number;
      motivo: string;
    },
  ): Promise<ConstanciaAcademy>;
  listarConstancias(brokerIdFiltro?: number): Promise<ConstanciaAcademy[]>;
}
