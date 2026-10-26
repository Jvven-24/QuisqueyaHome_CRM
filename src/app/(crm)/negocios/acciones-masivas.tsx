"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { Etapa, NegocioFila } from "./logica";
import { planificarLote } from "./lote";
const CAMPO = "min-h-12 rounded-lg border border-line bg-surface px-3 text-sm";
export function AccionesMasivas({ filas, etapas, puedeEditar, sinConexion, ocupado }: { filas: NegocioFila[]; etapas: Etapa[]; puedeEditar: boolean; sinConexion: boolean; ocupado: boolean }) {
  const [abierto, setAbierto] = useState(false);
  const [snapshot, setSnapshot] = useState<NegocioFila[]>([]);
  const [accion, setAccion] = useState("etapa");
  const [etapa, setEtapa] = useState("");
  const [detalle, setDetalle] = useState("");
  const [resultado, setResultado] = useState<ReturnType<typeof planificarLote> | null>(null);
  return <><button type="button" className={CAMPO} disabled={!filas.length || !puedeEditar || sinConexion || ocupado} onClick={() => { setSnapshot([...filas]); setResultado(null); setEtapa(""); setDetalle(""); setAbierto(true); }}>Preparar acciones masivas ({filas.length})</button>
    {!puedeEditar && <p>Tu rol no puede preparar cambios masivos.</p>}{sinConexion && <p>Sin conexión: las acciones masivas están en pausa.</p>}
    <Dialog open={abierto} onOpenChange={setAbierto}><DialogContent className="max-h-[90dvh] overflow-y-auto"><DialogHeader><DialogTitle>{resultado ? "Resultado de revisión del lote" : "Plan de acciones masivas"}</DialogTitle><DialogDescription>Vista previa sin mutaciones: falta un endpoint transaccional de lotes con autorización por negocio y resultados auditables.</DialogDescription></DialogHeader>
      {resultado ? <div className="grid gap-3"><p role="status">0 cambios enviados. No se cambió ningún negocio, responsable ni actividad.</p><ul className="space-y-3">{resultado.map((r) => <li key={r.id} className="rounded-lg border border-line p-3"><strong>{r.contacto}</strong><p>{r.motivo}</p></li>)}</ul><button className={CAMPO} type="button" onClick={() => setResultado(null)}>Volver al plan</button><button className={CAMPO} type="button" onClick={() => setAbierto(false)}>Cerrar revisión</button></div> : <form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); setResultado(planificarLote(snapshot, { accion, stageId: Number(etapa) || null, puedeEditar, detalle })); }}>
        <p>Se revisan {snapshot.length} negocios seleccionados de la página visible. Los cerrados se omiten. No se procesan registros de otras páginas.</p>
        <label>Acción <select className={CAMPO + " w-full"} value={accion} onChange={(e) => setAccion(e.target.value)}><option value="etapa">Mover a una etapa abierta</option><option value="responsable">Preparar reasignación</option><option value="tarea">Preparar próxima tarea</option></select></label>
        {accion === "etapa" && <label>Etapa de destino <select className={CAMPO + " w-full"} required value={etapa} onChange={(e) => setEtapa(e.target.value)}><option value="">Elegir etapa</option>{etapas.filter((e) => e.kind === "open").map((e) => <option value={e.id} key={e.id}>{e.name}</option>)}</select></label>}
        <label>{accion === "responsable" ? "Responsable propuesto y motivo" : accion === "tarea" ? "Título, plazo y responsable de la tarea" : "Motivo del movimiento"}<textarea className="w-full rounded-lg border border-line p-3" maxLength={1000} required value={detalle} onChange={(e) => setDetalle(e.target.value)} /></label>
        <ol className="space-y-2">{snapshot.map((n) => <li key={n.id}>{n.contactName} · {etapas.find((e) => e.id === n.stageId)?.name ?? "Etapa desconocida"} · {n.stageKind === "open" ? "Abierto" : "Cerrado, se omitirá"}</li>)}</ol>
        <p>Cierre y pérdida conservan sus diálogos individuales y requisitos M40. Este plan no los evita.</p>
        <button className={CAMPO} disabled={!puedeEditar || sinConexion || ocupado}>Revisar resultado por negocio</button><button className={CAMPO} type="button" onClick={() => setAbierto(false)}>Cancelar plan</button>
      </form>}
    </DialogContent></Dialog>
  </>;
}
