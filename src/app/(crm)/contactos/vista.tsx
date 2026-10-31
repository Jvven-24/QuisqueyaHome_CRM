"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, type ReactNode, useMemo, useRef, useState } from "react";
import { EstadoConexion } from "../inicio/estado-conexion";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { CrearContactoInput, erroresDeCampos } from "@/application/contactos/entrada";
import { Avatar, PageHeader } from "../_ui/prototipo-ui";
import { ModuleTabs } from "@/components/modulo";
import { AlertaErrorFormulario } from "../_ui/alerta-error-formulario";
import { ContactoInspector } from "./inspector";
import { DataTable, type Columna } from "@/components/ui/data-table";
import { PhoneInput } from "@/components/ui/phone-input";
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
  soloFicha = false,
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
  soloFicha?: boolean;
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
              <strong className="text-[14px] font-bold text-foreground break-words">{c.fullName}</strong>

            </div>
          </div>
        ),
        valor: (c) => c.fullName,
        ordenable: true,
      },
      {
        clave: "identidad",
        titulo: "Tel\u00e9fono o correo",
        movil: "subtitulo",
        valor: (c) => c.phoneDisplay ?? c.phone ?? c.email ?? "Sin tel\u00e9fono ni correo",
      },
      {
        clave: "canal",
        titulo: "Canal",
        celda: (c) => <CanalChip nombre={c.sourceName} />,
        valor: (c) => c.sourceName ?? "",
      },
      {
        clave: "broker",
        titulo: "Asesor",
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
        titulo: "Última interacción",
        celda: (c) => (
          <span className="text-[13px] text-muted-foreground font-medium">
            {c.lastInteractionAt
              ? new Date(c.lastInteractionAt).toLocaleDateString("es-DO", {
                  timeZone: "America/Santo_Domingo",
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "Sin interacciones"}
          </span>
        ),
        valor: (c) => c.lastInteractionAt ? new Date(c.lastInteractionAt).getTime() : 0,
        ordenable: true,
      },
      {
        clave: "acciones",
        titulo: "Contacto",
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
            <div className="flex flex-wrap items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
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

  if (soloFicha && contactoSeleccionado) return (
    <div className="[&>.inspector]:static [&>.inspector]:w-full [&>.inspector]:max-w-none">
      <EstadoConexion />
          <ContactoInspector
            contacto={contactoSeleccionado}
            canales={canales}
            brokers={brokers}
            puedeReasignar={puedeReasignar}
            historial={historial}
            onClose={() => router.push("/contactos")}
          />
    </div>
  );

  return (
    <div className="min-w-0 max-w-full [&>.page-header]:flex-col xl:[&>.page-header]:flex-row [&>.page-header>div]:min-w-0">
      <EstadoConexion />
      <PageHeader
        eyebrow="Private Desk · Directorio"
        title="Contactos"
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

      <ModuleTabs label="Gestión de contactos" items={[{href:"/contactos",label:"Personas"},{href:"/contactos/empresas",label:"Empresas y representantes",match:"prefix"},{href:"/contactos/demandas",label:"Demandas y matching",match:"prefix"}]} className="mb-4" />
      {/* Franja de búsqueda y filtros ejecutivos */}
      <div className="mb-4 grid min-w-0 gap-3 rounded-xl border border-line bg-surface p-3 lg:grid-cols-[minmax(16rem,1fr)_auto] lg:items-end">
        <form
          role="search"
          aria-label="Buscar contactos"
          className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const q = new FormData(event.currentTarget).get("q")?.toString().trim();
            irCon({ q: q || undefined, page: undefined, contacto: undefined });
          }}
        >
          <label className="min-w-0 text-[13px] font-semibold text-ink" htmlFor="contactos-busqueda">Buscar contacto
          <span className="relative flex min-w-0 items-center w-full">
            <Search className="absolute left-3.5 size-4 text-muted pointer-events-none" />
            <input
              id="contactos-busqueda"
              key={filtros.q}
              name="q"
              type="search"
              aria-label="Buscar contactos; pulsa Enter para buscar"
              title="Pulsa Enter para buscar"
              placeholder="Buscar por nombre, teléfono o correo…"
              defaultValue={filtros.q}
              className="w-full min-h-12 pl-10 pr-3.5 text-[14px] font-medium bg-canvas border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-gold-700 focus:ring-2 focus:ring-gold-700/20 transition-all"
            />
          </span>
          </label>
          <button type="submit" className="button secondary min-h-12 shrink-0 px-4">Buscar</button>
        </form>

        <div className="grid min-w-0 grid-cols-1 items-end gap-2 sm:grid-cols-[minmax(10rem,1fr)_auto] lg:flex lg:flex-wrap">
          <label className="min-w-0 text-[13px] font-semibold text-ink" htmlFor="contactos-canal">Canal de origen
          <select
            id="contactos-canal"
            aria-label="Filtrar por canal"
            value={filtros.sourceId ?? ""}
            onChange={(event) => irCon({ source_id: event.target.value || undefined, page: undefined })}
            className="min-h-12 w-full min-w-0 px-3.5 text-[13.5px] font-medium text-ink bg-surface border border-input-line rounded-lg focus:outline-none focus:border-gold-700 cursor-pointer lg:max-w-60"
          >
            <option value="">Todos los canales</option>
            {canales.map((canal) => (
              <option key={canal.id} value={canal.id}>
                {canal.name}
              </option>
            ))}
          </select>
          </label>

          {hayFiltro && (
            <button
              type="button"
              onClick={() => irCon({ q: undefined, source_id: undefined, page: undefined })}
              className="min-h-12 px-4 inline-flex items-center justify-center gap-2 text-[13.5px] font-semibold text-ink-muted hover:text-ink bg-surface border border-input-line rounded-lg transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-gold-700"
            >
              <X className="size-4" />
              <span>Limpiar filtros</span>
            </button>
          )}

        </div>
        <p className="m-0 border-t border-line pt-2 text-[13px] text-ink-muted lg:col-span-2"><strong className="font-semibold tabular-nums text-ink">{total}</strong> contactos registrados{hayFiltro ? " · Filtros activos" : ""}</p>
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
    </div>
  );
}

