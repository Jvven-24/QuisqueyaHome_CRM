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
  check,
  date,
  foreignKey,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  real,
  serial,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { CURRENCIES, ROUNDING_MODES } from "../../domain/transaccion/dinero.ts";
import { CLASES_FALLO_CRM, TIPOS_EVENTO_CRM } from "../../application/compartido/crm.ts";

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
  agencyId: integer("agency_id").references(() => agencies.id, { onDelete: "restrict", onUpdate: "cascade" }),
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

/** Catálogos VRE. RLS sin políticas: acceso directo cerrado; BFF autorizado. */
export const zones = pgTable("zones", {
  id: serial("id").primaryKey(),
  publicId: uuid("public_id").notNull().defaultRandom(),
  slug: text("slug").notNull(),
  name: text("name").notNull(),
  position: integer("position").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  ...timestamps,
}, (t) => [uniqueIndex("zones_slug_unq").on(t.slug), uniqueIndex("zones_public_id_unq").on(t.publicId)]).enableRLS();

/** Afiliación comercial, no tenant ni frontera de permisos. */
export const agencies = pgTable("agencies", {
  id: serial("id").primaryKey(),
  publicId: uuid("public_id").notNull().defaultRandom(),
  slug: text("slug").notNull(),
  name: text("name").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  ...timestamps,
}, (t) => [uniqueIndex("agencies_slug_unq").on(t.slug), uniqueIndex("agencies_public_id_unq").on(t.publicId)]).enableRLS();

export const paymentMethods = pgTable("payment_methods", {
  id: serial("id").primaryKey(),
  publicId: uuid("public_id").notNull().defaultRandom(),
  slug: text("slug").notNull(),
  name: text("name").notNull(),
  position: integer("position").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  ...timestamps,
}, (t) => [uniqueIndex("payment_methods_slug_unq").on(t.slug), uniqueIndex("payment_methods_public_id_unq").on(t.publicId)]).enableRLS();

/** Estados detallados; legacyStatus mantiene el contrato vigente de la app. */
export const unitInventoryStates = pgTable("unit_inventory_states", {
  id: serial("id").primaryKey(),
  publicId: uuid("public_id").notNull().defaultRandom(),
  slug: text("slug").notNull(),
  name: text("name").notNull(),
  legacyStatus: text("legacy_status", { enum: UNIT_STATUSES }).notNull(),
  position: integer("position").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  ...timestamps,
}, (t) => [
  uniqueIndex("unit_inventory_states_slug_unq").on(t.slug),
  uniqueIndex("unit_inventory_states_public_id_unq").on(t.publicId),
  check("unit_inventory_states_legacy_check", sql`${t.legacyStatus} in ('available','reserved','sold','unavailable')`),
]).enableRLS();

export const marketingCampaigns = pgTable("marketing_campaigns", {
  id: serial("id").primaryKey(),
  publicId: uuid("public_id").notNull().defaultRandom(),
  slug: text("slug").notNull(),
  name: text("name").notNull(),
  sourceId: integer("source_id").notNull().references(() => leadSources.id, { onDelete: "restrict", onUpdate: "cascade" }),
  startsOn: date("starts_on", { mode: "string" }).notNull(),
  endsOn: date("ends_on", { mode: "string" }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  ...timestamps,
  ...authorship,
  deletedAt: instant("deleted_at"),
}, (t) => [
  uniqueIndex("marketing_campaigns_slug_unq").on(t.slug),
  uniqueIndex("marketing_campaigns_public_id_unq").on(t.publicId),
  check("marketing_campaigns_dates_check", sql`${t.endsOn} >= ${t.startsOn}`),
]).enableRLS();

/** Mes como date (día 1); importes en centavos USD, nunca flotante. */
export const campaignSpend = pgTable("campaign_spend", {
  id: serial("id").primaryKey(),
  publicId: uuid("public_id").notNull().defaultRandom(),
  campaignId: integer("campaign_id").notNull().references(() => marketingCampaigns.id, { onDelete: "restrict", onUpdate: "cascade" }),
  month: date("month", { mode: "string" }).notNull(),
  amountCents: bigint("amount_cents", { mode: "number" }).notNull(),
  currency: text("currency").notNull().default("USD"),
  ...timestamps,
  ...authorship,
}, (t) => [
  uniqueIndex("campaign_spend_campaign_month_unq").on(t.campaignId, t.month),
  uniqueIndex("campaign_spend_public_id_unq").on(t.publicId),
  check("campaign_spend_amount_check", sql`${t.amountCents} >= 0`),
  check("campaign_spend_currency_check", sql`${t.currency} = 'USD'`),
  check("campaign_spend_month_check", sql`extract(day from ${t.month}) = 1`),
]).enableRLS();

export const projects = pgTable(
  "projects",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    /** Punta Cana, Bávaro, Vista Cana, Cap Cana… Alimenta "Zonas calientes". */
    zone: text("zone"),
    zoneId: integer("zone_id").references(() => zones.id, { onDelete: "restrict", onUpdate: "cascade" }),
    /** Atributo del proyecto; no duplicarlo en cada unidad. */
    confoturEligible: boolean("confotur_eligible"),
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
    /** Etiqueta dentro del proyecto, sin atributos propios que requieran tabla. */
    tower: text("tower"),
    inventoryStateId: integer("inventory_state_id").references(() => unitInventoryStates.id, { onDelete: "restrict", onUpdate: "cascade" }),
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
    rowVersion: integer("row_version").notNull().default(1),
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
    check("units_row_version_check", sql`${table.rowVersion} > 0`),
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
    zoneInterestId: integer("zone_interest_id").references(() => zones.id, { onDelete: "restrict", onUpdate: "cascade" }),
    campaignId: integer("campaign_id").references(() => marketingCampaigns.id, { onDelete: "restrict", onUpdate: "cascade" }),
    deliveryHorizonMonths: integer("delivery_horizon_months"),
    paymentMethodId: integer("payment_method_id").references(() => paymentMethods.id, { onDelete: "restrict", onUpdate: "cascade" }),
    confoturInterest: boolean("confotur_interest"),
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
    check("leads_horizon_check", sql`${table.deliveryHorizonMonths} >= 0`),
    check("leads_budget_min_check", sql`${table.budgetMinCents} >= 0`),
    check("leads_budget_max_check", sql`${table.budgetMaxCents} >= 0`),
    check("leads_budget_order_check", sql`${table.budgetMinCents} <= ${table.budgetMaxCents}`),
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
    /** M8: versión de la regla de atribución congelada al cerrar como ganado. */
    attributionRuleVersion: integer("attribution_rule_version"),
    attributedProjectId: integer("attributed_project_id").references(() => projects.id),
    attributedTeamId: integer("attributed_team_id").references((): AnyPgColumn => teams.id),
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
    check("deals_amount_nonnegative", sql`${table.amountCents} >= 0`),
    check("deals_probability_range", sql`${table.probability} between 0 and 100`),
    check("deals_loss_comment_required", sql`${table.lossReasonId} is null or length(btrim(${table.lossComment})) > 0 and ${table.lossComment} is not null`),
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
      .references(() => deals.id, { onDelete: "restrict" }),
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id),
    /** Nulo mientras el interés es a nivel de proyecto y no de unidad. */
    unitId: integer("unit_id").references(() => units.id),
    isPrimary: boolean("is_primary").notNull().default(false),
    createdAt: instant("created_at").notNull().defaultNow(),
    createdBy: integer("created_by").references(() => users.id),
    deletedAt: instant("deleted_at"),
    deletedBy: integer("deleted_by").references(() => users.id, { onDelete: "restrict" }),
    deletionReason: text("deletion_reason"),
  },
  (table) => [
    uniqueIndex("deal_properties_deal_unit_unq").on(table.dealId, table.unitId).where(sql`${table.deletedAt} is null`),
    /**
     * Postgres, como SQLite, considera cada NULL distinto en un índice único,
     * así que el índice anterior no impide repetir un proyecto sin unidad.
     * Este parcial cubre ese caso.
     */
    uniqueIndex("deal_properties_deal_project_unq")
      .on(table.dealId, table.projectId)
      .where(sql`${table.unitId} is null and ${table.deletedAt} is null`),
    uniqueIndex("deal_properties_primary_live_unq").on(table.dealId).where(sql`${table.isPrimary} and ${table.deletedAt} is null`),
    check("deal_properties_deletion_reason", sql`${table.deletedAt} is null or (${table.deletedBy} is not null and ${table.deletionReason} is not null and length(btrim(${table.deletionReason})) > 0)`),
    index("deal_properties_project_idx").on(table.projectId),
  ],
);

/** Venta durable: archivar unidad o negocio nunca libera esta exclusividad. */
export const unitSales = pgTable("unit_sales", {
  id: uuid("id").defaultRandom().primaryKey(),
  unitId: integer("unit_id").notNull().references(() => units.id, { onDelete: "restrict", onUpdate: "restrict" }),
  dealId: integer("deal_id").notNull().references(() => deals.id, { onDelete: "restrict", onUpdate: "restrict" }),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "restrict", onUpdate: "restrict" }),
  unitCodeNormalized: text("unit_code_normalized").notNull(),
  createdAt: instant("created_at").notNull().defaultNow(),
  createdBy: integer("created_by").notNull().references(() => users.id, { onDelete: "restrict", onUpdate: "restrict" }),
}, t => [uniqueIndex("unit_sales_unit_unq").on(t.unitId), uniqueIndex("unit_sales_deal_unq").on(t.dealId),
  unique("unit_sales_commitment_owner_unq").on(t.id, t.unitId, t.projectId, t.unitCodeNormalized),
  uniqueIndex("unit_sales_identity_unq").on(t.projectId, t.unitCodeNormalized),
  check("unit_sales_code_normalized", sql`length(btrim(${t.unitCodeNormalized})) > 0 and ${t.unitCodeNormalized} = upper(btrim(${t.unitCodeNormalized}))`),
]).enableRLS();

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
    /** Timeline del lead exacto, incluso si el contacto tiene varios leads. */
    leadId: integer("lead_id").references(() => leads.id, { onDelete: "restrict", onUpdate: "cascade" }),
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

