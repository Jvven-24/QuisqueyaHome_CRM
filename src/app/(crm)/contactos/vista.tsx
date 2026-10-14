"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, type ReactNode, useMemo, useRef, useState } from "react";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { Avatar, PageHeader } from "../_ui/prototipo-ui";
import { AlertaErrorFormulario } from "../_ui/alerta-error-formulario";
import { ContactoInspector } from "./inspector";
import { DataTable, type Columna } from "@/components/ui/data-table";
import {
  Globe,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Search,
  UserCheck,
  Users,
  Video,
  X,
} from "lucide-react";

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

export function CanalChip({ nombre }: { nombre: string | null }) {
  const n = nombre ? nombre.trim() : "Directo";
  const lower = n.toLowerCase();

  let Icon = Globe;
  let badgeClass = "bg-slate-100 text-slate-800 border-slate-200/90";

  if (lower.includes("youtube") || lower.includes("video")) {
    Icon = Video;
    badgeClass = "bg-red-50 text-red-800 border-red-200";
  } else if (lower.includes("whatsapp")) {
    Icon = MessageSquare;
    badgeClass = "bg-emerald-50 text-emerald-800 border-emerald-300";
  } else if (lower.includes("web") || lower.includes("portal") || lower.includes("google")) {
    Icon = Globe;
    badgeClass = "bg-sky-50 text-sky-800 border-sky-200";
  } else if (lower.includes("referid") || lower.includes("broker")) {
    Icon = Users;
    badgeClass = "bg-amber-50 text-amber-900 border-amber-300/80";
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] font-semibold border shadow-2xs ${badgeClass}`}>
      <Icon className="size-3.5 shrink-0" />
      <span className="truncate max-w-[130px]">{n}</span>
    </span>
  );
}

/**
 * M1 · Contactos (Private Desk).
 * Directorio de contactos premium con búsqueda en servidor y ficha 360 lateral.
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
        titulo: "Contacto / Inversionista",
        movil: "titulo",
        celda: (c) => (
          <div className="flex items-center gap-3">
            <Avatar name={c.fullName} />
            <div className="grid min-w-0 leading-tight">
              <strong className="text-[14px] font-bold text-foreground truncate">{c.fullName}</strong>
              <span className="text-[13px] text-muted-foreground truncate">
                {c.phoneDisplay ?? c.phone ?? c.email ?? "Sin teléfono ni correo"}
              </span>
            </div>
          </div>
        ),
        valor: (c) => c.fullName,
        ordenable: true,
      },
      {
        clave: "canal",
        titulo: "Canal de captación",
        celda: (c) => <CanalChip nombre={c.sourceName} />,
        valor: (c) => c.sourceName ?? "",
      },
      {
        clave: "broker",
        titulo: "Asesor Patrimonial",
        celda: (c) => (
          <span className="text-[13.5px] font-medium text-foreground flex items-center gap-1.5">
            {c.brokerName ? (
              <>
                <UserCheck className="size-4 text-navy-800 shrink-0" />
                <span>{c.brokerName}</span>
              </>
            ) : (
              <span className="text-muted-foreground italic font-normal text-[13px]">Sin asignar</span>
            )}
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
          <span className="text-[13px] text-muted-foreground font-medium">
            {c.lastInteractionAt
              ? new Date(c.lastInteractionAt).toLocaleDateString("es-DO", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "Sin interacciones"}
          </span>
        ),
        valor: (c) => (c.lastInteractionAt ? new Date(c.lastInteractionAt).getTime() : 0),
        ordenable: true,
      },
      {
        clave: "acciones",
        titulo: "Contacto directo",
        alinear: "derecha",
        celda: (c) => {
          const phone = c.phone;
          const clean = phone ? phone.replace(/\D/g, "") : null;
          const whatsappUrl = clean
            ? `https://wa.me/${clean}?text=${encodeURIComponent(
                `Hola ${c.fullName}, le escribo de Quisqueya Home Private Desk respecto a su portafolio inmobiliario y proyectos de interés en República Dominicana.`
              )}`
            : null;

          return (
            <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`WhatsApp con ${c.fullName}`}
                  title={`WhatsApp directo con ${c.fullName}`}
                  className="inline-flex size-12 min-h-12 min-w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 border border-emerald-300 transition-colors shadow-2xs focus-visible:outline-2 focus-visible:outline-gold-700"
                >
                  <MessageSquare className="size-5" />
                </a>
              )}
              {clean && (
                <a
                  href={`tel:${clean}`}
                  aria-label={`Llamar a ${c.fullName}`}
                  title={`Llamar a ${c.fullName}`}
                  className="inline-flex size-12 min-h-12 min-w-12 items-center justify-center rounded-xl bg-surface text-navy-950 hover:bg-surface-alt border border-line transition-colors shadow-2xs focus-visible:outline-2 focus-visible:outline-gold-700"
                >
                  <Phone className="size-5" />
                </a>
              )}
              {c.email && (
                <a
                  href={`mailto:${c.email}?subject=${encodeURIComponent("Quisqueya Home Private Desk — Asesoría Patrimonial")}`}
                  aria-label={`Enviar correo a ${c.fullName}`}
                  title={`Enviar correo a ${c.fullName}`}
                  className="inline-flex size-12 min-h-12 min-w-12 items-center justify-center rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-300 transition-colors shadow-2xs focus-visible:outline-2 focus-visible:outline-gold-700"
                >
                  <Mail className="size-5" />
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
        eyebrow="Private Desk · Directorio"
        title="Directorio de Contactos"
        subtitle="Relación patrimonial consolidada, inversionistas, clientes calificados e historial 360."
        action={
          <button
            type="button"
            onClick={() => setCreando(true)}
            className="min-h-12 px-5 inline-flex items-center gap-2.5 rounded-xl bg-navy-950 hover:bg-navy-900 text-white text-[13.5px] font-bold shadow-sm transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-gold-700"
          >
            <Plus className="size-4 text-gold-500" />
            <span>Nuevo contacto</span>
          </button>
        }
      />

      {/* Franja de búsqueda y filtros ejecutivos */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-surface border border-line rounded-xl mb-4 shadow-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[280px] max-w-md">
          <div className="relative flex items-center w-full">
            <Search className="absolute left-3.5 size-4 text-muted pointer-events-none" />
            <input
              type="search"
              placeholder="Buscar por nombre, teléfono o correo…"
              defaultValue={filtros.q}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  irCon({ q: event.currentTarget.value.trim() || undefined, page: undefined, contacto: undefined });
                }
              }}
              className="w-full min-h-12 pl-10 pr-3.5 text-[13.5px] bg-surface border border-input-line rounded-lg text-ink placeholder:text-muted focus:outline-none focus:border-gold-700 focus:ring-2 focus:ring-gold-700/20 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <select
            aria-label="Filtrar por canal"
            value={filtros.sourceId ?? ""}
            onChange={(event) => irCon({ source_id: event.target.value || undefined, page: undefined })}
            className="min-h-12 px-3.5 text-[13.5px] font-medium text-ink bg-surface border border-input-line rounded-lg focus:outline-none focus:border-gold-700 cursor-pointer"
          >
            <option value="">Todos los canales</option>
            {canales.map((canal) => (
              <option key={canal.id} value={canal.id}>
                {canal.name}
              </option>
            ))}
          </select>

          {hayFiltro && (
            <button
              type="button"
              onClick={() => irCon({ q: undefined, source_id: undefined, page: undefined })}
              className="min-h-12 px-4 inline-flex items-center gap-2 text-[13.5px] font-semibold text-ink-muted hover:text-ink bg-surface border border-input-line rounded-lg transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-gold-700"
            >
              <X className="size-4" />
              <span>Limpiar filtros</span>
            </button>
          )}

          <span className="inline-flex items-center px-3.5 py-2 rounded-full bg-gold-100 text-gold-900 text-[13px] font-bold tabular-nums border border-gold-300/60 ml-1">
            {total} contactos registrados
          </span>
        </div>
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
            etiqueta="Directorio de contactos patrimoniales"
            vacio={{
              titulo: hayFiltro ? "Sin contactos para este filtro" : "Sin contactos todavía",
              cuerpo: hayFiltro
                ? "Prueba cambiando o limpiando los filtros actuales."
                : "Registra el primer cliente o inversionista con “Nuevo contacto”.",
            }}
          />
          {totalPaginas > 1 && (
            <div className="form-actions" style={{ justifyContent: "space-between", padding: "16px 8px 0" }}>
              <button
                className="button min-h-12 px-4 text-[13.5px]"
                type="button"
                disabled={pagina <= 1}
                onClick={() => irCon({ page: String(pagina - 1) })}
              >
                Anterior
              </button>
              <span className="text-[13px] font-semibold text-muted-foreground tabular-nums">
                Página {pagina} de {totalPaginas}
              </span>
              <button
                className="button min-h-12 px-4 text-[13.5px]"
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
 * Alta de contacto, con el 409 de duplicados de la decisión #19.
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
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-navy-950/60 backdrop-blur-xs p-4 animate-in fade-in"
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <section
        className="modal bg-surface border border-line rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200 outline-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="nuevo-contacto-title"
        ref={modalRef}
      >
        <div className="drawer-head flex items-center justify-between px-6 py-4 border-b border-line bg-surface-alt">
          <h2 id="nuevo-contacto-title" className="font-heading font-bold text-lg text-navy-950 m-0">
            Nuevo contacto patrimonial
          </h2>
          <button className="icon-button min-h-12 min-w-12 size-12" onClick={onClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>
        <form className="form-grid p-6" ref={formRef} onSubmit={alEnviar} aria-busy={enviando}>
          {errorRed && (
            <div className="span-2">
              <AlertaErrorFormulario
                mensaje={errorRed}
                onReintentar={() => void enviar(false)}
                disabled={enviando}
              />
            </div>
          )}
          <label className="span-2 text-[13.5px] font-semibold text-ink">
            Nombre completo
            <input
              name="fullName"
              required
              autoFocus
              className="min-h-12 text-[13.5px] px-3.5 border border-input-line rounded-lg focus-visible:outline-2 focus-visible:outline-gold-700"
            />
            {errores.fullName && <small className="text-[13px] text-danger">{errores.fullName}</small>}
          </label>
          <label className="text-[13.5px] font-semibold text-ink">
            Teléfono
            <input
              name="phone"
              placeholder="809-555-0184"
              className="min-h-12 text-[13.5px] px-3.5 border border-input-line rounded-lg focus-visible:outline-2 focus-visible:outline-gold-700"
            />
            {errores.phone && <small className="text-[13px] text-danger">{errores.phone}</small>}
          </label>
          <label className="text-[13.5px] font-semibold text-ink">
            Correo
            <input
              name="email"
              type="email"
              className="min-h-12 text-[13.5px] px-3.5 border border-input-line rounded-lg focus-visible:outline-2 focus-visible:outline-gold-700"
            />
            {errores.email && <small className="text-[13px] text-danger">{errores.email}</small>}
          </label>
          <label className="span-2 text-[13.5px] font-semibold text-ink">
            Canal
            <select
              name="sourceId"
              defaultValue=""
              className="min-h-12 text-[13.5px] px-3.5 border border-input-line rounded-lg focus-visible:outline-2 focus-visible:outline-gold-700 cursor-pointer"
            >
              <option value="">Sin especificar</option>
              {canales.map((canal) => (
                <option key={canal.id} value={canal.id}>
                  {canal.name}
                </option>
              ))}
            </select>
          </label>
          <label className="span-2 text-[13.5px] font-semibold text-ink">
            Notas
            <textarea
              name="notes"
              className="min-h-24 w-full rounded-xl border border-input-line bg-surface p-3 text-[13.5px] text-ink focus-visible:outline-2 focus-visible:outline-gold-700"
              placeholder="Detalles sobre perfil del cliente o proyectos de interés..."
            />
          </label>
          {errores._ && <small className="text-[13px] text-danger">{errores._}</small>}

          {candidatos && (
            <div className="span-2 permission-note text-[13px]" role="alert">
              <strong>Ya existe un contacto parecido</strong>
              <ul className="my-2">
                {candidatos.map((candidato) => (
                  <li key={candidato.id} className="text-[13px]">
                    {candidato.fullName} — {candidato.phoneDisplay ?? "sin teléfono"} — {candidato.email ?? "sin correo"}
                  </li>
                ))}
              </ul>
              <button
                className="button primary min-h-12 px-5 text-[13.5px]"
                type="button"
                disabled={enviando}
                onClick={() => void enviar(true)}
              >
                Crear de todas formas
              </button>
            </div>
          )}

          <div className="form-actions span-2 pt-2">
            <button
              className="button min-h-12 px-5 text-[13.5px]"
              type="button"
              onClick={onClose}
              disabled={enviando}
            >
              Cancelar
            </button>
            <button
              className="button primary min-h-12 px-6 text-[13.5px]"
              type="submit"
              disabled={enviando}
            >
              {enviando ? "Creando…" : "Crear contacto"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
