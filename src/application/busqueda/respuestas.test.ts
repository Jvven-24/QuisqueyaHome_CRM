import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { esResultadoBusqueda, mensajeErrorBusqueda } from "./consultas.ts";
import { ETIQUETAS_ESTADO } from "../leads/presentacion.ts";
import { LEAD_STATUSES } from "../../domain/catalogs.ts";

test("G1-06: cada estado de lead tiene la misma etiqueta espanola en lista y busqueda", () => {
  assert.deepEqual(LEAD_STATUSES.map(status => ETIQUETAS_ESTADO[status]), ["Nuevo", "Asignado", "Contactado", "Convertido", "Descartado"]);
  const repo = readFileSync("src/infrastructure/db/repos/busqueda.ts", "utf8");
  assert.ok(repo.includes("etiqueta: ETIQUETAS_ESTADO[f.status]"));
});

test("G1 busqueda: respuesta incompleta, HTML o enlace externo son error; vacio completo es valido", () => {
  const empty = { leads: [], contactos: [], negocios: [], propiedades: [], tareas: [] };
  assert.ok(esResultadoBusqueda(empty));
  for (const value of [null, "<html>", {}, { ...empty, leads: null }, { ...empty, leads: [{}] }]) assert.equal(esResultadoBusqueda(value), false);
  for (const ruta of ["https://example.com", "//example.com", "/\\example.com"]) {
    assert.equal(esResultadoBusqueda({ ...empty, leads: [{ id: 1, tipo: "lead", titulo: "A", subtitulo: "", etiqueta: "Nuevo", ruta }] }), false);
  }
  assert.ok(esResultadoBusqueda({ ...empty, leads: [{ id: 1, tipo: "lead", titulo: "<script>texto</script>", subtitulo: "", etiqueta: "Nuevo", ruta: "/leads/1" }] }));
});

test("G1 busqueda: 403, sesion, red y offline no se confunden con vacio", () => {
  assert.match(mensajeErrorBusqueda(403, false), /permiso/);
  assert.match(mensajeErrorBusqueda(401, false), /caducado/);
  assert.match(mensajeErrorBusqueda(null, true), /Sin conex/);
  assert.match(mensajeErrorBusqueda(500, false), /No pudimos/);
});

test("G1 busqueda: proyectos tienen visibleRows y resultados abren la ficha exacta", () => {
  const source = readFileSync("src/infrastructure/db/repos/busqueda.ts", "utf8");
  assert.match(source, /visibleRows\(actor, alcances.properties, projects.brokerId, projects.deletedAt\)/);
  for (const recurso of ["leads", "contactos", "negocios"]) assert.ok(source.includes("`/" + recurso + "/${f.id}`"));
});
