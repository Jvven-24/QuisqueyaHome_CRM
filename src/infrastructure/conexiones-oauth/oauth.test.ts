import assert from "node:assert/strict";
import { test } from "node:test";
import { cifrar, descifrar } from "./cripto.ts";
import { crearVerificador, desafioS256 } from "./pkce.ts";
import { cabeceraCookie, iniciarFlujo, validarCallback } from "./flujo.ts";
import { extrasOtorgados, redirectUri, scopesFaltantes, scopesSolicitados, servicioPorId, SERVICIOS, variablesFaltantes } from "./servicios.ts";
import * as G from "./google.ts";
import * as M from "./meta.ts";
import { tokenVigente, type OpsProveedor } from "./tokens.ts";
import { puedeAdministrarConexiones } from "./acceso.ts";
import { ProveedorError, ReconectarError } from "./tipos.ts";

const env = {
  INTEGRATIONS_TOKEN_ENC_KEY: "b".repeat(64), INTEGRATIONS_PUBLIC_URL: "https://crm.example/",
  GOOGLE_OAUTH_CLIENT_ID: "gid", GOOGLE_OAUTH_CLIENT_SECRET: "gsec",
  META_APP_ID: "mid", META_APP_SECRET: "msec", META_LOGIN_CONFIG_ID: "cfg123",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
type Llamada = { url: string; init?: RequestInit };
const falso = (respuestas: Response[]) => {
  const llamadas: Llamada[] = [];
  const f = (async (url: string | URL | Request, init?: RequestInit) => { llamadas.push({ url: String(url), init }); const r = respuestas.shift(); if (!r) throw new Error("sin respuesta simulada"); return r; }) as typeof fetch;
  return { f, llamadas };
};

test("cifrado AES-GCM: ida y vuelta, sin texto plano, detecta manipulación y exige clave", () => {
  const s = cifrar("ya29.secreto", env);
  assert.equal(s.includes("secreto"), false);
  assert.equal(descifrar(s, env), "ya29.secreto");
  const p = s.split("."); p[3] = Buffer.from("x").toString("base64");
  assert.throws(() => descifrar(p.join("."), env));
  assert.throws(() => cifrar("x", {}));
  assert.throws(() => cifrar("x", { INTEGRATIONS_TOKEN_ENC_KEY: "corta" }));
  // compatibilidad: acepta GOOGLE_TOKEN_ENC_KEY si no hay clave nueva
  const viejo = { GOOGLE_TOKEN_ENC_KEY: "c".repeat(64) };
  assert.equal(descifrar(cifrar("t", viejo), viejo), "t");
});

test("PKCE S256: vector de la RFC 7636 y verificadores distintos", () => {
  assert.equal(desafioS256("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"), "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM");
  const a = crearVerificador(), b = crearVerificador();
  assert.notEqual(a, b);
  assert.match(a, /^[A-Za-z0-9_-]{43}$/);
});

test("flujo: state y PKCE; la cookie viaja cifrada y se valida usuario, proveedor, state y caducidad", () => {
  const ahora = 1_000_000;
  const i = iniciarFlujo({ proveedor: "google", servicio: "gmail", userId: 7, extras: ["enviar"] }, env, ahora);
  assert.equal(i.cookie.includes("gmail"), false, "la cookie no revela el contexto");
  assert.equal(i.cookie.includes(i.verificador), false, "ni el verificador PKCE");
  assert.equal(i.desafio, desafioS256(i.verificador));
  const ok = validarCallback({ cookie: i.cookie, state: i.state, userId: 7, proveedor: "google" }, env, ahora + 1000);
  assert.equal(ok.ok && ok.sesion.v, i.verificador);
  assert.deepEqual(ok.ok && ok.sesion.e, ["enviar"]);
  const motivo = (p: Partial<Parameters<typeof validarCallback>[0]>, t = ahora + 1000) => {
    const r = validarCallback({ cookie: i.cookie, state: i.state, userId: 7, proveedor: "google", ...p }, env, t);
    return r.ok ? "ok" : r.motivo;
  };
  assert.equal(motivo({ state: "otro" }), "state");
  assert.equal(motivo({ state: null }), "state");
  assert.equal(motivo({ userId: 8 }), "usuario");
  assert.equal(motivo({ proveedor: "meta" }), "proveedor");
  assert.equal(motivo({ cookie: null }), "sin-cookie");
  assert.equal(motivo({ cookie: "v1.a.b.c" }), "cookie-invalida");
  assert.equal(motivo({}, ahora + 11 * 60 * 1000), "caducado");
  assert.match(cabeceraCookie(i.cookie), /HttpOnly; Secure; SameSite=Lax/);
});

test("servicios: scopes mínimos, extras incrementales y scopes faltantes", () => {
  const gmail = servicioPorId("gmail")!;
  assert.deepEqual(scopesSolicitados(gmail), ["https://www.googleapis.com/auth/gmail.readonly"]);
  assert.deepEqual(scopesSolicitados(gmail, ["enviar"]), ["https://www.googleapis.com/auth/gmail.readonly", "https://www.googleapis.com/auth/gmail.send"]);
  assert.deepEqual(extrasOtorgados(gmail, "openid email https://www.googleapis.com/auth/gmail.readonly"), []);
  assert.deepEqual(extrasOtorgados(gmail, "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send"), ["enviar"]);
  assert.deepEqual(scopesFaltantes(servicioPorId("calendar")!, "https://www.googleapis.com/auth/calendar.events"), ["https://www.googleapis.com/auth/calendar.calendarlist.readonly"]);
  assert.equal(SERVICIOS.every((s) => s.scopes.length > 0), true);
  // ningún scope amplio de escritura
  assert.equal(SERVICIOS.flatMap((s) => s.scopes).some((s) => /mail\.google\.com|\/auth\/drive$|\/auth\/gmail\.modify/.test(s)), false);
  assert.equal(servicioPorId("gmail")!.sensibilidad, "restringido");
});

test("configuración: variables faltantes y redirect URI sin barra doble", () => {
  assert.deepEqual(variablesFaltantes("google", env), []);
  assert.deepEqual(variablesFaltantes("meta", { ...env, META_APP_SECRET: "" }), ["META_APP_SECRET"]);
  assert.ok(variablesFaltantes("google", {}).includes("INTEGRATIONS_TOKEN_ENC_KEY"));
  assert.equal(redirectUri("google", env), "https://crm.example/api/integraciones/oauth/google/callback");
  assert.equal(redirectUri("meta", env), "https://crm.example/api/integraciones/oauth/meta/callback");
  assert.equal(redirectUri("meta", { GOOGLE_OAUTH_REDIRECT_URI: "https://crm.example/api/integraciones/google/callback" }), "https://crm.example/api/integraciones/oauth/meta/callback");
});

test("Google: URL de consentimiento con PKCE, offline, incremental y selector de cuenta", () => {
  const u = new URL(G.urlAutorizacion({ servicio: servicioPorId("search_console")!, state: "st", desafio: "ch", env }));
  assert.equal(u.origin + u.pathname, "https://accounts.google.com/o/oauth2/v2/auth");
  assert.equal(u.searchParams.get("code_challenge"), "ch");
  assert.equal(u.searchParams.get("code_challenge_method"), "S256");
  assert.equal(u.searchParams.get("state"), "st");
  assert.equal(u.searchParams.get("access_type"), "offline");
  assert.equal(u.searchParams.get("include_granted_scopes"), "true");
  assert.match(u.searchParams.get("prompt")!, /select_account/);
  assert.equal(u.searchParams.get("scope"), "openid email https://www.googleapis.com/auth/webmasters.readonly");
  assert.equal(u.searchParams.get("redirect_uri"), "https://crm.example/api/integraciones/oauth/google/callback");
  assert.equal(u.searchParams.has("client_secret"), false);
});

test("Google: canje con code_verifier, refresh sin devolver refresh_token nuevo, perfil y revocación", async () => {
  const s = falso([json({ access_token: "A1", refresh_token: "R1", expires_in: 3600, scope: "openid email x" }), json({ sub: "123", email: "ana@gmail.com" }), json({ access_token: "A2", expires_in: 3600 }), new Response("", { status: 400 }), new Response("", { status: 200 })]);
  const t = await G.canjearCodigo("codigo", "verif", env, s.f);
  assert.equal(t.accessToken, "A1"); assert.equal(t.refreshToken, "R1");
  const cuerpo = String(s.llamadas[0]!.init!.body);
  assert.match(cuerpo, /code_verifier=verif/); assert.match(cuerpo, /grant_type=authorization_code/);
  assert.deepEqual(await G.perfil("A1", s.f), { id: "123", etiqueta: "ana@gmail.com" });
  const r = await G.refrescar("R1", env, s.f);
  assert.equal(r.accessToken, "A2"); assert.equal(r.refreshToken, undefined);
  assert.equal(await G.revocar("R1", s.f), true, "400 = ya revocado");
  assert.equal(await G.revocar("R1", s.f), true);
});

test("Google: error del token no filtra secretos y marca reconexión con invalid_grant", async () => {
  const s = falso([json({ error: "invalid_grant", error_description: "Token has been expired or revoked." }, 400)]);
  await assert.rejects(() => G.refrescar("RSECRETO", env, s.f), (e: unknown) => {
    assert.ok(e instanceof ProveedorError); assert.equal(e.requiereReconexion, true);
    assert.equal(e.message.includes("RSECRETO") || e.message.includes("gsec"), false);
    return true;
  });
});

test("Google: verificación por servicio (Search Console, GA4, Gmail, Calendar)", async () => {
  const s = falso([
    json({ siteEntry: [{}, {}] }),
    json({ accountSummaries: [{ propertySummaries: [{}, {}] }, { propertySummaries: [{}] }] }),
    json({ emailAddress: "ventas@quisqueyahome.com", messagesTotal: 12345 }),
    json({ items: [{}] }),
  ]);
  assert.deepEqual(await G.verificar(servicioPorId("search_console")!, "A", s.f), { recursos: 2, resumen: "2 sitios accesibles" });
  assert.deepEqual(await G.verificar(servicioPorId("analytics")!, "A", s.f), { recursos: 3, resumen: "3 propiedades GA4" });
  const gm = await G.verificar(servicioPorId("gmail")!, "A", s.f);
  assert.equal(gm.recursos, 12345); assert.match(gm.resumen, /ventas@quisqueyahome\.com/);
  assert.equal((await G.verificar(servicioPorId("calendar")!, "A", s.f)).resumen, "1 calendario con permiso de escritura");
  assert.equal(s.llamadas.every((l) => (l.init!.headers as Record<string, string>).Authorization === "Bearer A"), true);
});

test("Meta: URL con Facebook Login for Business (config_id) o scope ads_read de respaldo; sin secretos", () => {
  const svc = servicioPorId("meta_ads")!;
  const u = new URL(M.urlAutorizacion({ servicio: svc, state: "st", env }));
  assert.equal(u.hostname, "www.facebook.com");
  assert.equal(u.searchParams.get("config_id"), "cfg123");
  assert.equal(u.searchParams.get("override_default_response_type"), "true");
  assert.equal(u.searchParams.has("scope"), false);
  assert.equal(u.searchParams.get("state"), "st");
  assert.equal(u.searchParams.has("client_secret"), false);
  const sin = new URL(M.urlAutorizacion({ servicio: svc, state: "st", env: { ...env, META_LOGIN_CONFIG_ID: "" } }));
  assert.equal(sin.searchParams.get("scope"), "ads_read");
  assert.equal(sin.searchParams.has("config_id"), false);
});

test("Meta: código → token corto → token de larga duración; renovar, perfil, permisos, revocar y verificar", async () => {
  const s = falso([
    json({ access_token: "CORTO", expires_in: 3600 }), json({ access_token: "LARGO", expires_in: 5184000 }),
    json({ access_token: "LARGO2", expires_in: 5184000 }), json({ id: "999", name: "Wilber Mena" }),
    json({ data: [{ permission: "ads_read", status: "granted" }, { permission: "email", status: "declined" }] }),
    json({ success: true }), json({ data: [{}, {}] }),
  ]);
  const t = await M.canjearCodigo("cod", "ads_read", env, s.f);
  assert.equal(t.accessToken, "LARGO");
  assert.ok(t.expiresAt && t.expiresAt.getTime() > Date.now() + 50 * 86400_000, "larga duración (~60 días)");
  assert.match(s.llamadas[0]!.url, /oauth\/access_token\?.*code=cod/);
  assert.match(s.llamadas[1]!.url, /grant_type=fb_exchange_token&.*fb_exchange_token=CORTO/);
  assert.equal((await M.renovar("LARGO", "ads_read", env, s.f)).accessToken, "LARGO2");
  assert.deepEqual(await M.perfil("LARGO", env, s.f), { id: "999", etiqueta: "Wilber Mena" });
  assert.deepEqual(await M.permisosConcedidos("LARGO", env, s.f), ["ads_read"]);
  assert.equal(await M.revocar("LARGO", env, s.f), true);
  assert.equal(s.llamadas[5]!.init!.method, "DELETE");
  assert.deepEqual(await M.verificar("LARGO", env, s.f), { recursos: 2, resumen: "2 cuentas publicitarias" });
});

test("Meta: token largo sin vencimiento queda con expiresAt null", async () => {
  const s = falso([json({ access_token: "C" }), json({ access_token: "L" })]);
  assert.equal((await M.canjearCodigo("c", "ads_read", env, s.f)).expiresAt, null);
});

const ahora = new Date("2026-10-30T14:00:00Z");
const ops = (over: Partial<OpsProveedor> = {}): OpsProveedor => ({
  refrescarGoogle: async () => ({ accessToken: "NUEVO", expiresAt: new Date(ahora.getTime() + 3600_000), scopes: "" }),
  renovarMeta: async () => ({ accessToken: "META2", expiresAt: new Date(ahora.getTime() + 60 * 86400_000), scopes: "" }),
  ...over,
});

test("tokenVigente Google: usa el vigente, refresca el vencido y pide reconectar si no hay refresh o fue revocado", async () => {
  const base = { proveedor: "google" as const, accessToken: "A", refreshToken: "R", scopes: "s" };
  assert.deepEqual(await tokenVigente({ ...base, expiresAt: new Date(ahora.getTime() + 600_000) }, ops(), ahora), { accessToken: "A" });
  const r = await tokenVigente({ ...base, expiresAt: new Date(ahora.getTime() - 1) }, ops(), ahora);
  assert.equal(r.accessToken, "NUEVO"); assert.equal(r.renovado?.scopes, "s");
  await assert.rejects(() => tokenVigente({ ...base, refreshToken: null, expiresAt: new Date(ahora.getTime() - 1) }, ops(), ahora), ReconectarError);
  await assert.rejects(() => tokenVigente({ ...base, expiresAt: new Date(ahora.getTime() - 1) }, ops({ refrescarGoogle: async () => { throw new ProveedorError("Google", 400, "invalid_grant"); } }), ahora), ReconectarError);
  await assert.rejects(() => tokenVigente({ ...base, expiresAt: new Date(ahora.getTime() - 1) }, ops({ refrescarGoogle: async () => { throw new ProveedorError("Google", 503); } }), ahora), ProveedorError);
});

test("tokenVigente Meta: renueva dentro de 7 días, tolera fallo si aún sirve, exige reconexión si venció", async () => {
  const base = { proveedor: "meta" as const, accessToken: "M", refreshToken: null, scopes: "ads_read" };
  assert.deepEqual(await tokenVigente({ ...base, expiresAt: null }, ops(), ahora), { accessToken: "M" });
  assert.deepEqual(await tokenVigente({ ...base, expiresAt: new Date(ahora.getTime() + 30 * 86400_000) }, ops(), ahora), { accessToken: "M" });
  const cerca = { ...base, expiresAt: new Date(ahora.getTime() + 3 * 86400_000) };
  assert.equal((await tokenVigente(cerca, ops(), ahora)).renovado?.accessToken, "META2");
  assert.deepEqual(await tokenVigente(cerca, ops({ renovarMeta: async () => { throw new ProveedorError("Meta", 500); } }), ahora), { accessToken: "M" });
  await assert.rejects(() => tokenVigente({ ...base, expiresAt: new Date(ahora.getTime() - 1) }, ops({ renovarMeta: async () => { throw new ProveedorError("Meta", 500); } }), ahora), ReconectarError);
  await assert.rejects(() => tokenVigente(cerca, ops({ renovarMeta: async () => { throw new ProveedorError("Meta", 400, "OAuthException"); } }), ahora), ReconectarError);
});

test("RBAC: solo el administrador con settings:edit total y sin solo lectura conecta", () => {
  assert.equal(puedeAdministrarConexiones({ roleSlug: "admin" }, "all"), true);
  assert.equal(puedeAdministrarConexiones({ roleSlug: "admin", readOnly: true }, "all"), false);
  assert.equal(puedeAdministrarConexiones({ roleSlug: "admin" }, "own"), false);
  assert.equal(puedeAdministrarConexiones({ roleSlug: "broker" }, "all"), false);
});
