"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, type ReactNode, useMemo, useRef, useState } from "react";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { LEAD_STATUSES, OPERATION_TYPES } from "@/domain/catalogs";
import { Avatar, PageHeader } from "../_ui/prototipo-ui";
import { AlertaErrorFormulario } from "../_ui/alerta-error-formulario";
import { ModuleTabs } from "../_ui/module-tabs";
import { LeadInspector } from "./inspector";
import { DataTable, type Columna } from "@/components/ui/data-table";
import { Insignia } from "@/components/ui/bits";
import { leadStatusTone } from "@/components/ui/tone";
import { Building2, MessageSquare, Phone, Sparkles, X } from "lucide-react";

export type LeadFila = {
  id: number;
  contactId: number;
  contactName: string;
  contactPhone: string | null;
  contactPhoneDisplay: string | null;
  contactEmail: string | null;
  sourceId: number | null;
  sourceName: string | null;
  projectId: number | null;
  projectName: string | null;
  projectInterestText: string | null;
  zoneInterest: string | null;
  operationType: (typeof OPERATION_TYPES)[number] | null;
  currency: string;
  budgetMinCents: number | null;
  budgetMaxCents: number | null;
  status: (typeof LEAD_STATUSES)[number];
  brokerId: number | null;
  brokerName: string | null;
  suggestedBrokerId: number | null;
  suggestedBrokerName: string | null;
  campaign: string | null;
  receivedAt: Date;
  discardReason: string | null;
  convertedDealId: number | null;
};

export type Canal = { id: number; name: string };

/** Candidato para el botón Asignar del inspector (issue #22). */
export type BrokerOpcion = { userId: number; fullName: string };

export const ETIQUETAS_ESTADO: Record<LeadFila["status"], string> = {
  new: "Nuevo",
  assigned: "Asignado",
  contacted: "Contactado",
  converted: "Convertido",
  discarded: "Descartado",
};

const TONO_ESTADO: Record<LeadFila["status"], "gold" | "blue" | "green" | "red" | "neutral"> = {
  new: "gold",
  assigned: "blue",
  contacted: "blue",
  converted: "green",
  discarded: "red",
};

function formatoPresupuesto(lead: LeadFila): string {
  if (!lead.budgetMinCents && !lead.budgetMaxCents) return "Por definir";
  const formateador = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: lead.currency,
    maximumFractionDigits: 0,
  });
  if (lead.budgetMinCents && lead.budgetMaxCents) {
    return `${formateador.format(lead.budgetMinCents / 100)} - ${formateador.format(lead.budgetMaxCents / 100)}`;
  }
  const centavos = lead.budgetMinCents ?? lead.budgetMaxCents ?? 0;
  return formateador.format(centavos / 100);
}

/**
 * M2 · Leads (F1). Sustituye los `initialLeads` de muestra por los leads
 * reales que resuelve `page.tsx` con `visibleRows` — mismo look que M1
 * (`.filter-bar`, `.table-wrap`, `.split-view`), búsqueda/origen/estado/página
 * en la URL, no en estado de cliente.
 */
