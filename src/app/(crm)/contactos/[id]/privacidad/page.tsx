import { cache } from "react";
import { notFound } from "next/navigation";
import { can } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { contactosParaEscritura } from "@/infrastructure/contenedor/contactos";
import { requireScopeInPage } from "@/infrastructure/page-guard";
import { PrivacidadVista } from "./vista";
export const metadata = { title: "Privacidad y preferencias · Quisqueya Home" };
const resolveContact = cache(async (id: string) => { const actor = await requireActor(); const scope = requireScopeInPage(actor, "contacts", "view"); if (!/^[1-9]\d{0,9}$/.test(id) || Number(id) > 2147483647)
    notFound(); const contact = await contactosParaEscritura().contactos.buscarVisible(actor, scope, Number(id)); if (!contact)
    notFound(); return { actor, contact }; });
export async function generateViewport({ params }: {
    params: Promise<{
        id: string;
    }>;
}) { await resolveContact((await params).id); return {}; }
export default async function PrivacidadPage({ params }: {
    params: Promise<{
        id: string;
    }>;
}) { const { actor, contact } = await resolveContact((await params).id); return <PrivacidadVista id={contact.id} name={contact.fullName} consentAt={contact.consentAt?.toISOString() ?? null} consentSource={contact.consentSource} canExport={can(actor, "contacts", "export")}/>; }
