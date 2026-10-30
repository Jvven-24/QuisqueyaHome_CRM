import assert from "node:assert/strict";
import { test } from "node:test";
import * as G from "./google-cuentas.ts";

const env = { GOOGLE_TOKEN_ENC_KEY: "a".repeat(64), GOOGLE_OAUTH_CLIENT_ID: "cid", GOOGLE_OAUTH_CLIENT_SECRET: "sec", GOOGLE_OAUTH_REDIRECT_URI: "https://crm.example/api/integraciones/google/callback" };
const resp = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

test("cifrado AES-GCM: ida y vuelta, no es texto plano y detecta manipulación", () => {
  const s = G.cifrar("ya29.secreto", env);
  assert.equal(s.includes("secreto"), false);
  assert.equal(G.descifrar(s, env), "ya29.secreto");
  const p = s.split("."); p[3] = Buffer.from("x").toString("base64");
  assert.throws(() => G.descifrar(p.join("."), env));
  assert.throws(() => G.cifrar("x", { GOOGLE_TOKEN_ENC_KEY: "corta" }));
});

test("state anti-CSRF: válido solo con cookie, usuario y firma correctos", () => {
  const { state, nonce } = G.crearState(7, env);
  assert.equal(G.validarState(state, nonce, 7, env), true);
  assert.equal(G.validarState(state, nonce, 8, env), false);
  assert.equal(G.validarState(state, "otro", 7, env), false);
  assert.equal(G.validarState(state, null, 7, env), false);
  // Firma manipulada: el último dígito hex se cambia siempre por otro distinto
  // (antes se forzaba "0" y fallaba 1/16 veces cuando la firma ya acababa en "0").
  const otro = state.endsWith("0") ? "1" : "0";
  assert.equal(G.validarState(state.replace(/.$/, otro), nonce, 7, env), false);
});

test("URL de consentimiento: scopes, offline y selector de cuenta", () => {
  const u = new URL(G.urlConsentimiento("st", env));
  assert.equal(u.searchParams.get("access_type"), "offline");
  assert.match(u.searchParams.get("prompt")!, /select_account/);
  assert.match(u.searchParams.get("scope")!, /calendar\.events/);
  assert.equal(u.searchParams.get("redirect_uri"), env.GOOGLE_OAUTH_REDIRECT_URI);
  assert.deepEqual(G.configuradoGoogle(env), []);
  assert.equal(G.configuradoGoogle({}).length, 4);
});

test("canje de código, perfil, calendarios y evento", async () => {
  const f = (async (url: string) => {
    if (url.includes("/token")) return resp({ access_token: "at", refresh_token: "rt", expires_in: 3600, scope: "email" });
    if (url.includes("userinfo")) return resp({ sub: "123", email: "a@b.com" });
    if (url.includes("calendarList")) return resp({ items: [{ id: "primary@x", summary: "Personal", primary: true }, { id: "c2", summary: "Visitas" }] });
    if (url.includes("/events")) return resp({ id: "ev1" });
    return resp({}, 404);
  }) as unknown as typeof fetch;
  const t = await G.canjearCodigo("code", env, f);
  assert.equal(t.refreshToken, "rt");
  assert.equal((await G.perfil("at", f)).email, "a@b.com");
  const cals = await G.listarCalendarios("at", f);
  assert.equal(cals.length, 2); assert.equal(cals[0]!.primary, true);
  assert.equal(await G.crearEvento("at", "c2", { titulo: "Visita", inicio: "2026-11-01T10:00:00-04:00", fin: "2026-11-01T11:00:00-04:00" }, f), "ev1");
});

test("tokenVigente: usa el cifrado si no venció y refresca si venció", async () => {
  let llamadas = 0;
  const f = (async () => { llamadas++; return resp({ access_token: "nuevo", expires_in: 3600 }); }) as unknown as typeof fetch;
  const vigente = { accessTokenEnc: G.cifrar("viejo", env), refreshTokenEnc: G.cifrar("rt", env), expiresAt: new Date(Date.now() + 60_000) };
  assert.equal((await G.tokenVigente(vigente, env, f)).accessToken, "viejo");
  assert.equal(llamadas, 0);
  const r = await G.tokenVigente({ ...vigente, expiresAt: new Date(0) }, env, f);
  assert.equal(r.accessToken, "nuevo"); assert.ok(r.renovado);
  await assert.rejects(G.tokenVigente({ ...vigente, refreshTokenEnc: null, expiresAt: new Date(0) }, env, f));
});

test("revocar: ok y ya revocado cuentan como éxito; error de red no", async () => {
  assert.equal(await G.revocar("t", (async () => resp({}, 200)) as unknown as typeof fetch), true);
  assert.equal(await G.revocar("t", (async () => resp({}, 400)) as unknown as typeof fetch), true);
  assert.equal(await G.revocar("t", (async () => resp({}, 500)) as unknown as typeof fetch), false);
});
