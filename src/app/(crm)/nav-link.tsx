"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Enlace del sidebar (T5), aislado como componente de cliente solo para leer
 * la ruta actual con `usePathname` y marcar `.active` — el layout que lo usa
 * sigue siendo un componente de servidor (`CrmLayout`).
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
  const activo = pathname === ruta || pathname.startsWith(`${ruta}/`);

  return (
    <Link
      href={ruta}
      className={activo ? "nav-link active" : "nav-link"}
      aria-current={activo ? "page" : undefined}
    >
      <span aria-hidden="true">{String(indice).padStart(2, "0")}</span>
      {nombre}
    </Link>
  );
}