/* -------------------------------------------------------------------------- */
/* M8 · Metas por proyecto/equipo y regla versionada de atribución             */
/* -------------------------------------------------------------------------- */

/** Equipo comercial mínimo: nombre, líder opcional y miembros (un broker, un equipo). */
export const teams = pgTable(
  "teams",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    leaderId: integer("leader_id").references(() => users.id),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
    ...authorship,
  },
  (table) => [
    uniqueIndex("teams_slug_unq").on(table.slug),
    check("teams_name_not_blank", sql`length(btrim(${table.name})) > 0`),
  ],
).enableRLS();

export const teamMembers = pgTable(
  "team_members",
  {
    teamId: integer("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    createdAt: instant("created_at").notNull().defaultNow(),
    createdBy: integer("created_by").references(() => users.id),
  },
  (table) => [
    primaryKey({ name: "team_members_pk", columns: [table.teamId, table.userId] }),
    /** Un broker pertenece a un solo equipo: la atribución por equipo es inequívoca. */
    uniqueIndex("team_members_user_unq").on(table.userId),
  ],
).enableRLS();

/**
 * Metas de proyecto o de equipo. Solo guardan el objetivo: lo logrado se deriva
 * de los negocios ganados del periodo con su atribución congelada al cierre.
 */
export const scopedGoals = pgTable(
  "scoped_goals",
  {
    id: serial("id").primaryKey(),
    scopeType: text("scope_type", { enum: ["project", "team"] }).notNull(),
    scopeId: integer("scope_id").notNull(),
    year: integer("year").notNull(),
    month: integer("month").notNull(),
    targetDeals: integer("target_deals").notNull().default(0),
    targetAmountCents: bigint("target_amount_cents", { mode: "number" }),
    currency: text("currency").notNull().default("USD"),
    ...timestamps,
    ...authorship,
  },
  (table) => [
    uniqueIndex("scoped_goals_period_unq").on(table.scopeType, table.scopeId, table.year, table.month),
    check("scoped_goals_scope_type_chk", sql`${table.scopeType} in ('project','team')`),
    check("scoped_goals_month_chk", sql`${table.month} between 1 and 12`),
    check(
      "scoped_goals_target_chk",
      sql`${table.targetDeals} >= 0 and (${table.targetAmountCents} is null or ${table.targetAmountCents} >= 0)`,
    ),
    check("scoped_goals_currency_chk", sql`${table.currency} in ('USD','DOP')`),
  ],
).enableRLS();

/** Regla de atribución versionada. Una sola activa; la activa se congela en cada cierre. */
export const attributionRules = pgTable(
  "attribution_rules",
  {
    id: serial("id").primaryKey(),
    version: integer("version").notNull(),
    scope: text("scope").notNull(),
    rule: text("rule").notNull(),
    config: jsonb("config").notNull(),
    isActive: boolean("is_active").notNull().default(false),
    approvedBy: integer("approved_by").references(() => users.id),
    approvedAt: instant("approved_at"),
    createdAt: instant("created_at").notNull().defaultNow(),
    createdBy: integer("created_by").references(() => users.id),
  },
  (table) => [
    uniqueIndex("attribution_rules_version_unq").on(table.version),
    uniqueIndex("attribution_rules_active_unq").on(table.isActive).where(sql`${table.isActive}`),
  ],
).enableRLS();

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
).enableRLS();

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

export const ACADEMY_REVIEW_STATUSES = [
  "pendiente",
  "aprobado",
  "rechazado",
  "revocado",
] as const;

export const ACADEMY_CERTIFICATE_STATUSES = ["vigente", "revocada"] as const;

/**
 * Solicitudes de revisión de completado y emisión de constancia de Quisqueya Academy.
 * Regla Q-C1-03: ningún broker puede autoaprobarse (`decision_by <> broker_id`).
 */
