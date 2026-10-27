"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ModuleTabs } from "@/components/modulo";
import styles from "./operaciones.module.css";
export function NavegacionOperativa({ grupo }: { grupo: "agenda" | "tareas" | "comunicaciones" }) {
 const pathname=usePathname();
 const links=grupo==="comunicaciones" ? [["/comunicaciones","Plantillas"],["/comunicaciones/bandeja","Bandeja"],["/comunicaciones/campanas","Campañas y segmentos"],["/comunicaciones/actividad","Llamadas y actividad"]] : [["/agenda","Semana, día y lista"],["/agenda/calendario","Mes y disponibilidad"],["/agenda/visitas","Visitas y recorridos"],["/agenda/viajes","Viajes de inspección"],["/tareas","Cola de tareas"],["/tareas/recurrencias","Recurrencias y dependencias"]];
 if (grupo === "tareas") return <nav aria-label="Secciones de agenda y tareas" className={styles.nav}>{links.map(([href,label])=><Link key={href} href={href!} aria-current={pathname===href?"page":undefined}>{label}</Link>)}</nav>;
 return <ModuleTabs label={grupo==="comunicaciones"?"Secciones de comunicaciones":"Secciones de agenda y tareas"} items={links.map(([href,label])=>({href:href!,label:label!}))} className={styles.nav}/>;
}
