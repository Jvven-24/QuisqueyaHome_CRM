"use client";
/**
 * Conexiones: una tarjeta por servicio (Search Console, GA4, Gmail, Calendar, Meta Ads) con varias
 * cuentas, estados (conectado / sin conectar / con error / reconectar) y alta incremental de permisos.
 * Estilo Viltrum v2.1: tokens de tokens.css, contraste AA, foco visible, objetivos ≥ 44 px en móvil.
 */
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { AlertTriangle, CheckCircle2, CircleDashed, Plus, RefreshCw, ShieldCheck, Trash2, Unplug } from "lucide-react";
import { SERVICIOS, type ServicioDef } from "@/infrastructure/conexiones-oauth/servicios";
import { ETIQUETA_TARJETA, estadoTarjeta, MOTIVOS_CALLBACK, type ConexionVista, type EstadoTarjeta } from "@/infrastructure/conexiones-oauth/vista";
import { BotonFacebook, BotonGoogle } from "./botones";
import { MarcaServicio } from "./logos";

export type DatosConexiones = {
  conexiones: ConexionVista[];
  faltan: { google: string[]; meta: string[] };
  /** Resultado del último intento de conexión (query ?conexion=). */
  aviso: string | null;
  servicioAviso: string | null;
};

const FOCO = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-700";
const BTN = `inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-input-line bg-surface px-3 text-sm font-semibold text-ink transition hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50 ${FOCO}`;

const INSIGNIA: Record<EstadoTarjeta, { clase: string; Icono: typeof CheckCircle2 }> = {
  sin_conectar: { clase: "bg-surface-alt text-ink-muted border-line", Icono: CircleDashed },
  conectado: { clase: "bg-success-bg text-success border-success/30", Icono: CheckCircle2 },
  error: { clase: "bg-danger-bg text-danger border-danger/30", Icono: AlertTriangle },
  reconectar: { clase: "bg-warning-bg text-warning border-warning/30", Icono: RefreshCw },
};

