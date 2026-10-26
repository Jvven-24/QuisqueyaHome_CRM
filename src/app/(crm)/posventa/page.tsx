import { requireActor } from "@/infrastructure/auth/actor";
import { requireScopeInPage } from "@/infrastructure/page-guard";
import { AftersalesWorkspace } from "./vista";
export const metadata={title:"Entregas y posventa · Quisqueya Home"};
export default async function AftersalesPage(){const actor=await requireActor();requireScopeInPage(actor,"projects","view");return <AftersalesWorkspace />;}
