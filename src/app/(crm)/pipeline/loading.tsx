import { Esqueleto } from "../_ui/cargando";

/**
 * Estado de carga de Pipeline (T5). Convención nativa de Next 15: se
 * renderiza mientras `page.tsx` resuelve su consulta, sin `isLoading` en
 * cliente ni estado global.
 */
export default function Loading() {
  return (
    <section>
      <h1>Pipeline</h1>
      <Esqueleto filas={6} />
    </section>
  );
}
