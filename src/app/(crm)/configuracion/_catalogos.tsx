"use client";
import { Switch } from "@/components/ui/switch";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Plus, Edit3, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { CrearEntradaInput, EditarEntradaInput } from "@/application/catalogos/entrada";
import { crearEnvioUnico } from "./envio";
import { Badge } from "../_ui/prototipo-ui";

export type CatalogoFila = { id: number; slug: string; name: string; position: number; isActive: boolean };

export function CatalogosPanel({
  motivos,
  canales,
  puedeEditar,
  puedeCrear,
}: {
  motivos: CatalogoFila[];
  canales: CatalogoFila[];
  puedeEditar: boolean;
  puedeCrear: boolean;
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

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", minWidth: 0, gap: "28px" }}>
        <ListaCatalogo tipo="motivos-perdida" titulo="Motivos de Desestimación o Pérdida" filas={motivos} puedeEditar={puedeEditar} puedeCrear={puedeCrear} />
        <ListaCatalogo tipo="canales" titulo="Canales de Captación de Leads" filas={canales} puedeEditar={puedeEditar} puedeCrear={puedeCrear} />
      </div>
    </>
  );
}

function ListaCatalogo({
  tipo,
  titulo,
  filas,
  puedeEditar,
  puedeCrear,
}: {
  tipo: "motivos-perdida" | "canales";
  titulo: string;
  filas: CatalogoFila[];
  puedeEditar: boolean;
  puedeCrear: boolean;
}) {
  const router = useRouter();
  const enviarUnico = useRef(crearEnvioUnico()).current;
  const [guardando, setGuardando] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [editando, setEditando] = useState<number | null>(null);
  const [creando, setCreando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guardar(form: HTMLFormElement, id?: number) {
    await enviarUnico(async () => {
      setError(null); setErrores({});
      if (!(id ? puedeEditar : puedeCrear)) { setError("No tienes permiso para guardar este catálogo."); return; }
      if (!navigator.onLine) { setError("Sin conexión. Conéctate para guardar el registro."); return; }
      const data = new FormData(form);
      const activo = form.elements.namedItem("isActive") as HTMLInputElement | null;
      const entrada = { name: data.get("name"), position: data.get("position"), ...(id ? { isActive: activo?.checked ?? false } : {}) };
      const resultado = (id ? EditarEntradaInput : CrearEntradaInput).safeParse(entrada);
      if (!resultado.success) {
        setErrores(Object.fromEntries(resultado.error.issues.map((issue) => [String(issue.path[0]), issue.message])));
        const campo = form.elements.namedItem(String(resultado.error.issues[0]?.path[0]));
        if (campo instanceof HTMLElement) campo.focus();
        return;
      }
      setGuardando(true);
      try {
        const respuesta = await fetch(id ? `/api/catalogos/${tipo}/${id}` : `/api/catalogos/${tipo}`, {
          method: id ? "PATCH" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(resultado.data),
        });
        if (!respuesta.ok) {
          const cuerpo = await respuesta.json().catch(() => ({}));
          setErrores(cuerpo.fields ?? {});
          setError(respuesta.status === 403 ? "No tienes permiso para guardar este catálogo." : cuerpo.error ?? "No se pudo guardar el elemento.");
          return;
        }
        // El Toaster del shell queda fuera del flujo: confirmar no desplaza el catálogo.
        toast.success(`Se guardó «${resultado.data.name}».`);
        setEditando(null); setCreando(false); router.refresh();
      } catch { setError("Error de red. El registro no se pudo guardar; vuelve a intentarlo."); }
      finally { setGuardando(false); }
    });
  }

  return (
    <div style={{ minWidth: 0, overflowWrap: "anywhere", background: "#F8FAFC", border: "1px solid var(--line)", borderRadius: "12px", padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", marginBottom: "14px" }}>
        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--navy-950)" }}>{titulo}</h3>
        {puedeCrear && !creando && (
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

      {creando && (
        <form
          noValidate
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
            Nombre de la opción *
            <input name="name" required autoFocus aria-invalid={Boolean(errores.name)} aria-describedby={errores.name ? `${tipo}-crear-name-error` : undefined} style={{ minHeight: "44px", fontSize: "13px" }} />
            {errores.name && <small id={`${tipo}-crear-name-error`} role="alert">{errores.name}</small>}
          </label>
          <label style={{ fontSize: "13px" }}>
            Posición
            {errores.position && <small id={`${tipo}-crear-position-error`} role="alert">{errores.position}</small>}
            <input name="position" type="number" min="0" step="1" defaultValue={filas.length} aria-invalid={Boolean(errores.position)} aria-describedby={errores.position ? `${tipo}-crear-position-error` : undefined} style={{ minHeight: "44px", fontSize: "13px" }} />
          </label>
          <div className="form-actions" style={{ display: "flex", justifyContent: "flex-end", flexWrap: "wrap", gap: "8px" }}>
            <button
              className="button secondary"
              type="button"
              onClick={() => setCreando(false)}
              style={{ minHeight: "44px", fontSize: "13px" }}
            >
              Cancelar
            </button>
            <button className="button primary" type="submit" disabled={guardando} aria-busy={guardando} style={{ minHeight: "44px", fontSize: "13px" }}>
              {guardando ? "Guardando…" : "Crear Opción"}
            </button>
          </div>
        </form>
      )}

      {filas.length === 0 && <p role="status">No hay opciones en este catálogo.</p>}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", minWidth: 0, gap: "8px" }}>
        {filas.map((fila) =>
          editando === fila.id ? (
            <form
              noValidate
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
                Nombre *
                <input name="name" defaultValue={fila.name} required aria-invalid={Boolean(errores.name)} aria-describedby={errores.name ? `${tipo}-${fila.id}-name-error` : undefined} style={{ minHeight: "44px", fontSize: "13px" }} />
                {errores.name && <small id={`${tipo}-${fila.id}-name-error`} role="alert">{errores.name}</small>}
              </label>
              <label style={{ fontSize: "13px" }}>
                Posición
                {errores.position && <small id={`${tipo}-${fila.id}-position-error`} role="alert">{errores.position}</small>}
                <input name="position" type="number" min="0" step="1" defaultValue={fila.position} aria-invalid={Boolean(errores.position)} aria-describedby={errores.position ? `${tipo}-${fila.id}-position-error` : undefined} style={{ minHeight: "44px", fontSize: "13px" }} />
              </label>
              <label className="checkbox-inline span-2" style={{ minHeight: "44px", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
                <Switch name="isActive" defaultChecked={fila.isActive} aria-label="Opción activa en formularios" />
                <span>Opción activa en formularios</span>
              </label>
              <div className="form-actions span-2" style={{ display: "flex", justifyContent: "flex-end", flexWrap: "wrap", gap: "8px" }}>
                <button
                  className="button secondary"
                  type="button"
                  onClick={() => setEditando(null)}
                  style={{ minHeight: "44px", fontSize: "13px" }}
                >
                  Cancelar
                </button>
                <button className="button primary" type="submit" disabled={guardando} aria-busy={guardando} style={{ minHeight: "44px", fontSize: "13px" }}>
                  {guardando ? "Guardando…" : "Guardar"}
                </button>
              </div>
            </form>
          ) : (
            <div
              key={fila.id}
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
                minWidth: 0,
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                background: "#FFFFFF",
                borderRadius: "8px",
                border: "1px solid var(--line)",
                fontSize: "13px",
              }}
            >
              <div style={{ display: "flex", flex: "1 1 180px", minWidth: 0, alignItems: "center", gap: "10px" }}>
                <span
                  style={{
                    width: "28px",
                    flexShrink: 0,
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
                <strong style={{ minWidth: 0, overflowWrap: "anywhere", color: "var(--navy-950)" }}>{fila.name}</strong>
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
