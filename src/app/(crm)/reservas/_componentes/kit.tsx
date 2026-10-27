"use client";
import Link from "next/link";
import { useEffect, useState, type ReactNode, type ButtonHTMLAttributes } from "react";
import { Modal } from "../../_ui/prototipo-ui";
import { NavegacionFinanzas } from "../_finanzas/navegacion";
import s from "./finanzas.module.css";
export { s };
export function Button({ children, primary, className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & {
    primary?: boolean;
}) { return <button type="button" className={[s.button, primary ? s.primary : "", className].join(" ")} {...props}>{children}</button>; }
export function FinanceLink({ href, children }: {
    href: string;
    children: ReactNode;
}) { return <Link className={s.link} href={href} onClick={e => { if (!navigator.onLine)
    e.preventDefault(); }}>{children}</Link>; }
export function Connectivity() { const [offline, setOffline] = useState(false); useEffect(() => { const sync = () => setOffline(!navigator.onLine); const protect = (event: MouseEvent) => { const link = event.target instanceof Element ? event.target.closest("a[href]") : null; if (!navigator.onLine && link && !link.getAttribute("href")?.startsWith("#")) {
    event.preventDefault();
    event.stopPropagation();
    setOffline(true);
} }; sync(); window.addEventListener("online", sync); window.addEventListener("offline", sync); document.addEventListener("click", protect, true); return () => { window.removeEventListener("online", sync); window.removeEventListener("offline", sync); document.removeEventListener("click", protect, true); }; }, []); return offline ? <div role="status" className={s.alert}>Sin conexión. Conservamos esta pantalla. Recupera la conexión para guardar o navegar. <Button onClick={() => setOffline(!navigator.onLine)}>Comprobar conexión</Button></div> : null; }
export function FinanceShell({ children, group }: {
    children: ReactNode;
    group?: "reservas" | "comisiones";
}) { return <div className={s.desk}><Connectivity /><NavegacionFinanzas section={group === "comisiones" ? "comisiones" : "reservas"}/>{children}</div>; }
export function PreviewNotice({ missing }: {
    missing: string;
}) { return <div className={s.notice} role="note"><strong>Vista previa · datos de ejemplo — falta: {missing}</strong><div>Las simulaciones no registran movimientos ni emiten documentos.</div></div>; }
export function FinanceModal({ title, children, onClose }: {
    title: string;
    children: ReactNode;
    onClose: () => void;
}) { return <Modal title={title} onClose={onClose}><div className={s.desk}>{children}</div></Modal>; }
export function Empty({ title, children }: {
    title: string;
    children?: ReactNode;
}) { return <div className={s.empty}><h2>{title}</h2>{children}</div>; }
export function Loading() { return <div aria-busy="true" aria-label="Cargando operaciones financieras"><p role="status">Cargando operaciones…</p>{[1, 2, 3].map(n => <div key={n} className={s.skeleton}/>)}</div>; }
