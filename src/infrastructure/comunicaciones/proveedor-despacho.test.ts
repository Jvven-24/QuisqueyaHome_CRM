import assert from "node:assert/strict";
import dns from "node:dns/promises";
import https from "node:https";
import { EventEmitter } from "node:events";
import { PassThrough } from "node:stream";
import { test, type TestContext } from "node:test";
import { ProveedorDespachoMulticanal } from "./proveedor-despacho.ts";

const destination = "https://hooks.example.org/crm";
const message = { canal: "webhook" as const, destinatario: destination, mensaje: "fixture" };

test("F01: sin destinos registrados no hay solicitud saliente", async (t) => {
  const previous = process.env.CRM_WEBHOOK_DESTINATIONS;
  delete process.env.CRM_WEBHOOK_DESTINATIONS;
  t.after(() => { if (previous === undefined) delete process.env.CRM_WEBHOOK_DESTINATIONS; else process.env.CRM_WEBHOOK_DESTINATIONS = previous; });
  const fetchMock = t.mock.method(globalThis, "fetch", async () => new Response("", { status: 200 }));
  const requestMock = t.mock.method(https, "request", () => { throw new Error("solicitud no autorizada"); });
  assert.equal((await new ProveedorDespachoMulticanal().despachar(message)).ok, false);
  assert.equal(fetchMock.mock.callCount(), 0);
  assert.equal(requestMock.mock.callCount(), 0);
});

function configure(t: TestContext, destinations = [destination]) {
  // Aísla también el transporte anterior al arreglo durante las mutaciones.
  t.mock.method(globalThis, "fetch", async () => new Response("", { status: 200 }));
  const previous = process.env.CRM_WEBHOOK_DESTINATIONS;
  process.env.CRM_WEBHOOK_DESTINATIONS = JSON.stringify(destinations);
  t.after(() => { if (previous === undefined) delete process.env.CRM_WEBHOOK_DESTINATIONS; else process.env.CRM_WEBHOOK_DESTINATIONS = previous; });
}

test("F01: rechaza URL libre, protocolo, puerto y credenciales antes de conectar", async (t) => {
  configure(t, [destination, "http://hooks.example.org/crm", "https://hooks.example.org:8443/crm", "https://user@hooks.example.org/crm"]);
  const requestMock = t.mock.method(https, "request", () => { throw new Error("no conectar"); });
  for (const url of ["https://other.example.org/crm", `${destination}/other`, "http://hooks.example.org/crm", "https://hooks.example.org:8443/crm", "https://user@hooks.example.org/crm"]) {
    assert.equal((await new ProveedorDespachoMulticanal().despachar({ ...message, destinatario: url })).ok, false);
  }
  assert.equal(requestMock.mock.callCount(), 0);
});

test("F01: bloquea IP internas, reservadas y DNS mixto incluso registrados", async (t) => {
  const blocked = ["127.0.0.1", "10.1.2.3", "172.16.0.1", "192.168.0.1", "169.254.169.254", "100.64.0.1", "0.0.0.0", "224.0.0.1", "::1", "fc00::1", "fe80::1", "::ffff:127.0.0.1", "2002:7f00:1::1", "2001:db8::1"];
  configure(t);
  const resolver = t.mock.method(dns, "lookup", async () => [{ address: "127.0.0.1", family: 4 }]);
  const requestMock = t.mock.method(https, "request", () => { throw new Error("no conectar"); });
  for (const address of blocked) {
    resolver.mock.mockImplementation(async () => [{ address, family: address.includes(":") ? 6 : 4 }]);
    assert.equal((await new ProveedorDespachoMulticanal().despachar(message)).ok, false, address);
  }
  resolver.mock.mockImplementation(async () => [{ address: "93.184.216.34", family: 4 }, { address: "10.0.0.1", family: 4 }]);
  assert.equal((await new ProveedorDespachoMulticanal().despachar(message)).ok, false);
  assert.equal(requestMock.mock.callCount(), 0);
});

test("F01: IP literal interna y loopback ofuscado no alcanzan el transporte", async (t) => {
  const urls = ["https://127.0.0.1/", "https://2130706433/", "https://[::1]/", "https://[::ffff:127.0.0.1]/"];
  configure(t, urls);
  const requestMock = t.mock.method(https, "request", () => { throw new Error("no conectar"); });
  for (const url of urls) assert.equal((await new ProveedorDespachoMulticanal().despachar({ ...message, destinatario: url })).ok, false);
  assert.equal(requestMock.mock.callCount(), 0);
});

