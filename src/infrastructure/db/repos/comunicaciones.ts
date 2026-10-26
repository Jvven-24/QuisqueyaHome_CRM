/**
 * Adaptador Drizzle para el módulo de Comunicaciones Multicanal.
 */

import { and, eq } from "drizzle-orm";
import type {
  PlantillaMensaje,
  RepositorioComunicaciones,
  EstadoCanal,
} from "../../../application/comunicaciones/puertos";
import type { CanalComunicacion } from "../../../domain/comunicaciones";
import { messageTemplates } from "../schema";
import type { Tx } from "./compartido";


export function repositorioComunicaciones(tx: Tx): RepositorioComunicaciones {
  return {
    async listarPlantillas(canal?: string, category?: string): Promise<PlantillaMensaje[]> {
      const condiciones = [];
      if (canal) {
        condiciones.push(eq(messageTemplates.channel, canal));
      }
      if (category) {
        condiciones.push(eq(messageTemplates.category, category));
      }

      const filas = await tx
        .select()
        .from(messageTemplates)
        .where(condiciones.length > 0 ? and(...condiciones) : undefined)
        .orderBy(messageTemplates.id);

      return filas.map((f) => ({
        id: f.id,
        name: f.name,
        category: f.category,
        channel: f.channel as CanalComunicacion,
        body: f.body,
        variables: f.variables ? (JSON.parse(f.variables) as string[]) : [],
        isActive: f.isActive,
        createdAt: f.createdAt,
        updatedAt: f.updatedAt,
      }));
    },

    async obtenerPlantillaPorId(id: number): Promise<PlantillaMensaje | null> {
      const [fila] = await tx
        .select()
        .from(messageTemplates)
        .where(eq(messageTemplates.id, id));

      if (!fila) return null;

      return {
        id: fila.id,
        name: fila.name,
        category: fila.category,
        channel: fila.channel as CanalComunicacion,
        body: fila.body,
        variables: fila.variables ? (JSON.parse(fila.variables) as string[]) : [],
        isActive: fila.isActive,
        createdAt: fila.createdAt,
        updatedAt: fila.updatedAt,
      };
    },

    async crearPlantilla(
      datos: Omit<PlantillaMensaje, "id" | "createdAt" | "updatedAt">,
    ): Promise<PlantillaMensaje> {
      const [insertada] = await tx
        .insert(messageTemplates)
        .values({
          name: datos.name,
          category: datos.category,
          channel: datos.channel,
          body: datos.body,
          variables: JSON.stringify(datos.variables),
          isActive: datos.isActive,
        })
        .returning();

      if (!insertada) {
        throw new Error("No se pudo crear la plantilla");
      }

      return {
        id: insertada.id,
        name: insertada.name,
        category: insertada.category,
        channel: insertada.channel as CanalComunicacion,
        body: insertada.body,
        variables: datos.variables,
        isActive: insertada.isActive,
        createdAt: insertada.createdAt,
        updatedAt: insertada.updatedAt,
      };
    },

    async actualizarPlantilla(
      id: number,
      datos: Partial<Omit<PlantillaMensaje, "id" | "createdAt" | "updatedAt">>,
    ): Promise<PlantillaMensaje> {
      const valores: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      if (datos.name !== undefined) valores.name = datos.name;
      if (datos.category !== undefined) valores.category = datos.category;
      if (datos.channel !== undefined) valores.channel = datos.channel;
      if (datos.body !== undefined) valores.body = datos.body;
      if (datos.variables !== undefined) valores.variables = JSON.stringify(datos.variables);
      if (datos.isActive !== undefined) valores.isActive = datos.isActive;

      const [actualizada] = await tx
        .update(messageTemplates)
        .set(valores)
        .where(eq(messageTemplates.id, id))
        .returning();

      if (!actualizada) {
        throw new Error(`Plantilla con id ${id} no encontrada.`);
      }

      return {
        id: actualizada.id,
        name: actualizada.name,
        category: actualizada.category,
        channel: actualizada.channel as CanalComunicacion,
        body: actualizada.body,
        variables: actualizada.variables ? (JSON.parse(actualizada.variables) as string[]) : [],
        isActive: actualizada.isActive,
        createdAt: actualizada.createdAt,
        updatedAt: actualizada.updatedAt,
      };
    },

    async obtenerEstadosCanales(): Promise<EstadoCanal[]> {
      // No hay mediciones persistidas ni sonda de proveedor: no fabricar salud ni tarifas.
      return [];
    },
  };
}
