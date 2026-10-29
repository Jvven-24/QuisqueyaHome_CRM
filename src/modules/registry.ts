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
  /** Permisos específicos del módulo (acciones sobre el recurso) */
  permisos?: readonly string[];
  /** Metadatos de navegación generados/consolidados */
  navegacion?: {
    workspaceId?: "comercial" | "operaciones" | "brokerage" | "herramientas";
    descripcion?: string;
    atajo?: string;
    grupo?: string;
  };
  /** Flags de feature y estado */
  flags?: {
    visibleEnMenu?: boolean;
    requiereFeatureFlag?: string;
  };
};

/** Los 22 módulos en orden de aparición en la navegación canónica (sin alterar orden). */
export const REGISTRO_MODULOS: readonly ModuloRegistro[] = [
  // Módulos adicionales / workspaces (aparecen primero en MODULOS)
  {
    id: "M16",
    permisos: ["view", "aprobar"],
    navegacion: { workspaceId: "comercial", descripcion: "Descuentos, reservas y liquidaciones pendientes", atajo: "G Q" },
    flags: { visibleEnMenu: true },
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
    permisos: ["view", "create", "import"],
    navegacion: { workspaceId: "comercial", descripcion: "Captación, calificación y gestión de prospectos", atajo: "G L" },
    flags: { visibleEnMenu: true },
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


/** Genera lista de permisos únicos desde el registro (sin hardcode) */
export function getPermisosDesdeRegistro(): readonly string[] {
  const set = new Set<string>();
  for (const m of REGISTRO_MODULOS) {
    set.add(m.recurso);
    if (m.permisos) m.permisos.forEach((p: string) => set.add(p));
  }
  return Array.from(set);
}

/** Definición de una entrada de navegación N1 (referencias a módulos del registro) */
type DefinicionEntradaN1 = {
  id: string;
  refs: readonly string[];
  hijasRefs?: readonly string[];
  nombre?: string;
  descripcion?: string;
  atajo?: string;
};

/** Entrada de navegación N1 generada desde el registro */
export type EntradaN1Base = {
  id: string;
  ruta: string;
  nombre: string;
  recurso: PermissionResource;
  icono: string;
  descripcion: string;
  atajo: string;
  rutasHijas: string[] | undefined;
};

/** Generador de entradas de navegación base desde registry (rutas NO hardcodeadas) */
export function generarEntradasN1Base(): EntradaN1Base[] {
  const find = (id: string) => REGISTRO_MODULOS.find(m => m.id === id || m.idLegado === id);
  const mk = (g: DefinicionEntradaN1): EntradaN1Base => {
    const base = find(g.refs[0]!);
    if (!base) throw new Error(`registry: módulo inexistente "${g.refs[0]}" en la entrada ${g.id}`);
    const faltante = (g.hijasRefs || []).find((r: string) => !find(r));
    if (faltante) throw new Error(`registry: módulo hijo inexistente "${faltante}" en la entrada ${g.id}`);
    const hijas = (g.hijasRefs || g.refs).map((r: string) => find(r)?.rutaBase).filter(Boolean) as string[];
    return {
      id: g.id,
      ruta: base.rutaBase,
      nombre: g.nombre || base?.nombre || g.id,
      recurso: base.recurso,
      icono: base?.icono || "Circle",
      descripcion: g.descripcion || base?.nombre || "",
      atajo: g.atajo || "",
      rutasHijas: hijas.length > 1 ? hijas : undefined,
    };
  };
  const definiciones: DefinicionEntradaN1[] = [
    { id: "N1_INICIO", refs: ["M14"], hijasRefs: ["M14", "M16"], nombre: "Inicio", descripcion: "Resumen ejecutivo y tablero operativo del día", atajo: "G I" },
    { id: "N1_LEADS", refs: ["M2"], nombre: "Leads", descripcion: "Captación, calificación y gestión de prospectos", atajo: "G L" },
    { id: "N1_NEGOCIOS", refs: ["M3"], hijasRefs: ["M3", "M18"], nombre: "Negocios", descripcion: "Embudo comercial de oportunidades y cierres de venta", atajo: "G P" },
    { id: "N1_CONTACTOS", refs: ["M1"], nombre: "Contactos", descripcion: "Directorio unificado de clientes e inversionistas", atajo: "G C" },
    { id: "N1_INVENTARIO", refs: ["M5"], hijasRefs: ["M5", "M6", "M19"], nombre: "Inventario y Obra", descripcion: "Catálogo de proyectos, tipologías y avance constructivo", atajo: "G R" },
    { id: "N1_AGENDA", refs: ["M4-agenda", "M4-tareas"], hijasRefs: ["M4-agenda", "M4-tareas"], nombre: "Agenda y Tareas", descripcion: "Citas con clientes, visitas y actividades operativas", atajo: "G A" },
    { id: "N1_COMUNICACIONES", refs: ["M11"], nombre: "Comunicaciones", descripcion: "Mensajería, WhatsApp y plantillas de contacto", atajo: "G W" },
    { id: "N1_BROKERS", refs: ["M7"], hijasRefs: ["M7", "M21"], nombre: "Red de Brokers", descripcion: "Red de intermediarios inmobiliarios y agencias aliadas", atajo: "G B" },
    { id: "N1_FINANZAS", refs: ["M9"], hijasRefs: ["M9", "M8", "M12", "M17"], nombre: "Finanzas & Reportes", descripcion: "Comisiones, metas comerciales e inteligencia analítica", atajo: "G $" },
  ];
  return definiciones.map(mk);
}

export const REGISTRO_VERSION = "1.1-manifiesto-completo" as const;

