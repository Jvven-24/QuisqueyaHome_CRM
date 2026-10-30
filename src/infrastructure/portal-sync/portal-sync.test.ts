/** Adaptador HTTP del portal, ruta de reconciliación (RBAC y bandera) y contenedor. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import ts from "typescript";
import * as casos from "../../application/portal-sync/casos-de-uso.ts";
import { fuenteEnMemoria, portalEnMemoria } from "../../application/portal-sync/en-memoria.ts";
import { verificarFirma } from "../../application/portal-sync/firma.ts";
import { huellaDe, proyectarProyecto } from "../../application/portal-sync/proyeccion.ts";
import * as errors from "../../domain/errors.ts";
import * as rbac from "../../domain/rbac.ts";
import type { Actor } from "../../domain/rbac.ts";
import { baseUrlValida, portalHttp } from "./adaptador-http.ts";

const require = createRequire(import.meta.url);
function load<T>(path: string, deps: Record<string, unknown>): T {
  const code = ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const loaded = { exports: {} };
  new Function("require", "module", "exports", code)((name: string) => deps[name] ?? require(name), loaded, loaded.exports);
  return loaded.exports as T;
}
const http = load<{ errorResponse: (e: unknown) => Response }>("../http.ts", { "@/domain/errors": errors });
const p1 = proyectarProyecto({ slug: "torre", name: "Torre", zone: null, projectType: "blueprint", operationType: "sale", developer: null, description: null, estimatedDeliveryDate: null, progressPercent: 0, currency: "USD", publicRangeMinCents: null, publicRangeMaxCents: null, videoUrl: null }, []);

type Peticion = { url: string; init: RequestInit };
function fetchFalso(respuestas: Response[]) {
  const peticiones: Peticion[] = [];
  return { peticiones, fetch: async (url: string, init?: RequestInit) => { peticiones.push({ url, init: init ?? {} }); return respuestas.shift() ?? new Response("{}", { status: 200 }); } };
}
const cab = (p: Peticion, k: string) => (p.init.headers as Record<string, string>)[k];

test("adaptador HTTP: PUT firmado con idempotency-key = huella; DELETE firmado; listar solo trae lo de origen CRM", async () => {
  const f = fetchFalso([new Response("{}"), new Response("{}"), new Response(JSON.stringify({ items: [{ slug: "a", huella: "h", origen: "crm" }, { slug: "propio", huella: "x", origen: "portal" }, { slug: 5, huella: "y", origen: "crm" }] }))]);
  const ahora = () => 1_800_000_000;
  const portal = portalHttp({ baseUrl: "https://portal.ejemplo.test/ignorado", secreto: "secreto-de-prueba", fetch: f.fetch, ahora });
  const huella = huellaDe(p1);
  await portal.publicar(p1, huella);
  await portal.retirar("torre sur");
  const lista = await portal.listar();
  assert.deepEqual(lista, [{ slug: "a", huella: "h" }], "el contenido propio del portal nunca se toca");
  const [put, del, get] = f.peticiones as [Peticion, Peticion, Peticion];
  assert.equal(put.url, "https://portal.ejemplo.test/api/crm-sync/projects/torre"); assert.equal(put.init.method, "PUT");
  assert.equal(cab(put, "idempotency-key"), huella);
  assert.equal(put.init.redirect, "error");
  const cuerpo = String(put.init.body);
  assert.equal(JSON.parse(cuerpo).origen, "crm");
  assert.ok(verificarFirma("secreto-de-prueba", { timestamp: 1_800_000_000, metodo: "PUT", ruta: "/api/crm-sync/projects/torre", cuerpo, firma: cab(put, "x-qh-signature")! }, 1_800_000_000_000));
  assert.equal(del.url, "https://portal.ejemplo.test/api/crm-sync/projects/torre%20sur");
  assert.ok(verificarFirma("secreto-de-prueba", { timestamp: 1_800_000_000, metodo: "DELETE", ruta: "/api/crm-sync/projects/torre%20sur", cuerpo: "", firma: cab(del, "x-qh-signature")! }, 1_800_000_000_000));
  assert.equal(get.init.method, "GET");
  for (const p of f.peticiones) assert.ok(!JSON.stringify(p.init.headers).includes("secreto-de-prueba"), "el secreto no viaja");
});

test("adaptador HTTP: errores del portal se propagan sin cuerpo ni secreto; http solo en localhost", async () => {
  const f = fetchFalso([new Response("detalle interno con secreto", { status: 502 })]);
  const portal = portalHttp({ baseUrl: "https://portal.ejemplo.test", secreto: "x", fetch: f.fetch });
  await assert.rejects(() => portal.retirar("a"), (e: Error) => /502/.test(e.message) && !/secreto/.test(e.message));
  assert.throws(() => baseUrlValida("http://portal.ejemplo.test"), /https/);
  assert.throws(() => baseUrlValida("ftp://portal.ejemplo.test"), /https/);
  assert.equal(baseUrlValida("http://127.0.0.1:8787/x"), "http://127.0.0.1:8787");
});

// ---------- ruta ----------
const permisos = (...p: [string, string][]): Actor["permissions"] => p.map(([resource, action]) => ({ resource, action, scope: "all" })) as Actor["permissions"];
let actor: Actor | null = null;
function ruta(env: Record<string, string | undefined>, portal = portalEnMemoria()) {
  const deps = { fuente: fuenteEnMemoria([p1]), portal: portal.puerto };
  const contenedor = load<{ portalSyncDeps: (e?: Record<string, string | undefined>) => typeof deps }>("../contenedor/portal-sync.ts", {
    "../../application/portal-sync/casos-de-uso": casos, "../../domain/errors": errors, "../db/repos/portal-sync": { fuenteProyectosPublicables: () => deps.fuente }, "../portal-sync/adaptador-http": { portalHttp: () => deps.portal },
  });
  const r = load<{ GET: () => Promise<Response>; POST: () => Promise<Response> }>("../../app/api/portal-sync/reconciliar/route.ts", {
    "@/application/portal-sync/casos-de-uso": casos, "@/domain/rbac": rbac,
    "@/infrastructure/auth/actor": { requireActor: async () => { if (!actor) throw new errors.UnauthorizedError(); return actor; } },
    "@/infrastructure/contenedor/portal-sync": { portalSyncDeps: () => contenedor.portalSyncDeps(env) },
    "@/infrastructure/http": http,
  });
  return { ...r, portal };
}
const ENV = { PORTAL_SYNC_ENABLED: "true", PORTAL_SYNC_URL: "https://portal.ejemplo.test", PORTAL_SYNC_SECRET: "s" };

test("ruta: 401 sin sesión, 403 sin permiso total, 409 con la bandera apagada o sin configuración", async () => {
  actor = null;
  assert.equal((await ruta(ENV).POST()).status, 401);
  actor = { userId: 2, roleSlug: "broker", permissions: permisos(["settings", "view"]) };
  assert.equal((await ruta(ENV).POST()).status, 403, "ver no basta para ejecutar");
  actor = { userId: 1, roleSlug: "admin", permissions: permisos(["settings", "view"], ["settings", "edit"]) };
  const apagada = await ruta({}).POST(); assert.equal(apagada.status, 409); assert.match((await apagada.json()).error, /desactivada/);
  const sinConfig = await ruta({ PORTAL_SYNC_ENABLED: "true" }).GET(); assert.equal(sinConfig.status, 409); assert.match((await sinConfig.json()).error, /PORTAL_SYNC_URL/);
});

test("ruta: GET es simulacro y POST ejecuta; el segundo POST no cambia nada", async () => {
  actor = { userId: 1, roleSlug: "admin", permissions: permisos(["settings", "view"], ["settings", "edit"]) };
  const portal = portalEnMemoria();
  const r = ruta(ENV, portal);
  const seco = await (await r.GET()).json();
  assert.equal(seco.resultado.simulacro, true); assert.equal(seco.resultado.creados, 1); assert.equal(portal.llamadas.length, 0);
  const uno = await (await r.POST()).json(); assert.equal(uno.resultado.creados, 1); assert.equal(portal.llamadas.length, 1);
  const dos = await (await r.POST()).json(); assert.equal(dos.resultado.sinCambios, 1); assert.equal(portal.llamadas.length, 1);
});

test("el CRM no importa la sincronización desde el flujo de proyectos: es opt-in por bandera", () => {
  const proy = readFileSync(new URL("../../app/api/proyectos/route.ts", import.meta.url), "utf8");
  assert.ok(!/portal-sync/.test(proy));
  const env = readFileSync(new URL("../../../.env.example", import.meta.url), "utf8");
  assert.match(env, /^PORTAL_SYNC_ENABLED=false$/m);
});

test("cron: sin firma o con firma ajena 401; con firma válida reconcilia; la bandera apagada da 409", async () => {
  const { firmar } = await import("../../application/portal-sync/firma.ts");
  const portal = portalEnMemoria();
  const deps = { fuente: fuenteEnMemoria([p1]), portal: portal.puerto };
  const hacer = (env: Record<string, string | undefined>) => {
    Object.assign(process.env, { PORTAL_SYNC_SECRET: "secreto-cron" });
    const contenedor = load<{ portalSyncDeps: (e?: Record<string, string | undefined>) => typeof deps }>("../contenedor/portal-sync.ts", {
      "../../application/portal-sync/casos-de-uso": casos, "../../domain/errors": errors, "../db/repos/portal-sync": { fuenteProyectosPublicables: () => deps.fuente }, "../portal-sync/adaptador-http": { portalHttp: () => deps.portal },
    });
    return load<{ POST: (r: Request) => Promise<Response> }>("../../app/api/portal-sync/cron/route.ts", {
      "@/application/portal-sync/casos-de-uso": casos, "@/application/portal-sync/firma": { verificarFirma },
      "@/infrastructure/contenedor/portal-sync": { portalSyncDeps: () => contenedor.portalSyncDeps(env) }, "@/infrastructure/http": http,
    });
  };
  const ruta = "/api/portal-sync/cron";
  const pedir = (secreto: string | null, ts = Math.floor(Date.now() / 1000)) => new Request(`https://crm.ejemplo.test${ruta}`, {
    method: "POST", headers: secreto === null ? {} : { "x-qh-timestamp": String(ts), "x-qh-signature": firmar(secreto, ts, "POST", ruta, "") },
  });
  const r = hacer(ENV);
  assert.equal((await r.POST(pedir(null))).status, 401);
  assert.equal((await r.POST(pedir("otro-secreto"))).status, 401);
  assert.equal((await r.POST(pedir("secreto-cron", Math.floor(Date.now() / 1000) - 900))).status, 401, "firma caducada");
  assert.equal(portal.llamadas.length, 0);
  const ok = await r.POST(pedir("secreto-cron")); assert.equal(ok.status, 200); assert.equal(portal.llamadas.length, 1);
  assert.equal((await r.POST(pedir("secreto-cron"))).status, 200); assert.equal(portal.llamadas.length, 1, "idempotente");
  assert.equal((await hacer({}).POST(pedir("secreto-cron"))).status, 409);
  delete process.env.PORTAL_SYNC_SECRET;
  assert.equal((await hacer(ENV).POST(pedir(""))).status, 401, "sin secreto configurado nada pasa");
});
