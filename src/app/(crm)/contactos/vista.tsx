"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, type ReactNode, useRef, useState } from "react";
import { Avatar, PageHeader } from "../_ui/prototipo-ui";
import { SinResultados, Vacio } from "../_ui/estados";
import { ContactoInspector } from "./inspector";

export type ContactoFila = {
  id: number;
  fullName: string;
  phone: string | null;
  phoneDisplay: string | null;
  email: string | null;
  sourceId: number | null;
  sourceName: string | null;
  brokerId: number | null;
  brokerName: string | null;
  notes: string | null;
  lastInteractionAt: Date | null;
};

export type Canal = { id: number; name: string };

/**
 * M1 · Contactos (F1). Sustituye los `initialLeads` de muestra por los
 * contactos reales que resuelve `page.tsx` con `visibleRows` — el look
 * (`.filter-bar`, `.table-wrap`, `.split-view`, `.table-person`) es el mismo
 * que portó T5 del prototipo, solo cambia de dónde vienen los datos.
 *
 * Búsqueda, canal y página viven en la URL (`searchParams`), no en estado de
 * cliente: cada cambio navega, `page.tsx` vuelve a consultar con
 * `visibleRows` y esta vista solo pinta lo que llega. La ficha lateral hace
 * lo mismo con `?contacto=<id>` — así el historial de auditoría (T6), que es
 * un componente de servidor, se resuelve en `page.tsx` y llega aquí ya
 * montado en la prop `historial`, en vez de reimplementarlo con un fetch de
 * cliente.
 */
