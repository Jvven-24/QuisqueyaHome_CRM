/**
 * "Iniciar sesión con Google": sin alta automática. Solo entra quien el admin
 * ya creó (mismo correo, activo, con cuenta en Auth). La sesión la emite GoTrue
 * canjeando un magic link generado en el servidor; nunca sale por correo.
 */
import { and, eq, isNull, isNotNull, sql } from "drizzle-orm";
import { getDb } from "../db/client";
import { users } from "../db/schema";
import { canjearCodigo, perfil } from "../google-cuentas";
import { hashDeEnlace } from "./enlaces";
import { serverClient } from "./supabase";

export type ResultadoLoginGoogle = "ok" | "no-verificado" | "no-autorizado" | "fallo";

export async function loginConGoogle(code: string): Promise<ResultadoLoginGoogle> {
  const tokens = await canjearCodigo(code);
  const p = await perfil(tokens.accessToken);
  if (!p.email || p.email_verified === false) return "no-verificado";
  const correo = p.email.trim().toLowerCase();
  const db = getDb();
  const [u] = await db.select({ id: users.id }).from(users).where(and(
    sql`lower(${users.email}) = ${correo}`, eq(users.isActive, true), isNull(users.deletedAt), isNotNull(users.authUserId),
  )).limit(1);
  if (!u) return "no-autorizado";
  const hash = await hashDeEnlace("magiclink", correo);
  const { error } = await (await serverClient()).auth.verifyOtp({ type: "magiclink", token_hash: hash });
  if (error) return "fallo";
  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, u.id));
  return "ok";
}
