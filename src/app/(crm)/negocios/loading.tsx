import { Esqueleto } from "../_ui/cargando";

/**
 * Estado de carga de Negocios (T5).
 * Se renderiza con aria-busy mientras page.tsx resuelve su consulta.
 */
export default function Loading() {
  return (
    <section aria-busy="true" aria-label="Cargando negocios">
      <h1 className="text-xl font-bold text-navy-950 mb-3">Negocios</h1>
      <Esqueleto filas={6} />
    </section>
  );
}
