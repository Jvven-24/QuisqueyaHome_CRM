"use client";
import { useEffect, useState } from "react";
import { Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function VerComoBroker({ activeName }: { activeName?: string }) {
  const [brokers, setBrokers] = useState<{ id: number; name: string }[]>([]);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (activeName) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true); setError(null);
    fetch("/api/ver-como", { cache: "no-store" }).then(async res => {
      if (!res.ok) throw new Error("No se pudo cargar la lista de brokers.");
      const body = await res.json();
      if (!cancelled) setBrokers(body.brokers);
    }).catch(() => { if (!cancelled) setError("No se pudo cargar la lista de brokers."); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [activeName, attempt]);
  async function change(exit = false) {
    if (busy || (!exit && !selected)) return;
    setBusy(true); setError(null);
    try {
      const res = await fetch("/api/ver-como", { method: exit ? "DELETE" : "POST", headers: { "content-type": "application/json" }, ...(exit ? {} : { body: JSON.stringify({ brokerId: Number(selected) }) }) });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "No se pudo cambiar de vista.");
      window.location.assign("/inicio");
    } catch (e) { setError(e instanceof Error ? e.message : "Error de conexión. Inténtalo de nuevo."); setBusy(false); }
  }
  return <div className={`border-b border-line px-4 py-3 sm:px-6 ${activeName ? "bg-gold-100" : "bg-surface-alt"}`}>
    <div className="flex flex-wrap items-center gap-3">
      <Eye className="size-5 shrink-0 text-gold-800" aria-hidden="true" />
      {activeName ? <><p role="status" className="min-w-0 flex-1 text-sm text-ink"><strong>Ver como: {activeName}</strong><span className="ml-2 inline-block">Solo lectura · cambios y exportaciones bloqueados</span></p><Button variant="outline" disabled={busy} onClick={() => void change(true)}><X />{busy ? "Saliendo…" : "Salir de esta vista"}</Button></> : <>
        <label htmlFor="view-as-broker" className="text-sm font-semibold text-ink">Ver como broker</label>
        <select id="view-as-broker" value={selected} disabled={loading || busy} onChange={e => setSelected(e.target.value)} className="min-h-12 min-w-0 w-full rounded-md border border-line bg-surface px-3 text-sm sm:w-64"><option value="">{loading ? "Cargando brokers…" : brokers.length ? "Selecciona un broker" : "Sin brokers disponibles"}</option>{brokers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
        <Button variant="outline" disabled={!selected || busy} onClick={() => void change()}>{busy ? "Abriendo…" : "Abrir vista de solo lectura"}</Button>
      </>}
    </div>
    {error && <div className="mt-2 flex flex-wrap items-center gap-2"><p role="alert" className="text-sm text-danger">{error}</p>{!activeName && <Button variant="ghost" onClick={() => setAttempt(a => a + 1)}>Reintentar</Button>}</div>}
  </div>;
}
