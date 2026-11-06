"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useOnline } from "../../_ui/analytics-state";
import type { PreviewDefinition, PreviewRow } from "../_ejemplo";
import { Combobox } from "@/components/ui/combobox";
import {
  AlertCircle,
  ChevronRight,
  Eye,
  FileText,
  Search,
  Sparkles,
  WifiOff,
  X,
} from "lucide-react";

const PREVIEW_STATES = [
  { id: "data", label: "Con ejemplos (datos)" },
  { id: "loading", label: "Estado cargando" },
  { id: "empty", label: "Estado vacío" },
  { id: "error", label: "Estado de error" },
  { id: "offline", label: "Modo sin conexión" },
  { id: "permission", label: "Permiso restringido" },
] as const;

type PreviewState = (typeof PREVIEW_STATES)[number]["id"];

export function PreviewWorkspace({ definition }: { definition: PreviewDefinition }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [state, setState] = useState<PreviewState>("data");
  const [selected, setSelected] = useState<PreviewRow | null>(null);
  const [action, setAction] = useState<string | null>(null);
  const [message, setMessage] = useState(false);

  const online = useOnline();
  const actual = !online ? "offline" : state;

  const categories = useMemo(
    () => Array.from(new Set(definition.rows.map((row) => row.category))),
    [definition.rows]
  );

  const rows = useMemo(() => {
    return definition.rows.filter(
      (row) =>
        (category === "all" || row.category === category) &&
        (row.title + row.detail + row.status).toLowerCase().includes(query.toLowerCase())
    );
  }, [definition.rows, category, query]);

  function openAction(label: string, row?: PreviewRow) {
    setSelected(row ?? null);
    setAction(label);
    setMessage(false);
  }

  const reset = () => {
    setState("data");
    setQuery("");
    setCategory("all");
  };

  const categoryOptions = useMemo(
    () => [
      { value: "all", label: `Todos los tipos (${definition.rows.length})` },
      ...categories.map((c) => ({
        value: c,
        label: c,
        badge: `${definition.rows.filter((r) => r.category === c).length}`,
      })),
    ],
    [categories, definition.rows]
  );

  const stateOptions = useMemo(
    () =>
      PREVIEW_STATES.map((s) => ({
        value: s.id,
        label: s.label,
      })),
    []
  );

  return (
    <section className="rounded-2xl border border-line bg-surface overflow-hidden min-w-0 shadow-2xs space-y-0">
      {/* Cabecera del espacio de trabajo */}
      <header className="p-4 sm:p-5 border-b border-line flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-surface">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-lg bg-navy-950 text-gold-400 border border-gold-500/30">
            <FileText className="size-4" />
          </span>
          <div>
            <h2 className="m-0 text-lg font-heading font-bold text-navy-950">
              {definition.title}
            </h2>
            <span className="text-xs text-muted-foreground">
              {rows.length} registros en vista
            </span>
          </div>
        </div>

        <button
          className="button primary min-h-[44px] px-4 text-xs sm:text-[13px] font-bold inline-flex items-center gap-2 cursor-pointer shrink-0"
          onClick={() => openAction(definition.primary)}
        >
          <Sparkles className="size-3.5 text-gold-400" />
          <span>{definition.primary} · vista previa</span>
        </button>
      </header>

      {/* Nota de demostración */}
      <div
        role="note"
        className="m-4 sm:m-5 rounded-xl border border-gold-300 bg-gold-50/70 p-4 text-xs sm:text-[13px] text-gold-950 flex items-start gap-3"
      >
        <span className="p-1 rounded-md bg-gold-200 text-gold-900 shrink-0 mt-0.5">
          <Eye className="size-3.5" />
        </span>
        <div>
          <strong className="block font-bold mb-0.5">Vista previa · datos de ejemplo</strong>
          <p className="m-0 text-gold-900 leading-relaxed">
            Falta: {definition.missing}. Ninguna acción registra cambios reales.
          </p>
        </div>
      </div>

      {/* Controles de búsqueda y filtros */}
      <div className="p-4 sm:p-5 border-t border-b border-line/70 bg-surface-alt/50 grid grid-cols-1 sm:grid-cols-12 gap-3.5">
        <div className="sm:col-span-12 md:col-span-6 relative flex items-center">
          <Search className="absolute left-3.5 size-4 text-muted-foreground pointer-events-none" />
          <input
            className="w-full min-h-[44px] pl-10 pr-9 text-xs sm:text-[13px] rounded-lg border border-line bg-surface focus:border-gold-600 focus:outline-none transition-colors"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nombre, estado o descripción..."
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 p-1 text-muted-foreground hover:text-ink cursor-pointer"
              aria-label="Borrar texto"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="sm:col-span-6 md:col-span-3">
          <Combobox
            options={categoryOptions}
            value={category}
            onChange={setCategory}
            placeholder="Filtrar por tipo"
            size="default"
          />
        </div>

        <div className="sm:col-span-6 md:col-span-3">
          <Combobox
            options={stateOptions}
            value={state}
            onChange={(val) => setState(val as PreviewState)}
            placeholder="Estado de demostración"
            size="default"
          />
        </div>
      </div>

      {/* ESTADOS CANÓNICOS */}
      {actual === "loading" ? (
        <div className="p-10 text-center space-y-3" role="status" aria-busy="true">
          <div className="inline-flex size-10 items-center justify-center rounded-full bg-gold-100 text-gold-700 animate-spin">
            <Sparkles className="size-5" />
          </div>
          <p className="text-sm font-semibold text-ink m-0">Cargando vista de ejemplo…</p>
          <button
            className="button secondary min-h-[40px] px-4 text-xs font-semibold cursor-pointer"
            onClick={reset}
          >
            Terminar demostración
          </button>
        </div>
      ) : actual === "error" ? (
        <div role="alert" className="p-8 sm:p-10 text-center space-y-3 bg-rose-50/30">
          <div className="inline-flex size-10 items-center justify-center rounded-full bg-rose-100 text-rose-700">
            <AlertCircle className="size-5" />
          </div>
          <h3 className="text-base font-bold text-navy-950 m-0">
            No se pudo cargar la vista de ejemplo
          </h3>
          <p className="text-xs sm:text-[13px] text-muted-foreground m-0 max-w-md mx-auto">
            Este error es una demostración; no afecta registros reales.
          </p>
          <button
            className="button secondary min-h-[40px] px-4 text-xs font-semibold cursor-pointer"
            onClick={reset}
          >
            Reintentar
          </button>
        </div>
      ) : actual === "offline" ? (
        <div role="status" className="p-8 sm:p-10 text-center space-y-3 bg-amber-50/30">
          <div className="inline-flex size-10 items-center justify-center rounded-full bg-amber-100 text-amber-800">
            <WifiOff className="size-5" />
          </div>
          <h3 className="text-base font-bold text-navy-950 m-0">Sin conexión</h3>
          <p className="text-xs sm:text-[13px] text-muted-foreground m-0 max-w-md mx-auto">
            Las acciones requieren conexión y un servicio disponible. No se encolan solicitudes.
          </p>
          {online && (
            <button
              className="button secondary min-h-[40px] px-4 text-xs font-semibold cursor-pointer"
              onClick={reset}
            >
              Restablecer demostración
            </button>
          )}
        </div>
      ) : actual === "permission" ? (
        <div role="note" className="p-8 sm:p-10 text-center space-y-3 bg-surface-alt">
          <div className="inline-flex size-10 items-center justify-center rounded-full bg-slate-200 text-slate-700">
            <AlertCircle className="size-5" />
          </div>
          <h3 className="text-base font-bold text-navy-950 m-0">
            Permiso insuficiente · demostración
          </h3>
          <p className="text-xs sm:text-[13px] text-muted-foreground m-0 max-w-md mx-auto">
            Una consulta no concede permiso para aprobar, publicar o cerrar un expediente.
          </p>
          <button
            className="button secondary min-h-[40px] px-4 text-xs font-semibold cursor-pointer"
            onClick={reset}
          >
            Volver a los ejemplos
          </button>
        </div>
      ) : actual === "empty" || !rows.length ? (
        <div className="p-10 text-center space-y-3">
          <h3 className="text-base font-bold text-navy-950 m-0">
            {actual === "empty" ? "No hay registros en esta demostración" : "Sin coincidencias"}
          </h3>
          <p className="text-xs sm:text-[13px] text-muted-foreground m-0 max-w-md mx-auto">
            Restablece la vista para revisar los ejemplos tipados.
          </p>
          <button
            className="button secondary min-h-[40px] px-4 text-xs font-semibold cursor-pointer"
            onClick={reset}
          >
            Restablecer vista
          </button>
        </div>
      ) : (
        /* Listado interactivo de expedientes */
        <div className="divide-y divide-line">
          {rows.map((row) => (
            <article
              key={row.id}
              className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-surface-hover transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-semibold text-gold-800 bg-gold-100 px-2 py-0.5 rounded border border-gold-300">
                    {row.id}
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">
                    {row.category}
                  </span>
                </div>
                <h3 className="text-base font-bold text-navy-950 m-0 mt-1">{row.title}</h3>
                <p className="text-xs sm:text-[13px] text-ink-muted m-0 mt-0.5">{row.status}</p>
              </div>

              <button
                className="button secondary min-h-[44px] px-4 text-xs sm:text-[13px] font-semibold inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
                onClick={() => {
                  setSelected(row);
                  setAction(null);
                  setMessage(false);
                }}
              >
                <span>Abrir expediente</span>
                <ChevronRight className="size-3.5 text-muted-foreground" />
              </button>
            </article>
          ))}
        </div>
      )}

      {/* Modal accesible de expediente o acción */}
      <Dialog
        open={Boolean(selected || action)}
        onOpenChange={(open) => {
          if (!open) {
            setSelected(null);
            setAction(null);
          }
        }}
      >
        <DialogContent className="max-h-[85dvh] overflow-y-auto max-w-lg">
          <DialogHeader>
            <DialogTitle>{action ?? selected?.title}</DialogTitle>
            <DialogDescription>
              Vista previa de {definition.title.toLowerCase()}. No se enviarán datos ni se guardará una operación.
            </DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="space-y-4 pt-2">
              <p className="text-xs sm:text-[13px] text-ink leading-relaxed m-0">{selected.detail}</p>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-[13px] bg-surface-alt p-3.5 rounded-xl border border-line">
                {selected.facts.map((fact) => (
                  <div key={fact.label}>
                    <dt className="text-muted-foreground text-[11px] uppercase tracking-wider font-semibold">
                      {fact.label}
                    </dt>
                    <dd className="m-0 font-bold text-ink mt-0.5">{fact.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {action ? (
            <form
              className="space-y-3.5 pt-2"
              onSubmit={(event) => {
                event.preventDefault();
                setMessage(true);
              }}
            >
              {definition.fields.map((field) => (
                <label className="block text-xs sm:text-[13px] font-semibold text-ink" key={field.label}>
                  <span className="block mb-1">{field.label}</span>
                  <input
                    className="w-full min-h-[44px] px-3 rounded-lg border border-line bg-surface text-xs sm:text-[13px]"
                    type={field.type ?? "text"}
                    required
                  />
                </label>
              ))}
              <p className="text-xs text-muted-foreground m-0">
                Usa únicamente datos de prueba, sin datos personales ni documentos reales.
              </p>
              <button
                className="button primary min-h-[44px] w-full text-xs sm:text-[13px] font-bold cursor-pointer"
                type="submit"
              >
                Comprobar acción de ejemplo
              </button>
            </form>
          ) : (
            <div className="flex flex-wrap gap-2 pt-3 border-t border-line">
              {definition.actions.map((label) => (
                <button
                  className="button secondary min-h-[40px] px-3.5 text-xs font-semibold cursor-pointer"
                  key={label}
                  onClick={() => openAction(label, selected ?? undefined)}
                >
                  {label} · vista previa
                </button>
              ))}
            </div>
          )}

          {message && (
            <div
              role="status"
              className="text-xs sm:text-[13px] border border-gold-300 rounded-xl p-3.5 bg-gold-50/80 text-gold-950 mt-3"
            >
              No se ejecutó “{action}”. Falta: {definition.missing}. El ejemplo no se ha guardado.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
