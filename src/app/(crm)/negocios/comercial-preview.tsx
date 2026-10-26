"use client";
import { useState } from "react";
import { useEnLinea } from "./usar-entorno";
import { UNIDADES_EJEMPLO } from "./_ejemplo";
import { alternarSeleccion, cuotasPlan } from "./propuestas";
import { formatearMonto } from "../_ui/formato";

export function ComercialPreview({ puedeEditar }: { puedeEditar: boolean }) {
  const [ids, setIds] = useState<number[]>([]);
  const [aviso, setAviso] = useState("");
  const [panel, setPanel] = useState<"oferta" | "aprobacion" | "reabrir" | null>(null);
  const enLinea = useEnLinea();
  const [precio, setPrecio] = useState("");
  const opciones = UNIDADES_EJEMPLO.filter((u) => ids.includes(u.id));
  const boton = "min-h-12 rounded-lg border border-line px-3 font-semibold";
  return <section className="grid gap-3 rounded-xl border border-gold-600/40 bg-surface-alt p-3 text-sm">
    <h3 className="m-0 font-bold">Ofertas y aprobación comercial</h3>
    <p role="status">Vista previa · datos de ejemplo — falta: inventario comercial autorizado, versiones de propuesta, enlaces públicos y política de descuentos aprobada. Ninguna acción modifica este negocio.</p>
    {!enLinea && <p role="status">Sin conexión. Puedes comparar los ejemplos; el envío está en pausa.</p>}
    {!puedeEditar && <p role="status">Tu rol solo puede consultar esta vista previa.</p>}
    <details><summary className="min-h-12 cursor-pointer py-3">Comparar unidades de ejemplo</summary>
      {UNIDADES_EJEMPLO.map((u) => <label key={u.id} className="flex min-h-12 items-center gap-2"><input type="checkbox" checked={ids.includes(u.id)} onChange={() => { const r = alternarSeleccion(ids, u.id); setIds(r.ids); setAviso(r.error ?? ""); }} />{u.unidad} · {u.m2} m² · {formatearMonto(u.precioCents, u.moneda)}</label>)}
      {opciones.length === 0 ? <p>Selecciona unidades para compararlas.</p> : <div className="grid gap-2">{opciones.map((u) => { const c = cuotasPlan(u.precioCents, u.plan); return <article key={u.id} className="rounded-lg border border-line p-3"><h4>{u.unidad} · {u.habitaciones} habitaciones · {u.banos} baños</h4><p>{u.m2} m² · Piso {u.piso} · {u.vista}</p><p>{formatearMonto(u.precioCents, u.moneda)} · Separación orientativa {formatearMonto(c.separacionCents, u.moneda)}</p><p>Entrega: {u.entrega}. Gastos y disponibilidad pendientes de verificación.</p></article>; })}</div>}
    </details>
    <div className="flex flex-wrap gap-2"><button type="button" className={boton} disabled={!puedeEditar || !enLinea || opciones.length === 0} onClick={() => setPanel("oferta")}>Preparar propuesta</button><button type="button" className={boton} disabled={!puedeEditar || !enLinea} onClick={() => setPanel("aprobacion")}>Solicitar aprobación</button><button type="button" className={boton} disabled={!puedeEditar || !enLinea} onClick={() => setPanel("reabrir")}>Consultar reapertura</button></div>
    {panel && <form className="grid gap-2" onSubmit={(e) => { e.preventDefault(); setAviso(panel === "oferta" ? "Borrador de ejemplo preparado. No se emitió ni compartió: falta el backend de propuestas y enlace público." : panel === "aprobacion" ? "Solicitud no enviada. Falta configurar umbrales y circuito autorizado de aprobación; ningún descuento quedó aprobado." : "La reapertura no está implementada en el backend. No se cambió el negocio ni sus compromisos M40."); setPanel(null); }}>
      <h4>{panel === "oferta" ? "Borrador de propuesta" : panel === "aprobacion" ? "Solicitud de aprobación de descuento" : "Reapertura"}</h4>
      {panel !== "reabrir" && <label>Precio propuesto de ejemplo (USD)<input className={boton + " w-full"} type="number" min="0.01" step="0.01" required value={precio} onChange={(e) => setPrecio(e.target.value)} /></label>}
      <label>Motivo o condiciones<textarea className="w-full rounded-lg border border-line p-3" required maxLength={1000} /></label>
      <button className={boton}>Revisar disponibilidad del servicio</button><button type="button" className={boton} onClick={() => setPanel(null)}>Cancelar</button>
    </form>}
    {aviso && <p role="status">{aviso}</p>}
  </section>;
}
