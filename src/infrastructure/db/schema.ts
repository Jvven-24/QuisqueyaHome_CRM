/**
 * Esquema de base de datos — CRM Quisqueya Home (Postgres / Supabase)
 *
 * Portado desde el esquema del prototipo (`referencia-prototipo/db/schema.ts`,
 * SQLite/D1) por decisión #12 de `docs/contexto/decisiones.md`. El modelado de
 * entidades no cambia; la sintaxis del ORM sí.
 *
 * Decisiones de modelado que este esquema implementa (no las cambies sin PR
 * propio — el esquema está congelado, ver `MAPEO_FRONTEND_CRM.md` §18.1):
 *
 *  1. Las etapas del pipeline son una tabla configurable, no un enum.
 *     `pipeline_stages.kind` distingue abierta / ganada / perdida, para que las
 *     reglas se enganchen al tipo y no a un nombre que el administrador puede
 *     renombrar.
 *  2. Los permisos son por recurso + acción + alcance de datos. Los roles son
 *     tabla, de modo que Marketing pueda existir sin tocar código.
 *  3. El alquiler se modela con `operation_type` y `price_period` sobre la
 *     unidad; la comisión se calcula sobre el monto que registra el negocio.
 *  4. Un negocio se relaciona con varias propiedades (`deal_properties`). La
 *     obligatoriedad a partir de Preselección se valida en el servidor.
 *  5. Sin `organization_id`: un solo negocio, sin red de agencias.
 *
 * Convenciones:
 *  - Identificadores en inglés; etiquetas visibles al usuario viven en la UI o
 *    en las tablas de catálogo editables.
 *  - Todo importe se guarda en centavos (`*_cents`) más su moneda. Nunca coma
 *    flotante para dinero. Se usa `bigint` y no `integer`: en centavos, un
 *    `integer` desborda a partir de US$21.4 millones.
 *  - Instantes en `timestamptz`; fechas sin hora en `date`. Todo se guarda en
 *    UTC y la conversión a `America/Santo_Domingo` ocurre en la aplicación.
 *  - Teléfonos normalizados a E.164 en `phone`, con el formato mostrado por el
 *    usuario conservado aparte en `phone_display`.
 *  - `deleted_at` marca papelera; las consultas deben filtrarlo siempre.
 *
 * Cambio de convención respecto al prototipo — fechas:
 *  El prototipo guardaba fechas como texto ISO-8601 porque el
 *  `CURRENT_TIMESTAMP` de SQLite escribe "2026-08-30 12:00:00" mientras la
 *  aplicación escribe "2026-08-30T12:00:00.000Z", y en texto el espacio ordena
 *  antes que la "T": mezclarlos rompía `ORDER BY` y los rangos por fecha sin
 *  dar error. Postgres no tiene ese problema y sí tiene tipos de fecha reales,
 *  que es lo que necesitan la próxima acción, las alertas de SLA, la agenda y
 *  los rangos de Reportes. La convención de fondo (UTC en base, conversión en
 *  aplicación) se conserva; solo cambia el tipo de columna.
 */

import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  date,
  index,
  integer,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import {
  STAGE_KINDS,
  PERMISSION_ACTIONS,
  PERMISSION_SCOPES,
  PERMISSION_RESOURCES,
  ENTITY_TYPES,
  LEAD_STATUSES,
  OPERATION_TYPES,
  PRICE_PERIODS,
  PROJECT_TYPES,
  UNIT_STATUSES,
  PHASE_STATUSES,
  BROKER_LEVELS,
  COMMISSION_STATUSES,
  ACTIVITY_TYPES,
  ACTIVITY_STATUSES,
  ACTIVITY_PRIORITIES,
  ACADEMY_ITEM_TYPES,
  FILE_VISIBILITIES,
  SYNC_STATUSES,
} from "../../domain/catalogs.ts";

export {
  STAGE_KINDS,
  PERMISSION_ACTIONS,
  PERMISSION_SCOPES,
  PERMISSION_RESOURCES,
  ENTITY_TYPES,
  LEAD_STATUSES,
  OPERATION_TYPES,
  PRICE_PERIODS,
  PROJECT_TYPES,
  UNIT_STATUSES,
  PHASE_STATUSES,
  BROKER_LEVELS,
  COMMISSION_STATUSES,
  ACTIVITY_TYPES,
  ACTIVITY_STATUSES,
  ACTIVITY_PRIORITIES,
  ACADEMY_ITEM_TYPES,
  FILE_VISIBILITIES,
  SYNC_STATUSES,
};
export type {
  PermissionResource,
  PermissionAction,
  PermissionScope,
  EntityType,
  StageKind,
} from "../../domain/catalogs.ts";

