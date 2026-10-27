"use client";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { planAssignments, type AssignmentPlan } from "@/application/leads/distribucion";
import { ETIQUETAS_ESTADO } from "@/application/leads/presentacion";
import type { LeadFila, BrokerOpcion } from "../vista";
import { Desk, Dialog, PendingAction, s } from "../_componentes/desk";
export function AsignacionVista({ leads, brokers, total, page, canAssign, q }: {
    leads: LeadFila[];
    brokers: BrokerOpcion[];
    total: number;
    page: number;
    canAssign: boolean;
    q: string;
}) {
    const router = useRouter();
    const [selected, setSelected] = useState<number[]>([]);
    const [mode, setMode] = useState<"manual" | "round-robin">("manual");
    const [broker, setBroker] = useState("");
    const [pool, setPool] = useState(brokers.map(b => b.userId));
    const [plan, setPlan] = useState<AssignmentPlan[] | null>(null);
    const [reason, setReason] = useState("");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const [results, setResults] = useState<{
        id: number;
        ok: boolean;
        message: string;
    }[]>([]);
    const lock = useRef(false);
    const eligible = leads.filter(l => !["converted", "discarded"].includes(l.status));
    function prepare() { setError(""); try {
        setPlan(planAssignments(leads, mode === "round-robin" ? brokers.filter(b => pool.includes(b.userId)) : brokers, selected, mode, Number(broker)));
        setReason("");
    }
    catch (e) {
        setError(e instanceof Error ? e.message : "Revisa la selección.");
    } }
    async function apply() {
        if (lock.current || !plan)
            return;
        if (!reason.trim()) {
            setError("Escribe la justificación de esta distribución.");
            return;
        }
        lock.current = true;
        setBusy(true);
        setError("");
        const output: typeof results = [];
        try {
            for (const item of plan) {
                try {
                    const response = await fetch("/api/leads/" + item.leadId, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ brokerId: item.brokerId, reason: reason.trim() }) });
                    const body = await response.json().catch(() => ({}));
                    output.push({ id: item.leadId, ok: response.ok && body.ok === true, message: response.ok && body.ok === true ? "Asignación confirmada" : body.error ?? "No se confirmó la asignación. Revisa el lead antes de reintentar." });
                }
                catch {
                    output.push({ id: item.leadId, ok: false, message: "Sin confirmación de red. Revisa el responsable actual antes de reintentar." });
                }
                setResults([...output]);
            }
            setSelected(output.filter(r => !r.ok).map(r => r.id));
            setPlan(null);
            router.refresh();
        }
        finally {
            lock.current = false;
            setBusy(false);
        }
    }
    return <Desk title="Asignación y distribución" subtitle="Revisa la carga y confirma cada cambio de responsable. Cada lead conserva su auditoría.">
    <p className={s.panel}>La selección se limita a las {leads.length} filas de esta página de {total} resultados. Los leads convertidos o descartados no se reasignan. El servidor vuelve a comprobar permisos y concurrencia en cada operación.</p>{!canAssign && <p role="note" className={s.preview}>La reasignación requiere un permiso de edición de leads con alcance total concedido por el administrador. Puedes consultar la distribución; toma tus leads disponibles desde su ficha.</p>}<form action="/leads/asignacion" className={s.toolbar}>
    <label>Buscar lead<input name="q" defaultValue={q} placeholder="Nombre, teléfono o correo"/>
    </label>
    <button className={s.button}>Buscar</button>
    <Link className={s.button} href="/leads/asignacion">Limpiar</Link>
    </form>
    <div className={s.table} tabIndex={0} aria-label="Leads para distribución">
    <table>
    <thead>
    <tr>
    <th>
    <label>
    <Checkbox aria-label="Seleccionar todos los leads abiertos de esta página" checked={eligible.length > 0 && selected.length === eligible.length} disabled={!canAssign || busy} onCheckedChange={checked => setSelected(checked ? eligible.map(l => l.id) : [])} />Seleccionar</label>
    </th>
    <th>Lead</th>
    <th>Estado</th>
    <th>Responsable actual</th>
    <th>Interés</th>
    </tr>
    </thead>
    <tbody>{leads.map(lead => <tr key={lead.id}>
        <td>
        <label className={s.checkTarget}><Checkbox aria-label={"Seleccionar " + lead.contactName} checked={selected.includes(lead.id)} disabled={!canAssign || busy || !eligible.some(l => l.id === lead.id)} onCheckedChange={checked => setSelected(ids => checked ? [...ids, lead.id] : ids.filter(id => id !== lead.id))} /></label>
        </td>
        <td>
        <Link href={"/leads/" + lead.id}>{lead.contactName}</Link>
        </td>
        <td>{ETIQUETAS_ESTADO[lead.status]}</td>
        <td>{lead.brokerName ?? "Sin asignar"}</td>
        <td>{lead.projectName ?? lead.zoneInterest ?? "Sin especificar"}</td>
        </tr>)}</tbody>
    </table>{!leads.length && <p className={s.empty}>No hay leads para estos filtros.</p>}</div>
    <div className={s.toolbar}>{page > 1 && <Link className={s.button} href={"?page=" + (page - 1) + "&q=" + encodeURIComponent(q)}>Anterior</Link>}<span>Página {page} de {Math.max(1, Math.ceil(total / 20))}</span>{page * 20 < total && <Link className={s.button} href={"?page=" + (page + 1) + "&q=" + encodeURIComponent(q)}>Siguiente</Link>}</div>{canAssign && <section className={s.panel}>
        <h2>Plan de distribución · {selected.length} seleccionados</h2>
        <div className={s.grid}>
        <label>Método<select aria-label="Método" value={mode} disabled={busy} onChange={e => setMode(e.target.value as typeof mode)}>
        <option value="manual">Un responsable</option>
        <option value="round-robin">Round-robin confirmado</option>
        </select>
        </label>{mode === "manual" ? <label>Broker destinatario<select value={broker} disabled={busy} onChange={e => setBroker(e.target.value)}>
            <option value="">Elegir broker activo</option>{brokers.map(b => <option key={b.userId} value={b.userId}>{b.fullName}</option>)}</select>
            </label> : <fieldset>
            <legend>Participantes del reparto</legend>{brokers.map(b => <label key={b.userId} className={s.toolbar}>
                <Checkbox checked={pool.includes(b.userId)} onCheckedChange={checked => setPool(ids => checked ? [...ids, b.userId] : ids.filter(id => id !== b.userId))} />{b.fullName}</label>)}<p>Reparte en orden entre los participantes activos. El cursor no persiste entre lotes; la asignación automática continua requiere un motor de reglas.</p>
            </fieldset>}</div>
        <button className={s.primary} disabled={busy} onClick={prepare}>Revisar distribución</button>{error && !plan && <p role="alert" className={s.error}>{error}</p>}</section>}<section className={s.panel}>
    <h2>Reglas automáticas</h2>
    <p className={s.preview}>Vista previa · datos de ejemplo — falta: motor persistente de reglas, cursor round-robin, horarios y SLA configurables.</p>
    <p>Prioridad de ejemplo: especialidad por zona → capacidad disponible → round-robin. Ninguna regla se aplica sin revisión.</p>
    <PendingAction label="Configurar regla de distribución" falta="repositorio de reglas y ejecutor de asignación automática">
    <label>Nombre de la regla<input defaultValue="Especialidad por zona"/>
    </label>
    <label>Condición<select>
    <option>Zona de interés coincide con especialidad</option>
    <option>Lead sin responsable</option>
    </select>
    </label>
    <label>Acción<select>
    <option>Sugerir broker especializado</option>
    <option>Repartir entre brokers activos</option>
    </select>
    </label>
    </PendingAction>
    </section>{results.length > 0 && <section className={s.panel} aria-live="polite">
        <h2>Informe del lote</h2>
        <p>{results.filter(r => r.ok).length} confirmados · {results.filter(r => !r.ok).length} pendientes o fallidos. Los cambios confirmados no se revierten si falla otra fila.</p>
        <ul>{results.map(r => <li key={r.id}>
            <Link href={"/leads/" + r.id}>Lead #{r.id}</Link>: {r.message}</li>)}</ul>
        </section>}{plan && <Dialog title="Confirmar distribución" onClose={() => { if (!busy)
            setPlan(null); }}>
        <p>{plan.length} cambios reales. El servidor comprobará que cada lead siga abierto y accesible.</p>
        <ul>{plan.map(item => <li key={item.leadId}>Lead #{item.leadId} → {item.brokerName}</li>)}</ul>
        <label>Justificación (obligatoria)<textarea value={reason} maxLength={1000} onChange={e => setReason(e.target.value)} aria-required="true" disabled={busy}/>
        </label>{error && <p role="alert" className={s.error}>{error}</p>}<p role="status">{busy ? "Aplicando " + results.length + " de " + plan.length + "…" : "Se mostrará un resultado individual por lead."}</p>
        <button className={s.primary} disabled={busy} onClick={() => void apply()}>{busy ? "Asignando…" : "Confirmar asignaciones reales"}</button>
        </Dialog>}</Desk>;
}
