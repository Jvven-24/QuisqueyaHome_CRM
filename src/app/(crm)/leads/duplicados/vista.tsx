"use client";
import { useState } from "react";
import { DUPLICATES, type DuplicateExample } from "../_ejemplo";
import { Desk, Preview, Dialog, s } from "../_componentes/desk";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
const fields = { name: "Nombre", phone: "Teléfono", email: "Correo" } as const;
export function DuplicadosVista() {
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const [primary, setPrimary] = useState(DUPLICATES[0]!.id);
    const [choices, setChoices] = useState<Record<string, string>>({});
    const [reason, setReason] = useState("");
    const [confirmation, setConfirmation] = useState("");
    const [error, setError] = useState("");
    const [result, setResult] = useState<Record<string, string> | null>(null);
    const [ignored, setIgnored] = useState(false);
    const first = DUPLICATES[0]!, second = DUPLICATES[1]!;
    const matches = !ignored && DUPLICATES.some(d => (d.name + " " + d.phone + " " + d.email).toLowerCase().includes(query.toLowerCase()));
    function prepare() { setOpen(true); setChoices(Object.fromEntries(Object.keys(fields).map(key => [key, primary]))); setReason(""); setConfirmation(""); setError(""); }
    function merge() { if (!reason.trim()) {
        setError("Escribe el motivo de la fusión.");
        return;
    } if (confirmation !== "FUSIONAR") {
        setError("Escribe FUSIONAR para confirmar el plan de ejemplo.");
        return;
    } const merged: Record<string, string> = {}; for (const field of Object.keys(fields) as (keyof typeof fields)[]) {
        const contact = DUPLICATES.find(d => d.id === choices[field]);
        if (!contact) {
            setError("Selecciona el valor de cada campo.");
            return;
        }
        merged[field] = contact[field];
    } setResult(merged); setOpen(false); }
    return <Desk title="Duplicados y fusión controlada" subtitle="Compara la evidencia y conserva cada relación antes de decidir una fusión.">
    <Preview falta="índice de duplicados por alcance, fusión transaccional de relaciones, auditoría y reversión">
    <section className={s.panel}>
    <h2>Candidatos a revisión</h2>
    <p>Un teléfono E.164 y un correo coincidentes son evidencia, no autorización para fusionar. Las identidades, consentimientos y negocios deben revisarse por separado.</p>
    <div className={s.toolbar}>
    <label>Buscar candidato<input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Nombre, teléfono o correo"/>
    </label>
    <button className={s.button} onClick={() => { setQuery(""); setIgnored(false); }}>Restablecer ejemplos</button>
    </div>{matches ? <>
        <span className={s.badge}>Coincidencia exacta · teléfono y correo</span>
        <div className={s.table} tabIndex={0} aria-label="Comparación de duplicados">
        <table>
        <thead>
        <tr>
        <th>Campo</th>
        <th>{first.id}</th>
        <th>{second.id}</th>
        </tr>
        </thead>
        <tbody>{["name", "phone", "email", "source", "owner", "created", "leads", "deals", "consent"].map((key, i) => <tr key={key}>
            <th>{["Nombre", "Teléfono", "Correo", "Origen", "Responsable", "Alta", "Leads vinculados", "Negocios vinculados", "Consentimiento"][i]}</th>
            <td>{first[key as keyof DuplicateExample]}</td>
            <td>{second[key as keyof DuplicateExample]}</td>
            </tr>)}</tbody>
        </table>
        </div>
        <label>Registro que se conservaría<select value={primary} onChange={e => setPrimary(e.target.value)}>{DUPLICATES.map(d => <option key={d.id} value={d.id}>{d.id} · {d.name}</option>)}</select>
        </label>
        <div className={s.toolbar}>
        <button className={s.primary} onClick={prepare}>Revisar plan de fusión</button>
        <button className={s.button} onClick={() => setIgnored(true)}>Omitir pareja en esta sesión</button>
        </div>
        </> : <p className={s.empty}>Sin candidatos para esta búsqueda. Puedes restablecer los ejemplos.</p>}</section>{result && <section className={s.panel} role="status">
        <h2>Plan de ejemplo preparado</h2>
        <p className={s.preview}>No se fusionó ningún contacto. Falta ejecutar la transacción, trasladar relaciones y guardar auditoría con posibilidad de reversión.</p>
        <dl>{Object.entries(result).map(([key, value]) => <div key={key}>
            <dt>{fields[key as keyof typeof fields]}</dt>
            <dd>{value}</dd>
            </div>)}</dl>
        <p>Conservar: {primary}. Reasociar 3 leads y 1 negocio; revisar documentos y comunicaciones sin duplicarlos. El consentimiento no se amplía por fusión.</p>
        </section>}{open && <Dialog title="Plan de fusión de ejemplo" onClose={() => setOpen(false)}>
        <p>Registro principal: {primary}. El registro secundario se archivaría con una referencia al principal; ningún negocio ni documento debe perderse.</p>{(Object.entries(fields) as [
                keyof typeof fields,
                string
            ][]).map(([key, label]) => <fieldset key={key}>
            <legend>{label}: valor que se conservaría</legend><RadioGroup aria-label={`${label}: valor que se conservaría`} value={choices[key] ?? ""} onValueChange={id => setChoices(c => ({ ...c, [key]: id }))}>{DUPLICATES.map(d => <label key={d.id} className={`${s.toolbar} min-h-11 items-center`}>
                <RadioGroupItem value={d.id}/>{d[key]} ({d.id})</label>)}</RadioGroup></fieldset>)}<p>El consentimiento seguirá como «No acreditado». La fusión nunca autoriza un canal por sí sola.</p>
        <label>Motivo (obligatorio)<textarea value={reason} onChange={e => setReason(e.target.value)} aria-required="true" maxLength={1000}/>
        </label>
        <label>Escribe FUSIONAR para revisar el plan<input value={confirmation} onChange={e => setConfirmation(e.target.value)} aria-required="true"/>
        </label>{error && <p role="alert" className={s.error}>{error}</p>}<button className={s.primary} onClick={merge}>Preparar fusión de ejemplo</button>
        </Dialog>}</Preview>
    </Desk>;
}
