/**
 * Cifrado de tokens OAuth en reposo: AES-256-GCM con clave de entorno.
 * Formato `v1.iv.tag.cifrado` (compatible con el de google-cuentas.ts).
 * La clave sale de INTEGRATIONS_TOKEN_ENC_KEY; si no existe se acepta
 * GOOGLE_TOKEN_ENC_KEY para no obligar a reconectar lo que ya está conectado.
 * Nunca registra ni devuelve tokens en errores.
 */
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

export type Env = Record<string, string | undefined>;

export function clave(env: Env = process.env): Buffer {
  const raw = (env.INTEGRATIONS_TOKEN_ENC_KEY?.trim() || env.GOOGLE_TOKEN_ENC_KEY?.trim() || "");
  const k = /^[0-9a-f]{64}$/i.test(raw) ? Buffer.from(raw, "hex") : Buffer.from(raw, "base64");
  if (k.length !== 32) throw new Error("INTEGRATIONS_TOKEN_ENC_KEY debe ser de 32 bytes (hex de 64 caracteres o base64).");
  return k;
}

export function cifrar(texto: string, env: Env = process.env): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", clave(env), iv);
  const enc = Buffer.concat([c.update(texto, "utf8"), c.final()]);
  return ["v1", iv.toString("base64"), c.getAuthTag().toString("base64"), enc.toString("base64")].join(".");
}

export function descifrar(sobre: string, env: Env = process.env): string {
  const [ver, iv, tag, enc] = sobre.split(".");
  if (ver !== "v1" || !iv || !tag || !enc) throw new Error("Token cifrado inválido.");
  const d = createDecipheriv("aes-256-gcm", clave(env), Buffer.from(iv, "base64"));
  d.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([d.update(Buffer.from(enc, "base64")), d.final()]).toString("utf8");
}
