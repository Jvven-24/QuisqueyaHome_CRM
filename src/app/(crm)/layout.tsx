/**
 * Shell del CRM (T7): navegación y cabecera, separadas de las vistas.
 *
 * Es un componente de servidor: lee la sesión y los permisos antes de pintar
 * nada. Cada módulo vive en su propia carpeta y no toca este archivo — es la
 * condición de `MAPEO_FRONTEND_CRM.md` §13 para que varias personas trabajen a
 * la vez sin chocar.
 *
 * El grupo de rutas `(crm)` no aparece en la URL: sirve para que este shell
 * envuelva a los 15 módulos y no a `/login`.
 */

import Link from "next/link";
import { redirect } from "next/navigation";
import { can } from "@/domain/rbac";
import { getActor } from "@/infrastructure/auth/actor";
import { LogoutButton } from "./logout-button";
import { MODULOS } from "./modulos";

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

  return (
    <div className="crm-shell">
      <nav aria-label="Módulos">
        <ul>
          {visibles.map((modulo) => (
            <li key={modulo.ruta}>
              <Link href={modulo.ruta}>{modulo.nombre}</Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="crm-contenido">
        <header>
          <span>{actor.roleSlug}</span>
          <LogoutButton />
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}
