import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import type { Modulo } from "../modulos";

test("S1 P2: el footer real de notificaciones ofrece aprobaciones solo con el destino autorizado", () => {
  const require = createRequire(import.meta.url);
  const passthrough = ({children}: {children?: React.ReactNode}) => React.createElement("div", null, children);
  const components = new Proxy({}, {get: () => passthrough});
  const mocks: Record<string, unknown> = {
    "next/navigation": {usePathname: () => "/inicio"},
    "next/link": {__esModule: true, default: (props: React.ComponentProps<"a">) => React.createElement("a", props)},
    "@/components/ui/sidebar": components, "@/components/ui/dropdown-menu": components, "@/components/ui/popover": components,
    "../modulos": {WORKSPACES: []}, "./command-palette": {CommandPalette: () => null},
  };
  const code = ts.transpileModule(readFileSync(new URL("./crm-header.tsx", import.meta.url), "utf8"), {compilerOptions: {module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true}}).outputText;
  const exports: Record<string, React.ComponentType<{etiquetaRol: string; modulosVisibles: readonly Modulo[]}>> = {};
  new Function("require", "exports", code)((id: string) => id in mocks ? mocks[id] : require(id), exports);
  const destination: Modulo = {id:"M16", ruta:"/aprobaciones", nombre:"Aprobaciones", recurso:"dashboard", workspaceId:"comercial", icono:"CheckSquare", descripcion:"Aprobaciones"};
  const denied = renderToStaticMarkup(React.createElement(exports.CrmHeader!, {etiquetaRol: "Prueba", modulosVisibles: []}));
  assert.doesNotMatch(denied, /href="\/aprobaciones"|Abrir centro de aprobaciones/);
  const allowed = renderToStaticMarkup(React.createElement(exports.CrmHeader!, {etiquetaRol: "Prueba", modulosVisibles: [destination]}));
  assert.match(allowed, /href="\/aprobaciones"/);
  assert.match(allowed, /Abrir centro de aprobaciones/);
});
