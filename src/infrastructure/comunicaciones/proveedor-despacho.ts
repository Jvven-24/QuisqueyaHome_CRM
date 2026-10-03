/**
 * Adaptador de Despacho Multicanal (Telegram Bot, WhatsApp, Webhooks y Email).
 */

import type {
  ProveedorDespachoCanal,
  MensajeADespachar,
  ResultadoDespacho,
} from "../../application/comunicaciones/puertos";

export class ProveedorDespachoMulticanal implements ProveedorDespachoCanal {
  private telegramToken: string | null;
  private whatsappToken: string | null;
  private whatsappPhoneId: string | null;

  constructor() {
    this.telegramToken = process.env.TELEGRAM_BOT_TOKEN || null;
    this.whatsappToken = process.env.WHATSAPP_API_TOKEN || null;
    this.whatsappPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || null;
  }

  async despachar(mensaje: MensajeADespachar): Promise<ResultadoDespacho> {
    const ahora = new Date();

    switch (mensaje.canal) {
      case "telegram":
        return this.despacharTelegram(mensaje, ahora);

      case "whatsapp":
        return this.despacharWhatsApp(mensaje, ahora);

      case "webhook":
        return this.despacharWebhook(mensaje, ahora);

      case "email":
      default:
        return {
          ok: true,
          canal: mensaje.canal,
          mensajeId: `sim_${mensaje.canal}_${Date.now()}`,
          enviadoAt: ahora,
        };
    }
  }

  private async despacharTelegram(
    mensaje: MensajeADespachar,
    ahora: Date,
  ): Promise<ResultadoDespacho> {
    if (!this.telegramToken) {
      // Modo local / sin token configurado: despacho simulado exitoso
      return {
        ok: true,
        canal: "telegram",
        mensajeId: `tg_sim_${Date.now()}`,
        enviadoAt: ahora,
      };
    }

    try {
      const url = `https://api.telegram.org/bot${this.telegramToken}/sendMessage`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: mensaje.destinatario,
          text: mensaje.mensaje,
          parse_mode: "HTML",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        return {
          ok: false,
          canal: "telegram",
          error: data.description || "Error de la API de Telegram.",
          enviadoAt: ahora,
        };
      }

      return {
        ok: true,
        canal: "telegram",
        mensajeId: String(data.result?.message_id ?? Date.now()),
        enviadoAt: ahora,
      };
    } catch (err: unknown) {
      return {
        ok: false,
        canal: "telegram",
        error: err instanceof Error ? err.message : "Error de red al conectar con Telegram.",
        enviadoAt: ahora,
      };
    }
  }

  private async despacharWhatsApp(
    mensaje: MensajeADespachar,
    ahora: Date,
  ): Promise<ResultadoDespacho> {
    if (!this.whatsappToken || !this.whatsappPhoneId) {
      return {
        ok: true,
        canal: "whatsapp",
        mensajeId: `wa_sim_${Date.now()}`,
        enviadoAt: ahora,
      };
    }

    try {
      const url = `https://graph.facebook.com/v21.0/${this.whatsappPhoneId}/messages`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.whatsappToken}`,
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: mensaje.destinatario.replace(/[^0-9]/g, ""),
          type: "text",
          text: { body: mensaje.mensaje },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        return {
          ok: false,
          canal: "whatsapp",
          error: data.error?.message || "Error al enviar mensaje por WhatsApp Cloud API.",
          enviadoAt: ahora,
        };
      }

      return {
        ok: true,
        canal: "whatsapp",
        mensajeId: data.messages?.[0]?.id ?? `wa_${Date.now()}`,
        enviadoAt: ahora,
      };
    } catch (err: unknown) {
      return {
        ok: false,
        canal: "whatsapp",
        error: err instanceof Error ? err.message : "Error de red al despachar WhatsApp.",
        enviadoAt: ahora,
      };
    }
  }

  private async despacharWebhook(
    mensaje: MensajeADespachar,
    ahora: Date,
  ): Promise<ResultadoDespacho> {
    try {
      const res = await fetch(mensaje.destinatario, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mensaje: mensaje.mensaje,
          asunto: mensaje.asunto,
          timestamp: ahora.toISOString(),
          metadata: mensaje.metadata,
        }),
      });

      if (!res.ok) {
        return {
          ok: false,
          canal: "webhook",
          error: `Webhook respondió con código HTTP ${res.status}.`,
          enviadoAt: ahora,
        };
      }

      return {
        ok: true,
        canal: "webhook",
        mensajeId: `hook_${Date.now()}`,
        enviadoAt: ahora,
      };
    } catch (err: unknown) {
      return {
        ok: false,
        canal: "webhook",
        error: err instanceof Error ? err.message : "Error de red al despachar webhook.",
        enviadoAt: ahora,
      };
    }
  }
}
