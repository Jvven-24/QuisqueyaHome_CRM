"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useRef, useState } from "react";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { OPERATION_TYPES, PRICE_PERIODS, UNIT_STATUSES } from "@/domain/catalogs";
import type { projects, units } from "@/infrastructure/db/schema";
import { Badge, PageHeader } from "../../_ui/prototipo-ui";
import { AlertaErrorFormulario } from "../../_ui/alerta-error-formulario";
import { centavosAUnidad, unidadACentavos } from "../../_ui/formato";
import { Vacio } from "../../_ui/estados";
import { ETIQUETAS_TIPO, FormularioProyecto, type BrokerOpcion } from "../_formulario-proyecto";

type Proyecto = typeof projects.$inferSelect;
type Unidad = typeof units.$inferSelect;

const ETIQUETAS_ESTADO: Record<string, { texto: string; tono: "green" | "gold" | "neutral" | "red" }> = {
  available: { texto: "Disponible", tono: "green" },
  reserved: { texto: "Reservada", tono: "gold" },
  sold: { texto: "Vendida", tono: "neutral" },
  unavailable: { texto: "No disponible", tono: "red" },
};

function formatoCents(cents: number | null, currency: string): string {
  return cents == null ? "—" : `${currency} ${(cents / 100).toLocaleString("es-DO")}`;
}

/**
 * M5 · Propiedades — ficha del proyecto (F2). A diferencia del prototipo (que
 * mostraba una tabla de unidades de muestra fija, `PropertiesView`), aquí la
 * tabla es la real de `units`, con el precio real ya decidido en el servidor
 * (`page.tsx`, `stripRestrictedPrices`) — la columna se omite del todo cuando
 * el actor no tiene el permiso, no se pinta y se oculta con CSS.
 */
