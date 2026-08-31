/**
 * Esquema de base de datos — CRM Quisqueya Home
 *
 * Derivado de MAPEO_FRONTEND_CRM.md (mapeo de `app/page.tsx`) y de las
 * decisiones acordadas antes de escribirlo:
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
 *  - Todo importe se guarda en centavos (`*_cents`, entero) más su moneda.
 *    Nunca coma flotante para dinero.
 *  - Fechas y horas en texto ISO 8601 UTC. La operación es
 *    `America/Santo_Domingo`; la conversión ocurre en la capa de aplicación.
 *  - Teléfonos normalizados a E.164 en `phone`, con el formato mostrado por el
 *    usuario conservado aparte en `phone_display`.
 *  - `deleted_at` marca papelera; las consultas deben filtrarlo siempre.
 */

import { sql } from "drizzle-orm";
import {
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

/* -------------------------------------------------------------------------- */
/* Catálogos cerrados                                                          */
/* -------------------------------------------------------------------------- */

/** Naturaleza de una etapa. Las reglas de negocio dependen de esto, no del nombre. */
export const STAGE_KINDS = ["open", "won", "lost"] as const;

/** Acciones sobre un recurso, según la pantalla de permisos diseñada en Figma. */
export const PERMISSION_ACTIONS = [
  "view",
  "create",
  "edit",
  "delete",
  "import",
  "export",
] as const;

/** Alcance de datos. `own` es lo que hoy el frontend finge comparando nombres. */
export const PERMISSION_SCOPES = ["none", "own", "team", "all"] as const;

/**
 * Recursos sobre los que se conceden permisos. Lista cerrada a propósito: con
 * varias personas construyendo módulos en paralelo, un `"Leads"` frente a un
 * `"leads"` haría que un permiso deje de aplicarse sin que nadie lo note.
 */
export const PERMISSION_RESOURCES = [
  "dashboard",
  "leads",
  "contacts",
  "deals",
  "activities",
  "projects",
  "units",
  "unit_real_price",
  "construction_phases",
  "brokers",
  "academy",
  "goals",
  "commissions",
  "communications",
  "reports",
  "global_metrics",
  "settings",
  "users",
  "roles",
  "audit_log",
  "integrations",
] as const;

/** Entidades referenciables desde tablas polimórficas (archivos, avisos, auditoría). */
export const ENTITY_TYPES = [
  "contact",
  "lead",
  "deal",
  "activity",
  "project",
  "unit",
  "construction_phase",
  "user",
  "role",
  "permission",
  "commission",
  "goal",
  "academy_item",
  "message_template",
  "integration_account",
  "file",
] as const;

/** Estado del lead antes de convertirse en negocio. */
export const LEAD_STATUSES = [
  "new",
  "assigned",
  "contacted",
  "converted",
  "discarded",
] as const;

export const OPERATION_TYPES = ["sale", "rent"] as const;

/** Un precio de venta es único; uno de alquiler es mensual. */
export const PRICE_PERIODS = ["one_time", "monthly"] as const;

export const PROJECT_TYPES = [
  "blueprint",
  "presale",
  "under_construction",
  "delivered",
  "rental",
] as const;

export const UNIT_STATUSES = [
  "available",
  "reserved",
  "sold",
  "unavailable",
] as const;

export const PHASE_STATUSES = [
  "pending",
  "in_progress",
  "completed",
  "delayed",
] as const;

export const BROKER_LEVELS = [
  "junior",
  "senior",
  "senior_plus",
  "top_producer",
  "top_leader",
] as const;

export const COMMISSION_STATUSES = [
  "pending",
  "approved",
  "paid",
  "void",
] as const;

export const ACTIVITY_TYPES = [
  "task",
  "call",
  "meeting",
  "note",
  "whatsapp",
  "email",
] as const;

export const ACTIVITY_STATUSES = ["pending", "completed", "cancelled"] as const;

export const ACTIVITY_PRIORITIES = ["low", "normal", "high"] as const;

export const ACADEMY_ITEM_TYPES = ["session", "checklist", "material"] as const;

export const FILE_VISIBILITIES = ["internal", "public"] as const;

export const SYNC_STATUSES = ["pending", "synced", "failed"] as const;

/* -------------------------------------------------------------------------- */
/* Columnas comunes                                                            */
/* -------------------------------------------------------------------------- */

/**
 * SQLite escribe `CURRENT_TIMESTAMP` como "YYYY-MM-DD HH:MM:SS", mientras que la
 * aplicación escribe ISO-8601 ("…T…Z"). Los dos formatos NO ordenan igual: el
 * espacio va antes que la "T" en orden de texto, así que mezclarlos rompe
 * `ORDER BY` y los filtros por rango de fechas de forma silenciosa.
 * Forzamos ISO-8601 UTC en toda la base.
 */
const nowIso = sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`;

const timestamps = {
  createdAt: text("created_at").notNull().default(nowIso),
  /** SQLite no tiene ON UPDATE: sin `$onUpdate` este valor quedaría congelado. */
  updatedAt: text("updated_at")
    .notNull()
    .default(nowIso)
    .$onUpdate(() => new Date().toISOString()),
};

/* -------------------------------------------------------------------------- */
/* Identidad, roles y permisos                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Roles del sistema. Se siembran `admin`, `assistant` y `broker`; `marketing`
 * queda previsto por los requisitos. `isProtected` replica el bloqueo del
 * administrador que ya existe en la matriz del frontend.
 */
export const roles = sqliteTable(
  "roles",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    isProtected: integer("is_protected", { mode: "boolean" })
      .notNull()
      .default(false),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    ...timestamps,
  },
  (table) => [uniqueIndex("roles_slug_unq").on(table.slug)],
);

export const users = sqliteTable(
  "users",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    roleId: integer("role_id")
      .notNull()
      .references(() => roles.id),
    fullName: text("full_name").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash"),
    /** Iniciales mostradas en el avatar cuando no hay foto. */
    initials: text("initials"),
    /** Cargo mostrado bajo el nombre en el sidebar. */
    jobTitle: text("job_title"),
    phone: text("phone"),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    lastLoginAt: text("last_login_at"),
    ...timestamps,
    deletedAt: text("deleted_at"),
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
export const brokerProfiles = sqliteTable(
  "broker_profiles",
  {
    userId: integer("user_id")
      .primaryKey()
      .references(() => users.id),
    /** Ej. "Proyectos en planos", "Alquileres". Dirige el enrutamiento por especialidad. */
    specialty: text("specialty"),
    handlesRentals: integer("handles_rentals", { mode: "boolean" })
      .notNull()
      .default(false),
    level: text("level", { enum: BROKER_LEVELS }).notNull().default("junior"),
    annualSalesCents: integer("annual_sales_cents").notNull().default(0),
    monthlyTargetDeals: integer("monthly_target_deals").notNull().default(0),
    ...timestamps,
  },
);

/**
 * Permiso efectivo de un rol sobre un recurso. `scope` es lo que impide que un
 * broker vea la cartera ajena; `action` distingue ver de editar.
 */
export const permissions = sqliteTable(
  "permissions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
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

/** Sesiones activas. Requeridas por login real y por "cerrar sesión remota". */
export const sessions = sqliteTable(
  "sessions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    expiresAt: text("expires_at").notNull(),
    revokedAt: text("revoked_at"),
    createdAt: text("created_at").notNull().default(nowIso),
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
export const pipelineStages = sqliteTable(
  "pipeline_stages",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    position: integer("position").notNull(),
    kind: text("kind", { enum: STAGE_KINDS }).notNull().default("open"),
    /** Probabilidad sugerida al entrar en la etapa, para el pipeline ponderado. */
    defaultProbability: integer("default_probability"),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("pipeline_stages_slug_unq").on(table.slug),
    index("pipeline_stages_position_idx").on(table.position),
  ],
);

/** Motivos de pérdida. Obligatorio al mover un negocio a una etapa `lost`. */
export const lossReasons = sqliteTable(
  "loss_reasons",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    position: integer("position").notNull().default(0),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    ...timestamps,
  },
  (table) => [uniqueIndex("loss_reasons_slug_unq").on(table.slug)],
);

/**
 * Canales de captación. Tabla y no enum porque el reporte "Leads por canal" es
 * central y porque Meta Lead Ads entra en una fase posterior.
 */
export const leadSources = sqliteTable(
  "lead_sources",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    position: integer("position").notNull().default(0),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    ...timestamps,
  },
  (table) => [uniqueIndex("lead_sources_slug_unq").on(table.slug)],
);

/* -------------------------------------------------------------------------- */
/* Inventario                                                                  */
/* -------------------------------------------------------------------------- */

export const projects = sqliteTable(
  "projects",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
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
    startDate: text("start_date"),
    estimatedDeliveryDate: text("estimated_delivery_date"),
    /** Avance de obra 0–100. Derivado de las fases, cacheado para listados. */
    progressPercent: integer("progress_percent").notNull().default(0),
    currency: text("currency").notNull().default("USD"),
    /** Precio interno real. Restringido al administrador por permisos. */
    internalPriceCents: integer("internal_price_cents"),
    publicRangeMinCents: integer("public_range_min_cents"),
    publicRangeMaxCents: integer("public_range_max_cents"),
    brokerId: integer("broker_id").references(() => users.id),
    videoUrl: text("video_url"),
    /** Habilita la publicación del proyecto y sus avances al portal público. */
    isPublished: integer("is_published", { mode: "boolean" })
      .notNull()
      .default(false),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    ...timestamps,
    ...authorship,
    deletedAt: text("deleted_at"),
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
export const units = sqliteTable(
  "units",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
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
    realPriceCents: integer("real_price_cents"),
    publicRangeMinCents: integer("public_range_min_cents"),
    publicRangeMaxCents: integer("public_range_max_cents"),
    status: text("status", { enum: UNIT_STATUSES })
      .notNull()
      .default("available"),
    brokerId: integer("broker_id").references(() => users.id),
    internalNotes: text("internal_notes"),
    ...timestamps,
    ...authorship,
    deletedAt: text("deleted_at"),
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
export const constructionPhases = sqliteTable(
  "construction_phases",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
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
    statusDate: text("status_date"),
    videoUrl: text("video_url"),
    /** Lo que verá el comprador en el portal público. */
    publicNote: text("public_note"),
    responsibleId: integer("responsible_id").references(() => users.id),
    isPublished: integer("is_published", { mode: "boolean" })
      .notNull()
      .default(false),
    publishedAt: text("published_at"),
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
 * separación que el frontend actual no hace.
 * El teléfono se indexa sin unicidad estricta para permitir importaciones y
 * resolver duplicados de forma explícita, no con un fallo de inserción.
 */
export const contacts = sqliteTable(
  "contacts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
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
    lastInteractionAt: text("last_interaction_at"),
    /** Consentimiento de contacto, exigido por la captura desde el portal. */
    consentAt: text("consent_at"),
    consentSource: text("consent_source"),
    ...timestamps,
    ...authorship,
    deletedAt: text("deleted_at"),
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
export const leads = sqliteTable(
  "leads",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
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
    budgetMinCents: integer("budget_min_cents"),
    budgetMaxCents: integer("budget_max_cents"),
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
    receivedAt: text("received_at").notNull().default(nowIso),
    firstContactedAt: text("first_contacted_at"),
    convertedDealId: integer("converted_deal_id"),
    discardReason: text("discard_reason"),
    ...timestamps,
    ...authorship,
    deletedAt: text("deleted_at"),
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
 * ponderada los necesita, aunque el frontend actual todavía no los capture.
 */
export const deals = sqliteTable(
  "deals",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
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
    amountCents: integer("amount_cents"),
    probability: integer("probability"),
    /** Puntos básicos: 450 = 4,5 %. Entero, para no meter coma flotante en el cálculo de dinero. */
    commissionBasisPoints: integer("commission_basis_points"),
    expectedCloseDate: text("expected_close_date"),
    /** Actividad abierta que representa la próxima acción obligatoria. */
    nextActivityId: integer("next_activity_id"),
    stageChangedAt: text("stage_changed_at"),
    closedAt: text("closed_at"),
    lossReasonId: integer("loss_reason_id").references(() => lossReasons.id),
    lossComment: text("loss_comment"),
    notes: text("notes"),
    ...timestamps,
    ...authorship,
    deletedAt: text("deleted_at"),
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
export const dealProperties = sqliteTable(
  "deal_properties",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    dealId: integer("deal_id")
      .notNull()
      .references(() => deals.id, { onDelete: "cascade" }),
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id),
    /** Nulo mientras el interés es a nivel de proyecto y no de unidad. */
    unitId: integer("unit_id").references(() => units.id),
    isPrimary: integer("is_primary", { mode: "boolean" })
      .notNull()
      .default(false),
    createdAt: text("created_at").notNull().default(nowIso),
    createdBy: integer("created_by").references(() => users.id),
  },
  (table) => [
    uniqueIndex("deal_properties_deal_unit_unq").on(table.dealId, table.unitId),
    /**
     * SQLite considera cada NULL distinto, así que el índice anterior no impide
     * repetir un proyecto sin unidad. Este parcial cubre ese caso.
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
export const dealStageHistory = sqliteTable(
  "deal_stage_history",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    dealId: integer("deal_id")
      .notNull()
      .references(() => deals.id, { onDelete: "cascade" }),
    fromStageId: integer("from_stage_id").references(() => pipelineStages.id),
    toStageId: integer("to_stage_id")
      .notNull()
      .references(() => pipelineStages.id),
    changedBy: integer("changed_by").references(() => users.id),
    changedAt: text("changed_at").notNull().default(nowIso),
  },
  (table) => [index("deal_stage_history_deal_idx").on(table.dealId)],
);

/* -------------------------------------------------------------------------- */
/* Actividades                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Unifica tareas, llamadas, citas y notas, que en el frontend son estructuras
 * separadas y sin vínculo a ningún registro. Es la base de la próxima acción,
 * de la agenda y del historial del contacto.
 */
export const activities = sqliteTable(
  "activities",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    activityType: text("activity_type", { enum: ACTIVITY_TYPES }).notNull(),
    title: text("title").notNull(),
    description: text("description"),
    contactId: integer("contact_id").references(() => contacts.id),
    dealId: integer("deal_id").references(() => deals.id),
    projectId: integer("project_id").references(() => projects.id),
    assigneeId: integer("assignee_id").references(() => users.id),
    startsAt: text("starts_at"),
    endsAt: text("ends_at"),
    isAllDay: integer("is_all_day", { mode: "boolean" })
      .notNull()
      .default(false),
    location: text("location"),
    meetingUrl: text("meeting_url"),
    status: text("status", { enum: ACTIVITY_STATUSES })
      .notNull()
      .default("pending"),
    priority: text("priority", { enum: ACTIVITY_PRIORITIES })
      .notNull()
      .default("normal"),
    completedAt: text("completed_at"),
    ...timestamps,
    ...authorship,
    deletedAt: text("deleted_at"),
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
export const activitySync = sqliteTable(
  "activity_sync",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    activityId: integer("activity_id")
      .notNull()
      .references(() => activities.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    externalEventId: text("external_event_id"),
    externalCalendarId: text("external_calendar_id"),
    syncStatus: text("sync_status", { enum: SYNC_STATUSES })
      .notNull()
      .default("pending"),
    lastSyncedAt: text("last_synced_at"),
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
export const goals = sqliteTable(
  "goals",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    brokerId: integer("broker_id").references(() => users.id),
    year: integer("year").notNull(),
    month: integer("month").notNull(),
    targetDeals: integer("target_deals").notNull().default(0),
    targetAmountCents: integer("target_amount_cents"),
    /** Se actualizan al cerrar un negocio, en la misma transacción. */
    achievedDeals: integer("achieved_deals").notNull().default(0),
    achievedAmountCents: integer("achieved_amount_cents").notNull().default(0),
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
export const commissions = sqliteTable(
  "commissions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    dealId: integer("deal_id")
      .notNull()
      .references(() => deals.id),
    brokerId: integer("broker_id").references(() => users.id),
    currency: text("currency").notNull().default("USD"),
    saleAmountCents: integer("sale_amount_cents").notNull(),
    /** Puntos básicos: 450 = 4,5 %. La comisión es dinero que se le paga a una persona;
     *  un porcentaje en coma flotante arrastra error de redondeo y produce disputas. */
    commissionBasisPoints: integer("commission_basis_points").notNull(),
    totalCommissionCents: integer("total_commission_cents").notNull(),
    /** Reparto interno en puntos básicos, ej. 5000/5000 o 6000/4000. Deben sumar 10000. */
    brokerShareBasisPoints: integer("broker_share_basis_points")
      .notNull()
      .default(5000),
    agencyShareBasisPoints: integer("agency_share_basis_points")
      .notNull()
      .default(5000),
    brokerAmountCents: integer("broker_amount_cents").notNull().default(0),
    agencyAmountCents: integer("agency_amount_cents").notNull().default(0),
    status: text("status", { enum: COMMISSION_STATUSES })
      .notNull()
      .default("pending"),
    closedDate: text("closed_date"),
    approvedBy: integer("approved_by").references(() => users.id),
    approvedAt: text("approved_at"),
    paidAt: text("paid_at"),
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

export const academyItems = sqliteTable(
  "academy_items",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    itemType: text("item_type", { enum: ACADEMY_ITEM_TYPES }).notNull(),
    description: text("description"),
    durationMinutes: integer("duration_minutes"),
    videoUrl: text("video_url"),
    position: integer("position").notNull().default(0),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    publishedAt: text("published_at"),
    ...timestamps,
    ...authorship,
  },
);

export const academyChecklistItems = sqliteTable(
  "academy_checklist_items",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
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

export const academyProgress = sqliteTable(
  "academy_progress",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    academyItemId: integer("academy_item_id")
      .notNull()
      .references(() => academyItems.id, { onDelete: "cascade" }),
    progressPercent: integer("progress_percent").notNull().default(0),
    isCompleted: integer("is_completed", { mode: "boolean" })
      .notNull()
      .default(false),
    completedAt: text("completed_at"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("academy_progress_user_item_unq").on(
      table.userId,
      table.academyItemId,
    ),
  ],
);

export const academyChecklistProgress = sqliteTable(
  "academy_checklist_progress",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    checklistItemId: integer("checklist_item_id")
      .notNull()
      .references(() => academyChecklistItems.id, { onDelete: "cascade" }),
    isCompleted: integer("is_completed", { mode: "boolean" })
      .notNull()
      .default(false),
    completedAt: text("completed_at"),
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
export const messageTemplates = sqliteTable(
  "message_templates",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    category: text("category"),
    channel: text("channel").notNull().default("whatsapp"),
    body: text("body").notNull(),
    /** JSON con los nombres de variable admitidos. */
    variables: text("variables"),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    ...timestamps,
    ...authorship,
  },
);

/** Archivos de cualquier entidad: fotos de obra, documentos, brochures. */
export const files = sqliteTable(
  "files",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    entityType: text("entity_type", { enum: ENTITY_TYPES }).notNull(),
    entityId: integer("entity_id").notNull(),
    fileType: text("file_type"),
    name: text("name").notNull(),
    url: text("url").notNull(),
    mimeType: text("mime_type"),
    sizeBytes: integer("size_bytes"),
    visibility: text("visibility", { enum: FILE_VISIBILITIES })
      .notNull()
      .default("internal"),
    position: integer("position").notNull().default(0),
    uploadedBy: integer("uploaded_by").references(() => users.id),
    createdAt: text("created_at").notNull().default(nowIso),
    deletedAt: text("deleted_at"),
  },
  (table) => [index("files_entity_idx").on(table.entityType, table.entityId)],
);

export const notifications = sqliteTable(
  "notifications",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    notificationType: text("notification_type").notNull(),
    title: text("title").notNull(),
    body: text("body"),
    entityType: text("entity_type", { enum: ENTITY_TYPES }),
    entityId: integer("entity_id"),
    isRead: integer("is_read", { mode: "boolean" }).notNull().default(false),
    readAt: text("read_at"),
    createdAt: text("created_at").notNull().default(nowIso),
  },
  (table) => [
    index("notifications_user_read_idx").on(table.userId, table.isRead),
  ],
);

/**
 * Cuentas de integración. Los tokens se guardan cifrados en servidor: la propia
 * interfaz advierte que no se almacenarán en el navegador.
 */
export const integrationAccounts = sqliteTable(
  "integration_accounts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    provider: text("provider").notNull(),
    userId: integer("user_id").references(() => users.id),
    status: text("status").notNull().default("disconnected"),
    externalAccountId: text("external_account_id"),
    encryptedCredentials: text("encrypted_credentials"),
    scopes: text("scopes"),
    lastSyncedAt: text("last_synced_at"),
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
export const auditLog = sqliteTable(
  "audit_log",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id").references(() => users.id),
    action: text("action").notNull(),
    entityType: text("entity_type", { enum: ENTITY_TYPES }).notNull(),
    entityId: integer("entity_id"),
    /** JSON con el estado antes y después, para la vista de comparación. */
    previousValue: text("previous_value"),
    newValue: text("new_value"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: text("created_at").notNull().default(nowIso),
  },
  (table) => [
    index("audit_log_entity_idx").on(table.entityType, table.entityId),
    index("audit_log_user_idx").on(table.userId),
    index("audit_log_created_idx").on(table.createdAt),
  ],
);