export const academyReviewRequests = pgTable(
  "academy_review_requests",
  {
    id: serial("id").primaryKey(),
    publicId: uuid("public_id").notNull().defaultRandom(),
    brokerId: integer("broker_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseCode: text("course_code").notNull(),
    courseName: text("course_name").notNull(),
    moodleCourseId: integer("moodle_course_id").notNull(),
    progressPercent: integer("progress_percent").notNull().default(0),
    gradePercent: integer("grade_percent"),
    evidenceHash: text("evidence_hash").notNull(),
    evidencePayload: jsonb("evidence_payload")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    status: text("status", { enum: ACADEMY_REVIEW_STATUSES })
      .notNull()
      .default("pendiente"),
    decisionBy: integer("decision_by").references(() => users.id),
    decisionReason: text("decision_reason"),
    decidedAt: instant("decided_at"),
    ...timestamps,
    deletedAt: instant("deleted_at"),
  },
  (table) => [
    uniqueIndex("academy_review_requests_public_id_unq").on(table.publicId),
    index("academy_review_requests_broker_idx").on(
      table.brokerId,
      table.status,
    ),
    index("academy_review_requests_course_idx").on(
      table.courseCode,
      table.status,
    ),
    check(
      "academy_review_requests_progress_check",
      sql`${table.progressPercent} >= 0 and ${table.progressPercent} <= 100`,
    ),
    check(
      "academy_review_requests_status_check",
      sql`${table.status} in ('pendiente','aprobado','rechazado','revocado')`,
    ),
    check(
      "academy_review_requests_no_self_approval_check",
      sql`${table.decisionBy} is null or ${table.decisionBy} <> ${table.brokerId}`,
    ),
  ],
).enableRLS();

/**
 * Constancias oficiales emitidas tras aprobación administrativa de una solicitud de revisión.
 * Incluye hash SHA-256 calculado en servidor sobre la evidencia de Moodle y código de verificación.
 */
export const academyCertificates = pgTable(
  "academy_certificates",
  {
    id: serial("id").primaryKey(),
    publicId: uuid("public_id").notNull().defaultRandom(),
    reviewRequestId: integer("review_request_id")
      .notNull()
      .references(() => academyReviewRequests.id, { onDelete: "restrict" }),
    brokerId: integer("broker_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    courseCode: text("course_code").notNull(),
    courseName: text("course_name").notNull(),
    verificationCode: text("verification_code").notNull(),
    cryptographicHash: text("cryptographic_hash").notNull(),
    evidenceSnapshot: jsonb("evidence_snapshot")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    approvedBy: integer("approved_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    status: text("status", { enum: ACADEMY_CERTIFICATE_STATUSES })
      .notNull()
      .default("vigente"),
    revokedBy: integer("revoked_by").references(() => users.id),
    revokedReason: text("revoked_reason"),
    revokedAt: instant("revoked_at"),
    issuedAt: instant("issued_at").notNull().defaultNow(),
    ...timestamps,
    deletedAt: instant("deleted_at"),
  },
  (table) => [
    uniqueIndex("academy_certificates_public_id_unq").on(table.publicId),
    uniqueIndex("academy_certificates_review_request_unq").on(
      table.reviewRequestId,
    ),
    uniqueIndex("academy_certificates_verification_code_unq").on(
      table.verificationCode,
    ),
    index("academy_certificates_broker_idx").on(table.brokerId, table.status),
    check(
      "academy_certificates_status_check",
      sql`${table.status} in ('vigente','revocada')`,
    ),
    check(
      "academy_certificates_no_self_approval_check",
      sql`${table.approvedBy} <> ${table.brokerId}`,
    ),
  ],
).enableRLS();

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

/* Base de integraciones: acceso exclusivamente servidor, sin políticas públicas. */
export const outbox = pgTable("outbox", {
  eventId: uuid("event_id").primaryKey(),
  eventType: text("event_type", { enum: TIPOS_EVENTO_CRM }).notNull(),
  version: integer("version").notNull().default(1),
  aggregateId: integer("aggregate_id").notNull(),
  correlationId: uuid("correlation_id").notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
  idempotencyKey: text("idempotency_key").notNull(),
  attempts: integer("attempts").notNull().default(0),
  availableAt: instant("available_at").notNull().defaultNow(),
  sentAt: instant("sent_at"),
  deadAt: instant("dead_at"),
  lastFailure: text("last_failure", { enum: CLASES_FALLO_CRM }),
  attemptHistory: jsonb("attempt_history").$type<{ attempt: number; at: string; outcome: string }[]>().notNull().default([]),
  createdAt: instant("created_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("outbox_idempotency_unq").on(table.idempotencyKey),
  index("outbox_pending_idx").on(table.availableAt, table.createdAt).where(sql`${table.sentAt} is null and ${table.deadAt} is null`),
  index("outbox_aggregate_idx").on(table.eventType, table.aggregateId, table.createdAt),
  check("outbox_version_check", sql`${table.version} > 0`),
  check("outbox_attempts_check", sql`${table.attempts} >= 0`),
  check("outbox_terminal_check", sql`${table.sentAt} is null or ${table.deadAt} is null`),
  // Vocabulario cerrado compartido con validadores; literales del catálogo,
  // nunca entrada de usuario. El escape mantiene seguro el SQL del snapshot.
  check("outbox_type_check", sql`${table.eventType} in (${sql.join(TIPOS_EVENTO_CRM.map(tipo => sql.raw(`'${tipo.replaceAll("'", "''")}'`)), sql`,`)})`),
]).enableRLS();

/** Se conserva también la identidad en outbox: un replay no recrea un evento muerto. */
export const outboxDead = pgTable("outbox_dead", {
  eventId: uuid("event_id").primaryKey().references(() => outbox.eventId, { onDelete: "restrict" }),
  reason: text("reason", { enum: CLASES_FALLO_CRM }).notNull(),
  failedAt: instant("failed_at").notNull().defaultNow(),
}, (table) => [
  index("outbox_dead_failed_idx").on(table.failedAt),
  check("outbox_dead_reason_check", sql`${table.reason} in ('RETRYABLE','NON_RETRYABLE','HUMAN_REQUIRED')`),
]).enableRLS();

export const externalRefs = pgTable("external_refs", {
  id: serial("id").primaryKey(),
  entityType: text("entity_type").notNull(),
  localId: integer("local_id").notNull(),
  system: text("system").notNull(),
  externalId: text("external_id").notNull(),
  version: integer("version").notNull(),
  syncedAt: instant("synced_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("external_refs_local_system_unq").on(table.entityType, table.localId, table.system),
  uniqueIndex("external_refs_system_external_unq").on(table.system, table.externalId),
  check("external_refs_version_check", sql`${table.version} > 0`),
]).enableRLS();

/** Recepción durable != efecto aplicado; un crash permite retomar received. */
export const webhookInbox = pgTable("webhook_inbox", {
  id: uuid("id").primaryKey().defaultRandom(),
  system: text("system").notNull(),
  accountId: text("account_id").notNull(),
  eventId: text("event_id").notNull(),
  correlationId: uuid("correlation_id").notNull(),
  version: integer("version").notNull(),
  receivedAt: instant("received_at").notNull().defaultNow(),
  processedAt: instant("processed_at"),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
}, (table) => [
  uniqueIndex("webhook_inbox_account_event_unq").on(table.system, table.accountId, table.eventId),
  index("webhook_inbox_pending_idx").on(table.receivedAt).where(sql`${table.processedAt} is null`),
  check("webhook_inbox_version_check", sql`${table.version} > 0`),
]).enableRLS();

/* -------------------------------------------------------------------------- */
/* M40 b1c · expansión para una empresa (decisión #51). No activa comandos.     */
/* -------------------------------------------------------------------------- */

/** Autoría obligatoria; las FK financieras nunca eliminan historia en cascada. */
const transactionAuthorship = {
  createdBy: integer("created_by").notNull().references(() => users.id, { onDelete: "restrict", onUpdate: "restrict" }),
  updatedBy: integer("updated_by").notNull().references(() => users.id, { onDelete: "restrict", onUpdate: "restrict" }),
  rowVersion: integer("row_version").notNull().default(1),
  correlationId: uuid("correlation_id").notNull(),
  source: text("source").notNull(),
  ...timestamps,
};

/** H-R2-03: resultado mínimo, retención >=5 años y clave durable no reciclable. */
export const transactionCommands = pgTable("transaction_commands", {
  id: serial("id").primaryKey(),
  publicId: uuid("public_id").notNull().defaultRandom(),
  actorId: integer("actor_id").notNull().references(() => users.id, { onDelete: "restrict", onUpdate: "restrict" }),
  operation: text("operation").notNull(),
  idempotencyKey: uuid("idempotency_key").notNull(),
  requestHash: text("request_hash").notNull(),
  status: text("status", { enum: ["processing", "completed"] }).notNull().default("processing"),
  httpStatus: integer("http_status"),
  /** Solo referencia pública y código estable, nunca un DTO financiero completo. */
  resultPublicId: uuid("result_public_id"),
  resultCode: text("result_code"),
  createdAt: instant("created_at").notNull().defaultNow(),
  completedAt: instant("completed_at"),
  retainUntil: instant("retain_until"),
}, t => [
  uniqueIndex("transaction_commands_public_id_unq").on(t.publicId),
  uniqueIndex("transaction_commands_key_unq").on(t.actorId, t.operation, t.idempotencyKey),
  index("transaction_commands_retention_idx").on(t.actorId, t.operation, t.idempotencyKey, t.createdAt),
  check("transaction_commands_request_check", sql`length(btrim(${t.operation})) > 0 and ${t.requestHash} ~ '^[0-9a-f]{64}$'`),
  check("transaction_commands_result_check", sql`(${t.status} = 'processing' and ${t.completedAt} is null and ${t.httpStatus} is null and ${t.retainUntil} is null and ${t.resultPublicId} is null and ${t.resultCode} is null) or (${t.status} = 'completed' and ${t.completedAt} is not null and ${t.completedAt} >= ${t.createdAt} and ${t.httpStatus} between 100 and 599 and ${t.httpStatus} is not null and ${t.retainUntil} is not null and ${t.retainUntil} >= ${t.completedAt} + interval '5 years' and length(btrim(${t.resultCode})) > 0 and ${t.resultCode} is not null)`),
]).enableRLS();

export const holds = pgTable("holds", {
  id: serial("id").primaryKey(),
  publicId: uuid("public_id").notNull().defaultRandom(),
  dealId: integer("deal_id").notNull().references(() => deals.id, { onDelete: "restrict", onUpdate: "restrict" }),
  holderId: integer("holder_id").notNull().references(() => users.id, { onDelete: "restrict", onUpdate: "restrict" }),
  status: text("status", { enum: ["activo", "convertido", "cancelado", "expirado"] }).notNull().default("activo"),
  expiresAt: instant("expires_at").notNull(),
  /** Número de versión congelado; no se inventa una FK a una política inexistente. */
  policyVersion: integer("policy_version").notNull(),
  extensionCount: integer("extension_count").notNull().default(0),
  reason: text("reason").notNull(),
  resolvedAt: instant("resolved_at"),
  ...transactionAuthorship,
}, t => [
  uniqueIndex("holds_public_id_unq").on(t.publicId),
  unique("holds_id_deal_unq").on(t.id, t.dealId),
  index("holds_holder_status_expiry_idx").on(t.holderId, t.status, t.expiresAt),
  index("holds_deal_idx").on(t.dealId),
  check("holds_state_check", sql`${t.status} in ('activo','convertido','cancelado','expirado') and ((${t.status} = 'activo' and ${t.resolvedAt} is null) or (${t.status} <> 'activo' and ${t.resolvedAt} is not null and ${t.resolvedAt} >= ${t.createdAt}))`),
  check("holds_values_check", sql`${t.expiresAt} > ${t.createdAt} and ${t.policyVersion} > 0 and ${t.extensionCount} >= 0 and ${t.rowVersion} > 0 and length(btrim(${t.reason})) > 0 and length(btrim(${t.source})) > 0`),
]).enableRLS();

export const holdUnits = pgTable("hold_units", {
  id: serial("id").primaryKey(),
  holdId: integer("hold_id").notNull().references(() => holds.id, { onDelete: "restrict", onUpdate: "restrict" }),
  unitId: integer("unit_id").notNull().references(() => units.id, { onDelete: "restrict", onUpdate: "restrict" }),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "restrict", onUpdate: "restrict" }),
  unitCodeNormalized: text("unit_code_normalized").notNull(),
  priceVersion: integer("price_version").notNull(),
  priceCents: bigint("price_cents", { mode: "bigint" }).notNull(),
  currency: text("currency", { enum: ["USD", "DOP"] }).notNull(),
  componentRole: text("component_role").notNull(),
  createdAt: instant("created_at").notNull().defaultNow(),
  createdBy: integer("created_by").notNull().references(() => users.id, { onDelete: "restrict", onUpdate: "restrict" }),
}, t => [
  unique("hold_units_hold_unit_unq").on(t.holdId, t.unitId),
  unique("hold_units_commitment_owner_unq").on(t.holdId, t.unitId, t.projectId, t.unitCodeNormalized),
  check("hold_units_values_check", sql`${t.priceVersion} > 0 and ${t.priceCents} >= 0 and ${t.currency} in ('USD','DOP') and length(btrim(${t.componentRole})) > 0 and length(${t.unitCodeNormalized}) > 0 and ${t.unitCodeNormalized} = normalizar_codigo_unidad(${t.unitCodeNormalized})`),
]).enableRLS();

export const reservations = pgTable("reservations", {
  id: serial("id").primaryKey(),
  publicId: uuid("public_id").notNull().defaultRandom(),
  dealId: integer("deal_id").notNull().references(() => deals.id, { onDelete: "restrict", onUpdate: "restrict" }),
  holdId: integer("hold_id"),
  status: text("status", { enum: ["borrador", "pendiente_pago", "en_verificacion", "confirmada", "expirada", "cancelacion_solicitada", "cancelada"] }).notNull().default("borrador"),
  currency: text("currency", { enum: ["USD", "DOP"] }).notNull(),
  totalCents: bigint("total_cents", { mode: "bigint" }).notNull(),
  adjustmentCents: bigint("adjustment_cents", { mode: "bigint" }).notNull().default(sql`0`),
  depositRequiredCents: bigint("deposit_required_cents", { mode: "bigint" }).notNull(),
  conditionsVersion: integer("conditions_version").notNull(),
  /** Snapshot documental real; no JSON libre ni ID de proveedor sin FK. */
  conditionsDocumentId: integer("conditions_document_id").notNull().references(() => files.id, { onDelete: "restrict", onUpdate: "restrict" }),
  conditionsHash: text("conditions_hash").notNull(),
  confirmationEvidenceId: integer("confirmation_evidence_id").references(() => files.id, { onDelete: "restrict", onUpdate: "restrict" }),
  confirmedBy: integer("confirmed_by").references(() => users.id, { onDelete: "restrict", onUpdate: "restrict" }),
  confirmedAt: instant("confirmed_at"),
  expiresAt: instant("expires_at"),
  reason: text("reason").notNull(),
  ...transactionAuthorship,
}, t => [
  uniqueIndex("reservations_public_id_unq").on(t.publicId),
  unique("reservations_id_currency_unq").on(t.id, t.currency),
  uniqueIndex("reservations_hold_unq").on(t.holdId).where(sql`${t.holdId} is not null`),
  foreignKey({ name: "reservations_hold_deal_fk", columns: [t.holdId, t.dealId], foreignColumns: [holds.id, holds.dealId] }).onDelete("restrict").onUpdate("restrict"),
  index("reservations_deal_idx").on(t.dealId),
  check("reservations_values_check", sql`${t.currency} in ('USD','DOP') and ${t.totalCents} >= 0 and ${t.depositRequiredCents} >= 0 and ${t.depositRequiredCents} <= ${t.totalCents} and ${t.conditionsVersion} > 0 and ${t.rowVersion} > 0 and ${t.conditionsHash} ~ '^[0-9a-f]{64}$' and length(btrim(${t.reason})) > 0 and length(btrim(${t.source})) > 0 and (${t.expiresAt} is null or ${t.expiresAt} > ${t.createdAt})`),
  check("reservations_state_check", sql`${t.status} in ('borrador','pendiente_pago','en_verificacion','confirmada','expirada','cancelacion_solicitada','cancelada')`),
  check("reservations_confirmation_check", sql`((${t.confirmedAt} is null and ${t.confirmedBy} is null and ${t.confirmationEvidenceId} is null) or (${t.confirmedAt} is not null and ${t.confirmedBy} is not null and ${t.confirmationEvidenceId} is not null and ${t.confirmedAt} >= ${t.createdAt})) and (${t.status} not in ('confirmada','cancelacion_solicitada','cancelada') or ${t.confirmedAt} is not null)`),
]).enableRLS();

/** Solo contactos existentes; la representación jurídica espera su contrato real. */
export const reservationParties = pgTable("reservation_parties", {
  id: serial("id").primaryKey(),
  reservationId: integer("reservation_id").notNull().references(() => reservations.id, { onDelete: "restrict", onUpdate: "restrict" }),
  contactId: integer("contact_id").notNull().references(() => contacts.id, { onDelete: "restrict", onUpdate: "restrict" }),
  role: text("role", { enum: ["titular", "representante"] }).notNull(),
  representationEvidenceId: integer("representation_evidence_id").references(() => files.id, { onDelete: "restrict", onUpdate: "restrict" }),
  createdAt: instant("created_at").notNull().defaultNow(),
  createdBy: integer("created_by").notNull().references(() => users.id, { onDelete: "restrict", onUpdate: "restrict" }),
}, t => [
  uniqueIndex("reservation_parties_contact_role_unq").on(t.reservationId, t.contactId, t.role),
  check("reservation_parties_role_check", sql`${t.role} in ('titular','representante') and (${t.role} <> 'representante' or ${t.representationEvidenceId} is not null)`),
]).enableRLS();

export const reservationUnits = pgTable("reservation_units", {
  id: serial("id").primaryKey(),
  reservationId: integer("reservation_id").notNull(),
  unitId: integer("unit_id").notNull().references(() => units.id, { onDelete: "restrict", onUpdate: "restrict" }),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "restrict", onUpdate: "restrict" }),
  unitCodeNormalized: text("unit_code_normalized").notNull(),
  priceCents: bigint("price_cents", { mode: "bigint" }).notNull(),
  currency: text("currency", { enum: ["USD", "DOP"] }).notNull(),
  componentRole: text("component_role").notNull(),
  /** Cambio de unidad conserva el componente original y su compromiso resuelto. */
  releasedAt: instant("released_at"),
  releaseReason: text("release_reason"),
  createdAt: instant("created_at").notNull().defaultNow(),
  createdBy: integer("created_by").notNull().references(() => users.id, { onDelete: "restrict", onUpdate: "restrict" }),
}, t => [
  unique("reservation_units_reservation_unit_unq").on(t.reservationId, t.unitId),
  unique("reservation_units_commitment_owner_unq").on(t.id, t.unitId, t.projectId, t.unitCodeNormalized),
  foreignKey({ name: "reservation_units_reservation_currency_fk", columns: [t.reservationId, t.currency], foreignColumns: [reservations.id, reservations.currency] }).onDelete("restrict").onUpdate("restrict"),
  check("reservation_units_values_check", sql`${t.priceCents} >= 0 and ${t.currency} in ('USD','DOP') and length(btrim(${t.componentRole})) > 0 and length(${t.unitCodeNormalized}) > 0 and ${t.unitCodeNormalized} = normalizar_codigo_unidad(${t.unitCodeNormalized})`),
  check("reservation_units_release_check", sql`(${t.releasedAt} is null and ${t.releaseReason} is null) or (${t.releasedAt} is not null and ${t.releasedAt} >= ${t.createdAt} and ${t.releaseReason} is not null and length(btrim(${t.releaseReason})) > 0)`),
]).enableRLS();

/** Exclusividad sin reloj ni deleted_at en el predicado; expiración explícita bajo lock. */
export const inventoryCommitments = pgTable("inventory_commitments", {
  id: serial("id").primaryKey(),
  publicId: uuid("public_id").notNull().defaultRandom(),
  unitId: integer("unit_id").notNull().references(() => units.id, { onDelete: "restrict", onUpdate: "restrict" }),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "restrict", onUpdate: "restrict" }),
  unitCodeNormalized: text("unit_code_normalized").notNull(),
  kind: text("kind", { enum: ["hold", "reservation", "sale"] }).notNull(),
  status: text("status", { enum: ["active", "resolved"] }).notNull().default("active"),
  holdId: integer("hold_id"),
  reservationUnitId: integer("reservation_unit_id"),
  unitSaleId: uuid("unit_sale_id"),
  expiresAt: instant("expires_at"),
  resolvedAt: instant("resolved_at"),
  resolutionReason: text("resolution_reason"),
  ...transactionAuthorship,
}, t => [
  uniqueIndex("inventory_commitments_public_id_unq").on(t.publicId),
  uniqueIndex("inventory_commitments_active_unit_unq").on(t.unitId).where(sql`${t.status} = 'active'`),
  uniqueIndex("inventory_commitments_active_identity_unq").on(t.projectId, t.unitCodeNormalized).where(sql`${t.status} = 'active'`),
  foreignKey({ name: "inventory_commitments_hold_owner_fk", columns: [t.holdId, t.unitId, t.projectId, t.unitCodeNormalized], foreignColumns: [holdUnits.holdId, holdUnits.unitId, holdUnits.projectId, holdUnits.unitCodeNormalized] }).onDelete("restrict").onUpdate("restrict"),
  foreignKey({ name: "inventory_commitments_reservation_owner_fk", columns: [t.reservationUnitId, t.unitId, t.projectId, t.unitCodeNormalized], foreignColumns: [reservationUnits.id, reservationUnits.unitId, reservationUnits.projectId, reservationUnits.unitCodeNormalized] }).onDelete("restrict").onUpdate("restrict"),
  foreignKey({ name: "inventory_commitments_sale_owner_fk", columns: [t.unitSaleId, t.unitId, t.projectId, t.unitCodeNormalized], foreignColumns: [unitSales.id, unitSales.unitId, unitSales.projectId, unitSales.unitCodeNormalized] }).onDelete("restrict").onUpdate("restrict"),
  check("inventory_commitments_owner_check", sql`(${t.kind} = 'hold' and ${t.holdId} is not null and ${t.reservationUnitId} is null and ${t.unitSaleId} is null and ${t.expiresAt} is not null) or (${t.kind} = 'reservation' and ${t.holdId} is null and ${t.reservationUnitId} is not null and ${t.unitSaleId} is null) or (${t.kind} = 'sale' and ${t.holdId} is null and ${t.reservationUnitId} is null and ${t.unitSaleId} is not null and ${t.expiresAt} is null)`),
  check("inventory_commitments_state_check", sql`(${t.status} = 'active' and ${t.resolvedAt} is null and ${t.resolutionReason} is null) or (${t.status} = 'resolved' and ${t.resolvedAt} is not null and ${t.resolvedAt} >= ${t.createdAt} and ${t.resolutionReason} is not null and length(btrim(${t.resolutionReason})) > 0)`),
  check("inventory_commitments_values_check", sql`${t.rowVersion} > 0 and length(btrim(${t.source})) > 0 and length(${t.unitCodeNormalized}) > 0 and ${t.unitCodeNormalized} = normalizar_codigo_unidad(${t.unitCodeNormalized}) and (${t.expiresAt} is null or ${t.expiresAt} > ${t.createdAt})`),
]).enableRLS();

