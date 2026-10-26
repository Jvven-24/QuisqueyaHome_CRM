import { useEffect, useRef } from "react";

// Sólo el diálogo superior responde. Un padre no consume Escape/Tab del hijo.
const trampasActivas: HTMLElement[] = [];
function trampaSuperior(incluir?: HTMLElement) {
  const conectadas = trampasActivas.filter((el) => el.isConnected || el === incluir);
  return conectadas.filter((el) => !conectadas.some((otro) => otro !== el && el.contains(otro))).at(-1);
}

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
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  useEffect(() => {
    if (!isActive) return;

    // Guardar el elemento previamente enfocado para restaurarlo al cerrar
    if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
      previousActiveElement.current = document.activeElement;
    }

    const container = containerRef.current;
    if (!container) return;
    trampasActivas.push(container);
    const teniaTabindex = container.hasAttribute("tabindex");
    if (!teniaTabindex) container.setAttribute("tabindex", "-1");

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

    const timer = autoFocus ? setTimeout(() => {
        if (trampaSuperior() !== container) return;
        const enfocables = obtenerEnfocables();
        if (enfocables.length > 0) {
          enfocables[0]?.focus();
        } else {
          container.focus();
        }
      }, 40) : undefined;

    function alPulsarTecla(event: KeyboardEvent) {
      if (event.defaultPrevented || trampaSuperior() !== container) return;
      if (event.key === "Escape" && onCloseRef.current) {
        event.stopPropagation();
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key === "Tab") {
        const enfocables = obtenerEnfocables();
        if (enfocables.length === 0) {
          event.preventDefault();
          container?.focus();
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
      if (timer !== undefined) clearTimeout(timer);
      window.removeEventListener("keydown", alPulsarTecla);
      const eraSuperior = trampaSuperior(container) === container;
      const indice = trampasActivas.indexOf(container);
      if (indice >= 0) trampasActivas.splice(indice, 1);
      if (!teniaTabindex) container.removeAttribute("tabindex");
      // Restaurar foco al elemento que abrió el modal
      const superior = trampaSuperior();
      if (eraSuperior && previousActiveElement.current?.isConnected && (!superior || superior.contains(previousActiveElement.current))) {
        previousActiveElement.current.focus();
      }
    };
  }, [isActive, autoFocus]);

  return containerRef;
}
