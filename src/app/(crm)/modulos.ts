/**
 * Los 15 módulos del CRM agrupados por Espacios de Trabajo (Workspaces).
 *
 * Mantiene compatibilidad total con la lista canónica de `MAPEO_FRONTEND_CRM.md` §18
 * y `.github/CODEOWNERS`, incorporando metadatos para la nueva arquitectura
 * de navegación editorial: iconos Lucide, descripción, atajos y agrupación.
 */

import type { PermissionResource } from "@/domain/catalogs";

export type WorkspaceId =
  | "comercial"
  | "operaciones"
  | "brokerage"
  | "herramientas";

export type Workspace = {
  id: WorkspaceId;
  nombre: string;
  descripcion: string;
  badge?: string;
};

export type Modulo = {
  id: string;
  ruta: string;
  nombre: string;
  recurso: PermissionResource;
  workspaceId: WorkspaceId;
  icono: string;
  descripcion: string;
  atajo?: string;
  badge?: string;
};

export const WORKSPACES: readonly Workspace[] = [
  {
    id: "comercial",
    nombre: "Comercial & Clientes",
    descripcion: "Gestión comercial, prospección de leads y funnel de ventas",
  },
  {
    id: "operaciones",
    nombre: "Operaciones & Activos",
    descripcion: "Inventario inmobiliario, avance de obra y compromisos",
  },
  {
    id: "brokerage",
    nombre: "Red & Finanzas",
    descripcion: "Red de brokers, seguimiento de metas y liquidación",
  },
  {
    id: "herramientas",
    nombre: "Inteligencia & Config",
    descripcion: "Comunicaciones omnicanal, reportes ejecutivos y ajustes",
  },
];

