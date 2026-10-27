"use client";
/**
 * M8 · Metas — vista cliente. Meta de compañía/personal con lo logrado por
 * moneda, ranking por asesor, metas de proyecto y equipo, equipos y la regla
 * versionada de atribución. Escrituras: `/api/metas`, `/api/metas/alcances`,
 * `/api/metas/equipos` y `/api/metas/atribucion` (solo Administrador).
 */
import { usePathname, useRouter } from "next/navigation";
import { type FormEvent, type ReactNode, useRef, useState } from "react";
import { FijarMetaInput, leerObjetivoFormulario } from "@/application/metas/validacion";
import type { BrokerLevel } from "@/domain/catalogs";
import { cumplimientoPorcentaje, diagnosticarRitmo, formatoPeriodo, nombreMes } from "@/domain/metas";
import { cumplimientoMonto, estadoAvance, logradoEnMoneda, type LogroPorMoneda } from "@/domain/metas-alcances";
import { Modal, PageHeader } from "../_ui/prototipo-ui";
import { AvisoPermiso, Vacio } from "../_ui/estados";
import { DataTable, type Columna } from "@/components/ui/data-table";
import { montoExacto, centavosEntrada } from "../reservas/_finanzas/calculos";
import { boton, control, Panel } from "../reservas/_finanzas/controles";

export type HeroMeta = { targetDeals: number; achievedDeals: number; targetAmountCents: number | null; achievedAmountCents: number; currency: string } | null;
export type BrokerMetaFila = { userId: number; fullName: string; level: BrokerLevel; targetDeals: number; achievedDeals: number; targetAmountCents: number | null; achievedAmountCents: number; currency: string | null; tieneMeta: boolean; logro: LogroPorMoneda[]; tendencia: { month: number; achievedDeals: number }[] };
export type MesMetaFila = { month: number; targetDeals: number; achievedDeals: number };
export type OpcionPeriodo = { value: string; label: string };
export type MetaAlcanceVista = { id: number; scopeType: "project" | "team"; scopeId: number; nombre: string; targetDeals: number; targetAmountCents: number | null; currency: string; logro: LogroPorMoneda[] };
export type EquipoVista = { id: number; name: string; leaderId: number | null; leader: string | null; miembros: { id: number; nombre: string }[] };
export type ReglaVista = { version: number; scope: string; rule: string; equipo: string; isActive: boolean; aprobadaPor: string | null; aprobadaEn: string | null };

const primario = boton + " bg-gold-600 text-navy-950";
const peligro = boton + " border-danger text-danger";
const fecha = new Intl.DateTimeFormat("es-DO", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Santo_Domingo" });
const textoEquipo: Record<string, string> = { equipo_del_broker_al_cierre: "Equipo del broker en el momento del cierre", sin_equipo: "Sin atribución por equipo" };

type Resultado = { ok: true; data: Record<string, unknown> } | { ok: false; fields: Record<string, string> };
async function enviarJson(method: string, url: string, body: unknown): Promise<Resultado> {
  if (!navigator.onLine) return { ok: false, fields: { _: "Sin conexión. Reconecta para guardar; el borrador se conserva." } };
  try {
    const r = await fetch(url, { method, headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() }, body: JSON.stringify(body) });
    const data = (await r.json().catch(() => ({}))) as Record<string, unknown>;
    if (r.ok) return { ok: true, data };
    const fields = (data.fields as Record<string, string> | undefined) ?? {};
    if (!Object.keys(fields).length) fields._ = typeof data.error === "string" ? data.error : "No se pudo guardar. Comprueba los datos y tu permiso.";
    return { ok: false, fields };
  } catch {
    return { ok: false, fields: { _: "Error de conexión. Comprueba el estado antes de repetir." } };
  }
}

function Errores({ errores, refe }: { errores: Record<string, string>; refe: React.RefObject<HTMLDivElement | null> }) {
  if (!Object.keys(errores).length) return null;
  return (
    <div ref={refe} tabIndex={-1} role="alert" className="rounded border border-danger p-3 text-danger">
      <strong>Revisa los datos</strong>
      <ul className="list-disc pl-5">{Object.entries(errores).map(([k, v]) => <li key={k}>{v}</li>)}</ul>
    </div>
  );
}

function Barra({ valor, etiqueta }: { valor: number | null; etiqueta: string }) {
  const v = Math.max(0, Math.min(100, valor ?? 0));
  return (
    <div role="progressbar" aria-label={etiqueta} aria-valuemin={0} aria-valuemax={100} aria-valuenow={valor ?? 0} aria-valuetext={valor === null ? "Sin meta" : `${valor}%`} className="h-2 w-full overflow-hidden rounded bg-navy-100">
      <div className={"h-full " + (v >= 100 ? "bg-success" : "bg-gold-600")} style={{ width: v + "%" }} />
    </div>
  );
}

