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

/** Hay datos, pero el filtro o la búsqueda actual no encuentra ninguno. */
export function SinResultados({
  texto = "Ajusta la búsqueda o los filtros para ver más resultados.",
}: {
  texto?: string;
}) {
  return (
    <div className="empty">
      <strong>Sin resultados</strong>
      <p>{texto}</p>
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
