"use client";
import { useState } from "react";
import type { ReportesBiData } from "@/application/reportes/puertos";
import { resumenCalidad } from "@/application/reportes/automatizaciones";
import { generarCsv } from "@/domain/csv";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useOnline } from "../_ui/analytics-state";

const CAMPO = "min-h-12 rounded-lg border border-line bg-surface px-3 text-sm";
const COLUMNAS = ["leads", "deals", "won", "revenueCents", "spendCents"] as const;
const ETIQUETAS = { leads: "Leads", deals: "Negocios", won: "Cierres", revenueCents: "Volumen USD", spendCents: "Inversión USD" };
export function OperacionesReportes({ metricas, canExport }: { metricas: ReportesBiData; canExport: boolean }) {
  const online = useOnline();
  const [canal, setCanal] = useState("");
  const [columnas, setColumnas] = useState<readonly typeof COLUMNAS[number][]>(COLUMNAS);
  const [modal, setModal] = useState<"programar" | "constructor" | "conciliar" | null>(null);
  const [aviso, setAviso] = useState("");
  const filas = metricas.sources.filter((s) => !canal || String(s.sourceId) === canal);
  const dinero = (v: number) => new Intl.NumberFormat("es-DO", { style: "currency", currency: "USD" }).format(v / 100);
  function exportar() {
    const csv = generarCsv(["Canal", ...columnas.map((c) => ETIQUETAS[c])], filas.map((f) => [f.source, ...columnas.map((c) => { const clave = c === "leads" ? "count" : c; const v = f[clave]; return v === null ? "No medido" : c.endsWith("Cents") ? v / 100 : v; })]));
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })); const a = document.createElement("a"); a.href = url; a.download = "reportes-canales-usd.csv"; a.click(); URL.revokeObjectURL(url); setAviso("CSV exportado con las filas y columnas visibles.");
  }
  return <details className="my-4 rounded-xl border border-line bg-surface p-4 text-sm"><summary className="min-h-12 cursor-pointer py-3 font-bold">Reportes avanzados, calidad y programación</summary>
    <div className="grid min-w-0 gap-4">
      {aviso && <p role="status">{aviso}</p>}
      {!online && <p role="status">Sin conexión. Puedes consultar los datos cargados; las acciones están en pausa.</p>}
      <section className="grid gap-3"><h2 className="font-bold">Análisis por canal</h2><p>Este filtro se aplica sólo a esta tabla. Los filtros de proyecto, broker y periodo del informe ya se aplicaron en servidor. Los importes disponibles en este contrato son USD; no hay conversión a DOP.</p>
        <label>Canal <select className={CAMPO} value={canal} onChange={(e) => setCanal(e.target.value)}><option value="">Todos los canales disponibles</option>{metricas.sources.map((s) => <option key={String(s.sourceId)} value={String(s.sourceId)}>{s.source}</option>)}</select></label>
        <fieldset className="flex flex-wrap gap-3"><legend>Columnas visibles</legend>{COLUMNAS.map((c) => <label key={c} className="flex min-h-12 items-center gap-2"><input type="checkbox" checked={columnas.includes(c)} onChange={(e) => setColumnas(e.target.checked ? COLUMNAS.filter((x) => columnas.includes(x) || x === c) : columnas.filter((x) => x !== c))} />{ETIQUETAS[c]}</label>)}</fieldset>
        {filas.length === 0 ? <p>No hay canales que coincidan.</p> : <div className="max-w-full overflow-x-auto" tabIndex={0} role="region" aria-label="Canales y columnas elegidas"><table className="w-full border-collapse text-left"><thead><tr><th className="p-3">Canal</th>{columnas.map((c) => <th className="p-3" key={c}>{ETIQUETAS[c]}</th>)}</tr></thead><tbody>{filas.map((f) => <tr key={String(f.sourceId)}><th className="p-3">{f.source}</th>{columnas.map((c) => { const v = f[c === "leads" ? "count" : c]; return <td className="p-3 tabular-nums" key={c}>{v === null ? "No medido" : c.endsWith("Cents") ? dinero(v) : v}</td>; })}</tr>)}</tbody></table></div>}
        <button type="button" className={CAMPO} disabled={!canExport || !online || !filas.length} onClick={exportar}>Exportar tabla visible CSV</button>{!canExport && <p>Tu permiso de reportes no permite exportar.</p>}
      </section>
      <section><h2 className="font-bold">Calidad de datos</h2><dl>{resumenCalidad(metricas.projection.missingAmountCount, metricas.projection.missingProbabilityCount).map((r) => <div key={r.nombre} className="flex flex-wrap justify-between gap-2 border-b border-line py-3"><dt>{r.nombre}</dt><dd className="font-bold tabular-nums">{r.valor === null ? "Sin medición disponible" : r.valor}</dd></div>)}</dl><p>Las mediciones disponibles usan la cohorte de la proyección; no equivalen a un análisis completo de duplicados o campos vacíos.</p></section>
      <section><h2 className="font-bold">Finanzas y conciliación</h2><p>Las comisiones de la pestaña financiera son reales en USD. Conciliación bancaria, pagos contra reservas y diferencias de caja requieren el contrato financiero; no se presentan como saldo cero.</p><button className={CAMPO} type="button" disabled={!online || !canExport} onClick={() => setModal("conciliar")}>Preparar revisión de conciliación</button></section>
      <section><h2 className="font-bold">Informes programados y constructor</h2><p>Vista previa · falta: informes persistentes, scheduler, destinatarios autorizados y entrega auditable. Cohortes por mes y tiempos por cada etapa requieren agregados adicionales; no se inventan porcentajes de absorción.</p><div className="flex flex-wrap gap-2"><button type="button" className={CAMPO} disabled={!online || !canExport} onClick={() => setModal("programar")}>Programar informe</button><button type="button" className={CAMPO} disabled={!online || !canExport} onClick={() => setModal("constructor")}>Diseñar informe</button><a className={CAMPO + " inline-flex items-center"} href="/automatizaciones">Abrir automatizaciones y copiloto</a></div></section>
    </div>
    <Dialog open={modal !== null} onOpenChange={(open) => { if (!open) setModal(null); }}><DialogContent><DialogHeader><DialogTitle>{modal === "programar" ? "Programación de informe" : modal === "constructor" ? "Constructor de informe" : "Revisión de conciliación"}</DialogTitle><DialogDescription>Vista previa sin persistencia ni envío. Usa datos de ejemplo para definir el contrato pendiente.</DialogDescription></DialogHeader><form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); setAviso("Solicitud preparada sólo en esta vista. No se guardó, programó ni envió: falta el backend de informes y conciliación."); setModal(null); }}><label>Nombre <input className={CAMPO + " w-full"} required maxLength={100} /></label><label>Frecuencia <select className={CAMPO + " w-full"}><option>Una vez</option><option>Semanal</option><option>Mensual</option></select></label><label>Formato <select className={CAMPO + " w-full"}><option>CSV</option><option>PDF</option></select></label><label>Moneda del futuro contrato <select className={CAMPO + " w-full"}><option>USD</option><option>DOP (no ejecutable actualmente)</option></select></label><label>Destinatario de ejemplo <input type="email" className={CAMPO + " w-full"} required placeholder="ejemplo@dominio.test" /></label><button className={CAMPO} disabled={!online || !canExport}>Revisar disponibilidad del servicio</button><button className={CAMPO} type="button" onClick={() => setModal(null)}>Cancelar</button></form></DialogContent></Dialog>
  </details>;
}
