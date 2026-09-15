"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useRef, useState } from "react";
import { PROJECT_TYPES } from "@/domain/catalogs";
import type { projects } from "@/infrastructure/db/schema";

type Proyecto = typeof projects.$inferSelect;
export type BrokerOpcion = { id: number; fullName: string };

export const ETIQUETAS_TIPO: Record<string, string> = {
  blueprint: "En planos",
  presale: "Preventa",
  under_construction: "En construcción",
  delivered: "Entregado",
  rental: "Alquiler",
};

/**
 * Alta y edición de proyecto en un solo componente (M5): mismos siete
 * campos, solo cambia el método y si hay valores previos que precargar —
 * mismo criterio que `FormularioUnidad` en `[slug]/vista.tsx`. Sin
 * `proyecto`, crea (`POST /api/proyectos`, desde la rejilla); con
 * `proyecto`, edita (`PATCH /api/proyectos/[id]`, desde el detalle).
 */
export function FormularioProyecto({
  proyecto,
  brokers,
  puedeEditarPrecioReal,
  onClose,
}: {
  proyecto?: Proyecto;
  brokers: BrokerOpcion[];
  /** Hallazgo P1: el campo no se pinta si el actor no tiene `unit_real_price:edit` — el servidor lo descartaría igual, pero mostrarlo sin poder usarlo no es interfaz. */
  puedeEditarPrecioReal: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const editando = Boolean(proyecto);

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!formRef.current) return;
    setEnviando(true);
    setErrores({});

    const datos = Object.fromEntries(new FormData(formRef.current).entries());
    const url = editando ? `/api/proyectos/${proyecto!.id}` : "/api/proyectos";
    const respuesta = await fetch(url, {
      method: editando ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(datos),
    });
    const cuerpo = await respuesta.json().catch(() => ({}));
    setEnviando(false);

    if (!respuesta.ok) {
      setErrores(cuerpo.fields ?? { _: cuerpo.error ?? "No se pudo guardar el proyecto." });
      return;
    }

    router.refresh();
    onClose();
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="proyecto-title">
        <div className="drawer-head">
          <h2 id="proyecto-title">{editando ? "Editar proyecto" : "Nuevo proyecto"}</h2>
          <button className="icon-button" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>
        <form className="form-grid" ref={formRef} onSubmit={enviar}>
          <label className="span-2">
            Nombre del proyecto
            <input name="name" defaultValue={proyecto?.name} required />
            {errores.name && <small style={{ color: "#b42318" }}>{errores.name}</small>}
          </label>
          <label>
            Zona
            <input name="zone" defaultValue={proyecto?.zone ?? ""} placeholder="Punta Cana" />
          </label>
          <label>
            Tipo
            <select name="projectType" defaultValue={proyecto?.projectType ?? "blueprint"}>
              {PROJECT_TYPES.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {ETIQUETAS_TIPO[tipo]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Desarrollador
            <input name="developer" defaultValue={proyecto?.developer ?? ""} />
          </label>
          <label>
            Entrega estimada
            <input name="estimatedDeliveryDate" type="date" defaultValue={proyecto?.estimatedDeliveryDate ?? ""} />
          </label>
          {editando && (
            <label>
              Avance de obra (%)
              <input name="progressPercent" type="number" min="0" max="100" defaultValue={proyecto!.progressPercent} />
            </label>
          )}
          {puedeEditarPrecioReal && (
            <label>
              Precio interno (real)
              <input
                name="internalPriceCents"
                type="number"
                min="0"
                placeholder="Centavos, ej. 14000000"
                defaultValue={proyecto?.internalPriceCents ?? ""}
              />
            </label>
          )}
          <label>
            Broker responsable
            <select name="brokerId" defaultValue={proyecto?.brokerId ?? ""}>
              <option value="">Sin asignar</option>
              {brokers.map((broker) => (
                <option key={broker.id} value={broker.id}>
                  {broker.fullName}
                </option>
              ))}
            </select>
          </label>
          {errores._ && <small style={{ color: "#b42318" }}>{errores._}</small>}
          <div className="form-actions span-2">
            <button className="button" type="button" onClick={onClose}>
              Cancelar
            </button>
            <button className="button primary" type="submit" disabled={enviando}>
              {enviando ? "Guardando…" : editando ? "Guardar cambios" : "Crear proyecto"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
