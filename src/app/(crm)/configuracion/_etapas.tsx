"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useRef, useState } from "react";
import { Edit3, CheckCircle2, AlertTriangle } from "lucide-react";
import { crearEnvioUnico } from "./envio";
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
  won: { texto: "Ganada (Cierre)", tono: "green" },
  lost: { texto: "Perdida", tono: "red" },
};

export function EtapasPanel({ etapas, puedeEditar }: { etapas: EtapaFila[]; puedeEditar: boolean }) {
  const router = useRouter();
  const enviarUnico = useRef(crearEnvioUnico()).current;
  const [editando, setEditando] = useState<number | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  async function guardar(event: FormEvent<HTMLFormElement>, etapa: EtapaFila) {
    event.preventDefault();
    const form = event.currentTarget;
    await enviarUnico(async () => {
      if (!navigator.onLine) { setError("Sin conexión. Conéctate para guardar la etapa."); return; }
      setGuardando(true);
      setError(null);
      setExito(null);

      const datos: Record<string, unknown> = Object.fromEntries(new FormData(form).entries());
      datos.isActive = (form.elements.namedItem("isActive") as HTMLInputElement).checked;

      try {
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

        setExito(`Etapa «${etapa.name}» actualizada correctamente.`);
        setEditando(null);
        router.refresh();
      } catch {
        setGuardando(false);
        setError("Error de red al guardar la etapa.");
      }
    });
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
        <div>
          <p className="eyebrow" style={{ margin: "0 0 4px", fontSize: "12px" }}>Embudo Comercial</p>
          <h2 style={{ margin: 0, fontSize: "22px", fontWeight: 800, color: "var(--navy-950)" }}>
            Etapas de Negocios
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: "14px", color: "var(--muted)" }}>
            El nombre, orden y probabilidad asignada son configurables. La naturaleza (abierta, ganada o perdida) es inmutable para asegurar las reglas de negocio.
          </p>
        </div>
      </div>

      {etapas.length === 0 && <p role="status">No hay etapas configuradas.</p>}
      {error && (
        <div
          role="alert"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 16px",
            borderRadius: "8px",
            background: "#FEF2F2",
            border: "1px solid #FCA5A5",
            color: "#991B1B",
            marginBottom: "16px",
            fontSize: "13px",
          }}
        >
          <AlertTriangle size={18} />
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
            padding: "12px 16px",
            borderRadius: "8px",
            background: "#ECFDF5",
            border: "1px solid #6EE7B7",
            color: "#065F46",
            marginBottom: "16px",
            fontSize: "13px",
          }}
        >
          <CheckCircle2 size={18} />
          <span>{exito}</span>
        </div>
      )}

      <div className="stage-settings" style={{ borderTop: "1px solid var(--line)", marginTop: "16px" }}>
        {etapas.map((etapa) =>
          editando === etapa.id ? (
            <form
              key={etapa.id}
              className="form-grid"
              onSubmit={(e) => void guardar(e, etapa)}
              style={{
                padding: "16px",
                background: "#F8FAFC",
                borderRadius: "10px",
                border: "1px solid var(--line)",
                margin: "12px 0",
                fontSize: "13px",
              }}
            >
              <label style={{ fontSize: "13px" }}>
                Nombre de la etapa
                <input
                  name="name"
                  defaultValue={etapa.name}
                  required
                  style={{ minHeight: "44px", fontSize: "13px" }}
                />
              </label>
              <label style={{ fontSize: "13px" }}>
                Posición secuencial
                <input
                  name="position"
                  type="number"
                  min="1"
                  defaultValue={etapa.position}
                  style={{ minHeight: "44px", fontSize: "13px" }}
                />
              </label>
              <label style={{ fontSize: "13px" }}>
                Probabilidad por defecto (%)
                <input
                  name="defaultProbability"
                  type="number"
                  min="0"
                  max="100"
                  defaultValue={etapa.defaultProbability ?? ""}
                  style={{ minHeight: "44px", fontSize: "13px" }}
                />
              </label>
              <label
                className="checkbox-inline"
                style={{
                  minHeight: "44px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "13px",
                }}
              >
                <input
                  name="isActive"
                  type="checkbox"
                  defaultChecked={etapa.isActive}
                  style={{ width: "20px", height: "20px" }}
                />
                <span>Etapa activa para nuevos negocios</span>
              </label>
              <div
                className="form-actions span-2"
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  marginTop: "8px",
                }}
              >
                <button
                  className="button secondary"
                  type="button"
                  onClick={() => setEditando(null)}
                  style={{ minHeight: "44px", fontSize: "13px" }}
                >
                  Cancelar
                </button>
                <button
                  className="button primary"
                  type="submit"
                  disabled={guardando}
                  style={{ minHeight: "44px", fontSize: "13px" }}
                >
                  {guardando ? "Guardando…" : "Guardar Cambios"}
                </button>
              </div>
            </form>
          ) : (
            <div
              key={etapa.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 16px",
                borderBottom: "1px solid var(--line)",
                fontSize: "13px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <span
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: "var(--navy-100)",
                    color: "var(--navy-950)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: "13px",
                  }}
                >
                  {etapa.position}
                </span>
                <div>
                  <strong style={{ display: "block", fontSize: "15px", color: "var(--navy-950)" }}>
                    {etapa.name}
                  </strong>
                  <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                    Probabilidad: {etapa.defaultProbability !== null ? `${etapa.defaultProbability}%` : "Variable"}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Badge tone={ETIQUETAS_KIND[etapa.kind]?.tono ?? "gold"}>
                  {ETIQUETAS_KIND[etapa.kind]?.texto ?? etapa.kind}
                </Badge>
                {!etapa.isActive && <Badge tone="neutral">Inactiva</Badge>}
                {puedeEditar && (
                  <button
                    className="text-button"
                    type="button"
                    onClick={() => setEditando(etapa.id)}
                    style={{
                      minHeight: "44px",
                      padding: "8px 12px",
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "var(--navy-900)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <Edit3 size={14} />
                    <span>Editar</span>
                  </button>
                )}
              </div>
            </div>
          ),
        )}
      </div>
    </>
  );
}
