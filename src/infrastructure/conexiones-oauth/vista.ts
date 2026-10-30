/** Modelo de presentación de una conexión (sin tokens) y su traducción de estados a español. */
import type { ProveedorId, ServicioId } from "./servicios.ts";
import { ProveedorError, ReconectarError } from "./tipos.ts";

export type EstadoConexion = "conectado" | "error" | "reconectar";

export type ConexionVista = {
  /** "oauth" = tabla oauth_connections; "calendar" = google_accounts (por usuario, flujo existente). */
  origen: "oauth" | "calendar";
  id: number;
  servicio: ServicioId;
  proveedor: ProveedorId;
  cuenta: string;
  estado: EstadoConexion;
  mensaje: string | null;
  resumen: string | null;
  verificadoEn: string | null;
  conectadaEn: string;
  /** Capacidades extra ya concedidas (p. ej. "enviar" en Gmail). */
  extras: string[];
  /** Solo Calendar: cuenta del propio administrador (única que puede desconectar aquí) y su dueño. */
  propia?: boolean;
  propietario?: string;
};

export function estadoDeFila(status: string): EstadoConexion {
  return status === "connected" ? "conectado" : status === "reauth" ? "reconectar" : "error";
}

/** Mensaje corto y seguro para el administrador; nunca copia el cuerpo del proveedor. */
export function mensajeError(e: unknown): string {
  if (e instanceof ReconectarError) return e.message;
  if (e instanceof ProveedorError) {
    if (e.status === 403) return `${e.proveedor} negó el acceso: falta habilitar la API o conceder el permiso.`;
    if (e.status === 429) return `${e.proveedor} limitó las solicitudes. Se reintentará más tarde.`;
    if (e.status >= 500) return `${e.proveedor} no respondió bien (${e.status}). Reintenta en unos minutos.`;
    return `${e.proveedor} rechazó la solicitud (${e.status}).`;
  }
  return "No se pudo comprobar la conexión.";
}

export const MOTIVOS_CALLBACK: Record<string, string> = {
  conectada: "Cuenta conectada correctamente.",
  cancelado: "Cancelaste la autorización. No se conectó ninguna cuenta.",
  "estado-invalido": "La solicitud expiró o no es válida. Vuelve a intentarlo.",
  "sin-codigo": "El proveedor no devolvió un código de autorización.",
  "permisos-incompletos": "Faltaron permisos obligatorios al autorizar. Conéctala de nuevo y marca todos.",
  "sin-configurar": "Faltan variables de entorno para este proveedor.",
  fallo: "No se pudo completar la conexión. Revisa los registros del servidor.",
};

export type EstadoTarjeta = "sin_conectar" | EstadoConexion;

/** Estado de la tarjeta de un servicio: gana lo que más urgente es (reconectar > error > conectado). */
export function estadoTarjeta(conexiones: readonly { estado: EstadoConexion }[]): EstadoTarjeta {
  if (conexiones.length === 0) return "sin_conectar";
  if (conexiones.some((c) => c.estado === "reconectar")) return "reconectar";
  if (conexiones.some((c) => c.estado === "error")) return "error";
  return "conectado";
}

export const ETIQUETA_TARJETA: Record<EstadoTarjeta, string> = {
  sin_conectar: "Sin conectar", conectado: "Conectado", error: "Con error", reconectar: "Reconectar",
};
