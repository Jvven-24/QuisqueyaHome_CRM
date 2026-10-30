import type { ReactNode } from "react";
import { ModuleTabs } from "@/components/modulo";
import { PageHeader } from "@/components/modulo/page-header";

export const metadata = { title: "Origen de leads · CRM Quisqueya Home" };

export default function OrigenLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-w-0 max-w-full">
      <PageHeader
        eyebrow="Captación · Origen"
        title="Origen de leads"
        description="De qué video, anuncio o fuente llega cada lead, y cuánto tardamos en contactarlo."
        breadcrumbs={[{ label: "Leads", href: "/leads" }, { label: "Origen" }]}
      />
      <ModuleTabs label="Origen de leads" className="mb-4" items={[{ href: "/leads/origen", label: "Analítica" }, { href: "/leads/origen/enlaces", label: "Enlaces de seguimiento" }]} />
      {children}
    </div>
  );
}
