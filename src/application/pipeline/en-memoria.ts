/**
 * Doble en memoria del repositorio de Pipeline.
 *
 * Vive en este módulo y no en `application/testing/` (ver `contactos/en-memoria.ts`).
 * Es `Reversible` para que `unidadDeTrabajoEnMemoria` pueda deshacer lo escrito
 * cuando el caso de uso lanza; sin eso, "un fallo a mitad del cierre no deja
 * nada" pasaría siempre.
 *
 * ## Lo que este doble NO puede probar
 *
 * La **atomicidad** de `incrementarMetaAlcanzada` y el **bloqueo de fila** de
 * `bloquearNegocio`: en memoria no hay concurrencia, así que dos cierres nunca
 * se pisan. Esas garantías las dan el `INSERT ... ON CONFLICT` y el
 * `SELECT ... FOR UPDATE` del adaptador Drizzle (`infrastructure/db/repos/pipeline.ts`).
 * Lo que el doble sí comprueba es la FORMA: que el caso de uso llame a
 * `bloquearNegocio` (queda anotado en `bloqueos`, y `alBloquear` simula que otra
 * petición ganó la carrera justo antes) y que use el único método de meta, que
 * aquí se comporta como el upsert: crea la fila con `achievedDeals: 1` si no hay
 * una para el periodo y SUMA si la hay.
 */

import type { BrokerLevel } from "../../domain/catalogs.ts";
import type { Actor, PermissionScope } from "../../domain/rbac.ts";
import { fechaSantoDomingo } from "../../domain/zona-horaria.ts";
import type { Reversible } from "../testing/reversible.ts";
import {
  TIPOS_ACTIVIDAD_DE_CONTACTO,
  type DatosNuevaComision,
  type EtapaPipeline,
  type Negocio,
  type PropiedadDeNegocio,
  type RepositorioPipeline,
} from "./puertos.ts";

/** Fecha fija: así las pruebas no dependen del reloj (salvo lo que el caso de uso pone con `new Date()`). */
const FECHA_FIJA = new Date("2026-01-01T00:00:00Z");

/** Lo mínimo de una actividad que el repositorio consulta. */
export type ActividadEnMemoria = {
  id: number;
  dealId: number | null;
  activityType: string;
  status: "pending" | "completed" | "cancelled";
  assigneeId: number | null;
  startsAt: Date | null;
  deletedAt: Date | null;
  updatedBy?: number | null;
};

export type PerfilDeBrokerEnMemoria = {
  userId: number;
  monthlyTargetDeals: number;
  annualSalesCents: number;
  level: BrokerLevel;
};

export type MetaEnMemoria = {
  brokerId: number | null;
  year: number;
  month: number;
  targetDeals: number;
  achievedDeals: number;
  achievedAmountCents: number;
  updatedBy: number | null;
};

export type UnidadEnMemoria = { id: number; projectId: number; status: string; deletedAt: Date | null; updatedBy?: number | null };
export type ProyectoEnMemoria = { id: number; brokerId: number | null; deletedAt: Date | null };
export type HistorialEnMemoria = { dealId: number; fromStageId: number; toStageId: number; changedBy: number };

export type SemillaPipeline = {
  negocios?: readonly Negocio[];
  etapas?: readonly EtapaPipeline[];
  propiedades?: readonly PropiedadDeNegocio[];
  actividades?: readonly ActividadEnMemoria[];
  perfiles?: readonly PerfilDeBrokerEnMemoria[];
  metas?: readonly MetaEnMemoria[];
  unidades?: readonly UnidadEnMemoria[];
  proyectos?: readonly ProyectoEnMemoria[];
};

