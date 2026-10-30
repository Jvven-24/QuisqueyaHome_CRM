import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { test } from "node:test";
import * as P from "./proveedores-externos.ts";

const ok = (body: unknown = {}) => (async () => new Response(JSON.stringify(body), { status: 200 })) as unknown as typeof fetch;
const capt = () => { const calls: { url: string; init?: RequestInit }[] = []; const f = (async (url: string, init?: RequestInit) => { calls.push({ url, init }); return new Response(JSON.stringify({ id: "m1" }), { status: 200 }); }) as unknown as typeof fetch; return { calls, f }; };

test("WA: elige YCloud o Cloud API por env", () => {
  assert.equal(P.proveedorWhatsApp({ YCLOUD_API_KEY: "k", YCLOUD_WHATSAPP_FROM: "+1" }), "ycloud");
  assert.equal(P.proveedorWhatsApp({ WHATSAPP_API_TOKEN: "t", WHATSAPP_PHONE_NUMBER_ID: "1" }), "cloud");
  assert.equal(P.proveedorWhatsApp({ WHATSAPP_PROVIDER: "cloud", YCLOUD_API_KEY: "k" }), "ninguno");
  assert.equal(P.proveedorWhatsApp({}), "ninguno");
});

test("WA YCloud: payload correcto", async () => {
  const { calls, f } = capt();
  const r = await P.enviarWhatsApp("+18090000000", "hola", { YCLOUD_API_KEY: "k", YCLOUD_WHATSAPP_FROM: "+1809" }, f);
  assert.equal(r.ok, true); assert.match(calls[0]!.url, /ycloud/);
  assert.equal(JSON.parse(String(calls[0]!.init?.body)).to, "+18090000000");
});

test("WA Cloud API: payload correcto", async () => {
  const { calls, f } = capt();
  await P.enviarWhatsApp("+18090000000", "hola", { WHATSAPP_API_TOKEN: "t", WHATSAPP_PHONE_NUMBER_ID: "99" }, f);
  assert.match(calls[0]!.url, /graph\.facebook\.com\/v21\.0\/99\/messages/);
  assert.equal(JSON.parse(String(calls[0]!.init?.body)).to, "18090000000");
});

test("modo prueba bloquea destinos fuera de la allowlist", async () => {
  const { calls, f } = capt();
  const env = { YCLOUD_API_KEY: "k", YCLOUD_WHATSAPP_FROM: "+1", INTEGRATIONS_TEST_MODE: "1", INTEGRATIONS_TEST_ALLOWLIST: "+18091112222" };
  assert.equal((await P.enviarWhatsApp("+18093334444", "x", env, f)).ok, false);
  assert.equal(calls.length, 0);
  assert.equal((await P.enviarWhatsApp("+18091112222", "x", env, f)).ok, true);
});

test("webhook WA: parsea YCloud y Cloud API", () => {
  assert.deepEqual(P.parsearWebhookWhatsApp({ type: "whatsapp.inbound_message.received", whatsappInboundMessage: { from: "+1", id: "a", type: "text", text: { body: "hi" } } }), [{ de: "+1", texto: "hi", id: "a" }]);
  assert.equal(P.parsearWebhookWhatsApp({ entry: [{ changes: [{ value: { messages: [{ from: "1", id: "b", type: "text", text: { body: "yo" } }] } }] }] })[0]!.de, "+1");
});

test("firmas: Meta y YCloud", () => {
  const raw = '{"a":1}';
  assert.equal(P.firmaMetaValida(raw, "sha256=" + createHmac("sha256", "s").update(raw).digest("hex"), "s"), true);
  assert.equal(P.firmaMetaValida(raw, "sha256=00", "s"), false);
  assert.equal(P.firmaMetaValida(raw, null, "s"), false);
  const s = createHmac("sha256", "w").update(`10.${raw}`).digest("hex");
  assert.equal(P.firmaYCloudValida(raw, `t=10,s=${s}`, "w"), true);
  assert.equal(P.firmaYCloudValida(raw, `t=11,s=${s}`, "w"), false);
});

test("reto Meta y leadgen", () => {
  const q = new URLSearchParams({ "hub.mode": "subscribe", "hub.verify_token": "v", "hub.challenge": "42" });
  assert.equal(P.verificarRetoMeta(q, { META_WEBHOOK_VERIFY_TOKEN: "v" }), "42");
  assert.equal(P.verificarRetoMeta(q, { META_WEBHOOK_VERIFY_TOKEN: "x" }), null);
  assert.deepEqual(P.leadgenIds({ entry: [{ changes: [{ field: "leadgen", value: { leadgen_id: 7, form_id: "f" } }] }] }), [{ leadId: "7", formId: "f", pageId: undefined, adId: undefined }]);
});

test("CAPI: hashea PII e incluye test_event_code", async () => {
  const { calls, f } = capt();
  const r = await P.eventoCAPI({ nombre: "Lead", email: " A@B.com ", id: "e1" }, { META_PIXEL_ID: "px", META_CAPI_ACCESS_TOKEN: "t", META_CAPI_TEST_EVENT_CODE: "TEST1" }, f);
  assert.equal(r.ok, true);
  const b = JSON.parse(String(calls[0]!.init?.body));
  assert.equal(b.test_event_code, "TEST1");
  assert.equal(b.data[0].user_data.em[0].length, 64);
  assert.equal((await P.eventoCAPI({ nombre: "Lead", id: "x" }, {}, f)).ok, false);
});

test("correo: Resend o simulado", async () => {
  assert.equal(P.proveedorCorreo({}), "simulado");
  assert.equal((await P.enviarCorreo("a@b.c", "s", "h", {}, ok())).simulado, true);
  const { calls, f } = capt();
  assert.equal((await P.enviarCorreo("a@b.c", "s", "h", { RESEND_API_KEY: "k", RESEND_FROM: "x@y.z" }, f)).ok, true);
  assert.match(calls[0]!.url, /resend/);
});

test("Google: URL OAuth, evento y Drive", async () => {
  assert.equal(P.urlAutorizacionGoogle("s", {}), null);
  assert.match(P.urlAutorizacionGoogle("s", { GOOGLE_OAUTH_CLIENT_ID: "c", GOOGLE_OAUTH_REDIRECT_URI: "https://x/cb" })!, /calendar\.events/);
  assert.equal((await P.crearEventoCalendar("t", { titulo: "Visita", inicio: "2026-11-01T10:00:00", fin: "2026-11-01T11:00:00" }, ok({ id: "ev" }))).id, "ev");
  assert.deepEqual(await P.listarDrive("t", "f", ok({ files: [] })), []);
});

test("estado: nunca expone valores", () => {
  const e = P.estadoProveedores({ YCLOUD_API_KEY: "SECRETO", YCLOUD_WHATSAPP_FROM: "+1" });
  assert.equal(e.find((x) => x.id === "whatsapp")!.conectado, true);
  assert.equal(JSON.stringify(e).includes("SECRETO"), false);
});