function Desglose({ logro, vacio = "Sin cierres ganados en el periodo" }: { logro: LogroPorMoneda[]; vacio?: string }) {
  if (!logro.length) return <span className="text-muted-foreground">{vacio}</span>;
  return (
    <ul className="grid gap-1 tabular-nums" aria-label="Logrado por moneda">
      {logro.map((l) => <li key={l.currency}><strong>{montoExacto(l.amountCents, l.currency)}</strong> · {l.deals} {l.deals === 1 ? "cierre" : "cierres"}</li>)}
    </ul>
  );
}

function Confirmar({ titulo, texto, accion, onConfirmar, onClose }: { titulo: string; texto: ReactNode; accion: string; onConfirmar: () => Promise<Resultado>; onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  return (
    <Modal title={titulo} onClose={() => { if (!busy) onClose(); }}>
      <div className="grid gap-4">
        <div>{texto}</div>
        <Errores errores={errores} refe={ref} />
        <div className="flex flex-wrap gap-2">
          <button type="button" className={boton} onClick={onClose} disabled={busy}>Cancelar</button>
          <button type="button" className={peligro} disabled={busy} onClick={async () => {
            setBusy(true);
            const r = await onConfirmar();
            setBusy(false);
            if (!r.ok) { setErrores(r.fields); requestAnimationFrame(() => ref.current?.focus()); return; }
            router.refresh();
            onClose();
          }}>{busy ? "Procesando…" : accion}</button>
        </div>
      </div>
    </Modal>
  );
}

type Props = {
  periodo: { year: number; month: number };
  opcionesPeriodo: OpcionPeriodo[];
  fechaEvaluacion: string;
  esVistaCompleta: boolean;
  puedeEditar: boolean;
  puedeAdministrar: boolean;
  heroMeta: HeroMeta;
  heroLogro: LogroPorMoneda[];
  baseline: HeroMeta;
  brokers: BrokerMetaFila[];
  filasDelAnio: MesMetaFila[];
  metasAlcance: MetaAlcanceVista[];
  equipos: EquipoVista[];
  proyectos: { id: number; name: string }[];
  reglas: ReglaVista[];
};

export function MetasVista(p: Props) {
  const { periodo, opcionesPeriodo, fechaEvaluacion, esVistaCompleta, puedeEditar, puedeAdministrar, heroMeta, heroLogro, baseline, brokers, filasDelAnio, metasAlcance, equipos, proyectos, reglas } = p;
  const router = useRouter();
  const path = usePathname();
  const [editing, setEditing] = useState<{ id: number | null; name: string; target: number; currency: string } | null>(null);
  const [reinicio, setReinicio] = useState<{ id: number | null; name: string } | null>(null);
  const [alcance, setAlcance] = useState<MetaAlcanceVista | "nueva" | null>(null);
  const [borrar, setBorrar] = useState<MetaAlcanceVista | null>(null);
  const [equipo, setEquipo] = useState<EquipoVista | "nuevo" | null>(null);
  const [regla, setRegla] = useState(false);
  const [message, setMessage] = useState("");
  const ranking = [...brokers].sort((a, b) => b.achievedDeals - a.achievedDeals || a.fullName.localeCompare(b.fullName));
  const diagnostic = diagnosticarRitmo(periodo, heroMeta, fechaEvaluacion);
  const activa = reglas.find((r) => r.isActive) ?? null;
  const etiquetaPeriodo = nombreMes(periodo.month) + " " + periodo.year;
  const pctHero = heroMeta ? cumplimientoPorcentaje(heroMeta.achievedDeals, heroMeta.targetDeals) : null;
  const montoHero = heroMeta ? logradoEnMoneda(heroLogro, heroMeta.currency) : 0;

  const cols: Columna<BrokerMetaFila>[] = [
    { clave: "broker", titulo: "Asesor", movil: "titulo", celda: (r) => <strong>#{ranking.indexOf(r) + 1} · {r.fullName}</strong> },
    { clave: "cierres", titulo: "Cierres / objetivo", movil: "subtitulo", celda: (r) => r.achievedDeals + " / " + (r.targetDeals > 0 ? r.targetDeals : "Sin meta") },
    { clave: "logro", titulo: "Logrado por moneda", celda: (r) => <Desglose logro={r.logro} vacio="Sin cierres" /> },
    { clave: "objetivo", titulo: "Objetivo de monto", celda: (r) => (r.currency && r.targetAmountCents !== null ? <span className="tabular-nums">{montoExacto(r.targetAmountCents, r.currency)}{(() => { const c = cumplimientoMonto(logradoEnMoneda(r.logro, r.currency), r.targetAmountCents); return c === null ? null : <small className="block">{c}% logrado</small>; })()}</span> : "Sin objetivo de monto") },
    { clave: "cumplimiento", titulo: "Cumplimiento", movil: "insignia", celda: (r) => { const pct = cumplimientoPorcentaje(r.achievedDeals, r.targetDeals); return <div className="grid min-w-24 gap-1"><span>{pct === null ? "Sin meta" : pct + "%"}</span><Barra valor={pct} etiqueta={"Cumplimiento de " + r.fullName} /></div>; } },
    { clave: "accion", titulo: "Acción", celda: (r) => puedeEditar ? <div className="flex flex-wrap gap-2"><button type="button" className={boton} aria-label={"Editar meta de " + r.fullName} onClick={() => setEditing({ id: r.userId, name: r.fullName, target: r.targetDeals, currency: r.currency ?? "USD" })}>Editar</button>{puedeAdministrar && r.tieneMeta && r.targetDeals > 0 && <button type="button" className={peligro} aria-label={"Reiniciar meta de " + r.fullName} onClick={() => setReinicio({ id: r.userId, name: r.fullName })}>Reiniciar</button>}</div> : "Consulta" },
  ];

  const colsAlcance: Columna<MetaAlcanceVista>[] = [
    { clave: "nombre", titulo: "Proyecto / equipo", movil: "titulo", celda: (r) => <strong>{r.nombre}</strong> },
    { clave: "tipo", titulo: "Tipo", movil: "insignia", celda: (r) => (r.scopeType === "project" ? "Proyecto" : "Equipo") },
    { clave: "cierres", titulo: "Cierres / objetivo", movil: "subtitulo", celda: (r) => { const n = r.logro.reduce((s, l) => s + l.deals, 0); const pct = cumplimientoPorcentaje(n, r.targetDeals); const e = estadoAvance(n, r.targetDeals); return <div className="grid min-w-28 gap-1"><span>{n} / {r.targetDeals > 0 ? r.targetDeals : "Sin meta"}{e === "cumplida" ? " · Cumplida" : ""}</span><Barra valor={pct} etiqueta={"Avance de " + r.nombre} /></div>; } },
    { clave: "monto", titulo: "Monto logrado / objetivo", celda: (r) => <div className="tabular-nums"><span>{montoExacto(logradoEnMoneda(r.logro, r.currency), r.currency)}</span><small className="block">{r.targetAmountCents === null ? "Sin objetivo de monto" : "de " + montoExacto(r.targetAmountCents, r.currency)}</small>{r.logro.some((l) => l.currency !== r.currency) && <small className="block text-muted-foreground">Otras monedas: {r.logro.filter((l) => l.currency !== r.currency).map((l) => montoExacto(l.amountCents, l.currency)).join(" · ")}</small>}</div> },
    { clave: "accion", titulo: "Acción", celda: (r) => puedeAdministrar ? <div className="flex flex-wrap gap-2"><button type="button" className={boton} aria-label={"Editar meta de " + r.nombre} onClick={() => setAlcance(r)}>Editar</button><button type="button" className={peligro} aria-label={"Eliminar meta de " + r.nombre} onClick={() => setBorrar(r)}>Eliminar</button></div> : "Consulta" },
  ];

  return (
    <>
      <PageHeader
        title={esVistaCompleta ? "Metas y rendimiento" : "Mis metas y rendimiento"}
        subtitle="Objetivos mensuales; lo logrado sale solo de negocios cerrados como ganados."
        action={<label className="grid gap-1">Periodo<select className={control} value={formatoPeriodo(periodo)} onChange={(e) => { if (navigator.onLine) router.push(path + "?periodo=" + e.target.value); else setMessage("Sin conexión. Reconecta antes de cambiar el periodo."); }}>{opcionesPeriodo.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></label>}
      />
      <p role="status" aria-live="polite" className={message ? "mb-2 rounded border border-success/40 bg-success/10 p-2" : "sr-only"}>{message}</p>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title={(esVistaCompleta ? "Meta de compañía · " : "Meta personal · ") + etiquetaPeriodo}>
          {heroMeta && heroMeta.targetDeals > 0 ? (
            <div className="grid gap-3">
              <p className="font-heading text-2xl font-bold tabular-nums text-navy-900">{heroMeta.achievedDeals} / {heroMeta.targetDeals} cierres{pctHero !== null && <span className="ml-2 text-base font-semibold">({pctHero}%)</span>}</p>
              <Barra valor={pctHero} etiqueta="Cumplimiento de cierres" />
              <p>{diagnostic.enRitmo ? "En ritmo para cumplir." : "Faltan " + diagnostic.faltantes + " cierres para ir en ritmo."}</p>
              <p className="tabular-nums">Monto logrado ({heroMeta.currency}): <strong>{montoExacto(montoHero, heroMeta.currency)}</strong>{" · "}Objetivo: {heroMeta.targetAmountCents === null ? "sin objetivo de monto" : montoExacto(heroMeta.targetAmountCents, heroMeta.currency)}</p>
            </div>
          ) : (
            <Vacio titulo="Sin meta fijada para este mes" texto={puedeEditar ? "Asigna un objetivo de cierres para empezar el seguimiento." : "Pide a la administración que asigne tu meta del mes."} />
          )}
          <p className="my-3 text-[13px] text-muted-foreground">Corte {fechaEvaluacion} (hora de Santo Domingo)</p>
          {puedeEditar ? (
            <div className="flex flex-wrap gap-2">
              <button type="button" className={primario} onClick={() => setEditing({ id: esVistaCompleta ? null : brokers[0]?.userId ?? null, name: esVistaCompleta ? "Compañía" : brokers[0]?.fullName ?? "Meta personal", target: heroMeta?.targetDeals ?? 0, currency: heroMeta?.currency ?? "USD" })}>{heroMeta && heroMeta.targetDeals > 0 ? "Editar meta" : "Asignar meta"} {esVistaCompleta ? "de la compañía" : "personal"}</button>
              {puedeAdministrar && esVistaCompleta && heroMeta && heroMeta.targetDeals > 0 && <button type="button" className={peligro} onClick={() => setReinicio({ id: null, name: "Compañía" })}>Reiniciar meta</button>}
            </div>
          ) : (
            <AvisoPermiso motivo="Solo la administración asigna metas. Tu rol permite consultar tu rendimiento." />
          )}
        </Panel>

        <Panel title={"Logrado por moneda · " + etiquetaPeriodo}>
          <Desglose logro={heroLogro} />
          <p className="mt-3 text-[13px] text-muted-foreground">Cada moneda se suma por separado; no se convierten USD y DOP entre sí.</p>
        </Panel>
      </div>

      <Panel title={"Línea base · " + nombreMes(periodo.month) + " " + (periodo.year - 1)}>
        {baseline ? <><p>{baseline.achievedDeals} cierres / {baseline.targetDeals} objetivo</p>{heroMeta && <p>Diferencia de cierres frente al año anterior: {heroMeta.achievedDeals - baseline.achievedDeals >= 0 ? "+" : ""}{heroMeta.achievedDeals - baseline.achievedDeals}</p>}</> : <Vacio titulo="Sin línea base registrada" texto="No hay meta registrada para el mismo mes del año anterior dentro de tu alcance." />}
      </Panel>

      <Panel title="Ranking por asesor">
        {ranking.length ? <DataTable filas={ranking} columnas={cols} idDe={(r) => String(r.userId)} etiqueta="Rendimiento por asesor" medioMovil={(r) => <Desglose logro={r.logro} vacio="Sin cierres" />} /> : <Vacio titulo="Sin asesores visibles" texto="No hay asesores activos dentro de tu alcance." />}
      </Panel>

      <Panel title={"Metas por proyecto y equipo · " + etiquetaPeriodo}>
        {puedeAdministrar && <div className="mb-3 flex flex-wrap gap-2"><button type="button" className={primario} onClick={() => setAlcance("nueva")} disabled={!proyectos.length && !equipos.length}>Nueva meta de proyecto o equipo</button></div>}
        {metasAlcance.length ? <DataTable filas={metasAlcance} columnas={colsAlcance} idDe={(r) => String(r.id)} etiqueta="Metas por proyecto y equipo" /> : <Vacio titulo="Sin metas de proyecto o equipo" texto={puedeAdministrar ? "Crea una meta para un proyecto o un equipo; el avance se calcula con los cierres atribuidos." : "No hay metas de proyecto o de tu equipo para este mes."} />}
      </Panel>

      {esVistaCompleta && (
        <Panel title="Equipos comerciales">
          {puedeAdministrar && <div className="mb-3"><button type="button" className={primario} onClick={() => setEquipo("nuevo")}>Nuevo equipo</button></div>}
          {equipos.length ? (
            <ul className="grid gap-3 md:grid-cols-2">
              {equipos.map((e) => (
                <li key={e.id} className="rounded-md border border-line p-3">
                  <div className="flex items-start justify-between gap-2"><strong>{e.name}</strong>{puedeAdministrar && <button type="button" className={boton} aria-label={"Editar equipo " + e.name} onClick={() => setEquipo(e)}>Editar</button>}</div>
                  <p className="text-[13px]">Líder: {e.leader ?? "Sin líder"}</p>
                  <p className="text-[13px]">{e.miembros.length ? e.miembros.map((m) => m.nombre).join(", ") : "Sin miembros"}</p>
                </li>
              ))}
            </ul>
          ) : <Vacio titulo="Sin equipos" texto="Crea un equipo y agrega brokers para fijar metas de equipo." />}
        </Panel>
      )}

      <Panel title="Comparativa mensual">
        {filasDelAnio.length ? <DataTable filas={filasDelAnio} columnas={[{ clave: "mes", titulo: "Mes", movil: "titulo", celda: (r) => <button type="button" className={boton} onClick={() => { if (navigator.onLine) router.push(path + "?periodo=" + formatoPeriodo({ year: periodo.year, month: r.month })); }}>{nombreMes(r.month)}</button> }, { clave: "logro", titulo: "Cierres logrados", movil: "subtitulo", celda: (r) => r.achievedDeals }, { clave: "meta", titulo: "Objetivo", celda: (r) => (r.targetDeals > 0 ? r.targetDeals : "Sin meta") }]} idDe={(r) => String(r.month)} etiqueta="Historial real de metas" /> : <Vacio titulo="Sin historial de metas" texto="No hay metas registradas para este año." />}
      </Panel>

      <Panel title={activa ? "Regla de atribución · versión " + activa.version + " (activa)" : "Regla de atribución"}>
        {activa ? (
          <div className="grid gap-2">
            <p><strong>Alcance:</strong> {activa.scope}</p>
            <p>{activa.rule}</p>
            <p><strong>Proyecto:</strong> propiedad principal del negocio · <strong>Equipo:</strong> {textoEquipo[activa.equipo] ?? activa.equipo}</p>
            <p className="text-[13px] text-muted-foreground">Aprobada {activa.aprobadaEn ? fecha.format(new Date(activa.aprobadaEn)) : "sin fecha"}{activa.aprobadaPor ? " por " + activa.aprobadaPor : " (migración inicial)"}. Se congela en cada negocio al cerrarlo como ganado.</p>
          </div>
        ) : <Vacio titulo="Sin regla aprobada" texto="Mientras no haya una regla activa, los cierres no quedan atribuidos a proyecto ni equipo." />}
        {reglas.length > 1 && (
          <details className="mt-3"><summary className="cursor-pointer font-semibold">Historial de versiones ({reglas.length})</summary>
            <ol className="mt-2 grid gap-2">{reglas.map((r) => <li key={r.version} className="rounded border border-line p-2 text-[13px]"><strong>v{r.version}{r.isActive ? " · activa" : ""}</strong> — {r.rule}</li>)}</ol>
          </details>
        )}
        {puedeAdministrar && <button type="button" className={boton + " mt-3"} onClick={() => setRegla(true)}>Publicar nueva versión</button>}
      </Panel>

      {editing && <FormularioMetaModal titulo={"Editar meta · " + editing.name} brokerId={editing.id} anio={periodo.year} mes={periodo.month} targetDeals={editing.target} currency={editing.currency} onGuardado={() => setMessage("Meta guardada.")} onClose={() => setEditing(null)} />}
      {reinicio && <Confirmar titulo={"Reiniciar meta · " + reinicio.name} accion="Reiniciar meta" texto={<p>El objetivo de {etiquetaPeriodo} queda en cero y sin monto. Los cierres ya logrados se conservan y el cambio queda en la auditoría.</p>} onConfirmar={async () => { const r = await enviarJson("DELETE", "/api/metas", { brokerId: reinicio.id, year: periodo.year, month: periodo.month }); if (r.ok) setMessage("Meta reiniciada."); return r; }} onClose={() => setReinicio(null)} />}
      {borrar && <Confirmar titulo={"Eliminar meta · " + borrar.nombre} accion="Eliminar meta" texto={<p>Se elimina la meta de {borrar.scopeType === "project" ? "proyecto" : "equipo"} de {etiquetaPeriodo}. Los negocios no cambian; el borrado queda auditado.</p>} onConfirmar={async () => { const r = await enviarJson("DELETE", "/api/metas/alcances", { id: borrar.id }); if (r.ok) setMessage("Meta eliminada."); return r; }} onClose={() => setBorrar(null)} />}
      {alcance && <FormularioAlcance meta={alcance === "nueva" ? null : alcance} proyectos={proyectos} equipos={equipos} periodo={periodo} onGuardado={() => setMessage("Meta de proyecto o equipo guardada.")} onClose={() => setAlcance(null)} />}
      {equipo && <FormularioEquipo equipo={equipo === "nuevo" ? null : equipo} brokers={brokers} onGuardado={() => setMessage("Equipo guardado.")} onClose={() => setEquipo(null)} />}
      {regla && <FormularioRegla activa={activa} onGuardado={() => setMessage("Nueva versión de la regla publicada y activa.")} onClose={() => setRegla(false)} />}
    </>
  );
}

function useEnvio(onGuardado: () => void, onClose: () => void) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});
  async function enviar(method: string, url: string, body: unknown, previos: Record<string, string> = {}) {
    if (lock.current) return;
    if (Object.keys(previos).length) { setErrores(previos); requestAnimationFrame(() => ref.current?.focus()); return; }
    lock.current = true; setBusy(true);
    const r = await enviarJson(method, url, body);
    lock.current = false; setBusy(false);
    if (!r.ok) { setErrores(r.fields); requestAnimationFrame(() => ref.current?.focus()); return; }
    onGuardado(); router.refresh(); onClose();
  }
  return { ref, busy, errores, enviar };
}

