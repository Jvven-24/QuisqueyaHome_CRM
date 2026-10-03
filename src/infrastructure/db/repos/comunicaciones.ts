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

const PLANTILLAS_SEMILLA: Omit<PlantillaMensaje, "id" | "createdAt" | "updatedAt">[] = [
  {
    name: "Bienvenida y Disponibilidad (Telegram)",
    category: "Prospección",
    channel: "telegram",
    body: "¡Hola {nombre}! Gracias por tu interés en {proyecto}. Actualmente tenemos unidades disponibles desde US${precio_desde}. Soy {broker}, tu asesor asignado en Quisqueya Home. ¿Te gustaría coordinar una videollamada o visita al showroom?",
    variables: ["nombre", "proyecto", "precio_desde", "broker"],
    isActive: true,
  },
  {
    name: "Confirmación de Cita / Presentación",
    category: "Citas",
    channel: "whatsapp",
    body: "Hola {nombre}, le confirmo su cita para la presentación de {proyecto} el día {fecha_cita} a las {hora_cita}. Estaremos esperándole con los planos y detalles de inversión. Saludos de parte de {broker}.",
    variables: ["nombre", "proyecto", "fecha_cita", "hora_cita", "broker"],
    isActive: true,
  },
  {
    name: "Ficha Confotur & Amortización (Telegram)",
    category: "Financiero",
    channel: "telegram",
    body: "Estimado/a {nombre}, le comparto la corrida financiera para {proyecto}. Este desarrollo cuenta con los beneficios de la Ley 158-01 (Confotur): 0% impuesto de transferencia (ahorro 3%) y 0% IPI durante 15 años. Inicial estimado: {inicial_porcentaje}%. Quedo a su orden, {broker}.",
    variables: ["nombre", "proyecto", "inicial_porcentaje", "broker"],
    isActive: true,
  },
  {
    name: "Seguimiento de Reserva Formal",
    category: "Cierre",
    channel: "email",
    body: "Apreciado/a {nombre}, hemos reservado temporalmente la unidad de su interés en {proyecto}. Para formalizar la separación le recordamos enviar su documento de identidad y comprobante de reserva. Atentamente, {broker}.",
    variables: ["nombre", "proyecto", "broker"],
    isActive: true,
  },
];

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

      if (filas.length === 0 && !canal && !category) {
        // Sembrar plantillas por defecto si la tabla está vacía
        const sembradas: PlantillaMensaje[] = [];
        for (const semilla of PLANTILLAS_SEMILLA) {
          const [insertada] = await tx
            .insert(messageTemplates)
            .values({
              name: semilla.name,
              category: semilla.category,
              channel: semilla.channel,
              body: semilla.body,
              variables: JSON.stringify(semilla.variables),
              isActive: semilla.isActive,
            })
            .returning();

          if (!insertada) continue;

          sembradas.push({
            id: insertada.id,
            name: insertada.name,
            category: insertada.category,
            channel: insertada.channel as CanalComunicacion,
            body: insertada.body,
            variables: semilla.variables,
            isActive: insertada.isActive,
            createdAt: insertada.createdAt,
            updatedAt: insertada.updatedAt,
          });
        }
        return sembradas;
      }

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
      const tgToken = process.env.TELEGRAM_BOT_TOKEN;
      const waToken = process.env.WHATSAPP_API_TOKEN;

      return [
        {
          canal: "telegram",
          activo: true,
          configurado: Boolean(tgToken),
          detalles: {
            nombreIdentificador: process.env.TELEGRAM_BOT_USERNAME || "@QuisqueyaHome_Bot",
            webhookRegistrado: true,
            costoPorMensajeUSD: 0.0, // Telegram Bot API es 100% gratuita
          },
        },
        {
          canal: "whatsapp",
          activo: true,
          configurado: Boolean(waToken),
          detalles: {
            nombreIdentificador: process.env.WHATSAPP_PHONE_NUMBER_ID || "Meta Cloud API",
            webhookRegistrado: false,
            costoPorMensajeUSD: 0.045, // Tarifa estimada de Meta por conversación
          },
        },
        {
          canal: "email",
          activo: true,
          configurado: true,
          detalles: {
            nombreIdentificador: "Transaccional SMTP",
            webhookRegistrado: false,
            costoPorMensajeUSD: 0.001,
          },
        },
        {
          canal: "webhook",
          activo: true,
          configurado: true,
          detalles: {
            nombreIdentificador: "Receptor HTTP Externo",
            webhookRegistrado: true,
            costoPorMensajeUSD: 0.0,
          },
        },
      ];
    },
  };
}
