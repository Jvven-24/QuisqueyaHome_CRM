"use client";
import Link from "next/link";
import {usePathname} from "next/navigation";
import styles from "./expedientes.module.css";
export function NavegacionExpedientes({portal=false}:{portal?:boolean}){const pathname=usePathname();const links=portal?[["/portal","Editor y marca"],["/portal/publicacion","Publicación y canales"],["/portal/catalogo","Catálogo y captación"],["/portal/comprador","Vista del comprador"],["/portal/promotor","Vista del promotor"]]:[["/documentos","Expediente y versiones"],["/documentos/firmas","Firma y sobres"],["/documentos/kyc","KYC y retención"]];return <nav className={styles.nav} aria-label={portal?"Gestión del portal":"Secciones documentales"}>{links.map(([href,title])=><Link key={href} href={href!} aria-current={pathname===href?"page":undefined}>{title}</Link>)}</nav>;}
