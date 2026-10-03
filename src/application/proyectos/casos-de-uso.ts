/**
 * Casos de uso de proyectos, unidades, fases y fotos.
 *
 * La subida es una llamada de red y no puede vivir dentro de `BEGIN`: por eso
 * el puerto de Storage está fuera de la unidad de trabajo y este caso de uso
 * compensa a mano si falla el INSERT. La limpieza es de mejor esfuerzo y no
 * lanza nunca, para no tapar el error original de la base de datos.
 *
 * Las rutas de Storage se componen con ids ya validados, UUID y la extensión
 * del MIME permitido. El nombre del cliente solo es metadato (`name` y
 * `nombreVisible`); usarlo como ruta permitiría elegir dónde escribir en el
 * bucket. El avance es siempre el promedio definido en `domain/avance-obra.ts`.
 * Referencias: `src/application/README.md` §4, `docs/R_ANALISIS_Y_PLAN.md` §7,
 * decisiones #32, #33 y #41.
 */

import { ConflictError, NotFoundError, ValidationError } from "../../domain/errors.ts";
import {
  FASES_ESTANDAR,
  FOTO_MIME_EXTENSIONES,
  promedioAvance,
  validarFoto,
} from "../../domain/avance-obra.ts";
import type { Actor, PermissionScope } from "../../domain/rbac.ts";
import type { AlmacenamientoArchivos } from "../compartido/almacenamiento.ts";
import type { UnidadDeTrabajo } from "../compartido/unidad-de-trabajo.ts";
import type {
  CambiosFase,
  CambiosProyecto,
  CambiosUnidad,
  Fase,
  Foto,
  Proyecto,
  ReposProyectos,
  RepositorioProyectos,
  Unidad,
} from "./puertos.ts";

type Escritura = {
  proyectos: RepositorioProyectos;
  unidad: UnidadDeTrabajo<ReposProyectos>;
};

export type EntradaFoto = {
  archivos: readonly {
    contenido: Blob;
    tipoMime: string;
    nombreVisible: string;
    sizeBytes: number;
  }[];
  projectId: number;
  faseId: number;
  actorId: number;
};

export async function crearProyecto(
  deps: Escritura,
  actor: Actor,
  entrada: Parameters<RepositorioProyectos["crear"]>[0],
): Promise<Proyecto> {
  return deps.unidad.ejecutar(async ({ proyectos, auditoria }) => {
    const fila = await proyectos.crear(entrada);
    await auditoria.registrar(actor, {
      accion: "crear",
      entidad: "project",
      entidadId: fila.id,
      despues: fila,
    });
    return fila;
  });
}

export async function editarProyecto(
  deps: { unidad: UnidadDeTrabajo<ReposProyectos> },
  actor: Actor,
  alcance: PermissionScope,
  id: number,
  entrada: CambiosProyecto,
): Promise<Proyecto> {
  return deps.unidad.ejecutar(async ({ proyectos, auditoria }) => {
    const anterior = await proyectos.proyectoVisible(actor, alcance, id);
    if (!anterior) throw new NotFoundError();
    const fila = await proyectos.actualizar(id, {
      name: entrada.name,
      zone: entrada.zone,
      projectType: entrada.projectType,
      operationType: entrada.operationType,
      developer: entrada.developer,
      description: entrada.description,
      startDate: entrada.startDate,
      estimatedDeliveryDate: entrada.estimatedDeliveryDate,
      currency: entrada.currency,
      internalPriceCents: entrada.internalPriceCents,
      publicRangeMinCents: entrada.publicRangeMinCents,
      publicRangeMaxCents: entrada.publicRangeMaxCents,
      progressPercent: entrada.progressPercent,
      brokerId: entrada.brokerId,
      isPublished: entrada.isPublished,
      isActive: entrada.isActive,
      updatedBy: actor.userId,
    });
    await auditoria.registrar(actor, {
      accion: "editar",
      entidad: "project",
      entidadId: id,
      antes: anterior,
      despues: fila,
    });
    return fila;
  });
}

export async function borrarProyecto(
  deps: { unidad: UnidadDeTrabajo<ReposProyectos> },
  actor: Actor,
  alcance: PermissionScope,
  id: number,
): Promise<void> {
  await deps.unidad.ejecutar(async ({ proyectos, auditoria }) => {
    const anterior = await proyectos.proyectoVisible(actor, alcance, id);
    if (!anterior) throw new NotFoundError();
    const fila = await proyectos.marcarBorrado(id, new Date(), actor.userId);
    await auditoria.registrar(actor, {
      accion: "eliminar",
      entidad: "project",
      entidadId: id,
      antes: anterior,
      despues: fila,
    });
  });
}