function FormularioAlcance({ meta, proyectos, equipos, periodo, onGuardado, onClose }: { meta: MetaAlcanceVista | null; proyectos: { id: number; name: string }[]; equipos: EquipoVista[]; periodo: { year: number; month: number }; onGuardado: () => void; onClose: () => void }) {
  const [tipo, setTipo] = useState<"project" | "team">(meta?.scopeType ?? (proyectos.length ? "project" : "team"));
  const [scopeId, setScopeId] = useState(meta ? String(meta.scopeId) : "");
  const [objetivo, setObjetivo] = useState(meta ? String(meta.targetDeals) : "");
  const [moneda, setMoneda] = useState(meta?.currency ?? "USD");
  const [monto, setMonto] = useState(meta?.targetAmountCents != null ? (meta.targetAmountCents / 100).toFixed(2) : "");
  const { ref, busy, errores, enviar } = useEnvio(onGuardado, onClose);
  const opciones = tipo === "project" ? proyectos.map((x) => ({ id: x.id, name: x.name })) : equipos.map((x) => ({ id: x.id, name: x.name }));
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f: Record<string, string> = {};
    if (!scopeId) f.scopeId = tipo === "project" ? "Selecciona el proyecto." : "Selecciona el equipo.";
    const n = leerObjetivoFormulario(objetivo);
    if (n === undefined || !Number.isInteger(n) || n < 0) f.targetDeals = "Escribe un número entero de cierres, cero o mayor.";
    let cents: number | null = null;
    if (monto.trim() !== "") { const c = centavosEntrada(monto); if (c === undefined) f.targetAmountCents = "Escribe un monto no negativo con hasta dos decimales."; else cents = Number(c); }
    void enviar("PUT", "/api/metas/alcances", { scopeType: tipo, scopeId: Number(scopeId), year: periodo.year, month: periodo.month, targetDeals: n, targetAmountCents: cents, currency: moneda }, f);
  }
  return (
    <Modal title={(meta ? "Editar meta · " + meta.nombre : "Nueva meta de proyecto o equipo") + " · " + nombreMes(periodo.month) + " " + periodo.year} onClose={() => { if (!busy) onClose(); }}>
      <form noValidate onSubmit={submit} className="grid gap-4">
        <Errores errores={errores} refe={ref} />
        <fieldset className="grid gap-2" disabled={!!meta}>
          <legend className="font-semibold">Tipo de meta</legend>
          <div className="flex gap-4">
            <label className="flex items-center gap-2"><input type="radio" name="tipo" checked={tipo === "project"} onChange={() => { setTipo("project"); setScopeId(""); }} disabled={!proyectos.length} /> Proyecto</label>
            <label className="flex items-center gap-2"><input type="radio" name="tipo" checked={tipo === "team"} onChange={() => { setTipo("team"); setScopeId(""); }} disabled={!equipos.length} /> Equipo</label>
          </div>
        </fieldset>
        <label className="grid gap-1">{tipo === "project" ? "Proyecto" : "Equipo"} (obligatorio)
          <select className={control} value={scopeId} onChange={(e) => setScopeId(e.target.value)} disabled={!!meta} aria-invalid={!!errores.scopeId}>
            <option value="">Selecciona…</option>
            {opciones.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </label>
        <label className="grid gap-1">Cierres objetivo (obligatorio)
          <input className={control} type="number" min={0} step={1} inputMode="numeric" value={objetivo} onChange={(e) => setObjetivo(e.target.value)} aria-invalid={!!errores.targetDeals} />
        </label>
        <div className="grid grid-cols-[8rem_1fr] gap-2">
          <label className="grid gap-1">Moneda<select className={control} value={moneda} onChange={(e) => setMoneda(e.target.value)}><option value="USD">USD</option><option value="DOP">DOP</option></select></label>
          <label className="grid gap-1">Objetivo de monto (opcional)<input className={control} inputMode="decimal" placeholder="Ej. 450000.00" value={monto} onChange={(e) => setMonto(e.target.value)} aria-invalid={!!errores.targetAmountCents} aria-describedby="alc-monto-ayuda" /></label>
        </div>
        <p id="alc-monto-ayuda" className="text-[13px] text-muted-foreground">Vacío = sin objetivo de monto. El logrado se mide en la moneda elegida.</p>
        <button disabled={busy} className={primario}>{busy ? "Guardando…" : "Guardar meta"}</button>
      </form>
    </Modal>
  );
}

