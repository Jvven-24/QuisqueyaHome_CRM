"use client";
import { Checkbox } from "@/components/ui/checkbox";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  Bot,
  Check,
  CheckCheck,
  Copy,
  ExternalLink,
  Mail,
  MessageCircle,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Badge, PageHeader } from "../_ui/prototipo-ui";
import {
  generarEnlaceTelegram,
  generarEnlaceWhatsApp,
  renderizarPlantilla,
  requiereRevisionFiscal,
  type CanalComunicacion,
} from "@/domain/comunicaciones";
import { normalizarTelefono } from "@/domain/telefono";
import { extraerVariablesDePlantilla } from "@/domain/comunicaciones";
import { PhoneInput } from "@/components/ui/phone-input";
import { horaSantoDomingo } from "@/domain/zona-horaria";
import { mostrarToast } from "@/components/ui/toast";

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
  puedeCrear?: boolean;
  puedeEditar?: boolean;
  puedeDespachar?: boolean;
}

const CATEGORIAS_OFICIALES = [
  "Todas",
  "Bienvenida",
  "Cita",
  "Oferta",
  "Seguimiento",
  "General",
] as const;

const VARIABLES_DISPONIBLES = [
  { clave: "{nombre}", etiqueta: "Nombre Cliente", valorDefault: "" },
  { clave: "{proyecto}", etiqueta: "Proyecto", valorDefault: "" },
  { clave: "{precio_desde}", etiqueta: "Precio Desde", valorDefault: "" },
  { clave: "{broker}", etiqueta: "Broker Asignado", valorDefault: "" },
  { clave: "{fecha_cita}", etiqueta: "Fecha Cita", valorDefault: "" },
  { clave: "{hora_cita}", etiqueta: "Hora Cita", valorDefault: "" },
  { clave: "{telefono}", etiqueta: "Teléfono", valorDefault: "" },
];