export async function crearUnidad(
  deps: Escritura,
  actor: Actor,
  alcance: PermissionScope,
  entrada: Parameters<RepositorioProyectos["crearUnidad"]>[0],
): Promise<Unidad> {
  return deps.unidad.ejecutar(async ({ proyectos, auditoria }) => {
    if (!await proyectos.proyectoVisible(actor, alcance, entrada.projectId)) {
      throw new NotFoundError("El proyecto indicado no existe.");
    }
    const fila = await proyectos.crearUnidad(entrada);
    await auditoria.registrar(actor, {
      accion: "crear",
      entidad: "unit",
      entidadId: fila.id,
      despues: fila,
    });
    return fila;
  });
}

export async function editarUnidad(
  deps: { unidad: UnidadDeTrabajo<ReposProyectos> },
  actor: Actor,
  alcance: PermissionScope,
  projectId: number,
  id: number,
  entrada: CambiosUnidad,
): Promise<Unidad> {
  return deps.unidad.ejecutar(async ({ proyectos, auditoria }) => {
    const anterior = await proyectos.unidadVisible(actor, alcance, projectId, id);
    if (!anterior) throw new NotFoundError();
    const fila = await proyectos.actualizarUnidad(id, entrada);
    await auditoria.registrar(actor, {
      accion: "editar",
      entidad: "unit",
      entidadId: id,
      antes: anterior,
      despues: fila,
    });
    return fila;
  });
}

export async function borrarUnidad(
  deps: { unidad: UnidadDeTrabajo<ReposProyectos> },
  actor: Actor,
  alcance: PermissionScope,
  projectId: number,
  id: number,
): Promise<void> {
  await deps.unidad.ejecutar(async ({ proyectos, auditoria }) => {
    const anterior = await proyectos.unidadVisible(actor, alcance, projectId, id);
    if (!anterior) throw new NotFoundError();
    const fila = await proyectos.marcarUnidadBorrada(id, new Date(), actor.userId);
    await auditoria.registrar(actor, {
      accion: "eliminar",
      entidad: "unit",
      entidadId: id,
      antes: anterior,
      despues: fila,
    });
  });
}

async function recalcular(proyectos: RepositorioProyectos, projectId: number): Promise<void> {
  const filas = await proyectos.fasesDelProyecto(projectId);
  await proyectos.recalcularProgreso(
    projectId,
    promedioAvance(filas.map((fila) => fila.progressPercent)),
  );
}

export async function crearFases(
  deps: Escritura,
  actor: Actor,
  alcance: PermissionScope,
  projectId: number,
  plantilla: boolean,
  title?: string,
): Promise<Fase[]> {
  return deps.unidad.ejecutar(async ({ proyectos, auditoria }) => {
    if (!await proyectos.proyectoVisible(actor, alcance, projectId, true)) {
      throw new NotFoundError();
    }
    const existentes = await proyectos.fasesDelProyecto(projectId);
    if (plantilla && existentes.length > 0) {
      throw new ConflictError(
        "El proyecto ya tiene fases: la plantilla solo aplica a un proyecto sin ninguna.",
      );
    }
    const base = plantilla
      ? FASES_ESTANDAR.map((nombre, i) => ({
          projectId,
          position: i + 1,
          title: nombre,
          createdBy: actor.userId,
          updatedBy: actor.userId,
        }))
      : [{
          projectId,
          position: Math.max(0, ...existentes.map((fase) => fase.position)) + 1,
          title: title!,
          createdBy: actor.userId,
          updatedBy: actor.userId,
        }];
    const filas = await proyectos.crearFases(base);
    for (const fila of filas) {
      await auditoria.registrar(actor, {
        accion: "crear",
        entidad: "construction_phase",
        entidadId: fila.id,
        despues: fila,
      });
    }
    await recalcular(proyectos, projectId);
    return filas;
  });
}

