import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import type { Modulo } from "../modulos";

// Carga TSX en memoria: no inicia Next ni genera .next/.
const require = createRequire(import.meta.url);
const modulo = { exports: {} as Record<string, React.ComponentType<{ modulosVisibles: Modulo[]; etiquetaRol: string }>> };
const codigo = ts.transpileModule(readFileSync(new URL("./mobile-dock.tsx", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
runInNewContext(codigo, { module: modulo, exports: modulo.exports, require: (nombre: string) => {
 if (nombre === "next/link") return { __esModule: true, default: (props: React.ComponentProps<"a">) => React.createElement("a", props) };
 if (nombre === "next/navigation") return { usePathname: () => "/propiedades/proyecto" };
 if (nombre === "../modulos") return { WORKSPACES: [] };
 if (nombre === "./icon-resolver") return { ModuloIcon: () => null };
 if (nombre === "./command-palette") return { CommandPalette: () => null };
 return require(nombre);
} });
const Dock = modulo.exports.MobileDock!;
const inventario: Modulo = { id: "M5", ruta: "/propiedades", nombre: "Propiedades", recurso: "projects", workspaceId: "operaciones", icono: "Building2", descripcion: "Inventario" };

test("G4-11: acceso directo a Inventario solo cuando el módulo es visible", () => {
 const permitido = renderToStaticMarkup(React.createElement(Dock, { modulosVisibles: [inventario], etiquetaRol: "Prueba" }));
 assert.match(permitido, /href="\/propiedades"/);
 assert.match(permitido, /aria-current="page"/);
 assert.match(permitido, />Inventario</);
 const denegado = renderToStaticMarkup(React.createElement(Dock, { modulosVisibles: [], etiquetaRol: "Prueba" }));
 assert.doesNotMatch(denegado, /href="\/propiedades"/);
 assert.doesNotMatch(denegado, /href="\/leads"/);
 assert.match(denegado, /Ver todos los módulos/);
});
