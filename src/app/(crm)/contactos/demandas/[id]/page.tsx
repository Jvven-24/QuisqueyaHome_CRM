import { notFound } from "next/navigation";
import { requireActor } from "@/infrastructure/auth/actor";
import { requireScopeInPage } from "@/infrastructure/page-guard";
import { DEMANDS } from "../../_ejemplo";
import { DemandasVista } from "../vista";
export const metadata = { title: "Demanda · Quisqueya Home" };
async function resolveDemand(id: string) { const actor = await requireActor(); requireScopeInPage(actor, "contacts", "view"); const demand = DEMANDS.find(d => d.id === id); if (!demand)
    notFound(); return demand; }
export async function generateViewport({ params }: {
    params: Promise<{
        id: string;
    }>;
}) { await resolveDemand((await params).id); return {}; }
export default async function DemandaPage({ params }: {
    params: Promise<{
        id: string;
    }>;
}) { return <DemandasVista initial={await resolveDemand((await params).id)}/>; }
