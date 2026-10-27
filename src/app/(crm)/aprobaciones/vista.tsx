"use client";
import { useState } from "react";
import Link from "next/link";
import { CheckSquare, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useOnline } from "../_ui/analytics-state";
import { mostrarDemo } from "@/lib/flags";
import { PageHeader } from "@/components/modulo";
import { APPROVAL_EXAMPLES, APPROVAL_KINDS, APPROVAL_STATES, type Approval, type ApprovalState } from "./_ejemplo";

export function ApprovalsPreview() {
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [state, setState] = useState<ApprovalState>("data");
  const [selected, setSelected] = useState<Approval | null>(null);
  const [action, setAction] = useState<string | null>(null);
  const online = useOnline();
  const current = !online ? "offline" : state;
  const rows = APPROVAL_EXAMPLES.filter(row => (filter === "all" || row.kind === filter) && (row.title + row.detail).toLowerCase().includes(query.toLowerCase()));
  return <div className="private-approvals space-y-5">
    <PageHeader title="Centro de aprobaciones" description="Cada decisión, con su contexto y responsable." actions={<Link href="/inicio" className="button min-h-11">Volver al inicio</Link>} />
    <div role="note" className="private-preview"><CheckSquare className="size-5 shrink-0" /><p className="m-0"><strong>Vista previa · datos de ejemplo</strong><br />Falta: bandeja unificada persistida, políticas de aprobación, decisiones y auditoría. Ninguna acción de esta vista modifica negocios ni autoriza pagos.</p></div>
    <div className="private-panel p-4"><div className="flex flex-wrap items-end gap-3"><label className="flex-1 min-w-0"><span className="block text-sm font-semibold mb-1">Buscar solicitud</span><span className="flex items-center gap-2"><Search className="size-4 shrink-0" /><input className="min-w-0 w-full" value={query} onChange={event => setQuery(event.target.value)} placeholder="Descuento, hold, liquidación…" /></span></label>{mostrarDemo() && <label><span className="block text-sm font-semibold mb-1">Estado de demostración</span><select value={state} onChange={event => setState(event.target.value as ApprovalState)}>{APPROVAL_STATES.map(item => <option value={item.id} key={item.id}>{item.label}</option>)}</select></label>}</div>
      <nav aria-label="Tipos de aprobación" className="flex flex-wrap gap-2 mt-4"><button type="button" className="private-filter" aria-pressed={filter === "all"} onClick={() => setFilter("all")}>Todas</button>{APPROVAL_KINDS.map(kind => <button type="button" className="private-filter" aria-pressed={filter === kind.id} key={kind.id} onClick={() => setFilter(kind.id)}>{kind.label}</button>)}</nav>
    </div>
    {current === "loading" ? <div className="private-panel p-8" role="status" aria-busy="true"><p>Cargando solicitudes de ejemplo…</p><button className="button" onClick={() => setState("data")}>Terminar demostración de carga</button></div>
      : current === "error" ? <div className="private-panel p-8" role="alert"><h2>No se pudo cargar la bandeja de ejemplo</h2><p>Este es un error de demostración; tus datos no han cambiado.</p><button className="button" onClick={() => setState("data")}>Reintentar</button></div>
      : current === "offline" ? <div className="private-panel p-8" role="status"><h2>Sin conexión</h2><p>Las decisiones requieren conexión y confirmación del servidor. No se encolan aprobaciones.</p>{online && <button className="button" onClick={() => setState("data")}>Restablecer demostración</button>}</div>
      : current === "permission" ? <div className="private-panel p-8" role="note"><h2>Permiso insuficiente · demostración</h2><p>Consultar la bandeja no concede permiso para aprobar. El servidor deberá comprobar la política de cada solicitud.</p><button className="button" onClick={() => setState("data")}>Volver a los ejemplos</button></div>
      : current === "empty" || rows.length === 0 ? <div className="private-panel p-8 text-center"><h2>{rows.length === 0 ? "Sin coincidencias" : "No hay solicitudes pendientes"}</h2><p>{rows.length === 0 ? "Prueba con otro texto o tipo de solicitud." : "Este estado vacío es una demostración."}</p><button className="button" onClick={() => {setQuery(""); setFilter("all"); setState("data");}}>Restablecer vista</button></div>
      : <section aria-label="Solicitudes de ejemplo" className="private-panel divide-y divide-line">{rows.map(row => <article key={row.id} className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3"><div className="min-w-0"><span className="text-sm text-ink-muted">{row.id} · {row.date}</span><h2 className="text-lg font-semibold m-0 mt-1">{row.title}</h2><p className="text-sm text-ink-muted m-0 mt-1">{row.owner}</p></div><button className="button" onClick={() => {setSelected(row); setAction(null);}}>Revisar solicitud</button></article>)}</section>}
    <Dialog open={Boolean(selected)} onOpenChange={open => {if(!open) setSelected(null);}}><DialogContent><DialogHeader><DialogTitle>{selected?.title}</DialogTitle><DialogDescription>Solicitud de ejemplo · no es una operación real.</DialogDescription></DialogHeader><p>{selected?.detail}</p><p className="text-sm text-ink-muted">Antes de decidir se deben consultar el expediente, la política y el historial de cambios en servidor.</p><div className="flex flex-wrap gap-2"><button className="button" onClick={() => setAction("aprobar")}>Aprobar · vista previa</button><button className="button" onClick={() => setAction("rechazar")}>Rechazar · vista previa</button></div>{action && <p role="status" className="private-preview">No se puede {action} esta solicitud de ejemplo: falta el servicio de decisiones y auditoría. No se guardó ningún cambio.</p>}</DialogContent></Dialog>
  </div>;
}
