import {requireActor} from "@/infrastructure/auth/actor";
import {requireScopeInPage} from "@/infrastructure/page-guard";
import {ExpedientesPrevia} from "../documentos/_ui/expedientes-previa";
export default async function PaginaExpedientes(){const actor=await requireActor();requireScopeInPage(actor,"settings","view");return <ExpedientesPrevia modo="editor"/>;}
