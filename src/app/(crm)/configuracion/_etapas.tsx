"use client";
import { Switch } from "@/components/ui/switch";

import { useRouter } from "next/navigation";
import { type FormEvent, useRef, useState } from "react";
import { crearEnvioUnico } from "./envio";
import { Badge } from "../_ui/prototipo-ui";

export type EtapaFila = {
  id: number; slug: string; name: string; position: number; kind: string;
  defaultProbability: number | null; isActive: boolean;
};
const TIPOS = [{ value: "open", label: "Abierta" }, { value: "won", label: "Ganada" }, { value: "lost", label: "Perdida" }];
function CamposEtapa({ etapa, posicion }: { etapa?: EtapaFila; posicion: number }) {
  return <>
    <label>Nombre<input name="name" required maxLength={120} defaultValue={etapa?.name ?? ""} /></label>
    <label>Posición<input name="position" type="number" min="1" required defaultValue={etapa?.position ?? posicion} /></label>
    <label>Tipo<select name="kind" defaultValue={etapa?.kind ?? "open"}>{TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></label>
    <label>Probabilidad (%)<input name="defaultProbability" type="number" min="0" max="100" defaultValue={etapa?.defaultProbability ?? ""} /></label>
    <label className="checkbox-inline min-h-11 items-center"><Switch name="isActive" defaultChecked={etapa?.isActive ?? true} aria-label="Etapa activa" />Etapa activa</label>
  </>;
}
export function EtapasPanel({ etapas, puedeEditar }: { etapas: EtapaFila[]; puedeEditar: boolean }) {
  const router = useRouter();
  const enviarUnico = useRef(crearEnvioUnico()).current;
  const [editando, setEditando] = useState<number | "nueva" | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  async function guardar(event: FormEvent<HTMLFormElement>, etapa?: EtapaFila) {
    event.preventDefault();
    const form = event.currentTarget;
    await enviarUnico(async () => {
      if (!navigator.onLine) { setError("Sin conexión. Conéctate para guardar la etapa."); return; }
      setGuardando(true); setError(null); setExito(null);
      const datos = new FormData(form);
      try {
        const response = await fetch(etapa ? `/api/etapas/${etapa.id}` : "/api/etapas", {
          method: etapa ? "PATCH" : "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ name: datos.get("name"), position: Number(datos.get("position")),
            kind: datos.get("kind"), defaultProbability: datos.get("defaultProbability") === "" ? null : Number(datos.get("defaultProbability")),
            isActive: datos.has("isActive") }),
        });
        if (!response.ok) { const body = await response.json().catch(() => ({})); setError(body.error ?? "No se pudo guardar la etapa."); return; }
        setExito(etapa ? "Etapa actualizada." : "Etapa creada."); setEditando(null); router.refresh();
      } catch { setError("Error de red al guardar la etapa."); }
      finally { setGuardando(false); }
    });
  }
  function formulario(etapa?: EtapaFila) {
    return <form className="form-grid" onSubmit={e => void guardar(e, etapa)}>
      <CamposEtapa etapa={etapa} posicion={etapas.length + 1} />
      <div className="form-actions span-2">
        <button className="button secondary" type="button" disabled={guardando} onClick={() => setEditando(null)}>Cancelar</button>
        <button className="button primary" type="submit" disabled={guardando}>{guardando ? "Guardando…" : etapa ? "Guardar cambios" : "Crear etapa"}</button>
      </div>
    </form>;
  }
  return <section className="stage-settings">
    <h2>Etapas de Negocios</h2>
    <p>Configura el orden, nombre, tipo y probabilidad. El orden no cambia las reglas de cada etapa. Para cambiar el tipo de una etapa con negocios o historial, crea otra etapa y desactiva la anterior.</p>
    {error && <p role="alert">{error}</p>}
    {exito && <p role="status">{exito}</p>}
    {puedeEditar && editando !== "nueva" && <button className="button primary" type="button" disabled={guardando} onClick={() => setEditando("nueva")}>Crear etapa</button>}
    {editando === "nueva" && formulario()}
    {etapas.length === 0 && <p role="status">No hay etapas configuradas.</p>}
    {[...etapas].sort((a, b) => a.position - b.position || a.id - b.id).map(etapa => <div key={etapa.id} className="border-b border-line py-4">
      {editando === etapa.id ? formulario(etapa) : <div className="flex flex-wrap items-center justify-between gap-3">
        <div><strong>{etapa.position}. {etapa.name}</strong><p>Probabilidad: {etapa.defaultProbability === null ? "Variable" : `${etapa.defaultProbability}%`}</p></div>
        <Badge tone={etapa.kind === "won" ? "green" : etapa.kind === "lost" ? "red" : "gold"}>{TIPOS.find(t => t.value === etapa.kind)?.label ?? etapa.kind}</Badge>
        {!etapa.isActive && <Badge tone="neutral">Inactiva</Badge>}
        {puedeEditar && <button className="button secondary" type="button" disabled={guardando} onClick={() => setEditando(etapa.id)}>Editar y reordenar</button>}
      </div>}
    </div>)}
  </section>;
}
