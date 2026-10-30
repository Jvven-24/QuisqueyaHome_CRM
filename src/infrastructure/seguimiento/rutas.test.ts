/** Seguimiento de origen: redirector público, API de enlaces (RBAC), mejor esfuerzo en la captura y migración. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import ts from "typescript";
import * as errors from "../../domain/errors.ts";
import * as rbac from "../../domain/rbac.ts";
import type { Actor } from "../../domain/rbac.ts";
import { leerAnuncioMeta } from "../conexiones-oauth/meta-anuncios.ts";

const require = createRequire(import.meta.url);
function load<T>(path: string, deps: Record<string, unknown>): T {
  const code = ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const loaded = { exports: {} };
  new Function("require", "module", "exports", code)((name: string) => deps[name] ?? require(name), loaded, loaded.exports);
  return loaded.exports as T;
}
const http = load<{ errorResponse: (e: unknown) => Response; idsDeRuta: (...v: string[]) => number[]; parseInput: <T>(s: { parse: (v: unknown) => T }, v: unknown) => T }>("../http.ts", { "@/domain/errors": errors });

const permisos = (...p: [string, string][]): Actor["permissions"] => p.map(([resource, action]) => ({ resource, action, scope: "all" })) as Actor["permissions"];
const admin: Actor = { userId: 1, roleSlug: "admin", permissions: permisos(["integrations", "view"], ["integrations", "create"], ["integrations", "edit"]) };
let actor: Actor | null = null;
const actorDep = { requireActor: async () => { if (!actor) throw new errors.UnauthorizedError(); return actor; } };

// ---------- /v/<codigo> ----------
type Llamada = { codigo: string; visitorId: string | null; origenPortal: string; userAgent: string | null };
function rutaV(resultado: unknown, llamadas: Llamada[]) {
  return load<{ GET: (r: Request, c: unknown) => Promise<Response> }>("../../app/v/[codigo]/route.ts", {
    "@/application/seguimiento/casos-de-uso": { resolverClic: async (_r: unknown, p: Llamada) => { llamadas.push(p); if (resultado instanceof Error) throw resultado; return resultado; } },
    "@/infrastructure/contenedor/seguimiento": { seguimientoParaLectura: () => ({}) },
  });
}
const ctx = (codigo: string) => ({ params: Promise.resolve({ codigo }) });
const VID = "11111111-2222-3333-4444-555555555555";

test("/v: 302 al destino que construye el CRM, cookie solo para visitantes nuevos y sin caché", async () => {
  process.env.PORTAL_PUBLIC_URL = "https://portal.example";
  const llamadas: Llamada[] = [];
  const nuevo = await rutaV({ destino: "https://portal.example/p?qh_c=abc2345", visitorId: VID, nuevoVisitante: true }, llamadas).GET(new Request("https://crm.example/v/abc2345?next=https://evil.example", { headers: { "user-agent": "Mozilla" } }), ctx("abc2345"));
  assert.equal(nuevo.status, 302);
  assert.equal(nuevo.headers.get("location"), "https://portal.example/p?qh_c=abc2345", "la URL de destino nunca sale de la petición");
  assert.equal(nuevo.headers.get("cache-control"), "no-store");
  const cookie = nuevo.headers.get("set-cookie")!;
  assert.match(cookie, new RegExp(`qh_vid=${VID}`)); assert.match(cookie, /HttpOnly/i); assert.match(cookie, /SameSite=lax/i); assert.match(cookie, /Max-Age=7776000/);
  const conocido = await rutaV({ destino: "https://wa.me/1809?text=x", visitorId: VID, nuevoVisitante: false }, llamadas).GET(new Request("https://crm.example/v/abc2345", { headers: { cookie: `a=1; qh_vid=${VID}` } }), ctx("abc2345"));
  assert.equal(conocido.headers.get("set-cookie"), null);
  assert.equal(llamadas[1]!.visitorId, VID); assert.equal(llamadas[1]!.origenPortal, "https://portal.example");
});

test("/v: código desconocido, enlace desactivado o error interno → portal (o 404), nunca un error técnico", async () => {
  process.env.PORTAL_PUBLIC_URL = "https://portal.example";
  for (const r of [null, new Error("db caída")]) {
    const res = await rutaV(r, []).GET(new Request("https://crm.example/v/zzzzzzz"), ctx("zzzzzzz"));
    assert.equal(res.status, 302); assert.equal(res.headers.get("location"), "https://portal.example/"); assert.equal(res.headers.get("set-cookie"), null);
  }
  delete process.env.PORTAL_PUBLIC_URL;
  const sin = await rutaV(null, []).GET(new Request("https://crm.example/v/zzzzzzz"), ctx("zzzzzzz"));
  assert.equal(sin.status, 404);
});

test("middleware: /v es público y solo ese prefijo exacto", () => {
  const src = readFileSync(new URL("../../middleware.ts", import.meta.url), "utf8");
  assert.match(src, /"\/v",/);
  const lista = /const PUBLIC_PATHS = \[([\s\S]*?)\];/.exec(src)![1]!;
  const publica = (path: string) => [...lista.matchAll(/"([^"]+)"/g)].some(([, p]) => path === p || path.startsWith(`${p}/`));
  assert.ok(publica("/v/abc2345")); assert.ok(!publica("/vendedores")); assert.ok(!publica("/valoraciones"));
});

// ---------- API de enlaces ----------
type Repo = { creados: unknown[]; activos: [number, boolean][] };
function api(repo: Repo) {
  const deps = {
    "@/domain/rbac": rbac, "@/domain/errors": errors, "@/infrastructure/auth/actor": actorDep, "@/infrastructure/http": http,
    "@/infrastructure/limites": { leerJsonLimitado: async (r: Request) => r.json() },
    "@/infrastructure/conexiones-oauth/servicios": { urlPublica: () => "https://crm.example" },
    "@/application/seguimiento/enlaces": { urlCorta: (o: string, c: string) => `${o}/v/${c}` },
    "@/application/seguimiento/casos-de-uso": { crearEnlace: async (_r: unknown, e: unknown, c: { creadoPor: number }) => { repo.creados.push([e, c.creadoPor]); return { id: 1, code: "abc2345" }; } },
    "@/infrastructure/contenedor/seguimiento": {
      seguimientoParaEscritura: () => ({ repo: {}, enriquecer: async () => null }),
      seguimientoParaLectura: () => ({ listarEnlaces: async () => [{ id: 1, code: "abc2345", clics: 3 }], cambiarActivo: async (id: number, a: boolean) => { repo.activos.push([id, a]); return id === 1; } }),
    },
  };
  return {
    lista: load<{ GET: () => Promise<Response>; POST: (r: Request) => Promise<Response> }>("../../app/api/seguimiento/enlaces/route.ts", deps),
    uno: load<{ PATCH: (r: Request, c: unknown) => Promise<Response> }>("../../app/api/seguimiento/enlaces/[id]/route.ts", deps),
  };
}
const post = (b: unknown) => new Request("https://crm.example/api/seguimiento/enlaces", { method: "POST", body: JSON.stringify(b), headers: { "content-type": "application/json" } });

test("API de enlaces: 401 sin sesión, 403 sin permiso total sobre integraciones; con permiso, crea y lista", async () => {
  const repo: Repo = { creados: [], activos: [] };
  const { lista, uno } = api(repo);
  actor = null;
  assert.equal((await lista.GET()).status, 401);
  assert.equal((await lista.POST(post({}))).status, 401);
  const patch = (b: unknown, id = "1") => uno.PATCH(new Request("https://crm.example/x", { method: "PATCH", body: JSON.stringify(b) }), { params: Promise.resolve({ id }) });
  assert.equal((await patch({ isActive: false })).status, 401);
  for (const a of [
    { ...admin, permissions: [] }, { ...admin, readOnly: true },
    { ...admin, permissions: [{ resource: "integrations", action: "view", scope: "own" }, { resource: "integrations", action: "create", scope: "own" }, { resource: "integrations", action: "edit", scope: "own" }] },
  ] as Actor[]) {
    actor = a;
    if (!a.readOnly) assert.equal((await lista.GET()).status, 403, "alcance parcial no basta");
    assert.equal((await lista.POST(post({ name: "x" }))).status, 403);
    assert.equal((await patch({ isActive: false })).status, 403);
  }
  assert.deepEqual(repo.creados, []); assert.deepEqual(repo.activos, []);
  actor = admin;
  const l = await (await lista.GET()).json();
  assert.equal(l.enlaces[0].urlCorta, "https://crm.example/v/abc2345");
  const c = await lista.POST(post({ name: "Video" }));
  assert.equal(c.status, 201); assert.deepEqual(repo.creados, [[{ name: "Video" }, 1]]);
  assert.equal((await patch({ isActive: false })).status, 200); assert.deepEqual(repo.activos, [[1, false]]);
  assert.equal((await patch({ isActive: "no" })).status, 400);
  assert.equal((await patch({ isActive: true }, "99")).status, 404);
});

// ---------- captura: mejor esfuerzo ----------
test("captura: lo explícito del formulario manda; un fallo del seguimiento nunca rompe el lead", async () => {
  const toques = { directo: { code: "abc2345" }, clics: [] };
  let falla = false;
  const avisos: unknown[] = [];
  const m = load<typeof import("./captura.ts")>("./captura.ts", {
    "../../application/seguimiento/casos-de-uso": {
      resolverToques: async () => { if (falla) throw new Error("db caída"); return toques; },
      atribuirLead: async () => { if (falla) throw new Error("db caída"); },
      origenParaCaptura: () => ({ sourceVideoUrl: "https://v", campaign: "Camp", utmSource: "facebook" }),
    },
    "../../application/seguimiento/codigo": { extraerCodigoDeTexto: (t: string) => /QH-(\w+)/.exec(t)?.[1] ?? null },
    "../db/repos/seguimiento": { repoSeguimiento: () => ({}) },
  });
  const orig = console.warn; console.warn = (...a: unknown[]) => { avisos.push(a); };
  try {
    assert.deepEqual(m.conOrigen({ campaign: "Manual" }, toques as never), { campaign: "Manual", sourceVideoUrl: "https://v", utmSource: "facebook" });
    assert.deepEqual(m.conOrigen({ campaign: "Manual" }, null), { campaign: "Manual" });
    assert.ok(await m.toquesDeCaptura({ canal: "otro", texto: "hola QH-abc2345" }));
    falla = true;
    assert.equal(await m.toquesDeCaptura({ canal: "whatsapp", codigo: "abc2345" }), null);
    await m.guardarAtribucion({ id: 1, contactId: 1 }, toques as never); // no lanza
    assert.equal(avisos.length, 2);
    assert.ok(!JSON.stringify(avisos).includes("abc2345"), "el aviso no vuelca datos del lead");
  } finally { console.warn = orig; }
});

test("captura: las tres entradas guardan la atribución DESPUÉS del lead y sin romper la respuesta", () => {
  for (const ruta of ["../../app/api/leads/externo/route.ts", "../../app/api/integraciones/webhooks/whatsapp/route.ts", "../../app/api/integraciones/webhooks/meta/route.ts"]) {
    const s = readFileSync(new URL(ruta, import.meta.url), "utf8");
    assert.ok(s.indexOf("toquesDeCaptura(") < s.indexOf("capturarLeadExterno(leadsParaEscritura()"), `${ruta}: resuelve el origen antes`);
    assert.ok(s.indexOf("capturarLeadExterno(leadsParaEscritura()") < s.indexOf("guardarAtribucion("), `${ruta}: guarda después`);
    assert.match(s, /conOrigen\(/);
  }
});

// ---------- Marketing API simulada ----------
test("Meta Ads: lee creativo y campaña con el token de la conexión; sin permiso o ID raro → null", async () => {
  const llamadas: { url: string; auth: string | null }[] = [];
  const f = (async (url: string, init?: RequestInit) => {
    llamadas.push({ url, auth: new Headers(init?.headers).get("authorization") });
    return Response.json({ id: "120000000001", name: "Anuncio A", campaign: { id: "9", name: "Campaña Torre" }, creative: { id: "777" } });
  }) as unknown as typeof fetch;
  assert.deepEqual(await leerAnuncioMeta("120000000001", "TOKEN_X", { META_GRAPH_VERSION: "v24.0" }, f), { creativeId: "777", adName: "Anuncio A", campaign: "Campaña Torre" });
  assert.match(llamadas[0]!.url, /^https:\/\/graph\.facebook\.com\/v24\.0\/120000000001\?fields=/); assert.equal(llamadas[0]!.auth, "Bearer TOKEN_X");
  assert.ok(!llamadas[0]!.url.includes("TOKEN_X"), "el token va en la cabecera, no en la URL");
  assert.equal(await leerAnuncioMeta("../me", "T", {}, f), null); assert.equal(llamadas.length, 1);
  assert.equal(await leerAnuncioMeta("120000000001", "T", {}, (async () => new Response("{}", { status: 403 })) as unknown as typeof fetch), null);
  assert.equal(await leerAnuncioMeta("120000000001", "T", {}, (async () => { throw new Error("red"); }) as unknown as typeof fetch), null);
});

// ---------- migración ----------
test("migración 0019: tres tablas, RLS en todas, en el journal y el esquema coincide", () => {
  const sql = readFileSync(new URL("../../../drizzle/0019_seguimiento_origen.sql", import.meta.url), "utf8");
  const tablas = [...sql.matchAll(/CREATE TABLE IF NOT EXISTS "(\w+)"/g)].map((m) => m[1]);
  assert.deepEqual(tablas, ["tracking_links", "tracking_clicks", "lead_attributions"]);
  for (const t of tablas) assert.match(sql, new RegExp(`ALTER TABLE "${t}" ENABLE ROW LEVEL SECURITY`));
  assert.match(sql, /UNIQUE INDEX IF NOT EXISTS "tracking_links_code_unq"/); assert.match(sql, /"lead_attributions_lead_model_unq"/);
  assert.ok(!/\b(DROP|TRUNCATE)\b|DELETE FROM/i.test(sql), "solo aditiva");
  const journal = JSON.parse(readFileSync(new URL("../../../drizzle/meta/_journal.json", import.meta.url), "utf8")) as { entries: { idx: number; tag: string }[] };
  assert.ok(journal.entries.some((e) => e.idx === 19 && e.tag === "0019_seguimiento_origen"));
  const schema = readFileSync(new URL("../db/schema.ts", import.meta.url), "utf8");
  for (const t of tablas) assert.match(schema, new RegExp(`pgTable\\("${t}"`));
});
