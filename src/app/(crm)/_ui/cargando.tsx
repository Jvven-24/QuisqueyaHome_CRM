/**
 * Esqueleto de carga (T5) — el prototipo nunca tuvo estado de carga porque
 * todo vivía en `useState` sin `fetch` (ver `docs/contexto/arquitectura.md`).
 * Lo usan los `loading.tsx` de cada módulo, que Next 15 renderiza mientras el
 * componente de servidor de la página resuelve su consulta.
 *
 * El CSS (`.skeleton`, `.skeleton-block`, `.skeleton-line`) se añadió en
 * `globals.css` junto a `.empty`, porque es de los cuatro estados que el
 * prototipo no traía. Respeta `prefers-reduced-motion` a través de la regla
 * global que ya existe al final de `globals.css`.
 */
export function Esqueleto({ filas = 5 }: { filas?: number }) {
  return (
    <div className="skeleton-block" role="status" aria-label="Cargando contenido">
      <div className="skeleton skeleton-line short" aria-hidden="true" />
      {Array.from({ length: filas }).map((_, indice) => (
        <div key={indice} className="skeleton skeleton-line" aria-hidden="true" />
      ))}
    </div>
  );
}