test("F01: fija DNS público en transporte, conserva TLS y no sigue redirects", async (t) => {
  configure(t);
  const resolver = t.mock.method(dns, "lookup", async () => [{ address: "93.184.216.34", family: 4 }]);
  const options: https.RequestOptions[] = [];
  let status = 204;
  t.mock.method(https, "request", ((_url: URL, config: https.RequestOptions, callback: (response: PassThrough & { statusCode: number }) => void) => {
    options.push(config);
    const request = new EventEmitter() as EventEmitter & { end: () => void };
    request.end = () => queueMicrotask(() => { const response = Object.assign(new PassThrough(), { statusCode: status }); callback(response); });
    return request;
  }) as unknown as typeof https.request);
  assert.equal((await new ProveedorDespachoMulticanal().despachar(message)).ok, true);
  const config = options[0]!;
  assert.equal(config.agent, false);
  assert.notEqual(config.rejectUnauthorized, false);
  assert.ok(config.signal);
  // Una segunda resolución daría IP interna: el lookup de conexión usa la ya validada.
  resolver.mock.mockImplementation(async () => [{ address: "127.0.0.1", family: 4 }]);
  await new Promise<void>((resolve, reject) => {
    config.lookup!("hooks.example.org", { all: false }, (error, address, family) => {
      if (error) return reject(error);
      assert.equal(address, "93.184.216.34"); assert.equal(family, 4); resolve();
    });
  });
  assert.equal(resolver.mock.callCount(), 1);
  resolver.mock.mockImplementation(async () => [{ address: "93.184.216.34", family: 4 }]);
  status = 302;
  assert.equal((await new ProveedorDespachoMulticanal().despachar(message)).ok, false);
  assert.equal(options.length, 2);
});

test("F01: timeout y errores de red no reflejan detalles externos", async (t) => {
  configure(t);
  t.mock.method(dns, "lookup", async () => [{ address: "93.184.216.34", family: 4 }]);
  const timeoutMock = t.mock.method(AbortSignal, "timeout", (ms: number) => { assert.equal(ms, 10000); return AbortSignal.abort(); });
  const requestMock = t.mock.method(https, "request", () => { throw new Error("detalle externo privado"); });
  const result = await new ProveedorDespachoMulticanal().despachar(message);
  assert.equal(result.ok, false);
  assert.equal(result.error?.includes("detalle externo"), false);
  assert.equal(timeoutMock.mock.callCount(), 1);
  assert.equal(requestMock.mock.callCount(), 0);
});

test("F01: aborta DNS pendiente dentro del límite sin abrir socket", async (t) => {
  configure(t);
  const controller = new AbortController();
  t.mock.method(AbortSignal, "timeout", () => controller.signal);
  t.mock.method(dns, "lookup", () => new Promise(() => {}));
  const requestMock = t.mock.method(https, "request", () => { throw new Error("no conectar"); });
  const pending = new ProveedorDespachoMulticanal().despachar(message);
  controller.abort();
  assert.equal((await pending).ok, false);
  assert.equal(requestMock.mock.callCount(), 0);
});

test("F01: el timeout del transporte cancela la solicitud; error externo sanitizado", async (t) => {
  configure(t);
  const controller = new AbortController();
  t.mock.method(AbortSignal, "timeout", () => controller.signal);
  t.mock.method(dns, "lookup", async () => [{ address: "2606:4700:4700::1111", family: 6 }]);
  const requestMock = t.mock.method(https, "request", ((_url: URL, config: https.RequestOptions) => {
    const request = new EventEmitter() as EventEmitter & { end: () => void };
    config.signal!.addEventListener("abort", () => request.emit("error", new Error("detalle externo privado")));
    request.end = () => controller.abort();
    return request;
  }) as unknown as typeof https.request);
  const result = await new ProveedorDespachoMulticanal().despachar(message);
  assert.equal(result.ok, false);
  assert.equal(controller.signal.aborted, true);
  assert.equal(result.error?.includes("detalle externo"), false);
  assert.equal(requestMock.mock.callCount(), 1);
});

test("F01: registro inválido mantiene el webhook cerrado", async (t) => {
  configure(t);
  process.env.CRM_WEBHOOK_DESTINATIONS = "{}";
  const requestMock = t.mock.method(https, "request", () => { throw new Error("no conectar"); });
  assert.equal((await new ProveedorDespachoMulticanal().despachar(message)).ok, false);
  process.env.CRM_WEBHOOK_DESTINATIONS = "[";
  assert.equal((await new ProveedorDespachoMulticanal().despachar(message)).ok, false);
  assert.equal(requestMock.mock.callCount(), 0);
});
