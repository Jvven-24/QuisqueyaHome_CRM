import {requireActor} from "@/infrastructure/auth/actor";
import {requireScopeInPage} from "@/infrastructure/page-guard";
import {ExpedientesPrevia} from "../_ui/expedientes-previa";
export default async function PaginaExpedientes(){const actor=await requireActor();requireScopeInPage(actor,"deals","view");return <ExpedientesPrevia modo="firmas"/>;}
