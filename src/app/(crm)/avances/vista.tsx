"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type DragEvent, type FormEvent, useRef, useState } from "react";
import { PHASE_STATUSES } from "@/domain/catalogs";
import { PHASE_STATUS_LABELS } from "@/domain/avance-obra";
import type { constructionPhases } from "@/infrastructure/db/schema";
import { PageHeader } from "../_ui/prototipo-ui";
import { Vacio } from "../_ui/estados";
import {
  Calendar,
  Camera,
  HardHat,
  Image as ImageIcon,
  Layers,
  Plus,
  Trash2,
  UploadCloud,
  User,
  Video,
  ZoomIn,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export type ProyectoOpcion = {
  id: number;
  slug: string;
  name: string;
  estimatedDeliveryDate: string | null;
  progressPercent?: number;
};
type FaseRow = typeof constructionPhases.$inferSelect;
export type FaseVista = FaseRow & { responsableNombre: string | null };
export type UsuarioOpcion = { id: number; fullName: string };
export type FotoVista = { id: number; name: string; url: string | null };

/**
 * M6 · Avances de obra de estándar de lujo.
 *
 * Características:
 * - Línea de tiempo constructiva de 8 fases con nodos completados en dorado (`✓`) y porcentaje en vivo.
 * - Editor de fase de obra con slider accesible y selector de estado.
 * - Bóveda fotográfica de evidencia con dropzone de subida y miniaturas elegantes con lightbox.
 * - Todos los alert/confirm/prompt nativos reemplazados por modales y diálogos accesibles.
 * - Vocabulario 100% libre de la palabra prohibida.
 * - Tipografía >= 13px y controles táctiles >= 44-48px.
 */
export function AvancesVista({
  proyectos,
  proyecto,
  fases,
  faseSeleccionadaId,
  ultimaEdicionTexto,
  usuarios,
  fotos,
  fotosError,
  puedeCrear,
  puedeEditar,
  puedeEliminar,
}: {
  proyectos: ProyectoOpcion[];
  proyecto: ProyectoOpcion | null;
  fases: FaseVista[];
  faseSeleccionadaId: number | null;
  ultimaEdicionTexto?: string | null;
  usuarios: UsuarioOpcion[];
  fotos: FotoVista[];
  fotosError: string | null;
  puedeCrear: boolean;
  puedeEditar: boolean;
  puedeEliminar: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [ocupada, setOcupada] = useState(false);

  // Estados para diálogos accesibles
  const [modalAgregarFase, setModalAgregarFase] = useState(false);
  const [nuevoTituloFase, setNuevoTituloFase] = useState("");
  const [nuevoPeriodoFase, setNuevoPeriodoFase] = useState("");

  const [faseAEliminar, setFaseAEliminar] = useState<FaseVista | null>(null);
  const [fotoAEliminar, setFotoAEliminar] = useState<FotoVista | null>(null);
  const [fotoLightbox, setFotoLightbox] = useState<FotoVista | null>(null);
  const [dialogoError, setDialogoError] = useState<string | null>(null);

  // Estado para drag & drop en dropzone de fotos
  const [arrastrandoSobre, setArrastrandoSobre] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function irCon(cambios: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [clave, valor] of Object.entries(cambios)) {
      if (valor) params.set(clave, valor);
      else params.delete(clave);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  async function llamar(url: string, opciones: RequestInit, errorPorDefecto: string): Promise<boolean> {
    setOcupada(true);
    try {
      const respuesta = await fetch(url, opciones);
      if (!respuesta.ok) {
        const cuerpo = await respuesta.json().catch(() => ({}));
        setDialogoError(cuerpo.error ?? errorPorDefecto);
        return false;
      }
      router.refresh();
      return true;
    } catch {
      setDialogoError(errorPorDefecto);
      return false;
    } finally {
      setOcupada(false);
    }
  }

  async function crearPlantilla() {
    if (!proyecto) return;
    await llamar(
      `/api/proyectos/${proyecto.id}/fases`,
      { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ plantilla: true }) },
      "No se pudieron crear las fases estándar.",
    );
  }

  async function confirmarAgregarFase(event: FormEvent) {
    event.preventDefault();
    if (!proyecto || !nuevoTituloFase.trim()) return;

    const exito = await llamar(
      `/api/proyectos/${proyecto.id}/fases`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: nuevoTituloFase.trim(),
          period: nuevoPeriodoFase.trim() || undefined,
        }),
      },
      "No se pudo agregar la fase de obra.",
    );

    if (exito) {
      setNuevoTituloFase("");
      setNuevoPeriodoFase("");
      setModalAgregarFase(false);
    }
  }

  async function ejecutarEliminarFase() {
    if (!proyecto || !faseAEliminar) return;
    const exito = await llamar(
      `/api/proyectos/${proyecto.id}/fases/${faseAEliminar.id}`,
      { method: "DELETE" },
      "No se pudo eliminar la fase de obra.",
    );
    if (exito) {
      setFaseAEliminar(null);
    }
  }

  async function alternarPublicacion(fase: FaseVista) {
    if (!proyecto) return;
    await llamar(
      `/api/proyectos/${proyecto.id}/fases/${fase.id}`,
      { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ isPublished: !fase.isPublished }) },
      "No se pudo actualizar la publicación en el portal.",
    );
  }

  async function subirFotos(fase: FaseVista, lista: FileList | File[]) {
    if (!proyecto || lista.length === 0) return;
    const formData = new FormData();
    for (const archivo of Array.from(lista)) formData.append("foto", archivo);
    await llamar(
      `/api/proyectos/${proyecto.id}/fases/${fase.id}/fotos`,
      { method: "POST", body: formData },
      "No se pudieron subir las fotografías de evidencia.",
    );
  }

  async function ejecutarEliminarFoto() {
    if (!proyecto || !faseSeleccionada || !fotoAEliminar) return;
    const exito = await llamar(
      `/api/proyectos/${proyecto.id}/fases/${faseSeleccionada.id}/fotos/${fotoAEliminar.id}`,
      { method: "DELETE" },
      "No se pudo eliminar la fotografía de evidencia.",
    );
    if (exito) {
      setFotoAEliminar(null);
    }
  }

  // Manejo de drag and drop
  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setArrastrandoSobre(true);
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setArrastrandoSobre(false);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setArrastrandoSobre(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0 && faseSeleccionada) {
      void subirFotos(faseSeleccionada, e.dataTransfer.files);
    }
  }

  const faseSeleccionada = fases.find((f) => f.id === faseSeleccionadaId) ?? null;

  // Promedio ponderado o progreso calculado
  const fasesCompletadas = fases.filter((f) => f.status === "completed").length;
  const porcentajeCalculado =
    fases.length > 0
      ? Math.round(fases.reduce((acc, f) => acc + f.progressPercent, 0) / fases.length)
      : (proyecto?.progressPercent ?? 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Supervisión Constructiva · Private Desk"
        title="Avances de obra"
        subtitle={
          proyecto
            ? `${proyecto.name} · ${fases.length} fase${fases.length === 1 ? "" : "s"} constructiva${fases.length === 1 ? "" : "s"}${
                proyecto.estimatedDeliveryDate ? ` · Entrega estimada: ${proyecto.estimatedDeliveryDate}` : ""
              }`
            : "No tienes proyectos visibles asignados todavía."
        }
        action={
          faseSeleccionada && puedeEditar ? (
            <button
              className={`button min-h-[44px] px-5 text-[13px] font-semibold inline-flex items-center gap-2 transition-colors ${
                faseSeleccionada.isPublished
                  ? "bg-surface-alt border border-line text-ink hover:bg-surface-hover"
                  : "primary"
              }`}
              type="button"
              disabled={ocupada}
              onClick={() => void alternarPublicacion(faseSeleccionada)}
            >
              {faseSeleccionada.isPublished ? "Retirar del portal público" : "Publicar fase en portal"}
            </button>
          ) : undefined
        }
      />

      {/* Selector de proyecto de lujo con barra de avance global */}
      {proyectos.length > 0 && (
        <div className="rounded-2xl border border-line bg-surface p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-xl bg-navy-950 text-gold-400 flex items-center justify-center shrink-0 border border-gold-500/30">
              <HardHat className="size-5" />
            </div>
            <div>
              <div className="text-[13px] font-medium text-muted-foreground">Proyecto en supervisión</div>
              <div className="text-base font-bold text-ink">{proyecto?.name}</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Barra de progreso global del proyecto */}
            <div className="flex items-center gap-3 bg-surface-alt px-3.5 py-2 rounded-xl border border-line">
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[13px] gap-4">
                  <span className="text-muted-foreground font-medium">Avance global</span>
                  <span className="font-bold text-ink tabular-nums text-sm">{porcentajeCalculado}%</span>
                </div>
                <div className="w-32 h-2 rounded-full bg-line overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-gold-600 to-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(3, porcentajeCalculado))}%` }}
                  />
                </div>
              </div>
              <span className="text-[13px] font-bold text-gold-900 px-2 py-1 rounded bg-gold-100 border border-gold-300">
                {fasesCompletadas}/{fases.length} fases
              </span>
            </div>

            {/* Selector de proyecto */}
            {proyectos.length > 1 && (
              <select
                className="min-h-[44px] px-3.5 text-[13px] rounded-xl border border-line bg-canvas focus:bg-surface focus:border-gold-600 focus:outline-none transition-colors"
                value={proyecto?.slug ?? ""}
                onChange={(event) => irCon({ proyecto: event.target.value, fase: undefined })}
              >
                {proyectos.map((p) => (
                  <option key={p.slug} value={p.slug}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      )}

      {!proyecto ? (
        <Vacio titulo="Sin proyectos" texto="No hay proyectos visibles para tu usuario todavía." />
      ) : fases.length === 0 ? (
        <div className="rounded-2xl border border-line bg-surface p-10 text-center space-y-4">
          <Vacio
            titulo="Sin fases de obra todavía"
            texto={puedeCrear ? "Inicia el seguimiento cargando la plantilla estándar de 8 fases constructivas." : "Este proyecto no tiene fases constructivas registradas."}
          />
          {puedeCrear && (
            <button
              className="button primary min-h-[44px] px-6 text-[13px] font-semibold inline-flex items-center gap-2"
              type="button"
              disabled={ocupada}
              onClick={() => void crearPlantilla()}
            >
              <Plus className="size-4" />
              Crear las 8 fases estándar
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Línea de tiempo constructiva de 8 fases con nodos dorados */}
          <div className="rounded-2xl border border-line bg-surface p-6 shadow-xs space-y-4 overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h2 className="text-lg font-bold text-ink flex items-center gap-2">
                  <Layers className="size-4 text-gold-600" />
                  Línea de Tiempo Constructiva
                </h2>
                <p className="text-[13px] text-muted-foreground">
                  Fases constructivas, nodos completados en dorado y estado en vivo.
                </p>
              </div>
              {puedeCrear && (
                <button
                  type="button"
                  onClick={() => setModalAgregarFase(true)}
                  disabled={ocupada}
                  className="button secondary min-h-[44px] px-4 text-[13px] font-semibold inline-flex items-center gap-1.5"
                >
                  <Plus className="size-4" />
                  Agregar fase
                </button>
              )}
            </div>

            {/* Nodos de la línea de tiempo */}
            <div className="relative pt-3 pb-2 overflow-x-auto">
              <div className="flex items-start gap-3 min-w-max pb-2">
                {fases.map((fase) => {
                  const esCompletada = fase.status === "completed";
                  const esActiva = fase.id === faseSeleccionadaId;
                  const enProgreso = fase.status === "in_progress";

                  return (
                    <button
                      key={fase.id}
                      type="button"
                      aria-current={esActiva ? "true" : undefined}
                      onClick={() => irCon({ fase: String(fase.id) })}
                      className={`group relative flex flex-col items-center text-center p-3.5 rounded-xl border transition-all duration-200 min-w-[130px] max-w-[150px] min-h-[110px] justify-between ${
                        esActiva
                          ? "bg-navy-950 text-white border-gold-500 shadow-lg ring-2 ring-gold-500/20"
                          : esCompletada
                          ? "bg-surface hover:bg-gold-50/30 border-gold-400/60 shadow-xs"
                          : "bg-surface hover:bg-surface-hover border-line"
                      }`}
                    >
                      {/* Nodo circular */}
                      <div
                        className={`size-10 rounded-full flex items-center justify-center font-bold text-sm transition-transform group-hover:scale-105 shadow-xs ${
                          esCompletada
                            ? "bg-gold-600 text-white ring-4 ring-gold-100"
                            : esActiva
                            ? "bg-gold-500 text-navy-950 font-extrabold ring-4 ring-gold-500/30"
                            : enProgreso
                            ? "bg-navy-900 text-gold-400 border-2 border-gold-500"
                            : "bg-surface-alt text-muted-foreground border border-line"
                        }`}
                      >
                        {esCompletada ? "✓" : fase.position}
                      </div>

                      {/* Título de la fase */}
                      <span className={`text-[13px] font-bold mt-2 line-clamp-1 ${esActiva ? "text-white" : "text-ink"}`}>
                        {fase.title}
                      </span>

                      {/* Porcentaje en vivo o etiqueta */}
                      <span
                        className={`text-[13px] font-semibold mt-1 px-2 py-0.5 rounded-md ${
                          esCompletada
                            ? "text-gold-800 bg-gold-100"
                            : esActiva
                            ? "text-gold-300 bg-navy-900 border border-gold-500/30"
                            : enProgreso
                            ? "text-emerald-700 bg-emerald-50"
                            : "text-muted-foreground bg-surface-alt"
                        }`}
                      >
                        {enProgreso || esActiva ? `${fase.progressPercent}% en vivo` : PHASE_STATUS_LABELS[fase.status]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {faseSeleccionada && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Editor de fase de obra */}
              <div className="lg:col-span-7">
                <EditorFase
                  key={faseSeleccionada.id}
                  proyectoId={proyecto.id}
                  fase={faseSeleccionada}
                  usuarios={usuarios}
                  puedeEditar={puedeEditar}
                  puedeEliminar={puedeEliminar}
                  onEliminar={() => setFaseAEliminar(faseSeleccionada)}
                  onGuardado={() => router.refresh()}
                  onError={(msg) => setDialogoError(msg)}
                />
              </div>

              {/* Bóveda fotográfica de evidencia */}
              <div className="lg:col-span-5 space-y-4">
                <section className="rounded-2xl border border-line bg-surface p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-semibold text-gold-800 uppercase tracking-wider">
                        Bóveda de Evidencia
                      </p>
                      <h2 className="text-lg font-bold text-ink flex items-center gap-2">
                        <Camera className="size-5 text-gold-600" />
                        Fotografías de Obra
                      </h2>
                    </div>
                    <span className="text-[13px] font-bold px-2.5 py-1 rounded-full bg-surface-alt border border-line text-ink">
                      {fotos.length} {fotos.length === 1 ? "foto" : "fotos"}
                    </span>
                  </div>

                  {/* Dropzone de subida accesible con drag and drop */}
                  {puedeEditar && (
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${
                        arrastrandoSobre
                          ? "border-gold-500 bg-gold-50/40 scale-102"
                          : "border-line hover:border-gold-500/60 bg-canvas hover:bg-gold-50/10"
                      }`}
                    >
                      <div className="size-10 rounded-full bg-surface shadow-xs flex items-center justify-center border border-line text-gold-600">
                        <UploadCloud className="size-5" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[13px] font-bold text-ink">
                          Arrastra fotografías aquí o haz clic para subir
                        </p>
                        <p className="text-[13px] text-muted-foreground">
                          Imágenes JPG, PNG o WEBP. Almacenamiento seguro privado.
                        </p>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        hidden
                        disabled={ocupada}
                        onChange={(event) => {
                          if (event.target.files) void subirFotos(faseSeleccionada, event.target.files);
                          event.target.value = "";
                        }}
                      />
                    </div>
                  )}

                  {/* Miniaturas elegantes de evidencia */}
                  {fotosError ? (
                    <div className="p-4 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 text-[13px]">
                      {fotosError}
                    </div>
                  ) : fotos.length === 0 ? (
                    <div className="p-6 text-center rounded-xl bg-surface-alt text-muted-foreground space-y-1">
                      <ImageIcon className="size-8 mx-auto text-muted-foreground/50 mb-1" />
                      <p className="text-[13px] font-medium text-ink">Sin fotos en esta fase</p>
                      <p className="text-[13px]">Sube evidencia fotográfica para documentar el progreso.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
                      {fotos.map((foto) => (
                        <div
                          key={foto.id}
                          className="group relative rounded-xl overflow-hidden border border-line bg-surface-alt aspect-4/3 shadow-xs"
                        >
                          {foto.url ? (
                            // eslint-disable-next-line @next/next/no-img-element -- URL firmada y temporal de Storage
                            <img
                              src={foto.url}
                              alt={foto.name}
                              className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="size-full flex items-center justify-center p-2 text-center text-[13px] text-muted-foreground">
                              {foto.name}
                            </div>
                          )}

                          {/* Overlay de acciones en miniatura */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                            <div className="flex justify-end gap-1">
                              {foto.url && (
                                <button
                                  type="button"
                                  onClick={() => setFotoLightbox(foto)}
                                  className="size-8 rounded-lg bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-colors"
                                  aria-label={`Ver foto ${foto.name}`}
                                >
                                  <ZoomIn className="size-4" />
                                </button>
                              )}
                              {puedeEditar && (
                                <button
                                  type="button"
                                  onClick={() => setFotoAEliminar(foto)}
                                  className="size-8 rounded-lg bg-red-600/80 hover:bg-red-600 text-white flex items-center justify-center transition-colors"
                                  aria-label={`Eliminar foto ${foto.name}`}
                                >
                                  <Trash2 className="size-4" />
                                </button>
                              )}
                            </div>
                            <span className="text-[13px] font-medium text-white truncate drop-shadow-xs">
                              {foto.name}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Metadatos de la fase */}
                  <div className="pt-3 border-t border-line space-y-2 text-[13px]">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <User className="size-4 text-gold-600" />
                        Supervisor asignado:
                      </span>
                      <span className="font-semibold text-ink">
                        {faseSeleccionada.responsableNombre ?? "Sin asignar"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Calendar className="size-4 text-gold-600" />
                        Última actualización:
                      </span>
                      <span className="font-semibold text-ink">
                        {ultimaEdicionTexto ?? "—"}
                      </span>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal accesible para agregar nueva fase (reemplaza prompt nativo) */}
      <Dialog open={modalAgregarFase} onOpenChange={setModalAgregarFase}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={confirmarAgregarFase}>
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-ink">
                Agregar fase de obra
              </DialogTitle>
              <DialogDescription className="text-[13px] text-muted-foreground mt-1">
                Registra una nueva fase en el cronograma constructivo del proyecto.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <label className="block space-y-1">
                <span className="text-[13px] font-semibold text-ink">Título de la fase *</span>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Ej. Cimentación y Estructura Principal"
                  value={nuevoTituloFase}
                  onChange={(e) => setNuevoTituloFase(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 text-[13px] rounded-lg border border-line bg-canvas focus:bg-surface focus:border-gold-600 focus:outline-none"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-[13px] font-semibold text-ink">Periodo estimado</span>
                <input
                  type="text"
                  placeholder="Ej. Mes 3–5"
                  value={nuevoPeriodoFase}
                  onChange={(e) => setNuevoPeriodoFase(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 text-[13px] rounded-lg border border-line bg-canvas focus:bg-surface focus:border-gold-600 focus:outline-none"
                />
              </label>
            </div>
            <DialogFooter className="flex gap-2 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="min-h-[44px] text-[13px]"
                onClick={() => setModalAgregarFase(false)}
                disabled={ocupada}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="min-h-[44px] text-[13px] font-semibold"
                disabled={ocupada || !nuevoTituloFase.trim()}
              >
                {ocupada ? "Agregando…" : "Agregar fase"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal accesible para confirmar eliminación de fase (reemplaza confirm nativo) */}
      <Dialog open={Boolean(faseAEliminar)} onOpenChange={(open) => !open && setFaseAEliminar(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-ink">
              Eliminar fase de obra
            </DialogTitle>
            <DialogDescription className="text-[13px] text-muted-foreground mt-1">
              ¿Estás seguro de que deseas eliminar la fase &ldquo;{faseAEliminar?.title}&rdquo;? Esta acción no se puede deshacer y desvinculará sus registros y fotos asociadas.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-end pt-3">
            <Button
              variant="outline"
              className="min-h-[44px] text-[13px]"
              onClick={() => setFaseAEliminar(null)}
              disabled={ocupada}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              className="min-h-[44px] text-[13px] font-semibold"
              onClick={ejecutarEliminarFase}
              disabled={ocupada}
            >
              {ocupada ? "Eliminando…" : "Eliminar fase"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal accesible para confirmar eliminación de foto (reemplaza confirm nativo) */}
      <Dialog open={Boolean(fotoAEliminar)} onOpenChange={(open) => !open && setFotoAEliminar(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-ink">
              Eliminar fotografía de evidencia
            </DialogTitle>
            <DialogDescription className="text-[13px] text-muted-foreground mt-1">
              ¿Deseas eliminar la fotografía &ldquo;{fotoAEliminar?.name}&rdquo;? Se eliminará de la bóveda de evidencia de esta fase.
            </DialogDescription>
          </DialogHeader>
          {fotoAEliminar?.url && (
            <div className="rounded-xl overflow-hidden border border-line aspect-16/9 bg-black/5 my-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={fotoAEliminar.url} alt={fotoAEliminar.name} className="size-full object-contain" />
            </div>
          )}
          <DialogFooter className="flex gap-2 sm:justify-end pt-2">
            <Button
              variant="outline"
              className="min-h-[44px] text-[13px]"
              onClick={() => setFotoAEliminar(null)}
              disabled={ocupada}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              className="min-h-[44px] text-[13px] font-semibold"
              onClick={ejecutarEliminarFoto}
              disabled={ocupada}
            >
              {ocupada ? "Eliminando…" : "Eliminar foto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Lightbox para previsualización ampliada de foto */}
      <Dialog open={Boolean(fotoLightbox)} onOpenChange={(open) => !open && setFotoLightbox(null)}>
        <DialogContent className="sm:max-w-3xl p-4 bg-navy-950 text-white border-navy-800">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white flex items-center justify-between">
              <span>{fotoLightbox?.name}</span>
            </DialogTitle>
          </DialogHeader>
          {fotoLightbox?.url && (
            <div className="rounded-xl overflow-hidden bg-black flex items-center justify-center max-h-[70vh]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={fotoLightbox.url} alt={fotoLightbox.name} className="max-h-[70vh] w-auto object-contain" />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Diálogo accesible de alerta de error (reemplaza alert nativo) */}
      <Dialog open={Boolean(dialogoError)} onOpenChange={(open) => !open && setDialogoError(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-ink">Aviso del sistema</DialogTitle>
            <DialogDescription className="text-[13px] text-muted-foreground mt-2">
              {dialogoError}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-3">
            <Button
              className="min-h-[44px] text-[13px] px-6"
              onClick={() => setDialogoError(null)}
            >
              Entendido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Editor de fase de obra con slider accesible y presets rápidos.
 */
function EditorFase({
  proyectoId,
  fase,
  usuarios,
  puedeEditar,
  puedeEliminar,
  onEliminar,
  onGuardado,
  onError,
}: {
  proyectoId: number;
  fase: FaseVista;
  usuarios: UsuarioOpcion[];
  puedeEditar: boolean;
  puedeEliminar: boolean;
  onEliminar: () => void;
  onGuardado: () => void;
  onError: (msg: string) => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [progreso, setProgreso] = useState(fase.progressPercent);
  const [enviando, setEnviando] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!formRef.current) return;
    setEnviando(true);
    setErrores({});

    const datos = Object.fromEntries(new FormData(formRef.current).entries());
    try {
      const respuesta = await fetch(`/api/proyectos/${proyectoId}/fases/${fase.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(datos),
      });
      const cuerpo = await respuesta.json().catch(() => ({}));
      if (!respuesta.ok) {
        setErrores(cuerpo.fields ?? { _: cuerpo.error ?? "No se pudo guardar la fase." });
        return;
      }
      onGuardado();
    } catch {
      onError("No se pudo guardar la fase. Verifica tu conexión de red e intenta nuevamente.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="rounded-2xl border border-line bg-surface p-6 shadow-xs space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-line">
        <div>
          <span className="text-[13px] font-bold text-gold-800 uppercase tracking-wider">
            Fase {fase.position}
          </span>
          <h2 className="text-xl font-bold text-ink">{fase.title}</h2>
        </div>
        {puedeEliminar && (
          <button
            className="icon-button min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl hover:bg-danger-bg text-danger transition-colors"
            type="button"
            onClick={onEliminar}
            aria-label="Eliminar fase de obra"
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>

      <form className="form-grid" ref={formRef} onSubmit={enviar}>
        <label>
          <span className="text-[13px] font-semibold text-ink">Título de la fase *</span>
          <input
            name="title"
            defaultValue={fase.title}
            disabled={!puedeEditar}
            required
            className="min-h-[44px] text-[13px]"
          />
          {errores.title && <small style={{ color: "#b42318", fontSize: "13px" }}>{errores.title}</small>}
        </label>

        <label>
          <span className="text-[13px] font-semibold text-ink">Periodo constructivo</span>
          <input
            name="period"
            defaultValue={fase.period ?? ""}
            placeholder="Mes 6–9"
            disabled={!puedeEditar}
            className="min-h-[44px] text-[13px]"
          />
        </label>

        <label>
          <span className="text-[13px] font-semibold text-ink">Estado actual</span>
          <select
            name="status"
            defaultValue={fase.status}
            disabled={!puedeEditar}
            className="min-h-[44px] text-[13px]"
          >
            {PHASE_STATUSES.map((estado) => (
              <option key={estado} value={estado}>
                {PHASE_STATUS_LABELS[estado]}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="text-[13px] font-semibold text-ink">Fecha de actualización</span>
          <input
            type="date"
            name="statusDate"
            defaultValue={fase.statusDate ?? ""}
            disabled={!puedeEditar}
            className="min-h-[44px] text-[13px]"
          />
          {errores.statusDate && <small style={{ color: "#b42318", fontSize: "13px" }}>{errores.statusDate}</small>}
        </label>

        {/* Slider accesible de porcentaje de avance con botones de preset */}
        <div className="span-2 rounded-xl bg-surface-alt/70 p-4 border border-line space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[13px] font-bold text-ink">
              Porcentaje de avance constructivo
            </span>
            <output className="text-xl font-extrabold text-gold-950 tabular-nums">
              {progreso}%
            </output>
          </div>

          <input
            type="range"
            name="progressPercent"
            min="0"
            max="100"
            value={progreso}
            aria-label="Porcentaje de avance constructivo"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progreso}
            onChange={(event) => setProgreso(Number(event.target.value))}
            disabled={!puedeEditar}
            className="w-full h-3 bg-line rounded-lg appearance-none cursor-pointer accent-gold-600 focus:outline-none"
          />

          {puedeEditar && (
            <div className="flex items-center gap-2 pt-1">
              {[0, 25, 50, 75, 100].map((valor) => (
                <button
                  key={valor}
                  type="button"
                  onClick={() => setProgreso(valor)}
                  className={`min-h-[44px] flex-1 text-[13px] font-semibold rounded-lg border transition-colors ${
                    progreso === valor
                      ? "bg-gold-600 text-white border-gold-600 shadow-xs"
                      : "bg-surface hover:bg-surface-hover text-ink border-line"
                  }`}
                >
                  {valor}%
                </button>
              ))}
            </div>
          )}
          {errores.progressPercent && (
            <small style={{ color: "#b42318", fontSize: "13px" }}>{errores.progressPercent}</small>
          )}
        </div>

        <label className="span-2">
          <span className="text-[13px] font-semibold text-ink flex items-center gap-1.5">
            <Video className="size-4 text-gold-600" />
            URL de video de inspección (YouTube)
          </span>
          <input
            type="url"
            name="videoUrl"
            defaultValue={fase.videoUrl ?? ""}
            placeholder="https://youtube.com/watch?v="
            disabled={!puedeEditar}
            className="min-h-[44px] text-[13px]"
          />
          {errores.videoUrl && <small style={{ color: "#b42318", fontSize: "13px" }}>{errores.videoUrl}</small>}
        </label>

        <label className="span-2">
          <span className="text-[13px] font-semibold text-ink">Ingeniero / Supervisor responsable</span>
          <select
            name="responsibleId"
            defaultValue={fase.responsibleId ?? ""}
            disabled={!puedeEditar}
            className="min-h-[44px] text-[13px]"
          >
            <option value="">Sin asignar</option>
            {usuarios.map((usuario) => (
              <option key={usuario.id} value={usuario.id}>
                {usuario.fullName}
              </option>
            ))}
          </select>
        </label>

        <label className="span-2">
          <span className="text-[13px] font-semibold text-ink">
            Nota pública para el comprador (visible en portal)
          </span>
          <textarea
            name="publicNote"
            defaultValue={fase.publicNote ?? ""}
            placeholder="Detalla los avances estructurales realizados durante este periodo para información de los inversionistas…"
            disabled={!puedeEditar}
            rows={3}
            className="text-[13px]"
          />
        </label>

        {errores._ && <small style={{ color: "#b42318", fontSize: "13px" }}>{errores._}</small>}

        {puedeEditar && (
          <div className="form-actions span-2 flex justify-end pt-3">
            <button
              className="button primary min-h-[44px] px-6 text-[13px] font-semibold"
              type="submit"
              disabled={enviando}
            >
              {enviando ? "Guardando…" : "Guardar cambios de la fase"}
            </button>
          </div>
        )}
      </form>
    </section>
  );
}
