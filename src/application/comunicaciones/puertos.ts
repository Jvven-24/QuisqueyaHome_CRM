/**
 * Puertos del módulo de Comunicaciones Multicanal (M11).
 */

import type { CanalComunicacion } from "../../domain/comunicaciones";

export type PlantillaMensaje = {
  id: number;
  name: string;
  category: string | null;
  channel: CanalComunicacion;
  body: string;
  variables: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type MensajeADespachar = {
  canal: CanalComunicacion;
  destinatario: string;
  asunto?: string;
  mensaje: string;
  metadata?: Record<string, unknown>;
};

export type ResultadoDespacho = {
  ok: boolean;
  canal: CanalComunicacion;
  mensajeId?: string;
  error?: string;
  enviadoAt: Date;
};

export type EstadoCanal = {
  canal: CanalComunicacion;
  activo: boolean;
  configurado: boolean;
  detalles: {
    nombreIdentificador?: string;
    webhookRegistrado?: boolean;
    costoPorMensajeUSD: number;
  };
};

export interface RepositorioComunicaciones {
  listarPlantillas(canal?: string, category?: string): Promise<PlantillaMensaje[]>;
  obtenerPlantillaPorId(id: number): Promise<PlantillaMensaje | null>;
  crearPlantilla(
    datos: Omit<PlantillaMensaje, "id" | "createdAt" | "updatedAt">,
  ): Promise<PlantillaMensaje>;
  actualizarPlantilla(
    id: number,
    datos: Partial<Omit<PlantillaMensaje, "id" | "createdAt" | "updatedAt">>,
  ): Promise<PlantillaMensaje>;
  obtenerEstadosCanales(): Promise<EstadoCanal[]>;
}

export interface ProveedorDespachoCanal {
  despachar(mensaje: MensajeADespachar): Promise<ResultadoDespacho>;
}
