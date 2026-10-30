"use client";
import Link from "next/link";
import { SlaPolicyPreview } from "./_componentes/sla-preview";

import { leadWaitingLabel } from "@/application/leads/sla";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, type ReactNode, useMemo, useRef, useState } from "react";
import { EstadoConexion } from "../inicio/estado-conexion";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { ETIQUETAS_ESTADO } from "@/application/leads/presentacion";
export { ETIQUETAS_ESTADO } from "@/application/leads/presentacion";
import { CrearLeadInput } from "@/application/leads/entrada";
import { erroresDeCampos } from "@/application/contactos/entrada";
import { LEAD_STATUSES, OPERATION_TYPES } from "@/domain/catalogs";
import { Avatar, PageHeader } from "../_ui/prototipo-ui";
import { AlertaErrorFormulario } from "../_ui/alerta-error-formulario";
import { ModuleTabs } from "../_ui/module-tabs";
import { ModuleTabs as RouteModuleTabs } from "@/components/modulo";
import { LeadInspector } from "./inspector";
import { NotaDeVozLeadModal } from "./nota-de-voz-modal";
import { DataTable, type Columna } from "@/components/ui/data-table";
import { PhoneInput } from "@/components/ui/phone-input";
import { Insignia } from "@/components/ui/bits";
import { leadStatusTone } from "@/components/ui/tone";
import { ResumenCompacto } from "@/components/ui/resumen-compacto";
import {
  Building2,
  Globe,
  MessageSquare,
  Mic,
  Phone,
  Plus,
  Search,
  Sparkles,
  TrendingUp,
  Users,
  Video,
  X,
} from "lucide-react";

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
  firstContactedAt?: Date | null;
  discardReason: string | null;
  convertedDealId: number | null;
};

export type Canal = { id: number; name: string };

/** Candidato para el botón Asignar del inspector (issue #22). */
export type BrokerOpcion = { userId: number; fullName: string };

export type MetricasLeads = {
  total: number;
  new: number;
  assigned: number;
  contacted: number;
  converted: number;
  discarded: number;
};

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
 * M2 · Leads (Private Desk).
 * Eleva la experiencia hacia un estándar de banca patrimonial y hospitalidad caribeña.
 */
