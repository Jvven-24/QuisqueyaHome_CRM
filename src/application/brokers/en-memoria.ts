/**
 * Doble en memoria del repositorio de Brokers. Es `Reversible`.
 *
 * Imita el universo de la consulta real (`isActive` y no borrado) en
 * `proyectosRelevantes`, y el orden en que el adaptador junta las filas
 * (primero las asignadas, luego las soltadas). El alcance NO se imita aquí: no
 * es un filtro de filas sino una puerta (`alcance !== "all"`) que decide el
 * caso de uso antes de abrir la transacción.
 */

import type { Reversible } from "../testing/reversible.ts";
import type { BrokerAsignable, Proyecto, RepositorioBrokers } from "./puertos.ts";

const FECHA_FIJA = new Date("2026-01-01T00:00:00Z");

export type BrokersEnMemoria = RepositorioBrokers &
  Reversible & { readonly proyectos: readonly Proyecto[] };

export function brokersEnMemoria(
  semilla: { brokers?: readonly BrokerAsignable[]; proyectos?: readonly Proyecto[] } = {},
): BrokersEnMemoria {
  const brokers = [...(semilla.brokers ?? [])];
  let proyectos: Proyecto[] = [...(semilla.proyectos ?? [])];

  function actualizar(ids: readonly number[], brokerId: number | null, actorId: number): Proyecto[] {
    const filas: Proyecto[] = [];
    proyectos = proyectos.map((p) => {
      if (!ids.includes(p.id)) return p;
      const fila = { ...p, brokerId, updatedBy: actorId, updatedAt: FECHA_FIJA };
      filas.push(fila);
      return fila;
    });
    return filas;
  }

  return {
    get proyectos() {
      return proyectos;
    },
    async buscarBroker(brokerId) {
      return brokers.find((b) => b.userId === brokerId);
    },
    async proyectosRelevantes(brokerId, idsSolicitados) {
      return proyectos.filter(
        (p) => p.isActive && p.deletedAt == null && (idsSolicitados.includes(p.id) || p.brokerId === brokerId),
      );
    },
    async asignar(ids, brokerId, actorId) {
      return actualizar(ids, brokerId, actorId);
    },
    async desasignar(ids, actorId) {
      return actualizar(ids, null, actorId);
    },
    instantanea() {
      const copia = proyectos;
      return () => {
        proyectos = copia;
      };
    },
  };
}
