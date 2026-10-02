/**
 * Doble en memoria del repositorio de Metas. Es `Reversible`.
 *
 * `fijarMetaMensual` se comporta como el upsert real: busca la fila del periodo
 * (la del broker, o la de la compañía si `brokerId` es nulo), la crea con
 * `achieved_*` en 0 si no existe, y si existe **solo reescribe `target_*` y
 * `updated_by`** — jamás lo alcanzado. Una prueba con `achieved_*` previos
 * detecta un caso de uso (o un doble) que lo pise.
 *
 * ## Lo que NO puede probar
 *
 * La atomicidad del `INSERT ... ON CONFLICT` y los dos índices únicos parciales:
 * en memoria no hay concurrencia. Eso lo cubre el adaptador y `api/metas/route.test.ts`.
 */

import type { Reversible } from "../testing/reversible.ts";
import type { DatosMetaMensual, Meta, RepositorioMetas } from "./puertos.ts";

const FECHA_FIJA = new Date("2026-01-01T00:00:00Z");

export type MetasEnMemoria = RepositorioMetas &
  Reversible & {
    readonly metas: readonly Meta[];
    readonly perfiles: readonly number[];
  };

export function metasEnMemoria(semilla: { metas?: readonly Meta[]; perfiles?: readonly number[] } = {}): MetasEnMemoria {
  let metas: Meta[] = [...(semilla.metas ?? [])];
  const perfiles = [...(semilla.perfiles ?? [])];
  let siguienteId = Math.max(0, ...metas.map((m) => m.id)) + 1;

  return {
    get metas() {
      return metas;
    },
    get perfiles() {
      return perfiles;
    },

    async existePerfilDeBroker(brokerId) {
      return perfiles.includes(brokerId);
    },

    async fijarMetaMensual(datos: DatosMetaMensual) {
      const anterior = metas.find((m) => m.brokerId === datos.brokerId && m.year === datos.year && m.month === datos.month);
      if (anterior) {
        const meta: Meta = {
          ...anterior,
          targetDeals: datos.targetDeals,
          ...(datos.targetAmountCents !== undefined ? { targetAmountCents: datos.targetAmountCents } : {}),
          updatedBy: datos.actorId,
          updatedAt: FECHA_FIJA,
        };
        metas = metas.map((m) => (m.id === anterior.id ? meta : m));
        return { anterior, meta };
      }
      const meta: Meta = {
        id: siguienteId++,
        brokerId: datos.brokerId,
        year: datos.year,
        month: datos.month,
        targetDeals: datos.targetDeals,
        targetAmountCents: datos.targetAmountCents ?? null,
        achievedDeals: 0,
        achievedAmountCents: 0,
        currency: "USD",
        createdAt: FECHA_FIJA,
        updatedAt: FECHA_FIJA,
        createdBy: datos.actorId,
        updatedBy: datos.actorId,
      };
      metas = [...metas, meta];
      return { anterior: undefined, meta };
    },

    instantanea() {
      const copia = metas;
      return () => {
        metas = copia;
      };
    },
  };
}
