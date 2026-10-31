"use client";
import { useState } from "react";
import Link from "next/link";
import { CheckSquare, Search } from "lucide-react";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useOnline } from "../_ui/analytics-state";
import { PageHeader } from "@/components/modulo";
import { APPROVAL_EXAMPLES, APPROVAL_KINDS, type Approval } from "./_ejemplo";

export function ApprovalsPreview() {
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Approval | null>(null);
  const [action, setAction] = useState<string | null>(null);
  const online = useOnline();
  const rows = APPROVAL_EXAMPLES.filter(row => (filter === "all" || row.kind === filter) && (row.title + row.detail).toLowerCase().includes(query.toLowerCase()));
  return <div className="private-approvals min-w-0 space-y-4">
    <PageHeader title="Centro de aprobaciones" description="Cada decisión, con su contexto y responsable." actions={<Link href="/inicio" className="button private-action w-full text-center sm:w-auto">Volver al inicio</Link>} />
    <div role="note" className="private-preview"><CheckSquare className="size-5 shrink-0" /><p className="m-0"><strong>Vista previa · datos de ejemplo</strong><br />Falta: bandeja unificada persistida, políticas de aprobación, decisiones y auditoría. Ninguna acción de esta vista modifica negocios ni autoriza pagos.</p></div>
    <div className="private-panel min-w-0 p-3 sm:p-4"><label className="grid min-w-0 gap-1.5 text-sm font-semibold"><span>Buscar solicitud</span><span className="relative flex min-w-0 items-center"><Search className="pointer-events-none absolute left-3 size-4 text-ink-muted" aria-hidden="true" /><input type="search" className="min-w-0 w-full pl-10" value={query} onChange={event => setQuery(event.target.value)} placeholder="Descuento, hold, liquidación…" /></span></label>
      <nav aria-label="Tipos de aprobación" className="mt-3 flex gap-2 overflow-x-auto overscroll-x-contain pb-1 [&>button]:shrink-0 [&>button]:whitespace-nowrap"><button type="button" className="private-filter" aria-pressed={filter === "all"} onClick={() => setFilter("all")}>Todas</button>{APPROVAL_KINDS.map(kind => <button type="button" className="private-filter" aria-pressed={filter === kind.id} key={kind.id} onClick={() => setFilter(kind.id)}>{kind.label}</button>)}</nav>
    </div>
    {!online ? <div className="private-panel p-8" role="status"><h2>Sin conexión</h2><p>Las decisiones requieren conexión y confirmación del servidor. No se encolan aprobaciones.</p></div>
      : rows.length === 0 ? <div className="private-panel p-8 text-center"><h2>Sin coincidencias</h2><p>Prueba con otro texto o tipo de solicitud.</p><button className="button private-action" onClick={() => {setQuery(""); setFilter("all");}}>Limpiar filtros</button></div>
      : <section aria-label="Solicitudes de ejemplo" className="private-panel min-w-0 divide-y divide-line"><div className="flex flex-wrap items-center justify-between gap-2 bg-surface-alt px-4 py-3"><h2 className="m-0 text-sm font-semibold text-ink">Solicitudes de ejemplo</h2><span className="text-[13px] tabular-nums text-ink-muted">{rows.length} {rows.length === 1 ? "solicitud" : "solicitudes"}</span></div>{rows.map(row => <article key={row.id} className="grid min-w-0 gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-4"><div className="min-w-0"><div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-ink-muted"><span>{row.id}</span><span className="rounded-md border border-line bg-surface-alt px-2 py-0.5 text-ink">{APPROVAL_KINDS.find(kind => kind.id === row.kind)?.label}</span><span>{row.date}</span></div><h3 className="m-0 mt-2 break-words text-base font-semibold text-navy-950">{row.title}</h3><p className="m-0 mt-1 break-words text-sm text-ink-muted">{row.owner}</p></div><button className="button private-action w-full sm:w-auto" onClick={() => {setSelected(row); setAction(null);}}>Revisar solicitud</button></article>)}</section>}
    <Dialog open={Boolean(selected)} onOpenChange={open => {if(!open) setSelected(null);}}><DialogContent showCloseButton={false} className="top-0 left-0 h-dvh max-h-dvh w-full max-w-none translate-x-0 translate-y-0 overflow-y-auto rounded-none p-4 sm:top-[50%] sm:left-[50%] sm:h-auto sm:max-h-[90dvh] sm:max-w-lg sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-lg sm:p-6"><DialogHeader className="flex-row items-start justify-between gap-3 text-left"><div className="min-w-0"><DialogTitle>{selected?.title}</DialogTitle><DialogDescription>Solicitud de ejemplo · no es una operación real.</DialogDescription></div><DialogClose className="button private-action shrink-0">Cerrar</DialogClose></DialogHeader><p>{selected?.detail}</p><p className="text-sm text-ink-muted">Antes de decidir se deben consultar el expediente, la política y el historial de cambios en servidor.</p><div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap"><button className="button private-action w-full sm:w-auto" onClick={() => setAction("aprobar")}>Aprobar · vista previa</button><button className="button private-action w-full sm:w-auto" onClick={() => setAction("rechazar")}>Rechazar · vista previa</button></div>{action && <p role="status" className="private-preview">No se puede {action} esta solicitud de ejemplo: falta el servicio de decisiones y auditoría. No se guardó ningún cambio.</p>}</DialogContent></Dialog>
  </div>;
}
