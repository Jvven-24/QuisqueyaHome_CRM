"use client";

import { useState, type ReactNode } from "react";
import { Building2, CheckCircle2, Clock, Flame, FolderKanban, MapPin, Pencil, User } from "lucide-react";

export type TableroTareaItem = {
  id: number;
  title: string;
  description?: string | null;
  priority: string;
  status?: string;
  assigneeName: string | null;
  projectName?: string | null;
  dealTitle?: string | null;
  contactName?: string | null;
  location?: string | null;
  etiquetaTiempo?: string;
  checklistTotal?: number;
  checklistCompletados?: number;
};

export function TableroTareas({
  grupos,
  onCompletar,
  onEditar,
  accionExtra,
}: {
  grupos: Array<{
    id: string;
    titulo: string;
    subtitulo?: string;
    tono?: "red" | "gold" | "green" | "blue" | "neutral";
    filas: TableroTareaItem[];
  }>;
  onCompletar: (id: number) => void;
  onEditar?: (id: number) => void;
  accionExtra?: (item: TableroTareaItem) => ReactNode;
}) {
  const [grupoMovil, setGrupoMovil] = useState(grupos[0]?.id ?? "");
  const grupoActivo = grupos.some(grupo => grupo.id === grupoMovil) ? grupoMovil : grupos[0]?.id ?? "";
  const estilosColumna: Record<string, { borde: string; cabeceraBg: string; punto: string }> = {
    red: {
      borde: "border-[#fecaca]",
      cabeceraBg: "bg-[#fef2f2] text-[#991b1b]",
      punto: "bg-[#dc2626]",
    },
    gold: {
      borde: "border-[#fde68a]",
      cabeceraBg: "bg-[#fffbeb] text-[#92400e]",
      punto: "bg-[#d97706]",
    },
    green: {
      borde: "border-[#a7f3d0]",
      cabeceraBg: "bg-[#ecfdf5] text-[#065f46]",
      punto: "bg-[#059669]",
    },
    blue: {
      borde: "border-[#bfdbfe]",
      cabeceraBg: "bg-[#eff6ff] text-[#1e40af]",
      punto: "bg-[#2563eb]",
    },
    neutral: {
      borde: "border-[#e2e8f0]",
      cabeceraBg: "bg-[#f8fafc] text-[#334155]",
      punto: "bg-[#64748b]",
    },
  };

  return (
    <div className="min-w-0 space-y-3">
      <label className="grid min-w-0 gap-1 text-[13px] font-medium md:hidden" htmlFor="task-board-column">Columna del tablero
        <select id="task-board-column" value={grupoActivo} onChange={event => setGrupoMovil(event.target.value)} className="min-h-12 min-w-0 w-full rounded-lg border border-line bg-surface px-3 text-sm">
          {grupos.map(grupo => <option key={grupo.id} value={grupo.id}>{grupo.titulo} ({grupo.filas.length})</option>)}
        </select>
      </label>
    <div
      className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-4"
      role="region"
      aria-label="Tablero Kanban de tareas por estado de ejecución"
    >
      {grupos.map((grupo) => {
        const estilo = estilosColumna[grupo.tono ?? "neutral"] ?? estilosColumna.neutral!;
        return (
          <section
            key={grupo.id}
            className={`min-w-0 flex-col rounded-xl border ${estilo.borde} bg-surface-alt p-3 ${grupo.id === grupoActivo ? "flex" : "hidden md:flex"}`}
          >
            <header
              className={`mb-3 flex items-center justify-between rounded-lg px-3 py-2.5 ${estilo.cabeceraBg}`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className={`size-2.5 shrink-0 rounded-full ${estilo.punto}`} aria-hidden="true" />
                <div className="min-w-0">
                  <h3 className="m-0 break-words text-[14px] font-semibold tracking-tight">{grupo.titulo}</h3>
                  {grupo.subtitulo && (
                    <p className="m-0 break-words text-[13px] opacity-80">{grupo.subtitulo}</p>
                  )}
                </div>
              </div>
              <span className="ml-2 inline-flex min-w-[28px] items-center justify-center rounded-full bg-white/90 px-2.5 py-0.5 text-[13px] font-bold tabular-nums text-[#0f172a] shadow-2xs">
                {grupo.filas.length}
              </span>
            </header>

            <div className="flex flex-1 flex-col gap-2.5">
              {grupo.filas.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-[#cbd5e1] bg-white/60 px-4 py-8 text-center">
                  <p className="text-[13px] font-medium text-[#64748b]">Sin tareas en esta columna</p>
                </div>
              ) : (
                grupo.filas.map((item) => {
                  const esAlta = item.priority === "high";
                  const esCompletada = item.status === "completed";
                  const tieneChecklist = (item.checklistTotal ?? 0) > 0;
                  const pctChecklist = tieneChecklist
                    ? Math.round(((item.checklistCompletados ?? 0) / (item.checklistTotal ?? 1)) * 100)
                    : 0;

                  return (
                    <article
                      key={item.id}
                      className={`group min-w-0 flex flex-col justify-between rounded-lg border bg-surface p-3 transition-colors ${
                        esCompletada
                          ? "border-[#a7f3d0] bg-[#f8fafc]"
                          : esAlta
                            ? "border-danger/40"
                            : "border-[#e2e8f0]"
                      }`}
                    >
                      <div>
                        <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                          <span
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[13px] font-semibold ${
                              esCompletada
                                ? "bg-[#ecfdf5] text-[#065f46]"
                                : esAlta
                                  ? "bg-[#fef2f2] text-[#991b1b]"
                                  : item.priority === "low"
                                    ? "bg-[#f1f5f9] text-[#475569]"
                                    : "bg-[#fffbeb] text-[#92400e]"
                            }`}
                          >
                            {esAlta && !esCompletada && <Flame className="size-3.5" aria-hidden="true" />}
                            {esCompletada
                              ? "Completada"
                              : esAlta
                                ? "Prioridad Alta"
                                : item.priority === "low"
                                  ? "Prioridad Baja"
                                  : "Prioridad Normal"}
                          </span>

                          {item.etiquetaTiempo && (
                            <span className="inline-flex items-center gap-1 text-[13px] font-medium tabular-nums text-[#475569]">
                              <Clock className="size-3.5 text-[#64748b]" aria-hidden="true" />
                              {item.etiquetaTiempo}
                            </span>
                          )}
                        </div>

                        <h4
                          className={`break-words text-[14px] font-semibold leading-snug text-ink ${
                            esCompletada ? "line-through opacity-75" : ""
                          }`}
                        >
                          {item.title}
                        </h4>

                        {/* Tríada : Recurso + Cliente + Ubicación */}
                        {(item.projectName || item.dealTitle || item.contactName || item.location) && (
                          <div className="mt-2.5 flex min-w-0 flex-wrap gap-1.5 [&>span]:max-w-full">
                            {item.projectName && (
                              <span className="inline-flex items-center gap-1 rounded-md border border-[#bfdbfe] bg-[#eff6ff] px-2 py-0.5 text-[13px] font-medium text-[#1e40af]">
                                <Building2 className="size-3.5 shrink-0" aria-hidden="true" />
                                <span className="truncate max-w-[160px]">{item.projectName}</span>
                              </span>
                            )}
                            {item.dealTitle && (
                              <span className="inline-flex items-center gap-1 rounded-md border border-[#fde68a] bg-[#fffbeb] px-2 py-0.5 text-[13px] font-medium text-[#92400e]">
                                <FolderKanban className="size-3.5 shrink-0" aria-hidden="true" />
                                <span className="truncate max-w-[160px]">{item.dealTitle}</span>
                              </span>
                            )}
                            {item.contactName && (
                              <span className="inline-flex items-center gap-1 rounded-md border border-[#e2e8f0] bg-[#f8fafc] px-2 py-0.5 text-[13px] font-medium text-[#334155]">
                                <User className="size-3.5 shrink-0" aria-hidden="true" />
                                <span className="truncate max-w-[150px]">{item.contactName}</span>
                              </span>
                            )}
                            {item.location && (
                              <span className="inline-flex items-center gap-1 rounded-md border border-[#e2e8f0] bg-[#f8fafc] px-2 py-0.5 text-[13px] text-[#475569]">
                                <MapPin className="size-3.5 shrink-0 text-[#64748b]" aria-hidden="true" />
                                <span className="truncate max-w-[150px]">{item.location}</span>
                              </span>
                            )}
                          </div>
                        )}

                        {/* Barra de progreso de sub-checklist To-Do */}
                        {tieneChecklist && (
                          <div className="mt-3 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-2">
                            <div className="mb-1 flex flex-wrap items-center justify-between gap-1 text-[13px] font-medium text-ink">
                              <span>Sub-tareas To-Do</span>
                              <span className="tabular-nums">
                                {item.checklistCompletados}/{item.checklistTotal} ({pctChecklist}%)
                              </span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#e2e8f0]">
                              <div
                                className="h-full rounded-full bg-[#059669] transition-all"
                                style={{ width: `${pctChecklist}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-2.5">
                        <div className="flex items-center gap-1.5 min-w-0 text-[13px] font-semibold text-[#334155]">
                          <User className="size-3.5 shrink-0 text-ink-muted" aria-hidden="true" />
                          <span className="truncate">{item.assigneeName ?? "Sin broker asignado"}</span>
                        </div>

                        <div className="flex w-full flex-wrap items-center justify-end gap-1.5">
                          {accionExtra?.(item)}
                          {onEditar && (
                            <button
                              type="button"
                              onClick={() => onEditar(item.id)}
                              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-[#cbd5e1] bg-white px-2.5 text-[13px] font-semibold text-[#334155] transition-colors hover:bg-[#f8fafc]"
                              title="Editar o ver detalle de tarea"
                              aria-label={`Editar tarea ${item.title}`}
                            >
                              <Pencil className="size-4" aria-hidden="true" />
                            </button>
                          )}
                          {!esCompletada && (
                            <button
                              type="button"
                              onClick={() => onCompletar(item.id)}
                              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-[#a7f3d0] bg-[#ecfdf5] px-3 text-[13px] font-semibold text-[#065f46] transition-colors hover:bg-[#d1fae5]"
                            >
                              <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
                              <span>Completar</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </section>
        );
      })}
    </div>
    </div>
  );
}
