"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "../_ui/prototipo-ui";
import { Vacio } from "../_ui/estados";

export type PapeleraFila = {
  entityType: "contact" | "lead" | "deal" | "project" | "unit" | "user";
  id: number;
  nombre: string | null;
  borradoEn: Date | null;
};

const ETIQUETAS_ENTIDAD: Record<PapeleraFila["entityType"], string> = {
  contact: "Contacto",
  lead: "Lead",
  deal: "Negocio",
  project: "Proyecto",
  unit: "Unidad",
  user: "Usuario",
};

/**
 * M13 · Papelera (`docs/F2_ANALISIS_Y_PLAN.md` paso 5). El pendiente que F1
 * dejó anotado para M13: hasta ahora el borrado lógico se escribía y
 * `visibleRows` lo excluía, pero no había forma de verlo ni de deshacerlo.
 */
export function PapeleraPanel({ filas, puedeEditar }: { filas: PapeleraFila[]; puedeEditar: boolean }) {
  const router = useRouter();
  const [restaurando, setRestaurando] = useState<string | null>(null);

  async function restaurar(fila: PapeleraFila) {
    const clave = `${fila.entityType}:${fila.id}`;
    setRestaurando(clave);
    const respuesta = await fetch("/api/papelera/restaurar", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ entityType: fila.entityType, id: fila.id }),
    });
    setRestaurando(null);
    if (!respuesta.ok) {
      const cuerpo = await respuesta.json().catch(() => ({}));
      alert(cuerpo.error ?? "No se pudo restaurar.");
      return;
    }
    router.refresh();
  }

  return (
    <>
      <p className="eyebrow">Recuperación</p>
      <h2>Papelera</h2>
      <p className="section-intro">Lo borrado desde cualquier módulo aparece aquí — el borrado siempre es lógico, nunca definitivo.</p>
      {filas.length === 0 ? (
        <Vacio titulo="La papelera está vacía" texto="Nada se ha eliminado todavía." />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Registro</th>
                <th>Eliminado</th>
                {puedeEditar && <th></th>}
              </tr>
            </thead>
            <tbody>
              {filas.map((fila) => (
                <tr key={`${fila.entityType}-${fila.id}`}>
                  <td>
                    <Badge tone="neutral">{ETIQUETAS_ENTIDAD[fila.entityType]}</Badge>
                  </td>
                  <td>{fila.nombre ?? `#${fila.id}`}</td>
                  <td>{fila.borradoEn ? new Date(fila.borradoEn).toLocaleString("es-DO") : "—"}</td>
                  {puedeEditar && (
                    <td>
                      <button
                        className="text-button"
                        type="button"
                        disabled={restaurando === `${fila.entityType}:${fila.id}`}
                        onClick={() => void restaurar(fila)}
                      >
                        Restaurar
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
