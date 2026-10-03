/**
 * Puertos del módulo Catálogos: alta y edición de los motivos de pérdida y los
 * canales de captación (`loss_reasons` y `lead_sources`).
 *
 * ## Por qué la clave es texto y no la tabla
 *
 * Las dos tablas tienen la misma forma (`slug`, `name`, `position`,
 * `isActive`), así que hay UN repositorio genérico y UN juego de casos de uso,
 * no uno por tabla (decisión 2 del plan: SOLID pragmático). Pero el
 * repositorio necesita saber cuál de las dos tocar, y `application/` no puede
 * importar `drizzle-orm` ni el esquema (`arquitectura.test.ts`): el objeto de
 * tabla de Drizzle no puede viajar hasta aquí. Por eso el caso de uso
 * direcciona por una **clave de texto** (`TipoCatalogo`, la misma que llega en
 * la URL) y es el adaptador (`infrastructure/db/repos/catalogos.ts`), que sí
 * conoce Drizzle, quien traduce la clave a la tabla. El mapa de tablas vive
 * allí.
 *
 * `slug` no se edita nunca: es la identidad estable que usa el código (mismo
 * criterio que las etapas, decisión #29). `CambiosCatalogo` no lo tiene.
 *
 * La auditoría viaja dentro de `ReposCatalogos` (ver `compartido/auditoria.ts`).
 */

import type { Auditoria } from "../compartido/auditoria.ts";

/** Unión de literales escrita a mano: coincide con las claves de la URL `/api/catalogos/[tipo]`. */
export type TipoCatalogo = "motivos-perdida" | "canales";

/** Fila de `loss_reasons` / `lead_sources` (misma forma las dos), columna por columna. */
export type EntradaCatalogo = {
  id: number;
  slug: string;
  name: string;
  position: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type DatosNuevaEntradaCatalogo = { slug: string; name: string; position: number };

/** Solo las claves presentes se escriben; sin `slug`. */
export type CambiosEntradaCatalogo = {
  name?: string;
  position?: number;
  isActive?: boolean;
};

export interface RepositorioCatalogos {
  /** Slugs que son `base` o empiezan por `base-` (para decidir el sufijo del nuevo). */
  slugsParecidos(tipo: TipoCatalogo, base: string): Promise<readonly string[]>;
  crear(tipo: TipoCatalogo, datos: DatosNuevaEntradaCatalogo): Promise<EntradaCatalogo>;
  buscar(tipo: TipoCatalogo, id: number): Promise<EntradaCatalogo | undefined>;
  actualizar(tipo: TipoCatalogo, id: number, cambios: CambiosEntradaCatalogo): Promise<EntradaCatalogo>;
}

export type ReposCatalogos = { catalogos: RepositorioCatalogos; auditoria: Auditoria };
