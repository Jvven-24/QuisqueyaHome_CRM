"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./operaciones.module.css";
export function NavegacionOperativa({ grupo }: { grupo: "agenda" | "tareas" | "comunicaciones" }) {
 const pathname=usePathname();
 const links=grupo==="comunicaciones" ? [["/comunicaciones","Plantillas"],["/comunicaciones/bandeja","Bandeja"],["/comunicaciones/campanas","Campañas y segmentos"],["/comunicaciones/actividad","Llamadas y actividad"]] : [["/agenda","Semana, día y lista"],["/agenda/calendario","Mes y disponibilidad"],["/agenda/visitas","Visitas y recorridos"],["/agenda/viajes","Viajes de inspección"],["/tareas","Cola de tareas"],["/tareas/recurrencias","Recurrencias y dependencias"]];
 return <nav aria-label={grupo==="comunicaciones"?"Secciones de comunicaciones":"Secciones de agenda y tareas"} className={styles.nav}>{links.map(([href,label])=><Link key={href} href={href!} aria-current={pathname===href?"page":undefined}>{label}</Link>)}</nav>;
}
