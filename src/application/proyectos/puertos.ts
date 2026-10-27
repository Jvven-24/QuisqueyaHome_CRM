/**
 * Casos de uso de proyectos, unidades, fases y fotos.
 *
 * Sigue la separación de `src/application/README.md` (§4 de
 * `docs/R_ANALISIS_Y_PLAN.md`, decisiones #32 y #33): la aplicación no conoce
 * Drizzle ni Supabase; Storage queda fuera de la unidad de trabajo porque es
 * una llamada de red y se compensa manualmente si falla el INSERT.
 */

import type { Actor, PermissionScope } from "../../domain/rbac.ts";
import type { Auditoria } from "../compartido/auditoria.ts";

export type Proyecto = {
  id: number;
  name: string;
  slug: string;
  zone: string | null;
  projectType: string;
  operationType: string;
  developer: string | null;
  description: string | null;
  startDate: string | null;
  estimatedDeliveryDate: string | null;
  progressPercent: number;
  currency: string;
  internalPriceCents: number | null;
  publicRangeMinCents: number | null;
  publicRangeMaxCents: number | null;
  brokerId: number | null;
  videoUrl: string | null;
  isPublished: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: number | null;
  updatedBy: number | null;
  deletedAt: Date | null;
};

export type Unidad = {
  id: number;
  projectId: number;
  code: string;
  unitType: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  builtAreaM2: number | null;
  yardAreaM2: number | null;
  floorLevel: number | null;
  operationType: string;
  pricePeriod: string;
  currency: string;
  realPriceCents: number | null;
  publicRangeMinCents: number | null;
  publicRangeMaxCents: number | null;
  status: string;
  brokerId: number | null;
  internalNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: number | null;
  updatedBy: number | null;
  deletedAt: Date | null;
};

export type Fase = {
  id: number;
  projectId: number;
  position: number;
  title: string;
  period: string | null;
  status: string;
  progressPercent: number;
  statusDate: string | null;
  videoUrl: string | null;
  publicNote: string | null;
  responsibleId: number | null;
  isPublished: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: number | null;
  updatedBy: number | null;
};

export type Foto = {
  id: number;
  entityType: string;
  entityId: number;
  fileType: string | null;
  name: string;
  url: string;
  mimeType: string | null;
  sizeBytes: number | null;
  visibility: string;
  position: number;
  uploadedBy: number | null;
  createdAt: Date;
  deletedAt: Date | null;
};

export type DatosProyecto = { name: string; zone?: string; projectType?: string; operationType?: string; developer?: string; description?: string; startDate?: string; estimatedDeliveryDate?: string; currency?: string; internalPriceCents?: number; publicRangeMinCents?: number; publicRangeMaxCents?: number; progressPercent?: number; brokerId?: number };
export type CambiosProyecto = { name?: string; zone?: string | null; projectType?: string; operationType?: string; developer?: string | null; description?: string | null; startDate?: string | null; estimatedDeliveryDate?: string | null; currency?: string; internalPriceCents?: number | null; publicRangeMinCents?: number | null; publicRangeMaxCents?: number | null; progressPercent?: number; brokerId?: number | null; isPublished?: boolean; isActive?: boolean };
export type DatosUnidad = Omit<Unidad, "id" | "projectId" | "yardAreaM2" | "floorLevel" | "currency" | "brokerId" | "internalNotes" | "createdAt" | "updatedAt" | "createdBy" | "updatedBy" | "deletedAt"> & { projectId: number; createdBy: number; updatedBy: number };
export type CambiosUnidad = Partial<Omit<DatosUnidad, "projectId" | "createdBy" | "updatedBy">> & { updatedBy: number };
export type DatosFase = { projectId: number; position: number; title: string; createdBy: number; updatedBy: number };
export type CambiosFase = { updatedBy: number; title?: string; period?: string | null; status?: string; progressPercent?: number; statusDate?: string | null; videoUrl?: string | null; publicNote?: string | null; responsibleId?: number | null; isPublished?: boolean; publishedAt?: Date | null };

export interface RepositorioProyectos {
  proyectoVisible(actor: Actor, alcance: PermissionScope, id: number, bloquear?: boolean): Promise<Proyecto | undefined>;
  crear(datos: DatosProyecto & { slug: string; createdBy: number; updatedBy: number }): Promise<Proyecto>;
  actualizar(id: number, cambios: CambiosProyecto & { updatedBy: number }): Promise<Proyecto>;
  marcarBorrado(id: number, cuando: Date, actorId: number): Promise<Proyecto>;
  unidadVisible(actor: Actor, alcance: PermissionScope, projectId: number, unitId: number): Promise<Unidad | undefined>;
  crearUnidad(datos: DatosUnidad): Promise<Unidad>;
  actualizarUnidad(id: number, cambios: CambiosUnidad): Promise<Unidad>;
  marcarUnidadBorrada(id: number, cuando: Date, actorId: number): Promise<Unidad>;
  fasesDelProyecto(projectId: number): Promise<{ position: number; progressPercent: number }[]>;
  recalcularProgreso(projectId: number, porcentaje: number): Promise<void>;
  faseVisible(actor: Actor, alcance: PermissionScope, projectId: number, faseId: number): Promise<Fase | undefined>;
  crearFases(datos: readonly DatosFase[]): Promise<Fase[]>;
  actualizarFase(id: number, cambios: CambiosFase): Promise<Fase>;
  borrarFase(id: number, faseId: number): Promise<void>;
  fotosDeFase(faseId: number): Promise<Foto[]>;
  crearFoto(datos: Omit<Foto, "id" | "createdAt" | "deletedAt">): Promise<Foto>;
  fotoVisible(faseId: number, fileId: number): Promise<Foto | undefined>;
  borrarFoto(fileId: number, cuando: Date): Promise<Foto>;
}

export type ReposProyectos = { proyectos: RepositorioProyectos; auditoria: Auditoria };