/* -------------------------------------------------------------------------- */
/* Columnas comunes                                                            */
/* -------------------------------------------------------------------------- */

/** Instante con zona. Postgres almacena en UTC; la app convierte a Santo Domingo. */
const instant = (name: string) =>
  timestamp(name, { withTimezone: true, mode: "date" });

const timestamps = {
  createdAt: instant("created_at").notNull().defaultNow(),
  /**
   * Postgres no actualiza solo la columna: sin `$onUpdate` (o un trigger) el
   * valor quedaría congelado en la fecha de creación. Se hace en el ORM para
   * que la regla viva en el mismo sitio que el esquema.
   */
  updatedAt: instant("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

/* -------------------------------------------------------------------------- */
/* Identidad, roles y permisos                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Roles del sistema. Se siembran `admin`, `assistant` y `broker`; `marketing`
 * queda previsto por los requisitos. `isProtected` replica el bloqueo del
 * administrador que ya existe en la matriz del frontend.
 */
export const roles = pgTable(
  "roles",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    isProtected: boolean("is_protected").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
  },
  (table) => [uniqueIndex("roles_slug_unq").on(table.slug)],
);

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    roleId: integer("role_id")
      .notNull()
      .references(() => roles.id),
    /**
     * Puente con Supabase Auth: `auth.users.id` es un UUID que vive en otro
     * esquema. El CRM autentica contra Supabase y resuelve el rol aquí. Nulo
     * mientras el usuario existe en el CRM pero aún no ha sido invitado.
     */
    authUserId: text("auth_user_id"),
    fullName: text("full_name").notNull(),
    email: text("email").notNull(),
    /** Sin uso: Supabase Auth guarda la credencial. Se conserva por el esquema congelado. */
    passwordHash: text("password_hash"),
    /** Iniciales mostradas en el avatar cuando no hay foto. */
    initials: text("initials"),
    /** Cargo mostrado bajo el nombre en el sidebar. */
    jobTitle: text("job_title"),
    phone: text("phone"),
    isActive: boolean("is_active").notNull().default(true),
    lastLoginAt: instant("last_login_at"),
    ...timestamps,
    deletedAt: instant("deleted_at"),
  },
  (table) => [
    /**
     * Parcial: con papelera, un índice único total impediría volver a dar de
     * alta a alguien cuyo usuario anterior fue eliminado. Mismo criterio en
     * `projects.slug`, `units(project_id, code)` y `leads.external_id`.
     */
    uniqueIndex("users_email_unq")
      .on(table.email)
      .where(sql`${table.deletedAt} is null`),
    uniqueIndex("users_auth_user_unq")
      .on(table.authUserId)
      .where(sql`${table.authUserId} is not null`),
    index("users_role_idx").on(table.roleId),
  ],
);

/** Autoría. Se declara después de `users` para poder referenciarla. */
const authorship = {
  createdBy: integer("created_by").references(() => users.id),
  updatedBy: integer("updated_by").references(() => users.id),
};

/**
 * Datos que solo aplican al rol broker: especialidad, nivel y meta.
 * `annualSalesCents` se recalcula desde los negocios ganados, no se captura.
 */
export const brokerProfiles = pgTable("broker_profiles", {
  userId: integer("user_id")
    .primaryKey()
    .references(() => users.id),
  /** Ej. "Proyectos en planos", "Alquileres". Dirige el enrutamiento por especialidad. */
  specialty: text("specialty"),
  handlesRentals: boolean("handles_rentals").notNull().default(false),
  level: text("level", { enum: BROKER_LEVELS }).notNull().default("junior"),
  annualSalesCents: bigint("annual_sales_cents", { mode: "number" })
    .notNull()
    .default(0),
  monthlyTargetDeals: integer("monthly_target_deals").notNull().default(0),
  ...timestamps,
});

/**
 * Permiso efectivo de un rol sobre un recurso. `scope` es lo que impide que un
 * broker vea la cartera ajena; `action` distingue ver de editar.
 */