/* M40 b1d · solo expansión. Los agregados e historia se protegen en 0008. */
const financialFact = {
  createdBy: integer("created_by").notNull().references(() => users.id, { onDelete: "restrict", onUpdate: "restrict" }),
  createdAt: instant("created_at").notNull().defaultNow(),
  source: text("source").notNull(),
  correlationId: uuid("correlation_id").notNull(),
};

/** Calendario estructural, sin activar ni sembrar condiciones comerciales. */
export const paymentPlanTemplates = pgTable("payment_plan_templates", {
  id: serial("id").primaryKey(),
  publicId: uuid("public_id").notNull().defaultRandom(),
  projectId: integer("project_id").references(() => projects.id, { onDelete: "restrict", onUpdate: "restrict" }),
  code: text("code").notNull(),
  name: text("name").notNull(),
  version: integer("version").notNull(),
  status: text("status", { enum: ["borrador", "aprobada", "retirada"] }).notNull().default("borrador"),
  calendar: jsonb("calendar").$type<readonly { sequence: number; concept: string; weight: number; offsetDays: number }[]>().notNull(),
  approvedBy: integer("approved_by").references(() => users.id, { onDelete: "restrict", onUpdate: "restrict" }),
  approvedAt: instant("approved_at"),
  approvalEvidenceId: integer("approval_evidence_id").references(() => files.id, { onDelete: "restrict", onUpdate: "restrict" }),
  ...transactionAuthorship,
}, t => [
  uniqueIndex("payment_plan_templates_public_id_unq").on(t.publicId),
  uniqueIndex("payment_plan_templates_project_version_unq").on(t.projectId, t.code, t.version).where(sql`${t.projectId} is not null`),
  uniqueIndex("payment_plan_templates_global_version_unq").on(t.code, t.version).where(sql`${t.projectId} is null`),
  check("payment_plan_templates_values_check", sql`${t.version} > 0 and ${t.rowVersion} > 0 and length(btrim(${t.code})) > 0 and length(btrim(${t.name})) > 0 and length(btrim(${t.source})) > 0 and jsonb_typeof(${t.calendar}) = 'array' and jsonb_array_length(${t.calendar}) > 0`),
  check("payment_plan_templates_approval_check", sql`${t.status} in ('borrador','aprobada','retirada') and ((${t.status} = 'borrador' and ${t.approvedBy} is null and ${t.approvedAt} is null and ${t.approvalEvidenceId} is null) or (${t.status} <> 'borrador' and ${t.approvedBy} is not null and ${t.approvedBy} <> ${t.createdBy} and ${t.approvedAt} is not null and ${t.approvedAt} >= ${t.createdAt} and ${t.approvalEvidenceId} is not null))`),
]).enableRLS();