function Insignia({ estado, texto }: { estado: EstadoTarjeta; texto?: string }) {
  const { clase, Icono } = INSIGNIA[estado];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${clase}`}>
      <Icono aria-hidden="true" size={14} />{texto ?? ETIQUETA_TARJETA[estado]}
    </span>
  );
}

const fecha = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat("es-DO", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Santo_Domingo" }).format(new Date(iso)) : null;

const SENSIBILIDAD: Record<string, string> = {
  basico: "Verificación básica de Google",
  sensible: "Permiso sensible: requiere verificación de la app en Google",
  restringido: "Permiso restringido: requiere verificación y evaluación de seguridad de Google",
};

function urlConectar(s: ServicioDef, extras: string[] = []): string {
  if (s.id === "calendar") return "/api/integraciones/google/conectar";
  const q = new URLSearchParams({ servicio: s.id });
  for (const e of extras) q.append("extra", e);
  return `/api/integraciones/oauth/${s.proveedor}/conectar?${q.toString()}`;
}

function Cuenta({ c, s, ocupado, onVerificar, onDesconectar }: { c: ConexionVista; s: ServicioDef; ocupado: boolean; onVerificar: () => void; onDesconectar: () => void }) {
  const [confirmando, setConfirmando] = useState(false);
  const verificada = fecha(c.verificadoEn);
  const puedeActuar = c.origen === "oauth" || c.propia;
  const extraEnviar = c.extras.includes("enviar");
  return (
    <li className="m-0 grid list-none gap-2 rounded-lg border border-line bg-surface-alt p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="break-words text-sm font-bold text-ink">{c.cuenta}</p>
          {c.propietario && <p className="text-xs text-ink-muted">Agenda de {c.propietario}{c.propia ? " (tú)" : ""}</p>}
        </div>
        <Insignia estado={c.estado} />
      </div>
      {c.estado !== "conectado" && c.mensaje && <p role="alert" className="text-sm text-ink">{c.mensaje}</p>}
      {c.resumen && <p className="text-sm text-ink-muted">{c.resumen}</p>}
      {extraEnviar && <p className="flex items-center gap-1.5 text-xs font-semibold text-ink-muted"><ShieldCheck aria-hidden="true" size={14} />Envío de correos autorizado</p>}
      {verificada && <p className="text-xs text-ink-muted">Comprobada: {verificada} (hora de Santo Domingo)</p>}
      {puedeActuar && !confirmando && (
        <div className="flex flex-wrap gap-2 pt-1">
          {c.origen === "oauth" && <button type="button" className={BTN} disabled={ocupado} onClick={onVerificar}><RefreshCw aria-hidden="true" size={16} />Comprobar ahora</button>}
          {(c.estado === "reconectar" || c.estado === "error") && s.id !== "calendar" && (
            s.proveedor === "google" ? <BotonGoogle href={urlConectar(s, c.extras)} texto="Reconectar con Google" compacto /> : <BotonFacebook href={urlConectar(s)} texto="Reconectar con Facebook" compacto />
          )}
          {c.estado === "reconectar" && s.id === "calendar" && <BotonGoogle href={urlConectar(s)} texto="Reconectar con Google" compacto />}
          {s.id === "gmail" && !extraEnviar && c.estado === "conectado" && (
            <a className={BTN} href={urlConectar(s, ["enviar"])}><Plus aria-hidden="true" size={16} />Autorizar envío de correos</a>
          )}
          <button type="button" className={`${BTN} border-danger/40 text-danger hover:bg-danger-bg`} disabled={ocupado} onClick={() => setConfirmando(true)}><Unplug aria-hidden="true" size={16} />Desconectar</button>
        </div>
      )}
      {confirmando && (
        <div role="group" aria-label={`Confirmar desconexión de ${c.cuenta}`} className="grid gap-2 rounded-lg border border-danger/30 bg-danger-bg p-3">
          <p className="text-sm text-ink">¿Desconectar <strong>{c.cuenta}</strong>? Se revoca el acceso en {s.proveedor === "google" ? "Google" : "Meta"} y se borran los tokens guardados.</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={`${BTN} border-danger bg-danger text-white hover:bg-danger/90`} disabled={ocupado} onClick={() => { setConfirmando(false); onDesconectar(); }}><Trash2 aria-hidden="true" size={16} />Sí, desconectar</button>
            <button type="button" className={BTN} onClick={() => setConfirmando(false)}>Cancelar</button>
          </div>
        </div>
      )}
    </li>
  );
}

function Tarjeta({ s, lista, faltan, ocupado, onVerificar, onDesconectar }: {
  s: ServicioDef; lista: ConexionVista[]; faltan: string[]; ocupado: boolean;
  onVerificar: (id: number) => void; onDesconectar: (c: ConexionVista) => void;
}) {
  const uid = useId();
  const [extras, setExtras] = useState<string[]>([]);
  const estado = estadoTarjeta(lista);
  const bloqueado = faltan.length > 0;
  const conectadas = lista.length > 0;
  const texto = conectadas ? "Añadir otra cuenta de Google" : "Continuar con Google";
  const textoFb = conectadas ? "Añadir otra cuenta de Facebook" : "Continuar con Facebook";
  return (
    <li className="m-0 flex min-w-0 list-none flex-col gap-4 rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5" aria-labelledby={`${uid}-t`}>
      <div className="flex items-start gap-3">
        <span className="flex size-12 flex-none items-center justify-center rounded-xl border border-line bg-surface-alt"><MarcaServicio id={s.id} size={30} /></span>
        <div className="min-w-0 flex-1">
          <h3 id={`${uid}-t`} className="font-heading text-base font-bold text-ink">{s.nombre}</h3>
          <div className="mt-1.5"><Insignia estado={estado} texto={estado === "conectado" && lista.length > 1 ? `Conectado · ${lista.length} cuentas` : undefined} /></div>
        </div>
      </div>
      <p className="text-sm leading-relaxed text-ink-muted">{s.uso}</p>

      {conectadas && (
        <ul className="m-0 grid list-none gap-2 p-0" aria-label={`Cuentas de ${s.nombre}`}>
          {lista.map((c) => (
            <Cuenta key={`${c.origen}-${c.id}`} c={c} s={s} ocupado={ocupado} onVerificar={() => onVerificar(c.id)} onDesconectar={() => onDesconectar(c)} />
          ))}
        </ul>
      )}

      <details className="text-sm text-ink-muted">
        <summary className={`min-h-11 cursor-pointer select-none rounded-md py-2 font-semibold text-ink ${FOCO}`}>Permisos que se piden</summary>
        <ul className="m-0 mt-1 grid list-none gap-1.5 p-0 pl-1">
          {[...s.scopes, ...(s.extras ?? []).filter((e) => extras.includes(e.id)).flatMap((e) => e.scopes)].map((sc) => (
            <li key={sc} className="break-all font-mono text-xs">{sc.replace("https://www.googleapis.com/auth/", "")}</li>
          ))}
        </ul>
        <p className="mt-2 text-xs">{SENSIBILIDAD[s.sensibilidad]}. API a habilitar: {s.api}.</p>
      </details>

      <div className="mt-auto grid gap-3">
        {(s.extras ?? []).map((e) => (
          <label key={e.id} className="flex min-h-11 cursor-pointer items-start gap-2.5 text-sm text-ink">
            <input type="checkbox" className={`mt-0.5 size-5 flex-none accent-[var(--color-navy-900)] ${FOCO}`} checked={extras.includes(e.id)} onChange={(ev) => setExtras(ev.target.checked ? [...extras, e.id] : extras.filter((x) => x !== e.id))} />
            <span><strong className="font-semibold">{e.etiqueta}.</strong> {e.descripcion} <span className="text-ink-muted">({(SENSIBILIDAD[e.sensibilidad] ?? "").split(":")[0]!.toLowerCase()})</span></span>
          </label>
        ))}
        {bloqueado ? (
          <p className="rounded-lg border border-warning/30 bg-warning-bg p-3 text-sm text-ink" id={`${uid}-f`}>
            Falta configurar el servidor: <span className="font-mono text-xs">{faltan.join(", ")}</span>. Ver README de integraciones.
          </p>
        ) : null}
        <div>
          {s.proveedor === "google"
            ? <BotonGoogle href={urlConectar(s, extras)} texto={texto} deshabilitado={bloqueado} describe={bloqueado ? `${uid}-f` : undefined} />
            : <BotonFacebook href={urlConectar(s)} texto={textoFb} deshabilitado={bloqueado} describe={bloqueado ? `${uid}-f` : undefined} />}
        </div>
      </div>
    </li>
  );
}

export function ConexionesPanel({ datos }: { datos: DatosConexiones }) {
  const router = useRouter();
  const [ocupado, setOcupado] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(
    datos.aviso ? { tipo: datos.aviso === "conectada" ? "ok" : "error", texto: MOTIVOS_CALLBACK[datos.aviso] ?? "No se pudo completar la conexión." } : null,
  );

  async function llamar(url: string, method: string, ok: string) {
    setOcupado(true); setMensaje(null);
    const r = await fetch(url, { method }).catch(() => null);
    setOcupado(false);
    setMensaje(r?.ok ? { tipo: "ok", texto: ok } : { tipo: "error", texto: "No se pudo completar. Inténtalo de nuevo." });
    router.refresh();
  }

  return (
    <div className="grid gap-5">
      <header>
        <h2 className="font-heading text-xl font-bold text-ink">Conexiones</h2>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-ink-muted">
          Conecta las cuentas de Google y Meta que alimentan el origen de los leads. Solo administradores. Los permisos son de solo lectura salvo que actives uno extra, y puedes desconectar en cualquier momento.
        </p>
      </header>
      {mensaje && (
        <p role={mensaje.tipo === "error" ? "alert" : "status"} className={`rounded-lg border p-3 text-sm font-semibold ${mensaje.tipo === "ok" ? "border-success/30 bg-success-bg text-success" : "border-danger/30 bg-danger-bg text-danger"}`}>{mensaje.texto}</p>
      )}
      <ul className="m-0 grid list-none gap-4 p-0" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))" }}>
        {SERVICIOS.map((s) => (
          <Tarjeta
            key={s.id} s={s} ocupado={ocupado}
            lista={datos.conexiones.filter((c) => c.servicio === s.id)}
            faltan={datos.faltan[s.proveedor]}
            onVerificar={(id) => void llamar(`/api/integraciones/conexiones/${id}/verificar`, "POST", "Conexión comprobada.")}
            onDesconectar={(c) => void llamar(c.origen === "calendar" ? `/api/integraciones/google/cuentas/${c.id}` : `/api/integraciones/conexiones/${c.id}`, "DELETE", "Cuenta desconectada y acceso revocado.")}
          />
        ))}
      </ul>
    </div>
  );
}
