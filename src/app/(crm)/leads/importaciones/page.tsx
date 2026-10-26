import { requireActor } from "@/infrastructure/auth/actor";
import { requireScopeInPage } from "@/infrastructure/page-guard";
import { ImportVista } from "./vista";
export const metadata = { title: "Importación de leads · Quisqueya Home" };
export default async function ImportPage() { const actor = await requireActor(); requireScopeInPage(actor, "leads", "view"); requireScopeInPage(actor, "leads", "import"); return <ImportVista />; }
