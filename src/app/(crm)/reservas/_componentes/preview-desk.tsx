"use client";
import { useMemo, useState, type FormEvent } from "react";
import { motion, useReducedMotion } from "motion/react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { PreviewAction, PreviewConfig, PreviewRow } from "./preview-types";
import { Button, Empty, FinanceModal, Loading, PreviewNotice, s } from "./kit";
import { agingBucket, decimalToCents, money } from "./money";
import { simulateSplit } from "./simulation";
const states = ["Con datos", "Cargando", "Vacío", "Error", "Sin conexión", "Sin permiso"];
export function PreviewDesk({ config, portfolio = false, initialRow }: {
    config: PreviewConfig;
    portfolio?: boolean;
    initialRow?: PreviewRow;
}) {
    const [scenario, setScenario] = useState("Con datos");
    const [q, setQ] = useState("");
    const [currency, setCurrency] = useState("");
    const [status, setStatus] = useState("");
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [aging, setAging] = useState("");
    const [selected, setSelected] = useState<PreviewRow | null>(initialRow ?? null);
    const [action, setAction] = useState<PreviewAction | null>(null);
    const [tab, setTab] = useState("Detalle");
    const reduced = useReducedMotion();
    const filtered = useMemo(() => config.rows.filter(r => (!currency || r.currency === currency) && (!status || r.status === status) && (!from || r.date >= from) && (!to || r.date <= to) && (!aging || agingBucket(r.date, "2026-10-19") === aging) && [r.reference, r.person, r.project, r.id].join(" ").toLowerCase().includes(q.toLowerCase())), [config.rows, currency, status, from, to, q, aging]);
    const balances = useMemo(() => ["USD", "DOP"].map(c => ({ currency: c, cents: filtered.filter(r => r.currency === c).reduce((n, r) => n + BigInt(r.cents), 0n) })), [filtered]);
    const buckets = ["Al día", "1–30 días", "31–60 días", "61–90 días", "Más de 90 días"];
    const chart = portfolio ? buckets.map(name => ({ name, value: filtered.filter(r => agingBucket(r.date, "2026-10-19") === name).length })) : Array.from(new Set(config.rows.map(r => r.status))).map(name => ({ name, value: filtered.filter(r => r.status === name).length }));
    return <><header className={s.header}><div><h1>{config.title}</h1><p className={s.subtle}>{config.subtitle}</p></div><div className={s.actions}>{config.actions.map((a, i) => <Button primary={i === 0} key={a.label} onClick={() => setAction(a)}>{a.label}</Button>)}</div></header><PreviewNotice missing={config.missing}/>
 <details className={s.panel}><summary>Estados de esta vista previa</summary><label className={s.field}>Escenario de demostración<select value={scenario} onChange={e => setScenario(e.target.value)}>{states.map(v => <option key={v}>{v}</option>)}</select></label><p className={s.subtle}>Este control permite revisar los seis estados sin alterar datos reales ni permisos de tu cuenta.</p></details>
 {scenario === "Cargando" ? <Loading /> : scenario === "Vacío" ? <Empty title="Todavía no hay registros"><p>Cuando exista el servicio, los expedientes autorizados aparecerán en esta bandeja.</p><Button onClick={() => setScenario("Con datos")}>Volver al ejemplo</Button></Empty> : scenario === "Sin permiso" ? <Empty title="Sin permiso para consultar esta operación"><p>Solicita acceso al administrador. No se muestran datos del expediente.</p><Button onClick={() => setScenario("Con datos")}>Volver al ejemplo</Button></Empty> : scenario === "Error" ? <div role="alert" className={s.alert}><h2>No se pudo cargar la bandeja</h2><p>El servicio no confirmó la consulta. No se ha registrado ninguna operación.</p><Button onClick={() => setScenario("Con datos")}>Reintentar ejemplo</Button></div> : <>
 {scenario === "Sin conexión" && <div role="status" className={s.alert}>Sin conexión · se conserva la última vista de ejemplo. <Button onClick={() => setScenario("Con datos")}>Reintentar ejemplo</Button></div>}
 <div className={s.metrics}><div className={s.metric}><span>Expedientes de ejemplo filtrados</span><strong>{filtered.length}</strong></div>{balances.map(b => <div className={s.metric} key={b.currency}><span>{config.amountLabel} · {b.currency}</span><strong>{money(b.cents, b.currency)}</strong></div>)}</div>
 <section className={s.panel}><h2>{portfolio ? "Antigüedad de cartera" : "Distribución de expedientes"}</h2><p className={s.subtle}>{portfolio ? "Cantidad de cuotas por tramo de vencimiento. Corte fijo de ejemplo: 19/10/2026." : "Conteos de la muestra filtrada, sin mezclar importes de distintas monedas."}</p><div style={{ height: 220, minWidth: 0 }} role="img" aria-label={chart.map(d => d.name + ": " + d.value).join("; ")}><ResponsiveContainer width="100%" height="100%"><BarChart data={chart} margin={{ left: 0, right: 10, top: 10, bottom: 24 }}><XAxis dataKey="name" fontSize={11} interval={0} angle={-12} textAnchor="end" height={55}/><YAxis allowDecimals={false} width={28}/><Tooltip formatter={value => [value, "Expedientes"]}/><Bar dataKey="value" fill="#1d2b53" radius={[4, 4, 0, 0]} isAnimationActive={!reduced}/></BarChart></ResponsiveContainer></div></section>
 <div className={s.toolbar}><label className={s.field}>Buscar expediente<input type="search" placeholder="Referencia, persona o proyecto" value={q} onChange={e => setQ(e.target.value)}/></label><label className={s.field}>Moneda<select value={currency} onChange={e => setCurrency(e.target.value)}><option value="">Ambas, separadas</option><option>USD</option><option>DOP</option></select></label><label className={s.field}>Estado<select value={status} onChange={e => setStatus(e.target.value)}><option value="">Todos los estados</option>{Array.from(new Set(config.rows.map(r => r.status))).map(v => <option key={v}>{v}</option>)}</select></label>{portfolio && <label className={s.field}>Antigüedad<select value={aging} onChange={e => setAging(e.target.value)}><option value="">Todos los tramos</option>{buckets.map(b => <option key={b}>{b}</option>)}</select></label>}<label className={s.field}>Desde<input type="date" value={from} onChange={e => setFrom(e.target.value)}/></label><label className={s.field}>Hasta<input type="date" value={to} onChange={e => setTo(e.target.value)}/></label><Button onClick={() => { setQ(""); setCurrency(""); setStatus(""); setFrom(""); setTo(""); setAging(""); }}>Limpiar filtros</Button></div>
 {from && to && from > to && <div className={s.alert} role="alert">La fecha inicial debe ser anterior a la fecha final.</div>}
 {filtered.length === 0 ? <Empty title="Sin coincidencias"><p>Ajusta la búsqueda, el periodo o la moneda.</p></Empty> : <div className={s.tableWrap} tabIndex={0} role="region" aria-label="Tabla de ejemplo con desplazamiento horizontal"><table className={s.table}><caption className="sr-only">Datos de ejemplo · {config.title}</caption><thead><tr><th>Expediente</th><th>Persona / proyecto</th><th>{config.amountLabel}</th><th>{config.dateLabel}</th><th>Estado{portfolio ? " / antigüedad" : ""}</th><th>Acciones</th></tr></thead><tbody>{filtered.map(r => <tr key={r.id}><td><strong>{r.reference}</strong><div className={s.subtle}>{r.id}</div></td><td>{r.person}<div className={s.subtle}>{r.project}</div></td><td className={s.money}>{money(r.cents, r.currency)}</td><td>{r.date.split("-").reverse().join("/")}</td><td><span className={s.badge}>{r.status}</span>{portfolio && <div>{agingBucket(r.date, "2026-10-19")}</div>}</td><td><Button onClick={() => { setSelected(r); setTab("Detalle"); }}>Abrir detalle</Button></td></tr>)}</tbody></table></div>}
 <section className={s.panel}><h2>Controles de la operación</h2><ul>{config.notes.map(note => <li key={note}>{note}</li>)}</ul></section></>}
 {selected && <FinanceModal title={config.detailTitle ?? "Expediente de ejemplo"} onClose={() => setSelected(null)}><PreviewNotice missing={config.missing}/><h3>{selected.reference}</h3><div className={s.actions}>{["Detalle", "Trazabilidad"].map(t => <Button aria-pressed={tab === t} key={t} onClick={() => setTab(t)}>{t}</Button>)}</div><motion.div key={tab} initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: .16 }}>{tab === "Detalle" ? <dl className={s.detail}>{Object.entries(selected.details).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl> : <ol>{selected.history.map((h, i) => <li key={i}><time>{h.date}</time> · {h.event}</li>)}</ol>}</motion.div><div className={s.actions}>{config.actions.map(a => <Button key={a.label} onClick={() => { setSelected(null); setAction(a); }}>{a.label}</Button>)}</div></FinanceModal>}
 {action && <PreviewActionModal action={action} onClose={() => setAction(null)}/>}
 </>;
}
function PreviewActionModal({ action, onClose }: {
    action: PreviewAction;
    onClose: () => void;
}) {
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [result, setResult] = useState("");
    const [simulation, setSimulation] = useState<string[]>([]);
    function submit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const next: Record<string, string> = {};
        for (const f of action.fields) {
            const v = String(data.get(f.name) ?? "").trim();
            if (f.required && !v)
                next[f.name] = "Completa este campo obligatorio.";
            if (v && f.type === "number" && (!Number.isInteger(Number(v)) || Number(v) < 1))
                next[f.name] = "Escribe un entero positivo.";
            if (v && ["amount", "total"].includes(f.name)) {
                try {
                    decimalToCents(v);
                }
                catch {
                    next[f.name] = "Escribe un importe positivo con hasta dos decimales, sin separadores de miles.";
                }
                if (/^0([.,]0{1,2})?$/.test(v))
                    next[f.name] = "El importe debe ser mayor que cero.";
            }
            if (v && ["rate", "broker"].includes(f.name)) {
                try {
                    if (BigInt(decimalToCents(v)) > 10000n)
                        throw Error();
                }
                catch {
                    next[f.name] = "Escribe un porcentaje entre 0 y 100 con hasta dos decimales, sin ceros iniciales.";
                }
            }
        }
        const start = String(data.get("start") ?? "");
        const end = String(data.get("end") ?? "");
        if (start && end && end < start)
            next.end = "El fin debe ser posterior al inicio.";
        setErrors(next);
        if (Object.keys(next).length) {
            setResult("");
            return;
        }
        if (action.label === "Simular reparto") {
            const rounding = String(data.get("rounding"));
            const split = simulateSplit(String(data.get("amount")), String(data.get("rate")), String(data.get("broker")), String(data.get("currency")) as "USD" | "DOP", rounding === "Redondeo bancario al par" ? "half_even" : rounding === "Redondear hacia arriba" ? "ceil" : "towards_zero", data.get("residual") === "Broker" ? "broker" : "agencia");
            const currency = String(data.get("currency"));
            setSimulation(["Comisión: " + money(split.total, currency), "Broker: " + money(split.broker, currency), "Agencia: " + money(split.agency, currency), "Residual asignado a " + split.residualBeneficiary + ": " + money(split.residual, currency)]);
        }
        setResult("Simulación revisada. No se guardó ni se ejecutó ninguna operación. Falta: " + action.missing + ".");
    }
    return <FinanceModal title={action.label + " · vista previa"} onClose={onClose}><form onSubmit={submit} noValidate><p className={s.notice}>Este formulario permite revisar el flujo. No persiste datos ni solicita una aprobación real.</p><div className={s.grid}>{action.fields.map(f => <label key={f.name} className={s.field}>{f.label}{f.required ? " (obligatorio)" : ""}{f.type === "select" ? <select name={f.name}>{f.options?.map(o => <option key={o}>{o}</option>)}</select> : f.type === "textarea" ? <textarea name={f.name} required={f.required} maxLength={2000} aria-invalid={!!errors[f.name]} aria-describedby={errors[f.name] ? "preview-" + f.name : undefined}/> : <input name={f.name} type={f.type ?? "text"} required={f.required} min={f.type === "number" ? 1 : undefined} maxLength={300} aria-invalid={!!errors[f.name]} aria-describedby={errors[f.name] ? "preview-" + f.name : undefined}/>} {f.hint && <small>{f.hint}</small>}{errors[f.name] && <span role="alert" id={"preview-" + f.name} className={s.error}>{errors[f.name]}</span>}</label>)}</div>{result && <div role="status" className={s.notice}>{result}{simulation.map(v => <p key={v} className={s.money}>{v}</p>)}</div>}<div className={s.actions}><Button onClick={onClose}>Cerrar</Button><Button primary type="submit">Revisar simulación</Button></div></form></FinanceModal>;
}
