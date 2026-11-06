import { Esqueleto } from "../../../_ui/cargando";

/** Contacto 360: confirma la navegación mientras se resuelve la ficha y su historial. */
export default function Loading() {
  return (
    <section aria-busy="true">
      <h1>Contacto 360</h1>
      <Esqueleto filas={6} />
    </section>
  );
}
