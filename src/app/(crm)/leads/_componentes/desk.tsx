"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, MotionConfig } from "motion/react";
import { EstadoConexion } from "../../inicio/estado-conexion";
import s from "./desk.module.css";
export { s };
export function ComercialNav({ grupo = "leads" }: {
    grupo?: "leads" | "contactos";
}) {
    const path = usePathname();
    const links: [
        string,
        string
    ][] = grupo === "leads" ? [["/leads", "Bandeja"], ["/leads/asignacion", "Distribución"], ["/leads/importaciones", "Importación"], ["/leads/duplicados", "Duplicados"]] : [["/contactos", "Personas"], ["/contactos/empresas", "Empresas"], ["/contactos/demandas", "Demandas y matching"]];
    return <nav aria-label={grupo === "leads" ? "Gestión de leads" : "Gestión de contactos"} className={s.nav}>{links.map(([href, label]) => <Link key={href} href={href} aria-current={path === href ? "page" : undefined}>{label}</Link>)}</nav>;
}
export function Desk({ title, subtitle, grupo, children }: {
    title: string;
    subtitle: string;
    grupo?: "leads" | "contactos";
    children: ReactNode;
}) {
    return <div className={s.desk}>
    <EstadoConexion />
    <header>
    <h1>{title}</h1>
    <p className={s.muted}>{subtitle}</p>
    </header>
    <ComercialNav grupo={grupo}/>{children}</div>;
}
export function Preview({ falta, children }: {
    falta: string;
    children: ReactNode;
}) {
    const [state, setState] = useState("datos");
    return <>
    <p role="note" className={s.preview}>
    <strong>Vista previa · datos de ejemplo — falta: {falta}</strong>. Los cambios de esta vista no se guardan en el CRM.</p>
    <details className={s.panel}>
    <summary>Revisar los estados de esta vista previa</summary>
    <label>Estado de demostración<select aria-label="Estado de demostración" value={state} onChange={e => setState(e.target.value)}>{[["datos", "Con datos"], ["carga", "Cargando"], ["vacio", "Vacío"], ["error", "Error"], ["offline", "Sin conexión"], ["permiso", "Sin permiso"]].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
    </label>
    </details>{state === "datos" ? children : state === "carga" ? <div className={s.panel} role="status" aria-busy="true">Cargando registros de ejemplo…</div> : state === "vacio" ? <div className={s.empty}>
        <h2>No hay registros en esta demostración</h2>
        <button className={s.button} onClick={() => setState("datos")}>Cargar ejemplos</button>
        </div> : <div className={s.panel} role={state === "error" ? "alert" : "status"}>
        <h2>{state === "error" ? "No se pudo cargar la vista" : state === "offline" ? "Sin conexión" : "No tienes permiso para esta operación"}</h2>
        <p>{state === "permiso" ? "Solicita acceso al administrador. Este estado es una demostración; el acceso real se comprueba en el servidor." : "Se conservan los datos locales de esta vista previa."}</p>
        <button className={s.button} onClick={() => setState("datos")}>{state === "offline" ? "Reconectar" : "Volver a los ejemplos"}</button>
        </div>}</>;
}
let openDialogs = 0;
let previousOverflow = "";
export function Dialog({ title, onClose, children }: {
    title: string;
    onClose: () => void;
    children: ReactNode;
}) {
    const ref = useRef<HTMLElement>(null);
    const close = useRef(onClose);
    useEffect(() => { close.current = onClose; }, [onClose]);
    useEffect(() => {
        const node = ref.current;
        if (!node) return;
        const previous = document.activeElement as HTMLElement | null;
        if (++openDialogs === 1) { previousOverflow = document.body.style.overflow; document.body.style.overflow = "hidden"; }
        const focusable = () => Array.from(node.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]')).filter(el => el.offsetParent !== null);
        const frame = requestAnimationFrame(() => (focusable()[0] ?? node).focus());
        function keyboard(event: KeyboardEvent) {
            if (Array.from(document.querySelectorAll('[role="dialog"]')).at(-1) !== node) return;
            if (event.key === "Escape") { event.preventDefault(); event.stopImmediatePropagation(); close.current(); }
            if (event.key === "Tab") {
                const items = focusable(); const first = items[0]; const last = items.at(-1);
                if (!first) { event.preventDefault(); node!.focus(); return; }
                if (event.shiftKey && (document.activeElement === first || !node!.contains(document.activeElement))) { event.preventDefault(); last?.focus(); }
                else if (!event.shiftKey && (document.activeElement === last || !node!.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
                event.stopImmediatePropagation();
            }
        }
        window.addEventListener("keydown", keyboard, true);
        return () => { cancelAnimationFrame(frame); window.removeEventListener("keydown", keyboard, true); if (--openDialogs === 0) document.body.style.overflow = previousOverflow; if (previous?.isConnected) previous.focus(); };
    }, []);
    return <MotionConfig reducedMotion="user">
    <div className={s.overlay} onMouseDown={e => { if (e.target === e.currentTarget)
        onClose(); }}>
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: .18 }} className={s.dialog} ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title}>
    <header>
    <h2>{title}</h2>
    <button type="button" className={s.button} onClick={onClose} aria-label="Cerrar diálogo">Cerrar</button>
    </header>{children}</motion.section>
    </div>
    </MotionConfig>;
}
export function PendingAction({ label, falta, children }: {
    label: string;
    falta: string;
    children?: ReactNode;
}) {
    const [open, setOpen] = useState(false);
    const [notice, setNotice] = useState(false);
    const [error, setError] = useState("");
    return <>
    <button type="button" className={s.button} onClick={() => { setOpen(true); setNotice(false); setError(""); }}>{label}</button>{notice && <p role="status" className={s.preview}>Solicitud preparada en vista previa. Falta: {falta}. No se guardó ningún cambio.</p>}{open && <Dialog title={label} onClose={() => setOpen(false)}>
        <form noValidate onSubmit={event => { event.preventDefault(); const fields = Array.from(event.currentTarget.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('[required]')); const invalid = fields.find(field => !field.value.trim() || !field.checkValidity()); if (invalid) { setError("Completa los campos obligatorios y revisa su formato."); invalid.focus(); return; } setNotice(true); setOpen(false); }}>
        <p>Revisa la solicitud antes de preparar la operación de ejemplo.</p>{children}<p className={s.preview}>Falta: {falta}. Esta acción no persiste datos.</p>
        {error && <p role="alert" className={s.error}>{error}</p>}
        <button type="submit" className={s.primary}>Preparar solicitud de ejemplo</button>
        </form>
        </Dialog>}</>;
}
export function download(name: string, content: string, type = "text/csv;charset=utf-8") {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
