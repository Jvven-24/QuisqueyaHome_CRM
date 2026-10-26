"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useMemo } from "react";
import {
  RotateCcw,
  Search,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Filter,
} from "lucide-react";
import { crearEnvioUnico } from "./envio";
import { Badge, Modal } from "../_ui/prototipo-ui";
import { Vacio } from "../_ui/estados";

export type PapeleraFila = {
  entityType: "contact" | "lead" | "deal" | "project" | "unit" | "user";
  id: number;
  nombre: string | null;
  borradoEn: Date | null;
};

const ETIQUETAS_ENTIDAD: Record<PapeleraFila["entityType"], { nombre: string; tono: "neutral" | "gold" | "green" | "red" | "blue" }> = {
  contact: { nombre: "Contacto", tono: "blue" },
  lead: { nombre: "Lead", tono: "gold" },
  deal: { nombre: "Negocio", tono: "green" },
  project: { nombre: "Proyecto", tono: "neutral" },
  unit: { nombre: "Unidad", tono: "neutral" },
  user: { nombre: "Usuario", tono: "red" },
};

export function PapeleraPanel({
  filas,
  puedeEditar,
}: {
  filas: PapeleraFila[];
  puedeEditar: boolean;
}) {
  const router = useRouter();
  const enviarUnico = useRef(crearEnvioUnico()).current;
  const [restaurando, setRestaurando] = useState<string | null>(null);
  const [registroPorRestaurar, setRegistroPorRestaurar] = useState<PapeleraFila | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [busqueda, setBusqueda] = useState("");
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  const filasFiltradas = useMemo(() => {
    return filas.filter((fila) => {
      if (filtroTipo !== "todos" && fila.entityType !== filtroTipo) {
        return false;
      }
      if (busqueda.trim() !== "") {
        const texto = `${fila.nombre ?? ""} #${fila.id}`.toLowerCase();
        if (!texto.includes(busqueda.toLowerCase())) {
          return false;
        }
      }
      return true;
    });
  }, [filas, filtroTipo, busqueda]);

  async function ejecutarRestauracion(fila: PapeleraFila) {
    await enviarUnico(async () => {
      if (!navigator.onLine) { setMensajeError("Sin conexión. Conéctate para restaurar el registro."); return; }
      setRegistroPorRestaurar(null);
      setMensajeError(null);
      setMensajeExito(null);

      const clave = `${fila.entityType}:${fila.id}`;
      setRestaurando(clave);

      try {
        const respuesta = await fetch("/api/papelera/restaurar", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ entityType: fila.entityType, id: fila.id }),
        });
        setRestaurando(null);

        if (!respuesta.ok) {
          const cuerpo = await respuesta.json().catch(() => ({}));
          setMensajeError(cuerpo.error ?? "No se pudo restaurar el registro.");
          return;
        }

        setMensajeExito(`Registro «${fila.nombre ?? `#${fila.id}`}» restaurado con éxito. Se encuentra activo nuevamente.`);
        router.refresh();
      } catch {
        setRestaurando(null);
        setMensajeError("Error de comunicación con el servidor al restaurar.");
      }
    });
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
        <div>
          <p className="eyebrow" style={{ margin: "0 0 4px", fontSize: "12px" }}>Gobernanza & Auditoría</p>
          <h2 style={{ margin: 0, fontSize: "22px", fontWeight: 800, color: "var(--navy-950)" }}>
            Papelera de Reciclaje Lógica
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: "14px", color: "var(--muted)" }}>
            Historial de registros desestimados o eliminados. Los datos se conservan íntegramente para recuperación instantánea.
          </p>
        </div>
      </div>

      {/* Banner de Cero Borrado Físico */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "14px 18px",
          borderRadius: "10px",
          background: "#F0FDF4",
          border: "1px solid #BBF7D0",
          color: "#166534",
          marginBottom: "18px",
          fontSize: "13px",
        }}
      >
        <ShieldCheck size={22} className="shrink-0" color="#16A34A" />
        <div>
          <strong style={{ display: "block", fontSize: "14px" }}>
            Arquitectura de Cero Borrado Físico
          </strong>
          <span>
            En Quisqueya Home, ningún dato sensible se destruye permanentemente de la base de datos. Los borrados son marcas lógicas auditables (`deleted_at`), asegurando la trazabilidad de prospectos, negocios y contratos.
          </span>
        </div>
      </div>

      {/* Alertas de Éxito y Error no nativas */}
      {mensajeExito && (
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
          <span>{mensajeExito}</span>
        </div>
      )}

      {mensajeError && (
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
          <span>{mensajeError}</span>
        </div>
      )}

      {/* Filtros por Tipo y Buscador */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "16px",
        }}
      >
        <div style={{ position: "relative", minWidth: "260px", flex: "1 1 300px" }}>
          <Search size={16} style={{ position: "absolute", left: "14px", top: "14px", color: "var(--muted)" }} />
          <input
            type="search"
            placeholder="Buscar por nombre o identificador…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{
              minHeight: "44px",
              paddingLeft: "40px",
              fontSize: "13px",
              borderRadius: "8px",
              border: "1px solid var(--line)",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
          <Filter size={15} color="var(--muted)" />
          {([
            { id: "todos", label: "Todos" },
            { id: "lead", label: "Leads" },
            { id: "contact", label: "Contactos" },
            { id: "deal", label: "Negocios" },
            { id: "project", label: "Proyectos" },
            { id: "unit", label: "Unidades" },
            { id: "user", label: "Usuarios" },
          ] as const).map((filtro) => {
            const activo = filtroTipo === filtro.id;
            return (
              <button
                key={filtro.id}
                type="button"
                onClick={() => setFiltroTipo(filtro.id)}
                style={{
                  minHeight: "44px",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: activo ? "1px solid var(--gold-600)" : "1px solid var(--line)",
                  background: activo ? "var(--navy-950)" : "var(--surface)",
                  color: activo ? "#FFFFFF" : "var(--ink)",
                  fontWeight: activo ? 700 : 500,
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                {filtro.label}
              </button>
            );
          })}
        </div>
      </div>

      {filasFiltradas.length === 0 ? (
        <Vacio
          titulo="Sin registros coincidentes"
          texto={
            filas.length === 0
              ? "La papelera está vacía. No existen registros eliminados lógicamente."
              : "No se encontraron elementos para el filtro o término de búsqueda seleccionado."
          }
        />
      ) : (
        <div className="table-wrap" style={{ border: "1px solid var(--line)", borderRadius: "10px", overflow: "hidden" }}>
          <table style={{ width: "100%", fontSize: "13px" }}>
            <thead>
              <tr>
                <th style={{ fontSize: "12px" }}>Entidad</th>
                <th style={{ fontSize: "12px" }}>Registro / Identificador</th>
                <th style={{ fontSize: "12px" }}>Fecha de Borrado</th>
                {puedeEditar && <th style={{ textAlign: "right", fontSize: "12px" }}>Acción</th>}
              </tr>
            </thead>
            <tbody>
              {filasFiltradas.map((fila) => {
                const entidadInfo = ETIQUETAS_ENTIDAD[fila.entityType] ?? { nombre: fila.entityType, tono: "neutral" };
                const estaRestaurando = restaurando === `${fila.entityType}:${fila.id}`;

                return (
                  <tr key={`${fila.entityType}-${fila.id}`} style={{ borderBottom: "1px solid var(--line)" }}>
                    <td style={{ padding: "12px 16px" }}>
                      <Badge tone={entidadInfo.tono}>{entidadInfo.nombre}</Badge>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <strong style={{ display: "block", color: "var(--navy-950)", fontSize: "14px" }}>
                        {fila.nombre ?? `#${fila.id}`}
                      </strong>
                      <span style={{ fontSize: "12px", color: "var(--muted)", fontFamily: "monospace" }}>
                        ID #{fila.id} · {fila.entityType}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", color: "var(--muted)" }}>
                      {fila.borradoEn
                        ? new Intl.DateTimeFormat("es-DO", {
                            timeZone: "America/Santo_Domingo",
                            dateStyle: "medium",
                            timeStyle: "short",
                          }).format(new Date(fila.borradoEn))
                        : "—"}
                    </td>
                    {puedeEditar && (
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        <button
                          type="button"
                          disabled={estaRestaurando}
                          onClick={() => setRegistroPorRestaurar(fila)}
                          style={{
                            minHeight: "44px",
                            padding: "8px 16px",
                            borderRadius: "8px",
                            border: "1px solid var(--line)",
                            background: "var(--surface)",
                            color: "var(--navy-900)",
                            fontWeight: 700,
                            fontSize: "13px",
                            cursor: estaRestaurando ? "not-allowed" : "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            transition: "all 140ms ease",
                          }}
                        >
                          <RotateCcw size={15} color="var(--gold-700)" />
                          <span>{estaRestaurando ? "Restaurando…" : "Restaurar"}</span>
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal no nativo de confirmación de restauración */}
      {registroPorRestaurar && (
        <Modal
          title="Confirmar Restauración de Registro"
          onClose={() => setRegistroPorRestaurar(null)}
        >
          <div style={{ display: "grid", gap: "14px" }}>
            <p style={{ margin: 0, fontSize: "14px", color: "var(--ink)", lineHeight: 1.5 }}>
              ¿Deseas restaurar el registro{" "}
              <strong>{registroPorRestaurar.nombre ?? `#${registroPorRestaurar.id}`}</strong> correspondiente a{" "}
              <strong>{ETIQUETAS_ENTIDAD[registroPorRestaurar.entityType]?.nombre}</strong>?
            </p>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--muted)" }}>
              El registro volverá a estar plenamente disponible en su módulo operativo correspondiente con todas sus relaciones intactas.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", paddingTop: "8px" }}>
              <button
                type="button"
                className="button secondary"
                onClick={() => setRegistroPorRestaurar(null)}
                style={{ minHeight: "44px", fontSize: "13px" }}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="button primary"
                onClick={() => void ejecutarRestauracion(registroPorRestaurar)}
                style={{ minHeight: "44px", fontSize: "13px" }}
              >
                Confirmar Restauración
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
