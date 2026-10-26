"use client";
import { useState } from "react";
import { COMPANIES, type CompanyExample } from "../_ejemplo";
import { Desk, Preview, PendingAction, Dialog, s } from "../../leads/_componentes/desk";
export function EmpresasVista() {
    const [query, setQuery] = useState("");
    const [sector, setSector] = useState("");
    const [selected, setSelected] = useState<CompanyExample | null>(null);
    const rows = COMPANIES.filter(c => (c.name + " " + c.email).toLowerCase().includes(query.toLowerCase()) && (!sector || c.sector === sector));
    return <Desk title="Personas y empresas" subtitle="Distingue identidades personales, organizaciones y representación comercial." grupo="contactos">
    <Preview falta="modelo de empresas, identidad fiscal, representantes y relaciones persona–empresa">
    <div className={s.toolbar}>
    <label>Buscar empresa<input value={query} onChange={e => setQuery(e.target.value)} placeholder="Razón social o correo"/>
    </label>
    <label>Sector<select value={sector} onChange={e => setSector(e.target.value)}>
    <option value="">Todos los sectores</option>{COMPANIES.map(c => <option key={c.id}>{c.sector}</option>)}</select>
    </label>
    <PendingAction label="Registrar empresa" falta="alta de empresas, validación fiscal y auditoría">
    <label>Razón social (obligatoria)<input required aria-required="true"/>
    </label>
    <label>Identificador fiscal<input placeholder="RNC o identificación del país"/>
    </label>
    <label>País<select>
    <option>República Dominicana</option>
    <option>Otro país</option>
    </select>
    </label>
    </PendingAction>
    </div>
    <div className={s.table} tabIndex={0} aria-label="Directorio de empresas de ejemplo">
    <table>
    <thead>
    <tr>
    <th>Empresa</th>
    <th>Identidad fiscal</th>
    <th>Representantes</th>
    <th>Responsable</th>
    <th>Negocios</th>
    <th>Acción</th>
    </tr>
    </thead>
    <tbody>{rows.map(c => <tr key={c.id}>
        <td>{c.name}<br />{c.sector}</td>
        <td>{c.rnc}</td>
        <td>{c.people.length}</td>
        <td>{c.owner}</td>
        <td>{c.deals}</td>
        <td>
        <button className={s.button} onClick={() => setSelected(c)}>Ver empresa</button>
        </td>
        </tr>)}</tbody>
    </table>{!rows.length && <p className={s.empty}>Sin empresas para estos filtros. <button className={s.button} onClick={() => { setQuery(""); setSector(""); }}>Limpiar filtros</button>
        </p>}</div>{selected && <Dialog title={selected.name} onClose={() => setSelected(null)}>
        <p>{selected.rnc} · {selected.email}</p>
        <h3>Personas y representación</h3>
        <ul>{selected.people.map(p => <li key={p.name}>{p.name} · {p.role}</li>)}</ul>
        <p>{selected.deals} negocios de ejemplo. No existen vínculos persistidos con contactos reales.</p>
        <PendingAction label="Vincular representante" falta="relación persona–empresa con vigencia y facultades">
        <label>Persona<input placeholder="Buscar persona de ejemplo"/>
        </label>
        <label>Relación<select>
        <option>Representante legal</option>
        <option>Apoderado</option>
        <option>Contacto comercial</option>
        </select>
        </label>
        </PendingAction>
        </Dialog>}</Preview>
    </Desk>;
}
