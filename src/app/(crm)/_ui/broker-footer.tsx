"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronsUpDown, LogOut, Settings, GraduationCap, ShieldCheck } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface BrokerFooterProps {
  usuario: {
    fullName: string;
    email: string;
    initials: string;
    jobTitle: string;
    roleLabel: string;
  };
}

export function BrokerFooter({ usuario }: BrokerFooterProps) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-between px-2 py-1.5 rounded-lg bg-transparent border-0 hover:bg-white/6 text-left transition-colors focus:outline-none cursor-pointer group select-none"
          aria-label="Menú de perfil y cuenta del usuario"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <span className="flex size-7 items-center justify-center rounded-full bg-slate-800 text-[11px] font-semibold text-slate-200 border border-white/10">
                {usuario.initials}
              </span>
              <span
                className="absolute 0 bottom-0 right-0 size-2 rounded-full bg-emerald-400 border border-navy-950"
                title="Sesión en línea"
              />
            </div>
            <div className="flex flex-col min-w-0 leading-tight">
              <span className="truncate text-[12px] font-medium text-slate-200 group-hover:text-white transition-colors">
                {usuario.fullName}
              </span>
              <span className="truncate text-[10px] text-slate-400">
                {usuario.jobTitle || usuario.roleLabel}
              </span>
            </div>
          </div>
          <ChevronsUpDown className="size-3.5 text-slate-400/60 group-hover:text-slate-200 transition-colors shrink-0" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        side="top"
        className="w-56 bg-navy-900 border border-white/15 text-slate-200 shadow-md rounded-lg p-1 z-50 mb-1"
      >
        <DropdownMenuLabel className="px-2.5 py-1.5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-3.5 text-gold-500/90 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-white truncate">{usuario.fullName}</span>
              <span className="text-[10px] text-slate-400 font-mono truncate">{usuario.email}</span>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="bg-white/5 my-1" />

        <DropdownMenuItem asChild>
          <Link
            href="/configuracion"
            className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-white/5 rounded-md cursor-pointer transition-colors"
          >
            <Settings className="size-3.5 text-slate-400 shrink-0" />
            <span>Configuración</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link
            href="/academy"
            className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-white/5 rounded-md cursor-pointer transition-colors"
          >
            <GraduationCap className="size-3.5 text-slate-400 shrink-0" />
            <span>Academy & Guías</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-white/5 my-1" />

        <DropdownMenuItem
          onClick={handleLogout}
          className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-md cursor-pointer transition-colors"
        >
          <LogOut className="size-3.5 shrink-0" />
          <span>Cerrar Sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