export type PipelineEnMemoria = RepositorioPipeline &
  Reversible & {
    readonly negocios: readonly Negocio[];
    readonly propiedades: readonly PropiedadDeNegocio[];
    readonly actividades: readonly ActividadEnMemoria[];
    readonly perfiles: readonly PerfilDeBrokerEnMemoria[];
    readonly metas: readonly MetaEnMemoria[];
    readonly unidades: readonly UnidadEnMemoria[];
    readonly comisiones: readonly DatosNuevaComision[];
    readonly historial: readonly HistorialEnMemoria[];
    /** Ids de los negocios que se bloquearon con `bloquearNegocio`, en orden. No se revierte: una llamada es una llamada aunque la transacción falle. */
    readonly bloqueos: readonly number[];
    /**
     * Simula a la otra petición que gana la carrera: se ejecuta dentro de
     * `bloquearNegocio`, ANTES de devolver la fila. Una lectura sin bloqueo
     * (`buscarNegocio`) nunca la dispara, así que una prueba que dependa de ella
     * detecta que el caso de uso dejó de usar el bloqueo.
     */
    alBloquear: ((id: number) => void) | null;
    /** Perilla de fallo: hace que `crearComision` lance, para probar el "todo o nada". */
    fallarEnCrearComision: Error | null;
    /** Cambia la etapa de un negocio directamente (lo que haría la otra petición). */
    moverNegocioAEtapa(dealId: number, stageId: number): void;
  };

