import type { MouseEventHandler, ReactNode } from "react";

export type VariacionResumen = {
  valor: ReactNode;
  direccion: "sube" | "baja" | "estable";
  periodo?: string;
  etiquetaAccesible?: string;
};

type ResumenCompactoProps = {
  etiqueta: string;
  valor?: ReactNode;
  detalle?: ReactNode;
  variacion?: VariacionResumen;
  icono?: ReactNode;
  pie?: ReactNode;
  className?: string;
  valorClassName?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  pressed?: boolean;
};

const flecha = { sube: "↑", baja: "↓", estable: "→" } as const;

/** Tarjeta compacta para métricas autorizadas, legibles y sin desbordar en móvil. */
export function ResumenCompacto({
  etiqueta,
  valor,
  detalle,
  variacion,
  icono,
  pie,
  className = "",
  valorClassName = "",
  onClick,
  pressed,
}: ResumenCompactoProps) {
  const contenido = (
    <>
      <span className="flex min-w-0 items-start justify-between gap-2">
        <span className="line-clamp-2 min-w-0 text-[13px] font-semibold leading-[1.3] text-ink-muted dark:text-slate-300">{etiqueta}</span>
        {icono && <span aria-hidden="true" className="shrink-0">{icono}</span>}
      </span>
      {valor !== undefined && <strong className={`mt-1 block min-w-0 break-words font-heading text-[clamp(1.125rem,5vw,1.75rem)] font-bold leading-tight tabular-nums text-navy-950 [overflow-wrap:anywhere] dark:text-white ${valorClassName}`}>{valor}</strong>}
      {variacion && (
        <span className="mt-1 flex min-w-0 flex-wrap items-baseline gap-x-1 text-[13px] leading-snug text-ink-muted dark:text-slate-300">
          <span aria-hidden="true" className="font-bold text-navy-900 dark:text-gold-600">{flecha[variacion.direccion]}</span>
          <span>{variacion.etiquetaAccesible ?? "Variación"} {variacion.valor}</span>
          {variacion.periodo && <span>{variacion.periodo}</span>}
        </span>
      )}
      {detalle && <span className="mt-1 line-clamp-2 block min-w-0 break-words text-[13px] leading-snug text-ink-muted dark:text-slate-300">{detalle}</span>}
      {pie && <span className="mt-1 block">{pie}</span>}
    </>
  );

  const classes = `block min-h-24 min-w-0 overflow-hidden rounded-xl border border-line bg-surface p-3 text-left shadow-xs dark:border-navy-700 dark:bg-navy-950 sm:p-4 ${className}`;
  if (onClick) {
    return <button type="button" onClick={onClick} aria-pressed={pressed} className={`${classes} cursor-pointer transition-colors hover:border-gold-600/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-700 dark:focus-visible:outline-gold-400`}>{contenido}</button>;
  }
  return <article className={classes}>{contenido}</article>;
}
