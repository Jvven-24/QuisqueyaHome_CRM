"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { z } from "zod";
import { matchInventory, type Demand } from "@/application/contactos/matching";
import { DEMANDS, INVENTORY } from "../_ejemplo";
import { Desk, Preview, PendingAction, Dialog, s } from "../../leads/_componentes/desk";
const DemandSchema = z.object({ name: z.string().trim().min(1, "Escribe el nombre de la demanda."), zone: z.string().trim().min(1, "Indica una zona."), min: z.coerce.number().nonnegative("El mínimo no puede ser negativo."), max: z.coerce.number().positive("El máximo debe ser mayor que cero."), bedrooms: z.coerce.number().int().min(0).max(20), area: z.coerce.number().min(0).max(100000) }).refine(v => v.max >= v.min, { message: "El máximo no puede ser menor al mínimo.", path: ["max"] });
const money = (cents: number, currency: string) => new Intl.NumberFormat("es-DO", { style: "currency", currency, maximumFractionDigits: 0 }).format(cents / 100);
export function DemandasVista({ initial }: {
    initial?: Demand;
}) {
    const [query, setQuery] = useState("");
    const [status, setStatus] = useState("");
    const [demand, setDemand] = useState(initial ?? null);
    const [editing, setEditing] = useState(false);
    const [onlyAvailable, setOnlyAvailable] = useState(true);
    const [minimum, setMinimum] = useState(0);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const matches = useMemo(() => demand ? matchInventory(demand, INVENTORY) : [], [demand]);
    const filtered = matches.filter(m => (!onlyAvailable || m.eligible) && m.score >= minimum);
    function save(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); const data = Object.fromEntries(new FormData(event.currentTarget)); const result = DemandSchema.safeParse(data); if (!result.success) {
        setError(result.error.issues.map(i => i.message).join(" "));
        return;
    } const value = result.data; const next: Demand = { ...(demand ?? DEMANDS[0]!), id: demand?.id ?? "DEM-EJ-NUEVA", name: value.name, zone: value.zone, minCents: Math.round(value.min * 100), maxCents: Math.round(value.max * 100), bedrooms: value.bedrooms, areaMin: value.area }; setDemand(next); setEditing(false); setNotice("Criterios actualizados en esta sesión de ejemplo. No se guardó una demanda en el CRM."); }
    return <Desk title={initial ? "Demanda y coincidencias" : "Demandas y matching"} subtitle="Explica por qué una unidad coincide y qué condiciones quedan pendientes." grupo="contactos">
    <Preview falta="demandas persistentes, preferencias, conexión al inventario visible y propuestas vinculadas">
    <section className={s.panel}>
    <div className={s.toolbar}>
    <label>Buscar demanda<input value={query} onChange={e => setQuery(e.target.value)}/>
    </label>
    <label>Estado<select value={status} onChange={e => setStatus(e.target.value)}>
    <option value="">Todos</option>
    <option value="activa">Activa</option>
    <option value="pausada">Pausada</option>
    </select>
    </label>
    <button className={s.primary} onClick={() => { setDemand(null); setError(""); setEditing(true); }}>Nueva demanda de ejemplo</button>
    </div>
    <div className={s.table} tabIndex={0} aria-label="Demandas de ejemplo">
    <table>
    <thead>
    <tr>
    <th>Demanda / persona</th>
    <th>Criterios</th>
    <th>Presupuesto</th>
    <th>Estado</th>
    <th>Acción</th>
    </tr>
    </thead>
    <tbody>{DEMANDS.filter(d => (d.name + " " + d.contact).toLowerCase().includes(query.toLowerCase()) && (!status || d.status === status)).map(d => <tr key={d.id}>
        <td>
        <Link href={"/contactos/demandas/" + d.id}>{d.name}</Link>
        <br />{d.contact}</td>
        <td>{d.zone} · {d.bedrooms} habitaciones · ≥{d.areaMin} m²</td>
        <td>{money(d.minCents, d.currency)} – {money(d.maxCents, d.currency)}</td>
        <td>{d.status} · prioridad {d.priority}</td>
        <td>
        <button className={s.button} onClick={() => { setDemand(d); setNotice(""); }}>Ver coincidencias</button>
        </td>
        </tr>)}</tbody>
    </table>
    </div>{!DEMANDS.some(d => (d.name + " " + d.contact).toLowerCase().includes(query.toLowerCase()) && (!status || d.status === status)) && <p className={s.empty}>Sin demandas para estos filtros. <button className={s.button} onClick={() => { setQuery(""); setStatus(""); }}>Limpiar filtros</button>
        </p>}</section>{notice && <p role="status" className={s.preview}>{notice}</p>}{demand && <section className={s.panel}>
        <h2>{demand.name} · {demand.contact}</h2>
        <p>{demand.zone} · {demand.operation === "sale" ? "Compra" : "Alquiler"} · {money(demand.minCents, demand.currency)} a {money(demand.maxCents, demand.currency)} · {demand.bedrooms} habitaciones · ≥{demand.areaMin} m²</p>
        <div className={s.toolbar}>
        <button className={s.button} onClick={() => { setEditing(true); setError(""); }}>Ajustar criterios de ejemplo</button>
        <label>Coincidencia mínima<select value={minimum} onChange={e => setMinimum(Number(e.target.value))}>
        <option value={0}>Todas</option>
        <option value={60}>60 puntos</option>
        <option value={80}>80 puntos</option>
        <option value={100}>100 puntos</option>
        </select>
        </label>
        <label className={s.toolbar}>
        <input type="checkbox" checked={onlyAvailable} onChange={e => setOnlyAvailable(e.target.checked)}/>Solo candidatas disponibles y de la misma operación y moneda</label>
        </div>
        <p>Regla de ejemplo: presupuesto 40 puntos, zona 30, habitaciones 20 y área 10. Las unidades ocupadas o de otra operación o moneda se excluyen. Un puntaje alto no garantiza disponibilidad ni reserva.</p>
        <div className={s.grid}>{filtered.map(match => <article key={match.candidate.id} className={s.panel}>
            <h3>{match.candidate.project} · {match.candidate.unit}</h3>
            <span className={s.badge}>{match.eligible ? match.score + " / 100 puntos" : "Excluida"}</span>
            <p>{money(match.candidate.priceCents, match.candidate.currency)} · {match.candidate.area} m² · {match.candidate.bedrooms} habitaciones</p>
            <h4>Por qué coincide</h4>
            <ul>{match.reasons.map(reason => <li key={reason}>{reason}</li>)}</ul>{match.warnings.length > 0 && <>
                <h4>Condiciones pendientes</h4>
                <ul>{match.warnings.map(warning => <li key={warning}>{warning}</li>)}</ul>
                </>}<PendingAction label="Preparar propuesta de ejemplo" falta="propuestas persistentes, verificación de disponibilidad y envío autorizado">
            <p>{demand.name} · {match.candidate.unit}. Precio de ejemplo: {money(match.candidate.priceCents, match.candidate.currency)}.</p>
            <label>Mensaje al contacto<textarea defaultValue="Estas opciones responden a los criterios de tu búsqueda."/>
            </label>
            </PendingAction>
            </article>)}</div>{!filtered.length && <p className={s.empty}>Ninguna unidad cumple este filtro. Ajusta los criterios o muestra las unidades excluidas para revisar sus motivos.</p>}</section>}{editing && <Dialog title="Criterios de demanda de ejemplo" onClose={() => setEditing(false)}>
        <form noValidate onSubmit={save}>
        <label>Nombre (obligatorio)<input name="name" defaultValue={demand?.name ?? ""} aria-required="true"/>
        </label>
        <label>Zona (obligatoria)<select name="zone" defaultValue={demand?.zone ?? "Punta Cana"}>
        <option>Punta Cana</option>
        <option>Santo Domingo</option>
        </select>
        </label>
        <div className={s.grid}>
        <label>Mínimo ({demand?.currency ?? "USD"})<input name="min" type="number" step="0.01" defaultValue={(demand?.minCents ?? 0) / 100}/>
        </label>
        <label>Máximo (obligatorio)<input name="max" type="number" step="0.01" defaultValue={(demand?.maxCents ?? 30000000) / 100} aria-required="true"/>
        </label>
        <label>Habitaciones mínimas<input name="bedrooms" type="number" defaultValue={demand?.bedrooms ?? 2}/>
        </label>
        <label>Área mínima (m²)<input name="area" type="number" defaultValue={demand?.areaMin ?? 90}/>
        </label>
        </div>{error && <p role="alert" className={s.error}>{error}</p>}<p>Los cambios solo afectan esta sesión y el cálculo de ejemplo.</p>
        <button className={s.primary} type="submit">Recalcular ejemplo</button>
        </form>
        </Dialog>}</Preview>
    </Desk>;
}