export const permissions = pgTable(
  "permissions",
  {
    id: serial("id").primaryKey(),
    roleId: integer("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    resource: text("resource", { enum: PERMISSION_RESOURCES }).notNull(),
    action: text("action", { enum: PERMISSION_ACTIONS }).notNull(),
    scope: text("scope", { enum: PERMISSION_SCOPES }).notNull().default("none"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("permissions_role_resource_action_unq").on(
      table.roleId,
      table.resource,
      table.action,
    ),
  ],
);

/**
 * Sesiones activas del prototipo. **Sin uso en producción:** Supabase Auth
 * gestiona sesiones y refresh tokens, y "cerrar sesión remota" se resuelve con
 * su API. Se conserva la tabla porque el esquema está congelado.
 */
export const sessions = pgTable(
  "sessions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    expiresAt: instant("expires_at").notNull(),
    revokedAt: instant("revoked_at"),
    createdAt: instant("created_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("sessions_token_unq").on(table.tokenHash),
    index("sessions_user_idx").on(table.userId),
  ],
);

/* -------------------------------------------------------------------------- */
/* Catálogos editables                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Etapas del embudo. Se siembran las 6 de `stageOrder` con `kind="open"`
 * (salvo Cierre, que es `won`) más Perdido con `kind="lost"`.
 */
export const pipelineStages = pgTable(
  "pipeline_stages",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    position: integer("position").notNull(),
    kind: text("kind", { enum: STAGE_KINDS }).notNull().default("open"),
    /** Probabilidad sugerida al entrar en la etapa, para el pipeline ponderado. */
    defaultProbability: integer("default_probability"),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("pipeline_stages_slug_unq").on(table.slug),
    index("pipeline_stages_position_idx").on(table.position),
  ],
);

/** Motivos de pérdida. Obligatorio al mover un negocio a una etapa `lost`. */
export const lossReasons = pgTable(
  "loss_reasons",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    position: integer("position").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
  },
  (table) => [uniqueIndex("loss_reasons_slug_unq").on(table.slug)],
);

/**
 * Canales de captación. Tabla y no enum porque el reporte "Leads por canal" es
 * central y porque Meta Lead Ads entra en una fase posterior.
 */
export const leadSources = pgTable(
  "lead_sources",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    position: integer("position").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
  },
  (table) => [uniqueIndex("lead_sources_slug_unq").on(table.slug)],
);

/* -------------------------------------------------------------------------- */
/* Inventario                                                                  */
/* -------------------------------------------------------------------------- */

export const projects = pgTable(
  "projects",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    /** Punta Cana, Bávaro, Vista Cana, Cap Cana… Alimenta "Zonas calientes". */
    zone: text("zone"),
    projectType: text("project_type", { enum: PROJECT_TYPES })
      .notNull()
      .default("blueprint"),
    operationType: text("operation_type", { enum: OPERATION_TYPES })
      .notNull()
      .default("sale"),
    developer: text("developer"),
    description: text("description"),
    startDate: date("start_date", { mode: "string" }),
    estimatedDeliveryDate: date("estimated_delivery_date", { mode: "string" }),
    /** Avance de obra 0–100. Derivado de las fases, cacheado para listados. */
    progressPercent: integer("progress_percent").notNull().default(0),
    currency: text("currency").notNull().default("USD"),
    /** Precio interno real. Restringido al administrador por permisos. */
    internalPriceCents: bigint("internal_price_cents", { mode: "number" }),
    publicRangeMinCents: bigint("public_range_min_cents", { mode: "number" }),
    publicRangeMaxCents: bigint("public_range_max_cents", { mode: "number" }),
    brokerId: integer("broker_id").references(() => users.id),
    videoUrl: text("video_url"),
    /** Habilita la publicación del proyecto y sus avances al portal público. */
    isPublished: boolean("is_published").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
    ...authorship,
    deletedAt: instant("deleted_at"),
  },
  (table) => [
    uniqueIndex("projects_slug_unq")
      .on(table.slug)
      .where(sql`${table.deletedAt} is null`),
    index("projects_zone_idx").on(table.zone),
    index("projects_broker_idx").on(table.brokerId),
  ],
);

/**
 * Unidades del proyecto. El "12/40" del frontend se deriva contando aquí.
 * `operationType` y `pricePeriod` permiten que una unidad en alquiler conviva
 * con el inventario de venta sin un modelo aparte.
 */
