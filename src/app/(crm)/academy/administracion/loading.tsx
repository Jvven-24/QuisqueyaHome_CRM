import { Esqueleto } from "../../_ui/cargando";

export default function Loading() {
  return (
    <section>
      <h1>Administración Academy</h1>
      <Esqueleto filas={6} />
    </section>
  );
}
