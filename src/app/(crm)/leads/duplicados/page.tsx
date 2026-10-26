import { requireActor } from "@/infrastructure/auth/actor";
import { requireScopeInPage } from "@/infrastructure/page-guard";
import { DuplicadosVista } from "./vista";
export const metadata = { title: "Duplicados · Quisqueya Home" };
export default async function DuplicadosPage() { const actor = await requireActor(); requireScopeInPage(actor, "contacts", "view"); requireScopeInPage(actor, "contacts", "edit"); return <DuplicadosVista />; }