/** Un solo origen; la pertenencia de active_version_id se comprueba al commit. */
export const paymentPlans = pgTable("payment_plans", {
  id: serial("id").primaryKey(),
  publicId: uuid("public_id").notNull().defaultRandom(),
  reservationId: integer("reservation_id").references(() => reservations.id, { onDelete: "restrict", onUpdate: "restrict" }),
  legacyUnitSaleId: uuid("legacy_unit_sale_id").references(() => unitSales.id, { onDelete: "restrict", onUpdate: "restrict" }),
  currency: text("currency", { enum: CURRENCIES }).notNull(),
  activeVersionId: integer("active_version_id").references((): AnyPgColumn => paymentPlanVersions.id, { onDelete: "restrict", onUpdate: "restrict" }),
  ...transactionAuthorship,
}, t => [
  uniqueIndex("payment_plans_public_id_unq").on(t.publicId),
  uniqueIndex("payment_plans_reservation_unq").on(t.reservationId).where(sql`${t.reservationId} is not null`),
  uniqueIndex("payment_plans_legacy_sale_unq").on(t.legacyUnitSaleId).where(sql`${t.legacyUnitSaleId} is not null`),
  check("payment_plans_origin_check", sql`num_nonnulls(${t.reservationId}, ${t.legacyUnitSaleId}) = 1`),
  check("payment_plans_values_check", sql`${t.currency} in ('USD','DOP') and ${t.rowVersion} > 0 and length(btrim(${t.source})) > 0`),
]).enableRLS();

export const paymentPlanVersions = pgTable("payment_plan_versions", {
  id: serial("id").primaryKey(),
  publicId: uuid("public_id").notNull().defaultRandom(),
  planId: integer("plan_id").notNull().references(() => paymentPlans.id, { onDelete: "restrict", onUpdate: "restrict" }),
  version: integer("version").notNull(),
  previousVersionId: integer("previous_version_id").references((): AnyPgColumn => paymentPlanVersions.id, { onDelete: "restrict", onUpdate: "restrict" }),
  templateId: integer("template_id").references(() => paymentPlanTemplates.id, { onDelete: "restrict", onUpdate: "restrict" }),
  currency: text("currency", { enum: CURRENCIES }).notNull(),
  totalCents: bigint("total_cents", { mode: "bigint" }).notNull(),
  status: text("status", { enum: ["borrador", "acordado_activo", "completado", "sustituido"] }).notNull().default("borrador"),
  agreementDocumentId: integer("agreement_document_id").references(() => files.id, { onDelete: "restrict", onUpdate: "restrict" }),
  agreementHash: text("agreement_hash"),
  agreedAt: instant("agreed_at"),
  ...transactionAuthorship,
}, t => [
  uniqueIndex("payment_plan_versions_public_id_unq").on(t.publicId),
  unique("payment_plan_versions_number_unq").on(t.planId, t.version),
  uniqueIndex("payment_plan_versions_current_unq").on(t.planId).where(sql`${t.status} in ('acordado_activo','completado')`),
  unique("payment_plan_versions_id_currency_unq").on(t.id, t.currency),
  check("payment_plan_versions_values_check", sql`${t.version} > 0 and ${t.totalCents} > 0 and ${t.rowVersion} > 0 and ${t.currency} in ('USD','DOP') and length(btrim(${t.source})) > 0 and (${t.previousVersionId} is null or ${t.previousVersionId} <> ${t.id})`),
  check("payment_plan_versions_agreement_check", sql`${t.status} in ('borrador','acordado_activo','completado','sustituido') and ((${t.status} = 'borrador' and ${t.agreedAt} is null and ${t.agreementDocumentId} is null and ${t.agreementHash} is null) or (${t.status} <> 'borrador' and ${t.agreedAt} is not null and ${t.agreedAt} >= ${t.createdAt} and ${t.agreementDocumentId} is not null and ${t.agreementHash} is not null and ${t.agreementHash} ~ '^[0-9a-f]{64}$'))`),
]).enableRLS();

export const paymentInstallments = pgTable("payment_installments", {
  id: serial("id").primaryKey(),
  publicId: uuid("public_id").notNull().defaultRandom(),
  versionId: integer("version_id").notNull(),
  sequence: integer("sequence").notNull(),
  concept: text("concept").notNull(),
  dueDate: date("due_date", { mode: "string" }).notNull(),
  amountCents: bigint("amount_cents", { mode: "bigint" }).notNull(),
  currency: text("currency", { enum: CURRENCIES }).notNull(),
  ...financialFact,
}, t => [
  uniqueIndex("payment_installments_public_id_unq").on(t.publicId),
  unique("payment_installments_sequence_unq").on(t.versionId, t.sequence),
  foreignKey({ name: "payment_installments_version_currency_fk", columns: [t.versionId, t.currency], foreignColumns: [paymentPlanVersions.id, paymentPlanVersions.currency] }).onDelete("restrict").onUpdate("restrict"),
  check("payment_installments_values_check", sql`${t.sequence} > 0 and ${t.amountCents} > 0 and ${t.currency} in ('USD','DOP') and isfinite(${t.dueDate}) and length(btrim(${t.concept})) > 0 and length(btrim(${t.source})) > 0`),
]).enableRLS();

export const fxRates = pgTable("fx_rates", {
  id: serial("id").primaryKey(),
  publicId: uuid("public_id").notNull().defaultRandom(),
  baseCurrency: text("base_currency", { enum: CURRENCIES }).notNull(),
  quoteCurrency: text("quote_currency", { enum: CURRENCIES }).notNull(),
  rate: numeric("rate", { precision: 24, scale: 12 }).notNull(),
  rounding: text("rounding", { enum: ROUNDING_MODES }).notNull(),
  version: text("version").notNull(),
  effectiveAt: instant("effective_at").notNull(),
  agreementDocumentId: integer("agreement_document_id").notNull().references(() => files.id, { onDelete: "restrict", onUpdate: "restrict" }),
  ...financialFact,
}, t => [
  uniqueIndex("fx_rates_public_id_unq").on(t.publicId),
  check("fx_rates_values_check", sql`${t.baseCurrency} in ('USD','DOP') and ${t.quoteCurrency} in ('USD','DOP') and ${t.baseCurrency} <> ${t.quoteCurrency} and ${t.rate} > 0 and ${t.rate} < 1000000000000 and ${t.rounding} in ('towards_zero','floor','ceil','half_even') and length(btrim(${t.version})) > 0 and length(btrim(${t.source})) > 0`),
]).enableRLS();

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  publicId: uuid("public_id").notNull().defaultRandom(),
  reservationId: integer("reservation_id").references(() => reservations.id, { onDelete: "restrict", onUpdate: "restrict" }),
  legacyUnitSaleId: uuid("legacy_unit_sale_id").references(() => unitSales.id, { onDelete: "restrict", onUpdate: "restrict" }),
  payerId: integer("payer_id").notNull().references(() => contacts.id, { onDelete: "restrict", onUpdate: "restrict" }),
  paymentMethodId: integer("payment_method_id").notNull().references(() => paymentMethods.id, { onDelete: "restrict", onUpdate: "restrict" }),
  connectionId: integer("connection_id").references(() => integrationAccounts.id, { onDelete: "restrict", onUpdate: "restrict" }),
  externalId: text("external_id"),
  amountCents: bigint("amount_cents", { mode: "bigint" }).notNull(),
  currency: text("currency", { enum: CURRENCIES }).notNull(),
  status: text("status", { enum: ["pendiente", "confirmado", "rechazado", "reversado_parcial", "reversado_total", "contracargo"] }).notNull().default("pendiente"),
  evidenceId: integer("evidence_id").notNull().references(() => files.id, { onDelete: "restrict", onUpdate: "restrict" }),
  verifiedBy: integer("verified_by").references(() => users.id, { onDelete: "restrict", onUpdate: "restrict" }),
  verifiedAt: instant("verified_at"),
  receivedAt: instant("received_at").notNull(),
  ...transactionAuthorship,
}, t => [
  uniqueIndex("payments_public_id_unq").on(t.publicId),
  uniqueIndex("payments_external_unq").on(t.connectionId, t.externalId).where(sql`${t.externalId} is not null`),
  check("payments_origin_check", sql`num_nonnulls(${t.reservationId},${t.legacyUnitSaleId}) = 1`),
  check("payments_external_check", sql`(${t.connectionId} is null and ${t.externalId} is null) or (${t.connectionId} is not null and ${t.externalId} is not null and length(btrim(${t.externalId})) > 0)`),
  check("payments_values_check", sql`${t.amountCents} > 0 and ${t.currency} in ('USD','DOP') and ${t.rowVersion} > 0 and length(btrim(${t.source})) > 0`),
  check("payments_state_check", sql`${t.status} in ('pendiente','confirmado','rechazado','reversado_parcial','reversado_total','contracargo') and ((${t.status} = 'pendiente' and ${t.verifiedBy} is null and ${t.verifiedAt} is null) or (${t.status} <> 'pendiente' and ${t.verifiedBy} is not null and ${t.verifiedBy} <> ${t.createdBy} and ${t.verifiedAt} is not null and ${t.verifiedAt} >= ${t.createdAt}))`),
]).enableRLS();

