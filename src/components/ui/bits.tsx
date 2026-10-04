import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { TONE, type Tone } from "./tone";

/** Insignia/Badge de estado refinada para Quisqueya Home CRM. */
export function Insignia({
  texto,
  tono = "neutral",
  punto = true,
  className,
}: {
  texto: string;
  tono?: Tone;
  punto?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-bold border transition-all",
        TONE[tono].soft,
        className
      )}
    >
      {punto && (
        <span
          className={cn("size-1.5 rounded-full ring-2 ring-white/60 animate-pulse", TONE[tono].solid)}
          aria-hidden="true"
        />
      )}
      {texto}
    </span>
  );
}

type Aspecto = "primario" | "normal" | "suave" | "peligro" | "dorado";

const ASPECTO: Record<Aspecto, string> = {
  primario: "bg-navy-950 text-white hover:bg-navy-900 shadow-xs hover:shadow-md active:scale-[0.98] disabled:bg-slate-400",
  dorado: "bg-gold-500 text-navy-950 font-bold hover:bg-gold-400 shadow-xs hover:shadow-md active:scale-[0.98] disabled:bg-amber-200",
  normal: "border border-border bg-white text-navy-950 hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98] shadow-2xs hover:shadow-xs",
  suave: "bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-[0.98]",
  peligro: "border border-rose-200 bg-white text-rose-700 hover:bg-rose-50 active:scale-[0.98]",
};

/**
 * Botón con micro-animación y estado ocupado accesible.
 */
export function Boton({
  aspecto = "normal",
  ocupado,
  icono,
  children,
  className,
  ...props
}: {
  aspecto?: Aspecto;
  ocupado?: boolean;
  icono?: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      disabled={ocupado || props.disabled}
      className={cn(
        "inline-flex min-h-[38px] items-center justify-center gap-2 rounded-xl px-4 text-[13px] font-bold transition-all disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer select-none",
        ASPECTO[aspecto],
        className
      )}
      {...props}
    >
      {ocupado ? <Loader2 size={15} className="animate-spin" /> : icono}
      {children}
    </button>
  );
}

/** Aviso contextual dentro de paneles y formularios. */
export function Nota({
  tono = "info",
  titulo,
  children,
  className,
}: {
  tono?: Tone;
  titulo?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("rounded-xl px-4 py-3 text-[12.5px] leading-relaxed border", TONE[tono].soft, className)}
      role={tono === "danger" ? "alert" : "status"}
    >
      {titulo && <strong className="mb-0.5 block text-[13px] font-bold">{titulo}</strong>}
      {children}
    </div>
  );
}
