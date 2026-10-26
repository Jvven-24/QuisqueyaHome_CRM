"use client";
import { useRef, useState, type FormEvent } from "react";
import type { DealOption } from "../_deal-options";
import { crearHoldSchema, extenderHoldSchema, cancelarHoldSchema } from "@/application/compromisos/entrada";
import { crearReservaSchema, confirmarReservaSchema, cancelarReservaSchema, cambiarUnidadReservaSchema } from "@/application/reservas/entrada";
import { decimalToCents } from "./money";
import { Button, FinanceModal, s } from "./kit";
export type OperationKind = "hold" | "reserva" | "extender" | "liberar" | "confirmar" | "cancelar" | "solicitar" | "cambiar";
const titles: Record<OperationKind, string> = { hold: "Solicitar hold temporal", reserva: "Pactar reserva", extender: "Extender hold", liberar: "Liberar hold", confirmar: "Confirmar reserva", cancelar: "Cancelar reserva", solicitar: "Solicitar cancelación", cambiar: "Cambiar unidad" };
const schemas = { hold: crearHoldSchema, reserva: crearReservaSchema, extender: extenderHoldSchema, liberar: cancelarHoldSchema, confirmar: confirmarReservaSchema, cancelar: cancelarReservaSchema, solicitar: cancelarReservaSchema, cambiar: cambiarUnidadReservaSchema };
type UnitDraft = {
    unitId: string;
    price: string;
    currency: "USD" | "DOP";
    priceVersion: string;
    componentRole: string;
};
const blankUnit = (): UnitDraft => ({ unitId: "", price: "", currency: "USD", priceVersion: "1", componentRole: "principal" });
export function OperationForm({ kind, id, version, initialHoldId, onClose, onSaved, deals = [] }: {
    kind: OperationKind;
    deals?: DealOption[];
    id?: number;
    version?: number;
    initialHoldId?: number;
    onClose: () => void;
    onSaved: () => void;
}) {
    const [selectedDeal,setSelectedDeal] = useState(deals.length?"":"manual");
    const [units, setUnits] = useState<UnitDraft[]>([blankUnit()]);
    const [parties, setParties] = useState([{ contactId: "", role: "titular", representationEvidenceId: "" }]);
    const [fields, setFields] = useState<Record<string, string>>({});
    const [message, setMessage] = useState("");
    const [busy, setBusy] = useState(false);
    const lock = useRef(false);
    const key = useRef<string | null>(null);
    const previous = useRef("");
    const formRef = useRef<HTMLFormElement>(null);
    const creation = kind === "hold" || kind === "reserva";
    const needsUnits = creation || kind === "cambiar";
    function field(name: string, label: string, type = "text", hint?: string, required = true, defaultValue?: string | number) { return <label className={s.field}>{label}{required ? " (obligatorio)" : ""}<input name={name} type={type} defaultValue={defaultValue} required={required} min={type === "number" ? 1 : undefined} step={type === "number" ? 1 : undefined} maxLength={type === "text" ? 1000 : undefined} aria-invalid={!!fields[name]} aria-describedby={fields[name] ? "err-" + name : undefined}/>{hint && <small>{hint}</small>}{fields[name] && <span id={"err-" + name} className={s.error}>{fields[name]}</span>}</label>; }
    async function submit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (lock.current)
            return;
        setFields({});
        setMessage("");
        const data = new FormData(e.currentTarget);
        const get = (n: string) => String(data.get(n) ?? "").trim();
        const number = (n: string) => get(n) === "" ? undefined : Number(get(n));
        let body: Record<string, unknown> = {};
        try {
            if (creation) {
                body = { dealId: selectedDeal === "manual" ? number("dealId") : Number(selectedDeal), reason: get("reason"), units: units.map(u => ({ unitId: u.unitId === "" ? undefined : Number(u.unitId), priceCents: decimalToCents(u.price), currency: kind === "reserva" ? get("currency") : u.currency, componentRole: u.componentRole, ...(kind === "hold" ? { priceVersion: Number(u.priceVersion) } : {}) })) };
                if (kind === "hold") {
                    body.durationHours = number("durationHours");
                    body.policyVersion = number("policyVersion");
                }
                else {
                    body.currency = get("currency");
                    body.totalCents = decimalToCents(get("total"));
                    body.depositRequiredCents = decimalToCents(get("deposit"));
                    const adjustment = get("adjustment");
                    body.adjustmentCents = adjustment.startsWith("-") ? "-" + decimalToCents(adjustment.slice(1)) : decimalToCents(adjustment);
                    body.conditionsVersion = number("conditionsVersion");
                    body.conditionsDocumentId = number("conditionsDocumentId");
                    body.conditionsHash = get("conditionsHash");
                    body.parties = parties.map(p => ({ contactId: p.contactId === "" ? undefined : Number(p.contactId), role: p.role, ...(p.role === "representante" ? { representationEvidenceId: Number(p.representationEvidenceId) } : {}) }));
                    if (number("holdId"))
                        body.holdId = number("holdId");
                    if (get("expiresAt"))
                        body.expiresAt = new Date(get("expiresAt") + "-04:00").toISOString();
                }
            }
            else {
                body = { expectedVersion: version, reason: get("reason") };
                if (kind === "extender")
                    body.additionalHours = number("additionalHours");
                if (kind === "confirmar")
                    body.confirmationEvidenceId = number("confirmationEvidenceId");
                if (kind === "cancelar" || kind === "solicitar")
                    body.action = kind === "solicitar" ? "solicitar" : "cancelar";
                if (kind === "cambiar") {
                    const u = units[0]!;
                    body.oldUnitId = number("oldUnitId");
                    body.releaseReason = get("releaseReason");
                    body.newUnit = { unitId: Number(u.unitId), priceCents: decimalToCents(u.price), currency: u.currency, componentRole: u.componentRole };
                }
            }
            const parsed = schemas[kind].safeParse(body);
            if (!parsed.success) {
                const errors: Record<string, string> = {};
                for (const issue of parsed.error.issues) {
                    errors[issue.path.join(".") || "_"] = issue.message.startsWith("Invalid") || issue.message.startsWith("Too ") ? "Revisa este dato obligatorio y su formato." : issue.message;
                }
                setFields(errors);
                setMessage("Revisa los campos indicados antes de continuar.");
                return;
            }
            const serialized = JSON.stringify(body);
            if (serialized !== previous.current) {
                key.current = crypto.randomUUID();
                previous.current = serialized;
            }
            lock.current = true;
            setBusy(true);
            const suffix: Partial<Record<OperationKind, string>> = { extender: "extensiones", liberar: "cancelacion", confirmar: "confirmacion", cancelar: "cancelaciones", solicitar: "cancelaciones", cambiar: "cambio-unidad" };
            const endpoint = creation ? (kind === "hold" ? "/api/holds" : "/api/reservas") : (kind === "extender" || kind === "liberar" ? "/api/holds/" : "/api/reservas/") + id + "/" + suffix[kind];
            const response = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json", "idempotency-key": key.current! }, body: serialized });
            const result = await response.json().catch(() => null);
            if (!response.ok) {
                setFields(result?.fields ?? {});
                setMessage(response.status === 409 ? "El registro cambió o la unidad ya no está disponible. Cierra, actualiza y revisa la versión antes de intentarlo de nuevo." : response.status === 403 ? "No tienes permiso para esta operación." : result?.error ?? "No se pudo confirmar la operación. Revisa la conexión y reintenta.");
                return;
            }
            if (!result?.ok)
                throw new Error("Respuesta no confirmada por el servidor.");
            onSaved();
            onClose();
        }
        catch (error) {
            setMessage(error instanceof Error && error.message.includes("importe") ? error.message : "No se pudo confirmar la operación. Conservamos tus datos; reintentar el mismo envío usa la misma referencia para evitar duplicados.");
        }
        finally {
            lock.current = false;
            setBusy(false);
        }
    }
    return <FinanceModal title={titles[kind]} onClose={() => { if (!busy)
        onClose(); }}><form ref={formRef} onSubmit={submit} noValidate><p className={s.subtle}>{creation ? "Usa las referencias del negocio, inventario y expediente documental. El servidor comprueba disponibilidad, alcance y condiciones antes de guardar." : "El cambio queda auditado sobre la versión " + version + ". Describe el motivo para conservar la trazabilidad."}</p><div className={s.grid}>
 {creation && <><label className={s.field}>Negocio abierto (obligatorio)<select value={selectedDeal} onChange={e=>{const value=e.target.value;setSelectedDeal(value);const deal=deals.find(d=>d.id===Number(value));if(deal?.unitId)setUnits(rows=>rows.map((u,i)=>i===0?{...u,unitId:String(deal.unitId)}:u));}}><option value="">Selecciona un negocio</option>{deals.map(d=><option key={d.id} value={d.id}>#{d.id} · {d.label} · {d.unitCode}</option>)}<option value="manual">Introducir referencia de otro negocio</option></select><small>Hasta 200 negocios abiertos dentro de tu alcance. Confirma el precio comercial de cada unidad.</small></label>{selectedDeal==="manual"&&field("dealId","Referencia de negocio","number")}</>}
 {kind === "hold" && <>{field("durationHours", "Duración en horas", "number", "Entre 1 y 168 horas.", true, 48)}{field("policyVersion", "Versión de política", "number", undefined, true, 1)}</>}
 {kind === "reserva" && <>{field("holdId", "Referencia de hold", "number", undefined, false, initialHoldId)}<label className={s.field}>Moneda de la reserva<select name="currency"><option>USD</option><option>DOP</option></select></label>{field("total", "Total pactado", "text", "Sin separadores de miles. Ejemplo: 125000.50")}{field("deposit", "Depósito requerido", "text")}{field("adjustment", "Ajuste pactado", "text", "Puede ser negativo. Se suma al precio de las unidades.", true, "0")}{field("conditionsDocumentId", "Documento de condiciones", "number")}{field("conditionsVersion", "Versión de condiciones", "number", undefined, true, 1)}{field("conditionsHash", "Huella SHA-256 del documento", "text", "Copia la huella real de 64 caracteres del expediente; no se genera aquí.")}{field("expiresAt", "Vence el (Santo Domingo)", "datetime-local", undefined, false)}</>}
 {kind === "extender" && field("additionalHours", "Horas adicionales", "number", "Máximo 72 horas por solicitud.", true, 24)}
 {kind === "confirmar" && field("confirmationEvidenceId", "Documento de evidencia de confirmación", "number", "Debe existir en el expediente. La confirmación no registra un cobro.")}
 {kind === "cambiar" && <>{field("oldUnitId", "Unidad anterior", "number")}{field("releaseReason", "Motivo de liberación", "text")}</>}
 </div>
 {needsUnits && <fieldset className={s.panel}><legend>Unidades {kind === "reserva" ? "en la moneda pactada" : "y precios comerciales"}</legend>{units.map((u, i) => <div className={s.panel} key={i}><div className={s.grid}>{([['unitId', 'Referencia de unidad'], ['price', 'Precio comercial'], ['componentRole', 'Componente'], ...(kind === "hold" ? [["priceVersion", "Versión de precio"]] : [])] as [
        keyof UnitDraft,
        string
    ][]).map(([name, label]) => <label key={name} className={s.field}>{label} (obligatorio)<input value={u[name]} inputMode={name === "price" ? "decimal" : name === "unitId" || name === "priceVersion" ? "numeric" : "text"} onChange={e => setUnits(rows => rows.map((r, n) => n === i ? { ...r, [name]: e.target.value } : r))}/></label>)}{kind !== "reserva" && <label className={s.field}>Moneda<select value={u.currency} onChange={e => setUnits(rows => rows.map((r, n) => n === i ? { ...r, currency: e.target.value as "USD" | "DOP" } : r))}><option>USD</option><option>DOP</option></select></label>}</div>{units.length > 1 && <Button onClick={() => setUnits(rows => rows.filter((_, n) => n !== i))}>Quitar unidad {i + 1}</Button>}</div>)}{creation && <Button onClick={() => setUnits(rows => [...rows, blankUnit()])}>Añadir unidad</Button>}</fieldset>}
 {kind === "reserva" && <fieldset className={s.panel}><legend>Titulares y representantes</legend>{parties.map((p, i) => <div className={s.panel} key={i}><div className={s.grid}><label className={s.field}>Referencia de contacto (obligatorio)<input inputMode="numeric" value={p.contactId} onChange={e => setParties(rows => rows.map((r, n) => n === i ? { ...r, contactId: e.target.value } : r))}/></label><label className={s.field}>Participación<select value={p.role} onChange={e => setParties(rows => rows.map((r, n) => n === i ? { ...r, role: e.target.value } : r))}><option value="titular">Titular</option><option value="representante">Representante</option></select></label>{p.role === "representante" && <label className={s.field}>Documento de representación (obligatorio)<input inputMode="numeric" value={p.representationEvidenceId} onChange={e => setParties(rows => rows.map((r, n) => n === i ? { ...r, representationEvidenceId: e.target.value } : r))}/></label>}</div>{parties.length > 1 && <Button onClick={() => setParties(rows => rows.filter((_, n) => n !== i))}>Quitar participante {i + 1}</Button>}</div>)}<Button onClick={() => setParties(rows => [...rows, { contactId: "", role: "titular", representationEvidenceId: "" }])}>Añadir participante</Button></fieldset>}
 <label className={s.field}>Motivo (obligatorio)<textarea name="reason" required maxLength={1000}/></label>
 {message && <div role="alert" className={s.alert}>{message}</div>}{Object.keys(fields).length > 0 && <ul className={s.error}>{Object.entries(fields).map(([name, text]) => <li key={name}>{({ totalCents: "Total pactado", depositRequiredCents: "Depósito", conditionsHash: "Huella documental", reason: "Motivo" } as Record<string, string>)[name] ?? (name.startsWith("units") ? "Unidades" : name.startsWith("parties") ? "Participantes" : name)}: {text}</li>)}</ul>}
 <div className={s.actions}><Button disabled={busy} onClick={onClose}>Volver</Button><Button primary type="submit" disabled={busy}>{busy ? "Confirmando…" : titles[kind]}</Button></div></form></FinanceModal>;
}
