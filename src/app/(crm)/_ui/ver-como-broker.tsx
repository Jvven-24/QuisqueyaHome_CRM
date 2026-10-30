"use client";
import { useEffect, useState } from "react";
import { Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/**
 * Ver como broker (solo lectura).
 *
 * - `activeName`: franja fina de aviso mientras la vista prestada está activa.
 * - `modo="flotante"`: escritorio; botón discreto abajo a la derecha que abre
 *   un popover, sin robar altura a la página.
 * - `modo="panel"`: móvil; sección dentro de la hoja «Más».
 */
export function VerComoBroker({ activeName, modo = "flotante" }: { activeName?: string; modo?: "flotante" | "panel" }) {
  const [brokers, setBrokers] = useState<{ id: number; name: string }[]>([]);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [abierto, setAbierto] = useState(modo === "panel");
  useEffect(() => {
    if (activeName || !abierto) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true); setError(null);
    fetch("/api/ver-como", { cache: "no-store" }).then(async res => {
      if (!res.ok) throw new Error("No se pudo cargar la lista de brokers.");
      const body = await res.json();
      if (!cancelled) setBrokers(body.brokers);
    }).catch(() => { if (!cancelled) setError("No se pudo cargar la lista de brokers."); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [activeName, attempt, abierto]);
  async function change(exit = false) {
    if (busy || (!exit && !selected)) return;
    setBusy(true); setError(null);
    try {
      const res = await fetch("/api/ver-como", { method: exit ? "DELETE" : "POST", headers: { "content-type": "application/json" }, ...(exit ? {} : { body: JSON.stringify({ brokerId: Number(selected) }) }) });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "No se pudo cambiar de vista.");
      window.location.assign("/inicio");
    } catch (e) { setError(e instanceof Error ? e.message : "Error de conexión. Inténtalo de nuevo."); setBusy(false); }
  }
  const alerta = error && <div className="mt-2 flex flex-wrap items-center gap-2"><p role="alert" className="text-sm text-danger">{error}</p>{!activeName && <Button variant="ghost" onClick={() => setAttempt(a => a + 1)}>Reintentar</Button>}</div>;

  if (activeName) return <div className="border-b border-gold-600/40 bg-gold-100 px-4 py-1 sm:px-6">
    <div className="flex items-center gap-2">
      <Eye className="size-4 shrink-0 text-gold-800" aria-hidden="true" />
      <p role="status" className="m-0 min-w-0 flex-1 truncate text-[13px] text-ink"><strong>Ver como: {activeName}</strong><span className="ml-2 hidden sm:inline">Solo lectura · cambios y exportaciones bloqueados</span><span className="ml-1 sm:hidden">· solo lectura</span></p>
      <Button variant="outline" className="min-h-11" disabled={busy} onClick={() => void change(true)}><X />{busy ? "Saliendo…" : "Salir"}</Button>
    </div>
    {alerta}
  </div>;

  const formulario = <div className="grid gap-2">
    <label htmlFor={`view-as-broker-${modo}`} className="text-sm font-semibold text-ink">Ver como broker</label>
    <select id={`view-as-broker-${modo}`} value={selected} disabled={loading || busy} onChange={e => setSelected(e.target.value)} className="min-h-11 w-full min-w-0 rounded-md border border-line bg-surface px-3 text-sm"><option value="">{loading ? "Cargando brokers…" : brokers.length ? "Selecciona un broker" : "Sin brokers disponibles"}</option>{brokers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
    <Button variant="outline" className="min-h-11" disabled={!selected || busy} onClick={() => void change()}>{busy ? "Abriendo…" : "Abrir vista de solo lectura"}</Button>
    {alerta}
  </div>;

  if (modo === "panel") return <section aria-label="Ver como broker" className="rounded-xl border border-line bg-surface-alt p-3">{formulario}</section>;

  return <Popover open={abierto} onOpenChange={setAbierto}>
    <PopoverTrigger asChild>
      <button type="button" className="fixed right-6 bottom-6 z-30 hidden min-h-11 items-center gap-2 rounded-full border border-line bg-surface px-4 text-[13px] font-semibold text-navy-900 shadow-md hover:bg-surface-alt md:inline-flex" aria-label="Ver como broker (solo lectura)">
        <Eye className="size-4 text-gold-800" aria-hidden="true" />Ver como broker
      </button>
    </PopoverTrigger>
    <PopoverContent side="top" align="end" className="w-80">{formulario}</PopoverContent>
  </Popover>;
}