export async function editarFase(
  deps: { unidad: UnidadDeTrabajo<ReposProyectos> },
  actor: Actor,
  alcance: PermissionScope,
  projectId: number,
  id: number,
  entrada: CambiosFase,
): Promise<Fase> {
  return deps.unidad.ejecutar(async ({ proyectos, auditoria }) => {
    const anterior = await proyectos.faseVisible(actor, alcance, projectId, id);
    if (!anterior) throw new NotFoundError();
    const fila = await proyectos.actualizarFase(id, entrada);
    await auditoria.registrar(actor, {
      accion: "editar",
      entidad: "construction_phase",
      entidadId: id,
      antes: anterior,
      despues: fila,
    });
    if (entrada.progressPercent !== undefined) {
      await recalcular(proyectos, projectId);
    }
    return fila;
  });
}

export async function borrarFase(
  deps: { unidad: UnidadDeTrabajo<ReposProyectos> },
  actor: Actor,
  alcance: PermissionScope,
  projectId: number,
  id: number,
): Promise<void> {
  await deps.unidad.ejecutar(async ({ proyectos, auditoria }) => {
    const anterior = await proyectos.faseVisible(actor, alcance, projectId, id);
    if (!anterior) throw new NotFoundError();
    await proyectos.borrarFase(projectId, id);
    await auditoria.registrar(actor, {
      accion: "eliminar",
      entidad: "construction_phase",
      entidadId: id,
      antes: anterior,
    });
    await recalcular(proyectos, projectId);
  });
}

export async function subirFotos(
  deps: {
    proyectos: RepositorioProyectos;
    unidad: UnidadDeTrabajo<ReposProyectos>;
    almacenamiento: AlmacenamientoArchivos;
  },
  actor: Actor,
  alcance: PermissionScope,
  entrada: EntradaFoto,
): Promise<Foto[]> {
  if (!await deps.proyectos.faseVisible(actor, alcance, entrada.projectId, entrada.faseId)) {
    throw new NotFoundError();
  }
  for (const archivo of entrada.archivos) {
    const error = validarFoto(archivo.tipoMime, archivo.sizeBytes);
    if (error) throw new ValidationError(error, { foto: error });
  }

  const subidas: string[] = [];
  try {
    for (const archivo of entrada.archivos) {
      const ruta = `proyecto-${entrada.projectId}/fase-${entrada.faseId}/${crypto.randomUUID()}${FOTO_MIME_EXTENSIONES[archivo.tipoMime]}`;
      await deps.almacenamiento.subir({
        ruta,
        contenido: archivo.contenido,
        tipoMime: archivo.tipoMime,
        nombreVisible: archivo.nombreVisible,
      });
      subidas.push(ruta);
    }
    return await deps.unidad.ejecutar(async ({ proyectos, auditoria }) => {
      const fotos: Foto[] = [];
      for (let i = 0; i < subidas.length; i += 1) {
        const archivo = entrada.archivos[i]!;
        const fila = await proyectos.crearFoto({
          entityType: "construction_phase",
          entityId: entrada.faseId,
          fileType: null,
          name: archivo.nombreVisible,
          url: subidas[i]!,
          mimeType: archivo.tipoMime,
          sizeBytes: archivo.sizeBytes,
          visibility: "public",
          position: 0,
          uploadedBy: actor.userId,
        });
        await auditoria.registrar(actor, {
          accion: "crear",
          entidad: "file",
          entidadId: fila.id,
          despues: fila,
        });
        fotos.push(fila);
      }
      return fotos;
    });
  } catch (error) {
    try {
      await deps.almacenamiento.borrar(subidas);
    } catch {
      // La compensación es de mejor esfuerzo: conserva el error original.
    }
    throw error;
  }
}

export async function borrarFoto(
  deps: { unidad: UnidadDeTrabajo<ReposProyectos> },
  actor: Actor,
  alcance: PermissionScope,
  projectId: number,
  faseId: number,
  fileId: number,
): Promise<void> {
  await deps.unidad.ejecutar(async ({ proyectos, auditoria }) => {
    if (!await proyectos.faseVisible(actor, alcance, projectId, faseId)) {
      throw new NotFoundError();
    }
    const anterior = await proyectos.fotoVisible(faseId, fileId);
    if (!anterior) throw new NotFoundError();
    const fila = await proyectos.borrarFoto(fileId, new Date());
    await auditoria.registrar(actor, {
      accion: "eliminar",
      entidad: "file",
      entidadId: fileId,
      antes: anterior,
      despues: fila,
    });
  });
}
