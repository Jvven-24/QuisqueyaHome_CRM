/**
 * Pantalla 403 (T3, maquetada en T5). Lo que ve alguien con sesión válida
 * pero sin permiso.
 *
 * Se renderiza fuera del shell de `(crm)/layout.tsx` (Next resuelve el
 * `forbidden.tsx` más cercano hacia arriba desde donde se llamó a
 * `forbidden()`, y este es el único que existe), así que usa solo clases de
 * `globals.css` que no dependen de ese shell: `.page` para el margen y
 * `.empty`/`.button` para el contenido, las mismas que usan los estados de
 * "sin resultados" dentro de los módulos.
 */
export default function Forbidden() {
  return (
    <main className="page">
      <div className="empty">
        <strong>No tienes permiso</strong>
        <p>
          Tu rol no tiene acceso a esta sección. Si crees que deberías
          tenerlo, pídeselo a un administrador.
        </p>
        <p>
          <a className="button primary" href="/inicio">
            Volver al inicio
          </a>
        </p>
      </div>
    </main>
  );
}
