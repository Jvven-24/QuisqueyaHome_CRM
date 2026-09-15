"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, type ReactNode, useRef, useState } from "react";
import { Avatar, Modal } from "../_ui/prototipo-ui";
import type { Etapa, MotivoPerdida, NegocioFila, PropiedadDeal, ProyectoOpcion } from "./vista";

/**
 * Ficha lateral de un negocio (M3b + deuda de F1, issue #21).
 *
 * Mismo criterio que `ContactoInspector` (M1, `contactos/inspector.tsx`):
 * `LeadInspector` del prototipo (`../_ui/lead-inspector.tsx`) tiene la forma
 * de un `Lead` de muestra —`stage` como texto, `budget` como texto libre,
 * `broker` como nombre— que ya no corresponde a un negocio real, con etapa
 * por `stageId`, monto en centavos y broker por referencia. Un panel propio
 * es más simple que forzar esa forma vieja a encajar en datos nuevos.
 *
 * M3b dejó esto anotado como pendiente en `docs/F1_ANALISIS_Y_PLAN.md` §10:
 * sin editar monto, probabilidad, comisión, fecha estimada y sin poder
 * asociar unidades de interés, un negocio no podía cumplir por su cuenta los
 * requisitos de §10.1 para Negociación/Preselección/Cierre desde la interfaz.
 * Los dos formularios de abajo cierran ese pendiente.
 */
