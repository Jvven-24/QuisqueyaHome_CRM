"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Avatar } from "../_ui/prototipo-ui";
import type { Canal, ContactoFila } from "./vista";

/**
 * Ficha lateral de un contacto (M1).
 *
 * `LeadInspector` (`../_ui/lead-inspector.tsx`) se pensó para la forma `Lead`
 * del prototipo — etapa, presupuesto, proyecto de interés — que ya no aplica:
 * un contacto es una entidad distinta de un lead o un negocio (§8.2 del
 * mapeo). Adaptarlo habría dejado props sin sentido (`stage`, `onMove`) o un
 * componente compartido con dos formas incompatibles por dentro; un panel
 * propio y pequeño, con los campos que sí tiene `contacts`, es más simple y
 * no le pide nada prestado al inspector de leads que no le corresponde.
 */
export function ContactoInspector({
  contacto,
  canales,
  brokers,
  puedeReasignar,
  historial,
  onClose,
}: {
  contacto: ContactoFila;
  canales: Canal[];
  /** Deuda de F1 (issue #21): reasignar responsable, solo alcance `all`. */
  brokers: { id: number; fullName: string }[];
  puedeReasignar: boolean;
  historial: React.ReactNode;
  onClose: () => void;
}) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGuardando(true);
    setErrores({});

    const datos: Record<string, unknown> = Object.fromEntries(new FormData(event.currentTarget).entries());
    // "" en brokerId significa "no lo tocó" (la placeholder deshabilitada
    // sigue siendo el valor si el select nunca se abrió) — nunca "vaciar el
    // responsable", que este control no ofrece.
    if (datos.brokerId === "") delete datos.brokerId;
    const respuesta = await fetch(`/api/contactos/${contacto.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(datos),
    });
    const cuerpo = await respuesta.json().catch(() => ({}));
    setGuardando(false);

    if (!respuesta.ok) {
      setErrores(cuerpo.fields ?? { _: cuerpo.error ?? "No se pudo guardar el cambio." });
      return;
    }

    setEditando(false);
    router.refresh();
  }

  async function eliminar() {
    if (!confirm(`¿Eliminar a ${contacto.fullName}? Podrás verlo en la papelera, no se borra de la base.`)) return;
    const respuesta = await fetch(`/api/contactos/${contacto.id}`, { method: "DELETE" });
    if (!respuesta.ok) {
      const cuerpo = await respuesta.json().catch(() => ({}));
      alert(cuerpo.error ?? "No se pudo eliminar el contacto.");
      return;
    }
    onClose();
    router.refresh();
  }

  return (
    <aside className="inspector">
      <div className="drawer-head">
        <div>
          <p className="eyebrow">Ficha de contacto</p>
          <h2>{contacto.fullName}</h2>
        </div>
        <button className="icon-button" onClick={onClose} aria-label="Cerrar detalle">
          ×
        </button>
      </div>
      <div className="contact-hero">
        <Avatar name={contacto.fullName} />
        <div>
          <strong>{contacto.phoneDisplay ?? contacto.phone ?? "Sin teléfono"}</strong>
          <small>{contacto.email ?? "Sin correo"}</small>
        </div>
      </div>

      {!editando ? (
        <>
          <dl className="detail-grid">
            <div>
              <dt>Canal</dt>
              <dd>{contacto.sourceName ?? "—"}</dd>
            </div>
            <div>
              <dt>Responsable</dt>
              <dd>{contacto.brokerName ?? "Sin asignar"}</dd>
            </div>
          </dl>
          {contacto.notes && (
            <p>
              <strong>Notas:</strong> {contacto.notes}
            </p>
          )}
          <div className="inspector-actions">
            <button className="button primary" type="button" onClick={() => setEditando(true)}>
              Editar contacto
            </button>
            {contacto.phone && (
              <a
                className="button whatsapp"
                href={`https://wa.me/${contacto.phone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
              >
                Abrir WhatsApp
              </a>
            )}
            <button className="button" type="button" onClick={eliminar}>
              Eliminar
            </button>
          </div>
        </>
      ) : (
        <form className="form-grid" onSubmit={guardar}>
          <label className="span-2">
            Nombre completo
            <input name="fullName" defaultValue={contacto.fullName} required />
            {errores.fullName && <small style={{ color: "#b42318" }}>{errores.fullName}</small>}
          </label>
          <label>
            Teléfono
            <input name="phone" defaultValue={contacto.phoneDisplay ?? contacto.phone ?? ""} />
            {errores.phone && <small style={{ color: "#b42318" }}>{errores.phone}</small>}
          </label>
          <label>
            Correo
            <input name="email" type="email" defaultValue={contacto.email ?? ""} />
            {errores.email && <small style={{ color: "#b42318" }}>{errores.email}</small>}
          </label>
          <label className="span-2">
            Canal
            <select name="sourceId" defaultValue={contacto.sourceId ?? ""}>
              <option value="">Sin especificar</option>
              {canales.map((canal) => (
                <option key={canal.id} value={canal.id}>
                  {canal.name}
                </option>
              ))}
            </select>
          </label>
          {puedeReasignar && (
            <label className="span-2">
              Responsable
              <select name="brokerId" defaultValue={contacto.brokerId ?? ""}>
                <option value="" disabled>
                  Sin asignar — elige un broker
                </option>
                {brokers.map((broker) => (
                  <option key={broker.id} value={broker.id}>
                    {broker.fullName}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="span-2">
            Notas
            <textarea name="notes" defaultValue={contacto.notes ?? ""} />
          </label>
          {errores._ && <small style={{ color: "#b42318" }}>{errores._}</small>}
          <div className="form-actions">
            <button className="button" type="button" onClick={() => setEditando(false)}>
              Cancelar
            </button>
            <button className="button primary" type="submit" disabled={guardando}>
              {guardando ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </form>
      )}

      {historial}
    </aside>
  );
}
