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
};

export interface RepositorioLeads {
  // --- lecturas previas a la transacción (avisos y validaciones) -----------

  /** Busca en TODA la cartera, sin filtrar por alcance (decisión #19). Es un aviso, no una garantía: `contacts` no tiene único en `phone`/`email`. */
  candidatosDuplicados(criterio: { phone: string | null; email: string | null }): Promise<CandidatoDuplicado[]>;
  /** `true` si el contacto existe y no está en la papelera. */
  contactoExiste(id: number): Promise<boolean>;
  /** Brokers activos con perfil, sin papelera. */
  candidatosBroker(): Promise<CandidatoBroker[]>;

  // --- lecturas y escrituras dentro de la transacción ----------------------

  /** Por id, SIN filtrar papelera ni alcance: el caso de uso decide con `deletedAt` y `reaches`. */
  buscarLead(id: number): Promise<Lead | undefined>;
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
