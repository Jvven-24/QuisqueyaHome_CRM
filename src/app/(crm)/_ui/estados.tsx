"use client";

import type { ReactNode } from "react";

/**
 * 6 Estados de Interfaz Canónicos del CRM Quisqueya Home (D04/D05).
 *
 * 1. EstadoCarga: Skeleton tabular/card de 40px con aria-busy="true".
 * 2. Vacio: Módulo sin datos todavía (nunca se creó nada).
 * 3. SinResultados: Búsqueda o filtro sin coincidencias con botón limpiar y chips.
 * 4. EstadoError: Fallo de servidor o red con role="alert" y reintento.
 * 5. EstadoOffline: Aviso discreto cuando no hay conectividad.
 * 6. AvisoPermiso: Restricción explicada por rol RBAC con role="note".
 *
 * Se emplean SVGs inline limpios para evitar dependencias de resolución en tiempo
 * de ejecución (compatible con importación dinámica en memoria de tests Node.js).
 */

function InboxIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  );
}

function AlertCircleIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function RefreshCwIcon({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  );
}

function WifiOffIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="2" y1="2" x2="22" y2="22" />
      <path d="M12 20h.01" />
      <path d="M8.5 16.429a5 5 0 0 1 7 0" />
      <path d="M5 12.859a10 10 0 0 1 5.17-2.69" />
      <path d="M19 12.859a10 10 0 0 0-2.007-1.523" />
      <path d="M2 8.82a15 15 0 0 1 4.177-2.643" />
      <path d="M22 8.82a15 15 0 0 0-11.288-3.764" />
    </svg>
  );
}

function ShieldAlertIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function XIcon({ className = "size-3" }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

/** 1. Estado de Carga (Loading / Skeleton) */
export function EstadoCarga({
  filas = 5,
  tipo = "tabla",
}: {
  filas?: number;
  tipo?: "tabla" | "tarjeta" | "linea";
}) {
  if (tipo === "tarjeta") {
    return (
      <div
        className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 w-full"
        aria-busy="true"
        aria-live="polite"
      >
        {Array.from({ length: filas }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-border bg-card p-4 flex flex-col gap-3 skeleton-block"
          >
            <div className="skeleton-line h-4 w-2/3 skeleton" />
            <div className="skeleton-line h-3 w-1/2 skeleton" />
            <div className="skeleton-line h-8 w-full skeleton mt-2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className="w-full rounded-lg border border-border bg-card overflow-hidden skeleton-block"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="h-9 border-b border-border bg-muted/40 px-4 flex items-center">
        <div className="skeleton-line h-3.5 w-1/4 skeleton" />
      </div>
      <div className="divide-y divide-border/60">
        {Array.from({ length: filas }).map((_, i) => (
          <div key={i} className="h-10 px-4 flex items-center gap-4">
            <div className="skeleton-line h-3 w-1/3 skeleton" />
            <div className="skeleton-line h-3 w-1/4 skeleton ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** 2. Estado Vacío (Empty State - Nunca se creó nada) */
export function Vacio({
  titulo,
  texto,
  accion,
  icono,
}: {
  titulo: string;
  texto: string;
  accion?: ReactNode;
  icono?: ReactNode;
}) {
  return (
    <div className="empty rounded-lg border border-dashed border-border bg-card p-8 sm:p-12 text-center flex flex-col items-center justify-center">
      <div className="size-11 rounded-lg bg-surface-alt border border-border flex items-center justify-center text-muted-foreground mb-3">
        {icono ?? <InboxIcon className="size-5" />}
      </div>
      <strong className="text-base font-bold text-navy-950 block">{titulo}</strong>
      <p className="text-xs text-muted-foreground mt-1 mb-4 max-w-md leading-relaxed">{texto}</p>
      {accion && <div className="mt-1">{accion}</div>}
    </div>
  );
}

/** 3. Sin Resultados (Filtro o búsqueda sin coincidencias) */
export function SinResultados({
  texto = "Ajusta la búsqueda o los filtros para ver más resultados.",
  onLimpiar,
  accion,
  chips,
  onQuitarChip,
}: {
  texto?: string;
  onLimpiar?: () => void;
  accion?: ReactNode;
  chips?: readonly string[];
  onQuitarChip?: (chip: string) => void;
}) {
  return (
    <div className="empty flex flex-col items-center justify-center p-8 sm:p-10 text-center rounded-lg border border-dashed border-border bg-card animate-in fade-in duration-150">
      <strong className="text-sm sm:text-base font-bold text-navy-950 block">Sin resultados</strong>
      <p className="text-xs text-muted-foreground mt-1 mb-3 max-w-md">{texto}</p>

      {/* Chips activos si existen */}
      {chips && chips.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-1.5 mb-4 max-w-md">
          {chips.map((chip) => (
            <span
              key={chip}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-surface-alt border border-border text-slate-800"
            >
              {chip}
              {onQuitarChip && (
                <button
                  type="button"
                  onClick={() => onQuitarChip(chip)}
                  className="hover:text-navy-950 text-slate-400 cursor-pointer"
                  aria-label={`Quitar filtro ${chip}`}
                >
                  <XIcon className="size-3" />
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {accion ? (
        accion
      ) : onLimpiar ? (
        <button
          type="button"
          onClick={onLimpiar}
          className="button secondary text-xs font-semibold px-3 py-1.5 min-h-[32px] rounded-md cursor-pointer"
        >
          Limpiar filtros
        </button>
      ) : null}
    </div>
  );
}

/** 4. Estado de Error (Error View con reintento) */
export function EstadoError({
  error,
  reset,
  onReintentar,
  titulo = "No se pudieron cargar los datos",
  mensaje,
  codigo,
}: {
  error?: Error | { message?: string; digest?: string };
  reset?: () => void;
  onReintentar?: () => void;
  titulo?: string;
  mensaje?: string;
  codigo?: string;
}) {
  const handlerReintento = onReintentar ?? reset;
  const textoMensaje =
    mensaje ??
    error?.message ??
    "Ocurrió un error inesperado al consultar el servidor. Por favor, reintenta.";
  const digest = codigo ?? (error && "digest" in error ? (error.digest as string) : undefined);

  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center p-8 sm:p-10 text-center rounded-lg border border-danger/30 bg-danger-bg/40 animate-in fade-in duration-150"
    >
      <div className="size-10 rounded-full bg-danger/10 text-danger flex items-center justify-center mb-3">
        <AlertCircleIcon className="size-5" />
      </div>
      <strong className="text-sm sm:text-base font-bold text-navy-950 block">{titulo}</strong>
      <p className="text-xs text-muted-foreground mt-1 mb-4 max-w-md leading-relaxed">
        {textoMensaje}
      </p>

      {digest && (
        <code className="text-[10px] font-mono text-muted-foreground bg-surface px-2 py-0.5 rounded border border-border mb-4">
          Código: {digest}
        </code>
      )}

      {handlerReintento && (
        <button
          type="button"
          onClick={handlerReintento}
          className="button secondary min-h-[48px] px-4 font-semibold text-xs rounded-md inline-flex items-center gap-2 cursor-pointer"
        >
          <RefreshCwIcon className="size-3.5" />
          <span>Reintentar</span>
        </button>
      )}
    </div>
  );
}

/** 5. Estado Fuera de Línea (Offline) */
export function EstadoOffline({
  mensaje = "No hay conexión con el servidor. Verifica tu conexión de red.",
  onReconectar,
}: {
  mensaje?: string;
  onReconectar?: () => void;
}) {
  return (
    <div
      role="status"
      className="flex items-center justify-between gap-3 p-3.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 text-xs mb-4"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <WifiOffIcon className="size-4 text-amber-700 shrink-0" />
        <span className="font-medium truncate">{mensaje}</span>
      </div>
      {onReconectar && (
        <button
          type="button"
          onClick={onReconectar}
          className="shrink-0 text-xs font-bold text-amber-950 hover:underline cursor-pointer"
        >
          Reconectar
        </button>
      )}
    </div>
  );
}

/** 6. Aviso de Permiso (RBAC Restriction) */
export function AvisoPermiso({
  titulo = "Acción no disponible para tu rol",
  motivo,
}: {
  titulo?: string;
  motivo: string;
}) {
  return (
    <div className="permission-note flex items-start gap-2.5 p-3 rounded-lg border border-border bg-surface-alt" role="note">
      <ShieldAlertIcon className="size-4 text-gold-600 shrink-0 mt-0.5" />
      <div className="min-w-0 flex-1">
        <strong className="text-xs font-bold text-navy-950 block">{titulo}</strong>
        <p className="text-xs text-muted-foreground m-0 mt-0.5">{motivo}</p>
      </div>
    </div>
  );
}