export const units = pgTable(
  "units",
  {
    id: serial("id").primaryKey(),
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    unitType: text("unit_type"),
    bedrooms: integer("bedrooms"),
    /** Real porque el frontend muestra "2.5" baños. */
    bathrooms: real("bathrooms"),
    builtAreaM2: real("built_area_m2"),
    yardAreaM2: real("yard_area_m2"),
    floorLevel: integer("floor_level"),
    operationType: text("operation_type", { enum: OPERATION_TYPES })
      .notNull()
      .default("sale"),
    pricePeriod: text("price_period", { enum: PRICE_PERIODS })
      .notNull()
      .default("one_time"),
    currency: text("currency").notNull().default("USD"),
    /** Restringido por el permiso sobre el recurso `unit_real_price` (§10.4). */
    realPriceCents: bigint("real_price_cents", { mode: "number" }),
    publicRangeMinCents: bigint("public_range_min_cents", { mode: "number" }),
    publicRangeMaxCents: bigint("public_range_max_cents", { mode: "number" }),
    status: text("status", { enum: UNIT_STATUSES })
      .notNull()
      .default("available"),
    brokerId: integer("broker_id").references(() => users.id),
    internalNotes: text("internal_notes"),
    ...timestamps,
    ...authorship,
    deletedAt: instant("deleted_at"),
  },
  (table) => [
    uniqueIndex("units_project_code_unq")
      .on(table.projectId, table.code)
      .where(sql`${table.deletedAt} is null`),
    index("units_status_idx").on(table.status),
    index("units_broker_idx").on(table.brokerId),
  ],
);

/**
 * Fases de obra. El número es parametrizable por proyecto: el frontend fija 8,
 * pero cada constructora define las suyas.
 */
export const constructionPhases = pgTable(
  "construction_phases",
  {
    id: serial("id").primaryKey(),
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    title: text("title").notNull(),
    /** Ej. "Mes 6–9". Texto libre porque varía por constructora. */
    period: text("period"),
    status: text("status", { enum: PHASE_STATUSES })
      .notNull()
      .default("pending"),
    progressPercent: integer("progress_percent").notNull().default(0),
    statusDate: date("status_date", { mode: "string" }),
    videoUrl: text("video_url"),
    /** Lo que verá el comprador en el portal público. */
    publicNote: text("public_note"),
    responsibleId: integer("responsible_id").references(() => users.id),
    isPublished: boolean("is_published").notNull().default(false),
    publishedAt: instant("published_at"),
    ...timestamps,
    ...authorship,
  },
  (table) => [
    uniqueIndex("construction_phases_project_position_unq").on(
      table.projectId,
      table.position,
    ),
  ],
);

/* -------------------------------------------------------------------------- */
/* Contactos, leads y negocios                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Persona. Un contacto puede tener varios leads y varios negocios: es la
 * separación que el prototipo no hace.
 * El teléfono se indexa sin unicidad estricta para permitir importaciones y
 * resolver duplicados de forma explícita, no con un fallo de inserción.
 */
export const contacts = pgTable(
  "contacts",
  {
    id: serial("id").primaryKey(),
    fullName: text("full_name").notNull(),
    /** Normalizado a E.164, ej. "+18095550184". */
    phone: text("phone"),
    /** Tal como lo escribió el usuario, ej. "809-555-0184". */
    phoneDisplay: text("phone_display"),
    email: text("email"),
    country: text("country"),
    city: text("city"),
    sourceId: integer("source_id").references(() => leadSources.id),
    brokerId: integer("broker_id").references(() => users.id),
    notes: text("notes"),
    /** Cacheado desde `activities` para la columna "Última interacción". */
    lastInteractionAt: instant("last_interaction_at"),
    /** Consentimiento de contacto, exigido por la captura desde el portal. */
    consentAt: instant("consent_at"),
    consentSource: text("consent_source"),
    ...timestamps,
    ...authorship,
    deletedAt: instant("deleted_at"),
  },
  (table) => [
    index("contacts_phone_idx").on(table.phone),
    index("contacts_email_idx").on(table.email),
    index("contacts_broker_idx").on(table.brokerId),
  ],
);

/**
 * Solicitud entrante con su contexto de origen, antes de ser una oportunidad.
 * Conserva el video o campaña que la produjo, que es el diferenciador del
 * negocio y lo que alimenta la atribución en Reportes.
 */
