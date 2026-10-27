"use client";

import type { CSSProperties, HTMLAttributes, ReactNode, Ref } from "react";
import { ArrowRightLeft, Building2, Calendar, ChevronDown, Clock, Loader2, MessageCircle, Percent } from "lucide-react";
import { generarEnlaceWhatsApp } from "@/domain/comunicaciones";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatearMonto } from "../_ui/formato";
import { Avatar, Badge } from "../_ui/prototipo-ui";
import { calcularAntiguedad, tipoAntiguedad } from "./antiguedad";
import type { EstadoPendiente } from "./kanban-estado";
import type { Etapa, NegocioFila } from "./logica";
import { PREFERENCIAS_INICIALES, type CampoTarjeta } from "./preferencias";

const formateadorFecha = new Intl.DateTimeFormat("es-DO", { day: "2-digit", month: "short" });

/** Marca para que el arrastre no se active desde botones y enlaces de la tarjeta. */
export const SIN_ARRASTRE = { "data-sin-arrastre": "" } as const;

export type PropsArrastre = {
  ref?: Ref<HTMLElement>;
  style?: CSSProperties;
  eventos?: HTMLAttributes<HTMLElement>;
  /** Asa accesible por teclado (Espacio/Intro) que inicia el arrastre. */
  asa?: ReactNode;
  /** Hueco que deja la tarjeta en su sitio mientras se arrastra. */
  fantasma?: boolean;
};

/**
 * Tarjeta de un negocio en el tablero (escritorio y móvil: es la misma pieza).
 * - Un solo punto de foco por acción; todos los controles miden >= 48 px.
 * - «Mover a…» es un menú accesible con teclado: el arrastre es opcional.
 * - «Sin fecha de etapa» se pinta distinto de una antigüedad real (p. ej. «Hoy»).
 * - Monto: solo si el DTO del rol lo trae; nunca se rellena con «0».
 */
