"use client";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { EstadoOutbox } from "@/application/compartido/outbox-estado";
import { ACCIONES_FLUJO, DISPARADORES, NOMBRES_ACCION, NOMBRES_DISPARADOR, PLANTILLAS_FLUJO, validarFlujo, type BorradorFlujo } from "@/application/reportes/automatizaciones";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useOnline } from "../_ui/analytics-state";
import { ModuleTabs, PageHeader, Section } from "@/components/modulo";
import { LEAD_EJEMPLO } from "./_ejemplo";
import { AUTOMATIZACIONES_TABS, type AutomatizacionesTab } from "./_tabs";

const CAMPO = "min-h-12 rounded-lg border border-line bg-surface px-3 text-sm";
export function AutomatizacionesVista({ cola, puedeEditar, tab }: { cola: EstadoOutbox | null; puedeEditar: boolean; tab: AutomatizacionesTab }) {
  const online = useOnline();
  const router = useRouter();
  const [borrador, setBorrador] = useState<BorradorFlujo>({ ...PLANTILLAS_FLUJO[0]!, acciones: [...PLANTILLAS_FLUJO[0]!.acciones] });
  const [locales, setLocales] = useState<BorradorFlujo[]>([]);
  const [aviso, setAviso] = useState("");
  const [dialogo, setDialogo] = useState<"activar" | "reintentar" | "copiloto" | null>(null);
  const [tipoAyuda, setTipoAyuda] = useState("resumen");
  const [texto, setTexto] = useState("");
  const [revisado, setRevisado] = useState(false);
  const bloqueado = !online || !puedeEditar;
  function guardar() {
    const r = validarFlujo(borrador);
    if (!r.ok) { setAviso(r.errores.join(" ")); return; }
    setLocales((l) => [...l, r.borrador]);
    setAviso("Borrador guardado en memoria de esta pestaña. No está activado ni persistido; falta el motor de automatizaciones.");
  }
  return <main className="grid min-w-0 gap-4">
    <PageHeader eyebrow="Operaciones" title="Automatizaciones y copiloto" description="Diseña el seguimiento y supervisa la cola existente." />
    {!online && <p role="status">Sin conexión. Conservamos la información cargada. Guardar, actualizar y solicitar acciones están en pausa.</p>}
    {!puedeEditar && <p role="status">Permiso de consulta: tu alcance no permite preparar cambios ni solicitar acciones.</p>}
    <ModuleTabs label="Secciones de automatizaciones" queryParam="tab" activeTab={tab} panelId="automatizaciones-panel" className="mb-0" items={AUTOMATIZACIONES_TABS.map(({ id, label }) => ({ href: "/automatizaciones", label, value: id }))} />
    {aviso && <p role="status" className="rounded-lg border border-gold-600/40 p-3">{aviso}</p>}
    <div role="tabpanel" id="automatizaciones-panel" aria-labelledby={`automatizaciones-panel-tab-${tab}`} tabIndex={0}>
    {tab === "constructor" && <div><Section title="Constructor de flujos" className="grid gap-4">
      <p>Vista previa · datos de ejemplo — falta: reglas persistentes, motor de ejecución, permisos de cada acción y revisión humana. Ningún flujo está activo.</p>
      <label>Plantilla <select className={CAMPO} onChange={(e) => { const p = PLANTILLAS_FLUJO[Number(e.target.value)]; if (p) setBorrador({ ...p, acciones: [...p.acciones] }); }}><option value="0">Bienvenida desde Meta</option><option value="1">Seguimiento sin próxima acción</option></select></label>
      <label>Nombre del flujo <input className={CAMPO + " w-full"} maxLength={100} value={borrador.nombre} onChange={(e) => setBorrador({ ...borrador, nombre: e.target.value })} disabled={bloqueado} /></label>
      <div className="grid gap-4 md:grid-cols-3">
        <fieldset className="rounded-lg border border-line p-3"><legend>1 · Disparador</legend><select aria-label="Disparador" className={CAMPO + " w-full"} value={borrador.disparador} disabled={bloqueado} onChange={(e) => setBorrador({ ...borrador, disparador: e.target.value as BorradorFlujo["disparador"] })}>{DISPARADORES.map((d) => <option key={d} value={d}>{NOMBRES_DISPARADOR[d]}</option>)}</select></fieldset>
        <fieldset className="rounded-lg border border-line p-3"><legend>2 · Condición</legend><textarea aria-label="Condición" className="min-h-24 w-full rounded-lg border border-line p-3" maxLength={500} value={borrador.condicion} disabled={bloqueado} onChange={(e) => setBorrador({ ...borrador, condicion: e.target.value })} /></fieldset>
        <fieldset className="rounded-lg border border-line p-3"><legend>3 · Acciones en orden</legend>{ACCIONES_FLUJO.map((a) => <label className="flex min-h-12 items-center gap-2" key={a}><Checkbox disabled={bloqueado} checked={borrador.acciones.includes(a)} onCheckedChange={(checked) => setBorrador({ ...borrador, acciones: checked ? [...borrador.acciones, a] : borrador.acciones.filter((x) => x !== a) })} />{NOMBRES_ACCION[a]}</label>)}</fieldset>
      </div>
      <p aria-label="Secuencia del flujo">{NOMBRES_DISPARADOR[borrador.disparador]} → {borrador.condicion || "Condición pendiente"} → {borrador.acciones.map((a) => NOMBRES_ACCION[a]).join(" → ") || "Sin acciones"}</p>
      <div className="flex flex-wrap gap-2"><button type="button" disabled={bloqueado} className={CAMPO} onClick={guardar}>Conservar borrador de sesión</button><button type="button" disabled={bloqueado} className={CAMPO} onClick={() => setDialogo("activar")}>Revisar activación</button></div>
      <h3>Borradores de esta sesión ({locales.length})</h3>{locales.length ? <ul>{locales.map((l, i) => <li key={i}>{l.nombre} · sin activar <button type="button" className={CAMPO} onClick={() => setLocales(locales.filter((_, j) => j !== i))}>Quitar borrador</button></li>)}</ul> : <p>No hay borradores conservados.</p>}
    </Section></div>}
    {tab === "monitor" && <div><Section title="Monitor de ejecuciones" className="grid gap-3"><p>Conteos reales del outbox en el momento de cargar. No prueban que el worker esté ejecutándose.</p>
      {cola ? <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[["Pendientes", cola.pendientes], ["Enviados", cola.enviados], ["Fallidos / cola muerta", cola.fallidos], ["Sin consumidor", cola.sinConsumidor]].map(([k, v]) => <div key={String(k)} className="rounded-lg border border-line p-3"><dt>{k}</dt><dd className="text-2xl font-bold tabular-nums">{v}</dd></div>)}</dl> : <p role="alert">No se pudo leer la cola. No se sustituyen sus conteos por ceros.</p>}
      <p>Último envío: {cola?.ultimoEnviadoAt ? new Intl.DateTimeFormat("es-DO", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Santo_Domingo" }).format(new Date(cola.ultimoEnviadoAt)) : "Sin registro disponible"}.</p>
      <p>El detalle por evento y la acción de reintentar requieren un contrato administrativo adicional. No se expone payload ni datos personales.</p>
      <div className="flex flex-wrap gap-2"><button className={CAMPO} type="button" disabled={!online} onClick={() => router.refresh()}>Actualizar conteos</button><button className={CAMPO} type="button" disabled={bloqueado || !cola || cola.fallidos === 0} onClick={() => setDialogo("reintentar")}>Revisar reintentos</button></div>
    </Section></div>}
    {tab === "copiloto" && <div><Section title="Copiloto con supervisión" className="ml-auto grid w-full max-w-2xl gap-3"><p>Vista previa · datos de ejemplo — falta: proveedor IA, contexto autorizado, cola de revisión y envío. Ningún dato real se comparte.</p>
      <label>Ayuda solicitada <select className={CAMPO} value={tipoAyuda} onChange={(e) => setTipoAyuda(e.target.value)}><option value="resumen">Resumen de lead</option><option value="accion">Próxima acción</option><option value="respuesta">Borrador de respuesta</option></select></label>
      <p>Ejemplo: {LEAD_EJEMPLO.nombre} · {LEAD_EJEMPLO.interes} · {LEAD_EJEMPLO.canal}.</p>
      <button className={CAMPO} type="button" disabled={bloqueado} onClick={() => { setRevisado(false); setTexto(tipoAyuda === "resumen" ? LEAD_EJEMPLO.nombre + ": interés en " + LEAD_EJEMPLO.interes + ". Condiciones por confirmar." : tipoAyuda === "accion" ? LEAD_EJEMPLO.proximaAccion : "Gracias por tu consulta. ¿Podemos confirmar tus preferencias antes de proponerte opciones?"); }}>Preparar ejemplo para revisión</button>
      {texto && <><label>Borrador editable <textarea className="min-h-32 w-full rounded-lg border border-line p-3" value={texto} onChange={(e) => { setTexto(e.target.value); setRevisado(false); }} /></label><label className="flex min-h-12 items-center gap-2"><Checkbox checked={revisado} onCheckedChange={(checked) => setRevisado(checked)} />He revisado este borrador de ejemplo</label><button type="button" className={CAMPO} disabled={bloqueado || !revisado || !texto.trim()} onClick={() => setDialogo("copiloto")}>Revisar envío supervisado</button></>}
    </Section></div>}
    </div>
    <Dialog open={dialogo !== null} onOpenChange={(open) => { if (!open) setDialogo(null); }}><DialogContent><DialogHeader><DialogTitle>{dialogo === "activar" ? "Revisión de activación" : dialogo === "reintentar" ? "Revisar eventos fallidos" : "Envío supervisado"}</DialogTitle><DialogDescription>Esta operación no está conectada a un servicio de escritura.</DialogDescription></DialogHeader><form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); setAviso(dialogo === "activar" ? "No se activó el flujo. Falta el motor persistente y la autorización de sus acciones." : dialogo === "reintentar" ? "No se enviaron reintentos. Falta un contrato administrativo de reintento; la cola quedó intacta." : "No se envió ningún mensaje ni se registró aprobación. Falta la cola humana auditada y el proveedor autorizado."); setDialogo(null); }}><label>Motivo de revisión <textarea required maxLength={500} className="w-full rounded-lg border border-line p-3" /></label><button className={CAMPO} disabled={bloqueado}>Consultar disponibilidad de la operación</button><button className={CAMPO} type="button" onClick={() => setDialogo(null)}>Cancelar</button></form></DialogContent></Dialog>
  </main>;
}