export function LeadsVista({
  leads,
  canales,
  proyectos,
  brokers,
  total,
  metricas,
  tamanioPagina,
  pagina,
  filtros,
  leadSeleccionado,
  historial,
  soloFicha = false,
  roleSlug,
  canAssign = false,
  actorId,
  ahora = 0,
  cola = false,
}: {
  leads: LeadFila[];
  canales: Canal[];
  proyectos: { id: number; name: string; zone: string | null }[];
  brokers: BrokerOpcion[];
  total: number;
  metricas?: MetricasLeads;
  tamanioPagina: number;
  pagina: number;
  filtros: { q: string; sourceId?: number; status?: LeadFila["status"] };
  leadSeleccionado: LeadFila | null;
  historial: ReactNode;
  soloFicha?: boolean;
  roleSlug: string;
  canAssign?: boolean;
  actorId?: number;
  ahora?: number;
  cola?: boolean;
}) {
  const isBroker = roleSlug === "broker";
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [creando, setCreando] = useState(() => searchParams.get("crear") === "1");
  const [creandoPorVoz, setCreandoPorVoz] = useState(() => searchParams.get("voz") === "1");

  function irCon(cambios: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [clave, valor] of Object.entries(cambios)) {
      if (valor) params.set(clave, valor);
      else params.delete(clave);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  const kpis: MetricasLeads = metricas ?? {
    total,
    new: leads.filter((l) => l.status === "new").length,
    assigned: leads.filter((l) => l.status === "assigned").length,
    contacted: leads.filter((l) => l.status === "contacted").length,
    converted: leads.filter((l) => l.status === "converted").length,
    discarded: leads.filter((l) => l.status === "discarded").length,
  };

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
            <Avatar name={lead.contactName} />
            <div className="grid min-w-0 leading-tight">
              <strong className="text-[14px] font-bold text-foreground break-words">{lead.contactName}</strong>
              <span className="text-[13px] text-muted-foreground break-words">
                {lead.contactPhoneDisplay ?? lead.contactPhone ?? "Sin teléfono"}
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
          <div className="flex items-center gap-2 min-w-0">
            <Building2 className="size-4 text-gold-600 shrink-0" />
            <span className="truncate font-semibold text-foreground text-[13.5px]">
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
        celda: (lead) => <CanalChip nombre={lead.sourceName} />,
        valor: (lead) => lead.sourceName ?? "",
      },
      { clave: "espera", titulo: "Cola y SLA", celda: (lead) => <div><strong className="text-[13px]">{leadWaitingLabel(lead, ahora)}</strong><br/><span className="text-[13px] text-muted-foreground">SLA: sin política configurada</span></div>, valor: (lead) => leadWaitingLabel(lead, ahora) },
      {
        clave: "responsable",
        titulo: "Responsable",
        celda: (lead) =>
          lead.brokerName ? (
            <span className="text-[13.5px] font-medium text-foreground">{lead.brokerName}</span>
          ) : lead.suggestedBrokerName ? (
            <span className="inline-flex items-center gap-1.5 text-[13px] text-gold-700 bg-gold-500/10 px-2.5 py-1 rounded-full border border-gold-500/30 font-semibold">
              <Sparkles className="size-3.5 text-gold-600" /> {lead.suggestedBrokerName}
            </span>
          ) : (
            <span className="text-[13px] text-muted-foreground italic">Sin asignar</span>
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
          <span className="font-bold text-foreground tabular-nums text-[13.5px]">
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
          const whatsappUrl = clean
            ? `https://wa.me/${clean}?text=${encodeURIComponent(
                `Hola ${lead.contactName}, le contacto de Quisqueya Home Private Desk respecto a su consulta sobre ${
                  lead.projectName ?? "inversiones inmobiliarias en República Dominicana"
                }. ¿En qué momento le resultaría conveniente conversar?`
              )}`
            : null;

          return (
            <div className="flex flex-wrap items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`WhatsApp directo con ${lead.contactName}`}
                  title={`WhatsApp directo con ${lead.contactName}`}
                  className="inline-flex size-12 min-h-12 min-w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 border border-emerald-300 transition-colors shadow-2xs focus-visible:outline-2 focus-visible:outline-gold-700"
                >
                  <MessageSquare className="size-5" />
                </a>
              )}
              {clean && (
                <a
                  href={`tel:${clean}`}
                  aria-label={`Llamar a ${lead.contactName}`}
                  title={`Llamar a ${lead.contactName}`}
                  className="inline-flex size-12 min-h-12 min-w-12 items-center justify-center rounded-xl bg-surface text-navy-950 hover:bg-surface-alt border border-line transition-colors shadow-2xs focus-visible:outline-2 focus-visible:outline-gold-700"
                >
                  <Phone className="size-5" />
                </a>
              )}
            </div>
          );
        },
      },
    ],
    [ahora]
  );

  if (soloFicha && leadSeleccionado) return (
    <div className="[&>.inspector]:static [&>.inspector]:w-full [&>.inspector]:max-w-none">
      <EstadoConexion />
          <LeadInspector
            lead={leadSeleccionado}
            brokers={brokers}
            historial={historial}
            actorId={actorId}
            roleSlug={roleSlug}
            canAssign={canAssign}
            onClose={() => router.push("/leads")}
          />
    </div>
  );

  return (
    <div className="min-w-0 max-w-full [&>.page-header]:flex-col xl:[&>.page-header]:flex-row [&>.page-header>div]:min-w-0">
      <EstadoConexion />
      <PageHeader
        eyebrow="Private Desk · Captación"
        title={isBroker ? "Mis leads calificados" : "Bandeja de leads patrimoniales"}
        subtitle="Monitoreo de prospectos, canal de origen y asignación."
        action={
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
            <button
              type="button"
              onClick={() => setCreandoPorVoz(true)}
              aria-label="Registrar lead con nota de voz IA"
              className="min-h-12 px-4 inline-flex justify-center items-center gap-2 rounded-xl border border-gold-500/50 bg-gold-50/40 hover:bg-gold-100/60 text-navy-950 text-[13.5px] font-bold shadow-2xs transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-gold-700"
            >
              <Mic className="size-4 text-gold-600" />
              <span>Nota de voz</span>
            </button>
            <button
              type="button"
              onClick={() => setCreando(true)}
              className="min-h-12 px-5 inline-flex justify-center items-center gap-2.5 rounded-xl bg-navy-950 hover:bg-navy-900 text-white text-[13.5px] font-bold shadow-sm transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-gold-700"
            >
              <Plus className="size-4 text-gold-500" />
              <span>Registrar lead</span>
            </button>
          </div>
        }
      />

      <RouteModuleTabs label="Gestión de leads" items={[{href:cola?"/leads":"/leads?cola=1",label:cola?"Todos los leads":"Cola de primer contacto"},{href:"/leads/asignacion",label:"Asignación y distribución",match:"prefix"},{href:"/leads/importaciones",label:"Importación y migración",match:"prefix"},{href:"/leads/duplicados",label:"Duplicados y fusión",match:"prefix"}]} className="mb-4" />
      {cola && <SlaPolicyPreview />}
      {/* Franja de métricas / KPIs del universo de leads */}
      {/* KPIs: en móvil los cuentan las pestañas de estado; en escritorio, franja compacta */}
      <div className="mb-4 hidden grid-cols-2 gap-3 sm:grid xl:grid-cols-4">
        <ResumenCompacto etiqueta="Total Leads" valor={kpis.total} detalle="Universo calificado" icono={<Users className="size-4 text-gold-600" />} onClick={() => irCon({ status: undefined, page: undefined, lead: undefined })} pressed={!filtros.status} className={!filtros.status ? "border-gold-600 bg-gold-50/20 ring-1 ring-gold-600/30" : ""} />
        <ResumenCompacto etiqueta="Nuevos" valor={kpis.new} detalle="Pendientes de atención" icono={<Sparkles className="size-4 text-rose-700" />} onClick={() => irCon({ status: "new", page: undefined, lead: undefined })} pressed={filtros.status === "new"} className={filtros.status === "new" ? "border-gold-600 bg-gold-50/20 ring-1 ring-gold-600/30" : ""} />
        <ResumenCompacto etiqueta="Contactados" valor={kpis.contacted} detalle="En conversación activa" icono={<MessageSquare className="size-4 text-emerald-700" />} onClick={() => irCon({ status: "contacted", page: undefined, lead: undefined })} pressed={filtros.status === "contacted"} className={filtros.status === "contacted" ? "border-gold-600 bg-gold-50/20 ring-1 ring-gold-600/30" : ""} />
        <ResumenCompacto etiqueta="Convertidos" valor={kpis.converted} detalle="Madurados a negocios" icono={<TrendingUp className="size-4 text-gold-700" />} onClick={() => irCon({ status: "converted", page: undefined, lead: undefined })} pressed={filtros.status === "converted"} className={filtros.status === "converted" ? "border-gold-600 bg-gold-50/20 ring-1 ring-gold-600/30" : ""} />
      </div>

      <div className="mb-4">
        <ModuleTabs
          className="max-w-full [&_button]:min-h-12 [&_button]:text-[13px]"
          tabs={[
            { id: "all", label: "Todos", count: kpis.total },
            { id: "new", label: "Nuevos", count: kpis.new },
            { id: "assigned", label: "Asignados", count: kpis.assigned },
            { id: "contacted", label: "Contactados", count: kpis.contacted },
            { id: "converted", label: "Convertidos", count: kpis.converted },
            { id: "discarded", label: "Descartados", count: kpis.discarded },
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

      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-surface border border-line rounded-xl mb-4 shadow-xs sm:gap-3">
        <form action={pathname} method="get" autoComplete="off" role="search" aria-label="Buscar leads" className="flex items-center gap-2 flex-1 min-w-0 w-full max-w-md sm:flex-wrap">
          {filtros.sourceId && <input type="hidden" name="source_id" value={filtros.sourceId} />}
          {filtros.status && <input type="hidden" name="status" value={filtros.status} />}
          {cola && <input type="hidden" name="cola" value="1" />}
          <div className="relative flex min-w-0 flex-1 items-center">
            <Search className="absolute left-3.5 size-4 text-muted pointer-events-none" />
            <input
              type="search"
              key={filtros.q}
              name="q"
              aria-label="Buscar leads (pulsa Enter para buscar)"
              title="Escribe y pulsa Enter para buscar"
              placeholder="Buscar por nombre, teléfono o correo…"
              defaultValue={filtros.q}
              className="w-full min-h-12 pl-10 pr-3.5 text-[13.5px] bg-surface border border-input-line rounded-lg text-ink placeholder:text-muted focus:outline-none focus:border-gold-700 focus:ring-2 focus:ring-gold-700/20 transition-all"
            />
          </div>
          <button type="submit" className="button min-h-12 shrink-0 px-4">Buscar</button>
          <span className="hidden text-[13px] text-ink-muted sm:inline">Pulsa Enter para buscar</span>
        </form>

        <div className="grid w-full grid-cols-2 items-center gap-2 sm:flex sm:w-auto sm:flex-wrap sm:gap-2.5">
          <select
            aria-label="Filtrar por origen"
            value={filtros.sourceId ?? ""}
            onChange={(event) => irCon({ source_id: event.target.value || undefined, page: undefined })}
            className="min-h-12 w-full min-w-0 px-3 text-[13.5px] font-medium text-ink bg-surface border border-input-line rounded-lg focus:outline-none focus:border-gold-700 cursor-pointer sm:w-auto"
          >
            <option value="">Todos los canales</option>
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
            className="min-h-12 w-full min-w-0 px-3 text-[13.5px] font-medium text-ink bg-surface border border-input-line rounded-lg focus:outline-none focus:border-gold-700 cursor-pointer sm:w-auto"
          >
            <option value="">Todos los estados</option>
            {LEAD_STATUSES.map((estado) => (
              <option key={estado} value={estado}>
                {ETIQUETAS_ESTADO[estado]}
              </option>
            ))}
          </select>

          {hayFiltro && (
            <button
              type="button"
              onClick={() => irCon({ q: undefined, source_id: undefined, status: undefined, page: undefined })}
              className="min-h-12 px-4 inline-flex items-center gap-2 text-[13.5px] font-semibold text-ink-muted hover:text-ink bg-surface border border-input-line rounded-lg transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-gold-700"
            >
              <X className="size-4" />
              <span>Limpiar filtros</span>
            </button>
          )}

          <span className="col-span-2 inline-flex w-fit items-center px-3 py-1 rounded-full bg-gold-100 text-gold-900 text-[13px] font-bold tabular-nums border border-gold-300/60 sm:ml-1">
            {total} prospectos
          </span>
        </div>
      </div>

      <div className={leadSeleccionado ? "split-view inspector-open" : "split-view"}>
        <div className="table-wrap min-w-0 overflow-x-auto" style={{ minWidth: 0, overflowX: "auto" }} tabIndex={0} aria-label="Tabla de leads con desplazamiento horizontal">
          {leads.length > 0 && (
            <ul aria-label="Leads en tarjetas" className="grid list-none gap-3 p-3 m-0 xl:hidden">
              {leads.map((lead) => {
                // Tarjeta compacta: identidad + estado arriba, dos datos clave y
                // acciones de contacto abajo. El detalle completo vive en la ficha.
                const celda = (clave: string) => columnasTabla.find((columna) => columna.clave === clave)?.celda?.(lead);
                return (
                <li key={lead.id} className={`min-w-0 rounded-xl border bg-surface p-3 shadow-xs ${leadSeleccionado?.id === lead.id ? "border-gold-600" : "border-line"}`}>
                  <div className="flex items-start gap-3">
                    <span className="mt-1 shrink-0"><Avatar name={lead.contactName} small /></span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <a href={`/leads/${lead.id}`} className="flex min-h-12 min-w-0 items-center text-[15px] font-bold leading-tight break-words text-ink">{lead.contactName}</a>
                        <dl className="m-0 mt-2.5 shrink-0"><dt className="sr-only">Estado</dt><dd className="m-0">{celda("estado")}</dd></dl>
                      </div>
                      <p className="m-0 truncate text-[13px] text-ink-muted">
                        {lead.projectName ?? lead.projectInterestText ?? lead.zoneInterest ?? "Por definir"}
                        <span aria-hidden="true"> · </span>
                        {lead.contactPhoneDisplay ?? lead.contactPhone ?? "Sin teléfono"}
                      </p>
                    </div>
                  </div>
                  <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 border-t border-line/70 pt-2 text-[13px]">
                    <div className="min-w-0"><dt className="text-[13px] text-ink-muted">Presupuesto</dt><dd className="m-0 truncate font-semibold tabular-nums text-ink">{formatoPresupuesto(lead)}</dd></div>
                    <div className="min-w-0"><dt className="text-[13px] text-ink-muted">Responsable</dt><dd className="m-0 truncate [&_*]:max-w-full [&_*]:truncate">{celda("responsable")}</dd></div>
                  </dl>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-ink-muted">
                      {celda("origen")}
                      <span className="truncate">{leadWaitingLabel(lead, ahora)}</span>
                    </div>
                    <div className="shrink-0 [&_a]:!size-12 [&_a]:!min-h-12 [&_a]:!min-w-12">{celda("acciones")}</div>
                  </div>
                </li>
                );
              })}
            </ul>
          )}
          <div className={leads.length > 0 ? "hidden xl:block" : ""}>
          <DataTable
            filas={leads}
            columnas={columnasTabla}
            idDe={(lead) => String(lead.id)}
            activa={leadSeleccionado ? String(leadSeleccionado.id) : null}
            onAbrir={(lead) => irCon({ lead: String(lead.id) })}
            porPagina={tamanioPagina}
            etiqueta="Listado de leads patrimoniales"
            vacio={{
              titulo: hayFiltro ? "Sin resultados para esta búsqueda" : "Sin leads todavía",
              cuerpo: hayFiltro
                ? "Prueba cambiando o limpiando los filtros actuales."
                : "Registra el primer prospecto con “Registrar lead” o espera a que ingrese por los canales de captación.",
            }}
          />
          </div>
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
        {leadSeleccionado && (
          <LeadInspector
            lead={leadSeleccionado}
            brokers={brokers}
            historial={historial}
            actorId={actorId}
            roleSlug={roleSlug}
            canAssign={canAssign}
            onClose={() => irCon({ lead: undefined })}
          />
        )}
      </div>
      {creando && <FormularioLead canales={canales} proyectos={proyectos} onClose={() => setCreando(false)} />}
      {creandoPorVoz && (
        <NotaDeVozLeadModal
          canales={canales}
          onClose={() => {
            setCreandoPorVoz(false);
            if (searchParams.get("voz")) {
              irCon({ voz: undefined });
            }
          }}
        />
      )}
    </div>
  );
}

/**
 * Alta manual con control de duplicados (decisión #19).
 */
function FormularioLead({ canales, proyectos, onClose }: { canales: Canal[]; proyectos: { id: number; name: string; zone: string | null }[]; onClose: () => void }) {
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
      const validacion = CrearLeadInput.safeParse(datos);
      if (!validacion.success) {
        setErrores(erroresDeCampos(validacion.error));
        return;
      }
      const entrada = validacion.data;
      const respuesta = await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ fullName: entrada.fullName, phone: entrada.phone, email: entrada.email, sourceId: entrada.sourceId, projectId: entrada.projectId, projectInterestText: entrada.projectInterestText, zoneInterest: entrada.zoneInterest, operationType: entrada.operationType, crear_igual: crearIgual }),
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
            Registrar lead patrimonial
          </h2>
          <button className="icon-button min-h-12 min-w-12 size-12" onClick={onClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>
        <form noValidate className="form-grid p-6" ref={formRef} onSubmit={alEnviar} aria-busy={enviando}>
          {errorRed && (
            <AlertaErrorFormulario
              mensaje={errorRed}
              esErrorRed={true}
              onReintentar={() => void enviar(false)}
              reintentando={enviando}
            />
          )}
          <label className="span-2 text-[13.5px] font-semibold text-ink">
            Nombre completo (obligatorio)
            <input
              name="fullName"
              required
              aria-required="true"
              aria-invalid={Boolean(errores.fullName)}
              aria-describedby={errores.fullName ? "lead-error-nombre" : undefined}
              autoFocus
              className="min-h-12 text-[13.5px] px-3.5 border border-input-line rounded-lg focus-visible:outline-2 focus-visible:outline-gold-700"
            />
            {errores.fullName && <small id="lead-error-nombre" role="alert" className="text-[13px] text-danger">{errores.fullName}</small>}
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
              aria-describedby={errores.email ? "leads-error-correo" : undefined}
              placeholder="cliente@ejemplo.com"
              className="min-h-12 text-[13.5px] px-3.5 border border-input-line rounded-lg focus-visible:outline-2 focus-visible:outline-gold-700"
            />
            {errores.email && <small id="leads-error-correo" role="alert" className="text-[13px] text-danger">{errores.email}</small>}
          </label>
          <label className="text-[13.5px] font-semibold text-ink">
            Proyecto de interés
            <select name="projectId" defaultValue="" className="min-h-12 w-full rounded-lg border border-input-line px-3.5 text-[13.5px]">
              <option value="">Sin especificar</option>
              {proyectos.map(proyecto => <option key={proyecto.id} value={proyecto.id}>{proyecto.name}</option>)}
            </select>
            {proyectos.length === 0 && <small>No hay proyectos disponibles para tu usuario.</small>}
          </label>
          <label className="text-[13.5px] font-semibold text-ink">
            Zona de interés
            <select name="zoneInterest" defaultValue="" className="min-h-12 w-full rounded-lg border border-input-line px-3.5 text-[13.5px]">
              <option value="">Sin especificar</option>
              {[...new Set(proyectos.map(proyecto => proyecto.zone).filter((zone): zone is string => Boolean(zone)))].map(zone => <option key={zone} value={zone}>{zone}</option>)}
            </select>
          </label>
          <label className="text-[13.5px] font-semibold text-ink">
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
          <label className="text-[13.5px] font-semibold text-ink">
            Operación
            <select
              name="operationType"
              defaultValue=""
              className="min-h-12 text-[13.5px] px-3.5 border border-input-line rounded-lg focus-visible:outline-2 focus-visible:outline-gold-700 cursor-pointer"
            >
              <option value="">Sin especificar</option>
              <option value="sale">Venta</option>
              <option value="rent">Alquiler</option>
            </select>
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
                aria-busy={enviando}
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
              aria-busy={enviando}
            >
              {enviando ? "Registrando…" : "Registrar lead"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
