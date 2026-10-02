/**
 * Puertos del módulo Metas: fijar la meta mensual (`goals`).
 *
 * `Meta` coincide columna por columna con `goals` (la fila viaja en la respuesta
 * y en `antes`/`despues` de la auditoría).
 *
 * ## El invariante que la FORMA de este puerto protege (decisión #35)
 *
 * `goals` la escriben DOS módulos, con mitades opuestas: este módulo escribe
 * SOLO las columnas `target_*`; el cierre de pipeline
 * (`pipeline/puertos.ts#incrementarMetaAlcanzada`) escribe SOLO `achieved_*`.
 * Por eso `DatosMetaMensual` no tiene ningún campo de lo alcanzado: el tipo no
 * deja que un caso de uso lo pida.
 *
 * `fijarMetaMensual` es **UN** método atómico (`INSERT ... ON CONFLICT DO UPDATE`).
 * No hay `buscarMeta` + `crear`/`actualizar`: componerlos reintroduciría la
 * ventana "leer si existe / escribir" que el upsert elimina, y ninguna prueba
 * con dobles la vería porque en memoria no hay concurrencia. `anterior` que
 * devuelve es solo para la auditoría (acción y `antes`).
 */

import type { Auditoria } from "../compartido/auditoria.ts";

export type Meta = {
  id: number;
  brokerId: number | null;
  year: number;
  month: number;
  targetDeals: number;
  targetAmountCents: number | null;
  achievedDeals: number;
  achievedAmountCents: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: number | null;
  updatedBy: number | null;
};

export type DatosMetaMensual = {
  /** `null` = meta de la compañía. */
  brokerId: number | null;
  year: number;
  month: number;
  targetDeals: number;
  /** Solo se escribe si viene: ausente conserva el monto que ya hubiera. */
  targetAmountCents?: number;
  actorId: number;
};

export interface RepositorioMetas {
  /** Existe el perfil de broker (`broker_profiles`) de ese usuario. */
  existePerfilDeBroker(brokerId: number): Promise<boolean>;
  /** Upsert atómico de la meta del periodo. `anterior` es la fila previa, para la auditoría. */
  fijarMetaMensual(datos: DatosMetaMensual): Promise<{ anterior: Meta | undefined; meta: Meta }>;
}

export type ReposMetas = { metas: RepositorioMetas; auditoria: Auditoria };

