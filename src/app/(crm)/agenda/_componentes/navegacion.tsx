"use client";
import { ModuleTabs } from "@/components/modulo";
export function NavegacionOperativa({ grupo }: { grupo: "agenda" | "tareas" | "comunicaciones" }) {
 const links=grupo==="comunicaciones" ? [["/comunicaciones","Plantillas"],["/comunicaciones/bandeja","Bandeja"],["/comunicaciones/campanas","Campañas y segmentos"],["/comunicaciones/actividad","Llamadas y actividad"]] : [["/agenda","Semana, día y lista"],["/agenda/calendario","Mes y disponibilidad"],["/agenda/visitas","Visitas y recorridos"],["/agenda/viajes","Viajes de inspección"],["/tareas","Cola de tareas"],["/tareas/recurrencias","Recurrencias y dependencias"]];
 return <ModuleTabs label={grupo==="comunicaciones"?"Secciones de comunicaciones":"Secciones de agenda y tareas"} items={links.map(([href,label])=>({href:href!,label:label!}))} className="mb-4"/>;
}
