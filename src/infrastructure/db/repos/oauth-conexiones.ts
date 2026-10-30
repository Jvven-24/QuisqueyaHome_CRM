/** Persistencia de conexiones OAuth de la organización. Ninguna lectura devuelve tokens. */
import { and, desc, eq, isNull } from "drizzle-orm";
import { NotFoundError } from "../../../domain/errors";
import { getDb } from "../client";
import { googleAccounts, oauthConnections, users } from "../schema";
import { cifrar, descifrar } from "../../conexiones-oauth/cripto";
import * as G from "../../conexiones-oauth/google";
import * as M from "../../conexiones-oauth/meta";
import { tokenVigente } from "../../conexiones-oauth/tokens";
import { extrasOtorgados, servicioPorId, type ServicioDef, type ServicioId } from "../../conexiones-oauth/servicios";
import { ReconectarError, type PerfilCuenta, type ResultadoVerificacion, type Tokens } from "../../conexiones-oauth/tipos";
import { estadoDeFila, mensajeError, type ConexionVista } from "../../conexiones-oauth/vista";

type Fila = typeof oauthConnections.$inferSelect;

const iso = (d: Date | null) => (d ? d.toISOString() : null);
function aVista(f: Fila): ConexionVista {
  const def = servicioPorId(f.service)!;
  return {
    origen: "oauth", id: f.id, servicio: f.service, proveedor: f.provider, cuenta: f.accountLabel,
    estado: estadoDeFila(f.status), mensaje: f.lastError, resumen: f.summary, verificadoEn: iso(f.lastCheckedAt),
    conectadaEn: f.createdAt.toISOString(), extras: extrasOtorgados(def, f.scopes),
  };
}

async function activa(id: number): Promise<Fila> {
  const [f] = await getDb().select().from(oauthConnections).where(and(eq(oauthConnections.id, id), isNull(oauthConnections.revokedAt)));
  if (!f) throw new NotFoundError("Conexión no encontrada.");
  return f;
}

export async function listarConexiones(): Promise<ConexionVista[]> {
  const filas = await getDb().select().from(oauthConnections).where(isNull(oauthConnections.revokedAt)).orderBy(oauthConnections.service, desc(oauthConnections.id));
  return filas.map(aVista);
}

export async function guardarConexion(p: { servicio: ServicioDef; connectedBy: number; tokens: Tokens; perfil: PerfilCuenta; verificacion?: ResultadoVerificacion }): Promise<number> {
  const db = getDb();
  const [existente] = await db.select().from(oauthConnections).where(and(eq(oauthConnections.service, p.servicio.id), eq(oauthConnections.externalAccountId, p.perfil.id), isNull(oauthConnections.revokedAt)));
  const comunes = {
    accountLabel: p.perfil.etiqueta, accessTokenEnc: cifrar(p.tokens.accessToken), expiresAt: p.tokens.expiresAt, scopes: p.tokens.scopes,
    status: "connected" as const, lastError: null, summary: p.verificacion?.resumen ?? null, lastCheckedAt: p.verificacion ? new Date() : null, updatedAt: new Date(),
  };
  if (existente) {
    await db.update(oauthConnections).set({ ...comunes, ...(p.tokens.refreshToken ? { refreshTokenEnc: cifrar(p.tokens.refreshToken) } : {}) }).where(eq(oauthConnections.id, existente.id));
    return existente.id;
  }
  const [n] = await db.insert(oauthConnections).values({
    ...comunes, service: p.servicio.id, provider: p.servicio.proveedor, externalAccountId: p.perfil.id, connectedBy: p.connectedBy,
    refreshTokenEnc: p.tokens.refreshToken ? cifrar(p.tokens.refreshToken) : null,
  }).returning({ id: oauthConnections.id });
  return n!.id;
}

