/**
 * Puertos del módulo Contactos.
 *
 * Los tipos de fila se declaran aquí y no se importan del esquema: `application/`
 * no conoce Drizzle (lo veta `arquitectura.test.ts`). La contrapartida es que
 * `Contacto` debe coincidir columna por columna con la tabla `contacts`, porque
 * la fila entera viaja en la respuesta HTTP y en `antes`/`despues` de la
 * auditoría; si el esquema cambia y esto no, el adaptador deja de compilar.
 *
 * La auditoría no es un puerto suelto: viaja dentro de `ReposContactos`, el juego
 * que entrega la unidad de trabajo, para que no pueda escribirse fuera de la
 * transacción del cambio (ver `compartido/auditoria.ts`).
 */

import type { Actor, PermissionScope } from "../../domain/rbac.ts";
import type { Auditoria } from "../compartido/auditoria.ts";

/** La fila de `contacts` tal como la devuelve el adaptador. Se declara aquí, no se importa del esquema: `application/` no conoce Drizzle. Debe coincidir columna por columna con la tabla, porque va entera en la respuesta HTTP y en `antes`/`despues` de la auditoría. */
export type Contacto = {
  id: number;
  fullName: string;
  phone: string | null;
  phoneDisplay: string | null;
  email: string | null;
  country: string | null;
  city: string | null;
  sourceId: number | null;
  brokerId: number | null;
  notes: string | null;
  lastInteractionAt: Date | null;
  consentAt: Date | null;
  consentSource: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: number | null;
  updatedBy: number | null;
  deletedAt: Date | null;
};

/** Lo que se le muestra al usuario cuando su alta choca con un contacto ya existente. Es un subconjunto a propósito: es lo que la respuesta 409 lleva hoy. */
export type CandidatoDuplicado = {
  id: number;
  fullName: string;
  phone: string | null;
  phoneDisplay: string | null;
  email: string | null;
};

export type DatosNuevoContacto = {
  fullName: string;
  phone: string | null;
  phoneDisplay: string | null;
  email: string | null;
  sourceId: number | null;
  notes: string | null;
  brokerId: number;
  createdBy: number;
  updatedBy: number;
};

/** Solo los campos presentes se escriben. `null` borra el campo. */
export type CambiosContacto = {
  fullName?: string;
  phone?: string | null;
  phoneDisplay?: string | null;
  email?: string | null;
  sourceId?: number | null;
  notes?: string | null;
  brokerId?: number;
  updatedBy: number;
};

export interface RepositorioContactos {
  /** Busca en TODA la cartera, sin filtrar por alcance: dos contactos idénticos repartidos entre brokers distintos siguen siendo el mismo duplicado (decisión #19). */
  candidatosDuplicados(criterio: { phone: string | null; email: string | null }): Promise<CandidatoDuplicado[]>;
  /** Filtra con `visibleRows` dentro del adaptador. `undefined` cubre a la vez "no existe" y "existe fuera de tu alcance". */
  buscarVisible(actor: Actor, alcance: PermissionScope, id: number): Promise<Contacto | undefined>;
  crear(datos: DatosNuevoContacto): Promise<Contacto>;
  actualizar(id: number, cambios: CambiosContacto): Promise<Contacto>;
  /** Borrado lógico: escribe `deletedAt`, nunca un DELETE real. */
  marcarBorrado(id: number, cuando: Date, actorId: number): Promise<Contacto>;
}

/** El juego transaccional del módulo: lo que la unidad de trabajo entrega al caso de uso. La auditoría viaja aquí dentro, así no puede escribirse fuera de la transacción del cambio. */
export type ReposContactos = { contactos: RepositorioContactos; auditoria: Auditoria };

// ---------------------------------------------------------------------------
// Lectura (listado y ficha lateral)
// ---------------------------------------------------------------------------

export type FiltrosListado = {
  q: string;
  sourceId?: number;
  pagina: number;
  contactoId?: number;
  incluirBrokers: boolean;
};

/**
 * Estructuralmente idéntico a `ContactoFila` de `app/(crm)/contactos/vista.tsx`.
 * Si divergen, la página deja de compilar: ese es el aviso que queremos, en vez
 * de un desajuste silencioso entre lo que consulta el adaptador y lo que pinta
 * la vista.
 */
export type FilaListadoContacto = {
  id: number;
  fullName: string;
  phone: string | null;
  phoneDisplay: string | null;
  email: string | null;
  sourceId: number | null;
  sourceName: string | null;
  brokerId: number | null;
  brokerName: string | null;
  notes: string | null;
  lastInteractionAt: Date | null;
};

export type Canal = { id: number; name: string };
export type BrokerAsignable = { id: number; fullName: string };

export type ListadoContactos = {
  contactos: FilaListadoContacto[];
  total: number;
  canales: Canal[];
  contactoSeleccionado: FilaListadoContacto | null;
  brokers: BrokerAsignable[];
};

export interface LecturaContactos {
  listado(
    actor: Actor,
    alcance: PermissionScope,
    filtros: FiltrosListado & { tamanioPagina: number },
  ): Promise<ListadoContactos>;
}
