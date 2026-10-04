import { useEffect, useRef } from "react";

/**
 * Hook para atrapamiento de foco accesible (WCAG 2.2 Operable - Criterio 2.1.2 Sin trampas de foco).
 * 
 * - Mantiene el foco dentro del contenedor dialog/modal/drawer mientras esté activo.
 * - Cierra con la tecla 'Escape'.
 * - Restaura el foco al elemento desencadenador (trigger) al cerrarse.
 */
export function useFocusTrap<T extends HTMLElement = HTMLElement>({
  isActive = true,
  onClose,
  autoFocus = true,
}: {
  isActive?: boolean;
  onClose?: () => void;
  autoFocus?: boolean;
} = {}) {
  const containerRef = useRef<T | null>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive) return;

    // Guardar el elemento previamente enfocado para restaurarlo al cerrar
    if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
      previousActiveElement.current = document.activeElement;
    }

    const container = containerRef.current;
    if (!container) return;

    const SELECTORES_FOCO = [
      'button:not([disabled])',
      '[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(", ");

    function obtenerEnfocables(): HTMLElement[] {
      if (!container) return [];
      return Array.from(container.querySelectorAll<HTMLElement>(SELECTORES_FOCO)).filter(
        (el) => el.offsetParent !== null && el.getAttribute("aria-hidden") !== "true",
      );
    }

    if (autoFocus) {
      const timer = setTimeout(() => {
        const enfocables = obtenerEnfocables();
        if (enfocables.length > 0) {
          enfocables[0]?.focus();
        } else {
          container.focus();
        }
      }, 40);
      return () => clearTimeout(timer);
    }

    function alPulsarTecla(event: KeyboardEvent) {
      if (event.key === "Escape" && onClose) {
        event.stopPropagation();
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === "Tab") {
        const enfocables = obtenerEnfocables();
        if (enfocables.length === 0) {
          event.preventDefault();
          return;
        }

        const primero = enfocables[0];
        const ultimo = enfocables[enfocables.length - 1];

        if (event.shiftKey) {
          if (document.activeElement === primero || !container?.contains(document.activeElement)) {
            event.preventDefault();
            ultimo?.focus();
          }
        } else {
          if (document.activeElement === ultimo || !container?.contains(document.activeElement)) {
            event.preventDefault();
            primero?.focus();
          }
        }
      }
    }

    window.addEventListener("keydown", alPulsarTecla);

    return () => {
      window.removeEventListener("keydown", alPulsarTecla);
      // Restaurar foco al elemento que abrió el modal
      if (previousActiveElement.current && typeof previousActiveElement.current.focus === "function") {
        previousActiveElement.current.focus();
      }
    };
  }, [isActive, onClose, autoFocus]);

  return containerRef;
}
