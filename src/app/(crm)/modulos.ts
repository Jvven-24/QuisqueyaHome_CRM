/**
 * Los 22 módulos del CRM — ahora generados desde el registro central src/modules/registry.ts
 * para la modularización (sin cambiar orden, textos, recursos ni permisos visibles).
 *
 * Mantiene compatibilidad total con la lista canónica de `MAPEO_FRONTEND_CRM.md` §18
 * y `.github/CODEOWNERS`.
 */

import type { PermissionResource } from "@/domain/catalogs";
import { REGISTRO_MODULOS, generarEntradasN1Base } from "../../modules/registry.ts";

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

// Metadatos adicionales (workspace, descripciones, atajos) se mantienen EXACTOS para no cambiar UI visible.
// El listado base + orden + nombre + recurso + icono + subrutas viene del registry.
const META: Record<string, { workspaceId: WorkspaceId; descripcion: string; atajo?: string; badge?: string }> = {
  "M16": { workspaceId: "comercial", descripcion: "Descuentos, reservas y liquidaciones pendientes", atajo: "G Q" },
  "M17": { workspaceId: "brokerage", descripcion: "Reservas de unidades y seguimiento de cobros", atajo: "G V" },
  "M18": { workspaceId: "comercial", descripcion: "Expediente documental de cada negocio", atajo: "G D" },
  "M19": { workspaceId: "operaciones", descripcion: "Entrega y seguimiento de cada propiedad", atajo: "G Z" },
  "M20": { workspaceId: "herramientas", descripcion: "Configuración del portal y acceso de clientes", atajo: "G H" },
  "M21": { workspaceId: "brokerage", descripcion: "Comunidad y colaboración de la red", atajo: "G U" },
  "M22": { workspaceId: "herramientas", descripcion: "Flujos y reglas de automatización", atajo: "G F" },
  "M14": { workspaceId: "comercial", descripcion: "Resumen ejecutivo y tablero operativo del día", atajo: "G I" },
  "M2": { workspaceId: "comercial", descripcion: "Captación, calificación y gestión de prospectos", atajo: "G L" },
  "M3": { workspaceId: "comercial", descripcion: "Embudo comercial de oportunidades y cierres de venta", atajo: "G P" },
  "M1": { workspaceId: "comercial", descripcion: "Directorio unificado de clientes e inversionistas", atajo: "G C" },
  "M5": { workspaceId: "operaciones", descripcion: "Catálogo maestro de proyectos, tipologías y unidades", atajo: "G R" },
  "M6": { workspaceId: "operaciones", descripcion: "Seguimiento fotográfico y cronograma constructivo", atajo: "G O" },
  "M4-agenda": { workspaceId: "operaciones", descripcion: "Citas con clientes, visitas a proyectos y reuniones", atajo: "G A" },
  "M4-tareas": { workspaceId: "operaciones", descripcion: "Actividades operativas y tareas pendientes de seguimiento", atajo: "G T" },
  "M7": { workspaceId: "brokerage", descripcion: "Red de intermediarios inmobiliarios y agencias aliadas", atajo: "G B" },
  "M8": { workspaceId: "brokerage", descripcion: "Objetivos mensuales, trimestrales y KPIs comerciales", atajo: "G M" },
  "M9": { workspaceId: "brokerage", descripcion: "Liquidación y cálculo de comisiones por venta cerrada", atajo: "G $" },
  "M11": { workspaceId: "herramientas", descripcion: "Mensajería, WhatsApp y plantillas de contacto", atajo: "G W" },
  "M12": { workspaceId: "herramientas", descripcion: "Métricas consolidadas, ratios de conversión e inteligencia", atajo: "G X" },
  "M10": { workspaceId: "herramientas", descripcion: "Centro de capacitación y recursos para brokers y asesores", atajo: "G Y" },
  "M13": { workspaceId: "herramientas", descripcion: "Ajustes del sistema, parámetros de seguridad y preferencias", atajo: "G S" },
};

export const MODULOS: readonly Modulo[] = REGISTRO_MODULOS.map((r) => {
  const meta = META[r.id] ?? { workspaceId: "herramientas" as WorkspaceId, descripcion: r.nombre };
  return {
    id: r.idLegado ?? r.id,
    ruta: r.rutaBase,
    nombre: r.nombre,
    recurso: r.recurso,
    workspaceId: meta.workspaceId,
    icono: r.icono ?? "Circle",
    descripcion: meta.descripcion,
    atajo: meta.atajo,
    ...(meta.badge ? { badge: meta.badge } : {}),
  };
})

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

// Generado desde registry (sin rutas hardcodeadas)
const _n1 = generarEntradasN1Base();
export const ENTRADAS_N1: readonly EntradaN1[] = _n1.map((e) => ({
  id: e.id,
  ruta: e.ruta,
  nombre: e.nombre,
  recurso: e.recurso,
  icono: e.icono,
  descripcion: e.descripcion,
  atajo: e.atajo,
  ...(e.rutasHijas ? { rutasHijas: e.rutasHijas } : {}),
})) as readonly EntradaN1[];

// Pie derivado desde registry
const findPie = (id: string) => REGISTRO_MODULOS.find(m => m.id === id);
const academy = findPie("M10");
const config = findPie("M13");
export const ENTRADAS_PIE: readonly EntradaN1[] = [
  { id: "PIE_ACADEMY", ruta: academy?.rutaBase || "/academy", nombre: academy?.nombre || "Academy", recurso: academy?.recurso || "academy", icono: academy?.icono || "GraduationCap", descripcion: "Centro de capacitación y recursos para brokers y asesores", atajo: "G Y" },
  { id: "PIE_CONFIGURACION", rutasHijas: ["/configuracion", "/portal", "/automatizaciones"], ruta: config?.rutaBase || "/configuracion", nombre: config?.nombre || "Configuración", recurso: config?.recurso || "settings", icono: config?.icono || "Settings", descripcion: "Ajustes del sistema, parámetros de seguridad y preferencias", atajo: "G S" },
];



