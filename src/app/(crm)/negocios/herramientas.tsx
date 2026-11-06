"use client";
import { Checkbox } from "@/components/ui/checkbox";
import { useEffect, useState } from "react";
import { Bookmark, ChevronDown, Filter, ListChecks } from "lucide-react";
import type { Etapa, NegocioFila } from "./logica";
import { CAMPOS_TARJETA, COLUMNAS_LISTA, ETIQUETA_CAMPO, ETIQUETA_COLUMNA, desplazarColumna, alternarEtapa, type Preferencias } from "./preferencias";
import { guardarVista, leerVistas, VISTAS_SISTEMA, type VistaGuardada } from "./vistas-guardadas";
import { AccionesMasivas } from "./acciones-masivas";
import { filasACsv } from "./filtros-cliente";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export function HerramientasNegocios({ filas, etapas, preferencias, onPreferencias, consulta, onNavegar, puedeEditar, puedeExportar, sinConexion, ocupado, esMovil = false }: {
  filas: NegocioFila[]; etapas: Etapa[]; preferencias: Preferencias; onPreferencias: (p: Preferencias) => void;
  consulta: string; onNavegar: (q: string) => void; puedeEditar: boolean; puedeExportar: boolean; sinConexion: boolean; ocupado: boolean; esMovil?: boolean;
}) {
  const [vistas, setVistas] = useState<VistaGuardada[]>([]);
  const [nombre, setNombre] = useState("");
  const [aviso, setAviso] = useState("");
  const [seleccion, setSeleccion] = useState<number[]>([]);
  useEffect(() => { try { setVistas(leerVistas(localStorage.getItem("negocios-vistas"))); } catch { setAviso("El navegador no permite guardar vistas."); } }, []);
  const campo = "min-h-12 rounded-lg border border-line bg-surface px-3 text-sm";
  function guardar() {
    const r = guardarVista(nombre, consulta, vistas, "u-" + crypto.randomUUID());
    if (!r.ok) { setAviso(r.error); return; }
    try { localStorage.setItem("negocios-vistas", JSON.stringify(r.vistas)); setVistas(r.vistas); setNombre(""); setAviso("Vista guardada en este navegador. No se comparte entre usuarios."); }
    catch { setAviso("No se pudo guardar la vista en este navegador."); }
  }
  function exportar() {
    if (!puedeExportar || sinConexion || ocupado) return;
    const elegidas = filas.filter((f) => seleccion.includes(f.id));
    const url = URL.createObjectURL(new Blob(["\ufeff" + filasACsv(elegidas, (id) => etapas.find((e) => e.id === id)?.name ?? "")], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = "negocios.csv"; a.click(); URL.revokeObjectURL(url);
    setAviso("Exportados " + elegidas.length + " negocios visibles seleccionados.");
  }
  const query = new URLSearchParams(consulta);
  const avanzados = [
    query.get("origen") ? "Origen: " + query.get("origen") : null,
    query.get("diasMin") ? "Desde " + query.get("diasMin") + " días en etapa" : null,
    query.get("probMin") ? "Probabilidad desde " + query.get("probMin") + "%" : null,
    query.get("sinAccion") === "1" ? "Sin próxima acción" : null,
  ].filter(Boolean);
  const visiblesSeleccionados = filas.filter((fila) => seleccion.includes(fila.id));
  const panel = "group min-w-0 rounded-xl border border-line bg-surface data-[state=open]:lg:col-span-3";
  const trigger = "flex min-h-12 w-full items-center gap-2 px-3 py-2 text-left text-[13px] font-semibold text-navy-900";
  const flecha = <ChevronDown className="ml-auto size-4 shrink-0 text-ink-muted transition-transform duration-150 group-data-[state=open]:rotate-180 motion-reduce:transition-none" aria-hidden="true" />;
  return <details open={esMovil ? undefined : true} className={esMovil ? "min-w-0 rounded-xl border border-line bg-surface" : "min-w-0"}>
    <summary className={esMovil ? "min-h-12 cursor-pointer px-3 py-3 text-[13px] font-semibold text-navy-900" : "hidden"}>Opciones de vista</summary>
    <div className={`grid min-w-0 gap-2 lg:grid-cols-3 ${esMovil ? "border-t border-line p-2" : ""}`} aria-label="Herramientas de la vista">
    {aviso && <p role="status" className="m-0 rounded-lg border border-line bg-surface-alt p-3 text-sm lg:col-span-3">{aviso}</p>}
    <Collapsible className={panel}>
      <CollapsibleTrigger className={trigger}><Bookmark className="size-4 shrink-0" aria-hidden="true" /><span>Vistas y presentación</span>{flecha}</CollapsibleTrigger>
      <CollapsibleContent>
        <div className="grid min-w-0 gap-5 border-t border-line p-3 sm:p-4">
          <section className="grid min-w-0 gap-3 sm:grid-cols-2" aria-label="Vistas de este navegador">
            <label className="min-w-0 text-[13px]">Vista guardada<select aria-label="Vista guardada" className={campo} value="" disabled={ocupado} onChange={(e) => { const v = [...VISTAS_SISTEMA, ...vistas].find((v) => v.id === e.target.value); if (v) onNavegar(v.consulta); }}><option value="">Elegir vista</option>{[...VISTAS_SISTEMA, ...vistas].map((v) => <option key={v.id} value={v.id}>{v.nombre}</option>)}</select></label>
            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-end gap-2"><label className="min-w-0 text-[13px]">Guardar vista actual<input className={campo + " min-w-0 w-full"} maxLength={60} placeholder="Nombre de la vista" value={nombre} onChange={(e) => setNombre(e.target.value)} /></label><button className={campo} type="button" onClick={guardar}>Guardar</button></div>
            <p className="m-0 text-[13px] text-ink-muted sm:col-span-2">Las vistas y la presentación se guardan en este navegador; no se comparten entre usuarios ni conceden permisos.</p>
          </section>
          <fieldset className="grid min-w-0 grid-cols-1 gap-x-4 sm:grid-cols-2 xl:grid-cols-3"><legend className="mb-2 text-sm font-semibold text-ink">Contenido de las tarjetas</legend>{CAMPOS_TARJETA.map((c) => <label className="inline-flex min-h-12 min-w-0 items-center gap-2 text-[13px]" key={c}><Checkbox checked={preferencias.tarjeta[c]} onCheckedChange={() => onPreferencias({ ...preferencias, tarjeta: { ...preferencias.tarjeta, [c]: !preferencias.tarjeta[c] } })} />{ETIQUETA_CAMPO[c]}</label>)}<label className="inline-flex min-h-12 items-center gap-2 text-[13px]"><Checkbox checked={preferencias.compacta} onCheckedChange={(checked) => onPreferencias({ ...preferencias, compacta: checked })} />Tarjeta compacta</label></fieldset>
          <details className="min-w-0 border-t border-line pt-2"><summary className="min-h-12 cursor-pointer py-3 text-sm font-semibold">Columnas de la lista · orden y visibilidad</summary><p className="m-0 mb-3 text-[13px] text-ink-muted">Contacto siempre visible. La preferencia no concede acceso a montos.</p><div className="grid gap-2 sm:grid-cols-2">{preferencias.ordenColumnas.map((c, i) => <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-1 rounded-lg border border-line px-2" key={c}><label className="inline-flex min-h-12 min-w-0 items-center gap-2 text-[13px]"><Checkbox checked={preferencias.columnasLista[c]} onCheckedChange={() => onPreferencias({ ...preferencias, columnasLista: { ...preferencias.columnasLista, [c]: !preferencias.columnasLista[c] } })} />{ETIQUETA_COLUMNA[c]}</label><button className="min-h-12 px-2 text-[13px] font-semibold text-navy-900 disabled:opacity-40" type="button" disabled={i === 0} aria-label={`Subir columna ${ETIQUETA_COLUMNA[c]}`} onClick={() => onPreferencias(desplazarColumna(preferencias, c, -1))}>Subir</button><button className="min-h-12 px-2 text-[13px] font-semibold text-navy-900 disabled:opacity-40" type="button" disabled={i === COLUMNAS_LISTA.length - 1} aria-label={`Bajar columna ${ETIQUETA_COLUMNA[c]}`} onClick={() => onPreferencias(desplazarColumna(preferencias, c, 1))}>Bajar</button></div>)}</div></details>
          <fieldset className="grid grid-cols-1 gap-x-4 sm:grid-cols-2 xl:grid-cols-3"><legend className="mb-2 text-sm font-semibold text-ink">Etapas visibles</legend>{etapas.map((e) => <label key={e.id} className="inline-flex min-h-12 items-center gap-2 text-[13px]"><Checkbox checked={!preferencias.etapasOcultas.includes(e.id)} onCheckedChange={() => onPreferencias(alternarEtapa(preferencias, e.id, etapas.length))} />{e.name}</label>)}</fieldset>
        </div>
      </CollapsibleContent>
    </Collapsible>
    <Collapsible className={panel}>
      <CollapsibleTrigger className={trigger}><Filter className="size-4 shrink-0" aria-hidden="true" /><span>Filtros avanzados{avanzados.length ? ` · ${avanzados.length}` : ""}</span>{flecha}</CollapsibleTrigger>
      <CollapsibleContent>
        <form key={consulta} className="grid min-w-0 gap-3 border-t border-line p-3 sm:grid-cols-2 sm:p-4 xl:grid-cols-4" onSubmit={(e) => { e.preventDefault(); const q = new URLSearchParams(consulta); const datos = new FormData(e.currentTarget); for (const k of ["origen", "diasMin", "probMin", "sinAccion"]) { const v = String(datos.get(k) ?? ""); if (v) q.set(k, v); else q.delete(k); } q.delete("cursor"); onNavegar(q.toString()); }}>
          <p className="m-0 text-[13px] text-ink-muted sm:col-span-2 xl:col-span-4">Se aplican únicamente a los negocios cargados en esta página. Los totales del servidor no se recalculan con estos criterios.</p>
          <label className="min-w-0 text-[13px]">Origen exacto<input name="origen" className={campo} placeholder="Nombre del canal" defaultValue={query.get("origen") ?? ""} /></label>
          <label className="min-w-0 text-[13px]">Días mínimos en etapa<input name="diasMin" type="number" min="0" max="3650" className={campo} defaultValue={query.get("diasMin") ?? ""} /></label>
          <label className="min-w-0 text-[13px]">Probabilidad mínima (%)<input name="probMin" type="number" min="0" max="100" className={campo} defaultValue={query.get("probMin") ?? ""} /></label>
          <label className="inline-flex min-h-12 items-center gap-2 self-end text-[13px]"><Checkbox name="sinAccion" value="1" defaultChecked={query.get("sinAccion") === "1"} />Sin próxima acción</label>
          <div className="flex flex-wrap gap-2 sm:col-span-2 xl:col-span-4"><button className={campo + " font-semibold"} type="submit" disabled={ocupado}>Aplicar filtros avanzados</button>{avanzados.length > 0 && <button type="button" className={campo} disabled={ocupado} onClick={() => { const q = new URLSearchParams(consulta); for (const k of ["origen", "diasMin", "probMin", "sinAccion", "cursor"]) q.delete(k); onNavegar(q.toString()); }}>Quitar filtros avanzados</button>}</div>
        </form>
      </CollapsibleContent>
    </Collapsible>
    <Collapsible className={panel}>
      <CollapsibleTrigger className={trigger}><ListChecks className="size-4 shrink-0" aria-hidden="true" /><span>Seleccionar y exportar{visiblesSeleccionados.length ? ` · ${visiblesSeleccionados.length}` : ""}</span>{flecha}</CollapsibleTrigger>
      <CollapsibleContent><div className="grid min-w-0 gap-3 border-t border-line p-3 sm:p-4">
        <p className="m-0 text-[13px] text-ink-muted">Selecciona negocios de esta página para exportar o usar las acciones permitidas por tu rol.</p>
        <div className="flex flex-wrap gap-2"><button className={campo} type="button" onClick={() => setSeleccion(filas.map((f) => f.id))}>Seleccionar esta página</button><button className={campo} type="button" onClick={() => setSeleccion([])}>Limpiar selección</button><span className="inline-flex min-h-12 items-center text-[13px] font-semibold tabular-nums">{visiblesSeleccionados.length} seleccionados</span></div>
        <div className="grid max-h-72 gap-x-4 overflow-y-auto overscroll-contain rounded-lg border border-line px-2 sm:grid-cols-2">{filas.map((f) => <label className="inline-flex min-h-12 min-w-0 items-center gap-2 text-[13px]" key={f.id}><Checkbox checked={seleccion.includes(f.id)} onCheckedChange={(checked) => setSeleccion(checked ? [...seleccion, f.id] : seleccion.filter((id) => id !== f.id))} /><span className="min-w-0 break-words">{f.contactName}</span></label>)}</div>
        <div className="flex flex-wrap gap-2"><button className={campo + " font-semibold"} type="button" disabled={!puedeExportar || sinConexion || ocupado || visiblesSeleccionados.length === 0} onClick={exportar}>Exportar selección CSV</button></div>
        <AccionesMasivas filas={visiblesSeleccionados} etapas={etapas} puedeEditar={puedeEditar} sinConexion={sinConexion} ocupado={ocupado} />{!puedeExportar && <p className="m-0 text-[13px] text-ink-muted">Tu rol no tiene permiso para exportar negocios.</p>}
      </div></CollapsibleContent>
    </Collapsible>
    {avanzados.length > 0 && <p role="status" className="m-0 break-words text-[13px] text-ink-muted lg:col-span-3">En esta página: {avanzados.join(" · ")}</p>}
  </div></details>;
}