export function PropiedadDetalleVista({
  proyecto,
  unidades,
  brokers,
  puedeEditarProyecto,
  puedeCrearUnidad,
  puedeEditarUnidad,
  puedeEliminarUnidad,
  puedeEditarPrecioReal,
  puedeVerAvances,
}: {
  proyecto: Proyecto;
  unidades: Unidad[];
  brokers: BrokerOpcion[];
  puedeEditarProyecto: boolean;
  puedeCrearUnidad: boolean;
  puedeEditarUnidad: boolean;
  puedeEliminarUnidad: boolean;
  /** Hallazgo P1: sin esto, el precio real se ve y se envía en los formularios aunque el servidor lo descarte. */
  puedeEditarPrecioReal: boolean;
  /** M6 (issue #32): sin `construction_phases:view` el enlace ni se pinta — igual criterio que el resto de acciones. */
  puedeVerAvances: boolean;
}) {
  const router = useRouter();
  const [editandoProyecto, setEditandoProyecto] = useState(false);
  const [creandoUnidad, setCreandoUnidad] = useState(false);
  const [editandoUnidad, setEditandoUnidad] = useState<Unidad | null>(null);

  // La columna "Precio real" solo se pinta si alguna unidad trae el dato (el
  // actor tiene el permiso `unit_real_price`) o si puede editar unidades —
  // quien no ve ni edita precios no necesita la columna vacía.
  const muestraColumnaPrecio = unidades.some((u) => u.realPriceCents !== null) || puedeEditarUnidad;

  async function eliminarUnidad(unidad: Unidad) {
    if (!confirm(`¿Eliminar la unidad ${unidad.code}? Podrás verla en la papelera, no se borra de la base.`)) return;
    const respuesta = await fetch(`/api/proyectos/${proyecto.id}/unidades/${unidad.id}`, { method: "DELETE" });
    if (!respuesta.ok) {
      const cuerpo = await respuesta.json().catch(() => ({}));
      alert(cuerpo.error ?? "No se pudo eliminar la unidad.");
      return;
    }
    router.refresh();
  }

  return (
    <>
      <Link className="back-button" href="/propiedades">
        ← Volver a propiedades
      </Link>
      <PageHeader
        eyebrow="Inventario privado"
        title={proyecto.name}
        subtitle={`${proyecto.zone ?? "Sin zona"} · ${ETIQUETAS_TIPO[proyecto.projectType] ?? proyecto.projectType}${
          proyecto.estimatedDeliveryDate ? ` · Entrega estimada ${proyecto.estimatedDeliveryDate}` : ""
        }`}
        action={
          <>
            {puedeVerAvances && (
              <Link className="button secondary" href={`/avances?proyecto=${proyecto.slug}`}>
                Ver avances
              </Link>
            )}
            {puedeEditarProyecto && (
              <button className="button primary" type="button" onClick={() => setEditandoProyecto(true)}>
                Editar proyecto
              </button>
            )}
          </>
        }
      />
      <div className="project-summary">
        <div className="property-visual large">
          <span>QH</span>
          <strong>{proyecto.progressPercent}%</strong>
        </div>
        <dl className="detail-grid">
          <div>
            <dt>Desarrollador</dt>
            <dd>{proyecto.developer ?? "Sin registrar"}</dd>
          </div>
          <div>
            <dt>Unidades</dt>
            <dd>{unidades.length}</dd>
          </div>
          <div>
            <dt>Precio interno</dt>
            <dd>{proyecto.internalPriceCents != null ? formatoCents(proyecto.internalPriceCents, proyecto.currency) : "Restringido"}</dd>
          </div>
          <div>
            <dt>Rango público</dt>
            <dd>{formatoCents(proyecto.publicRangeMinCents, proyecto.currency)} – {formatoCents(proyecto.publicRangeMaxCents, proyecto.currency)}</dd>
          </div>
        </dl>
      </div>

      <div className="panel-title">
        <h2>Unidades</h2>
        {puedeCrearUnidad && (
          <button className="button primary" type="button" onClick={() => setCreandoUnidad(true)}>
            Nueva unidad
          </button>
        )}
      </div>

      {unidades.length === 0 ? (
        <Vacio titulo="Sin unidades todavía" texto="Registra la primera con “Nueva unidad”." />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Unidad</th>
                <th>Tipología</th>
                <th>Hab.</th>
                <th>Baños</th>
                <th>Construcción</th>
                {muestraColumnaPrecio && <th>Precio real</th>}
                <th>Rango público</th>
                <th>Estado</th>
                {(puedeEditarUnidad || puedeEliminarUnidad) && <th></th>}
              </tr>
            </thead>
            <tbody>
              {unidades.map((unidad) => {
                const estado = ETIQUETAS_ESTADO[unidad.status] ?? { texto: unidad.status, tono: "neutral" as const };
                return (
                  <tr key={unidad.id}>
                    <td>{unidad.code}</td>
                    <td>{unidad.unitType ?? "—"}</td>
                    <td>{unidad.bedrooms ?? "—"}</td>
                    <td>{unidad.bathrooms ?? "—"}</td>
                    <td>{unidad.builtAreaM2 != null ? `${unidad.builtAreaM2} m²` : "—"}</td>
                    {muestraColumnaPrecio && (
                      <td>{unidad.realPriceCents != null ? formatoCents(unidad.realPriceCents, unidad.currency) : "Restringido"}</td>
                    )}
                    <td>{formatoCents(unidad.publicRangeMinCents, unidad.currency)} – {formatoCents(unidad.publicRangeMaxCents, unidad.currency)}</td>
                    <td>
                      <Badge tone={estado.tono}>{estado.texto}</Badge>
                    </td>
                    {(puedeEditarUnidad || puedeEliminarUnidad) && (
                      <td className="table-actions">
                        {puedeEditarUnidad && (
                          <button className="icon-button" type="button" onClick={() => setEditandoUnidad(unidad)} aria-label="Editar unidad">
                            ✎
                          </button>
                        )}
                        {puedeEliminarUnidad && (
                          <button className="icon-button" type="button" onClick={() => void eliminarUnidad(unidad)} aria-label="Eliminar unidad">
                            🗑
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {editandoProyecto && (
        <FormularioProyecto proyecto={proyecto} brokers={brokers} puedeEditarPrecioReal={puedeEditarPrecioReal} onClose={() => setEditandoProyecto(false)} />
      )}
      {creandoUnidad && (
        <FormularioUnidad proyectoId={proyecto.id} puedeEditarPrecioReal={puedeEditarPrecioReal} onClose={() => setCreandoUnidad(false)} />
      )}
      {editandoUnidad && (
        <FormularioUnidad proyectoId={proyecto.id} unidad={editandoUnidad} puedeEditarPrecioReal={puedeEditarPrecioReal} onClose={() => setEditandoUnidad(null)} />
      )}
    </>
  );
}
function FormularioUnidad({
  proyectoId,
  unidad,
  puedeEditarPrecioReal,
  onClose,
}: {
  proyectoId: number;
  unidad?: Unidad;
  puedeEditarPrecioReal: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const submittingRef = useRef(false);
  const modalRef = useFocusTrap<HTMLElement>({ onClose });
  const [enviando, setEnviando] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorRed, setErrorRed] = useState<string | null>(null);
  const editando = Boolean(unidad);

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!formRef.current || submittingRef.current) return;
    submittingRef.current = true;
    setEnviando(true);
    setErrores({});
    setErrorRed(null);

    try {
      const raw = Object.fromEntries(new FormData(formRef.current).entries());
      const datos: Record<string, unknown> = { ...raw };

      if (puedeEditarPrecioReal && datos.realPrice !== undefined) {
        const val = String(datos.realPrice).trim();
        datos.realPriceCents = val ? unidadACentavos(Number(val)) : null;
        delete datos.realPrice;
      }
      if (datos.publicRangeMin !== undefined) {
        const val = String(datos.publicRangeMin).trim();
        datos.publicRangeMinCents = val ? unidadACentavos(Number(val)) : null;
        delete datos.publicRangeMin;
      }
      if (datos.publicRangeMax !== undefined) {
        const val = String(datos.publicRangeMax).trim();
        datos.publicRangeMaxCents = val ? unidadACentavos(Number(val)) : null;
        delete datos.publicRangeMax;
      }

      const url = editando ? `/api/proyectos/${proyectoId}/unidades/${unidad!.id}` : `/api/proyectos/${proyectoId}/unidades`;
      const respuesta = await fetch(url, {
        method: editando ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(datos),
      });
      const cuerpo = await respuesta.json().catch(() => ({}));

      if (!respuesta.ok) {
        setErrores(cuerpo.fields ?? {});
        setErrorRed(cuerpo.error ?? "No se pudo guardar la unidad. Revisa los datos ingresados.");
        return;
      }

      router.refresh();
      onClose();
    } catch {
      const offline = typeof navigator !== "undefined" && !navigator.onLine;
      setErrorRed(
        offline
          ? "Sin conexión a internet. Los datos ingresados se mantienen intactos."
          : "Fallo de conexión de red al guardar la unidad. Tus datos están intactos.",
      );
    } finally {
      submittingRef.current = false;
      setEnviando(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="unidad-title" ref={modalRef}>
        <div className="drawer-head">
          <h2 id="unidad-title">{editando ? `Editar unidad ${unidad!.code}` : "Nueva unidad"}</h2>
          <button className="icon-button" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>
        <form className="form-grid" ref={formRef} onSubmit={enviar} aria-busy={enviando}>
          {errorRed && (
            <div className="span-2">
              <AlertaErrorFormulario
                mensaje={errorRed}
                onReintentar={() => formRef.current?.requestSubmit()}
                disabled={enviando}
              />
            </div>
          )}
          <label>
            Código
            <input name="code" defaultValue={unidad?.code} required />
            {errores.code && <small style={{ color: "#b42318" }}>{errores.code}</small>}
          </label>
          <label>
            Tipología
            <input name="unitType" defaultValue={unidad?.unitType ?? ""} placeholder="Apartamento" />
          </label>
          <label>
            Habitaciones
            <input name="bedrooms" type="number" min="0" defaultValue={unidad?.bedrooms ?? ""} />
          </label>
          <label>
            Baños
            <input name="bathrooms" type="number" min="0" step="0.5" defaultValue={unidad?.bathrooms ?? ""} />
          </label>
          <label>
            Construcción (m²)
            <input name="builtAreaM2" type="number" min="0" step="0.01" defaultValue={unidad?.builtAreaM2 ?? ""} />
          </label>
          <label>
            Operación
            <select name="operationType" defaultValue={unidad?.operationType ?? "sale"}>
              {OPERATION_TYPES.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo === "sale" ? "Venta" : "Alquiler"}
                </option>
              ))}
            </select>
          </label>
          <label>
            Periodo de precio
            <select name="pricePeriod" defaultValue={unidad?.pricePeriod ?? "one_time"}>
              {PRICE_PERIODS.map((periodo) => (
                <option key={periodo} value={periodo}>
                  {periodo === "one_time" ? "Único" : "Mensual"}
                </option>
              ))}
            </select>
          </label>
          {puedeEditarPrecioReal && (
            <label>
              Precio real
              <input
                name="realPrice"
                type="number"
                min="0"
                step="0.01"
                placeholder="Ej. 120,000"
                defaultValue={unidad?.realPriceCents != null ? centavosAUnidad(unidad.realPriceCents) : ""}
              />
            </label>
          )}
          <label>
            Rango público — mínimo
            <input
              name="publicRangeMin"
              type="number"
              min="0"
              step="0.01"
              placeholder="Ej. 115,000"
              defaultValue={unidad?.publicRangeMinCents != null ? centavosAUnidad(unidad.publicRangeMinCents) : ""}
            />
          </label>
          <label>
            Rango público — máximo
            <input
              name="publicRangeMax"
              type="number"
              min="0"
              step="0.01"
              placeholder="Ej. 130,000"
              defaultValue={unidad?.publicRangeMaxCents != null ? centavosAUnidad(unidad.publicRangeMaxCents) : ""}
            />
          </label>
          <label>
            Estado
            <select name="status" defaultValue={unidad?.status ?? "available"}>
              {UNIT_STATUSES.map((estado) => (
                <option key={estado} value={estado}>
                  {ETIQUETAS_ESTADO[estado]?.texto ?? estado}
                </option>
              ))}
            </select>
          </label>
          {errores._ && <small style={{ color: "#b42318" }}>{errores._}</small>}
          <div className="form-actions span-2">
            <button className="button" type="button" onClick={onClose} disabled={enviando}>
              Cancelar
            </button>
            <button className="button primary" type="submit" disabled={enviando}>
              {enviando ? "Guardando…" : editando ? "Guardar cambios" : "Crear unidad"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