export const leads = pgTable(
  "leads",
  {
    id: serial("id").primaryKey(),
    contactId: integer("contact_id")
      .notNull()
      .references(() => contacts.id),
    sourceId: integer("source_id").references(() => leadSources.id),
    /** Proyecto consultado. Puede no existir aún como registro. */
    projectId: integer("project_id").references(() => projects.id),
    projectInterestText: text("project_interest_text"),
    /** Zona de interés, necesaria para "Zonas calientes". */
    zoneInterest: text("zone_interest"),
    operationType: text("operation_type", { enum: OPERATION_TYPES }),
    currency: text("currency").notNull().default("USD"),
    budgetMinCents: bigint("budget_min_cents", { mode: "number" }),
    budgetMaxCents: bigint("budget_max_cents", { mode: "number" }),
    bedrooms: integer("bedrooms"),
    status: text("status", { enum: LEAD_STATUSES }).notNull().default("new"),
    brokerId: integer("broker_id").references(() => users.id),
    /** Broker propuesto por la regla de especialidad, aún sin aceptar. */
    suggestedBrokerId: integer("suggested_broker_id").references(
      () => users.id,
    ),
    /** Contexto de origen: video de YouTube, campaña, UTM y mensaje original. */
    sourceVideoUrl: text("source_video_url"),
    campaign: text("campaign"),
    utmSource: text("utm_source"),
    utmMedium: text("utm_medium"),
    utmCampaign: text("utm_campaign"),
    originalMessage: text("original_message"),
    /** Idempotencia de la captura desde portal o webhooks externos. */
    externalId: text("external_id"),
    receivedAt: instant("received_at").notNull().defaultNow(),
    firstContactedAt: instant("first_contacted_at"),
    /** Sin FK a propósito: evita el ciclo `leads` → `deals` → `leads` (decisión #8). */
    convertedDealId: integer("converted_deal_id"),
    discardReason: text("discard_reason"),
    ...timestamps,
    ...authorship,
    deletedAt: instant("deleted_at"),
  },
  (table) => [
    uniqueIndex("leads_external_id_unq")
      .on(table.externalId)
      .where(sql`${table.deletedAt} is null`),
    index("leads_contact_idx").on(table.contactId),
    index("leads_status_idx").on(table.status),
    index("leads_broker_idx").on(table.brokerId),
    index("leads_received_idx").on(table.receivedAt),
  ],
);

/**
 * Oportunidad comercial. Es el centro del CRM.
 * `probability` y `expectedCloseDate` existen porque el reporte de proyección
 * ponderada los necesita, aunque el prototipo todavía no los capture.
 */
export const deals = pgTable(
  "deals",
  {
    id: serial("id").primaryKey(),
    contactId: integer("contact_id")
      .notNull()
      .references(() => contacts.id),
    leadId: integer("lead_id").references(() => leads.id),
    title: text("title"),
    stageId: integer("stage_id")
      .notNull()
      .references(() => pipelineStages.id),
    sourceId: integer("source_id").references(() => leadSources.id),
    brokerId: integer("broker_id").references(() => users.id),
    operationType: text("operation_type", { enum: OPERATION_TYPES })
      .notNull()
      .default("sale"),
    currency: text("currency").notNull().default("USD"),
    /** Monto sobre el que se calcula la comisión. En alquiler, el pactado. */
    amountCents: bigint("amount_cents", { mode: "number" }),
    probability: integer("probability"),
    /** Puntos básicos: 450 = 4,5 %. Entero, para no meter coma flotante en el cálculo de dinero. */
    commissionBasisPoints: integer("commission_basis_points"),
    expectedCloseDate: date("expected_close_date", { mode: "string" }),
    /** Actividad abierta que representa la próxima acción obligatoria. Sin FK: ciclo (decisión #8). */
    nextActivityId: integer("next_activity_id"),
    stageChangedAt: instant("stage_changed_at"),
    closedAt: instant("closed_at"),
    lossReasonId: integer("loss_reason_id").references(() => lossReasons.id),
    lossComment: text("loss_comment"),
    notes: text("notes"),
    ...timestamps,
    ...authorship,
    deletedAt: instant("deleted_at"),
  },
  (table) => [
    index("deals_contact_idx").on(table.contactId),
    index("deals_stage_idx").on(table.stageId),
    index("deals_broker_idx").on(table.brokerId),
    index("deals_closed_idx").on(table.closedAt),
  ],
);

