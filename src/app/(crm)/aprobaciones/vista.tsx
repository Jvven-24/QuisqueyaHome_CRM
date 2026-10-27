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
  return <div className="private-approvals space-y-5">
    <PageHeader title="Centro de aprobaciones" description="Cada decisión, con su contexto y responsable." actions={<Link href="/inicio" className="button private-action w-full text-center sm:w-auto">Volver al inicio</Link>} />
    <div role="note" className="private-preview"><CheckSquare className="size-5 shrink-0" /><p className="m-0"><strong>Vista previa · datos de ejemplo</strong><br />Falta: bandeja unificada persistida, políticas de aprobación, decisiones y auditoría. Ninguna acción de esta vista modifica negocios ni autoriza pagos.</p></div>
    <div className="private-panel p-4"><label className="block min-w-0"><span className="block text-sm font-semibold mb-1">Buscar solicitud</span><span className="flex items-center gap-2"><Search className="size-4 shrink-0" /><input className="min-w-0 w-full" value={query} onChange={event => setQuery(event.target.value)} placeholder="Descuento, hold, liquidación…" /></span></label>
      <nav aria-label="Tipos de aprobación" className="flex flex-wrap gap-2 mt-4"><button type="button" className="private-filter" aria-pressed={filter === "all"} onClick={() => setFilter("all")}>Todas</button>{APPROVAL_KINDS.map(kind => <button type="button" className="private-filter" aria-pressed={filter === kind.id} key={kind.id} onClick={() => setFilter(kind.id)}>{kind.label}</button>)}</nav>
    </div>
    {!online ? <div className="private-panel p-8" role="status"><h2>Sin conexión</h2><p>Las decisiones requieren conexión y confirmación del servidor. No se encolan aprobaciones.</p></div>
      : rows.length === 0 ? <div className="private-panel p-8 text-center"><h2>Sin coincidencias</h2><p>Prueba con otro texto o tipo de solicitud.</p><button className="button private-action" onClick={() => {setQuery(""); setFilter("all");}}>Limpiar filtros</button></div>
      : <section aria-label="Solicitudes de ejemplo" className="private-panel divide-y divide-line">{rows.map(row => <article key={row.id} className="p-4 sm:p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><span className="text-sm text-ink-muted">{row.id} · {row.date}</span><h2 className="text-lg font-semibold m-0 mt-1">{row.title}</h2><p className="text-sm text-ink-muted m-0 mt-1">{row.owner}</p></div><button className="button private-action w-full sm:w-auto" onClick={() => {setSelected(row); setAction(null);}}>Revisar solicitud</button></article>)}</section>}
    <Dialog open={Boolean(selected)} onOpenChange={open => {if(!open) setSelected(null);}}><DialogContent showCloseButton={false} className="top-0 left-0 h-dvh max-h-dvh w-full max-w-none translate-x-0 translate-y-0 overflow-y-auto rounded-none p-4 sm:top-[50%] sm:left-[50%] sm:h-auto sm:max-h-[90dvh] sm:max-w-lg sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-lg sm:p-6"><DialogHeader className="flex-row items-start justify-between gap-3 text-left"><div className="min-w-0"><DialogTitle>{selected?.title}</DialogTitle><DialogDescription>Solicitud de ejemplo · no es una operación real.</DialogDescription></div><DialogClose className="button private-action shrink-0">Cerrar</DialogClose></DialogHeader><p>{selected?.detail}</p><p className="text-sm text-ink-muted">Antes de decidir se deben consultar el expediente, la política y el historial de cambios en servidor.</p><div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap"><button className="button private-action w-full sm:w-auto" onClick={() => setAction("aprobar")}>Aprobar · vista previa</button><button className="button private-action w-full sm:w-auto" onClick={() => setAction("rechazar")}>Rechazar · vista previa</button></div>{action && <p role="status" className="private-preview">No se puede {action} esta solicitud de ejemplo: falta el servicio de decisiones y auditoría. No se guardó ningún cambio.</p>}</DialogContent></Dialog>
  </div>;
}
