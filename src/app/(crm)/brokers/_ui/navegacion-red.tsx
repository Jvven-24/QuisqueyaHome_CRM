"use client";
import Link from "next/link";
import {usePathname} from "next/navigation";
import styles from "./red.module.css";
export function NavegacionRed({comunidad=false}:{comunidad?:boolean}) {
 const pathname=usePathname();const links=comunidad?[["/comunidad","Grupos y feed"],["/comunidad/demandas","Demandas"],["/comunidad/eventos","Eventos y perfil"],["/comunidad/moderacion","Moderación"]]:[["/brokers","Directorio"],["/brokers/mi-espacio","Mi espacio"],["/brokers/onboarding","Alta y acreditación"],["/brokers/alcance","Proyectos y alcance"],["/brokers/proteccion","Prospectos y protección"],["/brokers/cooperacion","Cooperación"],["/brokers/salida","Salida y transferencia"],["/comunidad","Comunidad"]];
 return <nav className={styles.nav} aria-label={comunidad?"Comunidad profesional":"Secciones de la red"}>{links.map(([href,title])=><Link key={href} href={href!} aria-current={pathname===href?"page":undefined}>{title}</Link>)}</nav>;
}
