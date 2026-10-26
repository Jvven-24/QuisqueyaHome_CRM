"use client";
import { useState } from "react";
import Link from "next/link";
import { PreviewWorkspace } from "../propiedades/_componentes/preview-workspace";
import { AFTERSALES_PREVIEWS, AFTERSALES_SECTIONS, type AftersalesSection } from "./_ejemplo";
export function AftersalesWorkspace(){const [section,setSection]=useState<AftersalesSection>("casos");return <div className="space-y-5 min-w-0"><header className="flex flex-wrap justify-between items-start gap-3"><div><h1 className="m-0 font-heading text-2xl font-bold text-navy-950">Entregas y posventa</h1><p className="text-ink-muted text-sm">Seguimiento de servicio, cobertura y compromisos de entrega.</p></div><Link href="/propiedades" className="button min-h-11">Volver a inventario</Link></header><nav aria-label="Secciones de posventa" className="flex flex-wrap gap-2">{AFTERSALES_SECTIONS.map(item=><button type="button" className={"button min-h-11 "+(section===item.id?"primary":"")} aria-pressed={section===item.id} key={item.id} onClick={()=>setSection(item.id)}>{item.label}</button>)}</nav><PreviewWorkspace key={section} definition={AFTERSALES_PREVIEWS[section]} /></div>;}
