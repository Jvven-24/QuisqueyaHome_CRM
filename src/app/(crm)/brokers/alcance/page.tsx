import {requireActor} from "@/infrastructure/auth/actor";
import {requireScopeInPage} from "@/infrastructure/page-guard";
import {RedPrevia} from "../../brokers/_ui/red-previa";
export default async function PaginaRed(){const actor=await requireActor();requireScopeInPage(actor,"brokers","view");return <RedPrevia pantalla="alcance"/>;}
