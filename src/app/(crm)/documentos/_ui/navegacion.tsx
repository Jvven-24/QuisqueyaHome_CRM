"use client";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {ModuleTabs} from "@/components/modulo";
import styles from "./expedientes.module.css";
export function NavegacionExpedientes({portal=false}:{portal?:boolean}){const links=portal?[["/portal","Editor y marca"],["/portal/publicacion","Publicación y canales"],["/portal/catalogo","Catálogo y captación"],["/portal/comprador","Vista del comprador"],["/portal/promotor","Vista del promotor"]]:[["/documentos","Expediente y versiones"],["/documentos/firmas","Firma y sobres"],["/documentos/kyc","KYC y retención"]];return <ModuleTabs label={portal?"Gestión del portal":"Secciones documentales"} items={links.map(([href,label])=>({href:href!,label:label!}))} className={styles.nav}/>;}
