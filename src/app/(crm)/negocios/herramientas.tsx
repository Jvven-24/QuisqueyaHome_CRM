"use client";
import { Checkbox } from "@/components/ui/checkbox";
import { useEffect, useState } from "react";
import type { Etapa, NegocioFila } from "./logica";
import { CAMPOS_TARJETA, COLUMNAS_LISTA, ETIQUETA_CAMPO, ETIQUETA_COLUMNA, desplazarColumna, alternarEtapa, type Preferencias } from "./preferencias";
import { guardarVista, leerVistas, VISTAS_SISTEMA, type VistaGuardada } from "./vistas-guardadas";
import { AccionesMasivas } from "./acciones-masivas";
import { filasACsv } from "./filtros-cliente";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export function HerramientasNegocios({ filas, etapas, preferencias, onPreferencias, consulta, onNavegar, puedeEditar, puedeExportar, sinConexion, ocupado }: {
  filas: NegocioFila[]; etapas: Etapa[]; preferencias: Preferencias; onPreferencias: (p: Preferencias) => void;
  consulta: string; onNavegar: (q: string) => void; puedeEditar: boolean; puedeExportar: boolean; sinConexion: boolean; ocupado: boolean;
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
  return <Collapsible className="my-3 rounded-xl border border-line bg-surface p-3 text-sm">
    <CollapsibleTrigger className="w-full py-3 text-left font-bold">Vistas, presentación, filtros avanzados y selección</CollapsibleTrigger>
    <CollapsibleContent>
    {aviso && <p role="status">{aviso}</p>}
    <div className="grid gap-3">
      <label>Vista guardada <select aria-label="Vista guardada" className={campo} value="" onChange={(e) => { const v = [...VISTAS_SISTEMA, ...vistas].find((v) => v.id === e.target.value); if (v) onNavegar(v.consulta); }}><option value="">Elegir vista</option>{[...VISTAS_SISTEMA, ...vistas].map((v) => <option key={v.id} value={v.id}>{v.nombre}</option>)}</select></label>
      <div className="flex flex-wrap gap-2"><label>Nombre de la vista <input className={campo} maxLength={60} value={nombre} onChange={(e) => setNombre(e.target.value)} /></label><button className={campo} type="button" onClick={guardar}>Guardar vista local</button></div>
      <fieldset className="flex flex-wrap gap-3"><legend>Campos de tarjeta</legend>{CAMPOS_TARJETA.map((c) => <label className="inline-flex min-h-12 items-center gap-2" key={c}><Checkbox checked={preferencias.tarjeta[c]} onCheckedChange={() => onPreferencias({ ...preferencias, tarjeta: { ...preferencias.tarjeta, [c]: !preferencias.tarjeta[c] } })} />{ETIQUETA_CAMPO[c]}</label>)}<label className="inline-flex min-h-12 items-center gap-2"><Checkbox checked={preferencias.compacta} onCheckedChange={(checked) => onPreferencias({ ...preferencias, compacta: checked })} />Tarjeta compacta</label></fieldset>
      <fieldset className="grid gap-2"><legend>Columnas de lista · orden y visibilidad</legend><p>Contacto siempre visible. La preferencia no concede acceso a montos. Se guarda en este navegador sin datos de negocios.</p>{preferencias.ordenColumnas.map((c, i) => <div className="flex flex-wrap items-center gap-2" key={c}><label className="inline-flex min-h-12 items-center gap-2"><Checkbox checked={preferencias.columnasLista[c]} onCheckedChange={() => onPreferencias({ ...preferencias, columnasLista: { ...preferencias.columnasLista, [c]: !preferencias.columnasLista[c] } })} />{ETIQUETA_COLUMNA[c]}</label><button className={campo} type="button" disabled={i === 0} aria-label={`Subir columna ${ETIQUETA_COLUMNA[c]}`} onClick={() => onPreferencias(desplazarColumna(preferencias, c, -1))}>Subir</button><button className={campo} type="button" disabled={i === COLUMNAS_LISTA.length - 1} aria-label={`Bajar columna ${ETIQUETA_COLUMNA[c]}`} onClick={() => onPreferencias(desplazarColumna(preferencias, c, 1))}>Bajar</button></div>)}</fieldset>
      <fieldset className="flex flex-wrap gap-3"><legend>Etapas visibles</legend>{etapas.map((e) => <label key={e.id} className="inline-flex min-h-12 items-center gap-2"><Checkbox checked={!preferencias.etapasOcultas.includes(e.id)} onCheckedChange={() => onPreferencias(alternarEtapa(preferencias, e.id, etapas.length))} />{e.name}</label>)}</fieldset>
      <form className="flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); const q = new URLSearchParams(consulta); const datos = new FormData(e.currentTarget); for (const k of ["q", "origen", "diasMin", "probMin", "sinAccion"]) { const v = String(datos.get(k) ?? ""); if (v) q.set(k, v); else q.delete(k); } q.delete("cursor"); onNavegar(q.toString()); }}>
        <label>Buscar en esta página <input name="q" defaultValue={new URLSearchParams(consulta).get("q") ?? ""} className={campo} maxLength={64} /></label>
        <label>Origen <input name="origen" className={campo} defaultValue={new URLSearchParams(consulta).get("origen") ?? ""} /></label>
        <label>Días mínimos en etapa <input name="diasMin" type="number" min="0" max="3650" className={campo} defaultValue={new URLSearchParams(consulta).get("diasMin") ?? ""} /></label>
        <label>Probabilidad mínima <input name="probMin" type="number" min="0" max="100" className={campo} defaultValue={new URLSearchParams(consulta).get("probMin") ?? ""} /></label>
        <label className="inline-flex min-h-12 items-center gap-2"><Checkbox name="sinAccion" value="1" defaultChecked={new URLSearchParams(consulta).get("sinAccion") === "1"} />Sin próxima acción</label><button className={campo}>Aplicar filtros</button>
      </form>
      <Collapsible className="border-t border-line pt-2"><CollapsibleTrigger className="w-full py-3 text-left">Selección masiva de esta página</CollapsibleTrigger><CollapsibleContent><button className={campo} type="button" onClick={() => setSeleccion(filas.map((f) => f.id))}>Seleccionar esta página</button> <button className={campo} type="button" onClick={() => setSeleccion([])}>Limpiar selección</button><div className="grid gap-1">{filas.map((f) => <label className="inline-flex min-h-12 items-center gap-2" key={f.id}><Checkbox checked={seleccion.includes(f.id)} onCheckedChange={(checked) => setSeleccion(checked ? [...seleccion, f.id] : seleccion.filter((id) => id !== f.id))} />{f.contactName}</label>)}</div><button className={campo} type="button" disabled={!puedeExportar || sinConexion || ocupado || !filas.some((f) => seleccion.includes(f.id))} onClick={exportar}>Exportar selección CSV</button><AccionesMasivas filas={filas.filter((f) => seleccion.includes(f.id))} etapas={etapas} puedeEditar={puedeEditar} sinConexion={sinConexion} ocupado={ocupado} />{!puedeExportar && <p>Tu rol no tiene permiso para exportar negocios.</p>}</CollapsibleContent></Collapsible>
    </div>
    </CollapsibleContent>
  </Collapsible>;
}
