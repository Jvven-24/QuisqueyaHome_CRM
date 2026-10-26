import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
const source = (path: string) => readFileSync(path, "utf8");

test("G1-08/13: las tres fichas reutilizan la pagina protegida y tienen 404 propio", () => {
  for (const recurso of ["leads", "contactos", "negocios"]) {
    const base = `src/app/(crm)/${recurso}/`;
    const page = source(base + "page.tsx");
    assert.ok(source(base + "[id]/page.tsx").includes('from "../page"'));
    assert.ok(page.includes("requireScopeInPage(actor,"));
    assert.ok(page.includes("notFound()"));
    assert.ok(source(base + "not-found.tsx").includes("no encontrado"));
    assert.ok(source(base + "loading.tsx").length > 100);
    assert.ok(source(base + "error.tsx").length > 100);
  }
  assert.match(source("src/app/(crm)/leads/page.tsx"), /eq\(leads.id, leadId\), or\(visibleRows\(actor, scope/);
  const contacto = source("src/infrastructure/db/repos/contactos.ts");
  assert.match(contacto, /visibleRows\(actor, alcance, contacts.brokerId, contacts.deletedAt\)/);
  assert.ok(source("src/application/pipeline/consultas.ts").includes("repo.ficha(actor, scope, negocioId)"));
  assert.ok(source("src/infrastructure/db/repos/pipeline-lectura.ts").includes("visibleRows(actor, scope, deals.brokerId, deals.deletedAt)"));
});

test("G1-05/12: errores propios de alta, marca obligatoria y Escape local activo", () => {
  for (const recurso of ["leads", "contactos"]) {
    const vista = source(`src/app/(crm)/${recurso}/vista.tsx`);
    assert.ok(vista.includes("<form noValidate"));
    assert.ok(vista.includes('aria-required="true"'));
    assert.ok(vista.includes("safeParse(datos)"));
    assert.ok(vista.includes("submittingRef.current"));
    assert.ok(!vista.includes("JSON.stringify({ ...datos"));
    assert.ok(source(`src/app/api/${recurso}/route.ts`).includes(`@/application/${recurso}/entrada`));
  }
  assert.ok(source("src/app/(crm)/leads/inspector.tsx").includes("onClose, autoFocus: false"));
});

test("G1-09: Inicio usa consulta canonica y reachedCount/ancho calculado de Reportes", () => {
  const page = source("src/app/(crm)/inicio/page.tsx");
  const view = source("src/app/(crm)/inicio/vista.tsx");
  assert.ok(page.includes("consultarReportesBi(reportesRepositorio(), actor, scopes.deals, filtros)"));
  assert.ok(page.includes("metricas.funnel = reporte?.funnel ?? []"));
  assert.ok(view.includes("const count = etapa.reachedCount"));
  assert.ok(view.includes("const porcentajeAncho = etapa.widthPercent"));
  assert.ok(!view.includes("etapa.count ??"));
  assert.ok(!view.includes("cierresMesCount * 10"));
  assert.ok(!view.includes('"10:00 AM"'));
  assert.ok(!source("src/app/(crm)/leads/vista.tsx").includes("calcularTemperatura"));
});
