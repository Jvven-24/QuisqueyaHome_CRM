/** Firma HMAC-SHA256 de las llamadas CRM → portal (y de los webhooks del portal → CRM). Sin secreto en logs. */
import { createHmac, timingSafeEqual } from "node:crypto";

export const TOLERANCIA_SEG = 300;

export const firmar = (secreto: string, timestamp: number, metodo: string, ruta: string, cuerpo: string): string =>
  createHmac("sha256", secreto).update(`${timestamp}.${metodo.toUpperCase()}.${ruta}.${cuerpo}`).digest("hex");

export function verificarFirma(secreto: string, p: { timestamp: number; metodo: string; ruta: string; cuerpo: string; firma: string }, ahoraMs = Date.now()): boolean {
  if (!secreto || !Number.isFinite(p.timestamp) || Math.abs(ahoraMs / 1000 - p.timestamp) > TOLERANCIA_SEG) return false;
  const esperada = Buffer.from(firmar(secreto, p.timestamp, p.metodo, p.ruta, p.cuerpo), "hex");
  const recibida = Buffer.from(p.firma, "hex");
  return esperada.length === recibida.length && timingSafeEqual(esperada, recibida);
}