/**
 * Propiedades de interés del negocio. Varias unidades por negocio: el caso real
 * es presentar dos opciones al mismo cliente antes de preseleccionar.
 */
export const dealProperties = pgTable(
  "deal_properties",
  {
    id: serial("id").primaryKey(),
    dealId: integer("deal_id")
      .notNull()
      .references(() => deals.id, { onDelete: "cascade" }),
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id),
    /** Nulo mientras el interés es a nivel de proyecto y no de unidad. */
    unitId: integer("unit_id").references(() => units.id),
    isPrimary: boolean("is_primary").notNull().default(false),
    createdAt: instant("created_at").notNull().defaultNow(),
    createdBy: integer("created_by").references(() => users.id),
  },
  (table) => [
    uniqueIndex("deal_properties_deal_unit_unq").on(table.dealId, table.unitId),
    /**
     * Postgres, como SQLite, considera cada NULL distinto en un índice único,
     * así que el índice anterior no impide repetir un proyecto sin unidad.
     * Este parcial cubre ese caso.
     */
    uniqueIndex("deal_properties_deal_project_unq")
      .on(table.dealId, table.projectId)
      .where(sql`${table.unitId} is null`),
    index("deal_properties_project_idx").on(table.projectId),
  ],
);

/**
 * Historial de etapas. Tabla propia y no `audit_log` porque los reportes de
 * conversión y de días promedio por etapa se consultan con frecuencia.
 */
export const dealStageHistory = pgTable(
  "deal_stage_history",
  {
    id: serial("id").primaryKey(),
    dealId: integer("deal_id")
      .notNull()
      .references(() => deals.id, { onDelete: "cascade" }),
    fromStageId: integer("from_stage_id").references(() => pipelineStages.id),
    toStageId: integer("to_stage_id")
      .notNull()
      .references(() => pipelineStages.id),
    changedBy: integer("changed_by").references(() => users.id),
    changedAt: instant("changed_at").notNull().defaultNow(),
  },
  (table) => [index("deal_stage_history_deal_idx").on(table.dealId)],
);

/* -------------------------------------------------------------------------- */
/* Actividades                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Unifica tareas, llamadas, citas y notas, que en el prototipo son estructuras
 * separadas y sin vínculo a ningún registro. Es la base de la próxima acción,
 * de la agenda y del historial del contacto.
 */
export const activities = pgTable(
  "activities",
  {
    id: serial("id").primaryKey(),
    activityType: text("activity_type", { enum: ACTIVITY_TYPES }).notNull(),
    title: text("title").notNull(),
    description: text("description"),
    contactId: integer("contact_id").references(() => contacts.id),
    dealId: integer("deal_id").references(() => deals.id),
    projectId: integer("project_id").references(() => projects.id),
    assigneeId: integer("assignee_id").references(() => users.id),
    startsAt: instant("starts_at"),
    endsAt: instant("ends_at"),
    isAllDay: boolean("is_all_day").notNull().default(false),
    location: text("location"),
    meetingUrl: text("meeting_url"),
    status: text("status", { enum: ACTIVITY_STATUSES })
      .notNull()
      .default("pending"),
    priority: text("priority", { enum: ACTIVITY_PRIORITIES })
      .notNull()
      .default("normal"),
    completedAt: instant("completed_at"),
    ...timestamps,
    ...authorship,
    deletedAt: instant("deleted_at"),
  },
  (table) => [
    index("activities_contact_idx").on(table.contactId),
    index("activities_deal_idx").on(table.dealId),
    index("activities_assignee_idx").on(table.assigneeId),
    index("activities_starts_idx").on(table.startsAt),
    index("activities_status_idx").on(table.status),
  ],
);

/**
 * Vínculo con calendarios externos. `externalEventId` evita duplicar eventos al
 * sincronizar, tal como ya anticipa el UID que genera el export `.ics`.
 */
