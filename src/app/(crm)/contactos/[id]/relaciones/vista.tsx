"use client";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { RELATIONS } from "../../_ejemplo";
import { Desk, Preview, PendingAction, s } from "../../../leads/_componentes/desk";
const tabs = ["Resumen", "Línea de tiempo", "Negocios y unidades", "Documentos", "Comunicaciones", "Relaciones"] as const;
export function RelacionesVista({ id, name, phone, email, historial }: {
    id: number;
    name: string;
    phone: string | null;
    email: string | null;
    historial: ReactNode;
}) {
    const [tab, setTab] = useState<(typeof tabs)[number]>("Resumen");
    return <Desk title={"Contacto 360 · " + name} subtitle="Identidad, historial y relaciones comerciales con una distinción visible entre datos reales y ejemplos." grupo="contactos">
    <section className={s.panel}>
    <h2>Identidad real</h2>
    <p>{name} · {phone ?? "Sin teléfono"} · {email ?? "Sin correo"}</p>
    <div className={s.toolbar}>
    <Link className={s.button} href={"/contactos/" + id}>Editar ficha</Link>
    <Link className={s.button} href={"/contactos/" + id + "/privacidad"}>Privacidad y preferencias</Link>
    </div>
    </section>
    <section className={s.panel}>
    <h2>Historial real de la ficha</h2>{historial}</section>
    <Preview falta="consulta 360 unificada por alcance de negocios, unidades, documentos, comunicaciones y relaciones">
    <p className={s.preview}>Las relaciones siguientes pertenecen a un expediente ficticio y no están asociadas a {name}.</p>
    <div role="tablist" aria-label="Áreas del contacto de ejemplo" className={s.toolbar}>{tabs.map(item => <button key={item} id={"s3-tab-" + tabs.indexOf(item)} role="tab" tabIndex={tab === item ? 0 : -1} aria-selected={tab === item} aria-controls="s3-relations-panel" className={tab === item ? s.primary : s.button} onClick={() => setTab(item)} onKeyDown={e => { const index = tabs.indexOf(tab); let next = index; if (e.key === "ArrowRight")
            next = (index + 1) % tabs.length;
        else if (e.key === "ArrowLeft")
            next = (index + tabs.length - 1) % tabs.length;
        else if (e.key === "Home")
            next = 0;
        else if (e.key === "End")
            next = tabs.length - 1;
        else
            return; e.preventDefault(); setTab(tabs[next]!); document.getElementById("s3-tab-" + next)?.focus(); }}>{item}</button>)}</div>
    <section id="s3-relations-panel" role="tabpanel" aria-labelledby={"s3-tab-" + tabs.indexOf(tab)} tabIndex={0} className={s.panel}>{tab === "Resumen" ? <>
        <h2>Expediente de ejemplo</h2>
        <div className={s.grid}>
        <p>
        <strong className={s.stat}>1</strong>
        <br />Negocio de ejemplo</p>
        <p>
        <strong className={s.stat}>1</strong>
        <br />Unidad de interés</p>
        <p>
        <strong className={s.stat}>1</strong>
        <br />Documento pendiente</p>
        </div>
        <p>Próxima acción de ejemplo: revisar propuesta y confirmar preferencias de comunicación.</p>
        </> : tab === "Línea de tiempo" ? <>
        <h2>Actividad del expediente ficticio</h2>
        <ol className={s.timeline}>{RELATIONS.timeline.map(item => <li key={item.date}>
            <time>{item.date}</time>
            <h3>{item.title}</h3>
            <p>{item.detail}</p>
            </li>)}</ol>
        <PendingAction label="Registrar nota de ejemplo" falta="línea de tiempo unificada y permisos por actividad">
        <label>Nota<textarea placeholder="Escribe el contexto de esta relación"/>
        </label>
        </PendingAction>
        </> : tab === "Negocios y unidades" ? <>
        <h2>Negocios y unidades de ejemplo</h2>{RELATIONS.businesses.map(item => <article key={item.id}>
            <h3>{item.title}</h3>
            <p>{item.stage} · {item.unit} · {item.amount}</p>
            <PendingAction label="Abrir expediente de ejemplo" falta="vínculo por contacto con negocio y unidad visibles">
            <p>Negocio ficticio {item.id}. No corresponde a un registro del CRM.</p>
            </PendingAction>
            </article>)}</> : tab === "Documentos" ? <>
        <h2>Documentos de ejemplo</h2>{RELATIONS.documents.map(item => <article key={item.name}>
            <h3>{item.name}</h3>
            <p>{item.version} · {item.status}</p>
            <PendingAction label="Revisar documento de ejemplo" falta="archivo privado, control de versiones y acceso firmado">
            <p>Este ejemplo no contiene ningún archivo descargable.</p>
            </PendingAction>
            </article>)}</> : tab === "Comunicaciones" ? <>
        <h2>Comunicaciones de ejemplo</h2>{RELATIONS.communications.map(item => <article key={item.subject}>
            <h3>{item.subject}</h3>
            <p>{item.channel} · {item.status}</p>
            <PendingAction label="Preparar comunicación de ejemplo" falta="conversaciones por contacto y verificación de consentimiento">
            <label>Mensaje<textarea />
            </label>
            </PendingAction>
            </article>)}</> : <>
        <h2>Relaciones de ejemplo</h2>
        <ul>{RELATIONS.people.map(item => <li key={item.name}>{item.name} · {item.relation}</li>)}</ul>
        <PendingAction label="Añadir relación de ejemplo" falta="modelo de relaciones con tipo, vigencia y facultades">
        <label>Persona o empresa<input />
        </label>
        <label>Tipo<select>
        <option>Representante</option>
        <option>Referidor</option>
        <option>Comprador relacionado</option>
        </select>
        </label>
        </PendingAction>
        </>}</section>
    </Preview>
    </Desk>;
}
