import type { Actor, PermissionScope } from "../../domain/rbac.ts";
import type { Auditoria } from "../compartido/auditoria.ts";

export type Actividad = {
  id: number;
  activityType: "task" | "call" | "meeting" | "note" | "whatsapp" | "email";
  title: string;
  description: string | null;
  contactId: number | null;
  dealId: number | null;
  projectId: number | null;
  assigneeId: number | null;
  startsAt: Date | null;
  endsAt: Date | null;
  isAllDay: boolean;
  location: string | null;
  meetingUrl: string | null;
  status: "pending" | "completed" | "cancelled";
  priority: "low" | "normal" | "high";
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: number | null;
  updatedBy: number | null;
  deletedAt: Date | null;
};

export type DatosNuevaActividad = {
  activityType: "task" | "call" | "meeting" | "note" | "whatsapp" | "email";
  title: string;
  description: string | null;
  contactId: number | null;
  dealId: number | null;
  projectId: number | null;
  assigneeId: number;
  startsAt: Date | null;
  endsAt: Date | null;
  isAllDay: boolean;
  location: string | null;
  meetingUrl: string | null;
  priority?: "low" | "normal" | "high";
  status: "pending" | "completed";
  completedAt: Date | null;
  createdBy: number;
  updatedBy: number;
};

export type CambiosActividad = {
  activityType?: "task" | "call" | "meeting" | "note" | "whatsapp" | "email";
  title?: string;
  description?: string | null;
  contactId?: number | null;
  dealId?: number | null;
  projectId?: number | null;
  assigneeId?: number;
  startsAt?: Date | null;
  endsAt?: Date | null;
  isAllDay?: boolean;
  location?: string | null;
  meetingUrl?: string | null;
  priority?: "low" | "normal" | "high";
  status?: "pending" | "completed" | "cancelled";
  completedAt?: Date | null;
  updatedBy: number;
};

export type EventoActividad = Pick<Actividad, "id" | "title" | "startsAt" | "endsAt" | "location"> & { startsAt: Date };

export interface RepositorioActividades {
  buscarVisible(actor: Actor, alcance: PermissionScope, id: number): Promise<Actividad | undefined>;
  buscarNegocioVisible(actor: Actor, alcance: PermissionScope, id: number): Promise<{ id: number } | undefined>;
  crear(datos: DatosNuevaActividad): Promise<Actividad>;
  actualizar(id: number, cambios: CambiosActividad): Promise<Actividad>;
  marcarBorrado(id: number, cuando: Date, actorId: number): Promise<Actividad>;
  actualizarProximaActividad(dealId: number, actividadId: number): Promise<void>;
  eventosIcs(actor: Actor, alcance: PermissionScope, desde: Date, hasta: Date): Promise<EventoActividad[]>;
}

export type ReposActividades = { actividades: RepositorioActividades; auditoria: Auditoria };
