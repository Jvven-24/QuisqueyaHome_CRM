"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { QualificationInput, parseCurrencyCents } from "@/application/leads/calificacion";
import type { LeadFila } from "../vista";
import { Dialog, s } from "./desk";
export function CalificacionLead({ lead }: {
    lead: LeadFila;
}) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [temperature, setTemperature] = useState("Sin calificar");
    const [commercialScore, setCommercialScore] = useState(0);
    const lock = useRef(false);
    const criteria = [{ label: "Presupuesto definido", ok: lead.budgetMinCents !== null || lead.budgetMaxCents !== null }, { label: "Interés definido", ok: !!(lead.projectId || lead.projectInterestText || lead.zoneInterest) }, { label: "Canal de contacto disponible", ok: !!(lead.contactPhone || lead.contactEmail) }, { label: "Operación identificada", ok: !!lead.operationType }];
    const score = Math.round(criteria.filter(c => c.ok).length / criteria.length * 100);
    async function save(e: React.FormEvent<HTMLFormElement>) { e.preventDefault(); if (lock.current)
        return; const form = new FormData(e.currentTarget); const cents = (key: string) => parseCurrencyCents(String(form.get(key) ?? "")); const parsed = QualificationInput.safeParse({ budgetMinCents: cents("min"), budgetMaxCents: cents("max"), currency: form.get("currency"), projectInterestText: String(form.get("interest") ?? "").trim() || null, zoneInterest: String(form.get("zone") ?? "").trim() || null, operationType: form.get("operation") || null }); if (!parsed.success) {
        setError(parsed.error.issues.map(i => i.message).join(" "));
        return;
    } lock.current = true; setBusy(true); setError(""); try {
        const response = await fetch("/api/leads/" + lead.id + "/calificacion", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(parsed.data) });
        const body = await response.json();
        if (!response.ok || body.ok !== true)
            throw new Error(body.error ?? "No se pudo guardar la calificación.");
        setOpen(false);
        setNotice("Presupuesto e interés guardados y auditados.");
        router.refresh();
    }
    catch (e) {
        setError(e instanceof Error ? e.message : "Fallo de conexión. Conservamos los campos del formulario.");
    }
    finally {
        lock.current = false;
        setBusy(false);
    } }
    return <section className={s.desk}>
    <div className={s.panel}>
    <h3>Calificación del lead</h3>
    <p>
    <strong className={s.stat}>{score}%</strong> de datos básicos completos</p>
    <progress aria-label="Datos básicos completos" value={score} max={100}/>
    <ul>{criteria.map(c => <li key={c.label}>{c.ok ? "Completo" : "Pendiente"}: {c.label}</li>)}</ul>
    <p className={s.muted}>Este indicador mide completitud, no intención de compra ni probabilidad de cierre.</p>
    <p className={s.preview}>Vista previa · datos de ejemplo — falta: scoring comercial y temperatura configurables, evidencia de intención y persistencia de calificación comercial. No se infiere una temperatura de los datos de contacto.</p>
    <details className={s.panel}>
    <summary>Simular calificación comercial</summary>
    <label>Temperatura de ejemplo<select value={temperature} onChange={e => setTemperature(e.target.value)}>
    <option>Sin calificar</option>
    <option>Frío</option>
    <option>Templado</option>
    <option>Caliente</option>
    </select>
    </label>
    <label>Scoring de ejemplo: {commercialScore} / 100<input type="range" min={0} max={100} value={commercialScore} onChange={e => setCommercialScore(Number(e.target.value))}/>
    </label>
    <p role="status">Ejemplo local: {temperature}, {commercialScore} puntos. Falta definir y persistir criterios y ponderaciones.</p>
    </details>
    <button className={s.button} onClick={() => { setOpen(true); setError(""); }}>Editar presupuesto e interés</button>{notice && <p role="status" className={s.success}>{notice}</p>}</div>{open && <Dialog title="Presupuesto e interés" onClose={() => { if (!busy)
            setOpen(false); }}>
        <form noValidate onSubmit={save}>
        <div className={s.grid}>
        <label>Presupuesto mínimo<input name="min" inputMode="decimal" defaultValue={lead.budgetMinCents === null ? "" : lead.budgetMinCents / 100}/>
        </label>
        <label>Presupuesto máximo<input name="max" inputMode="decimal" defaultValue={lead.budgetMaxCents === null ? "" : lead.budgetMaxCents / 100}/>
        </label>
        <label>Moneda (obligatoria)<input name="currency" defaultValue={lead.currency} maxLength={3} aria-required="true"/>
        </label>
        <label>Operación<select name="operation" defaultValue={lead.operationType ?? ""}>
        <option value="">Sin especificar</option>
        <option value="sale">Venta</option>
        <option value="rent">Alquiler</option>
        </select>
        </label>
        </div>
        <label>Interés declarado<input name="interest" maxLength={500} defaultValue={lead.projectInterestText ?? ""}/>
        </label>
        <label>Zona de interés<input name="zone" maxLength={200} defaultValue={lead.zoneInterest ?? ""}/>
        </label>
        <p>Usa punto decimal y sin separadores de miles, por ejemplo 180000.50. Los importes se guardan en centavos. Los campos vacíos eliminan el valor declarado. El proyecto vinculado no cambia.</p>{error && <p className={s.error} role="alert">{error}</p>}<button className={s.primary} disabled={busy}>{busy ? "Guardando…" : "Guardar calificación"}</button>
        </form>
        </Dialog>}</section>;
}
