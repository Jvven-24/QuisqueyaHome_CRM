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
 * Las clases (`.app-shell`, `.app-sidebar`, `.sidebar-head`, `.nav-link`,
 * `.sidebar-profile`, `.workspace`, `.app-header`, `.page`) vienen de
 * `src/app/globals.css`, portado en T5 desde el prototipo aprobado. El enlace
 * activo se resuelve en `./nav-link.tsx`, el único fragmento de cliente de
 * este árbol — el layout en sí sigue siendo servidor.
 */

import { redirect } from "next/navigation";
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
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="sidebar-head">
          <div className="brand-lockup" aria-label="Quisqueya Home">
            <span className="brand-mark">QH</span>
            <span>
              <strong>Quisqueya</strong>
              <small>Home CRM</small>
            </span>
          </div>
        </div>

        <nav aria-label="Módulos del CRM">
          {visibles.map((modulo, indice) => (
            <NavLink
              key={modulo.ruta}
              ruta={modulo.ruta}
              nombre={modulo.nombre}
              indice={indice}
            />
          ))}
        </nav>

        <div className="sidebar-profile">
          <span className="avatar avatar-small" aria-hidden="true">
            {etiquetaRol.slice(0, 2).toUpperCase()}
          </span>
          <span>
            <strong>{etiquetaRol}</strong>
            <small>Sesión activa</small>
          </span>
          <LogoutButton />
        </div>
      </aside>

      <div className="workspace">
        <header className="app-header">
          <span className="eyebrow">Panel de trabajo</span>
          <div className="header-actions">
            <span className="badge badge-neutral">{etiquetaRol}</span>
          </div>
        </header>
        <main className="page">{children}</main>
      </div>
    </div>
  );
}
