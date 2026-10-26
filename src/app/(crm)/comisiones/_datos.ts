import { requireActor } from "@/infrastructure/auth/actor";
import { requireScopeInPage } from "@/infrastructure/page-guard";
import { consultarFilas } from "./_consulta";
export async function leerComisionesVisibles(){const actor=await requireActor();const scope=requireScopeInPage(actor,"commissions","view");const rows=await consultarFilas(actor,scope,{brokerId:null,periodo:null,estado:"todos"});return {rows,scope};}