export function DealInspector({
  negocio,
  etapas,
  motivos,
  propiedades,
  proyectos,
  historial,
  enviando,
  onCambiarEtapa,
  onClose,
}: {
  negocio: NegocioFila;
  etapas: Etapa[];
  motivos: MotivoPerdida[];
  propiedades: PropiedadDeal[];
  proyectos: ProyectoOpcion[];
  historial: ReactNode;
  enviando: boolean;
  onCambiarEtapa: (etapaId: number) => void;
  onClose: () => void;
}) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [agregandoPropiedad, setAgregandoPropiedad] = useState(false);
  const [ocupado, setOcupado] = useState<number | null>(null);
  const etapaActual = etapas.find((e) => e.id === negocio.stageId);
  const cerrado = etapaActual?.kind !== "open";
  const motivoPerdida = negocio.lossReasonId ? motivos.find((m) => m.id === negocio.lossReasonId) : undefined;

  async function marcarPrincipal(propiedad: PropiedadDeal) {
    setOcupado(propiedad.id);
    const respuesta = await fetch(`/api/pipeline/${negocio.id}/propiedades/${propiedad.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ isPrimary: true }),
    });
    setOcupado(null);
    if (!respuesta.ok) {
      const cuerpo = await respuesta.json().catch(() => ({}));
      alert(cuerpo.error ?? "No se pudo marcar como principal.");
      return;
    }
    router.refresh();
  }

  async function quitarPropiedad(propiedad: PropiedadDeal) {
    if (!confirm(`¿Quitar ${propiedad.projectName}${propiedad.unitCode ? ` · ${propiedad.unitCode}` : ""} de los intereses del negocio?`)) return;
    setOcupado(propiedad.id);
    const respuesta = await fetch(`/api/pipeline/${negocio.id}/propiedades/${propiedad.id}`, { method: "DELETE" });
    setOcupado(null);
    if (!respuesta.ok) {
      const cuerpo = await respuesta.json().catch(() => ({}));
      alert(cuerpo.error ?? "No se pudo quitar la propiedad.");
      return;
    }
    router.refresh();
  }

  return (
    <aside className="inspector">
      <div className="drawer-head">
        <div>
          <p className="eyebrow">Ficha de negocio</p>
          <h2>{negocio.contactName}</h2>
        </div>
        <div className="header-actions-inline">
          {!cerrado && (
            <button className="text-button" type="button" onClick={() => setEditando(true)}>
              Editar
            </button>
          )}
          <button className="icon-button" onClick={onClose} aria-label="Cerrar detalle">
            ×
          </button>
        </div>
      </div>
      <div className="contact-hero">
        <Avatar name={negocio.contactName} />
        <div>
          <strong>{negocio.contactPhoneDisplay ?? negocio.contactPhone ?? "Sin teléfono"}</strong>
          <small>{negocio.sourceName ?? "Sin canal"}</small>
        </div>
      </div>

      <dl className="detail-grid">
        <div>
          <dt>Etapa</dt>
          <dd>{etapaActual?.name ?? "—"}</dd>
        </div>
        <div>
          <dt>Responsable</dt>
          <dd>{negocio.brokerName ?? "Sin asignar"}</dd>
        </div>
        <div>
          <dt>Operación</dt>
          <dd>{negocio.operationType === "rent" ? "Alquiler" : "Venta"}</dd>
        </div>
        <div>
          <dt>Monto</dt>
          <dd>
            {negocio.amountCents != null
              ? new Intl.NumberFormat("es-DO", { style: "currency", currency: negocio.currency, maximumFractionDigits: 0 }).format(
                  negocio.amountCents / 100,
                )
              : "Por definir"}
          </dd>
        </div>
        <div>
          <dt>Probabilidad</dt>
          <dd>{negocio.probability != null ? `${negocio.probability}%` : "—"}</dd>
        </div>
        <div>
          <dt>Comisión</dt>
          <dd>{negocio.commissionBasisPoints != null ? `${(negocio.commissionBasisPoints / 100).toFixed(2)}%` : "—"}</dd>
        </div>
        <div>
          <dt>Fecha estimada de cierre</dt>
          <dd>{negocio.expectedCloseDate ?? "—"}</dd>
        </div>
        <div>
          <dt>Próxima acción</dt>
          <dd>{negocio.nextActivityTitle ?? "Sin registrar"}</dd>
        </div>
      </dl>

      <div>
        <div className="panel-title">
          <h3>Propiedades de interés</h3>
          {!cerrado && !agregandoPropiedad && (
            <button className="text-button" type="button" onClick={() => setAgregandoPropiedad(true)}>
              + Agregar
            </button>
          )}
        </div>
        {propiedades.length === 0 && !agregandoPropiedad && <p className="section-intro">Ninguna todavía.</p>}
        {propiedades.length > 0 && (
          <ul className="timeline-list">
            {propiedades.map((propiedad) => (
              <li key={propiedad.id}>
                <span>
                  {propiedad.projectName}
                  {propiedad.unitCode ? ` · Unidad ${propiedad.unitCode}` : ""}
                  {propiedad.isPrimary ? " · Principal" : ""}
                </span>
                {!cerrado && (
                  <span className="table-actions">
                    {!propiedad.isPrimary && (
                      <button className="text-button" type="button" disabled={ocupado === propiedad.id} onClick={() => void marcarPrincipal(propiedad)}>
                        Marcar principal
                      </button>
                    )}
                    <button className="icon-button" type="button" disabled={ocupado === propiedad.id} onClick={() => void quitarPropiedad(propiedad)} aria-label="Quitar propiedad">
                      🗑
                    </button>
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
        {agregandoPropiedad && (
          <FormularioPropiedad dealId={negocio.id} proyectos={proyectos} tienePrincipal={propiedades.some((p) => p.isPrimary)} onClose={() => setAgregandoPropiedad(false)} />
        )}
      </div>

      {motivoPerdida && (
        <p>
          <strong>Motivo de pérdida:</strong> {motivoPerdida.name}
          {negocio.lossComment ? ` — ${negocio.lossComment}` : ""}
        </p>
      )}

      {negocio.notes && (
        <p>
          <strong>Notas:</strong> {negocio.notes}
        </p>
      )}

      {!cerrado && (
        <div className="inspector-actions">
          <label className="span-2" style={{ width: "100%" }}>
            Cambiar de etapa
            <select
              defaultValue=""
              disabled={enviando}
              onChange={(event) => {
                const etapaId = Number(event.target.value);
                event.target.value = "";
                if (etapaId) onCambiarEtapa(etapaId);
              }}
            >
              <option value="" disabled>
                Elige una etapa…
              </option>
              {etapas
                .filter((etapa) => etapa.id !== negocio.stageId)
                .map((etapa) => (
                  <option key={etapa.id} value={etapa.id}>
                    {etapa.name}
                  </option>
                ))}
            </select>
          </label>
        </div>
      )}

      {historial}

      {editando && <FormularioNegocio negocio={negocio} onClose={() => setEditando(false)} />}
    </aside>
  );
}

/**
 * Los cuatro campos que §10.1 exige para las transiciones de Negociación,
 * Preselección y Cierre (deuda de F1, issue #21). `PATCH /api/pipeline/[id]`
 * rechaza esto si el negocio ya está cerrado — el servidor decide, este
 * formulario solo no se ofrece cuando `cerrado` (ver arriba).
 */
function FormularioNegocio({ negocio, onClose }: { negocio: NegocioFila; onClose: () => void }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!formRef.current) return;
    setEnviando(true);
    setError(null);

    const form = formRef.current;
    const datos = Object.fromEntries(new FormData(form).entries());
    // El porcentaje se escribe como "4.5" y se guarda en puntos básicos
    // enteros (decisión #14: dinero en centavos/puntos básicos, nunca coma
    // flotante) — la conversión vive aquí, no en el servidor, que solo acepta
    // el entero final.
    const comision = form.elements.namedItem("commissionPercent") as HTMLInputElement;
    const puntosBasicos = comision.value ? Math.round(Number(comision.value) * 100) : "";

    const respuesta = await fetch(`/api/pipeline/${negocio.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...datos, commissionBasisPoints: puntosBasicos }),
    });
    const cuerpo = await respuesta.json().catch(() => ({}));
    setEnviando(false);

    if (!respuesta.ok) {
      setError(cuerpo.error ?? "No se pudo guardar el negocio.");
      return;
    }

    router.refresh();
    onClose();
  }

  return (
    <Modal title="Editar negocio" onClose={onClose}>
      <form className="form-grid" ref={formRef} onSubmit={enviar}>
        <label>
          Monto ({negocio.currency}, en centavos)
          <input name="amountCents" type="number" min="0" defaultValue={negocio.amountCents ?? ""} />
        </label>
        <label>
          Probabilidad (%)
          <input name="probability" type="number" min="0" max="100" defaultValue={negocio.probability ?? ""} />
        </label>
        <label>
          Comisión (%)
          <input name="commissionPercent" type="number" min="0" max="100" step="0.01" defaultValue={negocio.commissionBasisPoints != null ? (negocio.commissionBasisPoints / 100).toString() : ""} />
        </label>
        <label>
          Fecha estimada de cierre
          <input name="expectedCloseDate" type="date" defaultValue={negocio.expectedCloseDate ?? ""} />
        </label>
        {error && <small style={{ color: "#b42318" }}>{error}</small>}
        <div className="form-actions span-2">
          <button className="button secondary" type="button" onClick={onClose}>
            Cancelar
          </button>
          <button className="button primary" type="submit" disabled={enviando}>
            {enviando ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/**
 * Asociar un proyecto o una unidad de interés (deuda de F1, issue #21). El
 * selector de unidad depende del proyecto elegido — sin proyecto, no hay de
 * dónde sacar unidades.
 */
function FormularioPropiedad({
  dealId,
  proyectos,
  tienePrincipal,
  onClose,
}: {
  dealId: number;
  proyectos: ProyectoOpcion[];
  tienePrincipal: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [proyectoId, setProyectoId] = useState<number | "">(proyectos[0]?.id ?? "");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const unidadesDelProyecto = proyectos.find((p) => p.id === proyectoId)?.unidades ?? [];

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!formRef.current) return;
    setEnviando(true);
    setError(null);

    const form = formRef.current;
    const datos: Record<string, unknown> = Object.fromEntries(new FormData(form).entries());
    datos.isPrimary = (form.elements.namedItem("isPrimary") as HTMLInputElement).checked;
    // "Interés general" es la opción vacía del select de unidad — "" no es un
    // id válido, y sin esto Zod la rechaza con "expected number to be >0" en
    // vez de tratarla como "sin unidad" (mismo criterio que `limpiarVacios`
    // en `api/contactos/route.ts`).
    if (datos.unitId === "") delete datos.unitId;

    const respuesta = await fetch(`/api/pipeline/${dealId}/propiedades`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(datos),
    });
    const cuerpo = await respuesta.json().catch(() => ({}));
    setEnviando(false);

    if (!respuesta.ok) {
      setError(cuerpo.error ?? "No se pudo agregar la propiedad.");
      return;
    }

    router.refresh();
    onClose();
  }

  if (proyectos.length === 0) {
    return <p className="section-intro">No hay proyectos activos con inventario todavía.</p>;
  }

  return (
    <form className="form-grid" ref={formRef} onSubmit={enviar}>
      <label>
        Proyecto
        <select name="projectId" value={proyectoId} onChange={(e) => setProyectoId(Number(e.target.value))}>
          {proyectos.map((proyecto) => (
            <option key={proyecto.id} value={proyecto.id}>
              {proyecto.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Unidad (opcional)
        <select name="unitId" defaultValue="">
          <option value="">Interés general</option>
          {unidadesDelProyecto.map((unidad) => (
            <option key={unidad.id} value={unidad.id}>
              {unidad.code}
            </option>
          ))}
        </select>
      </label>
      <label className="span-2 checkbox-inline">
        <input name="isPrimary" type="checkbox" defaultChecked={!tienePrincipal} />
        Marcar como principal
      </label>
      {error && <small style={{ color: "#b42318" }}>{error}</small>}
      <div className="form-actions span-2">
        <button className="button secondary" type="button" onClick={onClose}>
          Cancelar
        </button>
        <button className="button primary" type="submit" disabled={enviando}>
          {enviando ? "Agregando…" : "Agregar"}
        </button>
      </div>
    </form>
  );
}
