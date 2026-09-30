/**
 * Doble en memoria de la unidad de trabajo. Simula el "todo o nada" de
 * `transaction()`: toma una instantánea de cada doble reversible antes de correr
 * el callback y, si lanza, las restaura en orden inverso y relanza el error
 * **original** (una prueba debe ver la misma excepción que vería la ruta).
 *
 * `confirmadas` y `revertidas` permiten afirmar el desenlace sin depender de
 * inspeccionar el estado de cada repositorio.
 */

import type { UnidadDeTrabajo } from "../compartido/unidad-de-trabajo.ts";
import type { Reversible } from "./reversible.ts";

export function unidadDeTrabajoEnMemoria<R>(
  repos: R,
  reversibles: readonly Reversible[] = [],
): UnidadDeTrabajo<R> & { readonly confirmadas: number; readonly revertidas: number } {
  let confirmadas = 0;
  let revertidas = 0;

  return {
    get confirmadas() {
      return confirmadas;
    },
    get revertidas() {
      return revertidas;
    },
    async ejecutar(fn) {
      const restauraciones = reversibles.map((r) => r.instantanea());
      try {
        const resultado = await fn(repos);
        confirmadas += 1;
        return resultado;
      } catch (error) {
        for (const restaurar of restauraciones.reverse()) restaurar();
        revertidas += 1;
        throw error;
      }
    },
  };
}
