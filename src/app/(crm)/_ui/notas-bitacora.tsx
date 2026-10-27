"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

type Nota = { id: number; title: string; description: string | null; author: string | null; createdAt: string; updatedAt: string; puedeEditar: boolean; puedeBorrar: boolean };
type Datos = { notas: Nota[]; puedeCrear: boolean };

export function NotasBitacora({ entidad, entidadId }: { entidad: "lead" | "deal"; entidadId: number }) {
  // La clave fuerza un estado nuevo al cambiar de ficha, incluso con una petición pendiente.
  return <PanelNotas key={`${entidad}:${entidadId}`} entidad={entidad} entidadId={entidadId} />;
}
function PanelNotas({ entidad, entidadId }: { entidad: "lead" | "deal"; entidadId: number }) {
  const [datos, setDatos] = useState<Datos | null>(null);
  const [texto, setTexto] = useState("");
  const [editando, setEditando] = useState<number | null>(null);
  const [borrando, setBorrando] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const bloqueo = useRef(false);
  const url = `/api/actividades/notas?entidad=${entidad}&entidadId=${entidadId}`;
  useEffect(() => {
    const controller = new AbortController();
    fetch(url, { signal: controller.signal }).then(async res => {
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "No se pudieron cargar las notas.");
      setDatos(body);
    }).catch(e => { if (!controller.signal.aborted) setError(e.message); });
    return () => controller.abort();
  }, [url]);

  async function mutar(method: string, id?: number) {
    if (bloqueo.current) return;
    bloqueo.current = true;
    setOcupado(true); setError(null);
    try {
      const res = await fetch("/api/actividades/notas", { method, headers: { "content-type": "application/json" }, body: JSON.stringify({ entidad, entidadId, id, texto }) });
      if (!res.ok) { const body = await res.json(); throw new Error(body.error ?? "No se pudo guardar la nota."); }
      setTexto(""); setEditando(null); setBorrando(null);
      const refresco = await fetch(url);
      if (!refresco.ok) throw new Error("Cambio guardado. No se pudieron recargar las notas; vuelve a abrir la ficha.");
      setDatos(await refresco.json());
      setTexto(""); setEditando(null); setBorrando(null);
    } catch (e) { setError(e instanceof Error ? e.message : "Error de conexión."); }
    finally { bloqueo.current = false; setOcupado(false); }
  }
  function guardar(e: FormEvent) { e.preventDefault(); void mutar(editando === null ? "POST" : "PATCH", editando ?? undefined); }
  return <section className="grid gap-3 rounded-lg border border-input-line p-4" aria-label="Bitácora de notas">
    <h3 className="m-0 text-base font-semibold">Notas</h3>
    {error && <p role="alert">{error}</p>}
    {!datos && !error && <p role="status">Cargando notas…</p>}
    {datos?.notas.length === 0 && <p>Aún no hay notas.</p>}
    {datos?.notas.map(nota => <article key={nota.id} className="border-b border-input-line pb-3">
      <p className="whitespace-pre-wrap break-words">{nota.title}</p>
      {nota.description && <p className="whitespace-pre-wrap break-words">{nota.description}</p>}
      <p className="text-xs text-ink-muted">{nota.author ?? "Usuario no disponible"} · <time dateTime={nota.createdAt}>{new Date(nota.createdAt).toLocaleString("es-DO", { timeZone: "America/Santo_Domingo" })}</time>{nota.updatedAt !== nota.createdAt && " · editada"}</p>
      {nota.puedeEditar && <button className="button secondary min-h-12" disabled={ocupado} onClick={() => { setEditando(nota.id); setTexto(nota.description ?? nota.title); setBorrando(null); }}>Editar nota</button>}
      {nota.puedeBorrar && <button className="button secondary min-h-12" disabled={ocupado} onClick={() => setBorrando(nota.id)}>Borrar nota</button>}
      {borrando === nota.id && <div role="group" aria-label="Confirmar borrado de nota"><p>¿Enviar esta nota a la papelera?</p><button className="button secondary min-h-12" disabled={ocupado} onClick={() => setBorrando(null)}>Cancelar</button><button className="button primary min-h-12" disabled={ocupado} onClick={() => void mutar("DELETE", nota.id)}>Confirmar borrado</button></div>}
    </article>)}
    {(datos?.puedeCrear || editando !== null) && <form onSubmit={guardar} className="grid gap-2">
      <label>{editando === null ? "Agregar nota" : "Editar nota"}<textarea className="min-h-24 w-full rounded-lg border border-input-line p-3" required maxLength={10000} value={texto} disabled={ocupado} onChange={e => setTexto(e.target.value)} /></label>
      <button className="button primary min-h-12" disabled={ocupado || !texto.trim()}>{ocupado ? "Guardando…" : "Guardar nota"}</button>
      {editando !== null && <button type="button" className="button secondary min-h-12" disabled={ocupado} onClick={() => { setEditando(null); setTexto(""); }}>Cancelar edición</button>}
    </form>}
  </section>;
}
