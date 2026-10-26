import { cache } from "react";
import { notFound } from "next/navigation";
import { requireActor } from "@/infrastructure/auth/actor";
import { contactosParaEscritura } from "@/infrastructure/contenedor/contactos";
import { requireScopeInPage } from "@/infrastructure/page-guard";
import { Historial } from "../../../_ui/historial";
import { RelacionesVista } from "./vista";
export const metadata = { title: "Contacto 360 · Quisqueya Home" };
const resolveContact = cache(async (id: string) => { const actor = await requireActor(); const scope = requireScopeInPage(actor, "contacts", "view"); if (!/^[1-9]\d{0,9}$/.test(id) || Number(id) > 2147483647)
    notFound(); const row = await contactosParaEscritura().contactos.buscarVisible(actor, scope, Number(id)); if (!row)
    notFound(); return row; });
export async function generateViewport({ params }: {
    params: Promise<{
        id: string;
    }>;
}) { await resolveContact((await params).id); return {}; }
export default async function RelacionesPage({ params }: {
    params: Promise<{
        id: string;
    }>;
}) { const row = await resolveContact((await params).id); return <RelacionesVista id={row.id} name={row.fullName} phone={row.phoneDisplay ?? row.phone} email={row.email} historial={<Historial entidad="contact" entidadId={row.id}/>}/>; }
