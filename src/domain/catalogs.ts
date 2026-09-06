/**
 * Catálogos cerrados y vocabulario del dominio.
 *
 * Viven en `domain/` y no junto al esquema porque son reglas de negocio: qué
 * acciones existen, sobre qué recursos y con qué alcance. El esquema los importa
 * para tipar sus columnas — la dependencia va de infraestructura a dominio, no
 * al revés.
 *
 * Todas son listas cerradas a propósito: con varias personas construyendo
 * módulos en paralelo, un `"Leads"` frente a un `"leads"` haría que un permiso
 * deje de aplicarse sin que nadie lo note.
 */


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

/** Alcance de datos. `own` es lo que el prototipo fingía comparando nombres. */
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

/**
 * Acciones que se registran en `audit_log` (T6). Lista corta y explícita a
 * propósito — `MAPEO_FRONTEND_CRM.md` §4 pide «acción sensible», no «cualquier
 * escritura»: crear/editar/eliminar/restaurar de un registro, más las cuatro
 * transiciones de negocio que el mapeo señala aparte porque cambian estado de
 * forma irreversible o casi (convertir un lead, cambiar de etapa, cerrar,
 * marcar como perdido). Texto libre aquí repetiría el error que el resto de
 * catálogos evita: un `"Editar"` frente a un `"editar"` deja de agruparse en
 * el historial sin que nadie lo note.
 */
export const AUDIT_ACTIONS = [
  "crear",
  "editar",
  "eliminar",
  "restaurar",
  "convertir",
  "cambiar_etapa",
  "cerrar",
  "marcar_perdido",
  /**
   * M2 · Leads: descartar un lead no es borrarlo (`eliminar` es borrado
   * lógico del registro, `deleted_at`) ni convertirlo — es una transición de
   * estado de negocio propia, igual que `marcar_perdido` lo es para negocios.
   */
  "descartar",
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

export type PermissionResource = (typeof PERMISSION_RESOURCES)[number];
export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];
export type PermissionScope = (typeof PERMISSION_SCOPES)[number];
export type EntityType = (typeof ENTITY_TYPES)[number];
export type StageKind = (typeof STAGE_KINDS)[number];
export type AuditAction = (typeof AUDIT_ACTIONS)[number];
