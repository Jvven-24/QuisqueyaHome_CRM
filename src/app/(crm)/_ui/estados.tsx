/**
 * Estados de interfaz compartidos (T5): vacío, sin resultados y aviso de
 * permiso. Los tres son componentes de servidor, sin estado propio.
 *
 * `Vacio` y `SinResultados` reutilizan `.empty`, la única clase de estado que
 * ya traía el prototipo (`referencia-prototipo/app/page.tsx`, componente
 * `Empty`). `AvisoPermiso` usa `.permission-note`, pensada en el prototipo
 * para explicar una restricción (ver el bloque RBAC de Configuración).
 *
 * La carpeta empieza con `_` para que Next no la trate como segmento de ruta.
 */

/** Módulo o sección sin datos todavía (nunca se creó nada). */
export function Vacio({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="empty">
      <strong>{titulo}</strong>
      <p>{texto}</p>
    </div>
  );
}

import type { ReactNode } from "react";

/** Hay datos, pero el filtro o la búsqueda actual no encuentra ninguno. */
export function SinResultados({
  texto = "Ajusta la búsqueda o los filtros para ver más resultados.",
  onLimpiar,
  accion,
}: {
  texto?: string;
  onLimpiar?: () => void;
  accion?: ReactNode;
}) {
  return (
    <div className="empty flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
      <strong className="text-base font-bold text-navy-950">Sin resultados</strong>
      <p className="text-sm text-ink-muted mt-1 mb-4 max-w-md">{texto}</p>
      {accion ? (
        accion
      ) : onLimpiar ? (
        <button
          type="button"
          onClick={onLimpiar}
          className="button secondary text-xs font-semibold px-4 py-2"
        >
          Limpiar filtros
        </button>
      ) : null}
    </div>
  );
}

/**
 * Explica por qué un control visible está deshabilitado por permiso.
 *
 * `can()` (dominio) decide si esto se pinta; `requireScope` (dominio) es
 * quien de verdad autoriza en el servidor. Ocultar el control no es
 * seguridad — mostrarlo sin explicación no es interfaz (§16 #1 y #8 del
 * mapeo).
 */
export function AvisoPermiso({
  titulo = "Acción no disponible para tu rol",
  motivo,
}: {
  titulo?: string;
  motivo: string;
}) {
  return (
    <div className="permission-note" role="note">
      <strong>{titulo}</strong>
      <p>{motivo}</p>
    </div>
  );
}
