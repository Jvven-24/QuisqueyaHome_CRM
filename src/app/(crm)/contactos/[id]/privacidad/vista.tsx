"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { Desk, Preview, Dialog, download, s } from "../../../leads/_componentes/desk";
export function PrivacidadVista({ id, name, consentAt, consentSource, canExport }: {
    id: number;
    name: string;
    consentAt: string | null;
    consentSource: string | null;
    canExport: boolean;
}) {
    const [channels, setChannels] = useState<Record<string, string>>({ Correo: "sin-evidencia", Teléfono: "sin-evidencia", WhatsApp: "sin-evidencia" });
    const [action, setAction] = useState("");
    const [reason, setReason] = useState("");
    const [ack, setAck] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [busy, setBusy] = useState(false);
    const lock = useRef(false);
    async function exportData() { if (lock.current)
        return; lock.current = true; setBusy(true); setError(""); try {
        const response = await fetch("/api/contactos/" + id + "/exportar", { cache: "no-store" });
        const body = await response.json();
        if (!response.ok)
            throw new Error(body.error ?? "No se pudo exportar la ficha.");
        download("datos-contacto-" + id + ".json", JSON.stringify(body, null, 2), "application/json");
        setNotice("Ficha exportada. La exportación quedó auditada; no incluye negocios, documentos ni comunicaciones.");
        setAction("");
    }
    catch (e) {
        setError(e instanceof Error ? e.message : "Fallo de conexión. No se confirmó la exportación.");
    }
    finally {
        lock.current = false;
        setBusy(false);
    } }
    function prepare() { if (!reason.trim() || !ack) {
        setError("Escribe el motivo y confirma que revisaste el alcance.");
        return;
    } setNotice("Solicitud de ejemplo preparada: " + action + ". Falta persistir preferencias, baja o solicitudes de eliminación y su auditoría. No se modificó ningún dato ni canal."); setAction(""); }
    function open(value: string) { setAction(value); setReason(""); setAck(false); setError(""); }
    return <Desk title={"Privacidad de " + name} subtitle="Consulta el registro actual, revisa los canales y gestiona el alcance de los datos." grupo="contactos">
    <Link className={s.button} href={"/contactos/" + id}>Volver a la ficha</Link>
    <section className={s.panel}>
    <h2>Registro actual · datos reales</h2>
    <dl>
    <dt>Fecha registrada</dt>
    <dd>{consentAt ? new Date(consentAt).toLocaleString("es-DO", { timeZone: "America/Santo_Domingo" }) : "Sin registro"}</dd>
    <dt>Fuente registrada</dt>
    <dd>{consentSource ?? "Sin fuente"}</dd>
    <dt>Evidencia por canal y finalidad</dt>
    <dd>No disponible. La existencia de una fecha no acredita autorización para todos los canales.</dd>
    </dl>
    <p>La exportación entrega solo los campos de esta ficha y requiere permiso específico. Cada descarga se registra en auditoría.</p>{canExport ? <button className={s.primary} onClick={() => open("Exportar ficha personal")}>Exportar ficha personal</button> : <p role="note" className={s.preview}>No tienes permiso para exportar contactos. Solicita acceso al administrador.</p>}</section>
    <Preview falta="consentimientos por finalidad y canal, evidencias, revocación, baja y solicitudes de eliminación">
    <section className={s.panel}>
    <h2>Preferencias de comunicación · ejemplo</h2>
    <div className={s.grid}>{Object.keys(channels).map(channel => <label key={channel}>{channel}<select value={channels[channel]} onChange={e => setChannels(c => ({ ...c, [channel]: e.target.value }))}>
        <option value="sin-evidencia">Sin evidencia</option>
        <option value="permitido">Permitido (ejemplo)</option>
        <option value="revocado">Revocado (ejemplo)</option>
        </select>
        </label>)}</div>
    <label>Finalidad<select>
    <option>Seguimiento comercial solicitado</option>
    <option>Novedades y promociones</option>
    </select>
    </label>
    <div className={s.toolbar}>
    <button className={s.button} onClick={() => open("Guardar preferencias de ejemplo")}>Revisar preferencias</button>
    <button className={s.button} onClick={() => open("Solicitar baja de comunicaciones")}>Solicitar baja</button>
    <button className={s.button} onClick={() => open("Solicitar eliminación de datos")}>Solicitar eliminación</button>
    </div>
    <p>La eliminación exige revisar retención, negocios y documentos asociados. La papelera de contactos no equivale a una eliminación de datos personales.</p>
    </section>
    </Preview>{notice && <p role="status" className={s.preview}>{notice}</p>}{error && !action && <p role="alert" className={s.error}>{error}</p>}{action && <Dialog title={action} onClose={() => { if (!busy)
            setAction(""); }}>{action === "Exportar ficha personal" ? <>
            <p>Se descargará un JSON con nombre, teléfono, correo, ubicación, notas y el registro de consentimiento. No incluye documentos, negocios ni comunicaciones.</p>{error && <p className={s.error} role="alert">{error}</p>}<button className={s.primary} disabled={busy} onClick={() => void exportData()}>{busy ? "Preparando exportación…" : "Descargar ficha y registrar auditoría"}</button>
            </> : <>
            <p className={s.preview}>Vista previa. Esta solicitud no cambia datos ni autoriza o bloquea canales en producción.</p>
            <label>Motivo (obligatorio)<textarea value={reason} maxLength={1000} onChange={e => setReason(e.target.value)} aria-required="true"/>
            </label>
            <label className={s.toolbar}>
            <input type="checkbox" checked={ack} onChange={e => setAck(e.target.checked)}/>He revisado la identidad, el alcance y las relaciones del contacto.</label>{error && <p className={s.error} role="alert">{error}</p>}<button className={s.primary} onClick={prepare}>Preparar solicitud de ejemplo</button>
            </>}</Dialog>}</Desk>;
}
