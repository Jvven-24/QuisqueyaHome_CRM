import {redirect} from "next/navigation";
import {requireActor} from "@/infrastructure/auth/actor";
import {requireScopeInPage} from "@/infrastructure/page-guard";
export default async function MiEspacio(){const actor=await requireActor();requireScopeInPage(actor,"brokers","view");redirect("/brokers/"+actor.userId);}
