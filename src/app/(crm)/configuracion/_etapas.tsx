"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Badge } from "../_ui/prototipo-ui";

export type EtapaFila = {
  id: number;
  slug: string;
  name: string;
  position: number;
  kind: string;
  defaultProbability: number | null;
  isActive: boolean;
};

const ETIQUETAS_KIND: Record<string, { texto: string; tono: "green" | "gold" | "red" }> = {
  open: { texto: "Abierta", tono: "gold" },
  won: { texto: "Ganada", tono: "green" },
  lost: { texto: "Perdida", tono: "red" },
};

/**
 * M13 · Etapas del pipeline (decisión #29). Nombre, orden y probabilidad se
 * editan; `slug` y `kind` no aparecen en el formulario porque no se pueden
 * tocar — `kind` es de lo que dependen las reglas de negocio
 * (`domain/transicion-etapa.ts`), no del nombre.
 */
export function EtapasPanel({ etapas, puedeEditar }: { etapas: EtapaFila[]; puedeEditar: boolean }) {
  const router = useRouter();
  const [editando, setEditando] = useState<number | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guardar(event: FormEvent<HTMLFormElement>, etapa: EtapaFila) {
    event.preventDefault();
    setGuardando(true);
    setError(null);
    const form = event.currentTarget;
    const datos: Record<string, unknown> = Object.fromEntries(new FormData(form).entries());
    // Un checkbox desmarcado no aparece en `FormData.entries()` — sin esto,
    // desactivar una etapa no se enviaría nunca.
    datos.isActive = (form.elements.namedItem("isActive") as HTMLInputElement).checked;
    const respuesta = await fetch(`/api/etapas/${etapa.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(datos),
    });
    setGuardando(false);
    if (!respuesta.ok) {
      const cuerpo = await respuesta.json().catch(() => ({}));
      setError(cuerpo.error ?? "No se pudo guardar la etapa.");
      return;
    }
    setEditando(null);
    router.refresh();
  }

  return (
    <>
      <p className="eyebrow">Pipeline</p>
      <h2>Etapas del pipeline</h2>
      <p className="section-intro">El nombre y el orden son editables. La naturaleza de la etapa (abierta, ganada o perdida) es fija: de ahí cuelgan las reglas de cierre.</p>
      {error && (
        <div className="permission-note" role="alert">
          <strong>No se pudo guardar</strong>
          <p>{error}</p>
        </div>
      )}
      <div className="stage-settings">
        {etapas.map((etapa) =>
          editando === etapa.id ? (
            <form key={etapa.id} className="form-grid" onSubmit={(e) => void guardar(e, etapa)}>
              <label>
                Nombre
                <input name="name" defaultValue={etapa.name} required />
              </label>
              <label>
                Posición
                <input name="position" type="number" min="1" defaultValue={etapa.position} />
              </label>
              <label>
                Probabilidad por defecto (%)
                <input name="defaultProbability" type="number" min="0" max="100" defaultValue={etapa.defaultProbability ?? ""} />
              </label>
              <label className="checkbox-inline">
                <input name="isActive" type="checkbox" defaultChecked={etapa.isActive} />
                Activa
              </label>
              <div className="form-actions span-2">
                <button className="button" type="button" onClick={() => setEditando(null)}>
                  Cancelar
                </button>
                <button className="button primary" type="submit" disabled={guardando}>
                  {guardando ? "Guardando…" : "Guardar"}
                </button>
              </div>
            </form>
          ) : (
            <div key={etapa.id}>
              <span>{etapa.position}</span>
              <strong>{etapa.name}</strong>
              <Badge tone={ETIQUETAS_KIND[etapa.kind]?.tono ?? "gold"}>{ETIQUETAS_KIND[etapa.kind]?.texto ?? etapa.kind}</Badge>
              {!etapa.isActive && <Badge tone="neutral">Inactiva</Badge>}
              {puedeEditar && (
                <button className="text-button" type="button" onClick={() => setEditando(etapa.id)}>
                  Editar
                </button>
              )}
            </div>
          ),
        )}
      </div>
    </>
  );
}
