/**
 * Shell del CRM (T7, maquetado en T5): navegación y cabecera, separadas de
 * las vistas.
 *
 * Es un componente de servidor: lee la sesión y los permisos antes de pintar
 * nada. Cada módulo vive en su propia carpeta y no toca este archivo — es la
 * condición de `MAPEO_FRONTEND_CRM.md` §13 para que varias personas trabajen a
 * la vez sin chocar.
 *
 * El grupo de rutas `(crm)` no aparece en la URL: sirve para que este shell
 * envuelva a los 15 módulos y no a `/login`.
 *
 * R5.1 (etapa B): el shell usa el `Sidebar` de shadcn/ui y clases semánticas
 * de los tokens (`bg-sidebar`, `text-sidebar-foreground`…). La ÚNICA clase de
 * `globals.css` que se conserva es `.page` en el contenedor del contenido: las
 * vistas hijas siguen sin migrar y dependen de su ancho máximo y su margen
 * (se retira en R5.8). El enlace activo se resuelve en `./nav-link.tsx` y el
 * cierre de sesión en `./logout-button.tsx`, los únicos fragmentos de cliente
 * propios del shell — el layout en sí sigue siendo servidor.
 */

import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { can } from "@/domain/rbac";
import { getActor } from "@/infrastructure/auth/actor";
import { LogoutButton } from "./logout-button";
import { MODULOS } from "./modulos";
import { NavLink } from "./nav-link";

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
  // El middleware ya redirige sin sesión; esto cubre el caso de existir en
  // Supabase Auth pero no en `users` (o estar inactivo), donde no hay actor.
  if (!actor) redirect("/login");

  const visibles = MODULOS.filter((m) => can(actor, m.recurso, "view"));
  const etiquetaRol = ETIQUETAS_ROL[actor.roleSlug] ?? actor.roleSlug;

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="border-b border-sidebar-border px-5 py-5">
          <div className="flex items-center gap-3" aria-label="Quisqueya Home">
            <span
              aria-hidden="true"
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-sidebar-primary font-heading text-lg font-extrabold tracking-tighter text-sidebar-primary-foreground"
            >
              QH
            </span>
            <span className="grid leading-none">
              <strong className="font-heading text-lg font-bold tracking-wide text-sidebar-accent-foreground uppercase">
                Quisqueya
              </strong>
              <small className="mt-1.5 text-[13px] tracking-[0.19em] text-sidebar-primary uppercase">
                Home CRM
              </small>
            </span>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <nav aria-label="Módulos del CRM">
                <SidebarMenu>
                  {visibles.map((modulo, indice) => (
                    <NavLink
                      key={modulo.ruta}
                      ruta={modulo.ruta}
                      nombre={modulo.nombre}
                      indice={indice}
                    />
                  ))}
                </SidebarMenu>
              </nav>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border p-3.5">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-[13px] font-bold text-secondary-foreground"
            >
              {etiquetaRol.slice(0, 2).toUpperCase()}
            </span>
            <span className="grid min-w-0 flex-1">
              <strong className="truncate text-sm font-semibold text-sidebar-accent-foreground">
                {etiquetaRol}
              </strong>
              <small className="text-[13px] text-sidebar-meta">Sesión activa</small>
            </span>
            <LogoutButton />
          </div>
        </SidebarFooter>
      </Sidebar>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-10 flex h-18 items-center justify-between border-b border-border bg-card/95 px-4 md:px-7">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="md:hidden" />
            <span className="text-[13px] font-bold tracking-[0.11em] text-muted-foreground uppercase">
              Panel de trabajo
            </span>
          </div>
          <div className="flex items-center gap-3.5">
            <Badge variant="secondary">{etiquetaRol}</Badge>
          </div>
        </header>
        {/* `.page` es de globals.css (máx. 1680 px, márgenes 32/20/14): las
            vistas hijas lo esperan. Se retira en R5.8. */}
        <main className="page">{children}</main>
      </div>
      <Toaster />
    </SidebarProvider>
  );
}
