"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "../_ui/prototipo-ui";

export type CatalogoFila = { id: number; slug: string; name: string; position: number; isActive: boolean };

/**
 * M13 · Catálogos (motivos de pérdida y canales de captación). Mismo
 * formulario sobre dos tablas — `resolverCatalogo("motivos-perdida" |
 * "canales")` en el servidor decide a cuál (`api/catalogos/[tipo]/_tablas.ts`).
 */
export function CatalogosPanel({ motivos, canales, puedeEditar }: { motivos: CatalogoFila[]; canales: CatalogoFila[]; puedeEditar: boolean }) {
  return (
    <>
      <p className="eyebrow">Catálogos</p>
      <h2>Motivos de pérdida y canales de captación</h2>
      <div className="stage-settings">
        <ListaCatalogo tipo="motivos-perdida" titulo="Motivos de pérdida" filas={motivos} puedeEditar={puedeEditar} />
      </div>
      <div className="stage-settings" style={{ marginTop: 24 }}>
        <ListaCatalogo tipo="canales" titulo="Canales de captación" filas={canales} puedeEditar={puedeEditar} />
      </div>
    </>
  );
}

function ListaCatalogo({
  tipo,
  titulo,
  filas,
  puedeEditar,
}: {
  tipo: "motivos-perdida" | "canales";
  titulo: string;
  filas: CatalogoFila[];
  puedeEditar: boolean;
}) {
  const router = useRouter();
  const [editando, setEditando] = useState<number | null>(null);
  const [creando, setCreando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guardar(form: HTMLFormElement, id?: number) {
    setError(null);
    const datos: Record<string, unknown> = Object.fromEntries(new FormData(form).entries());
    const isActiveEl = form.elements.namedItem("isActive") as HTMLInputElement | null;
    if (isActiveEl) datos.isActive = isActiveEl.checked;

    const url = id ? `/api/catalogos/${tipo}/${id}` : `/api/catalogos/${tipo}`;
    const respuesta = await fetch(url, {
      method: id ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(datos),
    });
    if (!respuesta.ok) {
      const cuerpo = await respuesta.json().catch(() => ({}));
      setError(cuerpo.error ?? "No se pudo guardar.");
      return;
    }
    setEditando(null);
    setCreando(false);
    router.refresh();
  }

  return (
    <>
      <div className="panel-title">
        <h3>{titulo}</h3>
        {puedeEditar && !creando && (
          <button className="text-button" type="button" onClick={() => setCreando(true)}>
            + Nuevo
          </button>
        )}
      </div>
      {error && (
        <div className="permission-note" role="alert">
          <p>{error}</p>
        </div>
      )}
      {creando && (
        <form className="form-grid" onSubmit={(e) => { e.preventDefault(); void guardar(e.currentTarget); }}>
          <label>
            Nombre
            <input name="name" required autoFocus />
          </label>
          <label>
            Posición
            <input name="position" type="number" min="0" defaultValue={filas.length} />
          </label>
          <div className="form-actions">
            <button className="button" type="button" onClick={() => setCreando(false)}>
              Cancelar
            </button>
            <button className="button primary" type="submit">
              Crear
            </button>
          </div>
        </form>
      )}
      {filas.map((fila) =>
        editando === fila.id ? (
          <form key={fila.id} className="form-grid" onSubmit={(e) => { e.preventDefault(); void guardar(e.currentTarget, fila.id); }}>
            <label>
              Nombre
              <input name="name" defaultValue={fila.name} required />
            </label>
            <label>
              Posición
              <input name="position" type="number" min="0" defaultValue={fila.position} />
            </label>
            <label className="checkbox-inline">
              <input name="isActive" type="checkbox" defaultChecked={fila.isActive} />
              Activo
            </label>
            <div className="form-actions span-2">
              <button className="button" type="button" onClick={() => setEditando(null)}>
                Cancelar
              </button>
              <button className="button primary" type="submit">
                Guardar
              </button>
            </div>
          </form>
        ) : (
          <div key={fila.id}>
            <span>{fila.position}</span>
            <strong>{fila.name}</strong>
            {!fila.isActive && <Badge tone="neutral">Inactivo</Badge>}
            {puedeEditar && (
              <button className="text-button" type="button" onClick={() => setEditando(fila.id)}>
                Editar
              </button>
            )}
          </div>
        ),
      )}
    </>
  );
}
