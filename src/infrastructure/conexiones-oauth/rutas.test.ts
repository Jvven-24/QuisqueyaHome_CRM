/** Rutas de conexiones con proveedores simulados: RBAC antes de tocar nada, flujo completo y mensajes sin fugas. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import ts from "typescript";
import * as errors from "../../domain/errors.ts";
import * as rbac from "../../domain/rbac.ts";
import type { Actor } from "../../domain/rbac.ts";
import * as acceso from "./acceso.ts";
import * as flujo from "./flujo.ts";
import * as servicios from "./servicios.ts";
import { estadoDeFila, estadoTarjeta, mensajeError, MOTIVOS_CALLBACK } from "./vista.ts";
import { ProveedorError, ReconectarError } from "./tipos.ts";

const require = createRequire(import.meta.url);
function load<T>(path: string, deps: Record<string, unknown>): T {
  const code = ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const loaded = { exports: {} };
  new Function("require", "module", "exports", code)((name: string) => deps[name] ?? require(name), loaded, loaded.exports);
  return loaded.exports as T;
}
const http = load<{ errorResponse: (e: unknown) => Response; idsDeRuta: (...v: string[]) => number[] }>("../http.ts", { "@/domain/errors": errors });
const guardia = load("./guardia.ts", { "@/domain/errors": errors, "@/domain/rbac": rbac, "./acceso": acceso });

process.env.INTEGRATIONS_TOKEN_ENC_KEY = "a".repeat(64);
process.env.INTEGRATIONS_PUBLIC_URL = "https://crm.example";
process.env.GOOGLE_OAUTH_CLIENT_ID = "gid";
process.env.GOOGLE_OAUTH_CLIENT_SECRET = "gsec";
process.env.META_APP_ID = "mid";
process.env.META_APP_SECRET = "msec";

const admin: Actor = { userId: 1, roleSlug: "admin", permissions: [{ resource: "settings", action: "edit", scope: "all" }] };
const intrusos: Actor[] = [
  { ...admin, roleSlug: "manager" }, { ...admin, roleSlug: "broker" }, { ...admin, readOnly: true }, { ...admin, permissions: [] },
];
let actor: Actor | null = null;
const actorDep = { requireActor: async () => { if (!actor) throw new errors.UnauthorizedError(); return actor; } };

type Toques = { guardadas: unknown[]; verificadas: number[]; borradas: number[]; revocaciones: string[] };
function repo(t: Toques) {
  return {
    guardarConexion: async (p: unknown) => { t.guardadas.push(p); return 9; },
    verificarConexion: async (id: number) => { t.verificadas.push(id); return {}; },
    desconectarConexion: async (id: number) => { t.borradas.push(id); return { revocado: true }; },
    listarConexiones: async () => [],
  };
}
const nuevoToques = (): Toques => ({ guardadas: [], verificadas: [], borradas: [], revocaciones: [] });
const comunes = { "@/domain/rbac": rbac, "@/infrastructure/auth/actor": actorDep, "@/infrastructure/http": http, "@/infrastructure/conexiones-oauth/guardia": guardia, "@/infrastructure/conexiones-oauth/servicios": servicios, "@/infrastructure/conexiones-oauth/flujo": flujo };

test("todas las rutas de conexiones: 401 sin sesión y 403 a no administradores, sin tocar repositorio ni proveedor", async () => {
  const t = nuevoToques();
  const deps = { ...comunes, "@/infrastructure/db/repos/oauth-conexiones": repo(t), "@/infrastructure/conexiones-oauth/google": {}, "@/infrastructure/conexiones-oauth/meta": {} };
  const lista = load<{ GET: () => Promise<Response> }>("../../app/api/integraciones/conexiones/route.ts", deps);
  const borrar = load<{ DELETE: (r: Request, c: unknown) => Promise<Response> }>("../../app/api/integraciones/conexiones/[id]/route.ts", deps);
  const verificar = load<{ POST: (r: Request, c: unknown) => Promise<Response> }>("../../app/api/integraciones/conexiones/[id]/verificar/route.ts", deps);
  const conectar = load<{ GET: (r: Request, c: unknown) => Promise<Response> }>("../../app/api/integraciones/oauth/[proveedor]/conectar/route.ts", deps);
  const callback = load<{ GET: (r: Request, c: unknown) => Promise<Response> }>("../../app/api/integraciones/oauth/[proveedor]/callback/route.ts", deps);
  const ctxId = { params: Promise.resolve({ id: "3" }) };
  const ctxProv = { params: Promise.resolve({ proveedor: "google" }) };
  const req = new Request("https://crm.example/x?servicio=gmail");
  const llamadas: Array<() => Promise<Response>> = [
    () => lista.GET(), () => borrar.DELETE(req, ctxId), () => verificar.POST(req, ctxId), () => conectar.GET(req, ctxProv), () => callback.GET(req, ctxProv),
  ];
  actor = null;
  for (const l of llamadas) assert.equal((await l()).status, 401);
  for (const candidato of intrusos) {
    actor = candidato;
    for (const l of llamadas) assert.equal((await l()).status, 403, `rol ${candidato.roleSlug}`);
  }
  assert.deepEqual([t.guardadas, t.verificadas, t.borradas], [[], [], []]);
  actor = admin;
  assert.equal((await lista.GET()).status, 200);
  assert.equal((await verificar.POST(req, ctxId)).status, 200);
  assert.equal((await borrar.DELETE(req, ctxId)).status, 200);
  assert.deepEqual([t.verificadas, t.borradas], [[3], [3]]);
  assert.equal((await borrar.DELETE(req, { params: Promise.resolve({ id: "x" }) })).status, 404);
});

function rutasOAuth(t: Toques, google: Record<string, unknown>, meta: Record<string, unknown> = {}) {
  const deps = { ...comunes, "@/infrastructure/db/repos/oauth-conexiones": repo(t), "@/infrastructure/conexiones-oauth/google": google, "@/infrastructure/conexiones-oauth/meta": meta };
  return {
    conectar: load<{ GET: (r: Request, c: unknown) => Promise<Response> }>("../../app/api/integraciones/oauth/[proveedor]/conectar/route.ts", deps),
    callback: load<{ GET: (r: Request, c: unknown) => Promise<Response> }>("../../app/api/integraciones/oauth/[proveedor]/callback/route.ts", deps),
  };
}
const ctx = (proveedor: string) => ({ params: Promise.resolve({ proveedor }) });
const googleSimulado = (scopes: string, revocadas: string[] = []) => ({
  urlAutorizacion: (p: { state: string; desafio: string }) => `https://accounts.example/auth?state=${p.state}&code_challenge=${p.desafio}`,
  canjearCodigo: async (code: string, verificador: string) => { assert.equal(code, "codigo-ok"); assert.ok(verificador.length >= 43); return { accessToken: "AT", refreshToken: "RT", expiresAt: new Date(), scopes }; },
  perfil: async () => ({ id: "sub1", etiqueta: "ventas@quisqueyahome.com" }),
  revocar: async (t: string) => { revocadas.push(t); return true; },
});

test("conectar → callback (Google simulado): state en cookie httpOnly, PKCE, guarda y verifica; sin permisos revoca y no guarda", async () => {
  actor = admin;
  const G = "https://www.googleapis.com/auth/gmail.readonly";
  for (const [scopes, motivo] of [[G, "conectada"], ["openid email", "permisos-incompletos"]] as const) {
    const t = nuevoToques(); const revocadas: string[] = [];
    const { conectar, callback } = rutasOAuth(t, googleSimulado(scopes, revocadas));
    const ini = await conectar.GET(new Request("https://crm.example/c?servicio=gmail"), ctx("google"));
    assert.equal(ini.status, 302);
    const cookie = ini.headers.get("set-cookie")!;
    assert.match(cookie, /HttpOnly/); assert.match(cookie, /Secure/); assert.match(cookie, /SameSite=Lax/);
    const state = new URL(ini.headers.get("location")!).searchParams.get("state")!;
    const sobre = cookie.split(";")[0]!;
    const cb = await callback.GET(new Request(`https://crm.example/cb?code=codigo-ok&state=${state}`, { headers: { cookie: sobre } }), ctx("google"));
    assert.equal(cb.status, 302);
    assert.match(cb.headers.get("location")!, new RegExp(`tab=conexiones&conexion=${motivo}&servicio=gmail$`));
    assert.match(cb.headers.get("set-cookie")!, /Max-Age=0/);
    if (motivo === "conectada") { assert.equal(t.guardadas.length, 1); assert.deepEqual(t.verificadas, [9]); }
    else { assert.equal(t.guardadas.length, 0); assert.deepEqual(revocadas, ["RT"]); }
  }
});

test("callback: state falso, sin cookie, cancelado y error del proveedor no guardan ni filtran detalles", async () => {
  actor = admin;
  const t = nuevoToques();
  const { conectar, callback } = rutasOAuth(t, { ...googleSimulado("x"), canjearCodigo: async () => { throw new Error("secreto-interno-del-proveedor"); } });
  const ini = await conectar.GET(new Request("https://crm.example/c?servicio=search_console"), ctx("google"));
  const sobre = ini.headers.get("set-cookie")!.split(";")[0]!;
  const state = new URL(ini.headers.get("location")!).searchParams.get("state")!;
  const ir = async (qs: string, cookie?: string) => (await callback.GET(new Request(`https://crm.example/cb?${qs}`, { headers: cookie ? { cookie } : {} }), ctx("google"))).headers.get("location")!;
  assert.match(await ir(`code=x&state=${state}`), /conexion=estado-invalido/);
  assert.match(await ir("code=x&state=otro", sobre), /conexion=estado-invalido/);
  assert.match(await ir(`error=access_denied&state=${state}`, sobre), /conexion=cancelado/);
  const fallo = await ir(`code=x&state=${state}`, sobre);
  assert.match(fallo, /conexion=fallo/); assert.equal(fallo.includes("secreto"), false);
  assert.equal(t.guardadas.length, 0);
  assert.equal((await callback.GET(new Request("https://crm.example/cb"), ctx("otro"))).status, 404);
});

test("conectar: servicio inválido, proveedor cruzado, calendar fuera del flujo nuevo y servidor sin configurar", async () => {
  actor = admin;
  const { conectar } = rutasOAuth(nuevoToques(), googleSimulado("x"));
  for (const [prov, servicio] of [["google", "nada"], ["google", "meta_ads"], ["google", "calendar"], ["meta", "gmail"]] as const) {
    assert.equal((await conectar.GET(new Request(`https://crm.example/c?servicio=${servicio}`), ctx(prov))).status, 400, `${prov}/${servicio}`);
  }
  const clave = process.env.GOOGLE_OAUTH_CLIENT_SECRET; delete process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const r = await conectar.GET(new Request("https://crm.example/c?servicio=gmail"), ctx("google"));
  process.env.GOOGLE_OAUTH_CLIENT_SECRET = clave;
  assert.match(r.headers.get("location")!, /conexion=sin-configurar/);
  assert.equal(r.headers.get("set-cookie"), null);
});

test("estados de la tarjeta: reconectar > error > conectado > sin conectar; mapeo de filas", () => {
  assert.equal(estadoTarjeta([]), "sin_conectar");
  assert.equal(estadoTarjeta([{ estado: "conectado" }]), "conectado");
  assert.equal(estadoTarjeta([{ estado: "conectado" }, { estado: "error" }]), "error");
  assert.equal(estadoTarjeta([{ estado: "error" }, { estado: "reconectar" }, { estado: "conectado" }]), "reconectar");
  assert.deepEqual(["connected", "error", "reauth"].map(estadoDeFila), ["conectado", "error", "reconectar"]);
});

test("mensajes de error: en español y sin cuerpo del proveedor", () => {
  assert.match(mensajeError(new ProveedorError("Google", 403, "accessNotConfigured")), /negó el acceso/);
  assert.match(mensajeError(new ProveedorError("Meta", 503, "x")), /no respondió bien \(503\)/);
  assert.equal(mensajeError(new ReconectarError("Vuelve a conectar.")), "Vuelve a conectar.");
  assert.equal(mensajeError(new Error("ya29.TOKEN")).includes("ya29"), false);
  for (const m of Object.values(MOTIVOS_CALLBACK)) assert.match(m, /[a-záéíóú]/i);
});

test("migración 0018: RLS, checks, unicidad parcial y journal; tokens nunca en columnas de texto plano", () => {
  const sql = readFileSync(new URL("../../../drizzle/0018_oauth_conexiones.sql", import.meta.url), "utf8");
  assert.match(sql, /CREATE TABLE IF NOT EXISTS "oauth_connections"/);
  assert.match(sql, /ALTER TABLE "oauth_connections" ENABLE ROW LEVEL SECURITY/);
  assert.match(sql, /UNIQUE INDEX IF NOT EXISTS "oauth_connections_service_account_unq"[^;]*WHERE "revoked_at" IS NULL/);
  assert.match(sql, /"access_token_enc" text NOT NULL/);
  assert.doesNotMatch(sql, /"(?:access|refresh)_token" /);
  const journal = JSON.parse(readFileSync(new URL("../../../drizzle/meta/_journal.json", import.meta.url), "utf8"));
  assert.ok(journal.entries.some((e: { idx: number; tag: string }) => e.idx === 18 && e.tag === "0018_oauth_conexiones"));
});

/** Contraste WCAG de las parejas de color de las insignias y botones (tokens.css y guías de marca). */
function luminancia(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const contraste = (a: string, b: string) => { const [x, y] = [luminancia(a), luminancia(b)].sort((p, q) => q - p) as [number, number]; return (x + 0.05) / (y + 0.05); }

test("contraste AA (≥ 4.5:1) en insignias, texto atenuado y botones de marca", () => {
  const css = readFileSync(new URL("../../app/tokens.css", import.meta.url), "utf8");
  const tok = (n: string) => css.match(new RegExp(`--color-${n}:\\s*(#[0-9a-fA-F]{6})`))![1]!;
  for (const [fg, bg] of [["success", "success-bg"], ["warning", "warning-bg"], ["danger", "danger-bg"], ["ink-muted", "surface"], ["ink-muted", "surface-alt"], ["ink", "surface-alt"]] as const) {
    assert.ok(contraste(tok(fg), tok(bg)) >= 4.5, `${fg} sobre ${bg}`);
  }
  assert.ok(contraste("#1F1F1F", "#FFFFFF") >= 4.5, "botón Google");
  assert.ok(contraste("#FFFFFF", "#0866FF") >= 4.5, "botón Facebook");
});

test("botón de Google respeta la guía: 40 px, borde #747775, texto #1F1F1F, G de 20 px y 10 px de separación", () => {
  const src = readFileSync(new URL("../../app/(crm)/configuracion/conexiones/botones.tsx", import.meta.url), "utf8");
  for (const fragmento of ["sm:min-h-10", "border-[#747775]", "text-[#1F1F1F]", "bg-white", "gap-[10px]", "text-sm", "leading-5", "font-medium"]) assert.ok(src.includes(fragmento), fragmento);
  const logos = readFileSync(new URL("../../app/(crm)/configuracion/conexiones/logos.tsx", import.meta.url), "utf8");
  for (const color of ["#EA4335", "#4285F4", "#FBBC05", "#34A853"]) assert.ok(logos.includes(color));
  assert.match(logos, /export function GoogleG\(\{ size = 20/);
});
