/**
 * Doble en memoria de los repositorios de R3.4.
 *
 * Imita `visibleRows` mediante `reaches`, conserva las filas borradas fuera
 * del alcance y es reversible para que la unidad de trabajo pueda deshacer
 * una transacción fallida. Las opciones de fallo hacen comprobable el orden
 * de operaciones sin levantar una base de datos.
 *
 * Referencias: `src/application/README.md` §4, `docs/R_ANALISIS_Y_PLAN.md` §7
 * (R3.4), decisiones #32, #33 y #41.
 */

import type { Actor, PermissionScope } from "../../domain/rbac.ts";
import { reaches } from "../../domain/rbac.ts";
import type { Reversible } from "../testing/reversible.ts";
import type {
  CambiosFase,
  CambiosProyecto,
  DatosFase,
  DatosProyecto,
  DatosUnidad,
  Fase,
  Foto,
  Proyecto,
  RepositorioProyectos,
  Unidad,
} from "./puertos.ts";

const FECHA_FIJA = new Date("2026-01-01T00:00:00Z");

export function proyectosEnMemoria(
  opciones: {
    proyectos?: readonly Proyecto[];
    unidades?: readonly Unidad[];
    fases?: readonly Fase[];
    fotos?: readonly Foto[];
    fallarAlCrearFotoCon?: Error;
  } = {},
): RepositorioProyectos &
  Reversible & {
    readonly proyectos: readonly Proyecto[];
    readonly unidades: readonly Unidad[];
    readonly fases: readonly Fase[];
    readonly fotos: readonly Foto[];
  } {
  let proyectos = [...(opciones.proyectos ?? [])];
  let unidades = [...(opciones.unidades ?? [])];
  let fases = [...(opciones.fases ?? [])];
  let fotos = [...(opciones.fotos ?? [])];
  let siguienteProyecto = Math.max(0, ...proyectos.map((fila) => fila.id)) + 1;
  let siguienteUnidad = Math.max(0, ...unidades.map((fila) => fila.id)) + 1;
  let siguienteFase = Math.max(0, ...fases.map((fila) => fila.id)) + 1;
  let siguienteFoto = Math.max(0, ...fotos.map((fila) => fila.id)) + 1;

  function proyectoVisible(
    actor: Actor,
    alcance: PermissionScope,
    id: number,
  ): Proyecto | undefined {
    return proyectos.find(
      (fila) =>
        fila.id === id &&
        fila.deletedAt === null &&
        reaches(actor, alcance, fila.brokerId),
    );
  }

  function indice<T extends { id: number }>(filas: readonly T[], id: number): number {
    const posicion = filas.findIndex((fila) => fila.id === id);
    if (posicion < 0) throw new Error(`proyectosEnMemoria: no existe ${id}.`);
    return posicion;
  }

  function reemplazarProyecto(id: number, cambios: Partial<Proyecto>): Proyecto {
    const posicion = indice(proyectos, id);
    const fila = { ...proyectos[posicion]!, ...cambios, updatedAt: FECHA_FIJA };
    proyectos = proyectos.map((actual, i) => (i === posicion ? fila : actual));
    return fila;
  }

  function proyectoDeUnidad(unitId: number, projectId: number): Unidad | undefined {
    return unidades.find(
      (fila) =>
        fila.id === unitId &&
        fila.projectId === projectId &&
        fila.deletedAt === null,
    );
  }

  return {
    get proyectos() {
      return proyectos;
    },
    get unidades() {
      return unidades;
    },
    get fases() {
      return fases;
    },
    get fotos() {
      return fotos;
    },
    async proyectoVisible(actor, alcance, id) {
      return proyectoVisible(actor, alcance, id);
    },
    async crear(datos: DatosProyecto & { slug: string; createdBy: number; updatedBy: number }) {
      const fila: Proyecto = {
        id: siguienteProyecto++,
        name: datos.name,
        slug: datos.slug,
        zone: datos.zone ?? null,
        projectType: datos.projectType ?? "residential",
        operationType: datos.operationType ?? "sale",
        developer: datos.developer ?? null,
        description: datos.description ?? null,
        startDate: datos.startDate ?? null,
        estimatedDeliveryDate: datos.estimatedDeliveryDate ?? null,
        progressPercent: datos.progressPercent ?? 0,
        currency: "USD",
        internalPriceCents: datos.internalPriceCents ?? null,
        publicRangeMinCents: datos.publicRangeMinCents ?? null,
        publicRangeMaxCents: datos.publicRangeMaxCents ?? null,
        brokerId: datos.brokerId ?? null,
        videoUrl: null,
        isPublished: false,
        isActive: true,
        createdAt: FECHA_FIJA,
        updatedAt: FECHA_FIJA,
        createdBy: datos.createdBy,
        updatedBy: datos.updatedBy,
        deletedAt: null,
      };
      proyectos = [...proyectos, fila];
      return fila;
    },
    async actualizar(id: number, cambios: CambiosProyecto & { updatedBy: number }) {
      return reemplazarProyecto(id, cambios);
    },
    async marcarBorrado(id, cuando, actorId) {
      return reemplazarProyecto(id, { deletedAt: cuando, updatedBy: actorId });
    },
    async unidadVisible(actor, alcance, projectId, unitId) {
      const proyecto = proyectoVisible(actor, alcance, projectId);
      return proyecto ? proyectoDeUnidad(unitId, projectId) : undefined;
    },
    async crearUnidad(datos: DatosUnidad) {
      const fila: Unidad = {
        id: siguienteUnidad++,
        projectId: datos.projectId,
        code: datos.code,
        unitType: datos.unitType ?? null,
        bedrooms: datos.bedrooms ?? null,
        bathrooms: datos.bathrooms ?? null,
        builtAreaM2: datos.builtAreaM2 ?? null,
        yardAreaM2: null,
        floorLevel: null,
        operationType: datos.operationType,
        pricePeriod: datos.pricePeriod,
        currency: "USD",
        realPriceCents: datos.realPriceCents ?? null,
        publicRangeMinCents: datos.publicRangeMinCents ?? null,
        publicRangeMaxCents: datos.publicRangeMaxCents ?? null,
        status: datos.status,
        brokerId: null,
        internalNotes: null,
        createdAt: FECHA_FIJA,
        updatedAt: FECHA_FIJA,
        createdBy: datos.createdBy,
        updatedBy: datos.updatedBy,
        deletedAt: null,
      };
      unidades = [...unidades, fila];
      return fila;
    },
    async actualizarUnidad(id, cambios) {
      const posicion = indice(unidades, id);
      const fila = { ...unidades[posicion]!, ...cambios, updatedAt: FECHA_FIJA };
      unidades = unidades.map((actual, i) => (i === posicion ? fila : actual));
      return fila;
    },
    async marcarUnidadBorrada(id, cuando, actorId) {
      const posicion = indice(unidades, id);
      const fila = {
        ...unidades[posicion]!,
        deletedAt: cuando,
        updatedBy: actorId,
        updatedAt: FECHA_FIJA,
      };
      unidades = unidades.map((actual, i) => (i === posicion ? fila : actual));
      return fila;
    },
    async fasesDelProyecto(projectId) {
      return fases
        .filter((fila) => fila.projectId === projectId)
        .map(({ position, progressPercent }) => ({ position, progressPercent }));
    },
    async recalcularProgreso(projectId, porcentaje) {
      reemplazarProyecto(projectId, { progressPercent: porcentaje });
    },
    async faseVisible(actor, alcance, projectId, faseId) {
      if (!proyectoVisible(actor, alcance, projectId)) return undefined;
      return fases.find((fila) => fila.id === faseId && fila.projectId === projectId);
    },
    async crearFases(datos: readonly DatosFase[]) {
      const nuevas = datos.map<Fase>((dato) => ({
        id: siguienteFase++,
        projectId: dato.projectId,
        position: dato.position,
        title: dato.title,
        period: null,
        status: "pending",
        progressPercent: 0,
        statusDate: null,
        videoUrl: null,
        publicNote: null,
        responsibleId: null,
        isPublished: false,
        publishedAt: null,
        createdAt: FECHA_FIJA,
        updatedAt: FECHA_FIJA,
        createdBy: dato.createdBy,
        updatedBy: dato.updatedBy,
      }));
      fases = [...fases, ...nuevas];
      return nuevas;
    },
    async actualizarFase(id, cambios: CambiosFase) {
      const posicion = indice(fases, id);
      const fila = { ...fases[posicion]!, ...cambios, updatedAt: FECHA_FIJA };
      fases = fases.map((actual, i) => (i === posicion ? fila : actual));
      return fila;
    },
    async borrarFase(projectId, faseId) {
      fases = fases.filter((fila) => !(fila.id === faseId && fila.projectId === projectId));
      fotos = fotos.map((fila) =>
        fila.entityId === faseId && fila.entityType === "construction_phase"
          ? { ...fila, deletedAt: FECHA_FIJA }
          : fila,
      );
    },
    async fotosDeFase(faseId) {
      return fotos.filter(
        (fila) =>
          fila.entityId === faseId &&
          fila.entityType === "construction_phase" &&
          fila.deletedAt === null,
      );
    },
    async crearFoto(datos) {
      if (opciones.fallarAlCrearFotoCon) throw opciones.fallarAlCrearFotoCon;
      const fila: Foto = {
        id: siguienteFoto++,
        entityType: datos.entityType,
        entityId: datos.entityId,
        fileType: datos.fileType,
        name: datos.name,
        url: datos.url,
        mimeType: datos.mimeType,
        sizeBytes: datos.sizeBytes,
        visibility: datos.visibility,
        position: datos.position,
        uploadedBy: datos.uploadedBy,
        createdAt: FECHA_FIJA,
        deletedAt: null,
      };
      fotos = [...fotos, fila];
      return fila;
    },
    async fotoVisible(faseId, fileId) {
      return fotos.find(
        (fila) =>
          fila.id === fileId &&
          fila.entityId === faseId &&
          fila.entityType === "construction_phase" &&
          fila.deletedAt === null,
      );
    },
    async borrarFoto(fileId, cuando) {
      const posicion = indice(fotos, fileId);
      const fila = { ...fotos[posicion]!, deletedAt: cuando };
      fotos = fotos.map((actual, i) => (i === posicion ? fila : actual));
      return fila;
    },
    instantanea() {
      const copia = { proyectos, unidades, fases, fotos };
      return () => {
        proyectos = copia.proyectos;
        unidades = copia.unidades;
        fases = copia.fases;
        fotos = copia.fotos;
      };
    },
  };
}
