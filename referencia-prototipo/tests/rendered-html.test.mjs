import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("renders the Quisqueya Home CRM login", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>Quisqueya Home CRM<\/title>/i);
  assert.match(html, /Iniciar sesión/);
  assert.match(html, /Entrar al CRM/);
  assert.doesNotMatch(html, /screen\.png|iframe/i);
});

test("keeps the definitive modules and integration hooks in source", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  for (const moduleName of [
    "Leads",
    "Contactos",
    "Pipeline",
    "Citas y agenda",
    "Propiedades internas",
    "Brokers",
    "Academy",
    "Metas y desempeño",
    "Comisiones",
    "Tareas y actividades",
    "Comunicaciones",
    "Reportes y BI",
    "Avances de obra",
    "Configuración y permisos",
  ]) {
    assert.match(page, new RegExp(moduleName));
  }
  assert.match(page, /calendar\.google\.com\/calendar\/render/);
  assert.match(page, /text\/calendar/);
  assert.match(page, /WhatsApp Business/);
});