export function TarjetaNegocio({
  negocio,
  etapas,
  ocupado,
  sinConexion,
  puedeMover,
  campos = PREFERENCIAS_INICIALES.tarjeta,
  compacta = false,
  pendiente,
  levantada = false,
  arrastre,
  onVerFicha,
  onMover,
}: {
  negocio: NegocioFila;
  etapas: Etapa[];
  ocupado: boolean;
  sinConexion: boolean;
  puedeMover: boolean;
  campos?: Record<CampoTarjeta, boolean>;
  compacta?: boolean;
  pendiente?: EstadoPendiente;
  /** Copia que sigue al puntero (DragOverlay). */
  levantada?: boolean;
  arrastre?: PropsArrastre;
  onVerFicha: () => void;
  onMover: (etapaId: number) => void;
}) {
  const enlaceWa = negocio.contactPhone
    ? generarEnlaceWhatsApp(
        negocio.contactPhone,
        `Hola ${negocio.contactName}, le saludo de Quisqueya Home en relación a su interés en ${negocio.proyectoPrincipal?.projectName ?? "proyectos en RD"}.`,
      )
    : null;
  const abierto = negocio.stageKind === "open";
  const tipo = tipoAntiguedad(negocio.stageChangedAt);
  const antiguedad = calcularAntiguedad(negocio.stageChangedAt);
  const proximaFecha = negocio.nextActivityStartsAt ? formateadorFecha.format(new Date(negocio.nextActivityStartsAt)) : null;
  const enCurso = pendiente === "enviando" || pendiente === "dialogo";
  const bloqueado = ocupado || sinConexion || enCurso;

  const clases = [
    "deal-card group/tarjeta relative",
    "transition-[border-color,box-shadow,opacity] duration-150",
    compacta ? "gap-1.5! py-2.5!" : "",
    arrastre?.fantasma ? "border-dashed! border-gold-600! bg-gold-50/40! opacity-60 shadow-none!" : "",
    levantada ? "cursor-grabbing! border-gold-600! shadow-[0_18px_40px_-12px_rgba(16,23,45,0.35)]! ring-1 ring-gold-600/40 rotate-[1.2deg]" : "",
    enCurso ? "border-gold-600/70!" : "",
  ].join(" ");

  return (
    <article
      ref={arrastre?.ref}
      style={arrastre?.style}
      {...arrastre?.eventos}
      className={clases}
      aria-label={`Negocio de ${negocio.contactName}`}
      aria-busy={pendiente === "enviando" || undefined}
      data-pendiente={pendiente}
    >
      <div className="flex items-start justify-between gap-1.5">
        <div className="flex min-w-0 items-start gap-0.5">
          {arrastre?.asa}
          <button
            type="button"
            {...SIN_ARRASTRE}
            onClick={onVerFicha}
            aria-label={`Abrir ficha del negocio de ${negocio.contactName}`}
            className="min-h-12 min-w-12 inline-flex items-center text-left text-sm font-bold text-navy-950 hover:text-gold-700 cursor-pointer rounded focus-visible:outline-2 focus-visible:outline-gold-700 transition-colors"
          >
            <span className="line-clamp-2 font-heading">{negocio.contactName}</span>
          </button>
        </div>
        {campos.origen && (
          <span className="mt-3 shrink-0 rounded-full border border-line bg-surface-alt px-2.5 py-0.5 text-[13px] font-semibold text-ink-muted">
            {negocio.sourceName ?? "Directo"}
          </span>
        )}
      </div>

      {pendiente && pendiente !== "confirmado" && (
        <p role="status" className="m-0 inline-flex w-fit items-center gap-1.5 rounded-md border border-gold-300 bg-gold-50 px-2 py-0.5 text-[13px] font-semibold text-gold-900">
          {pendiente === "enviando" ? <Loader2 className="size-3.5 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Clock className="size-3.5" aria-hidden="true" />}
          {pendiente === "enviando" ? "Guardando el cambio…" : "Pendiente de confirmar"}
        </p>
      )}

      {campos.proyecto && (
        <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-line bg-surface-alt/70 px-2.5 py-1.5 text-[13px] font-medium text-navy-950">
          <Building2 className="size-4 shrink-0 text-gold-700" aria-hidden="true" />
          <span className="min-w-0 break-words font-semibold text-navy-950">
            {negocio.proyectoPrincipal?.projectName ?? "Interés general"}
          </span>
          {negocio.proyectoPrincipal?.unitCode && (
            <span className="shrink-0 rounded bg-gold-100 border border-gold-300 px-1.5 py-0.5 text-[13px] font-bold text-gold-900 tabular-nums">
              Unidad {negocio.proyectoPrincipal.unitCode}
            </span>
          )}
        </div>
      )}

      {(campos.monto || campos.antiguedad || campos.probabilidad) && (
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          {campos.monto && negocio.amountCents !== undefined ? (
            <span className="font-heading text-base font-extrabold tabular-nums text-navy-950">
              {formatearMonto(negocio.amountCents, negocio.currency)}
              {negocio.operationType === "rent" && <span className="ml-1 text-[13px] font-semibold text-ink-muted">alquiler</span>}
            </span>
          ) : <span />}
          <span className="flex flex-wrap items-center gap-1.5">
            {campos.probabilidad && (
              <span className="inline-flex items-center gap-1 rounded-md border border-line bg-surface px-2 py-0.5 text-[13px] font-semibold tabular-nums text-ink" title="Probabilidad de cierre">
                <Percent className="size-3.5 text-ink-muted" aria-hidden="true" />
                <span>{negocio.probability !== null ? `${negocio.probability}%` : "Sin dato"}</span>
              </span>
            )}
            {campos.antiguedad && (
              <span
                className={
                  tipo === "dias"
                    ? "inline-flex items-center gap-1 rounded-md border border-line bg-surface px-2 py-0.5 text-[13px] font-semibold tabular-nums text-ink"
                    : "inline-flex items-center gap-1 rounded-md border border-dashed border-input-line bg-surface-alt px-2 py-0.5 text-[13px] italic text-ink-muted"
                }
                title={tipo === "dias" ? `En esta etapa: ${antiguedad}` : antiguedad}
              >
                <Clock className="size-3.5 text-ink-muted" aria-hidden="true" />
                <span>{antiguedad}</span>
              </span>
            )}
          </span>
        </div>
      )}

      {campos.proxima && (
        <div className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[13px] ${negocio.nextActivityTitle ? "border-line bg-surface-alt/80 text-ink" : abierto ? "border-warning/40 bg-warning-bg text-warning" : "border-line bg-surface-alt/80 text-ink-muted"}`}>
          <Calendar className="size-4 shrink-0" aria-hidden="true" />
          <span className="truncate font-medium">
            {negocio.nextActivityTitle ? `${negocio.nextActivityTitle}${proximaFecha ? ` · ${proximaFecha}` : ""}` : "Sin próxima acción"}
          </span>
        </div>
      )}

      {!levantada && (
        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-2.5 mt-1">
          {campos.broker && (
            <div className="flex min-w-0 items-center gap-2">
              <Avatar name={negocio.brokerName ?? "Sin asignar"} small />
              <div className="flex flex-col min-w-0">
                <span className="max-w-[140px] truncate text-[13px] font-bold text-navy-950 leading-tight">
                  {negocio.brokerName?.split(" ")[0] ?? "Sin asignar"}
                </span>
                <span className="text-[13px] text-ink-muted leading-none">Broker</span>
              </div>
            </div>
          )}
          <div className="flex w-full flex-wrap items-center gap-2">
            {enlaceWa && (
              <a
                href={enlaceWa}
                {...SIN_ARRASTRE}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 min-w-12 items-center justify-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 text-[13px] font-bold text-emerald-800 hover:bg-emerald-100 transition-colors"
                aria-label={`Contactar a ${negocio.contactName} por WhatsApp`}
              >
                <MessageCircle className="size-4 shrink-0 text-emerald-600" aria-hidden="true" />
                <span className="hidden sm:inline">WhatsApp</span>
              </a>
            )}
            {abierto && puedeMover && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    {...SIN_ARRASTRE}
                    disabled={bloqueado}
                    aria-label={`Mover el negocio de ${negocio.contactName} a otra etapa`}
                    className="inline-flex shrink-0 min-h-12 min-w-12 items-center justify-center gap-1.5 rounded-xl border border-input-line bg-surface px-3 text-[13px] font-bold text-navy-950 hover:bg-navy-100 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
                  >
                    <ArrowRightLeft className="size-4 shrink-0 text-gold-700" aria-hidden="true" />
                    <span className="whitespace-nowrap">Mover a etapa</span>
                    <ChevronDown className="size-3.5 text-ink-muted" aria-hidden="true" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel className="text-[13px] text-ink-muted">Mover a…</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {etapas.filter(etapa => etapa.isActive !== false).map((etapa) => {
                    const actual = etapa.id === negocio.stageId;
                    return (
                      <DropdownMenuItem
                        key={etapa.id}
                        disabled={actual}
                        onSelect={() => onMover(etapa.id)}
                        className="min-h-12 cursor-pointer justify-between gap-2 px-3 text-[13px] font-medium"
                      >
                        <span className="flex flex-col">
                          <span>{etapa.name}</span>
                          {etapa.kind === "won" && <span className="text-[13px] text-ink-muted">Pide unidad y monto</span>}
                          {etapa.kind === "lost" && <span className="text-[13px] text-ink-muted">Pide motivo y comentario</span>}
                        </span>
                        {actual && <Badge tone="neutral">Actual</Badge>}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </footer>
      )}
    </article>
  );
}
