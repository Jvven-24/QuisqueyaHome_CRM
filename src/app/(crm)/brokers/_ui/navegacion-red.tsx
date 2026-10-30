"use client";
import {ModuleTabs} from "@/components/modulo";
export function NavegacionRed({comunidad=false}:{comunidad?:boolean}) {
 const links=comunidad?[["/comunidad","Grupos y feed"],["/comunidad/demandas","Demandas"],["/comunidad/eventos","Eventos y perfil"],["/comunidad/moderacion","Moderación"]]:[["/brokers","Directorio"],["/brokers/mi-espacio","Mi espacio"],["/brokers/onboarding","Alta y acreditación"],["/brokers/alcance","Proyectos y alcance"],["/brokers/proteccion","Prospectos y protección"],["/brokers/cooperacion","Cooperación"],["/brokers/salida","Salida y transferencia"],["/comunidad","Comunidad"]];
 return <ModuleTabs label={comunidad?"Comunidad profesional":"Secciones de la red"} items={links.map(([href,label])=>({href:href!,label:label!}))} className="mb-4"/>;
}
