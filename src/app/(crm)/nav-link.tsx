"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

/**
 * Enlace del sidebar (T5), aislado como componente de cliente solo para leer
 * la ruta actual con `usePathname` y marcar el activo — el layout que lo usa
 * sigue siendo un componente de servidor (`CrmLayout`).
 *
 * R5.1: el activo va en dorado con texto azul marino (`DESIGN.md` §Reglas del
 * dorado: navegación activa sí, dorado como fondo nunca como texto).
 */
export function NavLink({
  ruta,
  nombre,
  indice,
}: {
  ruta: string;
  nombre: string;
  indice: number;
}) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const activo = pathname === ruta || pathname.startsWith(`${ruta}/`);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={activo}
        className="h-11 gap-2 text-sm duration-(--duration-hover) focus-visible:ring-sidebar-ring data-[active=true]:bg-sidebar-primary data-[active=true]:font-bold data-[active=true]:text-sidebar-primary-foreground"
      >
        <Link
          href={ruta}
          aria-current={activo ? "page" : undefined}
          onClick={() => setOpenMobile(false)}
        >
          <span
            aria-hidden="true"
            className={
              activo
                ? "w-7 text-[13px] tabular-nums text-sidebar-primary-foreground"
                : "w-7 text-[13px] tabular-nums text-sidebar-meta"
            }
          >
            {String(indice).padStart(2, "0")}
          </span>
          {nombre}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
