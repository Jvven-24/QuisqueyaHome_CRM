/**
 * Los 15 módulos del CRM (T7).
 *
 * Una sola lista que gobierna la navegación y sirve de índice de las carpetas de
 * ruta. Las rutas son exactamente las de `MAPEO_FRONTEND_CRM.md` §18, que son
 * las mismas que `.github/CODEOWNERS`: si una se renombra aquí y allí no, el
 * repositorio deja de asignar revisores y nadie se entera.
 *
 * `recurso` es el permiso que se comprueba para mostrar la entrada. Ocultar el
 * enlace es comodidad, no seguridad: el permiso real se verifica en servidor en
 * cada caso de uso (§16, criterio #1).
 */

import type { PermissionResource } from "@/domain/catalogs";

export type Modulo = {
  id: string;
  ruta: string;
  nombre: string;
  recurso: PermissionResource;
};

export const MODULOS: readonly Modulo[] = [
  { id: "M14", ruta: "/inicio", nombre: "Inicio", recurso: "dashboard" },
  { id: "M2", ruta: "/leads", nombre: "Leads", recurso: "leads" },
  { id: "M1", ruta: "/contactos", nombre: "Contactos", recurso: "contacts" },
  { id: "M3", ruta: "/pipeline", nombre: "Pipeline", recurso: "deals" },
  { id: "M4", ruta: "/agenda", nombre: "Agenda", recurso: "activities" },
  { id: "M4", ruta: "/tareas", nombre: "Tareas", recurso: "activities" },
  {
    id: "M5",
    ruta: "/propiedades",
    nombre: "Propiedades",
    recurso: "projects",
  },
  {
    id: "M6",
    ruta: "/avances",
    nombre: "Avances de obra",
    recurso: "construction_phases",
  },
  { id: "M7", ruta: "/brokers", nombre: "Brokers", recurso: "brokers" },
  { id: "M8", ruta: "/metas", nombre: "Metas", recurso: "goals" },
  {
    id: "M9",
    ruta: "/comisiones",
    nombre: "Comisiones",
    recurso: "commissions",
  },
  { id: "M10", ruta: "/academy", nombre: "Academy", recurso: "academy" },
  {
    id: "M11",
    ruta: "/comunicaciones",
    nombre: "Comunicaciones",
    recurso: "communications",
  },
  { id: "M12", ruta: "/reportes", nombre: "Reportes", recurso: "reports" },
  {
    id: "M13",
    ruta: "/configuracion",
    nombre: "Configuración",
    recurso: "settings",
  },
];
