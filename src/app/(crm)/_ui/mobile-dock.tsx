"use client";

import React, { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Drawer } from "vaul";
import {
  Grid,
  Search,
  ExternalLink,
  X,
} from "lucide-react";
import { WORKSPACES, type Modulo } from "../modulos";
import { ModuloIcon } from "./icon-resolver";
import { CommandPalette } from "./command-palette";

interface MobileDockProps {
  modulosVisibles: readonly Modulo[];
  etiquetaRol: string;
  /** Contenido extra de la hoja «Más» (p. ej. «Ver como broker» en móvil). */
  extra?: ReactNode;
}

/**
 * Puntos de anclaje de la hoja «Más»: media pantalla y casi completa. Se
 * arrastra con el asa (vaul) y el foco, Escape y el bloqueo de scroll los
 * resuelve el diálogo de Radix que vaul usa por debajo.
 */
const ANCLAJES: (number | string)[] = [0.6, 0.94];

export function MobileDock({
  modulosVisibles,
  etiquetaRol,
  extra,
}: MobileDockProps) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [anclaje, setAnclaje] = useState<number | string | null>(ANCLAJES[0]!);
  const completa = anclaje === ANCLAJES[ANCLAJES.length - 1];
  function abrirHoja(abrir: boolean) {
    setDrawerOpen(abrir);
    if (abrir) setAnclaje(ANCLAJES[0]!);
  }

  const isActive = (ruta: string) =>
    pathname === ruta || (ruta !== "/inicio" && pathname.startsWith(`${ruta}/`));

  return (
    <>
      {/* Fixed bottom navigation bar for mobile (<768px) */}
      <nav aria-label="Navegación móvil rápida" className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-line px-2 pt-1 pb-[max(0.35rem,var(--sab))]">
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {["/inicio", "/leads", "/propiedades", "/agenda"].map((ruta) => {
            const modulo = modulosVisibles.find((item) => item.ruta === ruta);
            if (!modulo) return null;
            return <Link key={ruta} href={ruta} aria-current={isActive(ruta) ? "page" : undefined} className={`flex min-w-0 flex-1 flex-col items-center justify-center min-h-[48px] py-1 px-1 rounded-xl ${isActive(ruta) ? "bg-gold-100 text-navy-950 font-bold" : "text-ink-muted font-medium"}`}>
              <ModuloIcon name={modulo.icono} className="size-5" />
              <span className="text-[13px] mt-1 leading-none">{ruta === "/propiedades" ? "Inventario" : modulo.nombre}</span>
            </Link>;
          })}
          <button type="button" onClick={() => abrirHoja(true)} aria-expanded={drawerOpen} aria-controls="mobile-modules-menu" className="flex min-w-0 flex-1 flex-col items-center justify-center min-h-[48px] py-1 px-1 rounded-xl text-ink-muted" aria-label="Ver todos los módulos">
            <Grid className="size-5" /><span className="text-[13px] mt-1 leading-none">Más</span>
          </button>
        </div>
      </nav>

      {/* Hoja inferior «Más»: deslizable arriba/abajo con anclajes (vaul) */}
      <Drawer.Root
        open={drawerOpen}
        onOpenChange={abrirHoja}
        snapPoints={ANCLAJES}
        activeSnapPoint={anclaje}
        setActiveSnapPoint={setAnclaje}
        fadeFromIndex={0}
      >
        <Drawer.Portal>
          <Drawer.Overlay className="md:hidden fixed inset-0 z-50 bg-navy-950/60" />
          <Drawer.Content
            id="mobile-modules-menu"
            aria-describedby={undefined}
            className="md:hidden fixed inset-x-0 bottom-0 z-50 flex h-[96dvh] flex-col rounded-t-3xl border-t border-line bg-surface shadow-2xl outline-none"
          >
            {/* Asa: arrastrar para expandir o bajar; tocar alterna anclajes */}
            <Drawer.Handle className="!mt-2 !mb-1 !h-1.5 !w-12 !bg-line-strong" aria-label="Arrastrar para expandir o contraer" />
            <div className="flex items-center justify-between gap-2 px-4 pb-2">
              <Drawer.Title className="m-0 font-heading text-base font-bold text-navy-950">Todos los módulos</Drawer.Title>
              <Drawer.Close
                className="size-11 inline-flex items-center justify-center rounded-lg text-ink-muted hover:text-ink hover:bg-surface-alt transition-colors"
                aria-label="Cerrar menú"
              >
                <X className="size-5" />
              </Drawer.Close>
            </div>

            <div className={`flex-1 space-y-4 px-4 pb-[max(2rem,env(safe-area-inset-bottom))] ${completa ? "overflow-y-auto" : "overflow-hidden"}`}>
              <button type="button" onClick={() => { abrirHoja(false); setCommandOpen(true); }} className="min-h-11 w-full flex items-center gap-2 rounded-xl border border-line bg-surface-alt px-4 text-sm text-ink-muted" aria-label="Abrir buscador global de CRM"><Search className="size-5" />Buscar en el CRM</button>

              {(() => {
                const acciones = [{route: "/leads?crear=1", modulo: "/leads", label: "Capturar lead"}, {route: "/agenda", modulo: "/agenda", label: "Programar visita"}, {route: "/tareas", modulo: "/tareas", label: "Seguimiento"}].filter(action => modulosVisibles.some(module => module.ruta === action.modulo));
                return acciones.length > 0 && <section aria-label="Acciones de campo">
                  <h4 className="m-0 mb-2 text-[13px] font-semibold text-ink-muted">Acciones de campo</h4>
                  <div className="grid grid-cols-3 gap-2">{acciones.map(action => <Link className="flex min-h-11 items-center justify-center rounded-xl border border-gold-600/40 bg-gold-50 px-2 text-center text-[13px] font-semibold leading-tight text-navy-950" key={action.route} href={action.route} onClick={() => abrirHoja(false)}>{action.label}</Link>)}</div>
                </section>;
              })()}

              {WORKSPACES.map((workspace) => {
                const modulesInWs = modulosVisibles.filter(
                  (m) => m.workspaceId === workspace.id
                );
                if (modulesInWs.length === 0) return null;

                return (
                  <section key={workspace.id} aria-label={workspace.nombre} className="space-y-2">
                    <h4 className="m-0 flex items-center justify-between px-1 text-[13px] font-semibold text-navy-950">
                      {workspace.nombre}
                      <small className="text-[13px] font-normal text-ink-muted">{modulesInWs.length}</small>
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      {modulesInWs.map((modulo) => {
                        const active = isActive(modulo.ruta);
                        return (
                          <Link
                            key={modulo.ruta}
                            href={modulo.ruta}
                            onClick={() => abrirHoja(false)}
                            aria-current={active ? "page" : undefined}
                            className={`flex min-h-[76px] flex-col items-center justify-center gap-1.5 rounded-xl border p-2 text-center transition-colors ${
                              active
                                ? "bg-navy-950 text-white border-navy-950"
                                : "bg-surface-alt/70 hover:bg-surface-alt text-ink border-line"
                            }`}
                          >
                            <ModuloIcon name={modulo.icono} className={`size-5 ${active ? "text-gold-400" : "text-navy-900"}`} />
                            <span className="line-clamp-2 text-[13px] font-semibold leading-tight">{modulo.nombre}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </section>
                );
              })}

              {extra}

              <div className="pt-2 border-t border-line flex items-center justify-between text-[13px] text-ink-muted">
                <span className="font-semibold text-navy-950">
                  Rol: {etiquetaRol}
                </span>
                <a
                  href="https://quisqueyahome.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 items-center gap-1 font-semibold text-navy-900"
                >
                  <ExternalLink className="size-3" />
                  Portal Web
                </a>
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* Global Command Palette modal */}
      <CommandPalette
        open={commandOpen}
        onOpenChange={setCommandOpen}
        modulosVisibles={modulosVisibles}
      />
    </>
  );
}
