/**
 * Doble en memoria del repositorio genérico de Catálogos: una lista de filas
 * por tipo. Es `Reversible` para que `unidadDeTrabajoEnMemoria` deshaga lo
 * escrito. Imita el `LIKE` del adaptador (`base` o `base-%`) y que `actualizar`
 * solo escribe las claves presentes.
 */

import type { Reversible } from "../testing/reversible.ts";
import type { CambiosEntradaCatalogo, EntradaCatalogo, RepositorioCatalogos, TipoCatalogo } from "./puertos.ts";

const FECHA_FIJA = new Date("2026-01-01T00:00:00Z");

export type CatalogosEnMemoria = RepositorioCatalogos &
  Reversible & { filas(tipo: TipoCatalogo): readonly EntradaCatalogo[] };

export function catalogosEnMemoria(
  semilla: Partial<Record<TipoCatalogo, readonly EntradaCatalogo[]>> = {},
): CatalogosEnMemoria {
  let tablas: Record<TipoCatalogo, EntradaCatalogo[]> = {
    "motivos-perdida": [...(semilla["motivos-perdida"] ?? [])],
    canales: [...(semilla.canales ?? [])],
  };
  let siguienteId = 1000;

  return {
    filas: (tipo) => tablas[tipo],

    async slugsParecidos(tipo, base) {
      return tablas[tipo].filter((f) => f.slug === base || f.slug.startsWith(`${base}-`)).map((f) => f.slug);
    },

    async crear(tipo, datos) {
      const fila: EntradaCatalogo = {
        id: siguienteId++,
        slug: datos.slug,
        name: datos.name,
        position: datos.position,
        isActive: true,
        createdAt: FECHA_FIJA,
        updatedAt: FECHA_FIJA,
      };
      tablas = { ...tablas, [tipo]: [...tablas[tipo], fila] };
      return fila;
    },

    async buscar(tipo, id) {
      return tablas[tipo].find((f) => f.id === id);
    },

    async actualizar(tipo, id, cambios: CambiosEntradaCatalogo) {
      const anterior = tablas[tipo].find((f) => f.id === id);
      if (!anterior) throw new Error(`catalogosEnMemoria: no existe ${tipo}/${id}.`);
      const set: Partial<EntradaCatalogo> = {};
      if (cambios.name !== undefined) set.name = cambios.name;
      if (cambios.position !== undefined) set.position = cambios.position;
      if (cambios.isActive !== undefined) set.isActive = cambios.isActive;
      const fila = { ...anterior, ...set, updatedAt: FECHA_FIJA };
      tablas = { ...tablas, [tipo]: tablas[tipo].map((f) => (f.id === id ? fila : f)) };
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