export const activitySync = pgTable(
  "activity_sync",
  {
    id: serial("id").primaryKey(),
    activityId: integer("activity_id")
      .notNull()
      .references(() => activities.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    externalEventId: text("external_event_id"),
    externalCalendarId: text("external_calendar_id"),
    syncStatus: text("sync_status", { enum: SYNC_STATUSES })
      .notNull()
      .default("pending"),
    lastSyncedAt: instant("last_synced_at"),
    lastError: text("last_error"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("activity_sync_provider_event_unq").on(
      table.provider,
      table.externalEventId,
    ),
    index("activity_sync_activity_idx").on(table.activityId),
  ],
);

/* -------------------------------------------------------------------------- */
/* Metas y comisiones                                                          */
/* -------------------------------------------------------------------------- */

/** `brokerId` nulo representa la meta global del negocio (10 negocios/mes). */
export const goals = pgTable(
  "goals",
  {
    id: serial("id").primaryKey(),
    brokerId: integer("broker_id").references(() => users.id),
    year: integer("year").notNull(),
    month: integer("month").notNull(),
    targetDeals: integer("target_deals").notNull().default(0),
    targetAmountCents: bigint("target_amount_cents", { mode: "number" }),
    /** Se actualizan al cerrar un negocio, en la misma transacción (§10.2). */
    achievedDeals: integer("achieved_deals").notNull().default(0),
    achievedAmountCents: bigint("achieved_amount_cents", { mode: "number" })
      .notNull()
      .default(0),
    currency: text("currency").notNull().default("USD"),
    ...timestamps,
    ...authorship,
  },
  (table) => [
    uniqueIndex("goals_broker_period_unq").on(
      table.brokerId,
      table.year,
      table.month,
    ),
    /** Una sola meta global por periodo, pese al `broker_id` nulo. */
    uniqueIndex("goals_company_period_unq")
      .on(table.year, table.month)
      .where(sql`${table.brokerId} is null`),
  ],
);

/**
 * Comisión interna del negocio ganado. Sin reparto con agencias externas: el
 * cliente excluyó explícitamente el modelo de colaboración.
 */
export const commissions = pgTable(
  "commissions",
  {
    id: serial("id").primaryKey(),
    dealId: integer("deal_id")
      .notNull()
      .references(() => deals.id),
    brokerId: integer("broker_id").references(() => users.id),
    currency: text("currency").notNull().default("USD"),
    saleAmountCents: bigint("sale_amount_cents", { mode: "number" }).notNull(),
    /** Puntos básicos: 450 = 4,5 %. La comisión es dinero que se le paga a una persona;
     *  un porcentaje en coma flotante arrastra error de redondeo y produce disputas. */
    commissionBasisPoints: integer("commission_basis_points").notNull(),
    totalCommissionCents: bigint("total_commission_cents", {
      mode: "number",
    }).notNull(),
    /** Reparto interno en puntos básicos, ej. 5000/5000 o 6000/4000. Deben sumar 10000. */
    brokerShareBasisPoints: integer("broker_share_basis_points")
      .notNull()
      .default(5000),
    agencyShareBasisPoints: integer("agency_share_basis_points")
      .notNull()
      .default(5000),
    brokerAmountCents: bigint("broker_amount_cents", { mode: "number" })
      .notNull()
      .default(0),
    agencyAmountCents: bigint("agency_amount_cents", { mode: "number" })
      .notNull()
      .default(0),
    status: text("status", { enum: COMMISSION_STATUSES })
      .notNull()
      .default("pending"),
    closedDate: date("closed_date", { mode: "string" }),
    approvedBy: integer("approved_by").references(() => users.id),
    approvedAt: instant("approved_at"),
    paidAt: instant("paid_at"),
    ...timestamps,
    ...authorship,
  },
  (table) => [
    uniqueIndex("commissions_deal_unq").on(table.dealId),
    index("commissions_broker_idx").on(table.brokerId),
    index("commissions_status_idx").on(table.status),
  ],
);

/* -------------------------------------------------------------------------- */
/* Academy                                                                     */
/* -------------------------------------------------------------------------- */

export const academyItems = pgTable("academy_items", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  itemType: text("item_type", { enum: ACADEMY_ITEM_TYPES }).notNull(),
  description: text("description"),
  durationMinutes: integer("duration_minutes"),
  videoUrl: text("video_url"),
  position: integer("position").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  publishedAt: instant("published_at"),
  ...timestamps,
  ...authorship,
});

export const academyChecklistItems = pgTable(
  "academy_checklist_items",
  {
    id: serial("id").primaryKey(),
    academyItemId: integer("academy_item_id")
      .notNull()
      .references(() => academyItems.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    label: text("label").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("academy_checklist_items_position_unq").on(
      table.academyItemId,
      table.position,
    ),
  ],
);

export const academyProgress = pgTable(
  "academy_progress",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    academyItemId: integer("academy_item_id")
      .notNull()
      .references(() => academyItems.id, { onDelete: "cascade" }),
    progressPercent: integer("progress_percent").notNull().default(0),
    isCompleted: boolean("is_completed").notNull().default(false),
    completedAt: instant("completed_at"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("academy_progress_user_item_unq").on(
      table.userId,
      table.academyItemId,
    ),
  ],
);

export const academyChecklistProgress = pgTable(
  "academy_checklist_progress",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    checklistItemId: integer("checklist_item_id")
      .notNull()
      .references(() => academyChecklistItems.id, { onDelete: "cascade" }),
    isCompleted: boolean("is_completed").notNull().default(false),
    completedAt: instant("completed_at"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("academy_checklist_progress_user_item_unq").on(
      table.userId,
      table.checklistItemId,
    ),
  ],
);

/* -------------------------------------------------------------------------- */
/* Comunicaciones, archivos y operación                                        */
/* -------------------------------------------------------------------------- */

/** Plantillas con marcadores `{nombre}` y `{proyecto}`, como en el editor actual. */
export const messageTemplates = pgTable("message_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category"),
  channel: text("channel").notNull().default("whatsapp"),
  body: text("body").notNull(),
  /** JSON con los nombres de variable admitidos. */
  variables: text("variables"),
  isActive: boolean("is_active").notNull().default(true),
  ...timestamps,
  ...authorship,
});

