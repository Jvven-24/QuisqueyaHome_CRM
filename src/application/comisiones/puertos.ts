/**
 * Puertos del módulo Comisiones: transición de estado / reparto de una comisión
 * y exportación CSV.
 *
 * `Comision` se declara a mano y debe coincidir columna por columna con
 * `commissions` (`application/` no importa el esquema): la fila entera viaja en
 * la respuesta HTTP y en `antes`/`despues` de la auditoría.
 *
 * ## La garantía que la FORMA de este puerto protege
 *
 * **`bloquearComision` es un método propio** y devuelve la comisión **y** el
 * borrado del negocio (lo que la ruta traía con un `JOIN` a `deals`). El
 * adaptador lo implementa con `FOR UPDATE OF commissions`: bloquea solo la fila
 * de la comisión, no la del negocio. Sin bloqueo, dos aprobaciones casi
 * simultáneas leerían ambas el estado viejo antes de decidir si la transición
 * vale; bloqueando también `deals`, se crearía contención sobre negocios que
 * nadie está editando. Por eso no se funde con una lectura normal. En memoria no
 * hay concurrencia: el doble solo comprueba que el caso de uso la llame
 * (`bloqueos`, `alBloquear`).
 *
 * La auditoría viaja dentro de `ReposComisiones` (ver `compartido/auditoria.ts`).
 */

import type { CommissionStatus } from "../../domain/catalogs.ts";
import type { Periodo } from "../../domain/metas.ts";
import type { Actor, PermissionScope } from "../../domain/rbac.ts";
import type { Auditoria } from "../compartido/auditoria.ts";

export type Comision = {
  id: number;
  dealId: number;
  brokerId: number | null;
  currency: string;
  saleAmountCents: number;
  commissionBasisPoints: number;
  totalCommissionCents: number;
  brokerShareBasisPoints: number;
  agencyShareBasisPoints: number;
  brokerAmountCents: number;
  agencyAmountCents: number;
  status: CommissionStatus;
  closedDate: string | null;
  approvedBy: number | null;
  approvedAt: Date | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: number | null;
  updatedBy: number | null;
};

/** Lo que devuelve el bloqueo: la fila y si el negocio de la comisión se borró. */
export type ComisionBloqueada = {
  comision: Comision;
  /** `deals.deleted_at` del negocio de la comisión (`null` si sigue vigente). */
  negocioBorradoEn: Date | null;
};

/** Solo las claves presentes se escriben (campo por campo, nunca `...cambios`). */
export type CambiosComision = {
  updatedBy: number;
  status?: CommissionStatus;
  approvedBy?: number;
  approvedAt?: Date;
  paidAt?: Date;
  brokerShareBasisPoints?: number;
  agencyShareBasisPoints?: number;
  brokerAmountCents?: number;
  agencyAmountCents?: number;
};

export interface RepositorioComisiones {
  /** `SELECT ... FOR UPDATE OF commissions` unido a `deals`. `undefined` si no existe la comisión o su negocio. */
  bloquearComision(id: number): Promise<ComisionBloqueada | undefined>;
  actualizar(id: number, cambios: CambiosComision): Promise<Comision>;
}

export type ReposComisiones = { comisiones: RepositorioComisiones; auditoria: Auditoria };

/** Filtros de la tabla y del CSV (los mismos `searchParams`). */
export type FiltrosComisiones = {
  /** `null` = todos los brokers. */
  brokerId: number | null;
  /** `null` = todos los periodos. */
  periodo: Periodo | null;
  estado: CommissionStatus | "todos";
};

/** Fila de la tabla/CSV: la comisión con el nombre del contacto, del broker y el proyecto principal. */
export type FilaComision = {
  id: number;
  dealId: number;
  status: CommissionStatus;
  closedDate: string | null;
  currency: string;
  saleAmountCents: number;
  commissionBasisPoints: number;
  totalCommissionCents: number;
  brokerShareBasisPoints: number;
  agencyShareBasisPoints: number;
  brokerAmountCents: number;
  agencyAmountCents: number;
  brokerId: number | null;
  brokerName: string | null;
  contactName: string;
  projectName: string | null;
};

/**
 * Lectura de las filas a exportar: la MISMA consulta que pinta `/comisiones`
 * (alcance + broker + periodo + estado). Hoy vive en `app/(crm)/comisiones/_consulta.ts`
 * y la ruta la inyecta; pasa a `comisiones/consultas.ts` en R4.3.
 */
export type LeerFilasComisiones = (
  actor: Actor,
  alcance: PermissionScope,
  filtros: FiltrosComisiones,
) => Promise<readonly FilaComision[]>;
