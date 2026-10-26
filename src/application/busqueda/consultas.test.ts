import assert from "node:assert/strict";
import test from "node:test";
import type { Actor } from "../../domain/rbac.ts";
import {
  buscarEnCrm,
  type AlcancesBusquedaGlobal,
  type ResultadosBusquedaGlobal,
} from "./consultas.ts";

const actorBroker: Actor = {
  userId: 7,
  roleSlug: "broker",
  permissions: [
    { resource: "leads", action: "view", scope: "own" },
    { resource: "contacts", action: "view", scope: "own" },
    { resource: "deals", action: "view", scope: "own" },
    { resource: "projects", action: "view", scope: "all" },
    { resource: "activities", action: "view", scope: "own" },
  ],
};

const actorAdmin: Actor = {
  userId: 1,
  roleSlug: "admin",
  permissions: [
    { resource: "leads", action: "view", scope: "all" },
    { resource: "contacts", action: "view", scope: "all" },
    { resource: "deals", action: "view", scope: "all" },
    { resource: "projects", action: "view", scope: "all" },
    { resource: "activities", action: "view", scope: "all" },
  ],
};

const RESULTADO_SIMULADO: ResultadosBusquedaGlobal = {
  leads: [
    {
      id: 10,
      tipo: "lead",
      titulo: "Roberto Almonte",
      subtitulo: "+18095550199 · Cap Cana",
      etiqueta: "calificado",
      ruta: "/leads",
    },
  ],
  contactos: [],
  negocios: [],
  propiedades: [],
  tareas: [],
};

test("buscarEnCrm devuelve colecciones vacías sin consultar repositorio si el término tiene menos de 2 caracteres", async () => {
  let llamado = false;
  const resultado = await buscarEnCrm(
    {
      busqueda: {
        async buscar() {
          llamado = true;
          return RESULTADO_SIMULADO;
        },
      },
    },
    actorBroker,
    " a ",
  );

  assert.equal(llamado, false);
  assert.deepEqual(resultado, {
    leads: [],
    contactos: [],
    negocios: [],
    propiedades: [],
    tareas: [],
  });
});

test("buscarEnCrm calcula alcances RBAC por módulo según el rol del actor y recorta el término a 80 caracteres", async () => {
  let terminoRecibido = "";
  let alcancesBroker: AlcancesBusquedaGlobal | null = null;
  let alcancesAdmin: AlcancesBusquedaGlobal | null = null;

  const terminoLargo = `   ${"CapCana".repeat(15)}   `;

  const resBroker = await buscarEnCrm(
    {
      busqueda: {
        async buscar(_actor, termino, alcances) {
          terminoRecibido = termino;
          alcancesBroker = alcances;
          return RESULTADO_SIMULADO;
        },
      },
    },
    actorBroker,
    terminoLargo,
  );

  assert.equal(terminoRecibido.length, 80);
  assert.ok(alcancesBroker);
  assert.equal((alcancesBroker as AlcancesBusquedaGlobal).leads, "own");
  assert.equal((alcancesBroker as AlcancesBusquedaGlobal).contacts, "own");
  assert.equal((alcancesBroker as AlcancesBusquedaGlobal).deals, "own");
  assert.equal((alcancesBroker as AlcancesBusquedaGlobal).properties, "all");
  assert.equal((alcancesBroker as AlcancesBusquedaGlobal).tasks, "own");
  assert.equal(resBroker.leads.length, 1);

  await buscarEnCrm(
    {
      busqueda: {
        async buscar(_actor, _termino, alcances) {
          alcancesAdmin = alcances;
          return RESULTADO_SIMULADO;
        },
      },
    },
    actorAdmin,
    "Cap Cana",
  );

  assert.ok(alcancesAdmin);
  assert.equal((alcancesAdmin as AlcancesBusquedaGlobal).leads, "all");
  assert.equal((alcancesAdmin as AlcancesBusquedaGlobal).contacts, "all");
  assert.equal((alcancesAdmin as AlcancesBusquedaGlobal).deals, "all");
  assert.equal((alcancesAdmin as AlcancesBusquedaGlobal).properties, "all");
  assert.equal((alcancesAdmin as AlcancesBusquedaGlobal).tasks, "all");
});
