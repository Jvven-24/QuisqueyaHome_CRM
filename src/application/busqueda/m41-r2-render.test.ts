import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import { ETIQUETAS_ESTADO } from "../leads/presentacion.ts";
import { esResultadoBusqueda, mensajeErrorBusqueda } from "./consultas.ts";

test("G1-06: la paleta renderiza las etiquetas españolas de cada resultado recibido", () => {
  const require = createRequire(import.meta.url);
  const resultados = { contactos: [], negocios: [], propiedades: [], tareas: [], leads: Object.entries(ETIQUETAS_ESTADO).map(([status, etiqueta], index) => ({
    id: index + 1, tipo: "lead", titulo: `Prospecto ${index + 1}`, subtitulo: "", etiqueta, ruta: `/leads/${index + 1}`, status,
  })) };
  const estados: unknown[] = ["Prospecto", 0, false, resultados, null, 0];
  let indice = 0;
  const react = { ...React, useState: () => [estados[indice++], () => {}], useEffect: () => {}, useRef: () => ({ current: null }) };
  const mocks: Record<string, unknown> = {
    react, "next/navigation": { useRouter: () => ({}) }, "../modulos": { MODULOS: [], WORKSPACES: [] },
    "./icon-resolver": { ModuloIcon: () => null }, "@/application/busqueda/consultas": { esResultadoBusqueda, mensajeErrorBusqueda },
  };
  const code = ts.transpileModule(readFileSync("src/app/(crm)/_ui/command-palette.tsx", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const exports: Record<string, unknown> = {};
  new Function("require", "exports", code)((id: string) => id in mocks ? mocks[id] : require(id), exports);
  const html = renderToStaticMarkup(React.createElement(exports.CommandPalette as React.ComponentType<Record<string, unknown>>, { open: true, onOpenChange: () => {}, modulosVisibles: [] }));
  for (const etiqueta of Object.values(ETIQUETAS_ESTADO)) assert.ok(html.includes(`>${etiqueta}</span>`), etiqueta);
  assert.doesNotMatch(html, /Buscando registros|>assigned<|>converted<|>contacted</);
});
