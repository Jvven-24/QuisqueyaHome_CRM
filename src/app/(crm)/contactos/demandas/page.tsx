import { requireActor } from "@/infrastructure/auth/actor";
import { requireScopeInPage } from "@/infrastructure/page-guard";
import { DemandasVista } from "./vista";
export const metadata = { title: "Demandas y matching · Quisqueya Home" };
export default async function DemandasPage() { const actor = await requireActor(); requireScopeInPage(actor, "contacts", "view"); return <DemandasVista />; }
