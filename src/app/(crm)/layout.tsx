/**
 * Shell Maestro del CRM Quisqueya Home (Private Desk OS).
 *
 * Componente de servidor: lee la sesión y permisos RBAC antes de renderizar.
 * Integra la nueva arquitectura de navegación:
 *  - Sidebar agrupado por Espacios de Trabajo (Workspaces) con búsqueda rápida y colapsado.
 *  - Cabecera Superior con Command Palette (Ctrl+K), Notificaciones y Acciones Rápidas.
 *  - Mobile PWA Dock inferior de 5 accesos táctiles y Drawer para uso en smartphones.
 */

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { can } from "@/domain/rbac";
import { getActor } from "@/infrastructure/auth/actor";
import { getDb } from "@/infrastructure/db/client";
import { users } from "@/infrastructure/db/schema";
import { MODULOS } from "./modulos";
import { CrmHeader } from "./_ui/crm-header";
import { CrmSidebarMenu } from "./_ui/crm-sidebar-menu";
import { MobileDock } from "./_ui/mobile-dock";
import { DeskSwitcher } from "./_ui/desk-switcher";
import { BrokerFooter } from "./_ui/broker-footer";

/** El `Actor` solo trae el `roleSlug` técnico; esta es su etiqueta en español. */
const ETIQUETAS_ROL: Record<string, string> = {
  admin: "Administrador",
  assistant: "Asistente",
  broker: "Broker",
};

export default async function CrmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const actor = await getActor();
  if (!actor) redirect("/login");

  const visibles = MODULOS.filter((m) => can(actor, m.recurso, "view"));
  const etiquetaRol = ETIQUETAS_ROL[actor.roleSlug] ?? actor.roleSlug;

  const [dbUser] = await getDb()
    .select({
      fullName: users.fullName,
      email: users.email,
      initials: users.initials,
      jobTitle: users.jobTitle,
    })
    .from(users)
    .where(eq(users.id, actor.userId))
    .limit(1);

  const usuario = {
    fullName: dbUser?.fullName ?? "Usuario Quisqueya",
    email: dbUser?.email ?? "usuario@quisqueyahome.do",
    initials: dbUser?.initials ?? etiquetaRol.slice(0, 2).toUpperCase(),
    jobTitle: dbUser?.jobTitle ?? etiquetaRol,
    roleLabel: etiquetaRol,
  };

  return (
    <SidebarProvider>
      {/* Modern Desktop & Tablet Sidebar */}
      <Sidebar className="border-r border-sidebar-border bg-sidebar select-none">
        <SidebarHeader className="border-b border-sidebar-border p-3">
          <DeskSwitcher />
        </SidebarHeader>

        <SidebarContent className="px-1 overflow-y-auto">
          <CrmSidebarMenu modulosVisibles={visibles} />
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border p-2">
          <BrokerFooter usuario={usuario} />
        </SidebarFooter>
      </Sidebar>

      {/* Main Workspace Surface */}
      <div className="min-w-0 flex-1 flex flex-col min-h-dvh bg-canvas">
        {/* Top Command Bar */}
        <CrmHeader etiquetaRol={etiquetaRol} />

        {/* Viewport Content Container (with pb-24 on mobile to prevent dock collision) */}
        <main className="page flex-1 pb-24 md:pb-12">
          {children}
        </main>

        {/* Mobile PWA Dock for smartphones (<768px) */}
        <MobileDock modulosVisibles={visibles} etiquetaRol={etiquetaRol} />
      </div>

      <Toaster />
    </SidebarProvider>
  );
}
