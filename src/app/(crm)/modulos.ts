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
