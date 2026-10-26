"use client";
import type { DealOption } from "../_deal-options";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { HoldDto } from "@/application/compromisos/dto";
import type { ReservaDto } from "@/application/reservas/dto";
import { Button, Empty, FinanceLink, Loading, s } from "./kit";
import { OperationForm, type OperationKind } from "./operation-form";
import { money } from "./money";
export const reservationLabels: Record<string, string> = { borrador: "Borrador", pendiente_pago: "Pendiente de pago", en_verificacion: "En verificación", confirmada: "Confirmada", expirada: "Expirada", cancelacion_solicitada: "Cancelación solicitada", cancelada: "Cancelada", activo: "Activo", convertido: "Convertido", cancelado: "Cancelado", expirado: "Expirado" };
export function Countdown({ expiresAt, active }: {
    expiresAt: string;
    active: boolean;
}) { const [now, setNow] = useState<number | null>(null); useEffect(() => { setNow(Date.now()); if (!active)
    return; const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, [active]); if (!active)
    return <span>Finalizado</span>; if (now === null)
    return <span>Calculando vigencia…</span>; const remaining = Math.max(0, Math.floor((Date.parse(expiresAt) - now) / 1000)); return <span className={s.money}>{remaining === 0 ? "Plazo cumplido · pendiente de actualizar" : Math.floor(remaining / 3600) + " h " + Math.floor(remaining % 3600 / 60) + " min " + remaining % 60 + " s"}</span>; }
export function Operations({ kind, permissions, deals = [] }: {
    kind: "holds" | "reservas";
    deals?: DealOption[];
    permissions: {
        view: boolean;
        create: boolean;
        edit: boolean;
    };
}) {
    const [rows, setRows] = useState<(HoldDto | ReservaDto)[]>([]);
    const [busy, setBusy] = useState(permissions.view);
    const [error, setError] = useState("");
    const [denied, setDenied] = useState(!permissions.view);
    const [retry, setRetry] = useState(0);
    const [q, setQ] = useState("");
    const [status, setStatus] = useState("");
    const [currency, setCurrency] = useState("");
    const [sort, setSort] = useState("recent");
    const [page, setPage] = useState(1);
    const [notice, setNotice] = useState("");
    const [modal, setModal] = useState<{
        kind: OperationKind;
        row?: HoldDto | ReservaDto;
    } | null>(null);
    useEffect(() => { if (!permissions.view)
        return; const controller = new AbortController(); setBusy(true); setError(""); setDenied(false); fetch("/api/" + kind, { signal: controller.signal, cache: "no-store" }).then(async (r) => { if (r.status === 401 || r.status === 403) {
        setRows([]);
        setDenied(true);
        return;
    } if (!r.ok)
        throw Error("No se pudo actualizar el listado. Conservamos los últimos datos recibidos."); const body = await r.json(); const items = kind === "holds" ? body.holds : body.reservas; if (!Array.isArray(items))
        throw Error("La respuesta del servidor no contiene un listado válido."); setRows(items); }).catch(e => { if (e.name !== "AbortError")
        setError(e.message); }).finally(() => { if (!controller.signal.aborted)
        setBusy(false); }); return () => controller.abort(); }, [kind, permissions.view, retry]);
    const refresh = useCallback(() => setRetry(n => n + 1), []);
    useEffect(() => { window.addEventListener("online", refresh); return () => window.removeEventListener("online", refresh); }, [refresh]);
    const filtered = useMemo(() => rows.filter(row => (!status || row.status === status) && (!currency || ("currency" in row ? row.currency === currency : row.units.some(u => u.currency === currency))) && (!q || [row.id, row.publicId, row.dealId, ...row.units.map(u => u.unitCode)].join(" ").toLowerCase().includes(q.toLowerCase()))).toSorted((a, b) => sort === "expiry" ? (a.expiresAt ?? "9999").localeCompare(b.expiresAt ?? "9999") : b.createdAt.localeCompare(a.createdAt)), [rows, q, status, currency, sort]);
    const pageCount = Math.max(1, Math.ceil(filtered.length / 15));
    const current = Math.min(page, pageCount);
    const displayed = filtered.slice((current - 1) * 15, current * 15);
    const total = (c: string) => rows.reduce((sum, row) => sum + ("currency" in row && row.currency === c ? BigInt(row.totalCents) : 0n), 0n);
    return <><header className={s.header}><div><h1>{kind === "holds" ? "Holds temporales" : "Reservas y condiciones"}</h1><p className={s.subtle}>{kind === "holds" ? "Protege la disponibilidad durante la negociación y vigila cada vencimiento." : "Condiciones comerciales, titulares y unidades en un expediente versionado."}</p></div><div className={s.actions}><Button onClick={refresh} disabled={busy}>Actualizar</Button>{permissions.create && <Button primary onClick={() => setModal({ kind: kind === "holds" ? "hold" : "reserva" })}>{kind === "holds" ? "Solicitar hold" : "Pactar reserva"}</Button>}</div></header>
 {notice && <div role="status" className={s.success}>{notice}</div>}
 {denied ? <Empty title="Sin permiso para consultar este listado"><p>Solicita acceso al responsable de tu cuenta. Tus permisos de negocios no habilitan automáticamente las operaciones de reservas.</p></Empty> : <>
 <div className={s.metrics}><div className={s.metric}><span>Expedientes visibles</span><strong>{rows.length}</strong></div>{kind === "holds" ? <div className={s.metric}><span>Holds activos registrados</span><strong>{rows.filter(r => r.status === "activo").length}</strong></div> : (["USD", "DOP"].map(c => <div className={s.metric} key={c}><span>Total pactado · {c}</span><strong>{money(total(c), c)}</strong></div>))}</div>
 <div className={s.toolbar}><label className={s.field}>Buscar referencia o unidad<input type="search" value={q} onChange={e => { setQ(e.target.value); setPage(1); }} placeholder="Negocio, reserva o código de unidad"/></label><label className={s.field}>Estado<select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}><option value="">Todos los estados</option>{(kind === "holds" ? ["activo", "convertido", "cancelado", "expirado"] : ["borrador", "pendiente_pago", "en_verificacion", "confirmada", "expirada", "cancelacion_solicitada", "cancelada"]).map(v => <option key={v} value={v}>{reservationLabels[v]}</option>)}</select></label><label className={s.field}>Moneda<select value={currency} onChange={e => { setCurrency(e.target.value); setPage(1); }}><option value="">USD y DOP, separados</option><option>USD</option><option>DOP</option></select></label><label className={s.field}>Ordenar<select value={sort} onChange={e => setSort(e.target.value)}><option value="recent">Más recientes</option><option value="expiry">Próximo vencimiento</option></select></label></div>
 {error && <div role="alert" className={s.alert}>{error}<Button onClick={refresh}>Reintentar</Button></div>}
 {busy ? <Loading /> : displayed.length === 0 ? <Empty title={rows.length ? "No hay coincidencias" : "Aún no hay " + (kind === "holds" ? "holds" : "reservas")}><p>{rows.length ? "Ajusta los filtros para recuperar los expedientes." : "Las operaciones guardadas con tu alcance aparecerán aquí."}</p>{rows.length > 0 && <Button onClick={() => { setQ(""); setStatus(""); setCurrency(""); }}>Limpiar filtros</Button>}</Empty> : <div className={s.tableWrap} tabIndex={0} role="region" aria-label="Listado financiero con desplazamiento horizontal"><table className={s.table}><caption className="sr-only">{kind === "holds" ? "Holds temporales" : "Reservas"} · {filtered.length} resultados</caption><thead><tr><th>Referencia / negocio</th><th>Unidades</th><th>Importe pactado</th><th>Estado y vigencia</th><th>Acciones</th></tr></thead><tbody>{displayed.map(row => <tr key={row.id}><td><strong>#{row.id}</strong><br /><FinanceLink href={"/negocios/" + row.dealId}>Negocio #{row.dealId}</FinanceLink></td><td>{row.units.map((u, i) => <div key={i}>{u.unitCode}<br /><span className={s.subtle}>{money(u.priceCents, u.currency)}</span></div>)}</td><td className={s.money}>{"totalCents" in row ? money(row.totalCents, row.currency) : "Por unidad"}</td><td><span className={s.badge}>{reservationLabels[row.status]}</span><br />{row.expiresAt && <><time dateTime={row.expiresAt}>{new Date(row.expiresAt).toLocaleString("es-DO", { timeZone: "America/Santo_Domingo" })}</time><br /></>}{"holderId" in row && <Countdown expiresAt={row.expiresAt!} active={row.status === "activo"}/>}</td><td><div className={s.actions}>{"totalCents" in row ? <FinanceLink href={"/reservas/" + row.publicId}>Abrir expediente</FinanceLink> : <>{permissions.edit && row.status === "activo" && <><Button onClick={() => setModal({ kind: "extender", row })}>Extender</Button><Button onClick={() => setModal({ kind: "liberar", row })}>Liberar</Button></>}</>}</div></td></tr>)}</tbody></table></div>}
 <div className={s.actions}><Button disabled={current === 1} onClick={() => setPage(current - 1)}>Anterior</Button><span>Página {current} de {pageCount} · {filtered.length} resultados</span><Button disabled={current >= pageCount} onClick={() => setPage(current + 1)}>Siguiente</Button></div></>}
 {modal && <OperationForm deals={deals} kind={modal.kind} id={modal.row?.id} version={modal.row?.rowVersion} onClose={() => setModal(null)} onSaved={() => { setNotice("Operación confirmada y guardada por el servidor."); refresh(); }}/>}
 </>;
}
