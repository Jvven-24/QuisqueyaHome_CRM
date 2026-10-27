/** Persistencia de cuentas/calendarios Google por usuario. Ninguna lectura devuelve tokens. */
import { and, eq, inArray, isNull } from "drizzle-orm";
import { NotFoundError } from "../../../domain/errors";
import { getDb } from "../client";
import { googleAccounts, googleCalendars } from "../schema";
import * as G from "../../google-cuentas";

export type CuentaVista = { id: number; email: string; active: boolean; calendarios: { id: number; summary: string; isPrimary: boolean; selected: boolean; defaultForVisits: boolean }[] };

async function propia(userId: number, accountId: number) {
  const [c] = await getDb().select().from(googleAccounts)
    .where(and(eq(googleAccounts.id, accountId), eq(googleAccounts.userId, userId), isNull(googleAccounts.revokedAt)));
  if (!c) throw new NotFoundError("Cuenta no encontrada.");
  return c;
}

async function tokenDe(c: typeof googleAccounts.$inferSelect) {
  const { accessToken, renovado } = await G.tokenVigente(c);
  if (renovado) await getDb().update(googleAccounts).set({ accessTokenEnc: G.cifrar(renovado.accessToken), expiresAt: renovado.expiresAt }).where(eq(googleAccounts.id, c.id));
  return accessToken;
}

export async function guardarCuentaConectada(userId: number, t: G.Tokens, p: { sub: string; email: string }) {
  const db = getDb();
  const [existente] = await db.select().from(googleAccounts).where(and(eq(googleAccounts.userId, userId), eq(googleAccounts.googleSub, p.sub)));
  const datos = { email: p.email, accessTokenEnc: G.cifrar(t.accessToken), expiresAt: t.expiresAt, scopes: t.scopes, active: true, revokedAt: null };
  let id: number;
  if (existente) {
    await db.update(googleAccounts).set({ ...datos, ...(t.refreshToken ? { refreshTokenEnc: G.cifrar(t.refreshToken) } : {}) }).where(eq(googleAccounts.id, existente.id));
    id = existente.id;
  } else {
    const [n] = await db.insert(googleAccounts).values({ userId, googleSub: p.sub, ...datos, refreshTokenEnc: t.refreshToken ? G.cifrar(t.refreshToken) : null }).returning({ id: googleAccounts.id });
    id = n!.id;
  }
  await sincronizarCalendarios(userId, id, t.accessToken);
  return id;
}

export async function sincronizarCalendarios(userId: number, accountId: number, accessToken?: string) {
  const c = await propia(userId, accountId);
  const lista = await G.listarCalendarios(accessToken ?? (await tokenDe(c)));
  const db = getDb();
  const actuales = await db.select().from(googleCalendars).where(eq(googleCalendars.accountId, accountId));
  for (const cal of lista) {
    if (actuales.some((a) => a.calendarId === cal.id)) await db.update(googleCalendars).set({ summary: cal.summary, isPrimary: cal.primary }).where(and(eq(googleCalendars.accountId, accountId), eq(googleCalendars.calendarId, cal.id)));
    else await db.insert(googleCalendars).values({ accountId, calendarId: cal.id, summary: cal.summary, isPrimary: cal.primary, selected: cal.primary });
  }
  const sobran = actuales.filter((a) => !lista.some((l) => l.id === a.calendarId)).map((a) => a.id);
  if (sobran.length) await db.delete(googleCalendars).where(inArray(googleCalendars.id, sobran));
}

export async function listarCuentas(userId: number): Promise<CuentaVista[]> {
  const db = getDb();
  const cuentas = await db.select({ id: googleAccounts.id, email: googleAccounts.email, active: googleAccounts.active }).from(googleAccounts)
    .where(and(eq(googleAccounts.userId, userId), isNull(googleAccounts.revokedAt))).orderBy(googleAccounts.id);
  if (!cuentas.length) return [];
  const cals = await db.select().from(googleCalendars).where(inArray(googleCalendars.accountId, cuentas.map((c) => c.id))).orderBy(googleCalendars.id);
  return cuentas.map((c) => ({ ...c, calendarios: cals.filter((k) => k.accountId === c.id).map(({ id, summary, isPrimary, selected, defaultForVisits }) => ({ id, summary, isPrimary, selected, defaultForVisits })) }));
}