export const paymentEvents = pgTable("payment_events", {
  id: serial("id").primaryKey(),
  publicId: uuid("public_id").notNull().defaultRandom(),
  paymentId: integer("payment_id").notNull().references(() => payments.id, { onDelete: "restrict", onUpdate: "restrict" }),
  connectionId: integer("connection_id").references(() => integrationAccounts.id, { onDelete: "restrict", onUpdate: "restrict" }),
  externalEventId: text("external_event_id"),
  eventType: text("event_type", { enum: ["presentado", "confirmado", "rechazado", "aplicado", "reverso", "contracargo"] }).notNull(),
  requestHash: text("request_hash").notNull(),
  evidenceId: integer("evidence_id").notNull().references(() => files.id, { onDelete: "restrict", onUpdate: "restrict" }),
  effectiveAt: instant("effective_at").notNull(),
  ...financialFact,
}, t => [
  uniqueIndex("payment_events_public_id_unq").on(t.publicId),
  uniqueIndex("payment_events_external_unq").on(t.connectionId, t.externalEventId).where(sql`${t.externalEventId} is not null`),
  uniqueIndex("payment_events_decision_unq").on(t.paymentId).where(sql`${t.eventType} in ('confirmado','rechazado')`),
  unique("payment_events_payment_id_unq").on(t.paymentId, t.id),
  check("payment_events_external_check", sql`(${t.connectionId} is null and ${t.externalEventId} is null) or (${t.connectionId} is not null and ${t.externalEventId} is not null and length(btrim(${t.externalEventId})) > 0)`),
  check("payment_events_values_check", sql`${t.eventType} in ('presentado','confirmado','rechazado','aplicado','reverso','contracargo') and ${t.requestHash} ~ '^[0-9a-f]{64}$' and length(btrim(${t.source})) > 0`),
]).enableRLS();

export const paymentAllocations = pgTable("payment_allocations", {
  id: serial("id").primaryKey(),
  publicId: uuid("public_id").notNull().defaultRandom(),
  paymentId: integer("payment_id").notNull().references(() => payments.id, { onDelete: "restrict", onUpdate: "restrict" }),
  installmentId: integer("installment_id").notNull().references(() => paymentInstallments.id, { onDelete: "restrict", onUpdate: "restrict" }),
  sourceAmountCents: bigint("source_amount_cents", { mode: "bigint" }).notNull(),
  appliedAmountCents: bigint("applied_amount_cents", { mode: "bigint" }).notNull(),
  sourceCurrency: text("source_currency", { enum: CURRENCIES }).notNull(),
  appliedCurrency: text("applied_currency", { enum: CURRENCIES }).notNull(),
  fxRateId: integer("fx_rate_id").references(() => fxRates.id, { onDelete: "restrict", onUpdate: "restrict" }),
  eventId: integer("event_id").notNull(),
  lineNumber: integer("line_number").notNull(),
  reversalOfId: integer("reversal_of_id").references((): AnyPgColumn => paymentAllocations.id, { onDelete: "restrict", onUpdate: "restrict" }),
  ...financialFact,
}, t => [
  uniqueIndex("payment_allocations_public_id_unq").on(t.publicId),
  unique("payment_allocations_event_line_unq").on(t.eventId, t.lineNumber),
  foreignKey({ name: "payment_allocations_payment_event_fk", columns: [t.paymentId, t.eventId], foreignColumns: [paymentEvents.paymentId, paymentEvents.id] }).onDelete("restrict").onUpdate("restrict"),
  check("payment_allocations_values_check", sql`${t.sourceAmountCents} > 0 and ${t.appliedAmountCents} > 0 and ${t.lineNumber} > 0 and ${t.sourceCurrency} in ('USD','DOP') and ${t.appliedCurrency} in ('USD','DOP') and length(btrim(${t.source})) > 0 and (${t.reversalOfId} is null or ${t.reversalOfId} <> ${t.id})`),
  check("payment_allocations_fx_check", sql`(${t.sourceCurrency} = ${t.appliedCurrency} and ${t.fxRateId} is null and ${t.sourceAmountCents} = ${t.appliedAmountCents}) or (${t.sourceCurrency} <> ${t.appliedCurrency} and ${t.fxRateId} is not null)`),
]).enableRLS();

export const allocationCarryforwards = pgTable("allocation_carryforwards", {
  id: serial("id").primaryKey(),
  allocationId: integer("allocation_id").notNull().references(() => paymentAllocations.id, { onDelete: "restrict", onUpdate: "restrict" }),
  installmentId: integer("installment_id").notNull().references(() => paymentInstallments.id, { onDelete: "restrict", onUpdate: "restrict" }),
  destinationVersionId: integer("destination_version_id").notNull(),
  currency: text("currency", { enum: CURRENCIES }).notNull(),
  amountCents: bigint("amount_cents", { mode: "bigint" }).notNull(),
  commandId: integer("command_id").notNull().references(() => transactionCommands.id, { onDelete: "restrict", onUpdate: "restrict" }),
  lineNumber: integer("line_number").notNull(),
  reversalOfId: integer("reversal_of_id").references((): AnyPgColumn => allocationCarryforwards.id, { onDelete: "restrict", onUpdate: "restrict" }),
  ...financialFact,
}, t => [
  unique("allocation_carryforwards_command_line_unq").on(t.commandId, t.lineNumber),
  foreignKey({ name: "allocation_carryforwards_version_currency_fk", columns: [t.destinationVersionId, t.currency], foreignColumns: [paymentPlanVersions.id, paymentPlanVersions.currency] }).onDelete("restrict").onUpdate("restrict"),
  check("allocation_carryforwards_values_check", sql`${t.amountCents} > 0 and ${t.lineNumber} > 0 and ${t.currency} in ('USD','DOP') and length(btrim(${t.source})) > 0 and (${t.reversalOfId} is null or ${t.reversalOfId} <> ${t.id})`),
]).enableRLS();

/** Consumo del pago, separado de las compensaciones de imputación. */
export const paymentReversals = pgTable("payment_reversals", {
  id: serial("id").primaryKey(),
  publicId: uuid("public_id").notNull().defaultRandom(),
  paymentId: integer("payment_id").notNull().references(() => payments.id, { onDelete: "restrict", onUpdate: "restrict" }),
  amountCents: bigint("amount_cents", { mode: "bigint" }).notNull(),
  currency: text("currency", { enum: CURRENCIES }).notNull(),
  eventId: integer("event_id").notNull(),
  reason: text("reason").notNull(),
  ...financialFact,
}, t => [
  uniqueIndex("payment_reversals_public_id_unq").on(t.publicId),
  unique("payment_reversals_event_unq").on(t.eventId),
  foreignKey({ name: "payment_reversals_payment_event_fk", columns: [t.paymentId, t.eventId], foreignColumns: [paymentEvents.paymentId, paymentEvents.id] }).onDelete("restrict").onUpdate("restrict"),
  check("payment_reversals_values_check", sql`${t.amountCents} > 0 and ${t.currency} in ('USD','DOP') and length(btrim(${t.reason})) > 0 and length(btrim(${t.source})) > 0`),
]).enableRLS();

/* M40 b1e · expansión de comisiones/liquidaciones; controles SQL en 0009. */
export const commissionRules = pgTable("commission_rules", {
  id: serial("id").primaryKey(),
  publicId: uuid("public_id").notNull().defaultRandom(),
  code: text("code").notNull(),
  name: text("name").notNull(),
  projectId: integer("project_id").references(() => projects.id, { onDelete: "restrict", onUpdate: "restrict" }),
  activeVersionId: integer("active_version_id").references((): AnyPgColumn => commissionRuleVersions.id, { onDelete: "restrict", onUpdate: "restrict" }),
  isActive: boolean("is_active").notNull().default(true),
  ...transactionAuthorship,
}, t => [
  uniqueIndex("commission_rules_public_id_unq").on(t.publicId),
  unique("commission_rules_code_unq").on(t.code),
  check("commission_rules_values_check", sql`length(btrim(${t.code})) > 0 and length(btrim(${t.name})) > 0 and ${t.rowVersion} > 0 and length(btrim(${t.source})) > 0`),
]).enableRLS();

/** Fórmula estructural y documento aprobado; ninguna política comercial se siembra. */
export const commissionRuleVersions = pgTable("commission_rule_versions", {
  id: serial("id").primaryKey(),
  publicId: uuid("public_id").notNull().defaultRandom(),
  ruleId: integer("rule_id").notNull().references(() => commissionRules.id, { onDelete: "restrict", onUpdate: "restrict" }),
  version: integer("version").notNull(),
  formulaKind: text("formula_kind", { enum: ["basis_points", "fixed"] }).notNull(),
  basisPoints: integer("basis_points"),
  fixedAmountCents: bigint("fixed_amount_cents", { mode: "bigint" }),
  currency: text("currency", { enum: CURRENCIES }).notNull(),
  termsDocumentId: integer("terms_document_id").notNull().references(() => files.id, { onDelete: "restrict", onUpdate: "restrict" }),
  termsHash: text("terms_hash").notNull(),
  validFrom: instant("valid_from").notNull(),
  validUntil: instant("valid_until"),
  approvedBy: integer("approved_by").notNull().references(() => users.id, { onDelete: "restrict", onUpdate: "restrict" }),
  approvedAt: instant("approved_at").notNull(),
  ...financialFact,
}, t => [
  uniqueIndex("commission_rule_versions_public_id_unq").on(t.publicId),
  unique("commission_rule_versions_number_unq").on(t.ruleId, t.version),
  check("commission_rule_versions_values_check", sql`${t.version} > 0 and ${t.currency} in ('USD','DOP') and ${t.termsHash} ~ '^[0-9a-f]{64}$' and ${t.approvedBy} <> ${t.createdBy} and ${t.approvedAt} >= ${t.createdAt} and (${t.validUntil} is null or ${t.validUntil} > ${t.validFrom}) and length(btrim(${t.source})) > 0`),
  check("commission_rule_versions_formula_check", sql`(${t.formulaKind} = 'basis_points' and ${t.basisPoints} is not null and ${t.basisPoints} between 1 and 10000 and ${t.fixedAmountCents} is null) or (${t.formulaKind} = 'fixed' and ${t.fixedAmountCents} is not null and ${t.fixedAmountCents} > 0 and ${t.basisPoints} is null)`),
]).enableRLS();

