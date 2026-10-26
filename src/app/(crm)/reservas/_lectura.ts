import { requireActor } from "@/infrastructure/auth/actor";
import { requireScopeInPage } from "@/infrastructure/page-guard";
import { can, scopeFor } from "@/domain/rbac";
import { listarReservas } from "@/application/reservas/consultas";
import { dtoListaReservas } from "@/application/reservas/dto";
import { reservasParaEscritura } from "@/infrastructure/contenedor/reservas";
import { listarHolds } from "@/application/compromisos/consultas";
import { dtoListaHolds } from "@/application/compromisos/dto";
import { compromisosParaEscritura } from "@/infrastructure/contenedor/compromisos";
import type { CursorNegocios } from "@/application/pipeline/puertos";
import { consultarListaNegocios } from "@/application/pipeline/consultas";
import { pipelineParaLectura } from "@/infrastructure/contenedor/pipeline";
import { holdsEjemplo, reservasEjemplo } from "./_ejemplo";
export async function contextoFinanzas(){const actor=await requireActor();requireScopeInPage(actor,"deals","view");return actor;}
export async function leerReservas(){const actor=await contextoFinanzas();const preview=!can(actor,"reservations","view");let error=false;let rows=preview?reservasEjemplo:[];if(!preview){try{rows=dtoListaReservas(actor,await listarReservas(reservasParaEscritura(),actor,scopeFor(actor,"reservations","view"),{}));}catch{error=true;}}return {rows,preview,error,edit:!preview&&can(actor,"reservations","edit")};}
export type OpcionNegocio={id:number;label:string;unitId:number|null;unitCode:string;amountCents:string;currency:string};
export async function leerHolds(){const actor=await contextoFinanzas();const preview=!can(actor,"holds","view");let error=false;let rows=preview?holdsEjemplo:[];if(!preview){try{rows=dtoListaHolds(actor,await listarHolds(compromisosParaEscritura(),actor,scopeFor(actor,"holds","view"),{}));}catch{error=true;}}let deals:OpcionNegocio[]=[];let dealError=false;const more=false;if(can(actor,"deals","view")){try{const all=[];let cursor:CursorNegocios|null=null;do{const result=await consultarListaNegocios(pipelineParaLectura(),actor,{resultado:"open"},undefined,cursor,200);all.push(...result.filas);cursor=result.siguiente;}while(cursor);deals=all.map(n=>({id:n.id,label:n.contactName,unitId:n.proyectoPrincipal?.unitId??null,unitCode:n.proyectoPrincipal?.unitCode??"Sin unidad principal",amountCents:n.amountCents?.toString()??"",currency:n.currency}));}catch{dealError=true;}}return {rows,preview,error,deals,dealError,more,userId:actor.userId,create:can(actor,"holds","create"),edit:!preview&&can(actor,"holds","edit")};}