/**
 * Alta de contacto, con el 409 de duplicados de la decisión #19.
 */
function FormularioContacto({ canales, onClose }: { canales: Canal[]; onClose: () => void }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const submittingRef = useRef(false);
  const modalRef = useFocusTrap<HTMLElement>({ onClose, autoFocus: false });
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
      const validacion = CrearContactoInput.safeParse(datos);
      if (!validacion.success) {
        setErrores(erroresDeCampos(validacion.error));
        return;
      }
      const entrada = validacion.data;
      const respuesta = await fetch("/api/contactos", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ fullName: entrada.fullName, phone: entrada.phone, email: entrada.email, sourceId: entrada.sourceId, notes: entrada.notes, crear_igual: crearIgual }),
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
      className="modal-backdrop crm-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-navy-950/60 p-4 animate-in fade-in"
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <section
        className="modal crm-modal flex min-h-0 w-full max-w-lg flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-md outline-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="nuevo-contacto-title"
        ref={modalRef}
      >
        <div className="drawer-head flex shrink-0 items-center justify-between gap-3 border-b border-line bg-surface-alt px-4 py-3 sm:px-6">
          <h2 id="nuevo-contacto-title" className="font-heading font-bold text-lg text-navy-950 m-0">
            Nuevo contacto patrimonial
          </h2>
          <button className="icon-button min-h-12 min-w-12 size-12" onClick={onClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>
        <form noValidate className="flex min-h-0 flex-1 flex-col overflow-hidden" ref={formRef} onSubmit={alEnviar} aria-busy={enviando}>
          <div className="form-grid min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
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
            Nombre completo (obligatorio)
            <input
              name="fullName"
              required
              aria-required="true"
              aria-invalid={Boolean(errores.fullName)}
              aria-describedby={errores.fullName ? "contacto-error-nombre" : undefined}
              autoFocus
              className="min-h-12 text-[13.5px] px-3.5 border border-input-line rounded-lg focus-visible:outline-2 focus-visible:outline-gold-700"
            />
            {errores.fullName && <small id="contacto-error-nombre" role="alert" className="text-[13px] text-danger">{errores.fullName}</small>}
          </label>
          <div className="span-2 text-[13.5px] font-semibold text-ink">
            <span className="block mb-1">Teléfono (RD y diáspora)</span>
            <PhoneInput name="phone" />
            {errores.phone && <small className="text-[13px] text-danger">{errores.phone}</small>}
          </div>
          <label className="span-2 text-[13.5px] font-semibold text-ink">
            Correo
            <input
              name="email"
              type="email"
              aria-invalid={Boolean(errores.email)}
              aria-describedby={errores.email ? "contactos-error-correo" : undefined}
              placeholder="cliente@ejemplo.com"
              className="min-h-12 text-[13.5px] px-3.5 border border-input-line rounded-lg focus-visible:outline-2 focus-visible:outline-gold-700"
            />
            {errores.email && <small id="contactos-error-correo" role="alert" className="text-[13px] text-danger">{errores.email}</small>}
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

          </div>
          <div className="form-actions !grid shrink-0 grid-cols-2 gap-2 border-t border-line bg-surface !p-4">
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