export function LeadsVista({
  leads,
  canales,
  brokers,
  total,
  tamanioPagina,
  pagina,
  filtros,
  leadSeleccionado,
  historial,
  roleSlug,
}: {
  leads: LeadFila[];
  canales: Canal[];
  brokers: BrokerOpcion[];
  total: number;
  tamanioPagina: number;
  pagina: number;
  filtros: { q: string; sourceId?: number; status?: LeadFila["status"] };
  leadSeleccionado: LeadFila | null;
  historial: ReactNode;
  roleSlug: string;
}) {
  const isBroker = roleSlug === "broker";
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
  const hayFiltro = Boolean(filtros.q || filtros.sourceId || filtros.status);

  const columnasTabla: Columna<LeadFila>[] = useMemo(
    () => [
      {
        clave: "lead",
        titulo: "Lead / Prospecto",
        movil: "titulo",
        celda: (lead) => (
          <div className="flex items-center gap-3">
            <Avatar name={lead.contactName} small />
            <div className="grid min-w-0 leading-tight">
              <strong className="text-[13.5px] font-bold text-foreground truncate">{lead.contactName}</strong>
              <span className="text-[11.5px] text-muted-foreground truncate">
                {lead.contactPhoneDisplay ?? lead.contactPhone ?? "—"}
              </span>
            </div>
          </div>
        ),
        valor: (lead) => lead.contactName,
        ordenable: true,
      },
      {
        clave: "proyecto",
        titulo: "Proyecto / Interés",
        movil: "subtitulo",
        celda: (lead) => (
          <div className="flex items-center gap-1.5 min-w-0">
            <Building2 size={13} className="text-gold-500 shrink-0" />
            <span className="truncate font-medium text-foreground text-[12.5px]">
              {lead.projectName ?? lead.projectInterestText ?? lead.zoneInterest ?? "Por definir"}
            </span>
          </div>
        ),
        valor: (lead) => lead.projectName ?? lead.projectInterestText ?? lead.zoneInterest ?? "",
        ordenable: true,
      },
      {
        clave: "origen",
        titulo: "Canal",
        secundaria: true,
        celda: (lead) => (
          <span className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-0.5 text-[11.5px] font-medium text-muted-foreground border border-border/40">
            {lead.sourceName ?? "Directo"}
          </span>
        ),
        valor: (lead) => lead.sourceName ?? "",
      },
      {
        clave: "responsable",
        titulo: "Responsable",
        celda: (lead) =>
          lead.brokerName ? (
            <span className="text-[12.5px] font-medium text-foreground">{lead.brokerName}</span>
          ) : lead.suggestedBrokerName ? (
            <span className="inline-flex items-center gap-1 text-[11.5px] text-gold-600 bg-gold-500/10 px-2 py-0.5 rounded-full border border-gold-500/30">
              <Sparkles size={11} /> {lead.suggestedBrokerName}
            </span>
          ) : (
            <span className="text-[12px] text-muted-foreground italic">Sin asignar</span>
          ),
        valor: (lead) => lead.brokerName ?? lead.suggestedBrokerName ?? "",
      },
      {
        clave: "estado",
        titulo: "Estado",
        movil: "insignia",
        celda: (lead) => (
          <Insignia
            texto={ETIQUETAS_ESTADO[lead.status]}
            tono={leadStatusTone(lead.status)}
            punto={true}
          />
        ),
        valor: (lead) => ETIQUETAS_ESTADO[lead.status],
      },
      {
        clave: "presupuesto",
        titulo: "Presupuesto",
        alinear: "derecha",
        celda: (lead) => (
          <span className="font-semibold text-foreground tabular-nums text-[12.5px]">
            {formatoPresupuesto(lead)}
          </span>
        ),
        valor: (lead) => lead.budgetMaxCents ?? lead.budgetMinCents ?? 0,
        ordenable: true,
      },
      {
        clave: "acciones",
        titulo: "Contacto",
        alinear: "derecha",
        celda: (lead) => {
          const phone = lead.contactPhone;
          const clean = phone ? phone.replace(/\D/g, "") : null;
          return (
            <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
              {clean && (
                <a
                  href={`https://wa.me/${clean}?text=${encodeURIComponent(
                    `Hola ${lead.contactName}, le contacto de Quisqueya Home respecto a su interés en ${
                      lead.projectName ?? "nuestros proyectos inmobiliarios en República Dominicana"
                    }.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  title={`WhatsApp directo con ${lead.contactName}`}
                  className="inline-flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 transition-colors shadow-2xs"
                >
                  <MessageSquare size={13} />
                </a>
              )}
              {clean && (
                <a
                  href={`tel:${clean}`}
                  title={`Llamar a ${lead.contactName}`}
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
        eyebrow="C1 · Captación"
        title={isBroker ? "Mis leads" : "Bandeja de leads"}
        subtitle="Origen, asignación y próxima acción de cada prospecto."
        action={
          <button className="button primary" type="button" onClick={() => setCreando(true)}>
            Registrar lead
          </button>
        }
      />
      <div className="mb-3">
        <ModuleTabs
          tabs={[
            { id: "all", label: "Todos", count: total },
            { id: "new", label: "Nuevos", count: leads.filter((l) => l.status === "new").length },
            { id: "assigned", label: "Asignados", count: leads.filter((l) => l.status === "assigned").length },
            { id: "contacted", label: "Contactados", count: leads.filter((l) => l.status === "contacted").length },
            { id: "converted", label: "Convertidos", count: leads.filter((l) => l.status === "converted").length },
            { id: "discarded", label: "Descartados", count: leads.filter((l) => l.status === "discarded").length },
          ]}
          activeTab={filtros.status ?? "all"}
          onTabChange={(tabId) =>
            irCon({
              status: tabId === "all" ? undefined : (tabId as LeadFila["status"]),
              page: undefined,
              lead: undefined,
            })
          }
        />
      </div>
      <div className="filter-bar">
        <input
          type="search"
          placeholder="Buscar por nombre, teléfono o correo…"
          defaultValue={filtros.q}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              irCon({ q: event.currentTarget.value.trim() || undefined, page: undefined, lead: undefined });
            }
          }}
        />
        <select
          aria-label="Filtrar por origen"
          value={filtros.sourceId ?? ""}
          onChange={(event) => irCon({ source_id: event.target.value || undefined, page: undefined })}
        >
          <option value="">Todos los orígenes</option>
          {canales.map((canal) => (
            <option key={canal.id} value={canal.id}>
              {canal.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Filtrar por estado"
          value={filtros.status ?? ""}
          onChange={(event) => irCon({ status: event.target.value || undefined, page: undefined })}
        >
          <option value="">Todos los estados</option>
          {LEAD_STATUSES.map((estado) => (
            <option key={estado} value={estado}>
              {ETIQUETAS_ESTADO[estado]}
            </option>
          ))}
        </select>
        <span>{total} leads</span>
      </div>
      <div className={leadSeleccionado ? "split-view inspector-open" : "split-view"}>
        <div className="table-wrap">
          <DataTable
            filas={leads}
            columnas={columnasTabla}
            idDe={(lead) => String(lead.id)}
            activa={leadSeleccionado ? String(leadSeleccionado.id) : null}
            onAbrir={(lead) => irCon({ lead: String(lead.id) })}
            porPagina={tamanioPagina}
            etiqueta="Listado de leads"
            vacio={{
              titulo: hayFiltro ? "Sin resultados para esta búsqueda" : "Sin leads todavía",
              cuerpo: hayFiltro
                ? "Prueba cambiando o limpiando los filtros actuales."
                : "Registra el primer prospecto con “Registrar lead” o espera a que ingrese por los canales de captación.",
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
        {leadSeleccionado && (
          <LeadInspector
            lead={leadSeleccionado}
            brokers={brokers}
            historial={historial}
            onClose={() => irCon({ lead: undefined })}
          />
        )}
      </div>
      {creando && <FormularioLead canales={canales} onClose={() => setCreando(false)} />}
    </>
  );
}

/**
 * Alta manual. Igual que M1: 409 con candidatos de duplicado (decisión #19),
 * más "Crear de todas formas" (`crear_igual: true`).
 */
function FormularioLead({ canales, onClose }: { canales: Canal[]; onClose: () => void }) {
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
      const respuesta = await fetch("/api/leads", {
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
        setErrorRed(cuerpo.error ?? "No se pudo registrar el lead. Revisa los datos ingresados.");
        return;
      }

      router.refresh();
      onClose();
    } catch {
      const offline = typeof navigator !== "undefined" && !navigator.onLine;
      setErrorRed(
        offline
          ? "Sin conexión a internet. Los datos ingresados se mantienen intactos."
          : "Fallo de conexión de red al enviar el lead. Tus datos están a salvo.",
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
        ref={modalRef}
        tabIndex={-1}
        className="modal bg-surface border border-line rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200 outline-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="nuevo-lead-title"
      >
        <div className="drawer-head flex items-center justify-between px-6 py-4 border-b border-line bg-surface-alt">
          <h2 id="nuevo-lead-title" className="font-heading font-bold text-lg text-navy-950 m-0">
            Registrar lead manual
          </h2>
          <button className="icon-button" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>
        <form className="form-grid p-6" ref={formRef} onSubmit={alEnviar} aria-busy={enviando}>
          {errorRed && (
            <AlertaErrorFormulario
              mensaje={errorRed}
              esErrorRed={true}
              onReintentar={() => void enviar(false)}
              reintentando={enviando}
            />
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
          <label>
            Proyecto de interés (texto libre)
            <input name="projectInterestText" placeholder="Praderas de Punta Cana" />
          </label>
          <label>
            Zona de interés
            <input name="zoneInterest" placeholder="Punta Cana" />
          </label>
          <label>
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
          <label>
            Operación
            <select name="operationType" defaultValue="">
              <option value="">Sin especificar</option>
              <option value="sale">Venta</option>
              <option value="rent">Alquiler</option>
            </select>
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
              <button
                className="button primary"
                type="button"
                disabled={enviando}
                aria-busy={enviando}
                onClick={() => void enviar(true)}
              >
                Crear de todas formas
              </button>
            </div>
          )}

          <div className="form-actions span-2">
            <button className="button" type="button" onClick={onClose} disabled={enviando}>
              Cancelar
            </button>
            <button className="button primary" type="submit" disabled={enviando} aria-busy={enviando}>
              {enviando ? "Registrando…" : "Registrar lead"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
