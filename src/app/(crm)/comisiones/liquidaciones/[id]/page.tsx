import { notFound } from "next/navigation";
import { leerComisionesVisibles } from "../../_datos";
import { agruparLotes } from "../../../reservas/_finanzas/calculos";
import { LiquidacionDetalle } from "./vista";
export default async function LiquidacionPage({ params }: {
    params: Promise<{
        id: string;
    }>;
}) { const { rows } = await leerComisionesVisibles(); const { id } = await params; const group = agruparLotes(rows).find(g => g.id === id); if (id !== "ejemplo" && !group)
    notFound(); return <LiquidacionDetalle group={group ?? null}/>; }
