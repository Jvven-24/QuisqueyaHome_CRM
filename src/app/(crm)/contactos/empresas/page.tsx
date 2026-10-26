import { requireActor } from "@/infrastructure/auth/actor";
import { requireScopeInPage } from "@/infrastructure/page-guard";
import { EmpresasVista } from "./vista";
export const metadata = { title: "Empresas · Quisqueya Home" };
export default async function EmpresasPage() { const actor = await requireActor(); requireScopeInPage(actor, "contacts", "view"); return <EmpresasVista />; }
