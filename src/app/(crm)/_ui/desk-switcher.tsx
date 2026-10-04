"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ChevronsUpDown, Check, MapPin } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface DeskOption {
  id: string;
  nombre: string;
  zona: string;
  tag: string;
}

const DESKS_DISPONIBLES: DeskOption[] = [
  {
    id: "pc-hq",
    nombre: "Punta Cana Luxury Desk",
    zona: "Bávaro / Punta Cana",
    tag: "Sede Principal HQ",
  },
  {
    id: "cap-cana",
    nombre: "Cap Cana Marina Lounge",
    zona: "Cap Cana Marina & Golf",
    tag: "Ultra-Luxury Desk",
  },
  {
    id: "sd-piantini",
    nombre: "Santo Domingo Corporate",
    zona: "Torre Piantini, D.N.",
    tag: "Oficina Corporativa",
  },
  {
    id: "terrenas-coast",
    nombre: "Las Terrenas Eco-Boutique",
    zona: "Península de Samaná",
    tag: "Villas & Costas",
  },
];

export function DeskSwitcher() {
  const [deskActivo, setDeskActivo] = useState<DeskOption>(DESKS_DISPONIBLES[0]!);

  function cambiarDesk(desk: DeskOption) {
    setDeskActivo(desk);
    toast.success(`Jurisdicción cambiada a ${desk.nombre}`, {
      description: `Zona operativa: ${desk.zona}`,
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-between gap-2.5 rounded-xl border border-gold-600/30 bg-navy-950/70 p-2 text-left transition-all hover:border-gold-500/60 hover:bg-navy-950 focus:outline-none cursor-pointer group"
          aria-label="Seleccionar Jurisdicción o Desk Inmobiliario"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Image
              src="/brand/app-icon-192.png"
              alt="Quisqueya Home"
              width={36}
              height={36}
              className="size-9 shrink-0 rounded-lg object-contain bg-navy-900 border border-gold-500/30 p-1 shadow-xs group-hover:border-gold-400/60 transition-colors"
            />
            <div className="grid leading-tight min-w-0">
              <span className="font-heading text-xs font-bold text-white uppercase tracking-wider truncate">
                {deskActivo.nombre}
              </span>
              <span className="text-[10px] text-gold-400/90 font-medium truncate flex items-center gap-1">
                <MapPin className="size-2.5 text-gold-500 shrink-0" />
                {deskActivo.zona}
              </span>
            </div>
          </div>
          <ChevronsUpDown className="size-3.5 text-gold-400/70 group-hover:text-gold-300 shrink-0" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        className="w-64 bg-navy-950 border border-gold-600/40 text-slate-100 shadow-2xl rounded-xl p-1.5 backdrop-blur-xl"
      >
        <DropdownMenuLabel className="text-[10px] font-bold text-gold-400 uppercase tracking-widest px-2.5 py-1.5 font-heading">
          Jurisdicciones & Desks RD
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/10 my-1" />

        {DESKS_DISPONIBLES.map((desk) => {
          const esActivo = desk.id === deskActivo.id;
          return (
            <DropdownMenuItem
              key={desk.id}
              onClick={() => cambiarDesk(desk)}
              className={`flex items-start justify-between gap-2 px-2.5 py-2 rounded-lg cursor-pointer text-xs transition-colors ${
                esActivo
                  ? "bg-gold-600/20 text-gold-300 font-semibold border border-gold-500/30"
                  : "text-slate-300 hover:text-white hover:bg-white/8"
              }`}
            >
              <div className="grid min-w-0">
                <span className="font-medium text-white truncate">{desk.nombre}</span>
                <span className="text-[10px] text-slate-400 truncate">{desk.zona}</span>
                <span className="text-[9px] text-gold-400/90 uppercase font-mono tracking-wider mt-0.5">
                  {desk.tag}
                </span>
              </div>
              {esActivo && <Check className="size-4 text-gold-400 shrink-0 mt-0.5" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