export const MODULOS: readonly Modulo[] = [
  {"id":"M16","ruta":"/aprobaciones","nombre":"Aprobaciones","recurso":"dashboard","workspaceId":"comercial","icono":"CheckSquare","descripcion":"Descuentos, reservas y liquidaciones pendientes","atajo":"G Q"},
  {"id":"M17","ruta":"/reservas","nombre":"Reservas y cobros","recurso":"deals","workspaceId":"brokerage","icono":"BadgeDollarSign","descripcion":"Reservas de unidades y seguimiento de cobros","atajo":"G V"},
  {"id":"M18","ruta":"/documentos","nombre":"Documentos","recurso":"deals","workspaceId":"comercial","icono":"Briefcase","descripcion":"Expediente documental de cada negocio","atajo":"G D"},
  {"id":"M19","ruta":"/posventa","nombre":"Posventa","recurso":"projects","workspaceId":"operaciones","icono":"Building2","descripcion":"Entrega y seguimiento de cada propiedad","atajo":"G Z"},
  {"id":"M20","ruta":"/portal","nombre":"Portal","recurso":"settings","workspaceId":"herramientas","icono":"Settings","descripcion":"Configuración del portal y acceso de clientes","atajo":"G H"},
  {"id":"M21","ruta":"/comunidad","nombre":"Comunidad","recurso":"brokers","workspaceId":"brokerage","icono":"Users","descripcion":"Comunidad y colaboración de la red","atajo":"G U"},
  {"id":"M22","ruta":"/automatizaciones","nombre":"Automatizaciones","recurso":"settings","workspaceId":"herramientas","icono":"Settings","descripcion":"Flujos y reglas de automatización","atajo":"G F"},
  // Espacio 1: Comercial & Clientes
  {
    id: "M14",
    ruta: "/inicio",
    nombre: "Inicio",
    recurso: "dashboard",
    workspaceId: "comercial",
    icono: "LayoutDashboard",
    descripcion: "Resumen ejecutivo y tablero operativo del día",
    atajo: "G I",
  },
  {
    id: "M2",
    ruta: "/leads",
    nombre: "Leads",
    recurso: "leads",
    workspaceId: "comercial",
    icono: "UserPlus",
    descripcion: "Captación, calificación y gestión de prospectos",
    atajo: "G L",
  },
  {
    id: "M3",
    ruta: "/negocios",
    nombre: "Negocios",
    recurso: "deals",
    workspaceId: "comercial",
    icono: "Kanban",
    descripcion: "Embudo comercial de oportunidades y cierres de venta",
    atajo: "G P",
  },
  {
    id: "M1",
    ruta: "/contactos",
    nombre: "Contactos",
    recurso: "contacts",
    workspaceId: "comercial",
    icono: "Users",
    descripcion: "Directorio unificado de clientes e inversionistas",
    atajo: "G C",
  },

  // Espacio 2: Operaciones & Activos
  {
    id: "M5",
    ruta: "/propiedades",
    nombre: "Propiedades",
    recurso: "projects",
    workspaceId: "operaciones",
    icono: "Building2",
    descripcion: "Catálogo maestro de proyectos, tipologías y unidades",
    atajo: "G R",
  },
  {
    id: "M6",
    ruta: "/avances",
    nombre: "Avances de obra",
    recurso: "construction_phases",
    workspaceId: "operaciones",
    icono: "HardHat",
    descripcion: "Seguimiento fotográfico y cronograma constructivo",
    atajo: "G O",
  },
  {
    id: "M4",
    ruta: "/agenda",
    nombre: "Agenda",
    recurso: "activities",
    workspaceId: "operaciones",
    icono: "Calendar",
    descripcion: "Citas con clientes, visitas a proyectos y reuniones",
    atajo: "G A",
  },
  {
    id: "M4",
    ruta: "/tareas",
    nombre: "Tareas",
    recurso: "activities",
    workspaceId: "operaciones",
    icono: "CheckSquare",
    descripcion: "Actividades operativas y tareas pendientes de seguimiento",
    atajo: "G T",
  },

  // Espacio 3: Red & Finanzas
  {
    id: "M7",
    ruta: "/brokers",
    nombre: "Brokers",
    recurso: "brokers",
    workspaceId: "brokerage",
    icono: "Briefcase",
    descripcion: "Red de intermediarios inmobiliarios y agencias aliadas",
    atajo: "G B",
  },
  {
    id: "M8",
    ruta: "/metas",
    nombre: "Metas",
    recurso: "goals",
    workspaceId: "brokerage",
    icono: "Target",
    descripcion: "Objetivos mensuales, trimestrales y KPIs comerciales",
    atajo: "G M",
  },
  {
    id: "M9",
    ruta: "/comisiones",
    nombre: "Comisiones",
    recurso: "commissions",
    workspaceId: "brokerage",
    icono: "BadgeDollarSign",
    descripcion: "Liquidación y cálculo de comisiones por venta cerrada",
    atajo: "G $",
  },

  // Espacio 4: Inteligencia & Herramientas
  {
    id: "M11",
    ruta: "/comunicaciones",
    nombre: "Comunicaciones",
    recurso: "communications",
    workspaceId: "herramientas",
    icono: "MessageSquare",
    descripcion: "Mensajería, WhatsApp y plantillas de contacto",
    atajo: "G W",
  },
  {
    id: "M12",
    ruta: "/reportes",
    nombre: "Reportes",
    recurso: "reports",
    workspaceId: "herramientas",
    icono: "BarChart3",
    descripcion: "Métricas consolidadas, ratios de conversión e inteligencia",
    atajo: "G X",
  },
  {
    id: "M10",
    ruta: "/academy",
    nombre: "Academy",
    recurso: "academy",
    workspaceId: "herramientas",
    icono: "GraduationCap",
    descripcion: "Centro de capacitación y recursos para brokers y asesores",
    atajo: "G Y",
  },
  {
    id: "M13",
    ruta: "/configuracion",
    nombre: "Configuración",
    recurso: "settings",
    workspaceId: "herramientas",
    icono: "Settings",
    descripcion: "Ajustes del sistema, parámetros de seguridad y preferencias",
    atajo: "G S",
  },
];

