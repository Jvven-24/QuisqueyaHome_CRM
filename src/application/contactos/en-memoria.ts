/**
 * Doble en memoria del repositorio de Contactos.
 *
 * Vive en este módulo y no en `application/testing/` porque ahí solo van los
 * dobles de los puertos transversales (auditoría, almacenamiento, Auth, unidad
 * de trabajo): si cada módulo metiera el suyo, esa carpeta se volvería el
 * archivo compartido que la §4 del plan quiere evitar, con varios agentes
 * editándolo a la vez.
 *
 * Es `Reversible` para que `unidadDeTrabajoEnMemoria` pueda deshacer lo escrito
 * cuando el caso de uso lanza; sin eso, una prueba de "si falla, no queda nada"
 * pasaría siempre.
 */

import type { Actor, PermissionScope } from "../../domain/rbac.ts";
import type { Reversible } from "../testing/reversible.ts";
import type { CambiosContacto, CandidatoDuplicado, Contacto, DatosNuevoContacto, RepositorioContactos } from "./puertos.ts";

/** Fecha fija: así las pruebas no dependen del reloj. */
const FECHA_FIJA = new Date("2026-01-01T00:00:00Z");

export function contactosEnMemoria(
  iniciales: readonly Contacto[] = [],
): RepositorioContactos & Reversible & { readonly filas: readonly Contacto[] } {
  let filas: Contacto[] = [...iniciales];
  let siguienteId = Math.max(0, ...filas.map((f) => f.id)) + 1;

  function indiceDe(id: number): number {
    const indice = filas.findIndex((f) => f.id === id);
    // Error de programación, no de usuario: el caso de uso ya comprobó la
    // visibilidad, así que no es un error de dominio.
    if (indice === -1) throw new Error(`contactosEnMemoria: no existe el contacto ${id}.`);
    return indice;
  }

  function reemplazar(id: number, cambios: Partial<Contacto>): Contacto {
    const indice = indiceDe(id);
    const fila = { ...filas[indice]!, ...cambios, updatedAt: FECHA_FIJA };
    filas = filas.map((f, i) => (i === indice ? fila : f));
    return fila;
  }

  return {
    get filas() {
      return filas;
    },

    async candidatosDuplicados({ phone, email }): Promise<CandidatoDuplicado[]> {
      // Ignora el alcance a propósito, como el adaptador real (decisión #19).
      return filas
        .filter((f) => f.deletedAt === null && ((phone && f.phone === phone) || (email && f.email === email)))
        .map((f) => ({ id: f.id, fullName: f.fullName, phone: f.phone, phoneDisplay: f.phoneDisplay, email: f.email }));
    },

    /**
     * Imita a `visibleRows`: papelera + alcance. Esta imitación es la razón de
     * que las pruebas de alcance sigan valiendo algo: si el doble devolviera
     * cualquier fila, "un broker no ve lo de otro" se probaría contra nada.
     */
    async buscarVisible(actor: Actor, alcance: PermissionScope, id: number) {
      if (alcance === "none") return undefined;
      return filas.find(
        (f) => f.id === id && f.deletedAt === null && (alcance !== "own" || f.brokerId === actor.userId),
      );
    },

    async crear(datos: DatosNuevoContacto) {
      const fila: Contacto = {
        id: siguienteId++,
        fullName: datos.fullName,
        phone: datos.phone,
        phoneDisplay: datos.phoneDisplay,
        email: datos.email,
        country: null,
        city: null,
        sourceId: datos.sourceId,
        brokerId: datos.brokerId,
        notes: datos.notes,
        lastInteractionAt: null,
        consentAt: null,
        consentSource: null,
        createdAt: FECHA_FIJA,
        updatedAt: FECHA_FIJA,
        createdBy: datos.createdBy,
        updatedBy: datos.updatedBy,
        deletedAt: null,
      };
      filas = [...filas, fila];
      return fila;
    },

    async actualizar(id: number, cambios: CambiosContacto) {
      return reemplazar(id, cambios);
    },

    async marcarBorrado(id: number, cuando: Date, actorId: number) {
      return reemplazar(id, { deletedAt: cuando, updatedBy: actorId });
    },

    instantanea() {
      // `filas` se reasigna en vez de mutarse: la copia es inmutable y restaurarla
      // es devolver la referencia. El contador de ids no se restaura: una secuencia
      // de Postgres tampoco retrocede tras un rollback.
      const copia = filas;
      return () => {
        filas = copia;
      };
    },
  };
}
