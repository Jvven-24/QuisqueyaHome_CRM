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
          className="flex w-full items-center justify-between gap-2.5 rounded-xl p-2 text-left transition-colors hover:bg-white/8 focus:outline-none cursor-pointer group"
          aria-label="Menú de perfil y cuenta del usuario"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <span className="flex size-9 items-center justify-center rounded-lg bg-gold-600/20 text-xs font-bold text-gold-400 border border-gold-500/40 shadow-xs">
                {usuario.initials}
              </span>
              <span
                className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-500 border-2 border-navy-950"
                title="Sesión activa y en línea"
              />
            </div>
            <div className="grid leading-tight min-w-0">
              <span className="truncate text-xs font-semibold text-white group-hover:text-gold-300 transition-colors">
                {usuario.fullName}
              </span>
              <span className="truncate text-[10px] text-slate-400">
                {usuario.jobTitle || usuario.roleLabel}
              </span>
            </div>
          </div>
          <ChevronsUpDown className="size-3.5 text-slate-400 group-hover:text-gold-300 shrink-0" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        side="top"
        className="w-64 bg-navy-950 border border-gold-600/40 text-slate-100 shadow-2xl rounded-xl p-1.5 backdrop-blur-xl"
      >
        <DropdownMenuLabel className="px-2.5 py-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-gold-500 shrink-0" />
            <div className="grid min-w-0">
              <span className="text-xs font-bold text-white truncate">{usuario.fullName}</span>
              <span className="text-[10px] text-slate-400 font-mono truncate">{usuario.email}</span>
            </div>
          </div>
          <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gold-600/20 border border-gold-500/30 text-[10px] font-bold text-gold-400 uppercase tracking-wider">
            {usuario.roleLabel}
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="bg-white/10 my-1" />

        <DropdownMenuItem asChild>
          <Link
            href="/configuracion"
            className="flex items-center gap-2.5 px-2.5 py-2 text-xs text-slate-300 hover:text-white hover:bg-white/8 rounded-lg cursor-pointer transition-colors"
          >
            <Settings className="size-3.5 text-gold-500 shrink-0" />
            <span>Ajustes & Preferencias</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link
            href="/academy"
            className="flex items-center gap-2.5 px-2.5 py-2 text-xs text-slate-300 hover:text-white hover:bg-white/8 rounded-lg cursor-pointer transition-colors"
          >
            <GraduationCap className="size-3.5 text-gold-500 shrink-0" />
            <span>Academy & Certificaciones</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-white/10 my-1" />

        <DropdownMenuItem
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-2.5 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg cursor-pointer transition-colors"
        >
          <LogOut className="size-3.5 shrink-0" />
          <span>Cerrar Sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
