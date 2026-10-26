"use client";
import { useState } from "react";
import Link from "next/link";
import type { projects, units } from "@/infrastructure/db/schema";
import { PROJECT_PREVIEWS } from "../_ejemplo";
import { PreviewWorkspace } from "./preview-workspace";
const SECTIONS=[{id:"estructura",label:"Etapas y torres"},{id:"precios",label:"Precios y planes"},{id:"materiales",label:"Mediateca y kit"},{id:"calidad",label:"Calidad y CONFOTUR"}] as const;
type Section=typeof SECTIONS[number]["id"];
type Project=typeof projects.$inferSelect;type Unit=typeof units.$inferSelect;
export function ProjectDossier({project,units:rows,canEdit}:{project:Project;units:Unit[];canEdit:boolean}){
  const [section,setSection]=useState<Section>("estructura");
  return <section className="space-y-4 min-w-0"><div className="flex flex-wrap gap-2" aria-label="Expediente de proyecto">{SECTIONS.map(item=><button type="button" className={"button min-h-11 "+(section===item.id?"primary":"")} aria-pressed={section===item.id} key={item.id} onClick={()=>setSection(item.id)}>{item.label}</button>)}</div>
    {section==="estructura"&&<div className="rounded-xl border border-line p-4 bg-surface"><h2 className="text-lg m-0">Estructura registrada</h2><dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm mt-4"><div><dt>Proyecto</dt><dd className="m-0 font-semibold">{project.name}</dd></div><div><dt>Promotor registrado</dt><dd className="m-0 font-semibold">{project.developer??"Sin registrar"}</dd></div><div><dt>Unidades / pisos conocidos</dt><dd className="m-0 font-semibold">{rows.length} / {new Set(rows.flatMap(unit=>unit.floorLevel==null?[]:[unit.floorLevel])).size}</dd></div></dl><p className="text-sm text-ink-muted">No hay catálogo persistido de etapas comerciales ni torres. Las fases de obra son un concepto independiente.</p><Link className="button min-h-11" href="/posventa">Ver entregas y posventa</Link></div>}
    {section==="precios"&&<div className="rounded-xl border border-line bg-surface p-4"><h2 className="text-lg m-0">Precios públicos registrados</h2><p className="text-sm text-ink-muted">Referencia actual por unidad; no representa una lista aprobada ni modifica contratos.</p><div className="overflow-x-auto"><table style={{minWidth:480}}><caption className="text-left text-sm">{project.name} · lectura del inventario</caption><thead><tr><th>Unidad</th><th>Moneda</th><th>Mínimo</th><th>Máximo</th></tr></thead><tbody>{rows.map(unit=><tr key={unit.id}><td>{unit.code}</td><td>{unit.currency}</td><td>{unit.publicRangeMinCents==null?"Sin registrar":(unit.publicRangeMinCents/100).toLocaleString("es-DO")}</td><td>{unit.publicRangeMaxCents==null?"Sin registrar":(unit.publicRangeMaxCents/100).toLocaleString("es-DO")}</td></tr>)}</tbody></table></div>{!rows.length&&<p>No hay unidades registradas.</p>}</div>}
    {section==="materiales"&&<div className="rounded-xl border border-line bg-surface p-4"><h2 className="text-lg m-0">Fuente registrada</h2><p className="text-sm">El video del proyecto no acredita licencia ni aprobación de publicación.</p>{project.videoUrl&&/^https:\/\//i.test(project.videoUrl)?<a className="button min-h-11" href={project.videoUrl} target="_blank" rel="noreferrer">Abrir video registrado</a>:<p className="text-sm text-ink-muted">Sin video registrado con URL HTTPS.</p>}</div>}
    {section==="calidad"&&<div role="note" className="rounded-xl border border-line bg-surface p-4"><h2 className="text-lg m-0">Estado comercial verificado: pendiente</h2><p className="text-sm">La marca registrada de CONFOTUR no equivale a una resolución revisada. No se publican aquí beneficios fiscales aprobados.</p></div>}
    {!canEdit&&<p role="note" className="text-sm text-ink-muted">Acceso de consulta. Las acciones siguientes son ejemplos sin efecto; la edición real permanece protegida por permisos de servidor.</p>}
    <PreviewWorkspace key={section} definition={PROJECT_PREVIEWS[section]} />
  </section>;
}