export const commissionAgreements = pgTable("commission_agreements", {
  id: serial("id").primaryKey(),
  publicId: uuid("public_id").notNull().defaultRandom(),
  dealId: integer("deal_id").notNull().references(() => deals.id, { onDelete: "restrict", onUpdate: "restrict" }),
  reservationId: integer("reservation_id").references(() => reservations.id, { onDelete: "restrict", onUpdate: "restrict" }),
  ruleVersionId: integer("rule_version_id").notNull().references(() => commissionRuleVersions.id, { onDelete: "restrict", onUpdate: "restrict" }),
  version: integer("version").notNull(),
  baseCents: bigint("base_cents", { mode: "bigint" }).notNull(),
  exclusionsCents: bigint("exclusions_cents", { mode: "bigint" }).notNull(),
  poolCents: bigint("pool_cents", { mode: "bigint" }).notNull(),
  currency: text("currency", { enum: CURRENCIES }).notNull(),
  evidenceId: integer("evidence_id").notNull().references(() => files.id, { onDelete: "restrict", onUpdate: "restrict" }),
  termsHash: text("terms_hash").notNull(),
  ...financialFact,
}, t => [
  uniqueIndex("commission_agreements_public_id_unq").on(t.publicId),
  unique("commission_agreements_number_unq").on(t.dealId, t.version),
  check("commission_agreements_values_check", sql`${t.version} > 0 and ${t.baseCents} >= 0 and ${t.exclusionsCents} between 0 and ${t.baseCents} and ${t.poolCents} > 0 and ${t.currency} in ('USD','DOP') and ${t.termsHash} ~ '^[0-9a-f]{64}$' and length(btrim(${t.source})) > 0`),
]).enableRLS();

/** Usuarios y agencias son beneficiarios reales con FK; nunca IDs polimórficos. */
export const commissionSplits = pgTable("commission_splits", {
  id: serial("id").primaryKey(),
  agreementId: integer("agreement_id").notNull().references(() => commissionAgreements.id, { onDelete: "restrict", onUpdate: "restrict" }),
  beneficiaryUserId: integer("beneficiary_user_id").references(() => users.id, { onDelete: "restrict", onUpdate: "restrict" }),
  beneficiaryAgencyId: integer("beneficiary_agency_id").references(() => agencies.id, { onDelete: "restrict", onUpdate: "restrict" }),
  amountCents: bigint("amount_cents", { mode: "bigint" }).notNull(),
  ...financialFact,
}, t => [
  unique("commission_splits_agreement_id_unq").on(t.agreementId, t.id),
  uniqueIndex("commission_splits_user_unq").on(t.agreementId, t.beneficiaryUserId).where(sql`${t.beneficiaryUserId} is not null`),
  uniqueIndex("commission_splits_agency_unq").on(t.agreementId, t.beneficiaryAgencyId).where(sql`${t.beneficiaryAgencyId} is not null`),
  check("commission_splits_values_check", sql`num_nonnulls(${t.beneficiaryUserId},${t.beneficiaryAgencyId}) = 1 and ${t.amountCents} > 0 and length(btrim(${t.source})) > 0`),
]).enableRLS();

export const commissionEntries = pgTable("commission_entries", {
  id: serial("id").primaryKey(),
  publicId: uuid("public_id").notNull().defaultRandom(),
  agreementId: integer("agreement_id").notNull(),
  splitId: integer("split_id").notNull(),
  /** Clave técnica de instancia; la evidencia contractual define el hito, no un catálogo ficticio. */
  milestoneKey: uuid("milestone_key").notNull(),
  milestoneEvidenceId: integer("milestone_evidence_id").notNull().references(() => files.id, { onDelete: "restrict", onUpdate: "restrict" }),
  originCommandId: integer("origin_command_id").notNull().references(() => transactionCommands.id, { onDelete: "restrict", onUpdate: "restrict" }),
  baseCents: bigint("base_cents", { mode: "bigint" }).notNull(),
  grossCents: bigint("gross_cents", { mode: "bigint" }).notNull(),
  currency: text("currency", { enum: CURRENCIES }).notNull(),
  status: text("status", { enum: ["esperada", "devengada", "aprobada", "exigible", "pagada", "retirada"] }).notNull().default("esperada"),
  ...transactionAuthorship,
}, t => [
  uniqueIndex("commission_entries_public_id_unq").on(t.publicId),
  unique("commission_entries_milestone_unq").on(t.agreementId, t.splitId, t.milestoneKey),
  foreignKey({ name: "commission_entries_split_fk", columns: [t.agreementId, t.splitId], foreignColumns: [commissionSplits.agreementId, commissionSplits.id] }).onDelete("restrict").onUpdate("restrict"),
  check("commission_entries_values_check", sql`${t.baseCents} >= 0 and ${t.grossCents} > 0 and ${t.currency} in ('USD','DOP') and ${t.status} in ('esperada','devengada','aprobada','exigible','pagada','retirada') and ${t.rowVersion} > 0 and length(btrim(${t.source})) > 0`),
]).enableRLS();

export const commissionEvents = pgTable("commission_events", {
  id: serial("id").primaryKey(),
  publicId: uuid("public_id").notNull().defaultRandom(),
  entryId: integer("entry_id").notNull().references(() => commissionEntries.id, { onDelete: "restrict", onUpdate: "restrict" }),
  previousState: text("previous_state").notNull(),
  state: text("state").notNull(),
  previousVersion: integer("previous_version").notNull(),
  commandId: integer("command_id").notNull().references(() => transactionCommands.id, { onDelete: "restrict", onUpdate: "restrict" }),
  paymentEventId: integer("payment_event_id").references(() => paymentEvents.id, { onDelete: "restrict", onUpdate: "restrict" }),
  evidenceId: integer("evidence_id").notNull().references(() => files.id, { onDelete: "restrict", onUpdate: "restrict" }),
  reason: text("reason").notNull(),
  ...financialFact,
}, t => [
  uniqueIndex("commission_events_public_id_unq").on(t.publicId),
  unique("commission_events_version_unq").on(t.entryId, t.previousVersion),
  unique("commission_events_command_unq").on(t.entryId, t.commandId),
  check("commission_events_transition_check", sql`(${t.previousState},${t.state}) in (('esperada','devengada'),('esperada','retirada'),('devengada','aprobada'),('aprobada','exigible'),('exigible','pagada')) and ${t.previousVersion} > 0 and length(btrim(${t.reason})) > 0 and length(btrim(${t.source})) > 0`),
]).enableRLS();

export const commissionAdjustments = pgTable("commission_adjustments", {
  id: serial("id").primaryKey(),
  publicId: uuid("public_id").notNull().defaultRandom(),
  entryId: integer("entry_id").notNull().references(() => commissionEntries.id, { onDelete: "restrict", onUpdate: "restrict" }),
  amountCents: bigint("amount_cents", { mode: "bigint" }).notNull(),
  reason: text("reason").notNull(),
  evidenceId: integer("evidence_id").notNull().references(() => files.id, { onDelete: "restrict", onUpdate: "restrict" }),
  commandId: integer("command_id").notNull().references(() => transactionCommands.id, { onDelete: "restrict", onUpdate: "restrict" }),
  approvalId: integer("approval_id").notNull().references((): AnyPgColumn => financialApprovalRequests.id, { onDelete: "restrict", onUpdate: "restrict" }),
  reversalOfId: integer("reversal_of_id").references((): AnyPgColumn => commissionAdjustments.id, { onDelete: "restrict", onUpdate: "restrict" }),
  ...financialFact,
}, t => [
  uniqueIndex("commission_adjustments_public_id_unq").on(t.publicId),
  unique("commission_adjustments_command_unq").on(t.entryId, t.commandId),
  unique("commission_adjustments_approval_unq").on(t.approvalId),
  uniqueIndex("commission_adjustments_reversal_unq").on(t.reversalOfId).where(sql`${t.reversalOfId} is not null`),
  check("commission_adjustments_values_check", sql`${t.amountCents} <> 0 and (${t.reversalOfId} is null or ${t.reversalOfId} <> ${t.id}) and length(btrim(${t.reason})) > 0 and length(btrim(${t.source})) > 0`),
]).enableRLS();

/** Solo documento privado y máscara; no números bancarios ni secretos en esta tabla. */
export const beneficiaryAccounts = pgTable("beneficiary_accounts", {
  id: serial("id").primaryKey(),
  publicId: uuid("public_id").notNull().defaultRandom(),
  beneficiaryUserId: integer("beneficiary_user_id").references(() => users.id, { onDelete: "restrict", onUpdate: "restrict" }),
  beneficiaryAgencyId: integer("beneficiary_agency_id").references(() => agencies.id, { onDelete: "restrict", onUpdate: "restrict" }),
  version: integer("version").notNull(),
  currency: text("currency", { enum: CURRENCIES }).notNull(),
  maskedAccount: text("masked_account").notNull(),
  bankDocumentId: integer("bank_document_id").notNull().references(() => files.id, { onDelete: "restrict", onUpdate: "restrict" }),
  documentHash: text("document_hash").notNull(),
  verifiedBy: integer("verified_by").notNull().references(() => users.id, { onDelete: "restrict", onUpdate: "restrict" }),
  verifiedAt: instant("verified_at").notNull(),
  ...financialFact,
}, t => [
  uniqueIndex("beneficiary_accounts_public_id_unq").on(t.publicId),
  uniqueIndex("beneficiary_accounts_user_version_unq").on(t.beneficiaryUserId, t.version).where(sql`${t.beneficiaryUserId} is not null`),
  uniqueIndex("beneficiary_accounts_agency_version_unq").on(t.beneficiaryAgencyId, t.version).where(sql`${t.beneficiaryAgencyId} is not null`),
  check("beneficiary_accounts_values_check", sql`num_nonnulls(${t.beneficiaryUserId},${t.beneficiaryAgencyId}) = 1 and ${t.version} > 0 and ${t.currency} in ('USD','DOP') and ${t.maskedAccount} ~ '^[*]{4}[0-9]{4}$' and ${t.documentHash} ~ '^[0-9a-f]{64}$' and ${t.verifiedBy} <> ${t.createdBy} and ${t.verifiedAt} >= ${t.createdAt} and length(btrim(${t.source})) > 0`),
]).enableRLS();

