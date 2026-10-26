import {requireActor} from "@/infrastructure/auth/actor";
import {requireScopeInPage} from "@/infrastructure/page-guard";
import {VistaPreviaOperativa} from "../../agenda/_componentes/vista-previa";
export default async function PaginaVistaPrevia() {const actor=await requireActor();requireScopeInPage(actor,"activities","view");return <VistaPreviaOperativa modo="viajes"/>;}
