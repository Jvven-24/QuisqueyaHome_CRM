import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const propiedades = readFileSync("src/app/(crm)/propiedades/vista.tsx", "utf8");
const header = readFileSync("src/app/(crm)/_ui/crm-header.tsx", "utf8");
const sidebar = readFileSync("src/components/ui/sidebar.tsx", "utf8");
const pageHeader = readFileSync("src/components/modulo/page-header.tsx", "utf8");

test("INV-04: el escudo del banner de propiedades usa oro con contraste sobre navy", () => {
  assert.match(propiedades, /bg-navy-950 text-\[var\(--gold-600\)\][^\n]*border border-\[var\(--gold-600\)\]\/30/);
});

test("INV-05: los iconos de absorción y fecha en superficie clara usan gold-700", () => {
  assert.match(propiedades, /<Layers className="size-4 text-gold-700" \/>/);
  assert.match(propiedades, /<Calendar className="size-3 text-gold-700" \/>/);
});

test("INV-06: el eyebrow compartido usa el token de tinta secundaria", () => {
  assert.match(pageHeader, /eyebrow[^\n]*text-\[var\(--ink-secondary\)\]/);
});

test("INV-07: breadcrumb, separadores y buscador usan el token muted legible", () => {
  assert.match(header, /Quisqueya<\/span>\s*<ChevronRight className="hidden xl:block size-3 text-muted-foreground/);
  assert.match(header, /<Search className="size-3\.5 text-muted-foreground/);
  assert.match(header, /<kbd className="[^\"]*text-muted-foreground[^\"]*border border-line/);
});

test("INV-08: los botones de la barra superior respetan 44px y acción tiene nombre accesible", () => {
  assert.match(header, /<SidebarTrigger className="min-h-11 min-w-11/);
  assert.match(header, /className="inline-flex min-h-11 min-w-11[^\"]*"\s+aria-label="Nueva acción"/);
  assert.match(header, /aria-label="Notificaciones del sistema"/);
  assert.match(sidebar, /className=\{cn\("min-h-11 min-w-11", className\)\}/);
});

test("Tareas 1440: el encabezado compartido envuelve las acciones y no comprime el título en una columna estrecha", () => {
  assert.match(pageHeader, /sm:flex-row sm:flex-wrap/);
  assert.match(pageHeader, /<div className="min-w-0 sm:min-w-\[min\(100%,22rem\)\] sm:flex-1">/);
});
