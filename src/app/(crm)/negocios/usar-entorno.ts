"use client";

import { useSyncExternalStore } from "react";

/**
 * Hooks de entorno del navegador con valor inicial seguro para SSR.
 * `useSyncExternalStore` entrega `valorServidor` en el render del servidor y en
 * la hidratación, y el valor real después: nunca hay desajuste de hidratación
 * y no se monta ningún diseño "por si acaso".
 */
export function useMediaQuery(consulta: string, valorServidor = false): boolean {
  return useSyncExternalStore(
    (avisar) => {
      const media = window.matchMedia(consulta);
      media.addEventListener("change", avisar);
      return () => media.removeEventListener("change", avisar);
    },
    () => window.matchMedia(consulta).matches,
    () => valorServidor,
  );
}

/** `true` mientras el navegador reporta conexión. Sin dato (servidor) se asume conectado. */
export function useEnLinea(): boolean {
  return useSyncExternalStore(
    (avisar) => {
      window.addEventListener("online", avisar);
      window.addEventListener("offline", avisar);
      return () => {
        window.removeEventListener("online", avisar);
        window.removeEventListener("offline", avisar);
      };
    },
    () => navigator.onLine,
    () => true,
  );
}
