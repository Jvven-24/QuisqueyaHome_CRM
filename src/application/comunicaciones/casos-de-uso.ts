/**
 * Casos de uso de Comunicaciones Multicanal (M11).
 */

import {
  extraerVariablesDePlantilla,
  renderizarPlantilla,
  type CanalComunicacion,
} from "../../domain/comunicaciones.ts";
import type {
  PlantillaMensaje,
  MensajeADespachar,
  ResultadoDespacho,
  EstadoCanal,
  RepositorioComunicaciones,
  ProveedorDespachoCanal,
} from "./puertos.ts";

export async function listarPlantillasMensajes(
  repo: RepositorioComunicaciones,
  canal?: string,
  categoria?: string,
): Promise<PlantillaMensaje[]> {
  return repo.listarPlantillas(canal, categoria);
}

export async function obtenerPlantillaMensaje(
  repo: RepositorioComunicaciones,
  id: number,
): Promise<PlantillaMensaje> {
  const plantilla = await repo.obtenerPlantillaPorId(id);
  if (!plantilla) {
    throw new Error(`Plantilla de mensaje con id ${id} no encontrada.`);
  }
  return plantilla;
}

export async function crearPlantillaMensaje(
  repo: RepositorioComunicaciones,
  datos: {
    name: string;
    category?: string | null;
    channel: CanalComunicacion;
    body: string;
    isActive?: boolean;
  },
): Promise<PlantillaMensaje> {
  if (!datos.name || datos.name.trim() === "") {
    throw new Error("El nombre de la plantilla es obligatorio.");
  }
  if (!datos.body || datos.body.trim() === "") {
    throw new Error("El cuerpo de la plantilla es obligatorio.");
  }

  const variables = extraerVariablesDePlantilla(datos.body);

  return repo.crearPlantilla({
    name: datos.name.trim(),
    category: datos.category ?? null,
    channel: datos.channel,
    body: datos.body.trim(),
    variables,
    isActive: datos.isActive ?? true,
  });
}

export async function actualizarPlantillaMensaje(
  repo: RepositorioComunicaciones,
  id: number,
  datos: Partial<{
    name: string;
    category: string | null;
    channel: CanalComunicacion;
    body: string;
    isActive: boolean;
  }>,
): Promise<PlantillaMensaje> {
  const updateData: Partial<Omit<PlantillaMensaje, "id" | "createdAt" | "updatedAt">> = {
    ...datos,
  };

  if (datos.body !== undefined) {
    updateData.variables = extraerVariablesDePlantilla(datos.body);
  }

  return repo.actualizarPlantilla(id, updateData);
}

export async function prepararYDespacharMensaje(
  proveedor: ProveedorDespachoCanal,
  datos: {
    canal: CanalComunicacion;
    destinatario: string;
    cuerpoOPlantilla: string;
    variables?: Record<string, string | number | null | undefined>;
    asunto?: string;
    metadata?: Record<string, unknown>;
  },
): Promise<ResultadoDespacho> {
  if (!datos.destinatario || datos.destinatario.trim() === "") {
    throw new Error("El destinatario es obligatorio.");
  }

  const mensajeRenderizado = datos.variables
    ? renderizarPlantilla(datos.cuerpoOPlantilla, datos.variables)
    : datos.cuerpoOPlantilla;

  const payload: MensajeADespachar = {
    canal: datos.canal,
    destinatario: datos.destinatario.trim(),
    mensaje: mensajeRenderizado,
    asunto: datos.asunto,
    metadata: datos.metadata,
  };

  return proveedor.despachar(payload);
}

export async function consultarEstadosCanales(
  repo: RepositorioComunicaciones,
): Promise<EstadoCanal[]> {
  return repo.obtenerEstadosCanales();
}
