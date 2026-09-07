import { Esqueleto } from "../_ui/cargando";

/**
 * Estado de carga de Contactos (T5). Convención nativa de Next 15: se
 * renderiza mientras `page.tsx` resuelve su consulta, sin `isLoading` en
 * cliente ni estado global.
 */
export default function Loading() {
  return (
    <section>
      <h1>Contactos</h1>
      <Esqueleto filas={6} />
    </section>
  );
}
