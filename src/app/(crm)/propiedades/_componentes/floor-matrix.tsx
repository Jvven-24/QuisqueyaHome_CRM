"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { units } from "@/infrastructure/db/schema";
import { publicInventoryCsv } from "../presentacion";
import { UNIT_STATUSES } from "@/domain/catalogs";
import {
  Download,
  Grid2X2,
  Grid3X3,
  Layers,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";
import { Combobox } from "@/components/ui/combobox";

type Unit = typeof units.$inferSelect;

const LABELS: Record<string, string> = {
  available: "Disponible",
  reserved: "Reservada",
  sold: "Vendida",
  unavailable: "No disponible",
};

interface ToneStyle {
  card: string;
  badge: string;
  dot: string;
}

const DEFAULT_TONE: ToneStyle = {
  card: "border-emerald-300 bg-emerald-50/20 hover:border-emerald-500 hover:bg-emerald-50/40 text-emerald-950",
  badge: "bg-emerald-100 text-emerald-800 border-emerald-300",
  dot: "bg-emerald-500",
};

const TONES: Record<string, ToneStyle> = {
  available: DEFAULT_TONE,
  reserved: {
    card: "border-gold-300 bg-gold-50/25 hover:border-gold-500 hover:bg-gold-50/50 text-gold-950",
    badge: "bg-gold-100 text-gold-800 border-gold-300",
    dot: "bg-gold-600",
  },
  sold: {
    card: "border-line bg-surface-alt/70 hover:border-slate-400 hover:bg-surface text-slate-800 opacity-90",
    badge: "bg-slate-200 text-slate-700 border-slate-300",
    dot: "bg-slate-400",
  },
  unavailable: {
    card: "border-rose-300 bg-rose-50/20 hover:border-rose-400 hover:bg-rose-50/40 text-rose-950",
    badge: "bg-rose-100 text-rose-800 border-rose-300",
    dot: "bg-rose-500",
  },
};

/**
 * Matriz de Inventario por Piso (Cuadrícula 4×4 Adaptable).
 *
 * Optimizada para:
 * - Escritorio: Cuadrícula de 4 columnas (4×4) con tarjetas detalladas.
 * - Tableta: 3 a 4 columnas proporcionales con áreas táctiles ≥ 44px.
 * - Móvil: 2 columnas compactas y ergonómicas sin desbordamiento.
 */
export function FloorMatrix({
  units: rows,
  onInspect,
}: {
  units: Unit[];
  onInspect: (unit: Unit) => void;
}) {
  const [floor, setFloor] = useState("all");
  const [status, setStatus] = useState("all");
  const [gridColumns, setGridColumns] = useState<"4x4" | "compact">("4x4");
  const router = useRouter();

  const levels = useMemo(
    () =>
      Array.from(new Set(rows.map((unit) => unit.floorLevel))).sort((a, b) =>
        a == null ? 1 : b == null ? -1 : b - a
      ),
    [rows]
  );

  const filtered = useMemo(
    () =>
      rows.filter(
        (unit) =>
          (floor === "all" || String(unit.floorLevel) === floor) &&
          (status === "all" || unit.status === status)
      ),
    [rows, floor, status]
  );

  // Conteo por estado para los badges rápidos
  const conteoDisponibles = rows.filter((u) => u.status === "available").length;
  const conteoReservadas = rows.filter((u) => u.status === "reserved").length;
  const conteoVendidas = rows.filter((u) => u.status === "sold").length;

  function exportSnapshot() {
    const now = new Date();
    const url = URL.createObjectURL(
      new Blob(["\uFEFF" + publicInventoryCsv(filtered, now.toISOString())], {
        type: "text/csv;charset=utf-8",
      })
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "inventario-publico-" + now.toISOString().slice(0, 10) + ".csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  // Opciones para Combobox de pisos
  const floorOptions = useMemo(
    () => [
      { value: "all", label: `Todos los pisos (${levels.length})` },
      ...levels.map((level) => ({
        value: String(level),
        label: level == null ? "Sin piso registrado" : `Piso ${level}`,
        badge: `${rows.filter((u) => u.floorLevel === level).length} u.`,
      })),
    ],
    [levels, rows]
  );

  // Opciones para Combobox de estados
  const statusOptions = useMemo(
    () => [
      { value: "all", label: `Todos los estados (${rows.length})` },
      ...UNIT_STATUSES.map((value) => ({
        value,
        label: LABELS[value] ?? value,
        badge: `${rows.filter((u) => u.status === value).length} u.`,
      })),
    ],
    [rows]
  );

  return (
    <section className="rounded-2xl border border-line bg-surface p-4 sm:p-6 min-w-0 shadow-2xs space-y-5">
      {/* Cabecera de la matriz */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-navy-950 text-gold-400 border border-gold-500/30">
              <Layers className="size-4" />
            </span>
            <h2 className="text-xl font-heading font-bold text-navy-950 m-0">
              Matriz de inventario por piso
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-surface-alt border border-line text-ink tabular-nums">
              {filtered.length} de {rows.length} unidades
            </span>
          </div>
          <p className="text-xs sm:text-[13px] text-ink-muted mt-1 m-0">
            Fuente: unidades registradas en base de datos. Sin suscripción en vivo ni catálogo de torres.
          </p>
        </div>

        {/* Acciones principales */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Selector de cuadrícula 4x4 vs compacta */}
          <div className="inline-flex rounded-lg border border-line bg-surface-alt p-0.5">
            <button
              type="button"
              onClick={() => setGridColumns("4x4")}
              aria-pressed={gridColumns === "4x4"}
              title="Cuadrícula 4×4 amplia"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-md text-xs font-bold transition-all cursor-pointer ${
                gridColumns === "4x4"
                  ? "bg-navy-950 text-white shadow-2xs"
                  : "text-muted-foreground hover:text-ink"
              }`}
            >
              <Grid2X2 className="size-3.5 text-gold-400" />
              <span>4×4</span>
            </button>
            <button
              type="button"
              onClick={() => setGridColumns("compact")}
              aria-pressed={gridColumns === "compact"}
              title="Cuadrícula compacta"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-md text-xs font-bold transition-all cursor-pointer ${
                gridColumns === "compact"
                  ? "bg-navy-950 text-white shadow-2xs"
                  : "text-muted-foreground hover:text-ink"
              }`}
            >
              <Grid3X3 className="size-3.5" />
              <span>Compacta</span>
            </button>
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 rounded-lg border border-line bg-surface hover:bg-surface-alt text-ink text-xs sm:text-[13px] font-semibold transition-colors cursor-pointer"
            onClick={() => router.refresh()}
          >
            <RefreshCw className="size-3.5 text-muted-foreground" />
            <span>Refrescar inventario</span>
          </button>

          <button
            type="button"
            className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 rounded-lg border border-emerald-500/40 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 text-xs sm:text-[13px] font-bold transition-colors cursor-pointer disabled:opacity-50"
            onClick={exportSnapshot}
            disabled={!filtered.length}
          >
            <Download className="size-3.5 text-emerald-700" />
            <span>Exportar snapshot público</span>
          </button>
        </div>
      </header>

      {/* Franja de filtros rápidos y comboboxes */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-surface-alt/70 p-3.5 rounded-xl border border-line">
        <div className="sm:col-span-6 md:col-span-5">
          <label className="block text-xs font-bold text-ink mb-1">
            Filtrar por nivel de piso
          </label>
          <Combobox
            options={floorOptions}
            value={floor}
            onChange={setFloor}
            placeholder="Todos los pisos"
            size="sm"
          />
        </div>

        <div className="sm:col-span-6 md:col-span-5">
          <label className="block text-xs font-bold text-ink mb-1">
            Filtrar por disponibilidad
          </label>
          <Combobox
            options={statusOptions}
            value={status}
            onChange={setStatus}
            placeholder="Todos los estados"
            size="sm"
          />
        </div>

        <div className="sm:col-span-12 md:col-span-2 flex items-end">
          {(floor !== "all" || status !== "all") && (
            <button
              type="button"
              onClick={() => {
                setFloor("all");
                setStatus("all");
              }}
              className="w-full min-h-[38px] px-3 rounded-lg border border-gold-300 bg-gold-50 hover:bg-gold-100 text-gold-900 text-xs font-bold transition-colors cursor-pointer"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Leyenda visual de estados */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-y border-line/60 py-2.5 px-1">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-bold text-ink flex items-center gap-1.5">
            <SlidersHorizontal className="size-3.5 text-gold-700" />
            Leyenda de inventario:
          </span>
          <span className="inline-flex items-center gap-1.5 text-emerald-800 font-semibold">
            <span className="size-2.5 rounded-full bg-emerald-500" />
            Disponible ({conteoDisponibles})
          </span>
          <span className="inline-flex items-center gap-1.5 text-gold-800 font-semibold">
            <span className="size-2.5 rounded-full bg-gold-600" />
            Reservada ({conteoReservadas})
          </span>
          <span className="inline-flex items-center gap-1.5 text-slate-700 font-semibold">
            <span className="size-2.5 rounded-full bg-slate-400" />
            Vendida ({conteoVendidas})
          </span>
          <span className="inline-flex items-center gap-1.5 text-rose-800 font-semibold">
            <span className="size-2.5 rounded-full bg-rose-500" />
            No disponible
          </span>
        </div>
        <span className="text-[11px] text-muted-foreground hidden lg:inline">
          No se infiere torre ni piso del código de unidad.
        </span>
      </div>

      {/* Renderizado de unidades por piso */}
      {!filtered.length ? (
        <div className="p-8 text-center rounded-xl border border-line bg-surface-alt/50 space-y-2">
          <p role="status" className="text-sm font-semibold text-ink m-0">
            No hay unidades para los filtros de piso y disponibilidad seleccionados.
          </p>
          <p className="text-xs text-muted-foreground m-0">
            Prueba seleccionando otro piso o restableciendo los estados.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {levels.map((level) => {
            const group = filtered.filter((unit) => unit.floorLevel === level);
            if (!group.length) return null;

            const gridClass =
              gridColumns === "4x4"
                ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-4 gap-3.5"
                : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5";

            return (
              <div key={String(level)} className="space-y-2.5">
                <div className="flex items-center justify-between border-b border-line/80 pb-1.5">
                  <h3 className="text-sm font-heading font-bold text-navy-950 flex items-center gap-2 m-0">
                    <span className="size-2 rounded-full bg-gold-600" />
                    <span>{level == null ? "Piso sin registrar" : `Piso ${level}`}</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      ({group.length} unidad{group.length === 1 ? "" : "es"})
                    </span>
                  </h3>
                </div>

                {/* Cuadrícula de tarjetas de unidades (4x4 en desktop, adaptada a tablet y móvil) */}
                <div className={gridClass}>
                  {group.map((unit) => {
                    const tone: ToneStyle = TONES[unit.status] ?? DEFAULT_TONE;
                    const label = LABELS[unit.status] ?? "Por confirmar";

                    return (
                      <button
                        key={unit.id}
                        type="button"
                        onClick={() => onInspect(unit)}
                        className={`text-left rounded-xl border p-3.5 transition-all cursor-pointer flex flex-col justify-between gap-2.5 shadow-2xs hover:shadow-md min-h-[96px] ${tone.card}`}
                        aria-label={`Abrir ficha de unidad ${unit.code}`}
                      >
                        <div className="flex items-start justify-between gap-1.5 w-full">
                          <strong className="font-heading font-extrabold text-base sm:text-lg tracking-tight block">
                            {unit.code}
                          </strong>
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${tone.badge}`}
                          >
                            <span className={`size-1.5 rounded-full ${tone.dot}`} />
                            {label}
                          </span>
                        </div>

                        <div className="space-y-1 text-xs">
                          {unit.unitType && (
                            <div className="text-[12px] font-medium opacity-85 truncate">
                              {unit.unitType}
                            </div>
                          )}

                          <div className="flex items-center justify-between gap-1 text-[11.5px] opacity-75 tabular-nums">
                            <span>
                              {unit.bedrooms != null ? `${unit.bedrooms} hab.` : "—"}
                              {unit.builtAreaM2 != null ? ` · ${unit.builtAreaM2} m²` : ""}
                            </span>
                            <span className="font-mono text-[10.5px]">v{unit.rowVersion}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Nota explicativa de permisos y seguridad */}
      <p role="note" className="text-xs text-muted-foreground mt-4 leading-relaxed border-t border-line pt-3 m-0">
        Abre una unidad para consultar holds y caducidad cuando tu permiso lo permita. La matriz muestra un snapshot, no una suscripción en vivo. El estado registrado no autoriza una nueva reserva ni revela quién bloqueó una unidad.
      </p>
    </section>
  );
}