export function ContactosVista({
  contactos,
  canales,
  total,
  tamanioPagina,
  pagina,
  filtros,
  contactoSeleccionado,
  historial,
}: {
  contactos: ContactoFila[];
  canales: Canal[];
  total: number;
  tamanioPagina: number;
  pagina: number;
  filtros: { q: string; sourceId?: number };
  contactoSeleccionado: ContactoFila | null;
  historial: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [creando, setCreando] = useState(false);

  function irCon(cambios: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [clave, valor] of Object.entries(cambios)) {
      if (valor) params.set(clave, valor);
      else params.delete(clave);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  const totalPaginas = Math.max(1, Math.ceil(total / tamanioPagina));
  const hayFiltro = Boolean(filtros.q || filtros.sourceId);

  return (
    <>
      <PageHeader
        eyebrow="C2 · Relación"
        title="Contactos"
        subtitle="Historial consolidado de clientes y proyectos de interés."
        action={
          <button className="button primary" type="button" onClick={() => setCreando(true)}>
            Nuevo contacto
          </button>
        }
      />
      <div className="filter-bar">
        <input
          type="search"
          placeholder="Buscar por nombre, teléfono o correo…"
          defaultValue={filtros.q}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              irCon({ q: event.currentTarget.value.trim() || undefined, page: undefined, contacto: undefined });
            }
          }}
        />
        <select
          value={filtros.sourceId ?? ""}
          onChange={(event) => irCon({ source_id: event.target.value || undefined, page: undefined })}
        >
          <option value="">Todos los canales</option>
          {canales.map((canal) => (
            <option key={canal.id} value={canal.id}>
              {canal.name}
            </option>
          ))}
        </select>
        <span>{total} contactos</span>
      </div>
      <div className={contactoSeleccionado ? "split-view inspector-open" : "split-view"}>
        <div className="table-wrap">
          {contactos.length === 0 ? (
            hayFiltro ? (
              <SinResultados />
            ) : (
              <Vacio titulo="Sin contactos todavía" texto="Registra el primero con “Nuevo contacto”." />
            )
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Contacto</th>
                  <th>Canal</th>
                  <th>Broker</th>
                  <th>Última interacción</th>
                </tr>
              </thead>
              <tbody>
                {contactos.map((contacto) => (
                  <tr key={contacto.id} onClick={() => irCon({ contacto: String(contacto.id) })}>
                    <td>
                      <span className="table-person">
                        <Avatar name={contacto.fullName} small />
                        <span>
                          <strong>{contacto.fullName}</strong>
                          <small>{contacto.phoneDisplay ?? contacto.phone ?? "—"}</small>
                        </span>
                      </span>
                    </td>
                    <td>{contacto.sourceName ?? "—"}</td>
                    <td>{contacto.brokerName ?? "Sin asignar"}</td>
                    <td>
                      {contacto.lastInteractionAt
                        ? new Date(contacto.lastInteractionAt).toLocaleDateString("es-DO")
                        : "Sin registrar"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {totalPaginas > 1 && (
            <div className="form-actions" style={{ justifyContent: "space-between", padding: "12px 4px 0" }}>
              <button
                className="button"
                type="button"
                disabled={pagina <= 1}
                onClick={() => irCon({ page: String(pagina - 1) })}
              >
                Anterior
              </button>
              <span>
                Página {pagina} de {totalPaginas}
              </span>
              <button
                className="button"
                type="button"
                disabled={pagina >= totalPaginas}
                onClick={() => irCon({ page: String(pagina + 1) })}
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
        {contactoSeleccionado && (
          <ContactoInspector
            contacto={contactoSeleccionado}
            canales={canales}
            historial={historial}
            onClose={() => irCon({ contacto: undefined })}
          />
        )}
      </div>
      {creando && (
        <FormularioContacto canales={canales} onClose={() => setCreando(false)} />
      )}
    </>
  );
}

/**
 * Alta de contacto, con el 409 de duplicados de la decisión #19: si el
 * servidor devuelve candidatos, se muestran y se ofrece "Crear de todas
 * formas" (`crear_igual: true`) en vez de reintentar a ciegas.
 */
function FormularioContacto({ canales, onClose }: { canales: Canal[]; onClose: () => void }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [candidatos, setCandidatos] = useState<
    { id: number; fullName: string; phoneDisplay: string | null; email: string | null }[] | null
  >(null);

  async function enviar(crearIgual = false) {
    if (!formRef.current) return;
    setEnviando(true);
    setErrores({});

    const datos = Object.fromEntries(new FormData(formRef.current).entries());
    const respuesta = await fetch("/api/contactos", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...datos, crear_igual: crearIgual }),
    });
    const cuerpo = await respuesta.json().catch(() => ({}));
    setEnviando(false);

    if (respuesta.status === 409) {
      setCandidatos((cuerpo.details?.candidatos as typeof candidatos) ?? []);
      return;
    }
    if (!respuesta.ok) {
      setErrores(cuerpo.fields ?? { _: cuerpo.error ?? "No se pudo crear el contacto." });
      return;
    }

    router.refresh();
    onClose();
  }

  function alEnviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void enviar(false);
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="nuevo-contacto-title">
        <div className="drawer-head">
          <h2 id="nuevo-contacto-title">Nuevo contacto</h2>
          <button className="icon-button" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>
        <form className="form-grid" ref={formRef} onSubmit={alEnviar}>
          <label className="span-2">
            Nombre completo
            <input name="fullName" required />
            {errores.fullName && <small style={{ color: "#b42318" }}>{errores.fullName}</small>}
          </label>
          <label>
            Teléfono
            <input name="phone" placeholder="809-555-0184" />
            {errores.phone && <small style={{ color: "#b42318" }}>{errores.phone}</small>}
          </label>
          <label>
            Correo
            <input name="email" type="email" />
            {errores.email && <small style={{ color: "#b42318" }}>{errores.email}</small>}
          </label>
          <label className="span-2">
            Canal
            <select name="sourceId" defaultValue="">
              <option value="">Sin especificar</option>
              {canales.map((canal) => (
                <option key={canal.id} value={canal.id}>
                  {canal.name}
                </option>
              ))}
            </select>
          </label>
          <label className="span-2">
            Notas
            <textarea name="notes" />
          </label>
          {errores._ && <small style={{ color: "#b42318" }}>{errores._}</small>}

          {candidatos && (
            <div className="span-2 permission-note" role="alert">
              <strong>Ya existe un contacto parecido</strong>
              <ul>
                {candidatos.map((candidato) => (
                  <li key={candidato.id}>
                    {candidato.fullName} — {candidato.phoneDisplay ?? "sin teléfono"} — {candidato.email ?? "sin correo"}
                  </li>
                ))}
              </ul>
              <button className="button primary" type="button" disabled={enviando} onClick={() => void enviar(true)}>
                Crear de todas formas
              </button>
            </div>
          )}

          <div className="form-actions">
            <button className="button" type="button" onClick={onClose}>
              Cancelar
            </button>
            <button className="button primary" type="submit" disabled={enviando}>
              {enviando ? "Creando…" : "Crear contacto"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
