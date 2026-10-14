"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, Edit3, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Badge } from "../_ui/prototipo-ui";

export type CatalogoFila = { id: number; slug: string; name: string; position: number; isActive: boolean };

export function CatalogosPanel({
  motivos,
  canales,
  puedeEditar,
}: {
  motivos: CatalogoFila[];
  canales: CatalogoFila[];
  puedeEditar: boolean;
}) {
  return (
    <>
      <div style={{ marginBottom: "20px" }}>
        <p className="eyebrow" style={{ margin: "0 0 4px", fontSize: "12px" }}>Tablas Maestras</p>
        <h2 style={{ margin: 0, fontSize: "22px", fontWeight: 800, color: "var(--navy-950)" }}>
          Catálogos Comerciales
        </h2>
        <p style={{ margin: "4px 0 0", fontSize: "14px", color: "var(--muted)" }}>
          Administra las opciones normalizadas para motivos de desestimación de negocios y canales de captación de prospectos.
        </p>
      </div>

      <div style={{ display: "grid", gap: "28px" }}>
        <ListaCatalogo tipo="motivos-perdida" titulo="Motivos de Desestimación o Pérdida" filas={motivos} puedeEditar={puedeEditar} />
        <ListaCatalogo tipo="canales" titulo="Canales de Captación de Leads" filas={canales} puedeEditar={puedeEditar} />
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
  const [exito, setExito] = useState<string | null>(null);

  async function guardar(form: HTMLFormElement, id?: number) {
    setError(null);
    setExito(null);
    const datos: Record<string, unknown> = Object.fromEntries(new FormData(form).entries());
    const isActiveEl = form.elements.namedItem("isActive") as HTMLInputElement | null;
    if (isActiveEl) datos.isActive = isActiveEl.checked;

    const url = id ? `/api/catalogos/${tipo}/${id}` : `/api/catalogos/${tipo}`;
    try {
      const respuesta = await fetch(url, {
        method: id ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(datos),
      });
      if (!respuesta.ok) {
        const cuerpo = await respuesta.json().catch(() => ({}));
        setError(cuerpo.error ?? "No se pudo guardar el elemento.");
        return;
      }
      setExito(`Elemento guardado correctamente.`);
      setEditando(null);
      setCreando(false);
      router.refresh();
    } catch {
      setError("Error de red al guardar el registro.");
    }
  }

  return (
    <div style={{ background: "#F8FAFC", border: "1px solid var(--line)", borderRadius: "12px", padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--navy-950)" }}>{titulo}</h3>
        {puedeEditar && !creando && (
          <button
            className="text-button"
            type="button"
            onClick={() => setCreando(true)}
            style={{
              minHeight: "44px",
              padding: "8px 14px",
              fontSize: "13px",
              fontWeight: 700,
              color: "var(--gold-700)",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Plus size={16} />
            <span>Nuevo Registro</span>
          </button>
        )}
      </div>

      {error && (
        <div
          role="alert"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "10px 14px",
            borderRadius: "8px",
            background: "#FEF2F2",
            border: "1px solid #FCA5A5",
            color: "#991B1B",
            marginBottom: "12px",
            fontSize: "13px",
          }}
        >
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {exito && (
        <div
          role="status"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "10px 14px",
            borderRadius: "8px",
            background: "#ECFDF5",
            border: "1px solid #6EE7B7",
            color: "#065F46",
            marginBottom: "12px",
            fontSize: "13px",
          }}
        >
          <CheckCircle2 size={16} />
          <span>{exito}</span>
        </div>
      )}

      {creando && (
        <form
          className="form-grid"
          onSubmit={(e) => {
            e.preventDefault();
            void guardar(e.currentTarget);
          }}
          style={{
            background: "#FFFFFF",
            border: "1px solid var(--line)",
            borderRadius: "8px",
            padding: "14px",
            marginBottom: "14px",
            fontSize: "13px",
          }}
        >
          <label style={{ fontSize: "13px" }}>
            Nombre de la opción
            <input name="name" required autoFocus style={{ minHeight: "44px", fontSize: "13px" }} />
          </label>
          <label style={{ fontSize: "13px" }}>
            Posición
            <input name="position" type="number" min="0" defaultValue={filas.length} style={{ minHeight: "44px", fontSize: "13px" }} />
          </label>
          <div className="form-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
            <button
              className="button secondary"
              type="button"
              onClick={() => setCreando(false)}
              style={{ minHeight: "44px", fontSize: "13px" }}
            >
              Cancelar
            </button>
            <button className="button primary" type="submit" style={{ minHeight: "44px", fontSize: "13px" }}>
              Crear Opción
            </button>
          </div>
        </form>
      )}

      <div style={{ display: "grid", gap: "8px" }}>
        {filas.map((fila) =>
          editando === fila.id ? (
            <form
              key={fila.id}
              className="form-grid"
              onSubmit={(e) => {
                e.preventDefault();
                void guardar(e.currentTarget, fila.id);
              }}
              style={{
                background: "#FFFFFF",
                border: "1px solid var(--line)",
                borderRadius: "8px",
                padding: "14px",
                fontSize: "13px",
              }}
            >
              <label style={{ fontSize: "13px" }}>
                Nombre
                <input name="name" defaultValue={fila.name} required style={{ minHeight: "44px", fontSize: "13px" }} />
              </label>
              <label style={{ fontSize: "13px" }}>
                Posición
                <input name="position" type="number" min="0" defaultValue={fila.position} style={{ minHeight: "44px", fontSize: "13px" }} />
              </label>
              <label className="checkbox-inline span-2" style={{ minHeight: "44px", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
                <input name="isActive" type="checkbox" defaultChecked={fila.isActive} style={{ width: "20px", height: "20px" }} />
                <span>Opción activa en formularios</span>
              </label>
              <div className="form-actions span-2" style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                <button
                  className="button secondary"
                  type="button"
                  onClick={() => setEditando(null)}
                  style={{ minHeight: "44px", fontSize: "13px" }}
                >
                  Cancelar
                </button>
                <button className="button primary" type="submit" style={{ minHeight: "44px", fontSize: "13px" }}>
                  Guardar
                </button>
              </div>
            </form>
          ) : (
            <div
              key={fila.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                background: "#FFFFFF",
                borderRadius: "8px",
                border: "1px solid var(--line)",
                fontSize: "13px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: "var(--navy-100)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "12px",
                  }}
                >
                  {fila.position}
                </span>
                <strong style={{ color: "var(--navy-950)" }}>{fila.name}</strong>
                {!fila.isActive && <Badge tone="neutral">Inactivo</Badge>}
              </div>
              {puedeEditar && (
                <button
                  className="text-button"
                  type="button"
                  onClick={() => setEditando(fila.id)}
                  style={{
                    minHeight: "44px",
                    padding: "6px 12px",
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "var(--navy-900)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <Edit3 size={14} />
                  <span>Editar</span>
                </button>
              )}
            </div>
          ),
        )}
      </div>
    </div>
  );
}
