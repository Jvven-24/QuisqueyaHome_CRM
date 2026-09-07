"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, type ReactNode, useRef, useState } from "react";
import { LEAD_STATUSES, OPERATION_TYPES } from "@/domain/catalogs";
import { Avatar, Badge, PageHeader } from "../_ui/prototipo-ui";
import { SinResultados, Vacio } from "../_ui/estados";
import { LeadInspector } from "./inspector";

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
          {leads.length === 0 ? (
            hayFiltro ? (
              <SinResultados />
            ) : (
              <Vacio titulo="Sin leads todavía" texto="Registra el primero con “Registrar lead” o espera a que llegue por el portal." />
            )
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Lead</th>
                  <th>Proyecto</th>
                  <th>Origen</th>
                  <th>Responsable</th>
                  <th>Estado</th>
                  <th>Presupuesto</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className={leadSeleccionado?.id === lead.id ? "selected" : ""}
                    onClick={() => irCon({ lead: String(lead.id) })}
                  >
                    <td>
                      <span className="table-person">
                        <Avatar name={lead.contactName} small />
                        <span>
                          <strong>{lead.contactName}</strong>
                          <small>{lead.contactPhoneDisplay ?? lead.contactPhone ?? "—"}</small>
                        </span>
                      </span>
                    </td>
                    <td>{lead.projectName ?? lead.projectInterestText ?? lead.zoneInterest ?? "—"}</td>
                    <td>{lead.sourceName ?? "—"}</td>
                    <td>
                      {lead.brokerName ?? (
                        <span title={lead.suggestedBrokerName ? `Sugerido: ${lead.suggestedBrokerName}` : undefined}>
                          {lead.suggestedBrokerName ? `Sugerido: ${lead.suggestedBrokerName}` : "Sin asignar"}
                        </span>
                      )}
                    </td>
                    <td>
                      <Badge tone={TONO_ESTADO[lead.status]}>{ETIQUETAS_ESTADO[lead.status]}</Badge>
                    </td>
                    <td>{formatoPresupuesto(lead)}</td>
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
        {leadSeleccionado && (
          <LeadInspector lead={leadSeleccionado} historial={historial} onClose={() => irCon({ lead: undefined })} />
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
    const respuesta = await fetch("/api/leads", {
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
      setErrores(cuerpo.fields ?? { _: cuerpo.error ?? "No se pudo registrar el lead." });
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
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="nuevo-lead-title">
        <div className="drawer-head">
          <h2 id="nuevo-lead-title">Registrar lead manual</h2>
          <button className="icon-button" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>
        <form className="form-grid" ref={formRef} onSubmit={alEnviar}>
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
              {enviando ? "Registrando…" : "Registrar lead"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
