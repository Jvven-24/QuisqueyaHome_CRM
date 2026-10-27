/**
 * Puertos del módulo Brokers: asignar proyectos a un broker (decisión #38).
 *
 * `Proyecto` es el mismo tipo de fila que declara `proyectos/puertos.ts` (la
 * fila entera viaja en la respuesta y en `antes`/`despues`); se reutiliza en vez
 * de copiarlo, para que no puedan desalinearse.
 */

import type { Auditoria } from "../compartido/auditoria.ts";
import type { Proyecto } from "../proyectos/puertos.ts";

export type { Proyecto };

export type BrokerAsignable = { userId: number; isActive: boolean; deletedAt: Date | null };

export interface RepositorioBrokers {
  /** Perfil de broker unido a su usuario. `undefined` si no tiene perfil. */
  buscarBroker(brokerId: number): Promise<BrokerAsignable | undefined>;
  /**
   * Una sola consulta con dos usos: validar que los proyectos pedidos existen y
   * dar la foto "antes" para la auditoría. Devuelve los proyectos pedidos **y**
   * los que hoy ya son de este broker, restringidos al universo "activo, no
   * borrado" (lo que el modal de `/brokers` ofrece marcar).
   */
  proyectosRelevantes(brokerId: number, idsSolicitados: readonly number[]): Promise<Proyecto[]>;
  /** `UPDATE ... SET broker_id = brokerId`. Devuelve las filas ya actualizadas. */
  asignar(ids: readonly number[], brokerId: number, actorId: number): Promise<Proyecto[]>;
  /** `UPDATE ... SET broker_id = NULL`. Devuelve las filas ya actualizadas. */
  desasignar(ids: readonly number[], actorId: number): Promise<Proyecto[]>;
}

export type ReposBrokers = { brokers: RepositorioBrokers; auditoria: Auditoria };