/** Access token vigente (renovado y persistido si hacía falta). Marca "reconectar" si el permiso ya no sirve. */
export async function accessTokenDe(id: number): Promise<string> {
  const f = await activa(id);
  try {
    const { accessToken, renovado } = await tokenVigente(
      { proveedor: f.provider, accessToken: descifrar(f.accessTokenEnc), refreshToken: f.refreshTokenEnc ? descifrar(f.refreshTokenEnc) : null, expiresAt: f.expiresAt, scopes: f.scopes },
      { refrescarGoogle: (r) => G.refrescar(r), renovarMeta: (t, s) => M.renovar(t, s) },
    );
    if (renovado) await getDb().update(oauthConnections).set({ accessTokenEnc: cifrar(renovado.accessToken), expiresAt: renovado.expiresAt, scopes: renovado.scopes, updatedAt: new Date() }).where(eq(oauthConnections.id, id));
    return accessToken;
  } catch (e) {
    if (e instanceof ReconectarError) await getDb().update(oauthConnections).set({ status: "reauth", lastError: e.message, updatedAt: new Date() }).where(eq(oauthConnections.id, id));
    throw e;
  }
}

/** Comprueba la conexión con una llamada real al proveedor y guarda el resultado. */
export async function verificarConexion(id: number): Promise<ConexionVista> {
  const f = await activa(id);
  const def = servicioPorId(f.service as ServicioId)!;
  const db = getDb();
  try {
    const token = await accessTokenDe(id);
    const r: ResultadoVerificacion = f.provider === "google" ? await G.verificar(def, token) : await M.verificar(token);
    await db.update(oauthConnections).set({ status: "connected", lastError: null, summary: r.resumen, lastCheckedAt: new Date(), updatedAt: new Date() }).where(eq(oauthConnections.id, id));
  } catch (e) {
    if (!(e instanceof ReconectarError)) {
      console.error("oauth-verificar:", f.service, e instanceof Error ? e.message : "desconocido");
      await db.update(oauthConnections).set({ status: "error", lastError: mensajeError(e), lastCheckedAt: new Date(), updatedAt: new Date() }).where(eq(oauthConnections.id, id));
    }
  }
  return aVista(await activa(id));
}

/** Revoca en el proveedor (si responde) y borra los tokens; la fila queda como histórico. */
export async function desconectarConexion(id: number): Promise<{ revocado: boolean }> {
  const f = await activa(id);
  let revocado = false;
  try {
    revocado = f.provider === "google"
      ? await G.revocar(f.refreshTokenEnc ? descifrar(f.refreshTokenEnc) : descifrar(f.accessTokenEnc))
      : await M.revocar(descifrar(f.accessTokenEnc));
  } catch { revocado = false; }
  // Se borran los tokens aunque el proveedor no responda: el CRM deja de poder usarlos.
  await getDb().update(oauthConnections).set({ accessTokenEnc: "", refreshTokenEnc: null, status: "error", lastError: null, revokedAt: new Date(), updatedAt: new Date() }).where(eq(oauthConnections.id, id));
  return { revocado };
}

/** Cuentas de Google Calendar (por usuario, flujo existente) presentadas como conexiones de solo lectura. */
export async function listarCalendarioComoConexiones(actorUserId: number): Promise<ConexionVista[]> {
  const filas = await getDb().select({ a: googleAccounts, dueno: users.fullName }).from(googleAccounts)
    .innerJoin(users, eq(users.id, googleAccounts.userId)).where(isNull(googleAccounts.revokedAt)).orderBy(googleAccounts.id);
  return filas.map(({ a, dueno }) => ({
    origen: "calendar", id: a.id, servicio: "calendar", proveedor: "google", cuenta: a.email,
    estado: a.refreshTokenEnc ? "conectado" : "reconectar", mensaje: a.refreshTokenEnc ? null : "Falta el permiso de acceso continuo. Vuelve a conectar la cuenta.",
    resumen: a.active ? "Activa para agendar visitas" : "Desactivada en Agenda", verificadoEn: null, conectadaEn: a.createdAt.toISOString(),
    extras: [], propia: a.userId === actorUserId, propietario: dueno,
  }));
}