/** Archivos de cualquier entidad: fotos de obra, documentos, brochures. */
export const files = pgTable(
  "files",
  {
    id: serial("id").primaryKey(),
    entityType: text("entity_type", { enum: ENTITY_TYPES }).notNull(),
    entityId: integer("entity_id").notNull(),
    fileType: text("file_type"),
    name: text("name").notNull(),
    url: text("url").notNull(),
    mimeType: text("mime_type"),
    sizeBytes: bigint("size_bytes", { mode: "number" }),
    visibility: text("visibility", { enum: FILE_VISIBILITIES })
      .notNull()
      .default("internal"),
    position: integer("position").notNull().default(0),
    uploadedBy: integer("uploaded_by").references(() => users.id),
    createdAt: instant("created_at").notNull().defaultNow(),
    deletedAt: instant("deleted_at"),
  },
  (table) => [index("files_entity_idx").on(table.entityType, table.entityId)],
);

export const notifications = pgTable(
  "notifications",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    notificationType: text("notification_type").notNull(),
    title: text("title").notNull(),
    body: text("body"),
    entityType: text("entity_type", { enum: ENTITY_TYPES }),
    entityId: integer("entity_id"),
    isRead: boolean("is_read").notNull().default(false),
    readAt: instant("read_at"),
    createdAt: instant("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("notifications_user_read_idx").on(table.userId, table.isRead),
  ],
);

/**
 * Cuentas de integración. Los tokens se guardan cifrados en servidor: la propia
 * interfaz advierte que no se almacenarán en el navegador.
 */
export const integrationAccounts = pgTable(
  "integration_accounts",
  {
    id: serial("id").primaryKey(),
    provider: text("provider").notNull(),
    userId: integer("user_id").references(() => users.id),
    status: text("status").notNull().default("disconnected"),
    externalAccountId: text("external_account_id"),
    encryptedCredentials: text("encrypted_credentials"),
    scopes: text("scopes"),
    lastSyncedAt: instant("last_synced_at"),
    lastError: text("last_error"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("integration_accounts_provider_user_unq").on(
      table.provider,
      table.userId,
    ),
    /** Integraciones a nivel de cuenta (sin usuario): una por proveedor. */
    uniqueIndex("integration_accounts_provider_unq")
      .on(table.provider)
      .where(sql`${table.userId} is null`),
  ],
);

/** Registro de acciones sensibles: quién cambió qué y cuándo. */
export const auditLog = pgTable(
  "audit_log",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id),
    action: text("action").notNull(),
    entityType: text("entity_type", { enum: ENTITY_TYPES }).notNull(),
    entityId: integer("entity_id"),
    /** JSON con el estado antes y después, para la vista de comparación. */
    previousValue: text("previous_value"),
    newValue: text("new_value"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: instant("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("audit_log_entity_idx").on(table.entityType, table.entityId),
    index("audit_log_user_idx").on(table.userId),
    index("audit_log_created_idx").on(table.createdAt),
  ],
);
