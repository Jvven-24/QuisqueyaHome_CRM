/**
 * Puertos del módulo Pipeline (negocios): cambio de etapa, cierre
 * transaccional de ocho pasos, edición del negocio y propiedades de interés.
 *
 * Los tipos de fila se declaran aquí y no se importan del esquema: `application/`
 * no conoce Drizzle (lo veta `arquitectura.test.ts`). La contrapartida es que
 * `Negocio`, `EtapaPipeline` y `PropiedadDeNegocio` deben coincidir columna por
 * columna con `deals`, `pipeline_stages` y `deal_properties`, porque la fila
 * persistida se usa solo internamente; las respuestas HTTP pasan por DTO.
 *
 * ## Tres garantías que la FORMA de este puerto protege
 *
 * Son las que una migración ingenua destruye sin que ninguna prueba con dobles
 * en memoria lo note, porque en memoria no hay concurrencia:
 *
 * 1. **`bloquearNegocio` es un método propio.** Es el `SELECT ... FOR UPDATE`
 *    que da la defensa 2 contra el doble cierre. No se funde con `buscarNegocio`:
 *    si el caso de uso llamara a una lectura sin bloqueo, las tres defensas
 *    (`validarTransicion`, el bloqueo, `commissions_deal_unq`) pasarían a dos.
 * 2. **`incrementarMetaAlcanzada` es UN método atómico** (`INSERT ... ON CONFLICT`).
 *    No hay `buscarMeta` + `crearMeta`/`actualizarMeta`: componerlos en el caso
 *    de uso reintroduciría la ventana "leer si existe / escribir" que el upsert
 *    eliminó.
 * 3. **`totalGanadoDelAnio` es un `SUM` en SQL** con la zona horaria de Santo
 *    Domingo (issue #24). No se recalcula en JavaScript.
 *
 * La auditoría no es un puerto suelto: viaja dentro de `ReposPipeline`, el juego
 * que entrega la unidad de trabajo (ver `compartido/auditoria.ts`).
 */

import type { BrokerLevel, StageKind } from "../../domain/catalogs.ts";
import type { Actor, PermissionScope } from "../../domain/rbac.ts";
import type { Auditoria } from "../compartido/auditoria.ts";
import type { OutboxCrm } from "../compartido/crm.ts";
import type { CompromisosPort } from "../compromisos/puertos.ts";

/**
 * Tipos de actividad que cuentan como "contacto" para el requisito de §10.1
 * (→ Contactado): una interacción real con el cliente, no una tarea pendiente
 * (`task`) ni una nota interna (`note`) que no implica que se le haya
 * hablado. Se documenta aquí porque es un criterio, no un dato del esquema; lo
 * usan el adaptador de `tieneActividadDeContacto` y el doble en memoria.
 */
export const TIPOS_ACTIVIDAD_DE_CONTACTO = ["call", "meeting", "whatsapp", "email"] as const;

/** La fila de `deals`. Debe coincidir columna por columna con la tabla. */
export type Negocio = {
  id: number;
  contactId: number;
  leadId: number | null;
  title: string | null;
  stageId: number;
  sourceId: number | null;
  brokerId: number | null;
  operationType: "sale" | "rent";
  currency: string;
  amountCents: number | null;
  probability: number | null;
  commissionBasisPoints: number | null;
  expectedCloseDate: string | null;
  nextActivityId: number | null;
  stageChangedAt: Date | null;
  closedAt: Date | null;
  lossReasonId: number | null;
  lossComment: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: number | null;
  updatedBy: number | null;
  deletedAt: Date | null;
};

