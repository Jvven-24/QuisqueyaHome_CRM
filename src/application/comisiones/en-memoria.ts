/**
 * Doble en memoria del repositorio de Comisiones.
 *
 * Es `Reversible` para que `unidadDeTrabajoEnMemoria` pueda deshacer lo escrito.
 * Imita el `INNER JOIN deals` del adaptador: una comisión sin negocio en la
 * semilla no se encuentra, y una con negocio borrado devuelve `negocioBorradoEn`.
 *
 * ## Lo que NO puede probar
 *
 * El bloqueo de fila (`FOR UPDATE OF commissions`): en memoria no hay
 * concurrencia. Sí comprueba la FORMA: que el caso de uso llame a
 * `bloquearComision` (queda en `bloqueos`) y `alBloquear` simula a la otra
 * petición que gana la carrera justo antes de que el bloqueo devuelva la fila.
 * La lectura sin bloqueo no existe en este puerto, así que no hay forma de
 * esquivarlo desde el caso de uso.
 *
 * `actualizar` solo escribe las claves presentes, como el adaptador.
 */

import { reaches, type Actor, type PermissionScope } from "../../domain/rbac.ts";
import type { Reversible } from "../testing/reversible.ts";
import type {
  CambiosComision,
  Comision,
  ComisionBloqueada,
  FilaComision,
  FiltrosComisiones,
  LeerFilasComisiones,
  RepositorioComisiones,
} from "./puertos.ts";

const FECHA_FIJA = new Date("2026-01-01T00:00:00Z");

export type NegocioDeComision = { id: number; deletedAt: Date | null };

export type ComisionesEnMemoria = RepositorioComisiones &
  Reversible & {
    readonly comisiones: readonly Comision[];
    /** Ids bloqueados con `bloquearComision`, en orden. No se revierte. */
    readonly bloqueos: readonly number[];
    /** Se ejecuta dentro de `bloquearComision` ANTES de devolver la fila (la otra petición). */
    alBloquear: ((id: number) => void) | null;
    /** Cambia el estado directamente (lo que haría la otra petición). */
    cambiarEstado(id: number, status: Comision["status"]): void;
  };

export function comisionesEnMemoria(
  semilla: { comisiones?: readonly Comision[]; negocios?: readonly NegocioDeComision[] } = {},
): ComisionesEnMemoria {
  let comisiones: Comision[] = [...(semilla.comisiones ?? [])];
  const negocios = [...(semilla.negocios ?? [])];
  const bloqueos: number[] = [];

  function reemplazar(id: number, cambios: Partial<Comision>): Comision {
    const indice = comisiones.findIndex((c) => c.id === id);
    if (indice === -1) throw new Error(`comisionesEnMemoria: no existe la comisión ${id}.`);
    const fila = { ...comisiones[indice]!, ...cambios, updatedAt: FECHA_FIJA };
    comisiones = comisiones.map((c, i) => (i === indice ? fila : c));
    return fila;
  }

  const estado: ComisionesEnMemoria = {
    get comisiones() {
      return comisiones;
    },
    get bloqueos() {
      return bloqueos;
    },
    alBloquear: null,
    cambiarEstado(id, status) {
      reemplazar(id, { status });
    },

    async bloquearComision(id): Promise<ComisionBloqueada | undefined> {
      bloqueos.push(id);
      estado.alBloquear?.(id);
      const comision = comisiones.find((c) => c.id === id);
      const negocio = comision ? negocios.find((n) => n.id === comision.dealId) : undefined;
      if (!comision || !negocio) return undefined; // INNER JOIN deals
      return { comision, negocioBorradoEn: negocio.deletedAt };
    },

    async actualizar(id, cambios: CambiosComision): Promise<Comision> {
      const set: Partial<Comision> = { updatedBy: cambios.updatedBy };
      if (cambios.status !== undefined) set.status = cambios.status;
      if (cambios.approvedBy !== undefined) set.approvedBy = cambios.approvedBy;
      if (cambios.approvedAt !== undefined) set.approvedAt = cambios.approvedAt;
      if (cambios.paidAt !== undefined) set.paidAt = cambios.paidAt;
      if (cambios.brokerShareBasisPoints !== undefined) set.brokerShareBasisPoints = cambios.brokerShareBasisPoints;
      if (cambios.agencyShareBasisPoints !== undefined) set.agencyShareBasisPoints = cambios.agencyShareBasisPoints;
      if (cambios.brokerAmountCents !== undefined) set.brokerAmountCents = cambios.brokerAmountCents;
      if (cambios.agencyAmountCents !== undefined) set.agencyAmountCents = cambios.agencyAmountCents;
      return reemplazar(id, set);
    },

    instantanea() {
      const copia = comisiones;
      return () => {
        comisiones = copia;
      };
    },
  };
  return estado;
}

/**
 * Doble de la lectura de la exportación: imita la consulta real (`condicionFilas`
 * de `_consulta.ts`): alcance con `reaches` sobre `brokerId`, y los filtros de
 * broker, periodo (por `closedDate`) y estado. Sin el alcance, las pruebas de
 * "un broker solo exporta lo suyo" correrían contra nada. `llamadas` deja ver
 * con qué entró el caso de uso.
 */
export function lecturaExportacionEnMemoria(filas: readonly FilaComision[]): LeerFilasComisiones & {
  readonly llamadas: readonly { actor: Actor; alcance: PermissionScope; filtros: FiltrosComisiones }[];
} {
  const llamadas: { actor: Actor; alcance: PermissionScope; filtros: FiltrosComisiones }[] = [];
  const leer: LeerFilasComisiones = async (actor, alcance, filtros) => {
    llamadas.push({ actor, alcance, filtros });
    return filas.filter((fila) => {
      if (!reaches(actor, alcance, fila.brokerId)) return false;
      if (filtros.brokerId != null && fila.brokerId !== filtros.brokerId) return false;
      if (filtros.periodo) {
        const prefijo = `${filtros.periodo.year}-${String(filtros.periodo.month).padStart(2, "0")}-`;
        if (!fila.closedDate?.startsWith(prefijo)) return false;
      }
      return filtros.estado === "todos" || fila.status === filtros.estado;
    });
  };
  return Object.assign(leer, {
    get llamadas() {
      return llamadas;
    },
  });
}