export async function activarCuenta(userId: number, accountId: number, active: boolean) {
  await propia(userId, accountId);
  await getDb().update(googleAccounts).set({ active }).where(eq(googleAccounts.id, accountId));
}

async function calendarioPropio(userId: number, calendarRowId: number) {
  const [fila] = await getDb().select({ cal: googleCalendars, cuenta: googleAccounts }).from(googleCalendars)
    .innerJoin(googleAccounts, eq(googleAccounts.id, googleCalendars.accountId))
    .where(and(eq(googleCalendars.id, calendarRowId), eq(googleAccounts.userId, userId), isNull(googleAccounts.revokedAt)));
  if (!fila) throw new NotFoundError("Calendario no encontrado.");
  return fila;
}

export async function ajustarCalendario(userId: number, calendarRowId: number, cambios: { selected?: boolean; defaultForVisits?: boolean }) {
  await calendarioPropio(userId, calendarRowId);
  const db = getDb();
  if (cambios.defaultForVisits) {
    const ids = (await db.select({ id: googleAccounts.id }).from(googleAccounts).where(eq(googleAccounts.userId, userId))).map((x) => x.id);
    if (ids.length) await db.update(googleCalendars).set({ defaultForVisits: false }).where(inArray(googleCalendars.accountId, ids));
  }
  const set: Partial<typeof googleCalendars.$inferInsert> = {};
  if (cambios.selected !== undefined) set.selected = cambios.selected;
  if (cambios.defaultForVisits !== undefined) set.defaultForVisits = cambios.defaultForVisits;
  if (cambios.defaultForVisits) set.selected = true;
  if (cambios.selected === false) set.defaultForVisits = false;
  await db.update(googleCalendars).set(set).where(eq(googleCalendars.id, calendarRowId));
}

export async function desconectarCuenta(userId: number, accountId: number) {
  const c = await propia(userId, accountId);
  const plano = c.refreshTokenEnc ? G.descifrar(c.refreshTokenEnc) : G.descifrar(c.accessTokenEnc);
  const revocado = await G.revocar(plano).catch(() => false);
  const db = getDb();
  await db.delete(googleCalendars).where(eq(googleCalendars.accountId, accountId));
  // Se borran los tokens aunque Google no responda: el CRM deja de poder usarlos.
  await db.update(googleAccounts).set({ active: false, revokedAt: new Date(), accessTokenEnc: "", refreshTokenEnc: null }).where(eq(googleAccounts.id, accountId));
  return { revocado };
}

/** Crea el evento en el calendario elegido (o el predeterminado para visitas). null si no hay calendario usable. */
export async function crearEventoEnCalendario(userId: number, calendarRowId: number | undefined, evento: Parameters<typeof G.crearEvento>[2]) {
  let fila: Awaited<ReturnType<typeof calendarioPropio>> | undefined;
  if (calendarRowId) fila = await calendarioPropio(userId, calendarRowId);
  else {
    [fila] = await getDb().select({ cal: googleCalendars, cuenta: googleAccounts }).from(googleCalendars)
      .innerJoin(googleAccounts, eq(googleAccounts.id, googleCalendars.accountId))
      .where(and(eq(googleAccounts.userId, userId), eq(googleCalendars.defaultForVisits, true), isNull(googleAccounts.revokedAt)));
  }
  if (!fila || !fila.cuenta.active || !fila.cal.selected) return null;
  const id = await G.crearEvento(await tokenDe(fila.cuenta), fila.cal.calendarId, evento);
  return { eventoId: id, calendario: fila.cal.summary, cuenta: fila.cuenta.email };
}
