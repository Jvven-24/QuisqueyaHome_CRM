"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

/**
 * Cierra la sesión (mismo `POST /api/auth/logout` de siempre) y vuelve a
 * `/login`. Vive en el pie de la barra lateral, sobre `navy-950`: por eso los
 * colores son los de `--sidebar*` y el anillo de foco es el dorado de la barra.
 */
export function LogoutButton() {
  const router = useRouter();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:border-sidebar-ring focus-visible:ring-sidebar-ring"
      aria-label="Cerrar sesión"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.replace("/login");
        router.refresh();
      }}
    >
      <LogOut aria-hidden="true" />
    </Button>
  );
}