function FormularioEquipo({ equipo, brokers, onGuardado, onClose }: { equipo: EquipoVista | null; brokers: BrokerMetaFila[]; onGuardado: () => void; onClose: () => void }) {
  const [nombre, setNombre] = useState(equipo?.name ?? "");
  const [lider, setLider] = useState(equipo?.leaderId ? String(equipo.leaderId) : "");
  const [miembros, setMiembros] = useState<number[]>(equipo?.miembros.map((m) => m.id) ?? []);
  const { ref, busy, errores, enviar } = useEnvio(onGuardado, onClose);
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f: Record<string, string> = {};
    if (nombre.trim().length < 2) f.name = "El nombre debe tener al menos 2 caracteres.";
    void enviar("PUT", "/api/metas/equipos", { ...(equipo ? { id: equipo.id } : {}), name: nombre.trim(), leaderId: lider ? Number(lider) : null, memberIds: miembros }, f);
  }
  return (
    <Modal title={equipo ? "Editar equipo · " + equipo.name : "Nuevo equipo"} onClose={() => { if (!busy) onClose(); }}>
      <form noValidate onSubmit={submit} className="grid gap-4">
        <Errores errores={errores} refe={ref} />
        <label className="grid gap-1">Nombre del equipo (obligatorio)<input className={control} value={nombre} maxLength={80} onChange={(e) => setNombre(e.target.value)} aria-invalid={!!errores.name} /></label>
        <label className="grid gap-1">Líder (opcional)<select className={control} value={lider} onChange={(e) => setLider(e.target.value)}><option value="">Sin líder</option>{brokers.map((b) => <option key={b.userId} value={b.userId}>{b.fullName}</option>)}</select></label>
        <fieldset className="grid max-h-56 gap-1 overflow-auto rounded border border-line p-2">
          <legend className="px-1 font-semibold">Miembros ({miembros.length})</legend>
          {brokers.map((b) => <label key={b.userId} className="flex items-center gap-2"><input type="checkbox" checked={miembros.includes(b.userId)} onChange={(e) => setMiembros((m) => (e.target.checked ? [...m, b.userId] : m.filter((x) => x !== b.userId)))} />{b.fullName}</label>)}
        </fieldset>
        <p className="text-[13px] text-muted-foreground">Cada broker pertenece a un solo equipo: si ya estaba en otro, se mueve a este. El líder se agrega como miembro.</p>
        <button disabled={busy} className={primario}>{busy ? "Guardando…" : "Guardar equipo"}</button>
      </form>
    </Modal>
  );
}

