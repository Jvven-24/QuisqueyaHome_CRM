/**
 * Doble en memoria del repositorio de Etapas. `Reversible` para la unidad de
 * trabajo. `actualizar` arma el `set` campo por campo, como el adaptador:
 * nunca escribe `kind` ni `slug`.
 */

import type { Reversible } from "../testing/reversible.ts";
import type { CambiosEtapa, Etapa, RepositorioEtapas } from "./puertos.ts";

const FECHA_FIJA = new Date("2026-01-01T00:00:00Z");

export type EtapasEnMemoria = RepositorioEtapas & Reversible & { readonly etapas: readonly Etapa[] };

export function etapasEnMemoria(semilla: readonly Etapa[] = []): EtapasEnMemoria {
  let etapas: Etapa[] = [...semilla];

  return {
    get etapas() {
      return etapas;
    },

    async buscar(id) {
      return etapas.find((e) => e.id === id);
    },

    async actualizar(id, cambios: CambiosEtapa) {
      const anterior = etapas.find((e) => e.id === id);
      if (!anterior) throw new Error(`etapasEnMemoria: no existe la etapa ${id}.`);
      const set: Partial<Etapa> = {};
      if (cambios.name !== undefined) set.name = cambios.name;
      if (cambios.position !== undefined) set.position = cambios.position;
      if ("defaultProbability" in cambios) set.defaultProbability = cambios.defaultProbability;
      if (cambios.isActive !== undefined) set.isActive = cambios.isActive;
      const fila = { ...anterior, ...set, updatedAt: FECHA_FIJA };
      etapas = etapas.map((e) => (e.id === id ? fila : e));
      return fila;
    },

    instantanea() {
      const copia = etapas;
      return () => {
        etapas = copia;
      };
    },
  };
}
