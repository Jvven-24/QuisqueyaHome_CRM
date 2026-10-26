/**
 * Adaptador de Despacho Multicanal (Telegram Bot, WhatsApp, Webhooks y Email).
 */

import dns from "node:dns/promises";
import https from "node:https";
import { isIP } from "node:net";
import { communicationConfig } from "../env.ts";

import type {
  ProveedorDespachoCanal,
  MensajeADespachar,
  ResultadoDespacho,
} from "../../application/comunicaciones/puertos";

export class ProveedorDespachoMulticanal implements ProveedorDespachoCanal {
  private telegramToken: string | null;
  private whatsappToken: string | null;
  private whatsappPhoneId: string | null;
  private config: ReturnType<typeof communicationConfig>;

  constructor() {
    this.config = communicationConfig();
    this.telegramToken = this.config.telegramToken;
    this.whatsappToken = this.config.whatsappToken;
    this.whatsappPhoneId = this.config.whatsappPhoneId;
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
      const url = registeredWebhook(mensaje.destinatario, this.config.webhookDestinations);
      const signal = AbortSignal.timeout(this.config.webhookTimeoutMs);
      signal.throwIfAborted();
      const hostname = url.hostname.replace(/^\[|\]$/g, "");
      const addresses = isIP(hostname)
        ? [{ address: hostname, family: isIP(hostname) }]
        : await withAbort(dns.lookup(hostname, { all: true, verbatim: true }), signal);
      if (!addresses.length || addresses.some(({ address }) => !publicAddress(address))) {
        throw new Error("Destino no permitido.");
      }
      const address = addresses[0]!;
      signal.throwIfAborted();
      const body = JSON.stringify({
        mensaje: mensaje.mensaje,
        asunto: mensaje.asunto,
        timestamp: ahora.toISOString(),
        metadata: mensaje.metadata,
      });
      // HTTPS nativo no sigue redirects. Agent deshabilitado evita reutilizar un
      // socket de otra resolución; lookup fija la IP ya validada contra rebinding.
      const status = await new Promise<number>((resolve, reject) => {
        const request = https.request(url, {
          method: "POST",
          agent: false,
          signal,
          headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) },
          lookup: (_host, options, callback) => {
            if (options.all) callback(null, [{ address: address.address, family: address.family }]);
            else callback(null, address.address, address.family);
          },
        }, (response) => {
          resolve(response.statusCode ?? 0);
          // No se consume ni devuelve un cuerpo externo potencialmente sensible.
          response.destroy();
        });
        request.on("error", reject);
        request.end(body);
      });

      if (status < 200 || status >= 300) {
        return {
          ok: false,
          canal: "webhook",
          error: `Webhook respondió con código HTTP ${status}.`,
          enviadoAt: ahora,
        };
      }

      return {
        ok: true,
        canal: "webhook",
        mensajeId: `hook_${Date.now()}`,
        enviadoAt: ahora,
      };
    } catch {
      return {
        ok: false,
        canal: "webhook",
        error: "No se pudo despachar el webhook al destino autorizado.",
        enviadoAt: ahora,
      };
    }
  }
}

function registeredWebhook(destination: string, registered: string[]): URL {
  const url = new URL(destination);
  if (url.protocol !== "https:" || url.username || url.password || url.hash || (url.port && url.port !== "443")) {
    throw new Error("Destino no permitido.");
  }
  if (!registered.some((entry) => {
    try { return new URL(entry).href === url.href; } catch { return false; }
  })) throw new Error("Destino no registrado.");
  return url;
}

/** Política conservadora: solo unicast global; tampoco documentación/transición. */
function publicAddress(address: string): boolean {
  if (isIP(address) === 4) {
    const [a, b, c] = address.split(".").map(Number) as [number, number, number, number];
    return !(a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) || (a === 192 && (b === 0 || b === 168 || (b === 88 && c === 99))) ||
      (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) ||
      (a === 203 && b === 0 && c === 113));
  }
  if (isIP(address) !== 6) return false;
  const canonical = new URL(`https://[${address}]/`).hostname.slice(1, -1);
  const [first, second = "0"] = canonical.split(":");
  const prefix = parseInt(first!, 16);
  return prefix >= 0x2000 && prefix <= 0x3fff && prefix !== 0x2002 &&
    !(prefix === 0x2001 && (parseInt(second, 16) <= 0x1ff || second === "db8")) && prefix !== 0x3fff;
}

function withAbort<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const abort = () => reject(new Error("Tiempo de despacho agotado."));
    signal.addEventListener("abort", abort, { once: true });
    promise.then(resolve, reject).finally(() => signal.removeEventListener("abort", abort));
    if (signal.aborted) abort();
  });
}