function FormularioRegla({ activa, onGuardado, onClose }: { activa: ReglaVista | null; onGuardado: () => void; onClose: () => void }) {
  const [alcance, setAlcance] = useState(activa?.scope ?? "Compañía, broker, proyecto y equipo");
  const [texto, setTexto] = useState(activa?.rule ?? "");
  const [equipo, setEquipo] = useState(activa?.equipo ?? "equipo_del_broker_al_cierre");
  const { ref, busy, errores, enviar } = useEnvio(onGuardado, onClose);
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f: Record<string, string> = {};
    if (texto.trim().length < 20) f.rule = "La regla debe tener al menos 20 caracteres.";
    if (alcance.trim().length < 3) f.scope = "Describe el alcance de la regla.";
    void enviar("POST", "/api/metas/atribucion", { scope: alcance.trim(), rule: texto.trim(), equipo }, f);
  }
  return (
    <Modal title={"Publicar versión " + ((activa?.version ?? 0) + 1) + " de la regla"} onClose={() => { if (!busy) onClose(); }}>
      <form noValidate onSubmit={submit} className="grid gap-4">
        <Errores errores={errores} refe={ref} />
        <label className="grid gap-1">Alcance<input className={control} value={alcance} maxLength={200} onChange={(e) => setAlcance(e.target.value)} aria-invalid={!!errores.scope} /></label>
        <label className="grid gap-1">Texto de la regla<textarea className={control + " min-h-28 py-2"} value={texto} maxLength={2000} onChange={(e) => setTexto(e.target.value)} aria-invalid={!!errores.rule} /></label>
        <label className="grid gap-1">Atribución por equipo<select className={control} value={equipo} onChange={(e) => setEquipo(e.target.value)}><option value="equipo_del_broker_al_cierre">{textoEquipo.equipo_del_broker_al_cierre}</option><option value="sin_equipo">{textoEquipo.sin_equipo}</option></select></label>
        <p className="text-[13px] text-muted-foreground">La versión nueva queda aprobada por ti y activa desde ahora. Los negocios ya cerrados conservan la versión con la que se cerraron.</p>
        <button disabled={busy} className={primario}>{busy ? "Publicando…" : "Publicar y activar"}</button>
      </form>
    </Modal>
  );
}

