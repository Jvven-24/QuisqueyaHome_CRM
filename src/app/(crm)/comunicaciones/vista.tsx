"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  MessageSquare,
  Plus,
  Send,
  Sparkles,
  WifiOff,
  RotateCcw,
  Bot,
} from "lucide-react";
import { Badge, PageHeader } from "../_ui/prototipo-ui";
import {
  generarEnlaceTelegram,
  generarEnlaceWhatsApp,
  renderizarPlantilla,
  type CanalComunicacion,
} from "@/domain/comunicaciones";

export type PlantillaVista = {
  id: number;
  name: string;
  category: string | null;
  channel: CanalComunicacion;
  body: string;
  variables: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type EstadoCanalVista = {
  canal: CanalComunicacion;
  activo: boolean;
  configurado: boolean;
  detalles: {
    nombreIdentificador?: string;
    webhookRegistrado?: boolean;
    costoPorMensajeUSD: number;
  };
};

interface ComunicacionesVistaProps {
  initialPlantillas: PlantillaVista[];
  initialCanales: EstadoCanalVista[];
}

const VARIABLES_DISPONIBLES = [
  { clave: "{nombre}", etiqueta: "Nombre Cliente", valorDefault: "Carlos Gómez" },
  { clave: "{proyecto}", etiqueta: "Proyecto", valorDefault: "Cap Cana Luxury Lofts" },
  { clave: "{precio_desde}", etiqueta: "Precio Desde", valorDefault: "145,000" },
  { clave: "{broker}", etiqueta: "Broker Asignado", valorDefault: "Juan Pérez" },
  { clave: "{fecha_cita}", etiqueta: "Fecha Cita", valorDefault: "15 de Octubre" },
  { clave: "{hora_cita}", etiqueta: "Hora Cita", valorDefault: "10:30 AM" },
];

export function ComunicacionesVista({
  initialPlantillas,
  initialCanales,
}: ComunicacionesVistaProps) {
  const [plantillas, setPlantillas] = useState<PlantillaVista[]>(initialPlantillas);
  const [canales] = useState<EstadoCanalVista[]>(initialCanales);
  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState<PlantillaVista>(
    initialPlantillas[0] ?? {
      id: 0,
      name: "Plantilla personalizada",
      category: "General",
      channel: "telegram",
      body: "Hola {nombre}, gracias por contactar a Quisqueya Home para conocer más sobre {proyecto}.",
      variables: ["nombre", "proyecto"],
      isActive: true,
      createdAt: "",
      updatedAt: "",
    },
  );

  // Filtros de plantilla
  const [filtroCanal, setFiltroCanal] = useState<string>("todos");

  // Estado del editor
  const [nombreTemplate, setNombreTemplate] = useState(plantillaSeleccionada.name);
  const [canalActivo, setCanalActivo] = useState<CanalComunicacion>(plantillaSeleccionada.channel);
  const [cuerpoTemplate, setCuerpoTemplate] = useState(plantillaSeleccionada.body);

  // Variables para la simulación y vista previa
  const [variablesSimulacion] = useState<Record<string, string>>({
    nombre: "Carlos Gómez",
    proyecto: "Cap Cana Luxury Lofts",
    precio_desde: "145,000",
    broker: "Juan Pérez",
    fecha_cita: "15 de Octubre",
    hora_cita: "10:30 AM",
  });

  const [destinatario, setDestinatario] = useState("+18095550199");
  const [telegramUsername, setTelegramUsername] = useState("cliente_prospecto");

  // Estados UX (Regla P6 de Viltrum OS)
  const [estaOffline, setEstaOffline] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [despachando, setDespachando] = useState(false);
  const guardandoRef = useRef(false);
  const despachandoRef = useRef(false);
  const [errorMensaje, setErrorMensaje] = useState<string | null>(null);
  const [notificacionExito, setNotificacionExito] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  // Detección de conectividad
  useEffect(() => {
    function handleOnline() {
      setEstaOffline(false);
    }
    function handleOffline() {
      setEstaOffline(true);
    }
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setEstaOffline(!window.navigator.onLine);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Limpiar toast de éxito
  useEffect(() => {
    if (!notificacionExito) return;
    const timer = setTimeout(() => setNotificacionExito(null), 4000);
    return () => clearTimeout(timer);
  }, [notificacionExito]);

  // Sincronizar selección de plantilla con el formulario
  function seleccionarPlantilla(p: PlantillaVista) {
    setPlantillaSeleccionada(p);
    setNombreTemplate(p.name);
    setCanalActivo(p.channel);
    setCuerpoTemplate(p.body);
  }

  // Insertar variable en el cuerpo del mensaje
  function insertarVariable(clave: string) {
    setCuerpoTemplate((prev) => `${prev} ${clave}`);
  }

  // Mensaje renderizado en vivo
  const mensajeRenderizado = useMemo(() => {
    return renderizarPlantilla(cuerpoTemplate, variablesSimulacion);
  }, [cuerpoTemplate, variablesSimulacion]);

  // Enlaces directos universales
  const enlaceTelegram = useMemo(() => {
    return generarEnlaceTelegram(telegramUsername, mensajeRenderizado);
  }, [telegramUsername, mensajeRenderizado]);

  const enlaceWhatsApp = useMemo(() => {
    return generarEnlaceWhatsApp(destinatario, mensajeRenderizado);
  }, [destinatario, mensajeRenderizado]);

  // Copiar al portapapeles
  function handleCopiarMensaje() {
    navigator.clipboard.writeText(mensajeRenderizado);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  // Guardar o Actualizar plantilla en el servidor
  async function handleGuardarPlantilla() {
    if (guardandoRef.current) return;
    guardandoRef.current = true;
    setGuardando(true);
    setErrorMensaje(null);
    try {
      if (plantillaSeleccionada.id > 0) {
        // Actualizar
        const res = await fetch(`/api/comunicaciones/plantillas/${plantillaSeleccionada.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: nombreTemplate,
            channel: canalActivo,
            body: cuerpoTemplate,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Error al actualizar plantilla.");
        }

        const data = await res.json();
        setPlantillas((prev) =>
          prev.map((item) => (item.id === plantillaSeleccionada.id ? data.plantilla : item)),
        );
        setNotificacionExito("Plantilla actualizada correctamente en el CRM.");
      } else {
        // Crear nueva
        const res = await fetch("/api/comunicaciones/plantillas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: nombreTemplate,
            channel: canalActivo,
            body: cuerpoTemplate,
            category: "General",
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Error al crear plantilla.");
        }

        const data = await res.json();
        setPlantillas((prev) => [...prev, data.plantilla]);
        setPlantillaSeleccionada(data.plantilla);
        setNotificacionExito("Nueva plantilla guardada exitosamente.");
      }
    } catch (err: unknown) {
      const offline = typeof navigator !== "undefined" && !navigator.onLine;
      setErrorMensaje(
        offline
          ? "Sin conexión a internet. La plantilla no pudo guardarse pero tu texto sigue intacto."
          : (err instanceof Error ? err.message : "Error al guardar la plantilla."),
      );
    } finally {
      guardandoRef.current = false;
      setGuardando(false);
    }
  }

  // Despachar mensaje multicanal directamente
  async function handleDespacharMensaje() {
    if (despachandoRef.current) return;
    despachandoRef.current = true;
    setErrorMensaje(null);
    setDespachando(true);
    try {
      const dest = canalActivo === "telegram" ? `@${telegramUsername}` : destinatario;
      const res = await fetch("/api/comunicaciones/despachar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          canal: canalActivo,
          destinatario: dest,
          cuerpoOPlantilla: cuerpoTemplate,
          variables: variablesSimulacion,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.resultado?.error || data.error || "Fallo en el despacho multicanal.");
      }

      setNotificacionExito(
        `¡Mensaje despachado con éxito por ${canalActivo.toUpperCase()}! ID: ${
          data.resultado?.mensajeId
        }`,
      );
    } catch (err: unknown) {
      const offline = typeof navigator !== "undefined" && !navigator.onLine;
      setErrorMensaje(
        offline
          ? "Sin conexión a internet. No se pudo despachar el mensaje."
          : (err instanceof Error ? err.message : "Error en el despacho del mensaje."),
      );
    } finally {
      despachandoRef.current = false;
      setDespachando(false);
    }
  }

  // Filtrado de plantillas
  const plantillasFiltradas = useMemo(() => {
    if (filtroCanal === "todos") return plantillas;
    return plantillas.filter((p) => p.channel === filtroCanal);
  }, [plantillas, filtroCanal]);

  return (
    <>
      <PageHeader
        eyebrow="C11 · Mensajería Multicanal Abierta"
        title="Comunicaciones"
        subtitle="Plantillas dinámicas con variables automáticas. Integración oficial con Telegram Bot (gratis) y WhatsApp abierta."
      />

      {/* Banner de Estado: Sin Conexión */}
      {estaOffline && (
        <div className="flex items-center gap-2 p-3 mb-4 text-xs font-medium text-amber-900 bg-amber-50 border border-amber-200 rounded-lg">
          <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Modo sin conexión. Puedes redactar plantillas localmente.</span>
        </div>
      )}

      {/* Banner de Estado: Error con Reintento */}
      {errorMensaje && (
        <div className="flex items-center justify-between gap-2 p-3 mb-4 text-xs font-medium text-red-900 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMensaje}</span>
          </div>
          <button
            onClick={() => setErrorMensaje(null)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-red-700 bg-white border border-red-300 rounded hover:bg-red-50"
            type="button"
          >
            <RotateCcw className="w-3 h-3" />
            Cerrar
          </button>
        </div>
      )}

      {/* Banner de Estado: Éxito */}
      {notificacionExito && (
        <div className="flex items-center gap-2 p-3 mb-4 text-xs font-medium text-emerald-900 bg-emerald-50 border border-emerald-200 rounded-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notificacionExito}</span>
        </div>
      )}

      {/* Franja de Estado de Canales (Telegram destacado sin costo) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
        {canales.map((c) => {
          const esTelegram = c.canal === "telegram";
          return (
            <div
              key={c.canal}
              className={`p-3 rounded-xl border flex items-center justify-between ${
                esTelegram
                  ? "bg-blue-50/60 border-blue-200 text-blue-950"
                  : "bg-white border-slate-200 text-slate-900"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2 rounded-lg ${
                    esTelegram ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {esTelegram ? <Bot className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold capitalize">{c.canal}</span>
                    {esTelegram && (
                      <span className="text-[9px] font-mono font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">
                        0 Tarifa API
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500">
                    {c.detalles.nombreIdentificador || "Configurado"}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {c.detalles.costoPorMensajeUSD === 0 ? "Gratis" : `$${c.detalles.costoPorMensajeUSD}`}
              </span>
            </div>
          );
        })}
      </div>

      <div className="communications-layout">
        {/* Panel 1: Lista de Plantillas */}
        <section className="panel template-list">
          <div className="panel-title flex items-center justify-between mb-3">
            <div>
              <p className="eyebrow">Catálogo</p>
              <h2 className="text-base font-semibold text-slate-900">Plantillas</h2>
            </div>
            <button
              className="text-button flex items-center gap-1 text-xs text-amber-700 hover:text-amber-800 font-semibold"
              type="button"
              onClick={() => {
                setPlantillaSeleccionada({
                  id: 0,
                  name: "Nueva Plantilla",
                  category: "Personalizado",
                  channel: "telegram",
                  body: "Hola {nombre}, te contactamos de Quisqueya Home sobre {proyecto}.",
                  variables: ["nombre", "proyecto"],
                  isActive: true,
                  createdAt: "",
                  updatedAt: "",
                });
                setNombreTemplate("Nueva Plantilla");
                setCanalActivo("telegram");
                setCuerpoTemplate("Hola {nombre}, te contactamos de Quisqueya Home sobre {proyecto}.");
              }}
            >
              <Plus className="w-3.5 h-3.5" />
              Nueva
            </button>
          </div>

          {/* Filtro por Canal */}
          <div className="flex gap-1 mb-3 overflow-x-auto pb-1 text-xs">
            {["todos", "telegram", "whatsapp", "email"].map((ch) => (
              <button
                key={ch}
                type="button"
                onClick={() => setFiltroCanal(ch)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  filtroCanal === ch
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {ch.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
            {plantillasFiltradas.map((item) => {
              const activa = item.id === plantillaSeleccionada.id;
              return (
                <button
                  className={`w-full p-2.5 rounded-lg border text-left transition-all ${
                    activa
                      ? "bg-amber-50/70 border-amber-300 shadow-xs"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                  key={item.id}
                  type="button"
                  onClick={() => seleccionarPlantilla(item)}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <strong className="text-xs text-slate-900 truncate">{item.name}</strong>
                    <Badge tone={item.channel === "telegram" ? "blue" : item.channel === "whatsapp" ? "green" : "neutral"}>
                      {item.channel}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {item.body}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Panel 2: Editor de Mensaje y Variables */}
        <section className="panel message-editor">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="eyebrow">Edición</p>
              <h2 className="text-base font-semibold text-slate-900">Editor Dinámico</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Canal:</span>
              <select
                value={canalActivo}
                onChange={(e) => setCanalActivo(e.target.value as CanalComunicacion)}
                className="text-xs border border-slate-200 rounded-md px-2 py-1 bg-white font-medium text-slate-800"
              >
                <option value="telegram">Telegram (Recomendado)</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="email">Email</option>
                <option value="webhook">Webhook Genérico</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Nombre de la plantilla
              </label>
              <input
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                value={nombreTemplate}
                onChange={(event) => setNombreTemplate(event.target.value)}
              />
            </div>

            {/* Píldoras de Variables Dinámicas */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Insertar variable dinámica (un clic):
              </label>
              <div className="flex flex-wrap gap-1.5">
                {VARIABLES_DISPONIBLES.map((v) => (
                  <button
                    key={v.clave}
                    type="button"
                    onClick={() => insertarVariable(v.clave)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-800 font-mono text-[10px] border border-slate-200 transition-colors"
                  >
                    <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                    {v.clave}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Cuerpo del mensaje
              </label>
              <textarea
                rows={5}
                className="w-full p-3 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 font-sans leading-relaxed"
                value={cuerpoTemplate}
                onChange={(event) => setCuerpoTemplate(event.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
                type="button"
                disabled={guardando || despachando}
                aria-busy={guardando}
                onClick={handleGuardarPlantilla}
              >
                {guardando ? "Guardando..." : "Guardar Plantilla"}
              </button>
              <button
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1.5"
                type="button"
                onClick={handleCopiarMensaje}
              >
                {copiado ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiado ? "Copiado" : "Copiar Renderizado"}
              </button>
            </div>
          </div>

          {/* Vista Previa de Teléfono / Mensajero */}
          <div className="mt-5 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <p className="eyebrow">Simulador de Entrega</p>
              <span className="text-[11px] font-mono text-slate-400 capitalize">
                Canal: {canalActivo}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
              <div>
                <label className="block text-[11px] text-slate-500 mb-0.5">
                  Destinatario WhatsApp (E.164)
                </label>
                <input
                  type="text"
                  value={destinatario}
                  onChange={(e) => setDestinatario(e.target.value)}
                  className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded bg-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-0.5">
                  Usuario Telegram (sin @)
                </label>
                <input
                  type="text"
                  value={telegramUsername}
                  onChange={(e) => setTelegramUsername(e.target.value)}
                  className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded bg-white font-mono"
                />
              </div>
            </div>

            {/* Burbuja de Mensajería */}
            <div
              className={`p-4 rounded-xl border mb-3 transition-colors ${
                canalActivo === "telegram"
                  ? "bg-slate-900 border-slate-800 text-white"
                  : "bg-emerald-50/60 border-emerald-200 text-slate-900"
              }`}
            >
              <div className="flex items-center justify-between text-[11px] opacity-75 mb-2 font-mono">
                <span>
                  {canalActivo === "telegram" ? "Telegram Messenger" : "WhatsApp Business"}
                </span>
                <span>Hoy · 10:42 AM</span>
              </div>
              <p className="text-xs leading-relaxed whitespace-pre-wrap font-sans">
                {mensajeRenderizado}
              </p>
            </div>

            {/* Botones de Envío y Despacho */}
            <div className="flex flex-wrap items-center gap-2">
              {canalActivo === "telegram" ? (
                <>
                  <a
                    href={enlaceTelegram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Abrir en Telegram (Gratis)
                  </a>
                  <button
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
                    type="button"
                    disabled={despachando || guardando}
                    aria-busy={despachando}
                    onClick={handleDespacharMensaje}
                  >
                    <Send className="w-3.5 h-3.5" />
                    {despachando ? "Despachando..." : "Despachar por Bot"}
                  </button>
                </>
              ) : (
                <>
                  <a
                    href={enlaceWhatsApp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Abrir en WhatsApp (wa.me)
                  </a>
                  <button
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
                    type="button"
                    disabled={despachando || guardando}
                    aria-busy={despachando}
                    onClick={handleDespacharMensaje}
                  >
                    <Send className="w-3.5 h-3.5" />
                    {despachando ? "Despachando..." : "Despachar por API"}
                  </button>
                </>
              )}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
