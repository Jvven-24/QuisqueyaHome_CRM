import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { transpileModule, ModuleKind, JsxEmit } from "typescript";
import { leadWaitingLabel } from "../../../application/leads/sla.ts";
import { CrearLeadInput } from "../../../application/leads/entrada.ts";
import { erroresDeCampos } from "../../../application/contactos/entrada.ts";
import { ETIQUETAS_ESTADO } from "../../../application/leads/presentacion.ts";
import { LEAD_STATUSES, OPERATION_TYPES } from "../../../domain/catalogs.ts";

const require = createRequire(import.meta.url);
function cargar(path: string, mocks: Record<string, unknown> = {}): Record<string, unknown> {
  const source = readFileSync(path, "utf8");
  const code = transpileModule(source, { compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX } }).outputText;
  const exports = {};
  new Function("require", "exports", code)((id: string) => id in mocks ? mocks[id] : require(id), exports);
  return exports;
}

/** Render de la vista real; solo se sustituyen navegación y dependencias fuera de la lista. */
export function renderLeads(q = "", hayFilas = true): string {
  const ui = cargar("src/app/(crm)/_ui/prototipo-ui.tsx", {
    "@/hooks/use-focus-trap": {},
    "@/components/modulo": { PageHeader: ({ title, description, actions }: { title: string; description?: string; actions?: unknown }) => createElement("header", null, title, description, actions as never) },
  });
  const table = cargar("src/components/ui/data-table.tsx", { "@/lib/utils": { cn: (...parts: unknown[]) => parts.filter(Boolean).join(" ") }, "@/components/ui/checkbox": { Checkbox: () => null } });
  const { LeadsVista } = cargar("src/app/(crm)/leads/vista.tsx", {
    "next/navigation": { useRouter: () => ({}), usePathname: () => "/leads", useSearchParams: () => new URLSearchParams({ q, page: "4", lead: "5" }) },
    "@/components/modulo": { ModuleTabs: ({ items }: { items: Array<{ href: string; label: string }> }) => createElement("nav", null, ...items.map(item => createElement("a", { key: item.href, href: item.href }, item.label))) },
    "./_componentes/sla-preview": { SlaPolicyPreview: () => null },
    "../inicio/estado-conexion": { EstadoConexion: () => null },
    "@/hooks/use-focus-trap": {},
    "@/application/leads/presentacion": { ETIQUETAS_ESTADO },
    "@/application/leads/sla": { leadWaitingLabel },
    "@/application/leads/entrada": { CrearLeadInput },
    "@/application/contactos/entrada": { erroresDeCampos },
    "@/domain/catalogs": { LEAD_STATUSES, OPERATION_TYPES },
    "../_ui/prototipo-ui": ui,
    "../_ui/module-tabs": cargar("src/app/(crm)/_ui/module-tabs.tsx"),
    "../_ui/alerta-error-formulario": {}, "./inspector": {}, "./nota-de-voz-modal": {},
    "@/components/ui/resumen-compacto": cargar("src/components/ui/resumen-compacto.tsx"),
    "@/components/ui/data-table": table, "@/components/ui/phone-input": {},
    "@/components/ui/bits": { Insignia: ({ texto }: { texto: string }) => texto },
    "@/components/ui/tone": { leadStatusTone: () => "neutral" },
  });
  const lead = { id: 42, contactName: "Prospecto de prueba", contactPhone: "+18095550184", contactPhoneDisplay: null,
    projectName: "Residencial de prueba con nombre largo", sourceName: "Referido", brokerName: "Asesor de prueba", status: "assigned",
    currency: "USD", budgetMinCents: 10000000, budgetMaxCents: 20000000 };
  return renderToStaticMarkup(createElement(LeadsVista as ComponentType<Record<string, unknown>>, {
    leads: hayFilas ? [lead] : [], canales: [], proyectos: [], brokers: [], total: hayFilas ? 1 : 0,
    tamanioPagina: 20, pagina: 1, filtros: { q, sourceId: 7, status: "assigned" },
    leadSeleccionado: null, historial: null, roleSlug: "admin",
  }));
}

test("G1-04: búsqueda funciona como formulario GET antes de hidratar, conserva filtros y reinicia página/ficha", () => {
  const html = renderLeads("Bávaro & Sol");
  const form = html.match(/<form\b[^>]*role="search"[\s\S]*?<\/form>/)?.[0];
  assert.ok(form);
  assert.match(form, /action="\/leads"/);
  assert.match(form, /method="get"/);
  assert.match(form, /name="q"[^>]*value="Bávaro &amp; Sol"/);
  assert.match(form, /name="source_id"[^>]*value="7"/);
  assert.match(form, /name="status"[^>]*value="assigned"/);
  assert.doesNotMatch(form, /name="(?:page|lead)"/);
  assert.match(form, /type="submit"/);
  assert.match(renderLeads("otra búsqueda"), /name="q"[^>]*value="otra búsqueda"/);
});

test("G1-02: tarjetas incluyen estado y presupuesto; vacío mantiene el mensaje propio", () => {
  const html = renderLeads();
  const cards = html.match(/<ul aria-label="Leads en tarjetas"[\s\S]*?<\/ul>/)?.[0];
  assert.ok(cards);
  for (const texto of ["Estado", "Asignado", "Presupuesto", "$100,000", "$200,000", "Responsable", "Asesor de prueba"]) assert.ok(cards.includes(texto), texto);
  assert.match(cards, /href="\/leads\/42"/);
  assert.match(renderLeads("sin coincidencias", false), /Sin resultados para esta búsqueda/);
});
