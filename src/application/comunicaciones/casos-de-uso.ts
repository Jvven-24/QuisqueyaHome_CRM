import { normalizarTelefono } from "../../domain/telefono.ts";
import { ValidationError } from "../../domain/errors.ts";
/**
 * Casos de uso de Comunicaciones Multicanal (M11).
 */

import {
  requiereRevisionFiscal,
  enmascararDestinatario,
  extraerVariablesDePlantilla,
  renderizarPlantilla,
  sanitizarErrorDespacho,
  type CanalComunicacion,
} from "../../domain/comunicaciones.ts";
import type { Actor } from "../../domain/rbac.ts";
import type {
  AuditoriaDespachos,
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
  const updateData: Partial<Omit<PlantillaMensaje, "id" | "createdAt" | "updatedAt">> = {};
  if (datos.name !== undefined) {
    if (!datos.name.trim()) throw new ValidationError("El nombre es obligatorio.", { name: "Escribe el nombre de la plantilla." });
    updateData.name = datos.name.trim();
  }
  if (datos.body !== undefined) {
    if (!datos.body.trim()) throw new ValidationError("El cuerpo es obligatorio.", { body: "Escribe el cuerpo de la plantilla." });
    updateData.body = datos.body.trim();
  }
  if (datos.channel !== undefined) updateData.channel = datos.channel;
  if (datos.category !== undefined) updateData.category = datos.category;
  if (datos.isActive !== undefined) updateData.isActive = datos.isActive;

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

  if (!mensajeRenderizado.trim()) throw new ValidationError("Escribe el cuerpo del mensaje.");
  if (extraerVariablesDePlantilla(mensajeRenderizado).length) throw new ValidationError("Sustituye todas las variables por datos reales antes de enviar.");
  if (requiereRevisionFiscal(mensajeRenderizado)) throw new ValidationError("Contenido fiscal pendiente de revisión. El envío no está autorizado.");
  const telefono = datos.canal === "whatsapp" || datos.canal === "sms" ? normalizarTelefono(datos.destinatario).phone : null;
  if ((datos.canal === "whatsapp" || datos.canal === "sms") && !telefono) throw new ValidationError("Indica un teléfono válido con código de país.", { destinatario: "Indica un teléfono válido con código de país." });
  const payload: MensajeADespachar = {
    canal: datos.canal,
    destinatario: telefono ?? datos.destinatario.trim(),
    mensaje: mensajeRenderizado,
    asunto: datos.asunto,
    metadata: datos.metadata,
  };

  const resultado = await proveedor.despachar(payload);
  if (/^(?:(?:tg|wa)_)?sim_/i.test(resultado.mensajeId ?? "")) {
    return { ok: false, canal: datos.canal, error: "El canal usa simulación y no confirma un envío real. Revisa su configuración.", enviadoAt: resultado.enviadoAt };
  }
  return resultado;
}

/**
 * Despacho con rastro: quien llama ya comprobó el permiso de envío. Envía y
 * después registra quién, cuándo, por qué canal, a quién (enmascarado) y con
 * qué resultado. Si el proveedor lanza, el fallo también queda registrado y el
 * error se propaga. Si es la auditoría la que falla, el mensaje YA salió: no
 * se oculta ese hecho al llamador (`auditado: false`) ni se le pide reenviar.
 */
export async function despacharMensajeAuditado(
  deps: { proveedor: ProveedorDespachoCanal; auditoria: AuditoriaDespachos },
  actor: Actor,
  datos: Parameters<typeof prepararYDespacharMensaje>[1],
): Promise<{ resultado: ResultadoDespacho; auditado: boolean }> {
  const destinatarioEnmascarado = enmascararDestinatario(datos.canal, datos.destinatario);
  let resultado: ResultadoDespacho;
  try {
    resultado = await prepararYDespacharMensaje(deps.proveedor, datos);
  } catch (error) {
    await deps.auditoria.registrar(actor, {
      canal: datos.canal,
      destinatarioEnmascarado,
      ok: false,
      mensajeId: null,
      error: sanitizarErrorDespacho(error instanceof Error ? error.message : "Fallo del proveedor."),
      enviadoAt: new Date(),
    }).catch(() => undefined); // el error original del proveedor es el que importa
    throw error;
  }
  try {
    await deps.auditoria.registrar(actor, {
      canal: datos.canal,
      destinatarioEnmascarado,
      ok: resultado.ok,
      mensajeId: resultado.mensajeId ?? null,
      error: sanitizarErrorDespacho(resultado.error),
      enviadoAt: resultado.enviadoAt,
    });
    return { resultado, auditado: true };
  } catch {
    // Sin el detalle del error: puede arrastrar SQL o parámetros.
    console.error("comunicaciones: el mensaje se despachó pero no se pudo registrar en auditoría.");
    return { resultado, auditado: false };
  }
}

export async function consultarEstadosCanales(
  repo: RepositorioComunicaciones,
): Promise<EstadoCanal[]> {
  return repo.obtenerEstadosCanales();
}
