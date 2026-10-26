"use client";
import { useState } from "react";
import Image from "next/image";
import { ChevronsUpDown, Check, Building2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export interface DeskOption { id: string; nombre: string; zona: string; tag: string; }

export function DeskSwitcher() {
  const [preview, setPreview] = useState(false);
  return <><DropdownMenu><DropdownMenuTrigger asChild><button type="button" className="flex w-full min-h-14 items-center justify-between gap-2 rounded-lg bg-transparent text-left text-white" aria-label="Empresa y sede de trabajo"><span className="flex items-center gap-3 min-w-0"><Image src="/brand/app-icon-192.png" alt="" width={36} height={36} className="rounded-lg shrink-0" /><span className="min-w-0"><strong className="block text-sm truncate">Quisqueya Home</strong><small className="block text-sidebar-foreground text-[13px]">Private Desk</small></span></span><ChevronsUpDown className="size-4 shrink-0" /></button></DropdownMenuTrigger><DropdownMenuContent align="start" className="w-64"><DropdownMenuLabel>Empresa de trabajo</DropdownMenuLabel><DropdownMenuItem disabled><Building2 className="size-4" />Quisqueya Home<Check className="size-4 ml-auto" /></DropdownMenuItem><DropdownMenuItem onSelect={() => setPreview(true)}>Cambiar empresa o sede · vista previa</DropdownMenuItem></DropdownMenuContent></DropdownMenu><Dialog open={preview} onOpenChange={setPreview}><DialogContent><DialogHeader><DialogTitle>Empresa y sede</DialogTitle><DialogDescription>Vista previa · falta: membresías por organización, catálogo de sedes y cambio de contexto autenticado.</DialogDescription></DialogHeader><label className="text-sm">Empresa<select disabled aria-describedby="company-context-note"><option>Quisqueya Home</option></select></label><label className="text-sm">Sede<select disabled><option>Sin catálogo disponible</option></select></label><p id="company-context-note" className="text-sm text-ink-muted">Cambiar de empresa requiere cancelar consultas, limpiar caché y obtener los permisos de la nueva organización. No se ha cambiado la sesión ni la jurisdicción.</p></DialogContent></Dialog></>;
}
