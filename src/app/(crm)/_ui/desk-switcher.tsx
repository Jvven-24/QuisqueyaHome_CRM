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
    nombre: "Punta Cana Desk",
    zona: "Bávaro / Punta Cana",
    tag: "HQ Principal",
  },
  {
    id: "cap-cana",
    nombre: "Cap Cana Lounge",
    zona: "Marina & Golf",
    tag: "Ultra-Luxury",
  },
  {
    id: "sd-piantini",
    nombre: "Santo Domingo",
    zona: "Torre Piantini",
    tag: "Corporativo",
  },
  {
    id: "terrenas-coast",
    nombre: "Las Terrenas",
    zona: "Península Samaná",
    tag: "Eco-Boutique",
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
          className="flex w-full items-center justify-between px-2 py-1.5 rounded-lg bg-transparent border-0 hover:bg-white/6 text-left transition-colors focus:outline-none cursor-pointer group select-none"
          aria-label="Seleccionar Jurisdicción o Desk Inmobiliario"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="size-8 rounded-lg bg-navy-900 border border-white/10 flex items-center justify-center p-1 shrink-0 shadow-xs">
              <Image
                src="/brand/app-icon-192.png"
                alt="Quisqueya Home"
                width={24}
                height={24}
                className="size-6 object-contain"
              />
            </div>
            <div className="flex flex-col min-w-0 leading-tight">
              <span className="text-[13px] font-semibold text-slate-100 truncate group-hover:text-white transition-colors">
                Quisqueya Home
              </span>
              <span className="text-[11px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                <span className="size-1.5 rounded-full bg-emerald-400/90 inline-block" />
                {deskActivo.nombre}
              </span>
            </div>
          </div>
          <ChevronsUpDown className="size-3.5 text-slate-400/70 group-hover:text-slate-200 transition-colors shrink-0" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        className="w-60 bg-[#0d1627] border border-slate-800 text-slate-200 shadow-xl rounded-xl p-1 backdrop-blur-xl z-50"
      >
        <DropdownMenuLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2.5 py-1.5 font-heading">
          Jurisdicciones & Desks RD
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/5 my-1" />

        {DESKS_DISPONIBLES.map((desk) => {
          const esActivo = desk.id === deskActivo.id;
          return (
            <DropdownMenuItem
              key={desk.id}
              onClick={() => cambiarDesk(desk)}
              className={`flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg cursor-pointer text-xs transition-colors ${
                esActivo
                  ? "bg-white/10 text-white font-medium"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <MapPin className="size-3 text-gold-500/80 shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="font-medium text-slate-100 truncate">{desk.nombre}</span>
                  <span className="text-[10px] text-slate-400 truncate">{desk.zona}</span>
                </div>
              </div>
              {esActivo && <Check className="size-3.5 text-gold-400 shrink-0" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