/** La fila de `pipeline_stages`. */
export type EtapaPipeline = {
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

/** La fila de `deal_properties`. */
export type PropiedadDeNegocio = {
  id: number;
  dealId: number;
  projectId: number;
  unitId: number | null;
  isPrimary: boolean;
  createdAt: Date;
  createdBy: number | null;
  deletedAt?: Date | null;
  deletedBy?: number | null;
  deletionReason?: string | null;
};

/** Un negocio junto al `kind` de su etapa actual (lo que necesita el guardia de "negocio abierto"). */
export type NegocioConEtapa = { negocio: Negocio; etapaKind: StageKind };

/** Solo los campos presentes se escriben. `null` borra el campo. */
export type CambiosNegocio = {
  amountCents?: number | null;
  probability?: number | null;
  commissionBasisPoints?: number | null;
  expectedCloseDate?: string | null;
  updatedBy: number;
};

export type DatosNuevaPropiedad = {
  dealId: number;
  projectId: number;
  unitId: number | null;
  isPrimary: boolean;
  createdBy: number;
};

/** Los campos que el paso 6 del cierre inserta en `commissions`. */
export type DatosNuevaComision = {
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
  status: "pending";
  /** `YYYY-MM-DD` en hora de Santo Domingo. */
  closedDate: string;
  createdBy: number;
  updatedBy: number;
};

export interface RepositorioPipeline {
  // --- lecturas para resolver el contexto de la transición -------------------

  /** Lectura normal, SIN bloqueo. Devuelve también los negocios en la papelera: decidir qué hacer con `deletedAt` es del caso de uso. */
  buscarNegocio(id: number): Promise<Negocio | undefined>;
  buscarEtapa(id: number): Promise<EtapaPipeline | undefined>;
  /** Solo etapas con `isActive = true`. */
  buscarEtapaActiva(id: number): Promise<EtapaPipeline | undefined>;
  /** ¿Hay una actividad completada, sin borrar, de alguno de `TIPOS_ACTIVIDAD_DE_CONTACTO`? */
  tieneActividadDeContacto(dealId: number): Promise<boolean>;
  /** La próxima acción solo cuenta si sigue pendiente, sin borrar, y trae responsable y fecha. `fecha` es ISO. */
  buscarProximaAccionVigente(actividadId: number, dealId: number): Promise<{ responsableId: number; fecha: string } | null>;
  motivoPerdidaActivo(id: number): Promise<boolean>;
  propiedadesDelNegocio(dealId: number): Promise<PropiedadDeNegocio[]>;

  // --- escrituras del cambio de etapa y del cierre ---------------------------

  /** `SELECT ... FOR UPDATE`: bloquea la fila hasta el fin de la transacción. Defensa 2 contra el doble cierre; NO sustituir por `buscarNegocio`. */
  bloquearNegocio(id: number): Promise<Negocio | undefined>;
  bloquearUnidad(unitId: number, projectId: number): Promise<{ id: number; status: string; code: string } | undefined>;
  /** Serializa selección/alta por proyecto; incluye archivadas para no resucitarlas. */
  resolverUnidadDeCierre(params: { projectId: number; code: string; actorId: number }): Promise<number>;
  fijarUnidadPrincipal(params: { propiedadId: number; unitId: number }): Promise<void>;
  registrarVenta(params: { unitId: number; dealId: number; projectId: number; unitCodeNormalized: string; actorId: number }): Promise<void>;
  /** Cambio simple de etapa. `perdida` solo viaja cuando el destino es `lost`. */
  aplicarCambioDeEtapa(params: {
    dealId: number;
    etapaDestinoId: number;
    cuando: Date;
    perdida?: { lossReasonId: number | undefined; lossComment: string | null };
    actorId: number;
  }): Promise<Negocio>;
  registrarHistorialDeEtapa(params: {
    dealId: number;
    desdeEtapaId: number;
    hastaEtapaId: number;
    actorId: number;
  }): Promise<void>;
  /** Paso 1 del cierre: sella `closedAt`, el monto final y la etapa. `NotFoundError` si la fila desapareció. */
  sellarCierre(params: {
    dealId: number;
    etapaDestinoId: number;
    cuando: Date;
    amountCents: number;
    actorId: number;
  }): Promise<Negocio>;
  /** Paso 3 del cierre. */
  marcarUnidad(params: { unitId: number; estado: "sold" | "reserved"; actorId: number }): Promise<void>;
  /**
   * Paso 4 del cierre. ATÓMICO (`INSERT ... ON CONFLICT DO UPDATE`): `brokerId`
   * nulo es la meta de la compañía. Nunca leer-y-escribir: no hay ventana entre
   * "existe la fila" y "la escribo". El adaptador lee la meta mensual del perfil
   * del broker para sembrar una fila nueva.
   */
  incrementarMetaAlcanzada(params: {
    brokerId: number | null;
    anio: number;
    mes: number;
    amountCents: number;
    actorId: number;
  }): Promise<void>;
  /** Paso 5. Un usuario sin perfil de broker devuelve `undefined`. */
  buscarPerfilDeBroker(brokerId: number): Promise<{ userId: number } | undefined>;
  /** Paso 5. `SUM` en SQL de los negocios ganados del broker cuyo `closed_at` cae en `anio` en hora de Santo Domingo. */
  totalGanadoDelAnio(brokerId: number, anio: number): Promise<number>;
  actualizarPerfilDeBroker(params: { brokerId: number; annualSalesCents: number; nivel: BrokerLevel }): Promise<void>;
  /** Paso 6. `commissions_deal_unq` es la tercera defensa contra el doble cierre. */
  crearComision(datos: DatosNuevaComision): Promise<void>;
  /** Paso 7. Las pendientes sin fecha cuentan como futuras. */
  cancelarActividadesFuturasPendientes(params: { dealId: number; ahora: Date; actorId: number }): Promise<void>;

  // --- edición del negocio y propiedades de interés --------------------------

  /** El negocio (aunque esté borrado; lo decide el caso de uso) y el `kind` de su etapa actual. Sin bloqueo. */
  buscarNegocioConEtapa(id: number): Promise<NegocioConEtapa | undefined>;
  actualizarNegocio(id: number, cambios: CambiosNegocio): Promise<Negocio>;
  /** Filtra con `visibleRows` (papelera y alcance sobre `projects`) dentro del adaptador. */
  proyectoVisible(actor: Actor, alcance: PermissionScope, projectId: number): Promise<{ id: number } | undefined>;
  /** La unidad debe existir, no estar borrada y pertenecer a ese proyecto. */
  unidadDelProyecto(unitId: number, projectId: number): Promise<{ id: number } | undefined>;
  buscarPropiedad(dealId: number, propId: number): Promise<PropiedadDeNegocio | undefined>;
  /** Quita la marca de principal a cualquier propiedad del negocio que la tenga. */
  desmarcarPrincipales(dealId: number): Promise<void>;
  crearPropiedad(datos: DatosNuevaPropiedad): Promise<PropiedadDeNegocio>;
  marcarPrincipal(propId: number): Promise<PropiedadDeNegocio>;
  /** Baja lógica; nunca libera la identidad histórica. */
  eliminarPropiedad(propId: number, actorId: number, motivo: string): Promise<void>;
}

/**
 * Autoridad mínima de inventario para el cierre de venta (M40 b1i).
 * Re-exportada desde `application/compromisos/puertos.ts` (M40 b1i3a).
 */
export type { CompromisosPort };

/** Todos los puertos comparten la transacción de la unidad de trabajo. */
export type ReposPipeline = { pipeline: RepositorioPipeline; compromisos: CompromisosPort; auditoria: Auditoria; outbox: OutboxCrm };

/** Contrato de lectura M03 / T-E1-1b1. Nunca devolver la fila persistida completa. */
export type FiltrosNegocios = {
  /** S-303-H: ganados de venta sin registro durable; conserva el alcance de lectura. */
  historicasSinUnidad?: boolean;
  projectId?: number; brokerId?: number; stageId?: number;
  resultado?: StageKind; moneda?: string; montoMin?: number; montoMax?: number;
  desde?: string; hasta?: string;
  campoFecha?: "createdAt" | "closedAt" | "expectedCloseDate";
};
export type OrdenNegocios = { campo: "createdAt" | "amountCents" | "id"; direccion: "asc" | "desc" };
export type CursorNegocios = { id: number; valor: string | number; orden: OrdenNegocios };
export type ProyectoPrincipalNegocio = { dealId: number; projectName: string; unitCode: string | null; unitId: number | null };
export type InteresNegocio = {
  id: number; projectId: number; projectName: string; unitId: number | null;
  unitCode: string | null; isPrimary: boolean; realPriceCents?: number | null;
};
export type ProyectoDisponibleNegocio = { id: number; name: string; unidades: { id: number; code: string }[] };
export type FilaNegocio = {
  id: number; contactId: number; contactName: string; contactPhone: string | null;
  contactPhoneDisplay: string | null; sourceName: string | null; brokerId: number | null;
  brokerName: string | null; stageId: number; stageKind: StageKind;
  operationType: "sale" | "rent"; currency: string; amountCents?: number | null;
  probability: number | null; commissionBasisPoints?: number | null;
  totalCommissionCents?: number | null;
  expectedCloseDate: string | null; nextActivityTitle: string | null;
  nextActivityStartsAt: Date | null; stageChangedAt: Date | null; closedAt: Date | null;
  lossReasonId: number | null; lossComment: string | null; notes: string | null;
  createdAt: Date; proyectoPrincipal: ProyectoPrincipalNegocio | null;
};
export type ResumenEtapaNegocio = { stageId: number; kind: StageKind; currency: string; count: number; amountCents?: number };
export type CatalogosNegocios = {
  etapas: Pick<EtapaPipeline, "id" | "slug" | "name" | "position" | "kind" | "defaultProbability">[];
  motivos: { id: number; name: string; isActive: boolean }[];
  brokers: { id: number; name: string }[];
  proyectos: { id: number; name: string }[];
};
export type FichaNegocio = { negocio: FilaNegocio; propiedades: InteresNegocio[]; proyectosDisponibles: ProyectoDisponibleNegocio[] };
export type ListaNegocios = { filas: FilaNegocio[]; siguiente: CursorNegocios | null; resumen: ResumenEtapaNegocio[] };
export interface LecturaPipeline {
  listar(actor: Actor, alcance: PermissionScope, filtros: FiltrosNegocios, orden: OrdenNegocios, cursor: CursorNegocios | null, limite: number): Promise<FilaNegocio[]>;
  resumir(actor: Actor, alcance: PermissionScope, filtros: FiltrosNegocios): Promise<ResumenEtapaNegocio[]>;
  catalogos(actor: Actor, alcance: PermissionScope): Promise<CatalogosNegocios>;
  ficha(actor: Actor, alcance: PermissionScope, id: number): Promise<FichaNegocio | undefined>;
}
