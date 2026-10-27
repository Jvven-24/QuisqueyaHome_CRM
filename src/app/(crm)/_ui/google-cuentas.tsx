"use client";
import { Checkbox } from "@/components/ui/checkbox";
/** Cuentas Google del usuario: conectar otra, calendarios, activar/desactivar, predeterminado para visitas y desconectar. */
import { useCallback, useEffect, useState } from "react";

type Calendario = { id: number; summary: string; isPrimary: boolean; selected: boolean; defaultForVisits: boolean };
type Cuenta = { id: number; email: string; active: boolean; calendarios: Calendario[] };
type Datos = { falta: string[]; cuentas: Cuenta[] };

const BOTON = "inline-flex min-h-11 items-center justify-center rounded-lg border border-line px-3 text-sm font-semibold transition hover:bg-surface disabled:opacity-50";

export function useCuentasGoogle() {
  const [datos, setDatos] = useState<Datos | null>(null);
  const cargar = useCallback(async () => {
    const r = await fetch("/api/integraciones/google/cuentas", { cache: "no-store" }).catch(() => null);
    setDatos(r?.ok ? await r.json() : { falta: [], cuentas: [] });
  }, []);
  useEffect(() => { void cargar(); }, [cargar]);
  return { datos, cargar };
}

export function GoogleCuentasPanel({ titulo = "Cuentas de Google Calendar" }: { titulo?: string }) {
  const { datos, cargar } = useCuentasGoogle();
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [aviso, setAviso] = useState("");

  async function llamar(clave: string, url: string, method: string, body?: unknown, ok = "Listo.") {
    setOcupado(clave); setAviso("");
    const r = await fetch(url, { method, headers: { "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined }).catch(() => null);
    setOcupado(null);
    setAviso(r?.ok ? ok : "No se pudo completar. Intenta de nuevo.");
    await cargar();
  }

  const configurado = datos && datos.falta.length === 0;
  return (
    <section className="grid gap-4 rounded-xl border border-line bg-surface-alt p-4" aria-labelledby="google-cuentas">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 id="google-cuentas" className="font-bold">{titulo}</h3>
          <p className="text-sm text-ink-muted">Conecta una o varias cuentas, elige qué calendarios usar y cuál recibe las visitas.</p>
        </div>
        {configurado ? <a href="/api/integraciones/google/conectar" className={`${BOTON} bg-brand text-white hover:bg-brand/90`}>{datos.cuentas.length ? "Conectar otra cuenta" : "Conectar Google"}</a>
          : <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">{datos ? "Pendiente: el administrador debe configurar Google" : "Cargando…"}</span>}
      </header>
      {aviso && <p role="status" className="text-sm">{aviso}</p>}
      {datos && datos.cuentas.length === 0 && <p className="rounded-lg border border-dashed border-line p-4 text-sm text-ink-muted">Sin cuentas conectadas.</p>}
      <ul className="grid gap-3">
        {datos?.cuentas.map((c) => (
          <li key={c.id} className={`grid gap-3 rounded-lg border border-line p-3 ${c.active ? "" : "opacity-70"}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2"><strong className="truncate">{c.email}</strong>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${c.active ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"}`}>{c.active ? "Activa" : "Inactiva"}</span></span>
              <span className="flex flex-wrap gap-2">
                <button className={BOTON} disabled={!!ocupado} onClick={() => llamar(`s${c.id}`, `/api/integraciones/google/cuentas/${c.id}/calendarios`, "POST", undefined, "Calendarios actualizados.")}>Actualizar calendarios</button>
                <button className={BOTON} disabled={!!ocupado} onClick={() => llamar(`a${c.id}`, `/api/integraciones/google/cuentas/${c.id}`, "PATCH", { active: !c.active }, c.active ? "Cuenta desactivada." : "Cuenta activada.")}>{c.active ? "Desactivar" : "Activar"}</button>
                <button className={`${BOTON} border-red-300 text-red-700 hover:bg-red-50`} disabled={!!ocupado} onClick={() => { if (confirm(`¿Desconectar ${c.email}? Se revoca el acceso en Google.`)) void llamar(`d${c.id}`, `/api/integraciones/google/cuentas/${c.id}`, "DELETE", undefined, "Cuenta desconectada y acceso revocado."); }}>Desconectar</button>
              </span>
            </div>
            <ul className="grid gap-2 sm:grid-cols-2">
              {c.calendarios.map((k) => (
                <li key={k.id} className="flex items-center justify-between gap-2 rounded-md border border-line px-3 py-2">
                  <label className="flex min-w-0 items-center gap-2 text-sm">
                    <Checkbox checked={k.selected} disabled={!!ocupado || !c.active} onCheckedChange={(checked) => llamar(`k${k.id}`, `/api/integraciones/google/calendarios/${k.id}`, "PATCH", { selected: checked })} />
                    <span className="truncate">{k.summary}{k.isPrimary ? " (principal)" : ""}</span>
                  </label>
                  {k.defaultForVisits ? <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-semibold text-brand">Visitas</span>
                    : <button className="text-xs underline disabled:opacity-50" disabled={!!ocupado || !c.active} onClick={() => llamar(`v${k.id}`, `/api/integraciones/google/calendarios/${k.id}`, "PATCH", { defaultForVisits: true }, "Calendario predeterminado para visitas.")}>Usar para visitas</button>}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Selector para el formulario de cita: calendarios activos de cuentas activas. */
export function SelectorCalendarioGoogle() {
  const { datos } = useCuentasGoogle();
  const opciones = (datos?.cuentas ?? []).filter((c) => c.active).flatMap((c) => c.calendarios.filter((k) => k.selected).map((k) => ({ ...k, email: c.email })));
  if (!opciones.length) return null;
  const pred = opciones.find((o) => o.defaultForVisits);
  return (
    <label className="span-2">
      Calendario de Google
      <select name="googleCalendarId" defaultValue={pred ? String(pred.id) : ""} className="min-h-[44px] text-[14px]">
        <option value="">No enviar a Google</option>
        {opciones.map((o) => <option key={o.id} value={o.id}>{o.summary} · {o.email}</option>)}
      </select>
    </label>
  );
}
