/**
 * Puertos del módulo Leads: alta manual, asignación de responsable, descarte,
 * conversión transaccional a negocio y captura externa (webhook).
 *
 * Los tipos de fila se declaran aquí y no se importan del esquema: `application/`
 * no conoce Drizzle (lo veta `arquitectura.test.ts`). La contrapartida es que
 * `Lead` debe coincidir columna por columna con la tabla `leads`, porque la fila
 * entera viaja en la respuesta HTTP y en `antes`/`despues` de la auditoría.
 * `Contacto` y `Negocio` (las otras dos filas que este módulo escribe) se
 * reutilizan de los puertos de Contactos y Pipeline, que ya las declaran
 * columna por columna: son tipos, no dependencias de comportamiento.
 *
 * ## Dos garantías que la FORMA de este puerto protege
 *
 * Las destruye una migración ingenua sin que ninguna prueba con dobles en
 * memoria lo note, porque en memoria no hay concurrencia:
 *
 * 1. **`crearLeadExternoSiNoExiste` es UN método atómico** (decisión #20). El
 *    adaptador hace `INSERT ... ON CONFLICT DO NOTHING` sobre el índice único
 *    parcial `leads_external_id_unq` y, solo si no insertó, un `SELECT` de
 *    respaldo. NO existe `buscarPorExternalId` + `crearLead`: componerlos en el
 *    caso de uso dejaría una ventana "leer si existe / escribir" por la que dos
 *    entregas simultáneas del mismo `externalId` insertarían las dos.
 * 2. **`registrarAuditoriaSinActor` es un método propio del repositorio.** El
 *    webhook no tiene `Actor` (es la única entrada pública del sistema) y el
 *    puerto `Auditoria` de `compartido/` lo exige. La fila se escribe con
 *    `userId: null`, en la misma transacción que el cambio, igual que antes.
 *    Por eso NO pasa por `Auditoria`: no es un olvido, es que aquel puerto no
 *    puede representar "sin actor".
 *
 * La auditoría con actor (alta, asignar, descartar, convertir) sí viaja dentro
 * de `ReposLeads`, el juego que entrega la unidad de trabajo (ver
 * `compartido/auditoria.ts`).
 */

import type { AuditAction, EntityType, LEAD_STATUSES, OPERATION_TYPES } from "../../domain/catalogs.ts";
import type { Actor, PermissionScope } from "../../domain/rbac.ts";
import type { Auditoria } from "../compartido/auditoria.ts";
import type { Contacto } from "../contactos/puertos.ts";
import type { Negocio } from "../pipeline/puertos.ts";

export type { Contacto, Negocio };

export type EstadoLead = (typeof LEAD_STATUSES)[number];
export type TipoOperacion = (typeof OPERATION_TYPES)[number];

/** La fila de `leads` tal como la devuelve el adaptador. Debe coincidir columna por columna con la tabla. */
export type Lead = {
  id: number;
  contactId: number;
  sourceId: number | null;
  projectId: number | null;
  projectInterestText: string | null;
  zoneInterest: string | null;
  operationType: TipoOperacion | null;
  currency: string;
  budgetMinCents: number | null;
  budgetMaxCents: number | null;
  bedrooms: number | null;
  status: EstadoLead;
  brokerId: number | null;
  suggestedBrokerId: number | null;
  sourceVideoUrl: string | null;
  campaign: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  originalMessage: string | null;
  externalId: string | null;
  receivedAt: Date;
  firstContactedAt: Date | null;
  convertedDealId: number | null;
  discardReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: number | null;
  updatedBy: number | null;
  deletedAt: Date | null;
};

/** Un broker activo con perfil: la lista para sugerir (decisión #21) y para validar la asignación manual. `fullName` no lo usa `sugerirBroker`. */
export type CandidatoBroker = {
  userId: number;
  specialty: string | null;
  handlesRentals: boolean;
  annualSalesCents: number;
  fullName: string;
};

/** Lo que se le muestra al usuario cuando su alta choca con un contacto ya existente (subconjunto, como en Contactos). */
export type CandidatoDuplicado = {
  id: number;
  fullName: string;
  phone: string | null;
  phoneDisplay: string | null;
  email: string | null;
};

/** Los campos de captura que comparten el alta manual y el webhook. */
export type DatosCapturaLead = {
  contactId: number;
  sourceId: number | null;
  projectId: number | null;
  projectInterestText: string | null;
  zoneInterest: string | null;
  operationType: TipoOperacion | null;
  currency: string;
  budgetMinCents: number | null;
  budgetMaxCents: number | null;
  /** Decisión #21: solo la sugerencia; `brokerId` nunca se escribe por esta regla. */
  suggestedBrokerId: number | null;
  campaign: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  originalMessage: string | null;
  sourceVideoUrl: string | null;
};

export type DatosNuevoLead = DatosCapturaLead & { createdBy: number; updatedBy: number };

/** El webhook no tiene actor: sin `createdBy`/`updatedBy`. `externalId` es la clave de idempotencia. */
export type DatosNuevoLeadExterno = DatosCapturaLead & { externalId: string };

