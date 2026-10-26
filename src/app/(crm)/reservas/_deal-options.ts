import type { Actor } from "@/domain/rbac";
import { consultarListaNegocios } from "@/application/pipeline/consultas";
import { pipelineParaLectura } from "@/infrastructure/contenedor/pipeline";
export type DealOption={id:number;label:string;unitId:number|null;unitCode:string};
export async function dealOptions(actor:Actor):Promise<DealOption[]>{try{const result=await consultarListaNegocios(pipelineParaLectura(),actor,{resultado:"open"},undefined,null,200);return result.filas.map(row=>({id:row.id,label:row.contactName,unitId:row.proyectoPrincipal?.unitId??null,unitCode:row.proyectoPrincipal?.unitCode??"Sin unidad principal"}));}catch{return [];}}
