import type { PermissionResource } from "@/domain/catalogs";

/**
 * Registro único y canónico de los 22 módulos del CRM Quisqueya Home.
 * Fuente de verdad para navegación, RBAC y generación de menús.
 * Orden, textos y recursos se mantienen idénticos a la navegación previa (modulos.ts).
 * No se añade ni quita funcionalidad; solo centraliza metadatos.
 */

export type EstadoModulo = "real" | "parcial" | "demo";

export type ModuloRegistro = {
  /** Identificador estable (Mxx o slug único) */
  id: string;
  /** Nombre visible exacto que ve el usuario (no cambiar) */
  nombre: string;
  /** Id histórico en la navegación (MODULOS) cuando difiere del id único del registro */
  idLegado?: string;
  /** Ruta base (empieza con /) */
  rutaBase: string;
  /** Icono Lucide name si aplica */
  icono?: string;
  /** Recurso RBAC exacto para permisos (debe existir en PERMISSION_RESOURCES) */
  recurso: PermissionResource;
  /** Subrutas / pestañas hijas bajo esta base (para grupos en nav) */
  subrutas?: readonly string[];
  /** Estado de implementación para migración por fases */
  estado: EstadoModulo;
};

/** Los 22 módulos en orden de aparición en la navegación canónica (sin alterar orden). */
export const REGISTRO_MODULOS: readonly ModuloRegistro[] = [
  // Módulos adicionales / workspaces (aparecen primero en MODULOS)
  {
    id: "M16",
    nombre: "Aprobaciones",
    rutaBase: "/aprobaciones",
    icono: "CheckSquare",
    recurso: "dashboard",
    subrutas: ["/aprobaciones"],
    estado: "parcial",
  },
  {
    id: "M17",
    nombre: "Reservas y cobros",
    rutaBase: "/reservas",
    icono: "BadgeDollarSign",
    recurso: "deals",
    subrutas: [
      "/reservas",
      "/reservas/holds",
      "/reservas/cartera",
      "/reservas/conciliacion",
      "/reservas/facturacion",
      "/reservas/excepciones",
      "/reservas/documentos",
      "/reservas/[id]",
      "/reservas/[id]/plan",
    ],
    estado: "real",
  },
  {
    id: "M18",
    nombre: "Documentos",
    rutaBase: "/documentos",
    icono: "Briefcase",
    recurso: "deals",
    subrutas: ["/documentos", "/documentos/kyc", "/documentos/firmas"],
    estado: "parcial",
  },
  {
    id: "M19",
    nombre: "Posventa",
    rutaBase: "/posventa",
    icono: "Building2",
    recurso: "projects",
    subrutas: ["/posventa"],
    estado: "parcial",
  },
  {
    id: "M20",
    nombre: "Portal",
    rutaBase: "/portal",
    icono: "Settings",
    recurso: "settings",
    subrutas: ["/portal", "/portal/catalogo", "/portal/comprador", "/portal/promotor", "/portal/publicacion"],
    estado: "demo",
  },
  {
    id: "M21",
    nombre: "Comunidad",
    rutaBase: "/comunidad",
    icono: "Users",
    recurso: "brokers",
    subrutas: ["/comunidad", "/comunidad/demandas", "/comunidad/eventos", "/comunidad/moderacion"],
    estado: "demo",
  },
  {
    id: "M22",
    nombre: "Automatizaciones",
    rutaBase: "/automatizaciones",
    icono: "Settings",
    recurso: "settings",
    subrutas: ["/automatizaciones"],
    estado: "demo",
  },
  // Espacio Comercial & Clientes
  {
    id: "M14",
    nombre: "Inicio",
    rutaBase: "/inicio",
    icono: "LayoutDashboard",
    recurso: "dashboard",
    subrutas: ["/inicio", "/aprobaciones"],
    estado: "parcial",
  },
  {
    id: "M2",
    nombre: "Leads",
    rutaBase: "/leads",
    icono: "UserPlus",
    recurso: "leads",
    subrutas: ["/leads", "/leads/[id]", "/leads/asignacion", "/leads/duplicados", "/leads/importaciones"],
    estado: "real",
  },
  {
    id: "M3",
    nombre: "Negocios",
    rutaBase: "/negocios",
    icono: "Kanban",
    recurso: "deals",
    subrutas: ["/negocios", "/negocios/[id]"],
    estado: "real",
  },
  {
    id: "M1",
    nombre: "Contactos",
    rutaBase: "/contactos",
    icono: "Users",
    recurso: "contacts",
    subrutas: [
      "/contactos",
      "/contactos/[id]",
      "/contactos/[id]/relaciones",
      "/contactos/[id]/privacidad",
      "/contactos/empresas",
      "/contactos/demandas",
      "/contactos/demandas/[id]",
    ],
    estado: "real",
  },
  // Operaciones
  {
    id: "M5",
    nombre: "Propiedades",
    rutaBase: "/propiedades",
    icono: "Building2",
    recurso: "projects",
    subrutas: ["/propiedades", "/propiedades/[slug]"],
    estado: "real",
  },
  {
    id: "M6",
    nombre: "Avances de obra",
    rutaBase: "/avances",
    icono: "HardHat",
    recurso: "construction_phases",
    subrutas: ["/avances"],
    estado: "real",
  },
  {
    id: "M4-agenda",
    idLegado: "M4",
    nombre: "Agenda",
    rutaBase: "/agenda",
    icono: "Calendar",
    recurso: "activities",
    subrutas: ["/agenda", "/agenda/calendario", "/agenda/visitas", "/agenda/viajes"],
    estado: "real",
  },
  {
    id: "M4-tareas",
    idLegado: "M4",
    nombre: "Tareas",
    rutaBase: "/tareas",
    icono: "CheckSquare",
    recurso: "activities",
    subrutas: ["/tareas", "/tareas/recurrencias"],
    estado: "real",
  },
  // Brokerage
  {
    id: "M7",
    nombre: "Brokers",
    rutaBase: "/brokers",
    icono: "Briefcase",
    recurso: "brokers",
    subrutas: [
      "/brokers",
      "/brokers/[id]",
      "/brokers/mi-espacio",
      "/brokers/alcance",
      "/brokers/proteccion",
      "/brokers/cooperacion",
      "/brokers/onboarding",
      "/brokers/salida",
    ],
    estado: "real",
  },
  {
    id: "M8",
    nombre: "Metas",
    rutaBase: "/metas",
    icono: "Target",
    recurso: "goals",
    subrutas: ["/metas"],
    estado: "real",
  },
  {
    id: "M9",
    nombre: "Comisiones",
    rutaBase: "/comisiones",
    icono: "BadgeDollarSign",
    recurso: "commissions",
    subrutas: ["/comisiones", "/comisiones/reglas", "/comisiones/liquidaciones", "/comisiones/liquidaciones/[id]"],
    estado: "real",
  },
  // Herramientas
  {
    id: "M11",
    nombre: "Comunicaciones",
    rutaBase: "/comunicaciones",
    icono: "MessageSquare",
    recurso: "communications",
    subrutas: ["/comunicaciones", "/comunicaciones/bandeja", "/comunicaciones/campanas", "/comunicaciones/actividad"],
    estado: "parcial",
  },
  {
    id: "M12",
    nombre: "Reportes",
    rutaBase: "/reportes",
    icono: "BarChart3",
    recurso: "reports",
    subrutas: ["/reportes"],
    estado: "parcial",
  },
  {
    id: "M10",
    nombre: "Academy",
    rutaBase: "/academy",
    icono: "GraduationCap",
    recurso: "academy",
    subrutas: ["/academy", "/academy/administracion"],
    estado: "parcial",
  },
  {
    id: "M13",
    nombre: "Configuración",
    rutaBase: "/configuracion",
    icono: "Settings",
    recurso: "settings",
    subrutas: ["/configuracion", "/portal", "/automatizaciones"],
    estado: "real",
  },
] as const;

/** Helper: obtener módulo por ruta base */
export function getModuloPorRuta(ruta: string): ModuloRegistro | undefined {
  return REGISTRO_MODULOS.find((m) => m.rutaBase === ruta);
}

/** Helper: todas las rutas planas (base + sub) */
export function getTodasLasRutas(): readonly string[] {
  return REGISTRO_MODULOS.flatMap((m) => m.subrutas ?? [m.rutaBase]);
}
