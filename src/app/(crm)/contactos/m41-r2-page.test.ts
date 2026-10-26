import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { test } from "node:test";
import ts from "typescript";
import * as jsxRuntime from "react/jsx-runtime";
import { consultarListadoContactos, TAMANIO_PAGINA_CONTACTOS } from "../../../application/contactos/consultas.ts";
import { contactosEnMemoria } from "../../../application/contactos/en-memoria.ts";
import type { Contacto, LecturaContactos } from "../../../application/contactos/puertos.ts";
import { requireScope, scopeFor, type Actor } from "../../../domain/rbac.ts";

test("G1-08: ruta de contacto existente muestra la ficha; ajeno/borrado/inexistente no entregan datos", async () => {
  const actor: Actor = { userId: 5, roleSlug: "broker", permissions: [{ resource: "contacts", action: "view", scope: "own" }] };
  const fila: Contacto = { id: 1, fullName: "Contacto propio", phone: null, phoneDisplay: null, email: null, country: null, city: null,
    sourceId: null, brokerId: 5, notes: null, lastInteractionAt: null, consentAt: null, consentSource: null,
    createdAt: new Date(), updatedAt: new Date(), createdBy: 5, updatedBy: 5, deletedAt: null };
  const repo = contactosEnMemoria([fila, { ...fila, id: 2, brokerId: 99 }, { ...fila, id: 3, deletedAt: new Date() }]);
  let lecturas = 0;
  const lectura: LecturaContactos = {
    async listado(a, scope, filtros) {
      lecturas++;
      assert.equal(scope, "own");
      const seleccion = filtros.contactoId ? await repo.buscarVisible(a, scope, filtros.contactoId) : undefined;
      return { contactos: [], total: 0, canales: [], brokers: [], contactoSeleccionado: seleccion ? { ...seleccion, sourceName: null, brokerName: null } : null };
    },
  };
  const neutral = new Error("estado neutral");
  const deps: Record<string, unknown> = {
    "react/jsx-runtime": jsxRuntime, "next/navigation": { notFound() { throw neutral; } },
    "@/application/contactos/consultas": { consultarListadoContactos, TAMANIO_PAGINA_CONTACTOS },
    "@/domain/rbac": { scopeFor }, "@/infrastructure/auth/actor": { requireActor: async () => actor },
    "@/infrastructure/contenedor/contactos": { contactosParaLectura: () => lectura },
    "@/infrastructure/page-guard": { requireScopeInPage: requireScope },
    "../_ui/historial": { Historial: () => null }, "./vista": { ContactosVista: () => null },
  };
  function cargar(ruta: string, dependencias: Record<string, unknown>) {
    const exports: Record<string, unknown> = {};
    const code = ts.transpileModule(readFileSync(new URL(ruta, import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
    runInNewContext(code, { exports, require: (name: string) => { assert.ok(Object.hasOwn(dependencias, name), name); return dependencias[name]; } });
    return exports.default;
  }
  const page = cargar("./page.tsx", deps);
  const ficha = cargar("./[id]/page.tsx", { "../page": { default: page }, react: { cache: (fn: unknown) => fn }, "next/navigation": { notFound() { throw neutral; } } }) as (args: { params: Promise<{ id: string }> }) => Promise<{ props: { soloFicha: boolean; contactoSeleccionado: Contacto } }>;
  const propia = await ficha({ params: Promise.resolve({ id: "1" }) });
  assert.equal(propia.props.soloFicha, true);
  assert.equal(propia.props.contactoSeleccionado.fullName, "Contacto propio");
  for (const id of ["2", "3", "999", "abc"]) {
    await assert.rejects(ficha({ params: Promise.resolve({ id }) }), error => error === neutral);
  }
  assert.equal(lecturas, 4); // El id malformado ni consulta.
});