export function ComunicacionesVista({
  initialPlantillas,
  initialCanales,
  puedeCrear = false,
  puedeEditar = false,
  puedeDespachar = false,
}: ComunicacionesVistaProps) {
  const [plantillas, setPlantillas] = useState<PlantillaVista[]>(initialPlantillas);
  const [canales, setCanales] = useState<EstadoCanalVista[]>(initialCanales);
  const [cargandoCanales, setCargandoCanales] = useState(false);

  const plantillaInicial = initialPlantillas[0] ?? {
    id: 0,
    name: "Borrador local sin guardar",
    category: "Bienvenida",
    channel: "whatsapp" as CanalComunicacion,
    body: "",
    variables: ["nombre", "proyecto"],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const [plantillaSeleccionada, setPlantillaSeleccionada] =
    useState<PlantillaVista>(plantillaInicial);

  // Filtros de catálogo
  const [filtroCanal, setFiltroCanal] = useState<string>("todos");
  const [filtroCategoria, setFiltroCategoria] = useState<string>("Todas");
  const [busquedaPlantilla, setBusquedaPlantilla] = useState("");

  // Estado del editor
  const [nombreTemplate, setNombreTemplate] = useState(plantillaInicial.name);
  const [categoriaTemplate, setCategoriaTemplate] = useState(
    plantillaInicial.category ?? "General",
  );
  const [canalActivo, setCanalActivo] = useState<CanalComunicacion>(
    plantillaInicial.channel,
  );
  const [cuerpoTemplate, setCuerpoTemplate] = useState(plantillaInicial.body);

  // Variables para la simulación interactiva
  const [variablesSimulacion, setVariablesSimulacion] = useState<Record<string, string>>({
    nombre: "",
    proyecto: "",
    precio_desde: "",
    broker: "",
    fecha_cita: "",
    hora_cita: "",
    telefono: "",
  });

  // Destinatarios por canal
  const [destinatarioWhatsApp, setDestinatarioWhatsApp] = useState("");
  const [destinatarioEmail, setDestinatarioEmail] = useState("");
  const [asuntoEmail, setAsuntoEmail] = useState("");
  const [telegramUsername, setTelegramUsername] = useState("");

  // Errores de validación controlados (solo tras submit inválido)
  const [erroresFormulario, setErroresFormulario] = useState<Record<string, string>>({});

  // Estados de conectividad y acción
  const [estaOffline, setEstaOffline] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [despachando, setDespachando] = useState(false);
  const guardandoRef = useRef(false);
  const despachandoRef = useRef(false);
  const [copiado, setCopiado] = useState(false);
  const [revisionHumana, setRevisionHumana] = useState(false);

  useEffect(() => {setRevisionHumana(false);}, [cuerpoTemplate, canalActivo, destinatarioWhatsApp, destinatarioEmail, telegramUsername, variablesSimulacion]);

  // Hora actual en Santo Domingo para el smartphone
  const horaActualSD = useMemo(() => horaSantoDomingo(new Date()), []);

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
    setEstaOffline(typeof navigator !== "undefined" ? !navigator.onLine : false);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Sincronizar selección de plantilla con el formulario
  function seleccionarPlantilla(p: PlantillaVista) {
    setPlantillaSeleccionada(p);
    setNombreTemplate(p.name);
    setCategoriaTemplate(p.category ?? "General");
    setCanalActivo(p.channel);
    setCuerpoTemplate(p.body);
    setErroresFormulario({});
  }

  // Insertar variable en el cuerpo del mensaje
  function insertarVariable(clave: string) {
    setCuerpoTemplate((prev) => `${prev} ${clave}`);
    if (erroresFormulario.body) {
      setErroresFormulario((prev) => {
        const copia = { ...prev };
        delete copia.body;
        return copia;
      });
    }
  }

  // Mensaje renderizado en vivo con variables aplicadas
  const mensajeRenderizado = useMemo(() => {
    if (requiereRevisionFiscal(cuerpoTemplate + " " + categoriaTemplate)) return "";
    return renderizarPlantilla(cuerpoTemplate, variablesSimulacion);
  }, [cuerpoTemplate, categoriaTemplate, variablesSimulacion]);

  // Enlace directo universal a WhatsApp (wa.me) con texto codificado
  const enlaceWhatsApp = useMemo(() => {
    return generarEnlaceWhatsApp(destinatarioWhatsApp, mensajeRenderizado);
  }, [destinatarioWhatsApp, mensajeRenderizado]);

  // Enlace directo universal a Telegram
  const enlaceTelegram = useMemo(() => {
    return generarEnlaceTelegram(telegramUsername, mensajeRenderizado);
  }, [telegramUsername, mensajeRenderizado]);

  // Enlace mailto para correo a nivel de base
  const enlaceMailto = useMemo(() => {
    const asunto = encodeURIComponent(asuntoEmail || nombreTemplate || "Información de Quisqueya Home");
    const cuerpo = encodeURIComponent(mensajeRenderizado);
    return `mailto:${destinatarioEmail}?subject=${asunto}&body=${cuerpo}`;
  }, [destinatarioEmail, asuntoEmail, nombreTemplate, mensajeRenderizado]);

  // Copiar al portapapeles
  async function handleCopiarMensaje() {
    if (requiereRevisionFiscal(cuerpoTemplate + " " + categoriaTemplate)) {mostrarToast("error", "Contenido fiscal pendiente de revisión acreditada.");return;}
    if (!mensajeRenderizado.trim()) {mostrarToast("error", "Redacta el mensaje antes de copiarlo.");return;}
    try {await navigator.clipboard.writeText(mensajeRenderizado);setCopiado(true);setTimeout(()=>setCopiado(false),2000);}
    catch {mostrarToast("error", "No se pudo copiar. Selecciona el texto de la vista previa y cópialo manualmente.");}
  }

  // Refrescar estado de canales
  async function refrescarCanales() {
    if (!navigator.onLine) {mostrarToast("error", "Sin conexión. Conservamos la última configuración conocida.");return;}
    setCargandoCanales(true);
    try {
      const res = await fetch("/api/comunicaciones/canales");
      const data = await res.json();
      if (!res.ok || !Array.isArray(data.canales)) throw new Error("No se pudo consultar la configuración.");
      if (res.ok && data.canales) {
        setCanales(data.canales);
        mostrarToast("success", "Configuración de canales actualizada; disponibilidad y costos sin medición.");
      }
    } catch {
      mostrarToast("error", "No se pudo actualizar el estado de los canales.");
    } finally {
      setCargandoCanales(false);
    }
  }

  // Guardar o Actualizar plantilla en el servidor
  async function handleGuardarPlantilla() {
    if (guardandoRef.current) return;
    if (!(plantillaSeleccionada.id > 0 ? puedeEditar : puedeCrear)) {mostrarToast("error", "No tienes permiso para guardar esta plantilla.");return;}
    if (!navigator.onLine) {mostrarToast("error", "Sin conexión. El texto se conserva para reintentar.");return;}

    // Validación limpia sin alerts
    const nuevosErrores: Record<string, string> = {};
    if (!nombreTemplate.trim()) {
      nuevosErrores.name = "Escribe el nombre de la plantilla.";
    }
    if (!cuerpoTemplate.trim()) {
      nuevosErrores.body = "Escribe el cuerpo del mensaje.";
    }

    if (Object.keys(nuevosErrores).length > 0) {
      setErroresFormulario(nuevosErrores);
      document.getElementById(nuevosErrores.name ? "plantilla-nombre" : "plantilla-cuerpo")?.focus();
      return;
    }

    setErroresFormulario({});
    guardandoRef.current = true;
    setGuardando(true);

    try {
      if (plantillaSeleccionada.id > 0) {
        // Actualizar existente
        const res = await fetch(
          `/api/comunicaciones/plantillas/${plantillaSeleccionada.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: nombreTemplate.trim(),
              category: categoriaTemplate || null,
              channel: canalActivo,
              body: cuerpoTemplate.trim(),
            }),
          },
        );

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Error al actualizar plantilla.");
        }

        const data = await res.json();
        setPlantillas((prev) =>
          prev.map((item) =>
            item.id === plantillaSeleccionada.id ? data.plantilla : item,
          ),
        );
        setPlantillaSeleccionada(data.plantilla);
        mostrarToast("success", "Plantilla actualizada correctamente en el CRM.");
      } else {
        // Crear nueva
        const res = await fetch("/api/comunicaciones/plantillas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: nombreTemplate.trim(),
            category: categoriaTemplate || null,
            channel: canalActivo,
            body: cuerpoTemplate.trim(),
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Error al crear plantilla.");
        }

        const data = await res.json();
        setPlantillas((prev) => [...prev, data.plantilla]);
        setPlantillaSeleccionada(data.plantilla);
        mostrarToast("success", "Nueva plantilla oficial guardada con éxito.");
      }
    } catch (err: unknown) {
      const offline = typeof navigator !== "undefined" && !navigator.onLine;
      mostrarToast("error",
        offline
          ? "Sin conexión a internet. La plantilla no pudo guardarse pero tu texto sigue intacto."
          : err instanceof Error
          ? err.message
          : "Error al guardar la plantilla.",
      );
    } finally {
      guardandoRef.current = false;
      setGuardando(false);
    }
  }

  // Despachar mensaje multicanal directamente
  async function handleDespacharMensaje() {
    if (despachandoRef.current) return;
    if (!puedeDespachar) {mostrarToast("error", "El despacho exige permiso de comunicaciones con alcance total.");return;}
    if (!navigator.onLine) {mostrarToast("error", "Sin conexión. No se solicita un despacho.");return;}
    if (requiereRevisionFiscal(cuerpoTemplate + " " + categoriaTemplate)) {mostrarToast("error", "Contenido fiscal pendiente de revisión acreditada. El envío está bloqueado.");return;}
    if (!revisionHumana) {mostrarToast("error", "Revisa destinatario, consentimiento y condiciones del canal antes de confirmar.");return;}
    if (!mensajeRenderizado.trim() || extraerVariablesDePlantilla(mensajeRenderizado).length) {mostrarToast("error", "Completa el texto y todas las variables antes de enviar.");return;}

    let dest = "";
    if (canalActivo === "telegram") dest = `@${telegramUsername.replace(/^@/, "")}`;
    else if (canalActivo === "email") dest = destinatarioEmail.trim();
    else dest = destinatarioWhatsApp.trim();

    if ((canalActivo === "whatsapp" || canalActivo === "sms") && !normalizarTelefono(dest).phone) {mostrarToast("error", "Indica un teléfono válido con código de país.");return;}
    if (canalActivo === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dest)) {mostrarToast("error", "Indica un correo válido antes de enviar.");return;}
    if (canalActivo === "webhook") {try {if (new URL(dest).protocol !== "https:") throw new Error();} catch {mostrarToast("error", "Indica una dirección HTTPS válida para el webhook.");return;}}
    if (!dest) {
      mostrarToast("error", "Indica un destinatario válido antes de despachar.");
      return;
    }

    despachandoRef.current = true;
    setDespachando(true);

    try {
      const res = await fetch("/api/comunicaciones/despachar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          canal: canalActivo,
          destinatario: dest,
          cuerpoOPlantilla: cuerpoTemplate,
          variables: variablesSimulacion,
          asunto: canalActivo === "email" ? (asuntoEmail || nombreTemplate) : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(
          data.resultado?.error || data.error || "Fallo en el despacho multicanal.",
        );
      }

      mostrarToast("success", data.auditado
        ? "El proveedor confirmó el despacho y se registró auditoría. La entrega y lectura requieren confirmación del canal."
        : "El proveedor confirmó el despacho, pero falta auditoría. No reenvíes: comprueba el estado con administración.");
      setRevisionHumana(false);
    } catch (err: unknown) {
      const offline = typeof navigator !== "undefined" && !navigator.onLine;
      mostrarToast("error",
        offline
          ? "No se pudo confirmar el despacho. Comprueba su estado antes de reintentar; no se reenvía automáticamente."
          : err instanceof Error
          ? err.message
          : "Error en el despacho del mensaje.",
      );
    } finally {
      despachandoRef.current = false;
      setDespachando(false);
    }
  }

  // Filtrado de plantillas por Canal, Categoría y Búsqueda
  const plantillasFiltradas = useMemo(() => {
    return plantillas.filter((p) => {
      if (filtroCanal !== "todos" && p.channel !== filtroCanal) {
        return false;
      }
      if (filtroCategoria !== "Todas" && (p.category ?? "General") !== filtroCategoria) {
        return false;
      }
      if (busquedaPlantilla.trim() !== "") {
        const query = busquedaPlantilla.toLowerCase();
        const coincideNombre = p.name.toLowerCase().includes(query);
        const coincideCuerpo = p.body.toLowerCase().includes(query);
        const coincideCat = (p.category ?? "").toLowerCase().includes(query);
        if (!coincideNombre && !coincideCuerpo && !coincideCat) {
          return false;
        }
      }
      return true;
    });
  }, [plantillas, filtroCanal, filtroCategoria, busquedaPlantilla]);

  const esContenidoFiscal = requiereRevisionFiscal(cuerpoTemplate + " " + categoriaTemplate);

  return (
    <>
      <PageHeader
        eyebrow="Centro de Mensajería"
        title="Comunicaciones y Plantillas"
        subtitle="Catálogo real, editor y borradores para revisión humana. Los enlaces abren aplicaciones sin enviar mensajes automáticamente."
      />

      {/* Banner de Estado: Sin Conexión */}
      {estaOffline && (
        <div className="flex items-center gap-2.5 p-3.5 mb-4 text-[13px] font-semibold text-amber-950 bg-amber-50 border border-amber-300 rounded-xl shadow-xs">
          <WifiOff className="w-5 h-5 text-amber-600 shrink-0" />
          <span>Modo sin conexión. Puedes redactar y probar plantillas localmente en el simulador.</span>
        </div>
      )}

      {/* Monitor de Estado de Salud de Canales */}
      <section className="mb-6 p-4 rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-lg bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-navy-950 m-0">
                Configuración de canales · salud sin medición
              </h2>
              <p className="text-[13px] text-slate-500 m-0">
                Configuración disponible en el CRM. Disponibilidad del proveedor y costos no verificados.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={refrescarCanales}
            disabled={cargandoCanales}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg min-h-[44px] transition-colors self-start sm:self-center"
          >
            <RefreshCw className={`w-4 h-4 ${cargandoCanales ? "animate-spin" : ""}`} />
            <span>{cargandoCanales ? "Verificando..." : "Actualizar estado"}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {canales.map((c) => {
            const esTelegram = c.canal === "telegram";
            const esWhatsApp = c.canal === "whatsapp";
            const esEmail = c.canal === "email";
            const activo = c.configurado;

            return (
              <div
                key={c.canal}
                className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                  esWhatsApp
                    ? "bg-emerald-50/50 border-emerald-200 text-emerald-950"
                    : esEmail
                    ? "bg-indigo-50/50 border-indigo-200 text-indigo-950"
                    : esTelegram
                    ? "bg-blue-50/50 border-blue-200 text-blue-950"
                    : "bg-slate-50/70 border-slate-200 text-slate-900"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`size-8 rounded-lg flex items-center justify-center text-white ${
                        esWhatsApp
                          ? "bg-emerald-600"
                          : esTelegram
                          ? "bg-blue-600"
                          : esEmail
                          ? "bg-indigo-600"
                          : "bg-slate-700"
                      }`}
                    >
                      {esTelegram ? (
                        <Bot className="w-4 h-4" />
                      ) : esWhatsApp ? (
                        <MessageSquare className="w-4 h-4" />
                      ) : esEmail ? (
                        <Mail className="w-4 h-4" />
                      ) : (
                        <Activity className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <strong className="text-[14px] font-bold capitalize block">
                        {c.canal === "whatsapp"
                          ? "WhatsApp (wa.me)"
                          : c.canal === "email"
                          ? "Correo (Email)"
                          : c.canal}
                      </strong>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {c.detalles.nombreIdentificador ||
                          (esWhatsApp ? "Web & API" : esEmail ? "SMTP Base" : "Oficial")}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                      activo
                        ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                        : "bg-slate-200 text-slate-700 border-slate-300"
                    }`}
                  >
                    <span
                      className={`size-1.5 rounded-full ${
                        activo ? "bg-emerald-600 animate-pulse" : "bg-slate-500"
                      }`}
                    />
                    {activo ? "Configurado · sin medición" : "Sin configurar"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[12px] pt-2 border-t border-slate-200/60 text-slate-600">
                  <span className="flex items-center gap-1 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{c.activo ? "Habilitado en configuración" : "Deshabilitado en configuración"}</span>
                  </span>
                  <span className="font-bold text-navy-950 font-mono">
                    Costo no medido
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Disposición Principal: Catálogo, Editor y Simulador */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pb-20">
        {/* Columna Izquierda (lg: 4 cols): Catálogo de Plantillas */}
        <section className="panel lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <div>
              <p className="eyebrow text-gold-700 text-[11px] font-bold uppercase tracking-wider m-0">
                Catálogo Oficial
              </p>
              <h2 className="text-base font-bold text-navy-950 m-0">
                Plantillas ({plantillasFiltradas.length})
              </h2>
            </div>
            <button
              className="inline-flex items-center gap-1 px-3 py-1.5 text-[13px] font-bold text-gold-900 bg-gold-100 hover:bg-gold-200 border border-gold-300 rounded-lg min-h-[44px] transition-colors"
              type="button"
              onClick={() => {
                const nuevaPlantilla: PlantillaVista = {
                  id: 0,
                  name: "Nueva plantilla oficial",
                  category: "Bienvenida",
                  channel: "whatsapp",
                  body: "Hola {nombre}, te contactamos de Quisqueya Home en relación a tu interés en {proyecto}.",
                  variables: ["nombre", "proyecto"],
                  isActive: true,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                };
                seleccionarPlantilla(nuevaPlantilla);
              }}
            >
              <Plus className="w-4 h-4" />
              <span>{puedeCrear ? "Nueva" : "Borrador local"}</span>
            </button>
          </div>

          {/* Búsqueda de plantillas */}
          <div className="relative mb-3">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por texto o nombre..."
              value={busquedaPlantilla}
              onChange={(e) => setBusquedaPlantilla(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-[13px] border border-slate-200 rounded-lg min-h-[44px] bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gold-700 w-full"
            />
          </div>

          {/* Categorías Oficiales */}
          <div className="flex gap-1 mb-3 overflow-x-auto pb-1 text-[12px]">
            {CATEGORIAS_OFICIALES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFiltroCategoria(cat)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-bold whitespace-nowrap transition-colors min-h-[38px] ${
                  filtroCategoria === cat
                    ? "bg-navy-950 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Filtro por Canal */}
          <div className="flex gap-1 mb-3 overflow-x-auto pb-1">
            {["todos", "whatsapp", "email", "telegram"].map((ch) => (
              <button
                key={ch}
                type="button"
                onClick={() => setFiltroCanal(ch)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider transition-colors min-h-[34px] ${
                  filtroCanal === ch
                    ? "bg-gold-600 text-white"
                    : "bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                {ch === "email" ? "correo" : ch}
              </button>
            ))}
          </div>

          {/* Lista de plantillas */}
          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {plantillasFiltradas.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-[13px] bg-slate-50 rounded-xl border border-dashed border-slate-200">
                No hay plantillas que coincidan con los filtros.
              </div>
            ) : (
              plantillasFiltradas.map((item) => {
                const activa = item.id === plantillaSeleccionada.id;
                const cat = item.category ?? "General";
                return (
                  <button
                    className={`w-full p-3 rounded-xl border text-left transition-all min-h-[64px] ${
                      activa
                        ? "bg-gold-50/80 border-gold-400 shadow-xs ring-1 ring-gold-500"
                        : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60"
                    }`}
                    key={item.id}
                    type="button"
                    onClick={() => seleccionarPlantilla(item)}
                  >
                    <div className="flex items-center justify-between gap-1.5 mb-1.5">
                      <strong className="text-[13px] font-bold text-navy-950 truncate">
                        {item.name}
                      </strong>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {cat}
                        </span>
                        <Badge
                          tone={
                            item.channel === "whatsapp"
                              ? "green"
                              : item.channel === "email"
                              ? "gold"
                              : item.channel === "telegram"
                              ? "blue"
                              : "neutral"
                          }
                        >
                          {item.channel}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-[12px] text-slate-500 line-clamp-2 leading-relaxed m-0 font-sans">
                      {item.body}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </section>

        {/* Columna Central (lg: 4 cols): Editor Dinámico y Variables */}
        <section className="panel lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <div>
              <p className="eyebrow text-gold-700 text-[11px] font-bold uppercase tracking-wider m-0">
                Edición de Mensaje
              </p>
              <h2 className="text-base font-bold text-navy-950 m-0">
                Editor Dinámico
              </h2>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] text-slate-500 font-semibold">Canal:</span>
              <select
                value={canalActivo}
                onChange={(e) => setCanalActivo(e.target.value as CanalComunicacion)}
                className="text-[13px] border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white font-bold text-navy-950 min-h-[44px]"
              >
                <option value="whatsapp">WhatsApp</option>
                <option value="email">Correo (Email)</option>
                <option value="telegram">Telegram</option>
                <option value="sms">SMS</option>
                <option value="webhook">Webhook</option>
              </select>
            </div>
          </div>

          <div className="space-y-3.5">
            <div>
              <label htmlFor="plantilla-nombre" className="block text-[13px] font-bold text-slate-700 mb-1">
                Nombre de la plantilla *
              </label>
              <input
                className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-700 min-h-[44px]"
                id="plantilla-nombre" required aria-required="true" aria-invalid={!!erroresFormulario.name} aria-describedby={erroresFormulario.name ? "plantilla-nombre-error" : undefined}
                value={nombreTemplate}
                onChange={(event) => {
                  setNombreTemplate(event.target.value);
                  if (erroresFormulario.name) {
                    setErroresFormulario((prev) => {
                      const copia = { ...prev };
                      delete copia.name;
                      return copia;
                    });
                  }
                }}
              />
              {erroresFormulario.name && (
                <small id="plantilla-nombre-error" role="alert" className="text-xs text-red-600 font-semibold mt-1 block">
                  {erroresFormulario.name}
                </small>
              )}
            </div>

            <div>
              <label className="block text-[13px] font-bold text-slate-700 mb-1">
                Categoría oficial
              </label>
              <select
                value={categoriaTemplate}
                onChange={(e) => setCategoriaTemplate(e.target.value)}
                className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-700 min-h-[44px] bg-white font-medium"
              >
                <option value="Bienvenida">Bienvenida a prospecto</option>
                <option value="Cita">Confirmación / Recordatorio de Cita</option>
                <option value="Oferta">Oferta / Oportunidad de Inversión</option>
                <option value="Seguimiento">Seguimiento Post-Visita</option>
                <option value="General">General / Informativo</option>
              </select>
            </div>

            {/* Píldoras de Variables Dinámicas */}
            <div>
              <label className="block text-[13px] font-bold text-slate-700 mb-1.5">
                Insertar variable (un clic):
              </label>
              <div className="flex flex-wrap gap-1.5">
                {VARIABLES_DISPONIBLES.map((v) => (
                  <button
                    key={v.clave}
                    type="button"
                    onClick={() => insertarVariable(v.clave)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-gold-100 text-slate-800 hover:text-gold-900 font-mono text-[11px] font-semibold border border-slate-200 min-h-[38px] transition-colors"
                  >
                    <Sparkles className="w-3 h-3 text-gold-600" />
                    {v.clave}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="plantilla-cuerpo" className="block text-[13px] font-bold text-slate-700 mb-1">
                Cuerpo del mensaje (acepta saltos de línea y emojis) *
              </label>
              <textarea
                id="plantilla-cuerpo" required aria-required="true" aria-invalid={!!erroresFormulario.body} aria-describedby={erroresFormulario.body ? "plantilla-cuerpo-error" : undefined}
                rows={6}
                className="w-full p-3 text-[13px] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-700 font-sans leading-relaxed min-h-[140px]"
                value={cuerpoTemplate}
                onChange={(event) => {
                  setCuerpoTemplate(event.target.value);
                  if (erroresFormulario.body) {
                    setErroresFormulario((prev) => {
                      const copia = { ...prev };
                      delete copia.body;
                      return copia;
                    });
                  }
                }}
              />
              {erroresFormulario.body && (
                <small id="plantilla-cuerpo-error" role="alert" className="text-xs text-red-600 font-semibold mt-1 block">
                  {erroresFormulario.body}
                </small>
              )}
            </div>

            {/* Nota de contenido fiscal si aplica */}
            {esContenidoFiscal && (
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-[12px] text-amber-900 leading-relaxed">
                <strong className="block font-bold mb-0.5">Contenido fiscal pendiente de revisión:</strong>
                El CRM no dispone de una revisión acreditada de este contenido. La vista previa, la copia y el despacho permanecen bloqueados.
              </div>
            )}

            {/* Acciones de Edición */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
              <button
                className="button primary min-h-[44px] px-5 font-bold text-[13px]"
                type="button"
                disabled={guardando || despachando || estaOffline || !(plantillaSeleccionada.id > 0 ? puedeEditar : puedeCrear)}
                aria-busy={guardando}
                onClick={handleGuardarPlantilla}
              >
                {guardando ? "Guardando..." : "Guardar Plantilla"}
              </button>

              <button
                className="button secondary min-h-[44px] px-4 font-semibold text-[13px] flex items-center gap-1.5"
                type="button"
                onClick={handleCopiarMensaje}
              >
                {copiado ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiado ? "Copiado" : "Copiar"}</span>
              </button>
            </div>

            {/* Ajustes de Datos de Prueba / Simulación en Vivo */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <p className="eyebrow text-gold-700 text-[11px] font-bold uppercase tracking-wider m-0">
                Variables de Simulación en Vivo
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">Nombre prospecto</label>
                  <input
                    type="text"
                    value={variablesSimulacion.nombre}
                    onChange={(e) =>
                      setVariablesSimulacion((prev) => ({ ...prev, nombre: e.target.value }))
                    }
                    className="w-full px-2.5 py-1 text-[12px] border border-slate-200 rounded min-h-[40px] bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">Proyecto inmobiliario</label>
                  <input
                    type="text"
                    value={variablesSimulacion.proyecto}
                    onChange={(e) =>
                      setVariablesSimulacion((prev) => ({ ...prev, proyecto: e.target.value }))
                    }
                    className="w-full px-2.5 py-1 text-[12px] border border-slate-200 rounded min-h-[40px] bg-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Columna Derecha (lg: 4 cols): Simulador de Smartphone y Despacho */}
        <section className="panel lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col items-center">
          <div className="w-full flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-gold-700" />
              <div>
                <p className="eyebrow text-gold-700 text-[11px] font-bold uppercase tracking-wider m-0">
                  Simulador en Pantalla
                </p>
                <h2 className="text-base font-bold text-navy-950 m-0">
                  {canalActivo === "email" ? "Vista Previa de Correo" : "Vista Previa Móvil"}
                </h2>
              </div>
            </div>
            <span
              className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded border ${
                canalActivo === "whatsapp"
                  ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                  : canalActivo === "email"
                  ? "bg-indigo-100 text-indigo-800 border-indigo-300"
                  : "bg-blue-100 text-blue-800 border-blue-300"
              }`}
            >
              {canalActivo === "whatsapp"
                ? "WhatsApp UI"
                : canalActivo === "email"
                ? "Correo Base"
                : canalActivo.toUpperCase()}
            </span>
          </div>

          {/* Renderizado de Previsualización según Canal */}
          {canalActivo === "email" ? (
            /* Tarjeta de Previsualización de Correo Electrónico */
            <div className="w-full max-w-[340px] bg-white rounded-2xl border-2 border-indigo-200 shadow-md p-4 flex flex-col space-y-3">
              <div className="border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2 text-[12px] text-slate-500 mb-1">
                  <span className="font-semibold text-slate-700">De:</span>
                  <span>Quisqueya Home &lt;info@quisqueyahome.do&gt;</span>
                </div>
                <div className="flex items-center gap-2 text-[12px] text-slate-500 mb-1">
                  <span className="font-semibold text-slate-700">Para:</span>
                  <span className="font-mono text-slate-800">{destinatarioEmail}</span>
                </div>
                <div className="flex items-center gap-2 text-[13px] font-bold text-navy-950 mt-1">
                  <span>Asunto:</span>
                  <span>{asuntoEmail || nombreTemplate}</span>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 min-h-[220px]">
                <p className="text-[13px] text-slate-800 leading-relaxed whitespace-pre-wrap font-sans m-0">
                  {mensajeRenderizado || (esContenidoFiscal ? "Contenido oculto hasta revisión fiscal." : "Escribe el contenido del correo para previsualizarlo.")}
                </p>
              </div>

              <div className="border-t border-slate-100 pt-2 flex items-center justify-between text-[11px] text-slate-400">
                <span>Quisqueya Home Real Estate</span>
                <span>Punta Cana · Sto Dgo</span>
              </div>
            </div>
          ) : (
            /* Chasis Realista de Smartphone para WhatsApp y Telegram */
            <div className="w-full max-w-[320px] bg-slate-900 rounded-[38px] p-3 shadow-2xl border-4 border-slate-800 ring-1 ring-slate-950 relative">
              {/* Dynamic Island / Parlante */}
              <div className="absolute top-4 inset-x-0 mx-auto w-24 h-4 bg-black rounded-full z-20 flex items-center justify-center">
                <div className="size-2 rounded-full bg-slate-800 ml-auto mr-3" />
              </div>

              {/* Pantalla Interna */}
              <div className="w-full bg-[#E5DDD5] rounded-[28px] overflow-hidden flex flex-col min-h-[500px] border border-slate-700/60 relative">
                {/* Barra de Estado del Teléfono */}
                <div
                  className={`text-white px-4 pt-4 pb-1.5 flex items-center justify-between text-[11px] font-mono ${
                    canalActivo === "telegram" ? "bg-[#229ED9]" : "bg-[#075E54]"
                  }`}
                >
                  <span>{horaActualSD}</span>
                  <div className="flex items-center gap-1.5">
                    <Wifi className="w-3 h-3" />
                    <span className="text-[10px] font-sans">Demo</span>
                    <span className="text-[10px]">100%</span>
                  </div>
                </div>

                {/* Encabezado de la App de Mensajería */}
                <div
                  className={`text-white px-3 py-2 flex items-center justify-between shadow-sm ${
                    canalActivo === "telegram" ? "bg-[#229ED9]" : "bg-[#075E54]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-full bg-slate-300 border border-white/60 flex items-center justify-center text-slate-800 text-xs font-bold shrink-0">
                      {variablesSimulacion.nombre
                        ? variablesSimulacion.nombre.slice(0, 2).toUpperCase()
                        : "CG"}
                    </div>
                    <div className="min-w-0">
                      <strong className="block text-[13px] font-bold leading-tight truncate">
                        {variablesSimulacion.nombre || "Destinatario sin indicar"}
                      </strong>
                      <span className="text-[10px] text-emerald-200 block leading-none">
                        en línea
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-white/90">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                </div>

                {/* Cuerpo del Chat / Conversación */}
                <div
                  className="flex-1 p-3 overflow-y-auto flex flex-col justify-end space-y-3"
                  style={{
                    backgroundImage:
                      "radial-gradient(#075e54 0.5px, transparent 0.5px), radial-gradient(#075e54 0.5px, #e5ddd5 0.5px)",
                    backgroundSize: "20px 20px",
                    backgroundPosition: "0 0, 10px 10px",
                  }}
                >
                  {/* Separador de Fecha */}
                  <div className="text-center my-1">
                    <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase bg-white/80 text-slate-600 shadow-2xs">
                      HOY
                    </span>
                  </div>

                  {/* Mensaje Entrante del Prospecto */}
                  <div className="self-start max-w-[85%] bg-white text-slate-900 rounded-lg rounded-tl-none p-2.5 shadow-xs text-[12px] leading-relaxed">
                    Hola, vi su publicación sobre los proyectos en República Dominicana. ¿Tienen disponibilidad?
                    <div className="text-[9px] text-slate-400 text-right mt-1 font-mono">
                      10:38 AM
                    </div>
                  </div>

                  {/* Burbuja de Salida con el Mensaje Renderizado en Vivo */}
                  <div className="self-end max-w-[90%] bg-[#DCF8C6] text-slate-900 rounded-lg rounded-tr-none p-2.5 shadow-xs text-[12px] leading-relaxed whitespace-pre-wrap font-sans">
                    {mensajeRenderizado || "Escribe el cuerpo del mensaje para previsualizarlo aquí."}
                    <div className="flex items-center justify-end gap-1 text-[9px] text-slate-500 mt-1 font-mono">
                      <span>{horaActualSD}</span>
                      <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                    </div>
                  </div>
                </div>

                {/* Barra de Entrada de WhatsApp */}
                <div className="p-2 bg-slate-100 border-t border-slate-200 flex items-center gap-1.5">
                  <div className="flex-1 bg-white rounded-full px-3 py-1.5 text-[11px] text-slate-400 border border-slate-200">
                    Mensaje
                  </div>
                  <div
                    className={`size-8 rounded-full text-white flex items-center justify-center shrink-0 ${
                      canalActivo === "telegram" ? "bg-[#229ED9]" : "bg-[#075E54]"
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Formulario de Destinatario y Despacho */}
          <div className="w-full mt-4 space-y-2.5">
            <div>
              {canalActivo === "email" ? (
                <div className="space-y-2">
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                      Destinatario Correo Electrónico:
                    </label>
                    <input
                      type="email"
                      value={destinatarioEmail}
                      onChange={(e) => setDestinatarioEmail(e.target.value)}
                      placeholder="cliente@ejemplo.com"
                      className="w-full px-3 py-1.5 text-[13px] border border-slate-200 rounded-lg bg-white font-mono min-h-[44px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                      Asunto del Correo:
                    </label>
                    <input
                      type="text"
                      value={asuntoEmail}
                      onChange={(e) => setAsuntoEmail(e.target.value)}
                      placeholder="Asunto formal del correo"
                      className="w-full px-3 py-1.5 text-[13px] border border-slate-200 rounded-lg bg-white min-h-[44px]"
                    />
                  </div>
                </div>
              ) : canalActivo === "telegram" ? (
                <div>
                  <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                    Usuario Telegram (sin @):
                  </label>
                  <input
                    type="text"
                    value={telegramUsername}
                    onChange={(e) => setTelegramUsername(e.target.value)}
                    placeholder="cliente_prospecto"
                    className="w-full px-3 py-1.5 text-[13px] border border-slate-200 rounded-lg bg-white font-mono min-h-[44px]"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                    {canalActivo === "webhook" ? "Dirección HTTPS del webhook:" : "Destinatario de mensajería (formato internacional E.164):"}
                  </label>
                  {canalActivo === "webhook" ? <input id="mensaje-destinatario" type="url" value={destinatarioWhatsApp} onChange={event=>setDestinatarioWhatsApp(event.target.value)} className="w-full min-h-11 rounded-lg border border-slate-300 p-2"/> : <PhoneInput id="mensaje-destinatario" name="destinatario" value={destinatarioWhatsApp} onChangeValue={setDestinatarioWhatsApp} required/>}
                </div>
              )}
            </div>

            <p className="text-sm text-slate-600">Vista previa del borrador. Completa destinatario y variables; abrir WhatsApp, Telegram o correo no envía el mensaje. Salud y consentimiento no se acreditan desde esta simulación.</p>
            {/* Botón Principal según Canal */}
            {canalActivo === "whatsapp" ? (
              <a
                href={!esContenidoFiscal && normalizarTelefono(destinatarioWhatsApp).phone && !extraerVariablesDePlantilla(mensajeRenderizado).length ? enlaceWhatsApp : undefined}
                aria-disabled={esContenidoFiscal || !normalizarTelefono(destinatarioWhatsApp).phone || !!extraerVariablesDePlantilla(mensajeRenderizado).length}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[14px] font-bold text-white bg-[#25D366] hover:bg-[#1ebd5b] rounded-xl shadow-xs transition-colors min-h-[46px]"
                title="Abrir conversación directamente en WhatsApp Web o App móvil con texto codificado"
              >
                <MessageSquare className="w-4 h-4 fill-white" />
                <span>Abrir en WhatsApp (wa.me)</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>
            ) : canalActivo === "email" ? (
              <a
                href={!esContenidoFiscal && destinatarioEmail.trim() && !extraerVariablesDePlantilla(mensajeRenderizado).length ? enlaceMailto : undefined}
                aria-disabled={esContenidoFiscal || !destinatarioEmail.trim() || !!extraerVariablesDePlantilla(mensajeRenderizado).length}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[14px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors min-h-[46px]"
                title="Abrir en tu cliente de correo predeterminado (Outlook, Gmail, Mail)"
              >
                <Mail className="w-4 h-4" />
                <span>Abrir en Cliente de Correo</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>
            ) : canalActivo === "telegram" ? (
              <a
                href={!esContenidoFiscal && telegramUsername.trim() && !extraerVariablesDePlantilla(mensajeRenderizado).length ? enlaceTelegram : undefined}
                aria-disabled={esContenidoFiscal || !telegramUsername.trim() || !!extraerVariablesDePlantilla(mensajeRenderizado).length}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[14px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors min-h-[46px]"
              >
                <Bot className="w-4 h-4" />
                <span>Abrir en Telegram (t.me)</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>
            ) : <p className="text-sm text-slate-600">Este canal utiliza el despacho del proveedor; no tiene enlace de borrador a otra aplicación.</p>}

            <label className="flex min-h-11 items-center gap-3 text-sm"><Checkbox checked={revisionHumana} onCheckedChange={checked=>setRevisionHumana(checked)} />He revisado destinatario, consentimiento, ventana aplicable y contenido. Esta confirmación local no acredita consentimiento en servidor.</label>
            {!puedeDespachar && <p className="text-sm">Sin permiso de despacho con alcance total; puedes revisar el borrador sin enviar.</p>}
            {/* Alternativa: Despacho Directo por API Oficial / SMTP */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                disabled={despachando || guardando || estaOffline || !puedeDespachar || !revisionHumana || esContenidoFiscal}
                onClick={handleDespacharMensaje}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-[13px] font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl min-h-[44px] transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>
                  {despachando
                    ? "Despachando..."
                    : canalActivo === "email"
                    ? "Enviar por SMTP"
                    : "Despachar por API"}
                </span>
              </button>

              <button
                type="button"
                onClick={handleCopiarMensaje}
                className="inline-flex items-center justify-center gap-1 px-3 py-2 text-[13px] font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl min-h-[44px]"
                title="Copiar texto listo"
              >
                {copiado ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiado ? "Listo" : "Copiar"}</span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
