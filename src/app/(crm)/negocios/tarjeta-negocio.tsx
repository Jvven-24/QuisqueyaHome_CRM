"use client";

import { ArrowRightLeft, Building2, Calendar, ChevronDown, Clock, MessageCircle } from "lucide-react";
import { generarEnlaceWhatsApp } from "@/domain/comunicaciones";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatearMonto } from "../_ui/formato";
import { Avatar, Badge } from "../_ui/prototipo-ui";
import { calcularAntiguedad, tipoAntiguedad } from "./antiguedad";
import type { Etapa, NegocioFila } from "./logica";

const formateadorFecha = new Intl.DateTimeFormat("es-DO", { day: "2-digit", month: "short" });

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
  arrastrable,
  onVerFicha,
  onMover,
}: {
  negocio: NegocioFila;
  etapas: Etapa[];
  ocupado: boolean;
  sinConexion: boolean;
  puedeMover: boolean;
  arrastrable: boolean;
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

  return (
    <article
      className="deal-card"
      draggable={arrastrable && !ocupado && !sinConexion}
      onDragStart={(event) => event.dataTransfer.setData("dealId", String(negocio.id))}
      aria-label={`Negocio de ${negocio.contactName}`}
    >
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onVerFicha}
          aria-label={`Abrir ficha del negocio de ${negocio.contactName}`}
          className="min-h-12 min-w-12 inline-flex items-center text-left text-sm font-bold text-navy-950 hover:text-gold-700 cursor-pointer rounded focus-visible:outline-2 focus-visible:outline-gold-700"
        >
          <span className="line-clamp-2">{negocio.contactName}</span>
        </button>
        <span className="shrink-0 rounded border border-line bg-surface-alt px-1.5 py-0.5 text-[13px] font-semibold text-ink-muted">
          {negocio.sourceName ?? "Directo"}
        </span>
      </div>

      <div className="flex items-center gap-1.5 text-[13px] font-medium text-ink-muted">
        <Building2 className="size-4 shrink-0 text-gold-700" aria-hidden="true" />
        <span className="truncate">
          {negocio.proyectoPrincipal?.projectName ?? "Interés general"}
          {negocio.proyectoPrincipal?.unitCode ? ` · Unidad ${negocio.proyectoPrincipal.unitCode}` : ""}
        </span>
      </div>

      <div className="flex items-baseline justify-between gap-2">
        {negocio.amountCents !== undefined ? (
          <span className="font-heading text-sm font-extrabold text-navy-900">
            {formatearMonto(negocio.amountCents, negocio.currency)}
            {negocio.operationType === "rent" && <span className="ml-1 text-[13px] font-semibold text-ink-muted">alquiler</span>}
          </span>
        ) : <span />}
        <span
          className={
            tipo === "dias"
              ? "inline-flex items-center gap-1 text-[13px] font-medium text-ink"
              : "inline-flex items-center gap-1 rounded border border-dashed border-input-line bg-surface-alt px-1.5 py-0.5 text-[13px] italic text-ink-muted"
          }
          title={tipo === "dias" ? `En esta etapa: ${antiguedad}` : antiguedad}
        >
          <Clock className="size-3.5" aria-hidden="true" />
          <span>{antiguedad}</span>
        </span>
      </div>

      <div className="flex items-center gap-1.5 rounded-md border border-line bg-surface-alt px-2.5 py-1.5 text-[13px] text-ink">
        <Calendar className="size-4 shrink-0 text-gold-700" aria-hidden="true" />
        <span className="truncate font-medium">
          {negocio.nextActivityTitle ? `${negocio.nextActivityTitle}${proximaFecha ? ` · ${proximaFecha}` : ""}` : "Sin próxima acción"}
        </span>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <Avatar name={negocio.brokerName ?? "Sin asignar"} small />
          <span className="max-w-[110px] truncate text-[13px] font-semibold text-ink">
            {negocio.brokerName?.split(" ")[0] ?? "Sin asignar"}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {enlaceWa && (
            <a
              href={enlaceWa}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 min-w-12 items-center justify-center gap-1 rounded-lg border border-success/40 bg-success-bg px-2.5 text-[13px] font-bold text-success"
              aria-label={`Contactar a ${negocio.contactName} por WhatsApp`}
            >
              <MessageCircle className="size-4 shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>
          )}
          {abierto && puedeMover && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  disabled={ocupado || sinConexion}
                  aria-label={`Mover el negocio de ${negocio.contactName} a otra etapa`}
                  className="inline-flex min-h-12 min-w-12 items-center justify-center gap-1.5 rounded-lg border border-input-line bg-surface px-3 text-[13px] font-semibold text-navy-900 hover:bg-navy-100 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <ArrowRightLeft className="size-4 shrink-0 text-gold-700" aria-hidden="true" />
                  <span>Mover a…</span>
                  <ChevronDown className="size-3.5 text-ink-muted" aria-hidden="true" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {etapas.map((etapa) => {
                  const actual = etapa.id === negocio.stageId;
                  return (
                    <DropdownMenuItem
                      key={etapa.id}
                      disabled={actual}
                      onSelect={() => onMover(etapa.id)}
                      className="min-h-12 cursor-pointer justify-between px-3 text-[13px]"
                    >
                      <span>{etapa.name}</span>
                      {actual && <Badge tone="neutral">Actual</Badge>}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </footer>
    </article>
  );
}
