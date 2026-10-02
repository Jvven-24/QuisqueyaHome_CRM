/**
 * Adaptador de proyectos para R3.4 (`src/application/proyectos/puertos.ts`).
 * SQL calcado de las rutas M5/M6; `visibleRows` sigue siendo el único filtro
 * de alcance y cada actualización se construye campo por campo.
 */
import { and, eq, isNull, like, or } from "drizzle-orm";
import type { Db } from "../client";
import type { DatosFase, DatosProyecto, DatosUnidad, ReposProyectos, RepositorioProyectos } from "../../../application/proyectos/puertos";
import { visibleRows } from "../../rbac-filter";
import { constructionPhases, files, projects, units } from "../schema";
import { auditoriaDrizzle, type Tx } from "./compartido";
import { slugify } from "../../../domain/slug";

type Ejecutor = Pick<Tx | Db, "select" | "insert" | "update" | "delete">;
type ProjectType = NonNullable<typeof projects.$inferInsert.projectType>;
type OperationType = NonNullable<typeof units.$inferInsert.operationType>;
type PricePeriod = NonNullable<typeof units.$inferInsert.pricePeriod>;
type UnitStatus = NonNullable<typeof units.$inferInsert.status>;
type PhaseStatus = NonNullable<typeof constructionPhases.$inferInsert.status>;
type FileVisibility = NonNullable<typeof files.$inferInsert.visibility>;