export function pipelineEnMemoria(semilla: SemillaPipeline = {}): PipelineEnMemoria {
  let negocios: Negocio[] = [...(semilla.negocios ?? [])];
  const etapas: EtapaPipeline[] = [...(semilla.etapas ?? [])];
  let propiedades: PropiedadDeNegocio[] = [...(semilla.propiedades ?? [])];
  let actividades: ActividadEnMemoria[] = [...(semilla.actividades ?? [])];
  let perfiles: PerfilDeBrokerEnMemoria[] = [...(semilla.perfiles ?? [])];
  let metas: MetaEnMemoria[] = [...(semilla.metas ?? [])];
  let unidades: UnidadEnMemoria[] = [...(semilla.unidades ?? [])];
  const proyectos: ProyectoEnMemoria[] = [...(semilla.proyectos ?? [])];
  let comisiones: DatosNuevaComision[] = [];
  let historial: HistorialEnMemoria[] = [];
  const bloqueos: number[] = [];
  let siguienteIdPropiedad = Math.max(0, ...propiedades.map((p) => p.id)) + 1;

  function reemplazarNegocio(id: number, cambios: Partial<Negocio>): Negocio {
    const indice = negocios.findIndex((n) => n.id === id);
    // Error de programación, no de usuario: el caso de uso ya leyó la fila.
    if (indice === -1) throw new Error(`pipelineEnMemoria: no existe el negocio ${id}.`);
    const fila = { ...negocios[indice]!, ...cambios, updatedAt: FECHA_FIJA };
    negocios = negocios.map((n, i) => (i === indice ? fila : n));
    return fila;
  }

  function reemplazarPropiedad(id: number, cambios: Partial<PropiedadDeNegocio>): PropiedadDeNegocio {
    const indice = propiedades.findIndex((p) => p.id === id);
    if (indice === -1) throw new Error(`pipelineEnMemoria: no existe la propiedad ${id}.`);
    const fila = { ...propiedades[indice]!, ...cambios };
    propiedades = propiedades.map((p, i) => (i === indice ? fila : p));
    return fila;
  }

  const estado: PipelineEnMemoria = {
    get negocios() {
      return negocios;
    },
    get propiedades() {
      return propiedades;
    },
    get actividades() {
      return actividades;
    },
    get perfiles() {
      return perfiles;
    },
    get metas() {
      return metas;
    },
    get unidades() {
      return unidades;
    },
    get comisiones() {
      return comisiones;
    },
    get historial() {
      return historial;
    },
    get bloqueos() {
      return bloqueos;
    },
    alBloquear: null,
    fallarEnCrearComision: null,

    moverNegocioAEtapa(dealId, stageId) {
      reemplazarNegocio(dealId, { stageId });
    },

    // --- lecturas ------------------------------------------------------------

    async buscarNegocio(id) {
      return negocios.find((n) => n.id === id);
    },

    async buscarEtapa(id) {
      return etapas.find((e) => e.id === id);
    },

    async buscarEtapaActiva(id) {
      return etapas.find((e) => e.id === id && e.isActive);
    },

    async tieneActividadDeContacto(dealId) {
      return actividades.some(
        (a) =>
          a.dealId === dealId &&
          a.deletedAt === null &&
          a.status === "completed" &&
          (TIPOS_ACTIVIDAD_DE_CONTACTO as readonly string[]).includes(a.activityType),
      );
    },

    async buscarProximaAccionVigente(actividadId) {
      const a = actividades.find((x) => x.id === actividadId);
      if (a && a.deletedAt === null && a.status === "pending" && a.assigneeId != null && a.startsAt != null) {
        return { responsableId: a.assigneeId, fecha: a.startsAt.toISOString() };
      }
      return null;
    },

    async propiedadesDelNegocio(dealId) {
      return propiedades.filter((p) => p.dealId === dealId);
    },

    // --- cambio de etapa y cierre --------------------------------------------

    async bloquearNegocio(id) {
      bloqueos.push(id);
      // Aquí, en Postgres, la segunda petición ESPERARÍA a que la primera
      // terminara; en memoria solo se puede simular que ya ganó.
      estado.alBloquear?.(id);
      return negocios.find((n) => n.id === id);
    },

    async aplicarCambioDeEtapa({ dealId, etapaDestinoId, cuando, perdida, actorId }) {
      return reemplazarNegocio(dealId, {
        stageId: etapaDestinoId,
        stageChangedAt: cuando,
        ...(perdida ? { lossReasonId: perdida.lossReasonId ?? null, lossComment: perdida.lossComment } : {}),
        updatedBy: actorId,
      });
    },

    async registrarHistorialDeEtapa({ dealId, desdeEtapaId, hastaEtapaId, actorId }) {
      historial = [...historial, { dealId, fromStageId: desdeEtapaId, toStageId: hastaEtapaId, changedBy: actorId }];
    },

    async sellarCierre({ dealId, etapaDestinoId, cuando, amountCents, actorId }) {
      return reemplazarNegocio(dealId, {
        stageId: etapaDestinoId,
        stageChangedAt: cuando,
        closedAt: cuando,
        amountCents,
        updatedBy: actorId,
      });
    },

    async marcarUnidad({ unitId, estado: nuevoEstado, actorId }) {
      unidades = unidades.map((u) => (u.id === unitId ? { ...u, status: nuevoEstado, updatedBy: actorId } : u));
    },

    /**
     * Imita al upsert: sin fila para (broker, año, mes) la crea con
     * `achievedDeals: 1`; con fila, SUMA. La meta nueva nace con la del perfil del
     * broker (0 sin perfil, y 0 para la compañía), y el "conflicto" nunca toca
     * `targetDeals`. NO prueba la atomicidad: en memoria no hay concurrencia.
     */
    async incrementarMetaAlcanzada({ brokerId, anio, mes, amountCents, actorId }) {
      const existente = metas.find((m) => m.brokerId === brokerId && m.year === anio && m.month === mes);
      if (existente) {
        metas = metas.map((m) =>
          m === existente
            ? {
                ...m,
                achievedDeals: m.achievedDeals + 1,
                achievedAmountCents: m.achievedAmountCents + amountCents,
                updatedBy: actorId,
              }
            : m,
        );
        return;
      }
      const perfil = brokerId != null ? perfiles.find((p) => p.userId === brokerId) : undefined;
      metas = [
        ...metas,
        {
          brokerId,
          year: anio,
          month: mes,
          targetDeals: perfil?.monthlyTargetDeals ?? 0,
          achievedDeals: 1,
          achievedAmountCents: amountCents,
          updatedBy: actorId,
        },
      ];
    },

    async buscarPerfilDeBroker(brokerId) {
      const perfil = perfiles.find((p) => p.userId === brokerId);
      return perfil ? { userId: perfil.userId } : undefined;
    },

    /** Imita el `SUM` del adaptador: ganados, sin borrar, del broker, con el año de `closedAt` en hora de Santo Domingo. */
    async totalGanadoDelAnio(brokerId, anio) {
      return negocios
        .filter(
          (n) =>
            n.brokerId === brokerId &&
            n.deletedAt === null &&
            n.closedAt !== null &&
            etapas.find((e) => e.id === n.stageId)?.kind === "won" &&
            Number(fechaSantoDomingo(n.closedAt).slice(0, 4)) === anio,
        )
        .reduce((suma, n) => suma + (n.amountCents ?? 0), 0);
    },

    async actualizarPerfilDeBroker({ brokerId, annualSalesCents, nivel }) {
      perfiles = perfiles.map((p) => (p.userId === brokerId ? { ...p, annualSalesCents, level: nivel } : p));
    },

    async crearComision(datos) {
      if (estado.fallarEnCrearComision) throw estado.fallarEnCrearComision;
      comisiones = [...comisiones, datos];
    },

    async cancelarActividadesFuturasPendientes({ dealId, ahora, actorId }) {
      actividades = actividades.map((a) =>
        a.dealId === dealId && a.status === "pending" && (a.startsAt === null || a.startsAt > ahora)
          ? { ...a, status: "cancelled" as const, updatedBy: actorId }
          : a,
      );
    },

    // --- edición y propiedades -----------------------------------------------

    async buscarNegocioConEtapa(id) {
      const negocio = negocios.find((n) => n.id === id);
      const etapa = negocio && etapas.find((e) => e.id === negocio.stageId);
      return negocio && etapa ? { negocio, etapaKind: etapa.kind } : undefined;
    },

    async actualizarNegocio(id, cambios) {
      const { updatedBy, ...resto } = cambios;
      const parcial: Partial<Negocio> = { updatedBy };
      if (resto.amountCents !== undefined) parcial.amountCents = resto.amountCents;
      if (resto.probability !== undefined) parcial.probability = resto.probability;
      if (resto.commissionBasisPoints !== undefined) parcial.commissionBasisPoints = resto.commissionBasisPoints;
      if (resto.expectedCloseDate !== undefined) parcial.expectedCloseDate = resto.expectedCloseDate;
      return reemplazarNegocio(id, parcial);
    },

    /** Imita a `visibleRows`: papelera + alcance. Sin esto, las pruebas de alcance sobre proyectos se ejecutarían contra nada. */
    async proyectoVisible(actor: Actor, alcance: PermissionScope, projectId: number) {
      if (alcance === "none") return undefined;
      const proyecto = proyectos.find(
        (p) => p.id === projectId && p.deletedAt === null && (alcance === "all" || p.brokerId === actor.userId),
      );
      return proyecto ? { id: proyecto.id } : undefined;
    },

    async unidadDelProyecto(unitId, projectId) {
      const unidad = unidades.find((u) => u.id === unitId && u.projectId === projectId && u.deletedAt === null);
      return unidad ? { id: unidad.id } : undefined;
    },

    async buscarPropiedad(dealId, propId) {
      return propiedades.find((p) => p.id === propId && p.dealId === dealId);
    },

    async desmarcarPrincipales(dealId) {
      propiedades = propiedades.map((p) => (p.dealId === dealId && p.isPrimary ? { ...p, isPrimary: false } : p));
    },

    async crearPropiedad(datos) {
      const fila: PropiedadDeNegocio = {
        id: siguienteIdPropiedad++,
        dealId: datos.dealId,
        projectId: datos.projectId,
        unitId: datos.unitId,
        isPrimary: datos.isPrimary,
        createdAt: FECHA_FIJA,
        createdBy: datos.createdBy,
      };
      propiedades = [...propiedades, fila];
      return fila;
    },

    async marcarPrincipal(propId) {
      return reemplazarPropiedad(propId, { isPrimary: true });
    },

    async eliminarPropiedad(propId) {
      propiedades = propiedades.filter((p) => p.id !== propId);
    },

    instantanea() {
      // Las colecciones se reasignan en vez de mutarse: la copia es inmutable y
      // restaurarla es devolver la referencia. `bloqueos` no se restaura a
      // propósito, y el contador de ids tampoco (una secuencia de Postgres no
      // retrocede tras un rollback).
      const copia = { negocios, propiedades, actividades, perfiles, metas, unidades, comisiones, historial };
      return () => {
        negocios = copia.negocios;
        propiedades = copia.propiedades;
        actividades = copia.actividades;
        perfiles = copia.perfiles;
        metas = copia.metas;
        unidades = copia.unidades;
        comisiones = copia.comisiones;
        historial = copia.historial;
      };
    },
  };

  return estado;
}