function FormularioMetaModal({titulo,brokerId,anio,mes,targetDeals,currency,onGuardado,onClose}:{titulo:string;brokerId:number|null;anio:number;mes:number;targetDeals:number;currency:string;onGuardado:()=>void;onClose:()=>void}){
 const router=useRouter();const lock=useRef(false);const summary=useRef<HTMLDivElement>(null);const [valorMeta,setValorMeta]=useState(String(targetDeals));const [amount,setAmount]=useState("");const [busy,setBusy]=useState(false);const [errors,setErrors]=useState<Record<string,string>>({});
 async function enviar(e:FormEvent<HTMLFormElement>){e.preventDefault();if(lock.current)return;const datos:{brokerId:number|null;year:number;month:number;targetDeals:number|undefined;targetAmountCents?:number}={brokerId,year:anio,month:mes,targetDeals:leerObjetivoFormulario(valorMeta)};const fields:Record<string,string>={};if(amount.trim()!==""){const cents=centavosEntrada(amount);if(cents===undefined||BigInt(cents)>BigInt(Number.MAX_SAFE_INTEGER))fields.targetAmountCents="Introduce un monto no negativo con hasta dos decimales dentro del rango admitido.";else datos.targetAmountCents=Number(cents);}const parsed=FijarMetaInput.safeParse(datos);if(!parsed.success)for(const i of parsed.error.issues)fields[String(i.path[0])]=i.message;if(!navigator.onLine)fields._="Sin conexión. El borrador se conserva; reconecta para guardar.";setErrors(fields);if(Object.keys(fields).length){requestAnimationFrame(()=>summary.current?.focus());return;}lock.current=true;setBusy(true);try{const response=await fetch("/api/metas",{method:"PUT",headers:{"Content-Type":"application/json","Idempotency-Key":crypto.randomUUID()},body:JSON.stringify(datos)});const result=await response.json().catch(()=>({}));if(!response.ok){setErrors(result.fields??{_:"No se pudo guardar la meta. Comprueba los datos y tu permiso."});requestAnimationFrame(()=>summary.current?.focus());return;}onGuardado();router.refresh();onClose();}catch{setErrors({_ :"Error de conexión. El borrador se conserva; comprueba el estado antes de repetir."});requestAnimationFrame(()=>summary.current?.focus());}finally{lock.current=false;setBusy(false);}}
 return <Modal title={titulo} onClose={()=>{if(!busy)onClose()}}><form noValidate onSubmit={enviar} className="grid gap-4"><p>Moneda de la meta: {currency}. Para una meta nueva se utiliza la moneda predeterminada del servicio (USD).</p>{Object.keys(errors).length>0&&<div ref={summary} tabIndex={-1} role="alert" className="rounded border border-danger p-3 text-danger"><strong>Revisa la meta</strong><ul>{Object.entries(errors).map(([key,value])=><li key={key}>{value}</li>)}</ul></div>}<label>Cantidad de negocios objetivo (obligatorio)<input name="targetDeals" type="number" min={0} required value={valorMeta} onChange={(e) => setValorMeta(e.target.value)} className={control} aria-invalid={!!errors.targetDeals} aria-describedby="meta-error"/></label>{errors.targetDeals&&<p id="meta-error" className="text-danger">{errors.targetDeals}</p>}<p>Cero explícito indica sin meta. Un campo vacío no se guarda.</p><label>Objetivo de monto ({currency})<input name="targetAmountCents" value={amount} inputMode="decimal" onChange={e=>setAmount(e.target.value)} className={control} aria-invalid={!!errors.targetAmountCents} aria-describedby="amount-help amount-error"/></label><p id="amount-help">Vacío conserva el monto actual. Cero explícito fija un objetivo de monto cero.</p>{errors.targetAmountCents&&<p id="amount-error" className="text-danger">{errors.targetAmountCents}</p>}<button disabled={busy} className={boton+" bg-gold-600 text-navy-950"}>{busy?"Guardando…":"Guardar meta"}</button></form></Modal>;
}
