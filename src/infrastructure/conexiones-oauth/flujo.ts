/**
 * Sesión del flujo OAuth: `state` aleatorio + PKCE. Todo el contexto (usuario, servicio,
 * verificador PKCE, caducidad) viaja en UNA cookie httpOnly cifrada con AES-GCM, así
 * que el navegador no puede leerlo ni alterarlo. El parámetro `state` de la URL solo
 * lleva el nonce y se compara en tiempo constante con el de la cookie.
 */
import { randomBytes, timingSafeEqual } from "node:crypto";
import { cifrar, descifrar, type Env } from "./cripto.ts";
import { crearVerificador, desafioS256 } from "./pkce.ts";
import type { ProveedorId, ServicioId } from "./servicios.ts";

export const COOKIE_OAUTH = "qh_oauth";
export const TTL_FLUJO_MS = 10 * 60 * 1000;

export type SesionOAuth = {
  /** nonce = valor del parámetro `state` */
  n: string;
  p: ProveedorId;
  s: ServicioId;
  u: number;
  /** verificador PKCE */
  v: string;
  /** extras incrementales pedidos (p. ej. "enviar") */
  e: string[];
  /** caducidad (ms epoch) */
  x: number;
};

export function iniciarFlujo(p: { proveedor: ProveedorId; servicio: ServicioId; userId: number; extras?: string[] }, env: Env = process.env, ahora = Date.now()) {
  const verificador = crearVerificador();
  const sesion: SesionOAuth = { n: randomBytes(24).toString("base64url"), p: p.proveedor, s: p.servicio, u: p.userId, v: verificador, e: p.extras ?? [], x: ahora + TTL_FLUJO_MS };
  return { state: sesion.n, desafio: desafioS256(verificador), verificador, cookie: cifrar(JSON.stringify(sesion), env) };
}

export function cabeceraCookie(valor: string, maxAgeSeg = TTL_FLUJO_MS / 1000): string {
  return `${COOKIE_OAUTH}=${valor}; Path=/api/integraciones/oauth; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAgeSeg}`;
}
export const cabeceraBorrarCookie = (): string => cabeceraCookie("", 0);

export type ResultadoValidacion = { ok: true; sesion: SesionOAuth } | { ok: false; motivo: "sin-cookie" | "cookie-invalida" | "caducado" | "state" | "usuario" | "proveedor" };

export function validarCallback(
  p: { cookie: string | null; state: string | null; userId: number; proveedor: ProveedorId },
  env: Env = process.env, ahora = Date.now(),
): ResultadoValidacion {
  if (!p.cookie) return { ok: false, motivo: "sin-cookie" };
  let sesion: SesionOAuth;
  try { sesion = JSON.parse(descifrar(p.cookie, env)) as SesionOAuth; } catch { return { ok: false, motivo: "cookie-invalida" }; }
  if (typeof sesion.n !== "string" || typeof sesion.v !== "string") return { ok: false, motivo: "cookie-invalida" };
  if (sesion.x < ahora) return { ok: false, motivo: "caducado" };
  const a = Buffer.from(sesion.n), b = Buffer.from(p.state ?? "");
  if (!p.state || a.length !== b.length || !timingSafeEqual(a, b)) return { ok: false, motivo: "state" };
  if (sesion.u !== p.userId) return { ok: false, motivo: "usuario" };
  if (sesion.p !== p.proveedor) return { ok: false, motivo: "proveedor" };
  return { ok: true, sesion };
}