export function repositorioProyectos(ejecutor: Ejecutor): RepositorioProyectos {
  return {
    async proyectoVisible(actor, alcance, id, bloquear = false) {
      const consulta = ejecutor.select().from(projects).where(and(eq(projects.id, id), visibleRows(actor, alcance, projects.brokerId, projects.deletedAt))).limit(1);
      const [fila] = await (bloquear ? consulta.for("update") : consulta);
      return fila;
    },
    async crear(datos: DatosProyecto & { slug: string; createdBy: number; updatedBy: number }) {
      const base = slugify(datos.name) || "proyecto";
      const existentes = await ejecutor.select({ slug: projects.slug }).from(projects).where(and(isNull(projects.deletedAt), or(like(projects.slug, base), like(projects.slug, `${base}-%`))));
      const slug = existentes.length === 0 ? base : `${base}-${existentes.length + 1}`;
      const [fila] = await ejecutor.insert(projects).values({
        name: datos.name,
        slug,
        zone: datos.zone ?? null,
        projectType: datos.projectType as ProjectType,
        operationType: datos.operationType as OperationType,
        developer: datos.developer ?? null,
        description: datos.description ?? null,
        startDate: datos.startDate ?? null,
        estimatedDeliveryDate: datos.estimatedDeliveryDate ?? null,
        currency: datos.currency,
        internalPriceCents: datos.internalPriceCents ?? null,
        publicRangeMinCents: datos.publicRangeMinCents ?? null,
        publicRangeMaxCents: datos.publicRangeMaxCents ?? null,
        progressPercent: datos.progressPercent ?? 0,
        brokerId: datos.brokerId ?? null,
        createdBy: datos.createdBy,
        updatedBy: datos.updatedBy,
      }).returning();
      return fila!;
    },
    async actualizar(id, cambios) {
      const set: Partial<typeof projects.$inferInsert> = { updatedBy: cambios.updatedBy };
      if ("name" in cambios) set.name = cambios.name;
      if ("zone" in cambios) set.zone = cambios.zone;
      if ("projectType" in cambios) set.projectType = cambios.projectType as ProjectType;
      if ("operationType" in cambios) set.operationType = cambios.operationType as OperationType;
      if ("developer" in cambios) set.developer = cambios.developer;
      if ("description" in cambios) set.description = cambios.description;
      if ("startDate" in cambios) set.startDate = cambios.startDate;
      if ("estimatedDeliveryDate" in cambios) set.estimatedDeliveryDate = cambios.estimatedDeliveryDate;
      if ("currency" in cambios) set.currency = cambios.currency;
      if ("internalPriceCents" in cambios) set.internalPriceCents = cambios.internalPriceCents;
      if ("publicRangeMinCents" in cambios) set.publicRangeMinCents = cambios.publicRangeMinCents;
      if ("publicRangeMaxCents" in cambios) set.publicRangeMaxCents = cambios.publicRangeMaxCents;
      if ("progressPercent" in cambios) set.progressPercent = cambios.progressPercent;
      if ("brokerId" in cambios) set.brokerId = cambios.brokerId;
      if ("isPublished" in cambios) set.isPublished = cambios.isPublished;
      if ("isActive" in cambios) set.isActive = cambios.isActive;
      const [fila] = await ejecutor.update(projects).set(set).where(eq(projects.id, id)).returning();
      return fila!;
    },
    async marcarBorrado(id, cuando, actorId) {
      const [fila] = await ejecutor.update(projects).set({ deletedAt: cuando, updatedBy: actorId }).where(eq(projects.id, id)).returning();
      return fila!;
    },
    async unidadVisible(actor, alcance, projectId, unitId) {
      const [fila] = await ejecutor.select().from(units).innerJoin(projects, eq(units.projectId, projects.id)).where(and(eq(units.id, unitId), eq(units.projectId, projectId), visibleRows(actor, alcance, projects.brokerId, projects.deletedAt), isNull(units.deletedAt))).limit(1);
      return fila?.units;
    },
    async crearUnidad(datos: DatosUnidad) {
      const [fila] = await ejecutor.insert(units).values({
        projectId: datos.projectId,
        code: datos.code,
        unitType: datos.unitType,
        bedrooms: datos.bedrooms,
        bathrooms: datos.bathrooms,
        builtAreaM2: datos.builtAreaM2,
        operationType: datos.operationType as OperationType,
        pricePeriod: datos.pricePeriod as PricePeriod,
        realPriceCents: datos.realPriceCents,
        publicRangeMinCents: datos.publicRangeMinCents,
        publicRangeMaxCents: datos.publicRangeMaxCents,
        status: datos.status as UnitStatus,
        createdBy: datos.createdBy,
        updatedBy: datos.updatedBy,
      }).returning();
      return fila!;
    },
    async actualizarUnidad(id, cambios) {
      const set: Partial<typeof units.$inferInsert> = { updatedBy: cambios.updatedBy };
      if ("code" in cambios) set.code = cambios.code;
      if ("unitType" in cambios) set.unitType = cambios.unitType;
      if ("bedrooms" in cambios) set.bedrooms = cambios.bedrooms;
      if ("bathrooms" in cambios) set.bathrooms = cambios.bathrooms;
      if ("builtAreaM2" in cambios) set.builtAreaM2 = cambios.builtAreaM2;
      if ("operationType" in cambios) set.operationType = cambios.operationType as OperationType;
      if ("pricePeriod" in cambios) set.pricePeriod = cambios.pricePeriod as PricePeriod;
      if ("realPriceCents" in cambios) set.realPriceCents = cambios.realPriceCents;
      if ("publicRangeMinCents" in cambios) set.publicRangeMinCents = cambios.publicRangeMinCents;
      if ("publicRangeMaxCents" in cambios) set.publicRangeMaxCents = cambios.publicRangeMaxCents;
      if ("status" in cambios) set.status = cambios.status as UnitStatus;
      const [fila] = await ejecutor.update(units).set(set).where(eq(units.id, id)).returning();
      return fila!;
    },
    async marcarUnidadBorrada(id, cuando, actorId) {
      const [fila] = await ejecutor.update(units).set({ deletedAt: cuando, updatedBy: actorId }).where(eq(units.id, id)).returning();
      return fila!;
    },
    async fasesDelProyecto(projectId) {
      return ejecutor.select({ position: constructionPhases.position, progressPercent: constructionPhases.progressPercent }).from(constructionPhases).where(eq(constructionPhases.projectId, projectId));
    },
    async recalcularProgreso(projectId, porcentaje) {
      await ejecutor.update(projects).set({ progressPercent: porcentaje }).where(eq(projects.id, projectId));
    },
    async faseVisible(actor, alcance, projectId, faseId) {
      const proyecto = await this.proyectoVisible(actor, alcance, projectId);
      if (!proyecto) return undefined;
      const [fila] = await ejecutor.select().from(constructionPhases).where(and(eq(constructionPhases.id, faseId), eq(constructionPhases.projectId, projectId))).limit(1);
      return fila;
    },
    async crearFases(datos: readonly DatosFase[]) {
      return ejecutor.insert(constructionPhases).values(datos.map((dato) => ({
        projectId: dato.projectId,
        position: dato.position,
        title: dato.title,
        createdBy: dato.createdBy,
        updatedBy: dato.updatedBy,
      }))).returning();
    },
    async actualizarFase(id, cambios) {
      const set: Partial<typeof constructionPhases.$inferInsert> = { updatedBy: cambios.updatedBy };
      if ("title" in cambios) set.title = cambios.title;
      if ("period" in cambios) set.period = cambios.period;
      if ("status" in cambios) set.status = cambios.status as PhaseStatus;
      if ("progressPercent" in cambios) set.progressPercent = cambios.progressPercent;
      if ("statusDate" in cambios) set.statusDate = cambios.statusDate;
      if ("videoUrl" in cambios) set.videoUrl = cambios.videoUrl;
      if ("publicNote" in cambios) set.publicNote = cambios.publicNote;
      if ("responsibleId" in cambios) set.responsibleId = cambios.responsibleId;
      if ("isPublished" in cambios) set.isPublished = cambios.isPublished;
      if ("publishedAt" in cambios) set.publishedAt = cambios.publishedAt;
      const [fila] = await ejecutor.update(constructionPhases).set(set).where(eq(constructionPhases.id, id)).returning();
      return fila!;
    },
    async borrarFase(projectId, faseId) {
      await ejecutor.update(files).set({ deletedAt: new Date() }).where(and(eq(files.entityType, "construction_phase"), eq(files.entityId, faseId), isNull(files.deletedAt)));
      await ejecutor.delete(constructionPhases).where(and(eq(constructionPhases.id, faseId), eq(constructionPhases.projectId, projectId)));
    },
    async fotosDeFase(faseId) {
      return ejecutor.select().from(files).where(and(eq(files.entityType, "construction_phase"), eq(files.entityId, faseId), isNull(files.deletedAt)));
    },
    async crearFoto(datos) {
      const [fila] = await ejecutor.insert(files).values({
        entityType: "construction_phase",
        entityId: datos.entityId,
        fileType: datos.fileType,
        name: datos.name,
        url: datos.url,
        mimeType: datos.mimeType,
        sizeBytes: datos.sizeBytes,
        visibility: datos.visibility as FileVisibility,
        position: datos.position,
        uploadedBy: datos.uploadedBy,
      }).returning();
      return fila!;
    },
    async fotoVisible(faseId, fileId) {
      const [fila] = await ejecutor.select().from(files).where(and(eq(files.id, fileId), eq(files.entityType, "construction_phase"), eq(files.entityId, faseId), isNull(files.deletedAt))).limit(1);
      return fila;
    },
    async borrarFoto(fileId, cuando) {
      const [fila] = await ejecutor.update(files).set({ deletedAt: cuando }).where(eq(files.id, fileId)).returning();
      return fila!;
    },
  };
}

export function reposProyectos(tx: Tx): ReposProyectos {
  return { proyectos: repositorioProyectos(tx), auditoria: auditoriaDrizzle(tx) };
}