export const payoutBatches = pgTable("payout_batches", {
  id: serial("id").primaryKey(),
  publicId: uuid("public_id").notNull().defaultRandom(),
  currency: text("currency", { enum: CURRENCIES }).notNull(),
  status: text("status", { enum: ["borrador", "pendiente_aprobacion", "aprobado", "instruido", "parcialmente_conciliado", "conciliado", "cancelado"] }).notNull().default("borrador"),
  executionKey: uuid("execution_key").notNull(),
  totalNetCents: bigint("total_net_cents", { mode: "bigint" }).notNull(),
  instructedAt: instant("instructed_at"),
  instructedBy: integer("instructed_by").references(() => users.id, { onDelete: "restrict", onUpdate: "restrict" }),
  ...transactionAuthorship,
}, t => [
  uniqueIndex("payout_batches_public_id_unq").on(t.publicId),
  unique("payout_batches_execution_unq").on(t.executionKey),
  check("payout_batches_values_check", sql`${t.currency} in ('USD','DOP') and ${t.totalNetCents} >= 0 and ${t.rowVersion} > 0 and ${t.status} in ('borrador','pendiente_aprobacion','aprobado','instruido','parcialmente_conciliado','conciliado','cancelado') and length(btrim(${t.source})) > 0`),
  check("payout_batches_instruction_check", sql`(${t.status} in ('instruido','parcialmente_conciliado','conciliado') and ${t.instructedAt} is not null and ${t.instructedBy} is not null and ${t.instructedAt} >= ${t.createdAt}) or (${t.status} not in ('instruido','parcialmente_conciliado','conciliado') and ${t.instructedAt} is null and ${t.instructedBy} is null)`),
]).enableRLS();

export const payoutLines = pgTable("payout_lines", {
  id: serial("id").primaryKey(),
  publicId: uuid("public_id").notNull().defaultRandom(),
  batchId: integer("batch_id").notNull().references(() => payoutBatches.id, { onDelete: "restrict", onUpdate: "restrict" }),
  entryId: integer("entry_id").notNull().references(() => commissionEntries.id, { onDelete: "restrict", onUpdate: "restrict" }),
  accountId: integer("account_id").notNull().references(() => beneficiaryAccounts.id, { onDelete: "restrict", onUpdate: "restrict" }),
  grossCents: bigint("gross_cents", { mode: "bigint" }).notNull(),
  withholdingCents: bigint("withholding_cents", { mode: "bigint" }).notNull(),
  adjustmentCents: bigint("adjustment_cents", { mode: "bigint" }).notNull(),
  netCents: bigint("net_cents", { mode: "bigint" }).notNull(),
  status: text("status", { enum: ["activa", "instruida", "desconocida", "conciliada", "cancelada"] }).notNull().default("activa"),
  executionKey: uuid("execution_key").notNull(),
  externalReference: text("external_reference"),
  reconciliationEvidenceId: integer("reconciliation_evidence_id").references(() => files.id, { onDelete: "restrict", onUpdate: "restrict" }),
  reconciledBy: integer("reconciled_by").references(() => users.id, { onDelete: "restrict", onUpdate: "restrict" }),
  reconciledAt: instant("reconciled_at"),
  ...transactionAuthorship,
}, t => [
  uniqueIndex("payout_lines_public_id_unq").on(t.publicId),
  unique("payout_lines_batch_entry_unq").on(t.batchId, t.entryId),
  unique("payout_lines_execution_unq").on(t.executionKey),
  uniqueIndex("payout_lines_active_entry_unq").on(t.entryId).where(sql`${t.status} <> 'cancelada'`),
  check("payout_lines_values_check", sql`${t.grossCents} > 0 and ${t.withholdingCents} >= 0 and ${t.netCents} >= 0 and ${t.netCents}::numeric = ${t.grossCents}::numeric - ${t.withholdingCents}::numeric + ${t.adjustmentCents}::numeric and ${t.rowVersion} > 0 and ${t.status} in ('activa','instruida','desconocida','conciliada','cancelada') and length(btrim(${t.source})) > 0`),
  check("payout_lines_reconciliation_check", sql`(${t.status} = 'conciliada' and ${t.reconciliationEvidenceId} is not null and ${t.reconciledBy} is not null and ${t.reconciledAt} is not null and ${t.externalReference} is not null and length(btrim(${t.externalReference})) > 0 and ${t.reconciledAt} >= ${t.createdAt}) or (${t.status} <> 'conciliada' and ${t.reconciliationEvidenceId} is null and ${t.reconciledBy} is null and ${t.reconciledAt} is null)`),
]).enableRLS();

/** Capacidad acotada: solicitudes tipadas para lote o ajuste; no motor genérico. */
export const financialApprovalRequests = pgTable("financial_approval_requests", {
  id: serial("id").primaryKey(),
  publicId: uuid("public_id").notNull().defaultRandom(),
  batchId: integer("batch_id").references(() => payoutBatches.id, { onDelete: "restrict", onUpdate: "restrict" }),
  entryId: integer("entry_id").references(() => commissionEntries.id, { onDelete: "restrict", onUpdate: "restrict" }),
  adjustmentAmountCents: bigint("adjustment_amount_cents", { mode: "bigint" }),
  adjustmentReason: text("adjustment_reason"),
  adjustmentReversalOfId: integer("adjustment_reversal_of_id").references(() => commissionAdjustments.id, { onDelete: "restrict", onUpdate: "restrict" }),
  objectVersion: integer("object_version").notNull(),
  contentHash: text("content_hash").notNull(),
  requestedBy: integer("requested_by").notNull().references(() => users.id, { onDelete: "restrict", onUpdate: "restrict" }),
  status: text("status", { enum: ["pendiente", "aprobada", "rechazada"] }).notNull().default("pendiente"),
  decidedBy: integer("decided_by").references(() => users.id, { onDelete: "restrict", onUpdate: "restrict" }),
  decidedAt: instant("decided_at"),
  mfaVerifiedAt: instant("mfa_verified_at"),
  evidenceId: integer("evidence_id").notNull().references(() => files.id, { onDelete: "restrict", onUpdate: "restrict" }),
  expiresAt: instant("expires_at").notNull(),
  ...financialFact,
}, t => [
  uniqueIndex("financial_approval_requests_public_id_unq").on(t.publicId),
  uniqueIndex("financial_approval_requests_batch_unq").on(t.batchId).where(sql`${t.status} = 'aprobada'`),
  check("financial_approval_requests_values_check", sql`num_nonnulls(${t.batchId},${t.entryId}) = 1 and ${t.objectVersion} > 0 and ${t.contentHash} ~ '^[0-9a-f]{64}$' and ${t.expiresAt} > ${t.createdAt} and ${t.requestedBy} = ${t.createdBy} and length(btrim(${t.source})) > 0`),
  check("financial_approval_requests_target_check", sql`(${t.batchId} is not null and ${t.adjustmentAmountCents} is null and ${t.adjustmentReason} is null and ${t.adjustmentReversalOfId} is null) or (${t.entryId} is not null and ${t.adjustmentAmountCents} is not null and ${t.adjustmentAmountCents} <> 0 and ${t.adjustmentReason} is not null and length(btrim(${t.adjustmentReason})) > 0)`),
  check("financial_approval_requests_decision_check", sql`(${t.status} = 'pendiente' and ${t.decidedBy} is null and ${t.decidedAt} is null and ${t.mfaVerifiedAt} is null) or (${t.status} in ('aprobada','rechazada') and ${t.decidedBy} is not null and ${t.decidedBy} <> ${t.requestedBy} and ${t.decidedAt} is not null and ${t.decidedAt} >= ${t.createdAt} and ${t.decidedAt} < ${t.expiresAt} and (${t.status} <> 'aprobada' or (${t.mfaVerifiedAt} is not null and ${t.mfaVerifiedAt} <= ${t.decidedAt} and ${t.mfaVerifiedAt} >= ${t.createdAt})))`),
]).enableRLS();

export const legacyCommissionLinks = pgTable("legacy_commission_links", {
  id: serial("id").primaryKey(),
  legacyCommissionId: integer("legacy_commission_id").notNull().references(() => commissions.id, { onDelete: "restrict", onUpdate: "restrict" }),
  beneficiaryRole: text("beneficiary_role", { enum: ["broker", "agency"] }).notNull(),
  entryId: integer("entry_id").references(() => commissionEntries.id, { onDelete: "restrict", onUpdate: "restrict" }),
  migrationStatus: text("migration_status", { enum: ["pendiente", "validada"] }).notNull().default("pendiente"),
  evidenceId: integer("evidence_id").notNull().references(() => files.id, { onDelete: "restrict", onUpdate: "restrict" }),
  ...financialFact,
}, t => [
  unique("legacy_commission_links_role_unq").on(t.legacyCommissionId, t.beneficiaryRole),
  uniqueIndex("legacy_commission_links_entry_unq").on(t.entryId).where(sql`${t.entryId} is not null`),
  check("legacy_commission_links_values_check", sql`${t.beneficiaryRole} in ('broker','agency') and ((${t.migrationStatus} = 'pendiente' and ${t.entryId} is null) or (${t.migrationStatus} = 'validada' and ${t.entryId} is not null)) and length(btrim(${t.source})) > 0`),
]).enableRLS();
