import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import { can, type Actor } from "../../domain/rbac.ts";
import { ENTRADAS_N1, ENTRADAS_PIE, MODULOS, WORKSPACES } from "../../app/(crm)/modulos.ts";

const require = createRequire(import.meta.url);

function moduleUrl(source: string, filename: string): string {
  const js = ts.transpileModule(source, {
    fileName: filename,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
  const resolved = js
    .replace(/from "react\/jsx-runtime"/g, `from ${JSON.stringify(pathToFileURL(require.resolve("react/jsx-runtime")).href)}`)
    .replace(/from "react"/g, `from ${JSON.stringify(pathToFileURL(require.resolve("react")).href)}`)
    .replace(/from "lucide-react"/g, `from ${JSON.stringify(pathToFileURL(require.resolve("lucide-react")).href)}`);
  return `data:text/javascript;base64,${Buffer.from(resolved).toString("base64")}`;
}

const estadosSource = readFileSync("src/app/(crm)/_ui/estados.tsx", "utf8");
const estadosUrl = moduleUrl(estadosSource, "estados.tsx");
const {
  EstadoCarga,
  Vacio,
  SinResultados,
  EstadoError,
  EstadoOffline,
  AvisoPermiso,
} = await import(estadosUrl);

test("D05 - 6 Estados Canónicos: EstadoCarga renderiza skeleton con aria-busy", () => {
  const htmlTabla = renderToStaticMarkup(React.createElement(EstadoCarga, { filas: 3, tipo: "tabla" }));
  assert.ok(htmlTabla.includes('aria-busy="true"'));
  assert.ok(htmlTabla.includes("skeleton-block"));

  const htmlTarjetas = renderToStaticMarkup(React.createElement(EstadoCarga, { filas: 2, tipo: "tarjeta" }));
  assert.ok(htmlTarjetas.includes('aria-busy="true"'));
  assert.ok(htmlTarjetas.includes("skeleton-block"));
});

test("D05 - 6 Estados Canónicos: Vacio renderiza título, mensaje y acción", () => {
  const accion = React.createElement("button", { type: "button" }, "Crear primer contacto");
  const html = renderToStaticMarkup(
    React.createElement(Vacio, {
      titulo: "Sin contactos registrados",
      texto: "Empieza añadiendo tu primer inversionista o comprador.",
      accion,
    })
  );
  assert.ok(html.includes("Sin contactos registrados"));
  assert.ok(html.includes("Empieza añadiendo tu primer inversionista"));
  assert.ok(html.includes("Crear primer contacto"));
  assert.ok(html.includes("empty"));
});

test("D05 - 6 Estados Canónicos: SinResultados muestra chips y botón limpiar", () => {
  const html = renderToStaticMarkup(
    React.createElement(SinResultados, {
      texto: "No se encontraron leads con los filtros actuales.",
      chips: ["Etapa: Contactado", "Tipo: Villa"],
      onLimpiar: () => {},
    })
  );
  assert.ok(html.includes("Sin resultados"));
  assert.ok(html.includes("No se encontraron leads con los filtros actuales."));
  assert.ok(html.includes("Etapa: Contactado"));
  assert.ok(html.includes("Tipo: Villa"));
  assert.ok(html.includes("Limpiar filtros"));
});

test("D05 - 6 Estados Canónicos: EstadoError renderiza role='alert', código y botón reintentar", () => {
  const errorObj = { message: "Fallo de conexión", digest: "ERR_TIMEOUT_504" };
  const html = renderToStaticMarkup(
    React.createElement(EstadoError, {
      error: errorObj,
      titulo: "Error al consultar inventario",
      onReintentar: () => {},
    })
  );
  assert.ok(html.includes('role="alert"'));
  assert.ok(html.includes("Error al consultar inventario"));
  assert.ok(html.includes("Fallo de conexión"));
  assert.ok(html.includes("ERR_TIMEOUT_504"));
  assert.ok(html.includes("Reintentar"));
  assert.ok(html.includes("min-h-[48px]"));
});

test("D05 - 6 Estados Canónicos: EstadoOffline renderiza role='status' y reconexión", () => {
  const html = renderToStaticMarkup(
    React.createElement(EstadoOffline, {
      mensaje: "Sin conexión de red en Cap Cana Lounge",
      onReconectar: () => {},
    })
  );
  assert.ok(html.includes('role="status"'));
  assert.ok(html.includes("Sin conexión de red en Cap Cana Lounge"));
  assert.ok(html.includes("Reconectar"));
});

test("D05 - 6 Estados Canónicos: AvisoPermiso renderiza role='note' y motivo explicativo", () => {
  const html = renderToStaticMarkup(
    React.createElement(AvisoPermiso, {
      titulo: "Acceso denegado a Finanzas",
      motivo: "Tu rol de Broker no cuenta con permisos para ver comisiones generales.",
    })
  );
  assert.ok(html.includes('role="note"'));
  assert.ok(html.includes("permission-note"));
  assert.ok(html.includes("Acceso denegado a Finanzas"));
  assert.ok(html.includes("Tu rol de Broker no cuenta con permisos"));
});

test("D05 - N1 Navegación: ENTRADAS_N1 tiene 9 accesos y ENTRADAS_PIE tiene 2", () => {
  assert.equal(ENTRADAS_N1.length, 9, "Debe haber exactamente 9 entradas principales N1");
  assert.equal(ENTRADAS_PIE.length, 2, "Debe haber exactamente 2 entradas ancladas en el pie (Academy y Configuración)");

  // Verificar IDs y rutas canónicas
  const rutasN1 = ENTRADAS_N1.map((e) => e.ruta);
  assert.deepEqual(rutasN1, [
    "/inicio",
    "/leads",
    "/negocios",
    "/contactos",
    "/propiedades",
    "/agenda",
    "/comunicaciones",
    "/brokers",
    "/comisiones",
  ]);

  const rutasPie = ENTRADAS_PIE.map((e) => e.ruta);
  assert.deepEqual(rutasPie, ["/academy", "/configuracion"]);
});

test("D05 - N1 Navegación: preserva módulos canónicos y añade los siete destinos de la ola S1", () => {
  const rutas = MODULOS.map(module => module.ruta);
  assert.equal(new Set(rutas).size, 22, "22 rutas únicas: 15 existentes y 7 nuevas");
  for (const route of ["/inicio", "/leads", "/negocios", "/contactos", "/propiedades", "/avances", "/agenda", "/tareas", "/brokers", "/metas", "/comisiones", "/comunicaciones", "/reportes", "/academy", "/configuracion", "/aprobaciones", "/reservas", "/documentos", "/posventa", "/portal", "/comunidad", "/automatizaciones"]) assert.ok(rutas.includes(route), route);
  assert.equal(WORKSPACES.length, 4, "WORKSPACES debe preservar los 4 workspaces");
});

test("D05 - RBAC: can() filtra N1 y pie correctamente según rol de actor", () => {
  const adminActor: Actor = {
    userId: 1,
    roleSlug: "admin",
    permissions: [
      { resource: "dashboard", action: "view", scope: "all" },
      { resource: "leads", action: "view", scope: "all" },
      { resource: "deals", action: "view", scope: "all" },
      { resource: "contacts", action: "view", scope: "all" },
      { resource: "projects", action: "view", scope: "all" },
      { resource: "activities", action: "view", scope: "all" },
      { resource: "communications", action: "view", scope: "all" },
      { resource: "brokers", action: "view", scope: "all" },
      { resource: "commissions", action: "view", scope: "all" },
      { resource: "academy", action: "view", scope: "all" },
      { resource: "settings", action: "view", scope: "all" },
    ],
  };
  const brokerActor: Actor = {
    userId: 2,
    roleSlug: "broker",
    permissions: [
      { resource: "dashboard", action: "view", scope: "own" },
      { resource: "leads", action: "view", scope: "own" },
      { resource: "deals", action: "view", scope: "own" },
      { resource: "contacts", action: "view", scope: "own" },
      { resource: "projects", action: "view", scope: "all" },
      { resource: "activities", action: "view", scope: "own" },
      { resource: "academy", action: "view", scope: "all" },
      { resource: "settings", action: "view", scope: "none" },
    ],
  };

  // Admin tiene acceso a todos los módulos y pie
  const n1Admin = ENTRADAS_N1.filter((e) => can(adminActor, e.recurso, "view"));
  assert.equal(n1Admin.length, 9, "Admin debe ver las 9 entradas N1");

  const pieAdmin = ENTRADAS_PIE.filter((e) => can(adminActor, e.recurso, "view"));
  assert.equal(pieAdmin.length, 2, "Admin debe ver las 2 entradas del pie");

  // Broker no tiene acceso a settings por defecto
  const pieBroker = ENTRADAS_PIE.filter((e) => can(brokerActor, e.recurso, "view"));
  const tieneSettings = pieBroker.some((e) => e.ruta === "/configuracion");
  assert.equal(tieneSettings, false, "Broker no debe ver Configuración en el pie");
});