/** Contacto creado junto con un lead manual: el actor es su responsable y su autor. */
export type DatosNuevoContactoManual = {
  fullName: string;
  phone: string | null;
  phoneDisplay: string | null;
  email: string | null;
  sourceId: number | null;
  brokerId: number;
  createdBy: number;
  updatedBy: number;
};

/** Contacto creado por el webhook: sin responsable ni autor, con el consentimiento de la captura. */
export type DatosNuevoContactoExterno = {
  fullName: string;
  phone: string | null;
  phoneDisplay: string | null;
  email: string | null;
  sourceId: number | null;
  consentAt: Date;
  consentSource: string;
};

export type DatosNuevoNegocioDeLead = {
  contactId: number;
  leadId: number;
  stageId: number;
  sourceId: number | null;
  brokerId: number;
  operationType: TipoOperacion;
  currency: string;
  stageChangedAt: Date;
  createdBy: number;
  updatedBy: number;
};

/** Fila de `audit_log` sin actor: `userId` es siempre `null`. */
export type RegistroAuditoriaSinActor = {
  accion: AuditAction;
  entidad: EntityType;
  entidadId: number;
  despues: unknown;
  /** Recibo de la captura: el adaptador persiste solo hashes en previousValue. */
  captura?: { externalId: string; payload: string };
};

export interface RepositorioLeads {
  // --- lecturas previas a la transacción (avisos y validaciones) -----------

  /** Detecta en toda la cartera (#19), sin garantía de unicidad; divulga solo candidatos dentro del alcance de lectura de contactos. */
  candidatosDuplicados(
    criterio: { phone: string | null; email: string | null },
    actor: Actor,
    alcanceLectura: PermissionScope,
  ): Promise<{ existe: boolean; candidatos: CandidatoDuplicado[] }>;
  /** Existencia interna: no autoriza enlazar el contacto a un lead. */
  contactoExiste(id: number): Promise<boolean>;
  /** Lectura autorizada para enlazar un contacto desde un request. */
  contactoVisible(id: number, actor: Actor, alcance: PermissionScope): Promise<boolean>;
  /** Brokers activos con perfil, sin papelera. */
  candidatosBroker(): Promise<CandidatoBroker[]>;

  // --- lecturas y escrituras dentro de la transacción ----------------------

  /** Por id, SIN filtrar papelera ni alcance: el caso de uso decide con `deletedAt` y `reaches`. */
  buscarLead(id: number): Promise<Lead | undefined>;
  /** Lee con alcance y bloqueo de fila, retenido hasta commit/rollback. Solo transaccional. */
  buscarLeadParaConversion(id: number, actor: Actor, alcance: PermissionScope): Promise<Lead | undefined>;
  /**
   * Serializa la clave ANTES de cualquier efecto y recupera el resultado original
   * desde su recibo durable. Distinto payload o clave histórica sin recibo: conflicto.
   * La reserva se libera al terminar la transacción; el recibo no expira ni se
   * elimina al borrar el lead. Solo se llama dentro de la unidad de trabajo.
   */
  bloquearCapturaExterna(externalId: string, payload: string): Promise<Lead | undefined>;
  /** Primer contacto vivo con ese teléfono o correo (el webhook lo reutiliza). */
  buscarContactoPorTelefonoOCorreo(criterio: { phone: string | null; email: string | null }): Promise<{ id: number } | undefined>;
  crearContactoManual(datos: DatosNuevoContactoManual): Promise<Contacto>;
  crearContactoExterno(datos: DatosNuevoContactoExterno): Promise<Contacto>;
  crearLead(datos: DatosNuevoLead): Promise<Lead>;
  /**
   * El upsert atómico de la captura externa (ver la garantía 1 arriba). Si ya hay
   * un lead NO borrado con ese `externalId`, devuelve ese con `creado: false` y
   * no inserta nada.
   */
  crearLeadExternoSiNoExiste(datos: DatosNuevoLeadExterno): Promise<{ lead: Lead; creado: boolean }>;
  reclamarDisponible(id: number, brokerId: number, actorId: number): Promise<Lead>;
  actualizarCalificacion(id: number, datos: import("./calificacion.ts").QualificationData, actorId: number): Promise<Lead>;
  asignarResponsable(id: number, brokerId: number, actorId: number): Promise<Lead>;
  marcarDescartado(id: number, motivo: string, actorId: number): Promise<Lead>;
  marcarConvertido(id: number, negocioId: number, actorId: number): Promise<Lead>;
  /** La primera etapa abierta del embudo por posición (nunca un id fijo: decisión #1). */
  primeraEtapaAbierta(): Promise<{ id: number } | undefined>;
  crearNegocioDeLead(datos: DatosNuevoNegocioDeLead): Promise<Negocio>;
  /** Escribe en `audit_log` con `userId: null` (ver la garantía 2 arriba). */
  registrarAuditoriaSinActor(registro: RegistroAuditoriaSinActor): Promise<void>;
}

/** El juego transaccional del módulo: lo que la unidad de trabajo entrega al caso de uso. */
export type ReposLeads = { leads: RepositorioLeads; auditoria: Auditoria };
