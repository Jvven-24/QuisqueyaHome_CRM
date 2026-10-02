/**
 * Doble en memoria del repositorio genérico de Papelera: una lista de filas por
 * entidad. `Reversible` para la unidad de trabajo. `restaurar` escribe SOLO
 * `deletedAt = null`, como el adaptador (ni `updatedAt` ni nada más).
 */

import type { Reversible } from "../testing/reversible.ts";
import type { EntidadPapelera, FilaPapelera, RepositorioPapelera } from "./puertos.ts";

export type PapeleraEnMemoria = RepositorioPapelera & Reversible & { filas(entidad: EntidadPapelera): readonly FilaPapelera[] };

export function papeleraEnMemoria(semilla: Partial<Record<EntidadPapelera, readonly FilaPapelera[]>> = {}): PapeleraEnMemoria {
  const entidades: EntidadPapelera[] = ["contact", "lead", "deal", "project", "unit", "user"];
  let tablas = Object.fromEntries(entidades.map((e) => [e, [...(semilla[e] ?? [])]])) as Record<EntidadPapelera, FilaPapelera[]>;

  return {
    filas: (entidad) => tablas[entidad],

    async buscar(entidad, id) {
      return tablas[entidad].find((f) => f.id === id);
    },

    async restaurar(entidad, id) {
      const anterior = tablas[entidad].find((f) => f.id === id);
      if (!anterior) throw new Error(`papeleraEnMemoria: no existe ${entidad}/${id}.`);
      const fila = { ...anterior, deletedAt: null };
      tablas = { ...tablas, [entidad]: tablas[entidad].map((f) => (f.id === id ? fila : f)) };
      return fila;
    },

    instantanea() {
      const copia = tablas;
      return () => {
        tablas = copia;
      };
    },
  };
}
