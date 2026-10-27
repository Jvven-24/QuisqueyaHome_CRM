import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const tareasPageSrc = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
const tareasVistaSrc = readFileSync(new URL("./vista.tsx", import.meta.url), "utf8");
const tareasTableroSrc = readFileSync(new URL("./_componentes/tablero.tsx", import.meta.url), "utf8");
const agendaPageSrc = readFileSync(new URL("../agenda/page.tsx", import.meta.url), "utf8");
const agendaVistaSrc = readFileSync(new URL("../agenda/vista.tsx", import.meta.url), "utf8");
const rootLayoutSrc = readFileSync(new URL("../../layout.tsx", import.meta.url), "utf8");
const sidebarMenuSrc = readFileSync(new URL("../_ui/crm-sidebar-menu.tsx", import.meta.url), "utf8");
const sectionNavSrc = readFileSync(new URL("../_ui/section-navigation.tsx", import.meta.url), "utf8");

test("REA-1: TareasPage y AgendaPage aplican guardas RBAC (requireActor, requireScopeInPage, visibleRows)", () => {
  assert.match(tareasPageSrc, /requireActor\(\)/);
  assert.match(tareasPageSrc, /requireScopeInPage\(actor,\s*"activities",\s*"view"\)/);
  assert.match(tareasPageSrc, /scopeFor\(actor,\s*"projects",\s*"view"\)/);
  assert.match(tareasPageSrc, /scopeFor\(actor,\s*"deals",\s*"view"\)/);
  assert.match(tareasPageSrc, /scopeFor\(actor,\s*"contacts",\s*"view"\)/);
  assert.match(tareasPageSrc, /visibleRows\(actor,\s*scopeProyectos/);
  assert.match(tareasPageSrc, /visibleRows\(actor,\s*scopeNegocios/);
  assert.match(tareasPageSrc, /visibleRows\(actor,\s*scopeContactos/);

  assert.match(agendaPageSrc, /requireActor\(\)/);
  assert.match(agendaPageSrc, /requireScopeInPage\(actor,\s*"activities",\s*"view"\)/);
  assert.match(agendaPageSrc, /scopeFor\(actor,\s*"projects",\s*"view"\)/);
  assert.match(agendaPageSrc, /scopeFor\(actor,\s*"deals",\s*"view"\)/);
  assert.match(agendaPageSrc, /scopeFor\(actor,\s*"contacts",\s*"view"\)/);
  assert.match(agendaPageSrc, /visibleRows\(actor,\s*scopeProyectos/);
  assert.match(agendaPageSrc, /visibleRows\(actor,\s*scopeNegocios/);
  assert.match(agendaPageSrc, /visibleRows\(actor,\s*scopeContactos/);
});

test("REA-2: TareasVista expone los 8 Playbooks Inmobiliarios RD con modelo REA y secuencias multi-tarea por broker", () => {
  const playbooksRequeridos = [
    "kyc_plaft",
    "reserva_unidad",
    "firma_promesa",
    "confotur_fiscal",
    "tour_vip_obra",
    "seguimiento_diaspora",
    "entrega_llaves",
    "onboarding_broker",
  ];
  for (const id of playbooksRequeridos) {
    assert.ok(
      tareasVistaSrc.includes(`id: "${id}"`),
      `Falta el playbook inmobiliario RD: ${id}`,
    );
  }
  assert.match(tareasVistaSrc, /parsearDescripcionChecklist/);
  assert.match(tareasVistaSrc, /serializarDescripcionChecklist/);
  assert.match(tareasVistaSrc, /RELEVO OPERATIVO · America\/Santo_Domingo/);
  assert.match(tareasVistaSrc, /secuenciaMultiTarea/);
  assert.match(tareasVistaSrc, /reasignarLotePorBroker/);
});

test("REA-3: Tareas y Agenda incluyen matriz de asignación y disponibilidad Broker por Broker", () => {
  assert.match(tareasVistaSrc, /modoVista === "brokers"/);
  assert.match(tareasVistaSrc, /modoVista === "playbooks"/);
  assert.match(tareasVistaSrc, /resumenPorBroker/);
  assert.match(tareasTableroSrc, /Sub-tareas To-Do/);
  assert.match(agendaVistaSrc, /PLANTILLAS_VISITAS_REA/);
  assert.match(agendaVistaSrc, /modoAgenda === "brokers"/);
  assert.match(agendaVistaSrc, /filtroBroker/);
  assert.match(agendaVistaSrc, /filtroProyecto/);
});

test("NAV-1: RootLayout sanea atributos inyectados por extensiones (bis_skin_checked) y evita error de hidratación", () => {
  assert.match(rootLayoutSrc, /suppressHydrationWarning/);
  assert.match(rootLayoutSrc, /bis_skin_checked/);
  assert.match(rootLayoutSrc, /MutationObserver/);
});

test("NAV-2: Menú desplegable lateral y navegación de secciones desactivan prefetch masivo para no saturar PostgreSQL", () => {
  assert.doesNotMatch(sidebarMenuSrc, /prefetch=\{true\}/);
  assert.match(sidebarMenuSrc, /prefetch=\{false\}/);
  assert.doesNotMatch(sectionNavSrc, /prefetch=\{true\}/);
  assert.match(sectionNavSrc, /prefetch=\{false\}/);
});
