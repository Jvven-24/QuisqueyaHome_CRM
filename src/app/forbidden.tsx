/**
 * Pantalla 403 (T3). Lo que ve alguien con sesión válida pero sin permiso.
 *
 * Deliberadamente sin diseño: la maquetación de los estados de interfaz —carga,
 * vacío, sin resultados, error, 403— es T5, en la fase F1. Lo que importa aquí
 * es que el servidor responda 403 y no 500, y que el usuario lea por qué.
 */
export default function Forbidden() {
  return (
    <main>
      <h1>No tienes permiso</h1>
      <p>
        Tu rol no tiene acceso a esta sección. Si crees que deberías tenerlo,
        pídeselo a un administrador.
      </p>
      <a href="/inicio">Volver al inicio</a>
    </main>
  );
}