export type EntradaN1 = {
  id: string;
  ruta: string;
  nombre: string;
  recurso: PermissionResource;
  icono: string;
  descripcion: string;
  atajo?: string;
  rutasHijas?: readonly string[];
};

/**
 * Entradas de navegación N1 consolidadas por rol (D04/D05).
 * 9 entradas directas en SidebarContent; 2 entradas ancladas en SidebarFooter.
 */
export const ENTRADAS_N1: readonly EntradaN1[] = [
  {
    id: "N1_INICIO",
    rutasHijas: ["/inicio", "/aprobaciones"],
    ruta: "/inicio",
    nombre: "Inicio",
    recurso: "dashboard",
    icono: "LayoutDashboard",
    descripcion: "Resumen ejecutivo y tablero operativo del día",
    atajo: "G I",
  },
  {
    id: "N1_LEADS",
    ruta: "/leads",
    nombre: "Leads",
    recurso: "leads",
    icono: "UserPlus",
    descripcion: "Captación, calificación y gestión de prospectos",
    atajo: "G L",
  },
  {
    id: "N1_NEGOCIOS",
    rutasHijas: ["/negocios", "/documentos"],
    ruta: "/negocios",
    nombre: "Negocios",
    recurso: "deals",
    icono: "Kanban",
    descripcion: "Embudo comercial de oportunidades y cierres de venta",
    atajo: "G P",
  },
  {
    id: "N1_CONTACTOS",
    ruta: "/contactos",
    nombre: "Contactos",
    recurso: "contacts",
    icono: "Users",
    descripcion: "Directorio unificado de clientes e inversionistas",
    atajo: "G C",
  },
  {
    id: "N1_INVENTARIO",
    ruta: "/propiedades",
    nombre: "Inventario y Obra",
    recurso: "projects",
    icono: "Building2",
    descripcion: "Catálogo de proyectos, tipologías y avance constructivo",
    atajo: "G R",
    rutasHijas: ["/propiedades", "/avances", "/posventa"],
  },
  {
    id: "N1_AGENDA",
    ruta: "/agenda",
    nombre: "Agenda y Tareas",
    recurso: "activities",
    icono: "Calendar",
    descripcion: "Citas con clientes, visitas y actividades operativas",
    atajo: "G A",
    rutasHijas: ["/agenda", "/tareas"],
  },
  {
    id: "N1_COMUNICACIONES",
    ruta: "/comunicaciones",
    nombre: "Comunicaciones",
    recurso: "communications",
    icono: "MessageSquare",
    descripcion: "Mensajería, WhatsApp y plantillas de contacto",
    atajo: "G W",
  },
  {
    id: "N1_BROKERS",
    rutasHijas: ["/brokers", "/comunidad"],
    ruta: "/brokers",
    nombre: "Red de Brokers",
    recurso: "brokers",
    icono: "Briefcase",
    descripcion: "Red de intermediarios inmobiliarios y agencias aliadas",
    atajo: "G B",
  },
  {
    id: "N1_FINANZAS",
    ruta: "/comisiones",
    nombre: "Finanzas & Reportes",
    recurso: "commissions",
    icono: "BadgeDollarSign",
    descripcion: "Comisiones, metas comerciales e inteligencia analítica",
    atajo: "G $",
    rutasHijas: ["/comisiones", "/metas", "/reportes", "/reservas"],
  },
];

export const ENTRADAS_PIE: readonly EntradaN1[] = [
  {
    id: "PIE_ACADEMY",
    ruta: "/academy",
    nombre: "Academy",
    recurso: "academy",
    icono: "GraduationCap",
    descripcion: "Centro de capacitación y recursos para brokers y asesores",
    atajo: "G Y",
  },
  {
    id: "PIE_CONFIGURACION",
    rutasHijas: ["/configuracion", "/portal", "/automatizaciones"],
    ruta: "/configuracion",
    nombre: "Configuración",
    recurso: "settings",
    icono: "Settings",
    descripcion: "Ajustes del sistema, parámetros de seguridad y preferencias",
    atajo: "G S",
  },
];
