import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { transpileModule, ModuleKind, JsxEmit } from "typescript";
import { CrearContactoInput, erroresDeCampos } from "../../../application/contactos/entrada.ts";

const require = createRequire(import.meta.url);
function cargar(path: string, mocks: Record<string, unknown>): Record<string, unknown> {
  const source = readFileSync(path, "utf8");
  const code = transpileModule(source, { compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX } }).outputText;
  const exports = {};
  new Function("require", "exports", code)((id: string) => id in mocks ? mocks[id] : require(id), exports);
  return exports;
}

test("G1-01: render de Contactos no muestra epoch ni cero como identidad movil", () => {
  const { DataTable } = cargar("src/components/ui/data-table.tsx", {
    "@/lib/utils": { cn: (...parts: unknown[]) => parts.filter(Boolean).join(" ") },
  });
  const { ContactosVista } = cargar("src/app/(crm)/contactos/vista.tsx", {
    "next/navigation": { useRouter: () => ({}), usePathname: () => "/contactos", useSearchParams: () => new URLSearchParams() },
    "@/hooks/use-focus-trap": {},
    "@/application/contactos/entrada": { CrearContactoInput, erroresDeCampos },
    "../inicio/estado-conexion": { EstadoConexion: () => null },
    "../_ui/prototipo-ui": { Avatar: () => null, PageHeader: () => null },
    "@/components/modulo": { ModuleTabs: ({ items }: { items: Array<{ href: string; label: string }> }) => createElement("nav", null, ...items.map(item => createElement("a", { key: item.href, href: item.href }, item.label))) },
    "../_ui/alerta-error-formulario": {},
    "./inspector": {},
    "@/components/ui/data-table": { DataTable },
    "@/components/ui/phone-input": {},
  });
  const row = { id: 1, fullName: "<script>texto literal</script>", phone: "+18095550184", phoneDisplay: null, email: null,
    sourceId: null, sourceName: null, brokerId: null, brokerName: null, notes: null, lastInteractionAt: new Date(1790353800000) };
  const markup = renderToStaticMarkup(createElement(ContactosVista as React.ComponentType<Record<string, unknown>>, {
    contactos: [row, { ...row, id: 2, fullName: "Otra persona", lastInteractionAt: null }], canales: [], total: 2,
    tamanioPagina: 20, pagina: 1, filtros: { q: "" }, contactoSeleccionado: null, brokers: [], puedeReasignar: false, historial: null,
  }));
  assert.ok(!markup.includes("1790353800000"));
  assert.ok(!markup.includes(">0<"));
  assert.ok(markup.includes("+18095550184"));
  assert.ok(markup.includes("Sin interacciones"));
  assert.ok(!markup.includes("<script>"));
  assert.ok(markup.includes("&lt;script&gt;texto literal&lt;/script&gt;"));
});
