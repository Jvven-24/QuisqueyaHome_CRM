"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useRef, useState } from "react";
import { PHASE_STATUSES } from "@/domain/catalogs";
import { PHASE_STATUS_LABELS } from "@/domain/avance-obra";
import type { constructionPhases } from "@/infrastructure/db/schema";
import { PageHeader } from "../_ui/prototipo-ui";
import { Vacio } from "../_ui/estados";

export type ProyectoOpcion = { id: number; slug: string; name: string; estimatedDeliveryDate: string | null };
type FaseRow = typeof constructionPhases.$inferSelect;
export type FaseVista = FaseRow & { responsableNombre: string | null };
export type UsuarioOpcion = { id: number; fullName: string };
export type FotoVista = { id: number; name: string; url: string | null };

/**
 * M6 · Avances de obra (F3, issue #32). `construction_phases` real en vez del
 * mock (`ponytail:` eliminado): selector de proyecto y de fase que navegan
 * con `router.push` (mismo patrón que `comisiones/vista.tsx`), editor con
 * `fetch` + `router.refresh()` (mismo patrón que `propiedades/[slug]/vista.tsx`)
 * y fotos contra Supabase Storage. Todas las acciones de escritura viven
 * detrás de `puedeEditar`/`puedeCrear`/`puedeEliminar`, ya decididos por
 * `construction_phases:*` en `page.tsx` — ocultar el control no es el
 * permiso, el 403/404 real está en los route handlers.
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
        alert(cuerpo.error ?? errorPorDefecto);
        return false;
      }
      router.refresh();
      return true;
    } catch {
      alert(errorPorDefecto);
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

  async function agregarFase() {
    if (!proyecto) return;
    const title = prompt("Título de la nueva fase:");
    if (!title) return;
    await llamar(
      `/api/proyectos/${proyecto.id}/fases`,
      { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title }) },
      "No se pudo agregar la fase.",
    );
  }

  async function eliminarFase(fase: FaseVista) {
    if (!proyecto) return;
    if (!confirm(`¿Eliminar la fase "${fase.title}"? Esta acción no se puede deshacer.`)) return;
    await llamar(`/api/proyectos/${proyecto.id}/fases/${fase.id}`, { method: "DELETE" }, "No se pudo eliminar la fase.");
  }

  async function alternarPublicacion(fase: FaseVista) {
    if (!proyecto) return;
    await llamar(
      `/api/proyectos/${proyecto.id}/fases/${fase.id}`,
      { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ isPublished: !fase.isPublished }) },
      "No se pudo actualizar la publicación.",
    );
  }

  async function subirFotos(fase: FaseVista, lista: FileList) {
    if (!proyecto || lista.length === 0) return;
    const formData = new FormData();
    for (const archivo of Array.from(lista)) formData.append("foto", archivo);
    await llamar(`/api/proyectos/${proyecto.id}/fases/${fase.id}/fotos`, { method: "POST", body: formData }, "No se pudieron subir las fotos.");
  }

  async function eliminarFoto(fase: FaseVista, foto: FotoVista) {
    if (!proyecto) return;
    if (!confirm(`¿Eliminar la foto "${foto.name}"?`)) return;
    await llamar(`/api/proyectos/${proyecto.id}/fases/${fase.id}/fotos/${foto.id}`, { method: "DELETE" }, "No se pudo eliminar la foto.");
  }

  const faseSeleccionada = fases.find((f) => f.id === faseSeleccionadaId) ?? null;

  return (
    <>
      <PageHeader
        eyebrow="C13 · Gestión manual"
        title="Avances de obra"
        subtitle={
          proyecto
            ? `${proyecto.name} · ${fases.length} fase${fases.length === 1 ? "" : "s"}${
                proyecto.estimatedDeliveryDate ? ` · Entrega estimada ${proyecto.estimatedDeliveryDate}` : ""
              }`
            : "No tienes proyectos visibles todavía."
        }
        action={
          faseSeleccionada && puedeEditar ? (
            <button className="button primary" type="button" disabled={ocupada} onClick={() => void alternarPublicacion(faseSeleccionada)}>
              {faseSeleccionada.isPublished ? "Retirar del portal" : "Publicar en el portal"}
            </button>
          ) : undefined
        }
      />

      {proyectos.length > 1 && (
        <div className="filter-bar">
          <select value={proyecto?.slug ?? ""} onChange={(event) => irCon({ proyecto: event.target.value, fase: undefined })}>
            {proyectos.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {!proyecto ? (
        <Vacio titulo="Sin proyectos" texto="No hay proyectos visibles para tu usuario todavía." />
      ) : fases.length === 0 ? (
        <>
          <Vacio
            titulo="Sin fases todavía"
            texto={puedeCrear ? "Empieza con la plantilla estándar de 8 fases." : "Este proyecto todavía no tiene fases de obra registradas."}
          />
          {puedeCrear && (
            <button className="button primary" type="button" disabled={ocupada} onClick={() => void crearPlantilla()}>
              Crear las 8 fases estándar
            </button>
          )}
        </>
      ) : (
        <>
          <div className="phase-timeline">
            {fases.map((fase) => (
              <button
                className={fase.status === "completed" ? "complete" : fase.id === faseSeleccionadaId ? "active" : ""}
                key={fase.id}
                type="button"
                aria-current={fase.id === faseSeleccionadaId ? "true" : undefined}
                onClick={() => irCon({ fase: String(fase.id) })}
              >
                <span>{fase.status === "completed" ? "✓" : fase.position}</span>
                <strong>{fase.title}</strong>
                <small>{fase.status === "in_progress" ? `En curso ${fase.progressPercent}%` : PHASE_STATUS_LABELS[fase.status]}</small>
              </button>
            ))}
            {puedeCrear && (
              <button type="button" onClick={() => void agregarFase()} disabled={ocupada}>
                <span>+</span>
                <strong>Agregar fase</strong>
              </button>
            )}
          </div>

          {faseSeleccionada && (
            <div className="progress-editor">
              <EditorFase
                key={faseSeleccionada.id}
                proyectoId={proyecto.id}
                fase={faseSeleccionada}
                usuarios={usuarios}
                puedeEditar={puedeEditar}
                puedeEliminar={puedeEliminar}
                onEliminar={() => void eliminarFase(faseSeleccionada)}
                onGuardado={() => router.refresh()}
              />
              <aside className="panel upload-panel">
                <p className="eyebrow">Evidencia</p>
                <h2>Fotos de obra</h2>
                {fotosError ? (
                  <p className="helper">{fotosError}</p>
                ) : (
                  <div className="photo-grid">
                    {fotos.map((foto) => (
                      <div key={foto.id}>
                        {foto.url ? (
                          // eslint-disable-next-line @next/next/no-img-element -- URL firmada y temporal de Storage, no un asset estático que next/image pueda optimizar en build.
                          <img src={foto.url} alt={foto.name} />
                        ) : (
                          foto.name
                        )}
                        {puedeEditar && (
                          <button type="button" className="icon-button" onClick={() => void eliminarFoto(faseSeleccionada, foto)} aria-label={`Eliminar ${foto.name}`}>
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                    {puedeEditar && (
                      <label className="button">
                        Agregar fotos
                        <input
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
                      </label>
                    )}
                  </div>
                )}
                <dl className="detail-grid">
                  <div>
                    <dt>Responsable</dt>
                    <dd>{faseSeleccionada.responsableNombre ?? "Sin asignar"}</dd>
                  </div>
                  <div>
                    <dt>Última edición</dt>
                    <dd>{ultimaEdicionTexto ?? "—"}</dd>
                  </div>
                </dl>
                <p className="helper">El comprador verá la nota, el porcentaje y las fotografías en el portal público.</p>
              </aside>
            </div>
          )}
        </>
      )}
    </>
  );
}

function EditorFase({
  proyectoId,
  fase,
  usuarios,
  puedeEditar,
  puedeEliminar,
  onEliminar,
  onGuardado,
}: {
  proyectoId: number;
  fase: FaseVista;
  usuarios: UsuarioOpcion[];
  puedeEditar: boolean;
  puedeEliminar: boolean;
  onEliminar: () => void;
  onGuardado: () => void;
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
      // Sin conexión, o el servidor no respondió: mismo criterio que `llamar`
      // en `AvancesVista` — el usuario no necesita distinguir la causa.
      setErrores({ _: "No se pudo guardar la fase. Verifica tu conexión e intenta de nuevo." });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="panel">
      <div className="panel-title">
        <div>
          <p className="eyebrow">Fase {fase.position}</p>
          <h2>{fase.title}</h2>
        </div>
        {puedeEliminar && (
          <button className="icon-button" type="button" onClick={onEliminar} aria-label="Eliminar fase">
            🗑
          </button>
        )}
      </div>
      <form className="form-grid" ref={formRef} onSubmit={enviar}>
        <label>
          Título
          <input name="title" defaultValue={fase.title} disabled={!puedeEditar} required />
          {errores.title && <small style={{ color: "#b42318" }}>{errores.title}</small>}
        </label>
        <label>
          Periodo
          <input name="period" defaultValue={fase.period ?? ""} placeholder="Mes 6–9" disabled={!puedeEditar} />
        </label>
        <label>
          Estado
          <select name="status" defaultValue={fase.status} disabled={!puedeEditar}>
            {PHASE_STATUSES.map((estado) => (
              <option key={estado} value={estado}>
                {PHASE_STATUS_LABELS[estado]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Fecha de actualización
          <input type="date" name="statusDate" defaultValue={fase.statusDate ?? ""} disabled={!puedeEditar} />
          {errores.statusDate && <small style={{ color: "#b42318" }}>{errores.statusDate}</small>}
        </label>
        <label className="span-2">
          Porcentaje de avance <output>{progreso}%</output>
          <input
            className="range"
            type="range"
            name="progressPercent"
            min="0"
            max="100"
            value={progreso}
            onChange={(event) => setProgreso(Number(event.target.value))}
            disabled={!puedeEditar}
          />
          {errores.progressPercent && <small style={{ color: "#b42318" }}>{errores.progressPercent}</small>}
        </label>
        <label className="span-2">
          URL de video de YouTube
          <input type="url" name="videoUrl" defaultValue={fase.videoUrl ?? ""} placeholder="https://youtube.com/watch?v=" disabled={!puedeEditar} />
          {errores.videoUrl && <small style={{ color: "#b42318" }}>{errores.videoUrl}</small>}
        </label>
        <label>
          Responsable
          <select name="responsibleId" defaultValue={fase.responsibleId ?? ""} disabled={!puedeEditar}>
            <option value="">Sin asignar</option>
            {usuarios.map((usuario) => (
              <option key={usuario.id} value={usuario.id}>
                {usuario.fullName}
              </option>
            ))}
          </select>
        </label>
        <label className="span-2">
          Nota pública
          <textarea name="publicNote" defaultValue={fase.publicNote ?? ""} disabled={!puedeEditar} />
        </label>
        {errores._ && <small style={{ color: "#b42318" }}>{errores._}</small>}
        {puedeEditar && (
          <div className="form-actions span-2">
            <button className="button primary" type="submit" disabled={enviando}>
              {enviando ? "Guardando…" : "Guardar"}
            </button>
          </div>
        )}
      </form>
    </section>
  );
}
