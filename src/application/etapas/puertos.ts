/**
 * Puertos del módulo Etapas: edición de una etapa del pipeline.
 *
 * ## Lo que este puerto NO puede llevar: `kind` y `slug`
 *
 * `kind` decide si un negocio está ganado o perdido
 * (`domain/transicion-etapa.ts`): cambiarlo reescribiría en silencio el
 * significado de los negocios ya cerrados (todos los de «Cerrado ganado»
 * pasarían a contar como perdidos, con sus comisiones ya pagadas). `slug` es la
 * identidad estable que usa el código (decisión #29). Por eso `CambiosEtapa` no
 * los tiene y los declara `?: never`: ni escribiéndolos a mano compila. La
 * ruta tampoco los acepta en su esquema Zod, y el adaptador arma el `set`
 * campo por campo sin nombrarlos (guarda de lectura de código en
 * `casos-de-uso.test.ts`).
 *
 * La auditoría viaja dentro de `ReposEtapas` (ver `compartido/auditoria.ts`).
 */

import type { StageKind } from "../../domain/catalogs.ts";
import type { Auditoria } from "../compartido/auditoria.ts";

/** Fila de `pipeline_stages`, columna por columna. */
export type Etapa = {
  id: number;
  slug: string;
  name: string;
  position: number;
  kind: StageKind;
  defaultProbability: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

/** Solo las claves presentes se escriben. `null` borra la probabilidad; ausente la deja. */
export type CambiosEtapa = {
  name?: string;
  position?: number;
  defaultProbability?: number | null;
  isActive?: boolean;
  /** Imposible a propósito (ver el docblock). */
  kind?: never;
  slug?: never;
};

export interface RepositorioEtapas {
  buscar(id: number): Promise<Etapa | undefined>;
  actualizar(id: number, cambios: CambiosEtapa): Promise<Etapa>;
}

export type ReposEtapas = { etapas: RepositorioEtapas; auditoria: Auditoria };
