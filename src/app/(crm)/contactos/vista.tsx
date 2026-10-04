"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, type ReactNode, useMemo, useRef, useState } from "react";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { Avatar, PageHeader } from "../_ui/prototipo-ui";
import { AlertaErrorFormulario } from "../_ui/alerta-error-formulario";
import { ContactoInspector } from "./inspector";
import { DataTable, type Columna } from "@/components/ui/data-table";
import { MessageSquare, Phone, X } from "lucide-react";

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
  brokers,
  puedeReasignar,
  historial,
}: {
  contactos: ContactoFila[];
  canales: Canal[];
  total: number;
  tamanioPagina: number;
  pagina: number;
  filtros: { q: string; sourceId?: number };
  contactoSeleccionado: ContactoFila | null;
  /** Deuda de F1 (issue #21): reasignar responsable, solo alcance `all`. */
  brokers: { id: number; fullName: string }[];
  puedeReasignar: boolean;
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

  const columnasTabla: Columna<ContactoFila>[] = useMemo(
    () => [
      {
        clave: "contacto",
        titulo: "Contacto",
        movil: "titulo",
        celda: (c) => (
          <div className="flex items-center gap-3">
            <Avatar name={c.fullName} small />
            <div className="grid min-w-0 leading-tight">
              <strong className="text-[13.5px] font-bold text-foreground truncate">{c.fullName}</strong>
              <span className="text-[11.5px] text-muted-foreground truncate">{c.phoneDisplay ?? c.phone ?? c.email ?? "—"}</span>
            </div>
          </div>
        ),
        valor: (c) => c.fullName,
        ordenable: true,
      },
      {
        clave: "canal",
        titulo: "Canal",
        celda: (c) => (
          <span className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-0.5 text-[11.5px] font-medium text-muted-foreground border border-border/40">
            {c.sourceName ?? "Directo"}
          </span>
        ),
        valor: (c) => c.sourceName ?? "",
      },
      {
        clave: "broker",
        titulo: "Broker Asignado",
        celda: (c) => (
          <span className="text-[12.5px] font-medium text-foreground">
            {c.brokerName ?? "Sin asignar"}
          </span>
        ),
        valor: (c) => c.brokerName ?? "",
        ordenable: true,
      },
      {
        clave: "interaccion",
        titulo: "Última Interacción",
        movil: "subtitulo",
        celda: (c) => (
          <span className="text-[12px] text-muted-foreground">
            {c.lastInteractionAt ? new Date(c.lastInteractionAt).toLocaleDateString("es-DO") : "Sin registrar"}
          </span>
        ),
        valor: (c) => (c.lastInteractionAt ? new Date(c.lastInteractionAt).getTime() : 0),
        ordenable: true,
      },
      {
        clave: "acciones",
        titulo: "Contacto",
        alinear: "derecha",
        celda: (c) => {
          const phone = c.phone;
          const clean = phone ? phone.replace(/\D/g, "") : null;
          return (
            <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
              {clean && (
                <a
                  href={`https://wa.me/${clean}?text=${encodeURIComponent(
                    `Hola ${c.fullName}, le escribo de Quisqueya Home respecto a su portafolio inmobiliario.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  title={`WhatsApp con ${c.fullName}`}
                  className="inline-flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 transition-colors shadow-2xs"
                >
                  <MessageSquare size={13} />
                </a>
              )}
              {clean && (
                <a
                  href={`tel:${clean}`}
                  title={`Llamar a ${c.fullName}`}
                  className="inline-flex size-7 items-center justify-center rounded-lg bg-muted text-foreground hover:bg-muted/80 border border-border transition-colors shadow-2xs"
                >
                  <Phone size={13} />
                </a>
              )}
            </div>
          );
        },
      },
    ],
    []
  );

  return (
    <>
      <PageHeader
        eyebrow="Relación"
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
          <DataTable
            filas={contactos}
            columnas={columnasTabla}
            idDe={(c) => String(c.id)}
            activa={contactoSeleccionado ? String(contactoSeleccionado.id) : null}
            onAbrir={(c) => irCon({ contacto: String(c.id) })}
            porPagina={tamanioPagina}
            etiqueta="Listado de contactos"
            vacio={{
              titulo: hayFiltro ? "Sin contactos para este filtro" : "Sin contactos todavía",
              cuerpo: hayFiltro
                ? "Prueba cambiando o limpiando los filtros actuales."
                : "Registra el primer cliente o inversionista con “Nuevo contacto”.",
            }}
          />
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
              <span className="text-xs font-semibold text-muted-foreground tabular-nums">
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
            brokers={brokers}
            puedeReasignar={puedeReasignar}
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
  const submittingRef = useRef(false);
  const modalRef = useFocusTrap<HTMLElement>({ onClose });
  const [enviando, setEnviando] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorRed, setErrorRed] = useState<string | null>(null);
  const [candidatos, setCandidatos] = useState<
    { id: number; fullName: string; phoneDisplay: string | null; email: string | null }[] | null
  >(null);

  async function enviar(crearIgual = false) {
    if (!formRef.current || submittingRef.current) return;
    submittingRef.current = true;
    setEnviando(true);
    setErrores({});
    setErrorRed(null);

    try {
      const datos = Object.fromEntries(new FormData(formRef.current).entries());
      const respuesta = await fetch("/api/contactos", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...datos, crear_igual: crearIgual }),
      });
      const cuerpo = await respuesta.json().catch(() => ({}));

      if (respuesta.status === 409) {
        setCandidatos((cuerpo.details?.candidatos as typeof candidatos) ?? []);
        return;
      }
      if (!respuesta.ok) {
        setErrores(cuerpo.fields ?? {});
        setErrorRed(cuerpo.error ?? "No se pudo crear el contacto. Revisa los datos ingresados.");
        return;
      }

      router.refresh();
      onClose();
    } catch {
      const offline = typeof navigator !== "undefined" && !navigator.onLine;
      setErrorRed(
        offline
          ? "Sin conexión a internet. Los datos ingresados se mantienen intactos."
          : "Fallo de conexión de red al crear el contacto. Tus datos están intactos.",
      );
    } finally {
      submittingRef.current = false;
      setEnviando(false);
    }
  }

  function alEnviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void enviar(false);
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="nuevo-contacto-title" ref={modalRef}>
        <div className="drawer-head">
          <h2 id="nuevo-contacto-title">Nuevo contacto</h2>
          <button className="icon-button" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>
        <form className="form-grid" ref={formRef} onSubmit={alEnviar} aria-busy={enviando}>
          {errorRed && (
            <div className="span-2">
              <AlertaErrorFormulario
                mensaje={errorRed}
                onReintentar={() => void enviar(false)}
                disabled={enviando}
              />
            </div>
          )}
          <label className="span-2">
            Nombre completo
            <input name="fullName" required autoFocus />
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
            <button className="button" type="button" onClick={onClose} disabled={enviando}>
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
