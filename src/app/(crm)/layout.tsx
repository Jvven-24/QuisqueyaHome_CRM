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
import Image from "next/image";
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
import { LogoutButton } from "./logout-button";
import { MODULOS } from "./modulos";
import { CrmHeader } from "./_ui/crm-header";
import { CrmSidebarMenu } from "./_ui/crm-sidebar-menu";
import { MobileDock } from "./_ui/mobile-dock";

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

  return (
    <SidebarProvider>
      {/* Modern Desktop & Tablet Sidebar */}
      <Sidebar className="border-r border-sidebar-border bg-sidebar select-none">
        <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
          <div className="flex items-center gap-3" aria-label="Quisqueya Home Private Desk">
            <Image
              src="/brand/app-icon-192.png"
              alt="Quisqueya Home"
              width={40}
              height={40}
              className="size-10 shrink-0 rounded-xl object-contain shadow-md border border-gold-600/40 bg-navy-950 p-1"
            />
            <div className="grid leading-none min-w-0">
              <strong className="font-heading text-sm font-bold tracking-wider text-sidebar-accent-foreground uppercase truncate">
                Quisqueya Home
              </strong>
              <small className="mt-1 text-[11px] tracking-[0.16em] text-gold-500 font-semibold uppercase truncate">
                Private Desk
              </small>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="px-1 overflow-y-auto">
          <CrmSidebarMenu modulosVisibles={visibles} />
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gold-600/20 text-xs font-bold text-gold-400 border border-gold-600/40"
            >
              {etiquetaRol.slice(0, 2).toUpperCase()}
            </span>
            <div className="grid min-w-0 flex-1 leading-tight">
              <strong className="truncate text-xs font-semibold text-sidebar-accent-foreground">
                {etiquetaRol}
              </strong>
              <small className="text-[11px] text-sidebar-meta truncate">
                Sesión verificada
              </small>
            </div>
            <LogoutButton />
          </div>
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
