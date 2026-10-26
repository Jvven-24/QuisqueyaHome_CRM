"use client";

import { WifiOff, AlertTriangle, RefreshCw } from "lucide-react";

/**
 * Alerta no destructiva para recuperación de fallos de red y validación en formularios (QA-01).
 * 
 * - Muestra un mensaje claro explicando que los datos ingresados no se han perdido.
 * - Provee un botón 'Reintentar envío' para reanudar el flujo en el mismo lugar.
 */
export function AlertaErrorFormulario({
  mensaje,
  esErrorRed = false,
  onReintentar,
  reintentando = false,
  disabled = false,
}: {
  mensaje: string;
  esErrorRed?: boolean;
  onReintentar?: () => void;
  reintentando?: boolean;
  disabled?: boolean;
}) {
  const estaDeshabilitado = reintentando || disabled;
  return (
    <div
      role="alert"
      className="span-2 rounded-xl border border-red-500/40 bg-red-500/10 p-3.5 text-xs text-red-800 animate-in fade-in"
    >
      <div className="flex items-start gap-2.5">
        {esErrorRed ? (
          <WifiOff className="size-4 shrink-0 text-red-600 mt-0.5" />
        ) : (
          <AlertTriangle className="size-4 shrink-0 text-red-600 mt-0.5" />
        )}
        <div className="flex-1 space-y-1">
          <strong className="block font-semibold text-red-900">
            {esErrorRed ? "Sin conexión o fallo de red" : "No se pudo completar el envío"}
          </strong>
          <p className="text-red-800 leading-relaxed m-0">{mensaje}</p>
          <p className="text-[11px] text-red-700 font-medium m-0">
            Tus datos ingresados se mantienen intactos. No necesitas volver a escribir nada.
          </p>
          {onReintentar && (
            <div className="pt-2">
              <button
                type="button"
                onClick={onReintentar}
                disabled={estaDeshabilitado}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 text-white font-semibold text-xs hover:bg-red-700 active:scale-98 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`size-3.5 ${reintentando ? "animate-spin" : ""}`} />
                {reintentando ? "Reintentando..." : "Reintentar envío"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
