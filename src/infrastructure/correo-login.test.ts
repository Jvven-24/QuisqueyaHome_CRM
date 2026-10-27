import test from "node:test";
import assert from "node:assert/strict";
import { plantillaEnlace, urlPublica, correoConfigurado } from "./correo.ts";
import { crearState, urlConsentimiento, usuarioDelState, validarState } from "./google-cuentas.ts";

const env = { GOOGLE_TOKEN_ENC_KEY: "a".repeat(64), GOOGLE_OAUTH_CLIENT_ID: "cid", GOOGLE_OAUTH_REDIRECT_URI: "https://crm.example.com/api/integraciones/google/callback" };

test("urlPublica usa APP_PUBLIC_URL o el origen del redirect de Google", () => {
  assert.equal(urlPublica({ APP_PUBLIC_URL: "https://x.com/" }), "https://x.com");
  assert.equal(urlPublica(env), "https://crm.example.com");
  assert.equal(correoConfigurado({}), false);
});

test("la plantilla escapa HTML y conserva el enlace en texto", () => {
  const c = plantillaEnlace("Hola <b>", "cuerpo", "Ir", "https://x.com/?a=1&b=2", "pie");
  assert.ok(!c.html.includes("<b>"));
  assert.ok(c.texto.includes("https://x.com/?a=1&b=2"));
});

test("el login con Google pide solo identidad y usa el mismo redirect", () => {
  const { state, nonce } = crearState(0, env);
  assert.equal(usuarioDelState(state), "0");
  assert.ok(validarState(state, nonce, 0, env));
  assert.ok(!validarState(state, nonce, 5, env));
  const u = new URL(urlConsentimiento(state, env, "login"));
  assert.equal(u.searchParams.get("scope"), "openid email");
  assert.equal(u.searchParams.get("access_type"), null);
  assert.equal(u.searchParams.get("redirect_uri"), env.GOOGLE_OAUTH_REDIRECT_URI);
  assert.match(new URL(urlConsentimiento(state, env)).searchParams.get("scope") ?? "", /calendar/);
});
