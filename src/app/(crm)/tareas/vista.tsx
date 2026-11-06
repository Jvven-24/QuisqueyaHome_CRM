"use client";

import { TableroTareas, type TableroTareaItem } from "./_componentes/tablero";
import { toast } from "sonner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

import { useRouter } from "next/navigation";
import { type FormEvent, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowRightLeft,
  Building2,
  Check,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Flame,
  FolderKanban,
  Layers,
  ListChecks,
  MapPin,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Square,
  Trash2,
  User,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { erroresActividad } from "@/application/actividades/validacion";
import { fechaSantoDomingo, horaSantoDomingo, sumarDias } from "@/domain/zona-horaria";
import { AlertaErrorFormulario } from "../_ui/alerta-error-formulario";
import { Avatar, Badge, Modal, PageHeader } from "../_ui/prototipo-ui";
import { Vacio } from "../_ui/estados";

import {
  TAMANO_PAGINA,
  type CargaEquipoFila,
  type ContactoOpcion,
  type FiltroEstado,
  type ModoVista,
  type NegocioOpcion,
  type PersonaOpcion,
  type PlaybookInmobiliario,
  type ProyectoOpcion,
  type TareaFila,
  type Urgencia,
} from "./_lib/tipos";
import {
  calcularUrgencia,
  estiloPrioridad,
  etiquetaFecha,
  parsearDescripcionChecklist,
  serializarDescripcionChecklist,
} from "./_lib/utilidades";

// Contrato público previo de este módulo (se mantiene por compatibilidad).
export type {
  CargaEquipoFila,
  ContactoOpcion,
  NegocioOpcion,
  PersonaOpcion,
  PlaybookInmobiliario,
  ProyectoOpcion,
  TareaFila,
};
export { parsearDescripcionChecklist, serializarDescripcionChecklist };

export const PLAYBOOKS_INMOBILIARIOS: readonly PlaybookInmobiliario[] = [
  {
    id: "kyc_plaft",
    categoriaRea: "Cumplimiento Legal",
    etiqueta: "KYC / Ley 155-17",
    titulo: "Expediente KYC / PLAFT (Cédula/Pasaporte + Origen Lícito de Fondos)",
    prioridad: "high",
    slaDias: 1,
    ubicacionSugerida: "Bóveda Documental / Oficialía de Cumplimiento",
    resumen:
      "Debida diligencia obligatoria bajo la Ley 155-17 contra el Lavado de Activos para compradores locales y diáspora.",
    pasosChecklist: [
      "Solicitar copia legible de Cédula de Identidad o Pasaporte vigente del comprador",
      "Completar y firmar formulario Conozca a su Cliente (KYC Persona Física o Jurídica)",
      "Recopilar soporte de origen lícito de fondos (carta bancaria, declaración impositiva o certificación laboral)",
      "Validar coincidencia del titular del pago con el firmante de la reserva (cero terceros no auditados)",
      "Subir expediente validado y notificar a Oficialía de Cumplimiento",
    ],
    secuenciaMultiTarea: [
      {
        titulo: "1/3 · Solicitar identificación y formulario KYC Ley 155-17 al comprador",
        prioridad: "high",
        offsetDias: 0,
        pasos: [
          "Enviar enlace seguro de carga de Cédula/Pasaporte",
          "Remitir formulario KYC pre-llenado para firma digital",
        ],
      },
      {
        titulo: "2/3 · Recopilar soporte de origen de fondos y referencia bancaria",
        prioridad: "high",
        offsetDias: 1,
        pasos: [
          "Verificar carta bancaria y últimos estados de cuenta",
          "Confirmar país de origen de la transferencia Swift/ACH",
        ],
      },
      {
        titulo: "3/3 · Aprobación final de Oficialía de Cumplimiento PLAFT",
        prioridad: "normal",
        offsetDias: 2,
        pasos: [
          "Cruzar listas restrictivas OFAC/ONU",
          "Emitir sello de debida diligencia aprobada en el negocio",
        ],
      },
    ],
  },
  {
    id: "reserva_unidad",
    categoriaRea: "Control de Inventario",
    etiqueta: "Bloqueo & Reserva 48h",
    titulo: "Formalizar bloqueo de unidad y conciliar abono de reserva (USD 5,000)",
    prioridad: "high",
    slaDias: 0,
    ubicacionSugerida: "Matriz de Unidades / Tesorería",
    resumen:
      "Protocolo crítico para convertir un bloqueo temporal (Hold 48h) en reserva en firme con comprobante conciliado.",
    pasosChecklist: [
      "Confirmar disponibilidad y nivel/torre de la unidad en la matriz del proyecto",
      "Solicitar comprobante bancario del depósito de separación (USD 5,000 o monto pactado)",
      "Validar acreditación en cuenta fiduciaria o constructora con Administración",
      "Generar y enviar Acuerdo de Separación / Recibo de Reserva al comprador",
      "Programar fecha límite de completivo del 10% inicial (15 a 30 días)",
    ],
    secuenciaMultiTarea: [
      {
        titulo: "1/3 · Bloquear unidad en inventario y emitir instrucciones de pago de reserva",
        prioridad: "high",
        offsetDias: 0,
        pasos: [
          "Registrar Hold 48h sobre la unidad seleccionada",
          "Enviar datos bancarios verificados del fideicomiso/desarrolladora",
        ],
      },
      {
        titulo: "2/3 · Conciliar comprobante de reserva con Administración y Tesorería",
        prioridad: "high",
        offsetDias: 1,
        pasos: [
          "Subir voucher de transferencia y número de referencia",
          "Confirmar emisión de recibo oficial de caja",
        ],
      },
      {
        titulo: "3/3 · Entregar Acuerdo de Reserva firmado y abrir carpeta legal",
        prioridad: "normal",
        offsetDias: 2,
        pasos: [
          "Recabar firma del cliente en el formulario de separación",
          "Congelar precio de lista de la unidad reservada",
        ],
      },
    ],
  },
  {
    id: "firma_promesa",
    categoriaRea: "Estructuración Legal",
    etiqueta: "Promesa 10/40/50 & Fideicomiso",
    titulo: "Coordinar firma de Promesa de Compraventa y cronograma 10/40/50",
    prioridad: "high",
    slaDias: 2,
    ubicacionSugerida: "Departamento Legal / DocuSign",
    resumen:
      "Cierre contractual de la Promesa de Compraventa, adhesión al fideicomiso inmobiliario y programación de cuotas durante construcción.",
    pasosChecklist: [
      "Solicitar al equipo legal borrador de Promesa de Compraventa con datos verificados del comprador",
      "Anexar plan de pagos acordado (10% firma, 40% durante obra, 50% contra entrega o financiamiento)",
      "Revisar cláusulas de entrega, penalidades y especificaciones de terminaciones con el cliente",
      "Coordinar firma notarizada o sobre electrónico certificado (DocuSign) con todas las partes",
      "Confirmar cobro del completivo del 10% inicial y activar hito de comisión por promesa",
    ],
    secuenciaMultiTarea: [
      {
        titulo: "1/3 · Generar borrador de Promesa de Compraventa y plan de pagos 10/40/50",
        prioridad: "high",
        offsetDias: 0,
        pasos: [
          "Validar generales del comprador y código exacto de unidad/parqueos",
          "Adjuntar tabla de amortización durante construcción",
        ],
      },
      {
        titulo: "2/3 · Revisión legal con cliente y ajustes de cláusulas fiduciarias",
        prioridad: "normal",
        offsetDias: 2,
        pasos: [
          "Atender consultas del abogado del comprador",
          "Aprobar versión definitiva para firma",
        ],
      },
      {
        titulo: "3/3 · Firma de Promesa de Compraventa y validación de inicial del 10%",
        prioridad: "high",
        offsetDias: 4,
        pasos: [
          "Recoger firmas completas y legalización notarial",
          "Archivar contrato en expediente y disparar liquidación de comisión",
        ],
      },
    ],
  },
  {
    id: "confotur_fiscal",
    categoriaRea: "Incentivo Fiscal",
    etiqueta: "Dossier CONFOTUR Ley 158-01",
    titulo: "Presentar análisis de ahorro fiscal CONFOTUR (3% Transferencia + 15 años IPI)",
    prioridad: "normal",
    slaDias: 1,
    ubicacionSugerida: "Asesoría Patrimonial / DGII",
    resumen:
      "Acompañamiento fiscal en proyectos turísticos acogidos a la Ley 158-01 (Punta Cana, Cap Cana, Bávaro, Samaná).",
    pasosChecklist: [
      "Compartir resolución de clasificación CONFOTUR vigente del proyecto con el inversionista",
      "Calcular ahorro directo del 3% de Impuesto de Transferencia Inmobiliaria sobre el valor de la unidad",
      "Calcular ahorro proyectado de exención del 1% anual de IPI durante 15 años",
      "Orientar al comprador sobre los requisitos ante la DGII al recibir el título",
    ],
    secuenciaMultiTarea: [
      {
        titulo: "1/2 · Enviar simulación financiera con exención CONFOTUR Ley 158-01",
        prioridad: "normal",
        offsetDias: 0,
        pasos: [
          "Preparar cuadro comparativo de retorno neto con ahorro del 3% de transferencia",
          "Adjuntar certificación oficial del Consejo de Fomento Turístico",
        ],
      },
      {
        titulo: "2/2 · Validar requisitos de registro CONFOTUR con abogado del comprador",
        prioridad: "normal",
        offsetDias: 2,
        pasos: [
          "Explicar ventana de solicitud ante DGII tras emisión de título",
          "Confirmar estructura de compra (persona física vs. sociedad LLC/SRL)",
        ],
      },
    ],
  },
  {
    id: "tour_vip_obra",
    categoriaRea: "Experiencia en Campo",
    etiqueta: "Tour VIP / Site Visit",
    titulo: "Ejecutar Tour Inmobiliario multi-parada (Showroom + Obra + Amenidades)",
    prioridad: "high",
    slaDias: 1,
    ubicacionSugerida: "Showroom Punta Cana / Cap Cana / Piantini",
    resumen:
      "Logística integral de visita presencial para compradores locales o viajeros Fly & Buy con recorrido técnico y cierre en sala.",
    pasosChecklist: [
      "Confirmar hora de recogida, transporte ejecutivo y accesos de seguridad a los proyectos",
      "Preparar iPad con disponibilidad en vivo, planos arquitectónicos y listas de precios actualizadas",
      "Coordinar cascos de seguridad y acompañamiento del ingeniero residente en obra",
      "Realizar sesión de cierre en sala de ventas con pre-cotización de las 2 unidades favoritas",
      "Registrar minuta de visita, temperatura del cliente y enviar resumen por WhatsApp en menos de 2h",
    ],
    secuenciaMultiTarea: [
      {
        titulo: "1/3 · Preparar ruta de Tour VIP, accesos de garita y dossier comparativo",
        prioridad: "high",
        offsetDias: 0,
        pasos: [
          "Autorizar ingreso vehicular en garitas de Cap Cana / Vista Cana",
          "Imprimir o descargar fichas de las 3 unidades preseleccionadas",
        ],
      },
      {
        titulo: "2/3 · Acompañamiento presencial en Showroom y recorrido de obra",
        prioridad: "high",
        offsetDias: 1,
        pasos: [
          "Mostrar acabados en apartamento modelo y vistas por nivel",
          "Validar orientación solar, brisa y distancia a amenidades",
        ],
      },
      {
        titulo: "3/3 · Enviar cotización formal post-visita y propuesta de bloqueo 48h",
        prioridad: "high",
        offsetDias: 2,
        pasos: [
          "Remitir comparativo financiero de las unidades visitadas",
          "Hacer llamada de cierre con el tomador de decisión",
        ],
      },
    ],
  },
  {
    id: "seguimiento_diaspora",
    categoriaRea: "Inversión Internacional",
    etiqueta: "Inversor Diáspora NY/Madrid",
    titulo: "Presentación remota 360° y retorno de renta corta (Inversor Diáspora)",
    prioridad: "normal",
    slaDias: 1,
    ubicacionSugerida: "Zoom / Google Meet · Huso Horario Cliente",
    resumen:
      "Protocolo comercial para dominicanos ausentes e inversores extranjeros (EE.UU., Canadá, España) enfocados en plusvalía y flujo de caja en USD.",
    pasosChecklist: [
      "Confirmar huso horario del comprador (EST Nueva York/Miami, CET Madrid) y enviar enlace de videollamada",
      "Presentar recorrido virtual en video, avance de obra con dron y reputación de la constructora",
      "Exponer proyección de ocupación Airbnb/renta vacacional, tarifa promedio por noche y administración hotelera",
      "Explicar proceso de firma 100% digital y transferencia internacional a cuenta fiduciaria en RD",
    ],
    secuenciaMultiTarea: [
      {
        titulo: "1/2 · Videollamada consultiva de inversión y tour virtual de proyecto",
        prioridad: "normal",
        offsetDias: 0,
        pasos: [
          "Compartir pantalla con masterplan, renders y video de avance de obra",
          "Presentar calculadora de flujo de caja y plusvalía estimada hasta entrega",
        ],
      },
      {
        titulo: "2/2 · Envío de guía de compra desde el exterior y pre-aprobación hipotecaria",
        prioridad: "normal",
        offsetDias: 2,
        pasos: [
          "Enviar requisitos para financiamiento de no residentes (70% LTV)",
          "Dar seguimiento a selección de unidad por WhatsApp",
        ],
      },
    ],
  },
  {
    id: "entrega_llaves",
    categoriaRea: "Posventa & Entrega",
    etiqueta: "Snag List / Pre-Entrega",
    titulo: "Inspección técnica pre-entrega (Snag List) y Acta de Conformidad en obra",
    prioridad: "normal",
    slaDias: 3,
    ubicacionSugerida: "Unidad Terminada en Proyecto",
    resumen:
      "Verificación de calidad constructiva, levantamiento de detalles estéticos o funcionales y entrega formal de llaves.",
    pasosChecklist: [
      "Verificar saldo cero del plan de pagos o carta compromiso de desembolso bancario",
      "Inspeccionar pisos, carpintería, cerraduras, cristales y pintura junto al ingeniero de posventa",
      "Ejecutar pruebas hidrosanitarias, presión de agua, drenajes de aires y tablero eléctrico",
      "Documentar observaciones con fotos en el Snag List y fijar fecha de subsanación",
      "Firmar Acta de Entrega de Llaves y entregar Manual del Propietario y garantías",
    ],
    secuenciaMultiTarea: [
      {
        titulo: "1/2 · Recorrido técnico de pre-entrega (Snag List) con ingeniería",
        prioridad: "normal",
        offsetDias: 0,
        pasos: [
          "Revisar cada ambiente de la unidad con lista de chequeo de calidad",
          "Levantar ticket de correcciones menores antes de la cita con el cliente",
        ],
      },
      {
        titulo: "2/2 · Entrega protocolar de llaves y firma de Acta de Conformidad",
        prioridad: "high",
        offsetDias: 3,
        pasos: [
          "Confirmar corrección del 100% de puntos del Snag List",
          "Firmar acta de recepción y entregar kit de bienvenida Quisqueya Home",
        ],
      },
    ],
  },
  {
    id: "onboarding_broker",
    categoriaRea: "Habilitación de Equipo",
    etiqueta: "Acreditación de Broker",
    titulo: "Onboarding comercial de Broker: dominio de inventario, pitch y CRM",
    prioridad: "low",
    slaDias: 2,
    ubicacionSugerida: "Quisqueya Home Academy / Sala Comercial",
    resumen:
      "Lista de verificación para habilitar a un broker en un nuevo lanzamiento inmobiliario o en su ingreso a la red.",
    pasosChecklist: [
      "Completar cápsula de entrenamiento del proyecto en Quisqueya Home Academy",
      "Descargar brochure oficial, matriz de precios públicos y condiciones de comisión",
      "Realizar visita de reconocimiento al solar o apartamento modelo con el Director Comercial",
      "Ejecutar roleplay de manejo de objeciones (tasa, plazos de obra, Confotur, fideicomiso)",
      "Configurar firma comercial, disponibilidad en Agenda y meta mensual de cierres",
    ],
    secuenciaMultiTarea: [
      {
        titulo: "1/2 · Certificación de producto en Academy y descarga de kit comercial",
        prioridad: "normal",
        offsetDias: 0,
        pasos: [
          "Estudiar memoria de calidades, precios por m² y plan de pagos del proyecto",
          "Configurar plantillas de WhatsApp autorizadas",
        ],
      },
      {
        titulo: "2/2 · Visita de reconocimiento en campo y validación de pitch con Dirección",
        prioridad: "low",
        offsetDias: 2,
        pasos: [
          "Recorrer ubicación exacta y puntos de referencia de la zona",
          "Activar recepción de leads calificados en el CRM",
        ],
      },
    ],
  },
] as const;

/** Extrae las líneas de checklist `- [ ] texto` o `- [x] texto` y las notas libres de la descripción. */
export function TareasVista({
  tareas,
  cargaEquipo,
  personas,
  muestraCargaEquipo,
  proyectos = [],
  negocios = [],
  contactos = [],
  actorId,
}: {
  tareas: TareaFila[];
  cargaEquipo: CargaEquipoFila[];
  personas: PersonaOpcion[];
  muestraCargaEquipo: boolean;
  proyectos?: ProyectoOpcion[];
  negocios?: NegocioOpcion[];
  contactos?: ContactoOpcion[];
  actorId?: number;
}) {
  const router = useRouter();
  const [modoVista, setModoVista] = useState<ModoVista>("lista");
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("pending");
  const [filtroUrgencia, setFiltroUrgencia] = useState<"todas" | Urgencia>("todas");
  const [filtroBroker, setFiltroBroker] = useState<number | "todos" | "sin_asignar">("todos");
  const [filtroProyecto, setFiltroProyecto] = useState<number | "todos">("todos");
  const [filtroPrioridad, setFiltroPrioridad] = useState<"todas" | "high" | "normal" | "low">("todas");
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);

  // Selección múltiple para reasignación/relevo masivo por broker
  const [seleccionadasIds, setSeleccionadasIds] = useState<number[]>([]);
  const [brokerDestinoLote, setBrokerDestinoLote] = useState<string>("");
  const [procesandoLote, setProcesandoLote] = useState(false);

  // Control de qué tareas tienen su sub-checklist desplegado
  const [checklistsAbiertos, setChecklistsAbiertos] = useState<Record<number, boolean>>({});

  // Modales operativos
  const [modalNueva, setModalNueva] = useState(false);
  const [brokerPreseleccionadoModal, setBrokerPreseleccionadoModal] = useState<number | null>(null);
  const [playbookPreseleccionadoModal, setPlaybookPreseleccionadoModal] = useState<string | null>(null);

  const [modalPackBroker, setModalPackBroker] = useState<{
    abierto: boolean;
    brokerId: number | null;
    playbookId: string;
  }>({
    abierto: false,
    brokerId: null,
    playbookId: PLAYBOOKS_INMOBILIARIOS[0]!.id,
  });

  const [modalRelevoBroker, setModalRelevoBroker] = useState<{
    abierto: boolean;
    origenId: number | null;
    origenNombre: string;
  } | null>(null);

  const [tareaEditando, setTareaEditando] = useState<TareaFila | null>(null);
  const [tareaCompletando, setTareaCompletando] = useState<TareaFila | null>(null);
  const [tareaEliminando, setTareaEliminando] = useState<TareaFila | null>(null);
  const [actualizandoId, setActualizandoId] = useState<number | null>(null);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);
  const enviandoInline = useRef(false);

  const hoy = useMemo(() => fechaSantoDomingo(new Date()), []);

  const tareasConUrgencia = useMemo(
    () =>
      tareas.map((t) => {
        const parsed = parsearDescripcionChecklist(t.description);
        const totalPasos = parsed.items.length;
        const completadosPasos = parsed.items.filter((i) => i.completado).length;
        return {
          ...t,
          status: t.status ?? "pending",
          urgencia: calcularUrgencia(t.startsAt, hoy),
          parsedChecklist: parsed,
          checklistTotal: totalPasos,
          checklistCompletados: completadosPasos,
        };
      }),
    [tareas, hoy],
  );

  const tareasPendientes = useMemo(
    () => tareasConUrgencia.filter((t) => t.status !== "completed"),
    [tareasConUrgencia],
  );

  const tareasCompletadas = useMemo(
    () => tareasConUrgencia.filter((t) => t.status === "completed"),
    [tareasConUrgencia],
  );

  const conteos = useMemo(() => {
    const c = {
      vencidas: 0,
      hoy: 0,
      proximas: 0,
      totalPendientes: tareasPendientes.length,
      totalCompletadas: tareasCompletadas.length,
      altaPrioridad: 0,
      conRecursoRea: 0,
    };
    for (const t of tareasPendientes) {
      c[t.urgencia]++;
      if (t.priority === "high") c.altaPrioridad++;
      if (t.projectId || t.dealId || t.contactId) c.conRecursoRea++;
    }
    return c;
  }, [tareasPendientes, tareasCompletadas]);

  // Resumen detallado por Broker (Matriz  de Agentes + cruce con cargaEquipo de BD)
  const resumenPorBroker = useMemo(() => {
    const mapaCargaGlobal = new Map<number | null, number>(
      cargaEquipo.map((fila) => [fila.assigneeId, fila.total]),
    );

    const mapa = new Map<
      number | "sin_asignar",
      {
        brokerId: number | null;
        brokerName: string;
        pendientes: typeof tareasConUrgencia;
        completadas: typeof tareasConUrgencia;
        totalGlobalBd: number;
        vencidas: number;
        paraHoy: number;
        proximas: number;
        altaPrioridad: number;
      }
    >();

    for (const p of personas) {
      mapa.set(p.id, {
        brokerId: p.id,
        brokerName: p.fullName,
        pendientes: [],
        completadas: [],
        totalGlobalBd: mapaCargaGlobal.get(p.id) ?? 0,
        vencidas: 0,
        paraHoy: 0,
        proximas: 0,
        altaPrioridad: 0,
      });
    }

    for (const t of tareasConUrgencia) {
      const clave = t.assigneeId ?? "sin_asignar";
      if (!mapa.has(clave)) {
        mapa.set(clave, {
          brokerId: t.assigneeId,
          brokerName: t.assigneeName ?? "Sin broker asignado",
          pendientes: [],
          completadas: [],
          totalGlobalBd: mapaCargaGlobal.get(t.assigneeId) ?? 0,
          vencidas: 0,
          paraHoy: 0,
          proximas: 0,
          altaPrioridad: 0,
        });
      }
      const entrada = mapa.get(clave)!;
      if (t.status === "completed") {
        entrada.completadas.push(t);
      } else {
        entrada.pendientes.push(t);
        if (t.urgencia === "vencidas") entrada.vencidas++;
        else if (t.urgencia === "hoy") entrada.paraHoy++;
        else entrada.proximas++;
        if (t.priority === "high") entrada.altaPrioridad++;
      }
    }

    return Array.from(mapa.values()).sort((a, b) => {
      if (a.brokerId === null) return 1;
      if (b.brokerId === null) return -1;
      if (b.vencidas !== a.vencidas) return b.vencidas - a.vencidas;
      return b.pendientes.length - a.pendientes.length;
    });
  }, [personas, tareasConUrgencia, cargaEquipo]);

  const tareasFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return tareasConUrgencia.filter((t) => {
      if (filtroEstado === "pending" && t.status === "completed") return false;
      if (filtroEstado === "completed" && t.status !== "completed") return false;
      if (filtroUrgencia !== "todas" && t.urgencia !== filtroUrgencia) return false;
      if (filtroPrioridad !== "todas" && t.priority !== filtroPrioridad) return false;
      if (filtroProyecto !== "todos" && t.projectId !== filtroProyecto) return false;
      if (filtroBroker === "sin_asignar" && t.assigneeId !== null) return false;
      if (typeof filtroBroker === "number" && t.assigneeId !== filtroBroker) return false;
      if (q) {
        const coincideTitulo = t.title.toLowerCase().includes(q);
        const coincideDesc = (t.description ?? "").toLowerCase().includes(q);
        const coincideResp = (t.assigneeName ?? "").toLowerCase().includes(q);
        const coincideUbicacion = (t.location ?? "").toLowerCase().includes(q);
        const coincideProyecto = (t.projectName ?? "").toLowerCase().includes(q);
        const coincideNegocio = (t.dealTitle ?? "").toLowerCase().includes(q);
        const coincideContacto = (t.contactName ?? "").toLowerCase().includes(q);
        if (
          !coincideTitulo &&
          !coincideDesc &&
          !coincideResp &&
          !coincideUbicacion &&
          !coincideProyecto &&
          !coincideNegocio &&
          !coincideContacto
        ) {
          return false;
        }
      }
      return true;
    });
  }, [
    tareasConUrgencia,
    filtroEstado,
    filtroUrgencia,
    filtroPrioridad,
    filtroProyecto,
    filtroBroker,
    busqueda,
  ]);

  const totalPaginas = Math.max(1, Math.ceil(tareasFiltradas.length / TAMANO_PAGINA));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const tareasPaginadas = useMemo(() => {
    const inicio = (paginaSegura - 1) * TAMANO_PAGINA;
    return tareasFiltradas.slice(inicio, inicio + TAMANO_PAGINA);
  }, [tareasFiltradas, paginaSegura]);

  function cambiarFiltroUrgencia(nuevo: "todas" | Urgencia) {
    setFiltroUrgencia(nuevo);
    setPagina(1);
  }

  function cambiarFiltroBroker(nuevo: number | "todos" | "sin_asignar") {
    setFiltroBroker(nuevo);
    setPagina(1);
  }

  function toggleSeleccionTarea(id: number) {
    setSeleccionadasIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }

  function seleccionarTodasVisibles() {
    const idsVisibles = tareasPaginadas.map((t) => t.id);
    const todasEstan = idsVisibles.length > 0 && idsVisibles.every((id) => seleccionadasIds.includes(id));
    if (todasEstan) {
      setSeleccionadasIds((prev) => prev.filter((id) => !idsVisibles.includes(id)));
    } else {
      setSeleccionadasIds((prev) => Array.from(new Set([...prev, ...idsVisibles])));
    }
  }

  async function actualizarCampoRapido(
    id: number,
    cambios: Record<string, unknown>,
    mensajeExito?: string,
  ) {
    if (enviandoInline.current) return;
    enviandoInline.current = true;
    setActualizandoId(id);
    setErrorAccion(null);
    try {
      const res = await fetch(`/api/actividades/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(cambios),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        const msg = body?.error ?? `Error ${res.status} al actualizar la tarea.`;
        setErrorAccion(msg);
        toast.error(msg);
        return;
      }
      if (mensajeExito) toast.success(mensajeExito);
      router.refresh();
    } catch {
      const msg = "No se pudo conectar con el servidor para actualizar la tarea.";
      setErrorAccion(msg);
      toast.error(msg);
    } finally {
      enviandoInline.current = false;
      setActualizandoId(null);
    }
  }

  async function togglePasoSubChecklist(
    tarea: (typeof tareasConUrgencia)[number],
    indicePaso: number,
  ) {
    const itemsActualizados = tarea.parsedChecklist.items.map((item, idx) =>
      idx === indicePaso ? { ...item, completado: !item.completado } : item,
    );
    const nuevaDescripcion = serializarDescripcionChecklist(
      tarea.parsedChecklist.notasLibres,
      itemsActualizados,
    );
    const completadosAhora = itemsActualizados.filter((i) => i.completado).length;
    await actualizarCampoRapido(
      tarea.id,
      { description: nuevaDescripcion },
      `Checklist To-Do actualizado (${completadosAhora}/${itemsActualizados.length} pasos)`,
    );
  }

  async function reprogramarRapido(tarea: TareaFila, diasSumar: number) {
    const baseFecha = tarea.startsAt ? fechaSantoDomingo(tarea.startsAt) : hoy;
    const baseHora = tarea.startsAt ? horaSantoDomingo(tarea.startsAt) : "09:00";
    const destinoFecha = diasSumar === 0 ? hoy : sumarDias(baseFecha < hoy ? hoy : baseFecha, diasSumar);
    const nuevoIso = new Date(`${destinoFecha}T${baseHora}:00-04:00`).toISOString();
    await actualizarCampoRapido(
      tarea.id,
      { startsAt: nuevoIso },
      `Fecha límite reprogramada para ${destinoFecha}`,
    );
  }

  async function reasignarLotePorBroker() {
    if (seleccionadasIds.length === 0 || !brokerDestinoLote || procesandoLote) return;
    setProcesandoLote(true);
    setErrorAccion(null);
    const nuevoAssigneeId = brokerDestinoLote === "sin_asignar" ? null : Number(brokerDestinoLote);
    const nombreBroker =
      nuevoAssigneeId === null
        ? "Cola abierta (Sin asignar)"
        : personas.find((p) => p.id === nuevoAssigneeId)?.fullName ?? "Broker seleccionado";

    try {
      let exitos = 0;
      for (const id of seleccionadasIds) {
        const res = await fetch(`/api/actividades/${id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ assigneeId: nuevoAssigneeId }),
        });
        if (res.ok) exitos++;
      }
      if (exitos > 0) {
        toast.success(`${exitos} tarea(s) asignadas a ${nombreBroker}`);
        setSeleccionadasIds([]);
        setBrokerDestinoLote("");
        router.refresh();
      } else {
        toast.error("No se pudieron reasignar las tareas seleccionadas.");
      }
    } catch {
      toast.error("Error de red al procesar la reasignación en lote.");
    } finally {
      setProcesandoLote(false);
    }
  }

  function abrirNuevaTareaParaBroker(brokerId: number | null, playbookId: string | null = null) {
    setBrokerPreseleccionadoModal(brokerId);
    setPlaybookPreseleccionadoModal(playbookId);
    setModalNueva(true);
  }

  const hayFiltrosActivos =
    filtroEstado !== "pending" ||
    filtroUrgencia !== "todas" ||
    filtroBroker !== "todos" ||
    filtroProyecto !== "todos" ||
    filtroPrioridad !== "todas" ||
    busqueda.trim() !== "";

  // Preparar columnas para TableroTareas
  const gruposTablero = useMemo(() => {
    const aItem = (t: (typeof tareasConUrgencia)[number]): TableroTareaItem => ({
      id: t.id,
      title: t.title,
      description: t.description,
      priority: t.priority,
      status: t.status,
      assigneeName: t.assigneeName,
      projectName: t.projectName,
      dealTitle: t.dealTitle,
      contactName: t.contactName,
      location: t.location,
      etiquetaTiempo: t.startsAt ? `${fechaSantoDomingo(t.startsAt)} · ${horaSantoDomingo(t.startsAt)}` : "Sin fecha",
      checklistTotal: t.checklistTotal,
      checklistCompletados: t.checklistCompletados,
    });

    return [
      {
        id: "vencidas",
        titulo: "Vencidas · Acción Inmediata",
        subtitulo: "SLA excedido · Requiere atención hoy",
        tono: "red" as const,
        filas: tareasFiltradas.filter((t) => t.status !== "completed" && t.urgencia === "vencidas").map(aItem),
      },
      {
        id: "hoy",
        titulo: "Para Hoy · Foco Comercial",
        subtitulo: `Compromisos del día (${hoy})`,
        tono: "gold" as const,
        filas: tareasFiltradas.filter((t) => t.status !== "completed" && t.urgencia === "hoy").map(aItem),
      },
      {
        id: "proximas",
        titulo: "Próximas · En Agenda",
        subtitulo: "Seguimientos programados",
        tono: "green" as const,
        filas: tareasFiltradas.filter((t) => t.status !== "completed" && t.urgencia === "proximas").map(aItem),
      },
      {
        id: "completadas",
        titulo: "Completadas Recientes",
        subtitulo: "Con evidencia verificada",
        tono: "blue" as const,
        filas: tareasCompletadas.slice(0, 15).map(aItem),
      },
    ];
  }, [tareasFiltradas, tareasCompletadas, hoy]);

  return (
    <div className="min-w-0 space-y-4">
      <PageHeader
        title="Tareas"
        subtitle="Organiza pendientes, responsables y próximos pasos de la operación comercial."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setModalPackBroker({ abierto: true, brokerId: typeof filtroBroker === "number" ? filtroBroker : actorId ?? personas[0]?.id ?? null, playbookId: PLAYBOOKS_INMOBILIARIOS[0]!.id })} className="button secondary min-h-12 gap-2">
              <Sparkles className="size-4 shrink-0" aria-hidden="true" /><span>Asignar plan</span>
            </button>
            <button type="button" onClick={() => abrirNuevaTareaParaBroker(typeof filtroBroker === "number" ? filtroBroker : null, null)} className="button primary min-h-12 gap-2">
              <Plus className="size-4 shrink-0" aria-hidden="true" /><span>Nueva tarea</span>
            </button>
          </div>
        }
      />

      <div role="group" aria-label="Vista de tareas" className="grid grid-cols-4 gap-1 rounded-xl border border-line bg-surface-alt p-1">
        {([{ id: "lista", label: "Lista", icon: ListChecks }, { id: "tablero", label: "Tablero", icon: Layers }, { id: "brokers", label: "Equipo", icon: Users }, { id: "playbooks", label: "Plantillas", icon: Sparkles }] as const).map(view => {
          const Icon = view.icon;
          return <button key={view.id} type="button" aria-pressed={modoVista === view.id} onClick={() => setModoVista(view.id)} className={"inline-flex min-h-12 min-w-0 items-center justify-center gap-2 rounded-lg px-1 text-[13px] font-semibold transition-colors sm:px-3 " + (modoVista === view.id ? "bg-navy-950 text-white" : "text-ink-muted hover:bg-surface hover:text-ink")}><Icon className="hidden size-4 shrink-0 sm:block" aria-hidden="true" />{view.label}</button>;
        })}
      </div>

      <section aria-label="Buscar y filtrar tareas" className="min-w-0 rounded-xl border border-line bg-surface p-3 sm:p-4">
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_7.5rem] items-end gap-3 lg:grid-cols-[minmax(0,1fr)_240px]">
          <label className="min-w-0 text-[13px]" htmlFor="tareas-search">Buscar tareas
            <span className="relative block min-w-0">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
              <input id="tareas-search" type="search" value={busqueda} onChange={event => { setBusqueda(event.target.value); setPagina(1); }} placeholder="Tarea, broker, proyecto o cliente…" className="min-h-12 w-full min-w-0 rounded-lg border border-line bg-surface pr-12 pl-10 text-sm" />
              {busqueda && <button type="button" onClick={() => { setBusqueda(""); setPagina(1); }} aria-label="Limpiar búsqueda" className="absolute top-1/2 right-0 inline-flex size-12 -translate-y-1/2 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-alt"><X className="size-4" aria-hidden="true" /></button>}
            </span>
          </label>
          <label className="min-w-0 text-[13px]" htmlFor="tareas-state">Estado
            <select id="tareas-state" value={filtroEstado} onChange={event => { setFiltroEstado(event.target.value as FiltroEstado); setPagina(1); }} className="min-h-12 w-full min-w-0 rounded-lg border border-line bg-surface px-3 text-sm">
              <option value="pending">Pendientes ({conteos.totalPendientes})</option><option value="completed">Completadas ({conteos.totalCompletadas})</option><option value="all">Todas ({tareasConUrgencia.length})</option>
            </select>
          </label>
        </div>
        <Accordion type="single" collapsible className="mt-3 border-t border-line">
          <AccordionItem value="task-filters" className="border-0">
            <AccordionTrigger className="text-[13px]">Filtros <span className="ml-auto font-normal text-ink-muted">{hayFiltrosActivos ? "Filtros activos" : <><span className="sm:hidden">Opciones</span><span className="hidden sm:inline">Responsable, proyecto y prioridad</span></>}</span></AccordionTrigger>
            <AccordionContent className="pb-0">
              <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <label className="min-w-0 text-[13px]">Responsable
                  <select value={String(filtroBroker)} onChange={event => cambiarFiltroBroker(event.target.value === "todos" || event.target.value === "sin_asignar" ? event.target.value : Number(event.target.value))} className="min-h-12 w-full min-w-0 rounded-lg border border-line bg-surface px-3 text-sm">
                    <option value="todos">Todo el equipo</option><option value="sin_asignar">Sin asignar</option>{personas.map(persona => <option key={persona.id} value={persona.id}>{persona.fullName}</option>)}
                  </select>
                </label>
                {proyectos.length > 0 && <label className="min-w-0 text-[13px]">Proyecto
                  <select value={String(filtroProyecto)} onChange={event => { setFiltroProyecto(event.target.value === "todos" ? "todos" : Number(event.target.value)); setPagina(1); }} className="min-h-12 w-full min-w-0 rounded-lg border border-line bg-surface px-3 text-sm">
                    <option value="todos">Todos los proyectos ({proyectos.length})</option>{proyectos.map(proyecto => <option key={proyecto.id} value={proyecto.id}>{proyecto.name}{proyecto.zone ? ` · ${proyecto.zone}` : ""}</option>)}
                  </select>
                </label>}
                <label className="min-w-0 text-[13px]">Prioridad
                  <select value={filtroPrioridad} onChange={event => { setFiltroPrioridad(event.target.value as "todas" | "high" | "normal" | "low"); setPagina(1); }} className="min-h-12 w-full min-w-0 rounded-lg border border-line bg-surface px-3 text-sm"><option value="todas">Todas las prioridades</option><option value="high">Alta</option><option value="normal">Normal</option><option value="low">Baja</option></select>
                </label>
                <label className="min-w-0 text-[13px]">Vencimiento
                  <select value={filtroUrgencia} onChange={event => cambiarFiltroUrgencia(event.target.value as "todas" | Urgencia)} className="min-h-12 w-full min-w-0 rounded-lg border border-line bg-surface px-3 text-sm"><option value="todas">Cualquier fecha</option><option value="vencidas">Vencidas</option><option value="hoy">Para hoy</option><option value="proximas">Próximas</option></select>
                </label>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        {hayFiltrosActivos && <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-2"><span className="text-[13px] text-ink-muted" role="status">{tareasFiltradas.length} tareas coinciden con la búsqueda y los filtros.</span><button type="button" onClick={() => { setFiltroEstado("pending"); setFiltroUrgencia("todas"); setFiltroBroker("todos"); setFiltroProyecto("todos"); setFiltroPrioridad("todas"); setBusqueda(""); setPagina(1); }} className="inline-flex min-h-12 items-center gap-2 rounded-lg px-3 text-[13px] font-semibold text-navy-900 hover:bg-surface-alt"><RotateCcw className="size-4" aria-hidden="true" />Limpiar filtros</button></div>}
      </section>

      {/* Barra de Acción Masiva (Bulk Assignment / Handover por Broker) */}
      {seleccionadasIds.length > 0 && (
        <div
          role="region"
          aria-label="Acciones en lote para tareas seleccionadas"
          className="grid min-w-0 gap-3 rounded-xl border border-navy-950 bg-navy-950 px-4 py-3 text-white"
        >
          <div className="flex items-center gap-2.5">
            <span className="inline-flex size-7 items-center justify-center rounded-full bg-[#d97706] text-[13px] font-bold tabular-nums text-white">
              {seleccionadasIds.length}
            </span>
            <span className="text-[14px] font-semibold">
              tareas seleccionadas
            </span>
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center">
            <select
              value={brokerDestinoLote}
              onChange={(e) => setBrokerDestinoLote(e.target.value)}
              aria-label="Seleccionar broker destino para las tareas marcadas"
              className="min-h-12 min-w-0 w-full rounded-lg border border-white/25 bg-white px-3 text-[13px] font-medium text-navy-950 sm:w-auto sm:flex-1"
            >
              <option value="">Elegir Broker Destino...</option>
              {personas.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  Asignar a: {p.fullName}
                </option>
              ))}
              <option value="sin_asignar">Dejar sin asignar (Cola abierta)</option>
            </select>

            <button
              type="button"
              disabled={!brokerDestinoLote || procesandoLote}
              onClick={() => void reasignarLotePorBroker()}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-[#059669] px-4 text-[13px] font-bold text-white transition-colors hover:bg-[#047857] disabled:opacity-50"
            >
              <ArrowRightLeft className="size-4" aria-hidden="true" />
              <span>{procesandoLote ? "Asignando..." : "Asignar Lote al Broker"}</span>
            </button>

            <button
              type="button"
              onClick={() => setSeleccionadasIds([])}
              className="inline-flex min-h-[44px] items-center gap-1 rounded-lg border border-white/25 px-3 text-[13px] font-semibold text-white hover:bg-white/10"
            >
              <X className="size-4" aria-hidden="true" />
              <span>Cancelar</span>
            </button>
          </div>
        </div>
      )}

      {errorAccion && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-[14px] text-[#991b1b]"
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <AlertCircle className="size-4 shrink-0 text-[#dc2626]" aria-hidden="true" />
            <span className="min-w-0 break-words">{errorAccion}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorAccion(null)}
            aria-label="Cerrar alerta"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-[#991b1b] hover:bg-[#fee2e2]"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* ===================================================================== */}
      {/* VISTA 1: LISTA TO-DO INTELIGENTE CON SUB-CHECKLISTS Y VÍNCULOS     */}
      {/* ===================================================================== */}
      {modoVista === "lista" && (
        <>
          {tareasFiltradas.length === 0 ? (
            <div className="rounded-xl border border-[#e2e8f0] bg-white p-8 shadow-2xs">
              <Vacio
                titulo={
                  hayFiltrosActivos
                    ? "Sin tareas para los filtros seleccionados"
                    : "Bandeja To-Do al día · Sin tareas pendientes"
                }
                texto={
                  hayFiltrosActivos
                    ? "Prueba limpiando los filtros de broker, proyecto o prioridad para ver toda la operación."
                    : "Asigna una tarea individual o despliega un plan de trabajo (KYC, Reserva 48h, Promesa 10/40/50 o Tour VIP) a cualquier broker."
                }
                accion={
                  <div className="flex flex-wrap items-center justify-center gap-2.5">
                    {hayFiltrosActivos && (
                      <button
                        type="button"
                        onClick={() => {
                          setFiltroEstado("pending");
                          setFiltroUrgencia("todas");
                          setFiltroBroker("todos");
                          setFiltroProyecto("todos");
                          setFiltroPrioridad("todas");
                          setBusqueda("");
                          setPagina(1);
                        }}
                        className="btn btn-ghost min-h-[44px] gap-2 px-4 text-[14px]"
                      >
                        <RotateCcw className="size-4" aria-hidden="true" />
                        <span>Restablecer filtros</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => abrirNuevaTareaParaBroker(null, null)}
                      className="btn btn-primary min-h-[44px] gap-2 px-4 text-[14px]"
                    >
                      <Plus className="size-4" aria-hidden="true" />
                      <span>Crear Tarea</span>
                    </button>
                  </div>
                }
              />
            </div>
          ) : (
            <div className="space-y-3">
              {/* Barra de selección rápida de página */}
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-2.5">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={seleccionarTodasVisibles}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-lg px-2 text-[13px] font-semibold text-[#334155] hover:bg-[#e2e8f0]/60"
                  >
                    {tareasPaginadas.length > 0 &&
                    tareasPaginadas.every((t) => seleccionadasIds.includes(t.id)) ? (
                      <CheckSquare className="size-4 text-[#0f172a]" aria-hidden="true" />
                    ) : (
                      <Square className="size-4 text-[#64748b]" aria-hidden="true" />
                    )}
                    <span>Seleccionar visibles para asignar en lote</span>
                  </button>
                </div>

                <div className="text-[13px] font-medium tabular-nums text-[#475569]">
                  Mostrando <strong className="text-[#0f172a]">{tareasPaginadas.length}</strong> de{" "}
                  <strong className="text-[#0f172a]">{tareasFiltradas.length}</strong> tareas
                </div>
              </div>

              {tareasPaginadas.map((t) => {
                const pri = estiloPrioridad(t.priority);
                const infoFecha = etiquetaFecha(t.startsAt, hoy);
                const cargando = actualizandoId === t.id;
                const esVencida = t.status !== "completed" && t.urgencia === "vencidas";
                const esHoy = t.status !== "completed" && t.urgencia === "hoy";
                const esCompletada = t.status === "completed";
                const seleccionada = seleccionadasIds.includes(t.id);
                const tieneChecklist = t.checklistTotal > 0;
                const checklistAbierto = checklistsAbiertos[t.id] ?? false;
                const pctChecklist = tieneChecklist
                  ? Math.round((t.checklistCompletados / t.checklistTotal) * 100)
                  : 0;

                return (
                  <article
                    key={t.id}
                    className={`min-w-0 rounded-xl border bg-surface p-3 sm:p-4 transition-colors ${
                      seleccionada
                        ? "border-[#0f172a] ring-1 ring-[#0f172a]"
                        : esCompletada
                          ? "border-[#a7f3d0] bg-[#f8fafc]/70"
                          : esVencida
                            ? "border-danger/40"
                            : esHoy
                              ? "border-warning/40"
                              : "border-[#e2e8f0]"
                    }`}
                  >
                    <div className="flex min-w-0 flex-col gap-3">
                      {/* Columna izquierda: Selección + Check de completado + Contenido  */}
                      <div className="flex flex-1 items-start gap-3 min-w-0">
                        <div className="flex shrink-0 flex-col gap-1 sm:flex-row">
                        {/* Casilla de selección en lote */}
                        <button
                          type="button"
                          onClick={() => toggleSeleccionTarea(t.id)}
                          aria-pressed={seleccionada}
                          aria-label={`Seleccionar tarea ${t.title} para acción en lote`}
                          className="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-lg border border-[#cbd5e1] bg-[#f8fafc] text-[#334155] transition-colors hover:border-[#0f172a] hover:bg-white"
                        >
                          {seleccionada ? (
                            <CheckSquare className="size-5 text-[#0f172a]" aria-hidden="true" />
                          ) : (
                            <Square className="size-5 text-[#64748b]" aria-hidden="true" />
                          )}
                        </button>

                        {/* Botón principal de completar / reabrir To-Do */}
                        <button
                          type="button"
                          disabled={cargando}
                          onClick={() => {
                            if (esCompletada) {
                              void actualizarCampoRapido(
                                t.id,
                                { status: "pending" },
                                "Tarea reabierta en la cola activa",
                              );
                            } else {
                              setTareaCompletando(t);
                            }
                          }}
                          title={
                            esCompletada
                              ? "Reabrir tarea como pendiente"
                              : "Marcar tarea como completada con evidencia"
                          }
                          aria-label={
                            esCompletada
                              ? `Reabrir tarea: ${t.title}`
                              : `Completar tarea: ${t.title}`
                          }
                          className={`mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-xl border-2 transition-all disabled:opacity-50 ${
                            esCompletada
                              ? "border-[#059669] bg-[#059669] text-white hover:bg-[#047857]"
                              : esVencida
                                ? "border-[#fca5a5] bg-[#fef2f2] text-[#dc2626] hover:border-[#dc2626] hover:bg-[#dc2626] hover:text-white"
                                : "border-[#cbd5e1] bg-white text-[#475569] hover:border-[#059669] hover:bg-[#ecfdf5] hover:text-[#059669]"
                          }`}
                        >
                          <Check className="size-5" aria-hidden="true" />
                        </button>
                        </div>

                        <div className="min-w-0 flex-1 space-y-2">
                          {/* Título y Badges de Estado / SLA / Prioridad */}
                          <div className="flex flex-wrap items-center gap-2">
                            <h3
                              className={`text-[15px] font-bold leading-snug text-[#0f172a] ${
                                esCompletada ? "line-through opacity-75" : ""
                              }`}
                            >
                              <button type="button" onClick={() => setTareaEditando(t)} className="min-w-0 break-words text-left hover:underline underline-offset-4">{t.title}</button>
                            </h3>
                            <span
                              className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-[13px] font-semibold ${pri.bg} ${pri.text} ${pri.border}`}
                            >
                              {pri.label}
                            </span>
                            {esCompletada ? (
                              <Badge tone="green">
                                Completada{" "}
                                {t.completedAt ? `· ${fechaSantoDomingo(t.completedAt)}` : ""}
                              </Badge>
                            ) : (
                              <Badge tone={infoFecha.tono}>{infoFecha.texto}</Badge>
                            )}
                          </div>

                          {/* Etiquetas de la Tríada  (Recurso: Proyecto / Negocio / Cliente / Ubicación) */}
                          {(t.projectName || t.dealTitle || t.contactName || t.location) && (
                            <div className="flex flex-wrap items-center gap-2 pt-0.5">
                              {t.projectName && (
                                <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#bfdbfe] bg-[#eff6ff] px-2.5 py-1 text-[13px] font-semibold text-[#1e40af]">
                                  <Building2 className="size-3.5 shrink-0" aria-hidden="true" />
                                  <span>
                                    Proyecto: {t.projectName}
                                    {t.projectZone ? ` (${t.projectZone})` : ""}
                                  </span>
                                </span>
                              )}
                              {t.dealTitle && (
                                <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#fde68a] bg-[#fffbeb] px-2.5 py-1 text-[13px] font-semibold text-[#92400e]">
                                  <FolderKanban className="size-3.5 shrink-0" aria-hidden="true" />
                                  <span>Negocio: {t.dealTitle}</span>
                                </span>
                              )}
                              {t.contactName && (
                                <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-2.5 py-1 text-[13px] font-semibold text-[#334155]">
                                  <User className="size-3.5 shrink-0" aria-hidden="true" />
                                  <span>Cliente: {t.contactName}</span>
                                </span>
                              )}
                              {t.location && (
                                <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-2.5 py-1 text-[13px] text-[#475569]">
                                  <MapPin className="size-3.5 shrink-0 text-[#64748b]" aria-hidden="true" />
                                  <span>{t.location}</span>
                                </span>
                              )}
                            </div>
                          )}

                          {/* Notas libres de la tarea */}
                          {t.parsedChecklist.notasLibres && (
                            <p className="line-clamp-2 text-[14px] leading-relaxed text-[#475569]">
                              {t.parsedChecklist.notasLibres}
                            </p>
                          )}

                          {/* Sub-Checklist To-Do Interactivo */}
                          {tieneChecklist && (
                            <div className="mt-2 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <button
                                  type="button"
                                  aria-expanded={checklistAbierto}
                                  aria-controls={`tarea-checklist-${t.id}`}
                                  onClick={() =>
                                    setChecklistsAbiertos((prev) => ({
                                      ...prev,
                                      [t.id]: !checklistAbierto,
                                    }))
                                  }
                                  className="inline-flex min-h-[44px] items-center gap-2 text-left text-[13px] font-bold text-[#0f172a]"
                                >
                                  <ListChecks className="size-4 text-[#059669]" aria-hidden="true" />
                                  <span>
                                    Pasos ({t.checklistCompletados}/{t.checklistTotal} · {pctChecklist}%)
                                  </span>
                                  {checklistAbierto ? (
                                    <ChevronUp className="size-4 text-[#64748b]" aria-hidden="true" />
                                  ) : (
                                    <ChevronDown className="size-4 text-[#64748b]" aria-hidden="true" />
                                  )}
                                </button>

                                <div className="h-2 w-32 overflow-hidden rounded-full bg-[#e2e8f0]">
                                  <div
                                    className="h-full rounded-full bg-[#059669] transition-all"
                                    style={{ width: `${pctChecklist}%` }}
                                  />
                                </div>
                              </div>

                              {checklistAbierto && (
                                <ul id={`tarea-checklist-${t.id}`} className="mt-2 space-y-1.5 border-t border-line pt-2.5">
                                  {t.parsedChecklist.items.map((paso, idxPaso) => (
                                    <li key={idxPaso}>
                                      <button
                                        type="button"
                                        disabled={cargando}
                                        onClick={() => void togglePasoSubChecklist(t, idxPaso)}
                                        className={`flex min-h-[44px] w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[13px] transition-colors ${
                                          paso.completado
                                            ? "bg-[#ecfdf5]/60 text-[#065f46]"
                                            : "bg-white text-[#0f172a] hover:bg-[#f1f5f9]"
                                        }`}
                                      >
                                        {paso.completado ? (
                                          <CheckSquare
                                            className="size-4 shrink-0 text-[#059669]"
                                            aria-hidden="true"
                                          />
                                        ) : (
                                          <Square
                                            className="size-4 shrink-0 text-[#64748b]"
                                            aria-hidden="true"
                                          />
                                        )}
                                        <span className={paso.completado ? "line-through opacity-80" : "font-medium"}>
                                          {paso.texto}
                                        </span>
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Columna derecha: Asignación de Broker Inline + Prioridad + Acciones Rápidas */}
                      <details className="min-w-0 rounded-lg border border-line bg-surface-alt px-3">
                        <summary className="flex min-h-12 cursor-pointer list-none flex-wrap items-center justify-between gap-2 text-[13px]">
                          <span className="flex min-w-0 items-center gap-2"><Avatar name={t.assigneeName ?? "?"} small /><span className="min-w-0 break-words font-medium text-ink">{t.assigneeName ?? "Sin responsable asignado"}</span></span>
                          <span className="inline-flex items-center gap-1 font-semibold text-navy-900">Gestionar<ChevronDown className="size-4" aria-hidden="true" /></span>
                        </summary>
                        <div className="flex min-w-0 flex-wrap items-center gap-2 border-t border-line py-3">
                        {/* Selector directo de Broker responsable */}
                        <div className="flex min-w-0 w-full items-center gap-1.5 sm:w-auto">
                          <Avatar name={t.assigneeName ?? "?"} small />
                          <select
                            aria-label={`Broker asignado a ${t.title}`}
                            disabled={cargando}
                            value={t.assigneeId ?? ""}
                            onChange={(e) => {
                              const val = e.target.value ? Number(e.target.value) : null;
                              const nombre =
                                val === null
                                  ? "Sin asignar"
                                  : personas.find((p) => p.id === val)?.fullName ?? "Broker";
                              void actualizarCampoRapido(
                                t.id,
                                { assigneeId: val },
                                `Tarea asignada a ${nombre}`,
                              );
                            }}
                            className="min-h-12 min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 text-[13px] font-medium text-ink focus-visible:outline-2 focus-visible:outline-gold-700 disabled:opacity-50 sm:max-w-xs"
                          >
                            <option value="">Sin broker asignado</option>
                            {personas.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.fullName}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Selector directo de Prioridad */}
                        <select
                          aria-label={`Prioridad de ${t.title}`}
                          disabled={cargando}
                          value={t.priority}
                          onChange={(e) =>
                            void actualizarCampoRapido(
                              t.id,
                              { priority: e.target.value },
                              "Prioridad actualizada",
                            )
                          }
                          className="min-h-12 min-w-0 w-full rounded-lg border border-line bg-surface px-3 text-[13px] font-medium text-ink focus-visible:outline-2 focus-visible:outline-gold-700 disabled:opacity-50 sm:w-auto"
                        >
                          <option value="high">Alta</option>
                          <option value="normal">Normal</option>
                          <option value="low">Baja</option>
                        </select>

                        {/* Botones rápidos de SLA */}
                        {!esCompletada && (
                          <div
                            className="inline-flex items-center rounded-lg border border-[#cbd5e1] bg-[#f8fafc] p-0.5"
                            role="group"
                            aria-label="Reprogramar fecha rápida"
                          >
                            {esVencida && (
                              <button
                                type="button"
                                disabled={cargando}
                                onClick={() => void reprogramarRapido(t, 0)}
                                className="min-h-[44px] rounded-md px-2.5 text-[13px] font-semibold text-[#b45309] transition-colors hover:bg-[#fffbeb] disabled:opacity-50"
                                title="Mover para hoy"
                              >
                                Hoy
                              </button>
                            )}
                            <button
                              type="button"
                              disabled={cargando}
                              onClick={() => void reprogramarRapido(t, 1)}
                              className="min-h-[44px] rounded-md px-2.5 text-[13px] font-semibold text-[#334155] transition-colors hover:bg-white disabled:opacity-50"
                              title="Posponer 1 día"
                            >
                              +1d
                            </button>
                            <button
                              type="button"
                              disabled={cargando}
                              onClick={() => void reprogramarRapido(t, 3)}
                              className="min-h-[44px] rounded-md px-2.5 text-[13px] font-semibold text-[#334155] transition-colors hover:bg-white disabled:opacity-50"
                              title="Posponer 3 días"
                            >
                              +3d
                            </button>
                          </div>
                        )}

                        <button
                          type="button"
                          disabled={cargando}
                          onClick={() => setTareaEditando(t)}
                          title="Editar tarea y sub-checklist"
                          aria-label={`Editar ${t.title}`}
                          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-[#cbd5e1] bg-white px-2.5 text-[#334155] transition-colors hover:bg-[#f8fafc] disabled:opacity-50"
                        >
                          <Pencil className="size-4" aria-hidden="true" />
                        </button>

                        <button
                          type="button"
                          disabled={cargando}
                          onClick={() => setTareaEliminando(t)}
                          title="Eliminar tarea"
                          aria-label={`Eliminar ${t.title}`}
                          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-[#fecaca] bg-white px-2.5 text-[#dc2626] transition-colors hover:bg-[#fef2f2] disabled:opacity-50"
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </button>
                        </div>
                      </details>
                    </div>
                  </article>
                );
              })}

              {/* Paginación */}
              {totalPaginas > 1 && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e2e8f0] bg-white px-4 py-3">
                  <div className="text-[13px] text-[#64748b] tabular-nums">
                    Página <strong className="text-[#0f172a]">{paginaSegura}</strong> de{" "}
                    <strong className="text-[#0f172a]">{totalPaginas}</strong> ({tareasFiltradas.length}{" "}
                    tareas)
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={paginaSegura <= 1}
                      onClick={() => setPagina((p) => Math.max(1, p - 1))}
                      className="inline-flex min-h-[44px] items-center gap-1 rounded-lg border border-[#cbd5e1] bg-white px-3 text-[13px] font-semibold text-[#334155] hover:bg-[#f8fafc] disabled:opacity-40"
                    >
                      <ChevronLeft className="size-4" aria-hidden="true" />
                      <span>Anterior</span>
                    </button>
                    <button
                      type="button"
                      disabled={paginaSegura >= totalPaginas}
                      onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                      className="inline-flex min-h-[44px] items-center gap-1 rounded-lg border border-[#cbd5e1] bg-white px-3 text-[13px] font-semibold text-[#334155] hover:bg-[#f8fafc] disabled:opacity-40"
                    >
                      <span>Siguiente</span>
                      <ChevronRight className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ===================================================================== */}
      {/* VISTA 2: MATRIZ DE ASIGNACIÓN POR BROKER (TAREAS POR BROKER)          */}
      {/* ===================================================================== */}
      {modoVista === "brokers" && (
        <section
          aria-label="Matriz de tareas asignadas por Broker"
          className="space-y-4"
        >
          <div className="rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-[16px] font-bold text-[#0f172a]">
                  Carga y asignación por broker
                </h2>
                <p className="text-[13px] text-[#475569]">
                  Supervisa la cola individual de cada broker, asigna tareas puntuales, despliega Playbooks Inmobiliarios completos o ejecuta un relevo de cartera cuando un asesor esté de guardia o sobrecargado.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setModalPackBroker({
                    abierto: true,
                    brokerId: personas[0]?.id ?? null,
                    playbookId: PLAYBOOKS_INMOBILIARIOS[0]!.id,
                  })
                }
                className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#0f172a] px-4 text-[13px] font-bold text-white hover:bg-[#1e293b]"
              >
                <Sparkles className="size-4 text-[#fbbf24]" aria-hidden="true" />
                <span>Asignar plan a un broker</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {resumenPorBroker.map((col) => {
              const totalPend = col.pendientes.length;
              const pctCapacidad = Math.min(100, Math.round((totalPend / 10) * 100));
              const estadoCarga =
                totalPend >= 8 || col.vencidas >= 3
                  ? { texto: "Sobrecarga / Riesgo SLA", color: "bg-[#dc2626]", badge: "red" as const }
                  : totalPend >= 4
                    ? { texto: "Carga Activa", color: "bg-[#d97706]", badge: "gold" as const }
                    : { texto: "Capacidad Óptima", color: "bg-[#059669]", badge: "green" as const };

              return (
                <article
                  key={String(col.brokerId ?? "sin_asignar")}
                  className="flex min-w-0 flex-col justify-between rounded-xl border border-line bg-surface p-4"
                >
                  <div>
                    {/* Cabecera del Broker */}
                    <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar name={col.brokerName} />
                        <div className="min-w-0">
                          <h3 className="truncate text-[15px] font-bold text-[#0f172a]">
                            {col.brokerName}
                          </h3>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            <Badge tone={estadoCarga.badge}>{estadoCarga.texto}</Badge>
                            <span className="text-[13px] font-medium tabular-nums text-[#64748b]">
                              {col.completadas.length} completadas
                            </span>
                          </div>
                        </div>
                      </div>

                      {col.brokerId !== null && totalPend > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            setModalRelevoBroker({
                              abierto: true,
                              origenId: col.brokerId,
                              origenNombre: col.brokerName,
                            })
                          }
                          title={`Transferir o relevar tareas de ${col.brokerName} a otro broker`}
                          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-[#cbd5e1] bg-[#f8fafc] px-2.5 text-[13px] font-semibold text-[#334155] hover:bg-[#e2e8f0]"
                        >
                          <ArrowRightLeft className="size-4" aria-hidden="true" />
                          <span>Relevo</span>
                        </button>
                      )}
                    </header>

                    {/* Termómetro de Capacidad y Contadores SLA del Broker */}
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between text-[13px] font-semibold text-[#334155]">
                        <span>Ocupación de bandeja To-Do</span>
                        <span className="tabular-nums">{totalPend} pendientes</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-[#f1f5f9]">
                        <div
                          className={`h-full rounded-full transition-all ${estadoCarga.color}`}
                          style={{ width: `${Math.max(6, pctCapacidad)}%` }}
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                        <div className="rounded-lg border border-[#fecaca] bg-[#fef2f2]/60 px-2 py-1.5">
                          <div className="text-[13px] font-bold tabular-nums text-[#dc2626]">
                            {col.vencidas}
                          </div>
                          <div className="text-[13px] font-medium text-[#991b1b]">Vencidas</div>
                        </div>
                        <div className="rounded-lg border border-[#fde68a] bg-[#fffbeb]/60 px-2 py-1.5">
                          <div className="text-[13px] font-bold tabular-nums text-[#d97706]">
                            {col.paraHoy}
                          </div>
                          <div className="text-[13px] font-medium text-[#92400e]">Para Hoy</div>
                        </div>
                        <div className="rounded-lg border border-[#a7f3d0] bg-[#ecfdf5]/60 px-2 py-1.5">
                          <div className="text-[13px] font-bold tabular-nums text-[#059669]">
                            {col.proximas}
                          </div>
                          <div className="text-[13px] font-medium text-[#065f46]">Próximas</div>
                        </div>
                      </div>
                    </div>

                    {/* Lista de Tareas To-Do del Broker */}
                    <div className="mt-4 space-y-2">
                      <div className="text-[13px] font-bold tracking-wider text-[#64748b] uppercase">
                        Cola Asignada ({col.pendientes.length})
                      </div>

                      {col.pendientes.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-[#cbd5e1] bg-[#f8fafc] px-3 py-6 text-center text-[13px] text-[#64748b]">
                          Sin tareas activas asignadas a este broker.
                        </div>
                      ) : (
                        <ul className="max-h-[340px] space-y-2 overflow-y-auto pr-1">
                          {col.pendientes.map((t) => {
                            const esVenc = t.urgencia === "vencidas";
                            return (
                              <li
                                key={t.id}
                                className={`flex items-start justify-between gap-2 rounded-lg border p-2.5 ${
                                  esVenc
                                    ? "border-[#fecaca] bg-[#fef2f2]/40"
                                    : "border-[#e2e8f0] bg-[#f8fafc]"
                                }`}
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    {t.priority === "high" && (
                                      <Flame
                                        className="size-3.5 shrink-0 text-[#dc2626]"
                                        aria-hidden="true"
                                      />
                                    )}
                                    <span className="truncate text-[13px] font-bold text-[#0f172a]">
                                      {t.title}
                                    </span>
                                  </div>
                                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[13px] text-[#475569]">
                                    <span className="tabular-nums font-medium">
                                      {t.startsAt ? fechaSantoDomingo(t.startsAt) : "Sin fecha"}
                                    </span>
                                    {t.projectName && (
                                      <span className="rounded bg-[#eff6ff] px-1.5 py-0.5 text-[13px] font-medium text-[#1e40af]">
                                        {t.projectName}
                                      </span>
                                    )}
                                    {t.checklistTotal > 0 && (
                                      <span className="rounded bg-[#ecfdf5] px-1.5 py-0.5 text-[13px] font-semibold tabular-nums text-[#065f46]">
                                        To-Do {t.checklistCompletados}/{t.checklistTotal}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => setTareaEditando(t)}
                                    aria-label={`Editar ${t.title}`}
                                    className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-[#cbd5e1] bg-white text-[#334155] hover:bg-[#f1f5f9]"
                                  >
                                    <Pencil className="size-4" aria-hidden="true" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setTareaCompletando(t)}
                                    aria-label={`Completar ${t.title}`}
                                    className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-[#a7f3d0] bg-[#ecfdf5] text-[#059669] hover:bg-[#d1fae5]"
                                  >
                                    <Check className="size-4" aria-hidden="true" />
                                  </button>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  </div>

                  {/* Botones de Asignación Directa al Broker */}
                  <div className="mt-4 grid grid-cols-1 gap-2 border-t border-[#f1f5f9] pt-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => abrirNuevaTareaParaBroker(col.brokerId, null)}
                      className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border border-[#cbd5e1] bg-white px-3 text-[13px] font-bold text-[#0f172a] transition-colors hover:bg-[#f8fafc]"
                    >
                      <Plus className="size-4 text-[#059669]" aria-hidden="true" />
                      <span>Asignar Tarea</span>
                    </button>
                    {col.brokerId !== null && (
                      <button
                        type="button"
                        onClick={() =>
                          setModalPackBroker({
                            abierto: true,
                            brokerId: col.brokerId,
                            playbookId: PLAYBOOKS_INMOBILIARIOS[0]!.id,
                          })
                        }
                        className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border border-[#fde68a] bg-[#fffbeb] px-3 text-[13px] font-bold text-[#92400e] transition-colors hover:bg-[#fef3c7]"
                      >
                        <Sparkles className="size-4 text-[#d97706]" aria-hidden="true" />
                        <span>Asignar plan</span>
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* ===================================================================== */}
      {/* VISTA 3: TABLERO KANBAN OPERATIVO                                     */}
      {/* ===================================================================== */}
      {modoVista === "tablero" && (
        <TableroTareas
          grupos={gruposTablero}
          onCompletar={(id) => {
            const encontrada = tareasConUrgencia.find((t) => t.id === id);
            if (encontrada) setTareaCompletando(encontrada);
          }}
          onEditar={(id) => {
            const encontrada = tareasConUrgencia.find((t) => t.id === id);
            if (encontrada) setTareaEditando(encontrada);
          }}
        />
      )}

      {/* ===================================================================== */}
      {/* VISTA 4: CATÁLOGO DE PLAYBOOKS & PACKS INMOBILIARIOS               */}
      {/* ===================================================================== */}
      {modoVista === "playbooks" && (
        <section
          aria-label="Plantillas de trabajo inmobiliario"
          className="space-y-4"
        >
          <div className="rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-2xs">
            <h2 className="text-[16px] font-bold text-[#0f172a]">
              Plantillas de trabajo inmobiliario
            </h2>
            <p className="mt-1 text-[13px] text-[#475569]">
              Cada Playbook contempla el flujo completo de corretaje inmobiliario (KYC Ley 155-17, Reserva 48h, Promesa 10/40/50, Exención CONFOTUR Ley 158-01, Tour VIP, Inversor Diáspora, Snag List y Onboarding). Puedes asignarlo a un broker como una tarea con sub-checklist To-Do o desplegar la secuencia escalonada de múltiples tareas.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {PLAYBOOKS_INMOBILIARIOS.map((pb) => (
              <article
                key={pb.id}
                className="flex min-w-0 flex-col justify-between rounded-xl border border-line bg-surface p-4"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-[#fde68a] bg-[#fffbeb] px-2.5 py-1 text-[13px] font-bold text-[#92400e]">
                      <Sparkles className="size-3.5 text-[#d97706]" aria-hidden="true" />
                      <span>{pb.etiqueta}</span>
                    </span>
                    <span className="text-[13px] font-semibold text-[#64748b]">
                      {pb.categoriaRea} · SLA +{pb.slaDias}d
                    </span>
                  </div>

                  <h3 className="mt-2.5 text-[15px] font-bold text-[#0f172a]">{pb.titulo}</h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-[#475569]">{pb.resumen}</p>

                  <details className="mt-3 rounded-lg border border-line bg-surface-alt px-3">
                    <summary className="flex min-h-12 cursor-pointer items-center text-[13px] font-semibold text-ink">
                      Ver los {pb.pasosChecklist.length} pasos de la plantilla
                    </summary>
                    <ul className="space-y-1 pb-3 text-[13px] text-ink-muted">
                      {pb.pasosChecklist.map((paso, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2
                            className="mt-0.5 size-3.5 shrink-0 text-[#059669]"
                            aria-hidden="true"
                          />
                          <span>{paso}</span>
                        </li>
                      ))}
                    </ul>
                  </details>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#f1f5f9] pt-3.5">
                  <button
                    type="button"
                    onClick={() =>
                      abrirNuevaTareaParaBroker(
                        typeof filtroBroker === "number" ? filtroBroker : null,
                        pb.id,
                      )
                    }
                    className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#cbd5e1] bg-white px-3 text-[13px] font-bold text-[#0f172a] hover:bg-[#f8fafc]"
                  >
                    <Plus className="size-4 text-[#059669]" aria-hidden="true" />
                    <span>Crear tarea con pasos</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setModalPackBroker({
                        abierto: true,
                        brokerId:
                          typeof filtroBroker === "number"
                            ? filtroBroker
                            : actorId ?? personas[0]?.id ?? null,
                        playbookId: pb.id,
                      })
                    }
                    className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#0f172a] px-3 text-[13px] font-bold text-white hover:bg-[#1e293b]"
                  >
                    <Sparkles className="size-4 text-[#fbbf24]" aria-hidden="true" />
                    <span>Desplegar Secuencia ({pb.secuenciaMultiTarea.length} tareas)</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <Accordion type="multiple" className="rounded-xl border border-line bg-surface px-3 sm:px-4">
        <AccordionItem value="task-summary" className={muestraCargaEquipo && personas.length > 0 ? "" : "border-0"}>
          <AccordionTrigger className="text-sm">Resumen operativo <span className="ml-auto text-[13px] font-normal text-ink-muted">{conteos.totalPendientes} pendientes · {conteos.vencidas} vencidas</span></AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-5" role="group" aria-label="Filtrar por urgencia de tareas">
              <button type="button" aria-pressed={filtroEstado === "pending" && filtroUrgencia === "todas"} onClick={() => { setFiltroEstado("pending"); cambiarFiltroUrgencia("todas"); }} className="min-h-16 rounded-lg border border-line bg-surface-alt p-3 text-left text-sm hover:border-navy-900"><strong className="block text-lg tabular-nums text-navy-900">{conteos.totalPendientes}</strong>Pendientes <small className="block text-[13px] text-ink-muted">{conteos.altaPrioridad} de alta prioridad</small></button>
              <button type="button" aria-pressed={filtroUrgencia === "vencidas"} onClick={() => { setFiltroEstado("pending"); cambiarFiltroUrgencia(filtroUrgencia === "vencidas" ? "todas" : "vencidas"); }} className="min-h-16 rounded-lg border border-danger/30 bg-danger-bg p-3 text-left text-sm text-danger"><strong className="block text-lg tabular-nums">{conteos.vencidas}</strong>Vencidas</button>
              <button type="button" aria-pressed={filtroUrgencia === "hoy"} onClick={() => { setFiltroEstado("pending"); cambiarFiltroUrgencia(filtroUrgencia === "hoy" ? "todas" : "hoy"); }} className="min-h-16 rounded-lg border border-warning/30 bg-warning-bg p-3 text-left text-sm text-warning"><strong className="block text-lg tabular-nums">{conteos.hoy}</strong>Para hoy</button>
              <button type="button" aria-pressed={filtroUrgencia === "proximas"} onClick={() => { setFiltroEstado("pending"); cambiarFiltroUrgencia(filtroUrgencia === "proximas" ? "todas" : "proximas"); }} className="min-h-16 rounded-lg border border-line bg-surface-alt p-3 text-left text-sm text-ink"><strong className="block text-lg tabular-nums">{conteos.proximas}</strong>Próximas</button>
              <button type="button" aria-pressed={filtroEstado === "completed"} onClick={() => { setFiltroEstado(filtroEstado === "completed" ? "pending" : "completed"); setFiltroUrgencia("todas"); setPagina(1); }} className="min-h-16 rounded-lg border border-success/30 bg-success-bg p-3 text-left text-sm text-success"><strong className="block text-lg tabular-nums">{conteos.totalCompletadas}</strong>Completadas <small className="block text-[13px]">Con evidencia</small></button>
            </div>
          </AccordionContent>
        </AccordionItem>
        {muestraCargaEquipo && personas.length > 0 && <AccordionItem value="team-load" className="border-0"><AccordionTrigger className="text-sm">Carga y asignación por broker <span className="ml-auto font-normal text-ink-muted">{personas.length} asesores</span></AccordionTrigger><AccordionContent>
<section
          className="rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-2xs"
          aria-label="Asignación y filtro por Broker"
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-[#0f172a]" aria-hidden="true" />
              <h2 className="text-[14px] font-bold text-[#0f172a]">
                Carga y asignación por broker
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {filtroBroker !== "todos" && (
                <button
                  type="button"
                  onClick={() => cambiarFiltroBroker("todos")}
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-[#cbd5e1] bg-[#f8fafc] px-3 text-[13px] font-semibold text-[#334155] hover:bg-[#f1f5f9]"
                >
                  <RotateCcw className="size-3.5" aria-hidden="true" />
                  <span>Ver todos los brokers</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setModoVista(modoVista === "brokers" ? "lista" : "brokers")}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-[#cbd5e1] bg-white px-3 text-[13px] font-semibold text-[#0f172a] hover:bg-[#f8fafc]"
              >
                <UserCheck className="size-4 text-[#059669]" aria-hidden="true" />
                <span>{modoVista === "brokers" ? "Volver a la lista" : "Abrir vista de equipo"}</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => cambiarFiltroBroker("todos")}
              className={`inline-flex min-h-[44px] items-center gap-2 rounded-lg border px-3.5 py-2 text-[13px] font-semibold transition-all ${
                filtroBroker === "todos"
                  ? "border-[#0f172a] bg-[#0f172a] text-white shadow-xs"
                  : "border-[#e2e8f0] bg-[#f8fafc] text-[#334155] hover:border-[#cbd5e1]"
              }`}
            >
              <span>Equipo Completo</span>
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[13px] font-bold tabular-nums">
                {conteos.totalPendientes}
              </span>
            </button>

            {resumenPorBroker.map((b) => {
              const clave = b.brokerId ?? "sin_asignar";
              const activo = filtroBroker === clave;
              const sobrecargado = b.pendientes.length >= 8 || b.vencidas >= 3;
              return (
                <div
                  key={String(clave)}
                  className={`inline-flex min-h-[44px] items-center rounded-lg border transition-all ${
                    activo
                      ? "border-[#0f172a] bg-[#0f172a] text-white shadow-xs"
                      : sobrecargado
                        ? "border-[#fecaca] bg-[#fef2f2]/60 text-[#0f172a]"
                        : "border-[#e2e8f0] bg-white text-[#0f172a] hover:border-[#cbd5e1]"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => cambiarFiltroBroker(activo ? "todos" : clave)}
                    className="inline-flex min-h-[44px] items-center gap-2 px-3 py-1.5 text-left text-[13px] font-semibold"
                  >
                    <Avatar name={b.brokerName} small />
                    <span>{b.brokerName}</span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[13px] font-bold tabular-nums ${
                        activo
                          ? "bg-white text-[#0f172a]"
                          : b.vencidas > 0
                            ? "bg-[#fef2f2] text-[#b91c1c]"
                            : "bg-[#f1f5f9] text-[#334155]"
                      }`}
                    >
                      {b.pendientes.length}
                      {b.vencidas > 0 ? ` (${b.vencidas} venc.)` : ""}
                    </span>
                  </button>
                  {b.brokerId !== null && (
                    <button
                      type="button"
                      onClick={() => abrirNuevaTareaParaBroker(b.brokerId, null)}
                      title={`Asignar nueva tarea a ${b.brokerName}`}
                      aria-label={`Asignar nueva tarea a ${b.brokerName}`}
                      className={`inline-flex min-h-[44px] min-w-[40px] items-center justify-center border-l px-2.5 transition-colors ${
                        activo
                          ? "border-white/20 text-white hover:bg-white/10"
                          : "border-[#e2e8f0] text-[#059669] hover:bg-[#ecfdf5]"
                      }`}
                    >
                      <Plus className="size-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
        </AccordionContent></AccordionItem>}
      </Accordion>

      {/* Modal Crear / Editar Tarea con Checklist To-Do y Vínculo  */}
      {(modalNueva || tareaEditando) && (
        <ModalFormularioTarea
          key={
            tareaEditando
              ? `edit-${tareaEditando.id}`
              : `new-${brokerPreseleccionadoModal ?? "none"}-${playbookPreseleccionadoModal ?? "none"}`
          }
          tarea={tareaEditando}
          personas={personas}
          proyectos={proyectos}
          negocios={negocios}
          contactos={contactos}
          hoy={hoy}
          brokerInicialId={brokerPreseleccionadoModal}
          playbookInicialId={playbookPreseleccionadoModal}
          onClose={() => {
            setModalNueva(false);
            setTareaEditando(null);
            setBrokerPreseleccionadoModal(null);
            setPlaybookPreseleccionadoModal(null);
          }}
          onSaved={() => {
            setModalNueva(false);
            setTareaEditando(null);
            setBrokerPreseleccionadoModal(null);
            setPlaybookPreseleccionadoModal(null);
            router.refresh();
          }}
        />
      )}

      {/* Modal Desplegar Pack / Secuencia Operativa  a un Broker */}
      {modalPackBroker.abierto && (
        <ModalDesplegarPackBroker
          personas={personas}
          proyectos={proyectos}
          negocios={negocios}
          contactos={contactos}
          hoy={hoy}
          brokerInicialId={modalPackBroker.brokerId}
          playbookInicialId={modalPackBroker.playbookId}
          onClose={() => setModalPackBroker((prev) => ({ ...prev, abierto: false }))}
          onSaved={() => {
            setModalPackBroker((prev) => ({ ...prev, abierto: false }));
            router.refresh();
          }}
        />
      )}

      {/* Modal Relevo / Transferencia de Cola entre Brokers */}
      {modalRelevoBroker?.abierto && (
        <ModalRelevoColaBroker
          origenId={modalRelevoBroker.origenId}
          origenNombre={modalRelevoBroker.origenNombre}
          personas={personas}
          tareasPendientesBroker={tareasPendientes.filter(
            (t) => t.assigneeId === modalRelevoBroker.origenId,
          )}
          onClose={() => setModalRelevoBroker(null)}
          onSaved={() => {
            setModalRelevoBroker(null);
            router.refresh();
          }}
        />
      )}

      {/* Modal Completar Tarea con Resultado / Evidencia */}
      {tareaCompletando && (
        <ModalCompletarTarea
          key={`complete-${tareaCompletando.id}`}
          tarea={tareaCompletando}
          onClose={() => setTareaCompletando(null)}
          onCompleted={() => {
            setTareaCompletando(null);
            router.refresh();
          }}
        />
      )}

      {/* Modal Confirmar Eliminación */}
      {tareaEliminando && (
        <ModalEliminarTarea
          key={`delete-${tareaEliminando.id}`}
          tarea={tareaEliminando}
          onClose={() => setTareaEliminando(null)}
          onDeleted={() => {
            setTareaEliminando(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Modal Crear / Editar Tarea con Checklist To-Do Interactivo y Tríada     */
/* -------------------------------------------------------------------------- */

function ModalFormularioTarea({
  tarea,
  personas,
  proyectos,
  negocios,
  contactos,
  hoy,
  brokerInicialId,
  playbookInicialId,
  onClose,
  onSaved,
}: {
  tarea: TareaFila | null;
  personas: PersonaOpcion[];
  proyectos: ProyectoOpcion[];
  negocios: NegocioOpcion[];
  contactos: ContactoOpcion[];
  hoy: string;
  brokerInicialId?: number | null;
  playbookInicialId?: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const esEdicion = Boolean(tarea);
  const playbookInicial = PLAYBOOKS_INMOBILIARIOS.find((p) => p.id === playbookInicialId);
  const parsedInicial = parsearDescripcionChecklist(tarea?.description);

  const [title, setTitle] = useState(tarea?.title ?? playbookInicial?.titulo ?? "");
  const [notasLibres, setNotasLibres] = useState(
    tarea ? parsedInicial.notasLibres : playbookInicial?.resumen ?? "",
  );
  const [itemsChecklist, setItemsChecklist] = useState<Array<{ texto: string; completado: boolean }>>(
    tarea
      ? parsedInicial.items.map((i) => ({ texto: i.texto, completado: i.completado }))
      : playbookInicial
        ? playbookInicial.pasosChecklist.map((texto) => ({ texto, completado: false }))
        : [],
  );
  const [nuevoPasoTexto, setNuevoPasoTexto] = useState("");

  const [priority, setPriority] = useState(tarea?.priority ?? playbookInicial?.prioridad ?? "normal");
  const [fecha, setFecha] = useState(
    tarea?.startsAt
      ? fechaSantoDomingo(tarea.startsAt)
      : playbookInicial
        ? sumarDias(hoy, playbookInicial.slaDias)
        : hoy,
  );
  const [hora, setHora] = useState(tarea?.startsAt ? horaSantoDomingo(tarea.startsAt) : "09:00");
  const [location, setLocation] = useState(
    tarea?.location ?? playbookInicial?.ubicacionSugerida ?? "",
  );
  const [assigneeId, setAssigneeId] = useState<string>(
    tarea?.assigneeId != null
      ? String(tarea.assigneeId)
      : brokerInicialId != null
        ? String(brokerInicialId)
        : personas[0]?.id != null
          ? String(personas[0].id)
          : "",
  );

  // Vínculos  (Recurso: Proyecto, Negocio, Contacto)
  const [projectId, setProjectId] = useState<string>(
    tarea?.projectId != null ? String(tarea.projectId) : "",
  );
  const [dealId, setDealId] = useState<string>(tarea?.dealId != null ? String(tarea.dealId) : "");
  const [contactId, setContactId] = useState<string>(
    tarea?.contactId != null ? String(tarea.contactId) : "",
  );

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [erroresCampos, setErroresCampos] = useState<Record<string, string>>({});
  const bloqueoEnvio = useRef(false);

  function aplicarPlaybook(pb: PlaybookInmobiliario) {
    setTitle(pb.titulo);
    setPriority(pb.prioridad);
    setNotasLibres(pb.resumen);
    setLocation(pb.ubicacionSugerida);
    setFecha(sumarDias(hoy, pb.slaDias));
    setItemsChecklist(pb.pasosChecklist.map((texto) => ({ texto, completado: false })));
  }

  function agregarPasoChecklist() {
    const limpio = nuevoPasoTexto.trim();
    if (!limpio) return;
    setItemsChecklist((prev) => [...prev, { texto: limpio, completado: false }]);
    setNuevoPasoTexto("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (bloqueoEnvio.current) return;

    const startsAtIso = fecha
      ? new Date(`${fecha}T${hora || "09:00"}:00-04:00`).toISOString()
      : null;

    const errores = erroresActividad({
      title,
      day: fecha || undefined,
      time: fecha ? hora || "09:00" : undefined,
    });
    setErroresCampos(errores);
    if (Object.keys(errores).length > 0) {
      setError("Revisa los campos obligatorios antes de guardar.");
      return;
    }

    bloqueoEnvio.current = true;
    setEnviando(true);
    setError(null);

    const descripcionCombinada = serializarDescripcionChecklist(notasLibres, itemsChecklist);

    const payload = {
      activityType: "task",
      title: title.trim(),
      description: descripcionCombinada.trim() ? descripcionCombinada.trim() : null,
      priority,
      startsAt: startsAtIso,
      location: location.trim() ? location.trim() : null,
      assigneeId: assigneeId ? Number(assigneeId) : null,
      projectId: projectId ? Number(projectId) : null,
      dealId: dealId ? Number(dealId) : null,
      contactId: contactId ? Number(contactId) : null,
    };

    try {
      const res = await fetch(esEdicion ? `/api/actividades/${tarea!.id}` : "/api/actividades", {
        method: esEdicion ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        const msg = body?.error ?? `Error ${res.status} al guardar la tarea.`;
        setError(msg);
        toast.error(msg);
        return;
      }

      toast.success(esEdicion ? "Tarea actualizada con éxito" : "Tarea asignada con éxito");
      onSaved();
    } catch {
      const msg = "No se pudo conectar con el servidor.";
      setError(msg);
      toast.error(msg);
    } finally {
      bloqueoEnvio.current = false;
      setEnviando(false);
    }
  }

  return (
    <Modal
      onClose={onClose}
      title={esEdicion ? "Editar Tarea & Checklist To-Do" : "Nueva tarea"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <AlertaErrorFormulario mensaje={error} />}

        {/* Plantillas rápidas de Playbooks Inmobiliarios */}
        {!esEdicion && (
          <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3">
            <div className="mb-2 flex items-center gap-1.5 text-[13px] font-bold text-[#334155]">
              <Sparkles className="size-4 text-[#d97706]" aria-hidden="true" />
              <span>Cargar plantilla con lista de pasos:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PLAYBOOKS_INMOBILIARIOS.map((pb) => (
                <button
                  key={pb.id}
                  type="button"
                  onClick={() => aplicarPlaybook(pb)}
                  className="inline-flex min-h-[44px] items-center rounded-lg border border-[#cbd5e1] bg-white px-3 py-1.5 text-[13px] font-semibold text-[#334155] transition-colors hover:border-[#0f172a] hover:bg-[#f1f5f9] hover:text-[#0f172a]"
                >
                  {pb.etiqueta}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-[13px] font-bold text-[#0f172a]">
            Título de la tarea *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej. Recopilar KYC Ley 155-17 y validar voucher de reserva USD 5,000"
            className="min-h-[44px] w-full rounded-lg border border-[#cbd5e1] bg-white px-3.5 text-[14px] text-[#0f172a] focus:border-[#0f172a] focus:outline-none"
          />
          {erroresCampos.title && (
            <p className="mt-1 text-[13px] font-medium text-[#dc2626]">{erroresCampos.title}</p>
          )}
        </div>

        {/* Agente (Broker) + Prioridad */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-[13px] font-bold text-[#0f172a]">
              Broker responsable
            </label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="min-h-[44px] w-full rounded-lg border border-[#cbd5e1] bg-white px-3 text-[14px] font-semibold text-[#0f172a] focus:border-[#0f172a] focus:outline-none"
            >
              <option value="">Sin asignar (Cola abierta)</option>
              {personas.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {p.fullName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-bold text-[#0f172a]">
              Nivel de Prioridad
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="min-h-[44px] w-full rounded-lg border border-[#cbd5e1] bg-white px-3 text-[14px] font-semibold text-[#0f172a] focus:border-[#0f172a] focus:outline-none"
            >
              <option value="high">Alta Prioridad (Urgente)</option>
              <option value="normal">Prioridad Normal</option>
              <option value="low">Baja Prioridad</option>
            </select>
          </div>
        </div>

        {/* Vínculo  con Recursos Inmobiliarios (Proyecto / Negocio / Cliente) */}
        <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3.5 space-y-3">
          <div className="text-[13px] font-bold text-[#0f172a]">
            Vincular proyecto, negocio y cliente
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-[13px] font-semibold text-[#334155]">
                Proyecto
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="min-h-[44px] w-full rounded-lg border border-[#cbd5e1] bg-white px-2.5 text-[13px] text-[#0f172a]"
              >
                <option value="">Sin proyecto</option>
                {proyectos.map((p) => (
                  <option key={p.id} value={String(p.id)}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[13px] font-semibold text-[#334155]">
                Negocio / Expediente
              </label>
              <select
                value={dealId}
                onChange={(e) => {
                  const val = e.target.value;
                  setDealId(val);
                  if (val) {
                    const neg = negocios.find((d) => String(d.id) === val);
                    if (neg?.contactId && !contactId) {
                      setContactId(String(neg.contactId));
                    }
                  }
                }}
                className="min-h-[44px] w-full rounded-lg border border-[#cbd5e1] bg-white px-2.5 text-[13px] text-[#0f172a]"
              >
                <option value="">Sin negocio</option>
                {negocios.map((d) => (
                  <option key={d.id} value={String(d.id)}>
                    {d.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[13px] font-semibold text-[#334155]">
                Cliente / Inversor
              </label>
              <select
                value={contactId}
                onChange={(e) => setContactId(e.target.value)}
                className="min-h-[44px] w-full rounded-lg border border-[#cbd5e1] bg-white px-2.5 text-[13px] text-[#0f172a]"
              >
                <option value="">Sin contacto</option>
                {contactos.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.fullName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Fecha límite SLA, Hora y Ubicación */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-[13px] font-bold text-[#0f172a]">
              Fecha límite (SLA)
            </label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="min-h-[44px] w-full rounded-lg border border-[#cbd5e1] bg-white px-3 text-[14px] tabular-nums text-[#0f172a] focus:border-[#0f172a] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-bold text-[#0f172a]">
              Hora objetivo (RD)
            </label>
            <input
              type="time"
              value={hora}
              onChange={(e) => setHora(e.target.value)}
              className="min-h-[44px] w-full rounded-lg border border-[#cbd5e1] bg-white px-3 text-[14px] tabular-nums text-[#0f172a] focus:border-[#0f172a] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-bold text-[#0f172a]">
              Ubicación / Unidad
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ej. Unidad A-302 / Zoom"
              className="min-h-[44px] w-full rounded-lg border border-[#cbd5e1] bg-white px-3 text-[14px] text-[#0f172a] focus:border-[#0f172a] focus:outline-none"
            />
          </div>
        </div>

        {/* Constructor de Sub-Checklist To-Do */}
        <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-[13px] font-bold text-[#0f172a]">
              Sub-tareas del Checklist To-Do ({itemsChecklist.length} pasos)
            </label>
            {itemsChecklist.length > 0 && (
              <button
                type="button"
                onClick={() => setItemsChecklist([])}
                className="text-[13px] font-semibold text-[#dc2626] hover:underline"
              >
                Vaciar pasos
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={nuevoPasoTexto}
              onChange={(e) => setNuevoPasoTexto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  agregarPasoChecklist();
                }
              }}
              placeholder="Añadir paso verificable (ej. Validar copia de pasaporte)..."
              className="min-h-[44px] flex-1 rounded-lg border border-[#cbd5e1] bg-white px-3 text-[13px] text-[#0f172a]"
            />
            <button
              type="button"
              onClick={agregarPasoChecklist}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-[#cbd5e1] bg-white px-3.5 text-[13px] font-bold text-[#0f172a] hover:bg-[#f1f5f9]"
            >
              <Plus className="size-4 text-[#059669]" aria-hidden="true" />
              <span>Añadir</span>
            </button>
          </div>

          {itemsChecklist.length > 0 && (
            <ul className="max-h-[180px] space-y-1.5 overflow-y-auto pt-1">
              {itemsChecklist.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-center justify-between gap-2 rounded-lg border border-[#e2e8f0] bg-white px-3 py-1.5 text-[13px]"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setItemsChecklist((prev) =>
                        prev.map((it, i) => (i === idx ? { ...it, completado: !it.completado } : it)),
                      )
                    }
                    className="flex flex-1 items-center gap-2 text-left"
                  >
                    {item.completado ? (
                      <CheckSquare className="size-4 shrink-0 text-[#059669]" aria-hidden="true" />
                    ) : (
                      <Square className="size-4 shrink-0 text-[#64748b]" aria-hidden="true" />
                    )}
                    <span className={item.completado ? "line-through opacity-75" : ""}>
                      {item.texto}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setItemsChecklist((prev) => prev.filter((_, i) => i !== idx))
                    }
                    aria-label={`Quitar paso ${item.texto}`}
                    className="inline-flex size-8 items-center justify-center rounded text-[#64748b] hover:bg-[#fee2e2] hover:text-[#dc2626]"
                  >
                    <X className="size-3.5" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-[13px] font-bold text-[#0f172a]">
            Notas de contexto / instrucciones para el broker
          </label>
          <textarea
            rows={2}
            value={notasLibres}
            onChange={(e) => setNotasLibres(e.target.value)}
            placeholder="Contexto del comprador, acuerdos previos o instrucciones específicas..."
            className="w-full rounded-lg border border-[#cbd5e1] bg-white p-3 text-[14px] text-[#0f172a] focus:border-[#0f172a] focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-2.5 border-t border-[#e2e8f0] pt-4">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost min-h-[44px] px-4 text-[14px]"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={enviando}
            className="btn btn-primary min-h-[44px] px-5 text-[14px]"
          >
            {enviando
              ? "Guardando..."
              : esEdicion
                ? "Guardar Cambios"
                : "Asignar Tarea al Broker"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/* Modal Desplegar Pack / Plan de Acción Multi-Tarea a un Broker              */
/* -------------------------------------------------------------------------- */

function ModalDesplegarPackBroker({
  personas,
  proyectos,
  negocios,
  contactos,
  hoy,
  brokerInicialId,
  playbookInicialId,
  onClose,
  onSaved,
}: {
  personas: PersonaOpcion[];
  proyectos: ProyectoOpcion[];
  negocios: NegocioOpcion[];
  contactos: ContactoOpcion[];
  hoy: string;
  brokerInicialId: number | null;
  playbookInicialId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [playbookId, setPlaybookId] = useState(playbookInicialId);
  const [assigneeId, setAssigneeId] = useState<string>(
    brokerInicialId != null ? String(brokerInicialId) : personas[0]?.id ? String(personas[0].id) : "",
  );
  const [projectId, setProjectId] = useState<string>("");
  const [dealId, setDealId] = useState<string>("");
  const [contactId, setContactId] = useState<string>("");
  const [fechaBase, setFechaBase] = useState(hoy);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const enviandoPackRef = useRef(false);
  // Misma clave en los reintentos del mismo pack: el servidor no lo duplica.
  const claveLoteRef = useRef<string | null>(null);

  const playbook = useMemo(
    () => PLAYBOOKS_INMOBILIARIOS.find((p) => p.id === playbookId) ?? PLAYBOOKS_INMOBILIARIOS[0]!,
    [playbookId],
  );

  async function handleDesplegar(e: FormEvent) {
    e.preventDefault();
    if (enviandoPackRef.current) return;
    if (!assigneeId) {
      setError("Selecciona el broker que ejecutará este Plan de Acción.");
      return;
    }
    enviandoPackRef.current = true;
    setEnviando(true);
    setError(null);

    try {
      const actividades = playbook.secuenciaMultiTarea.map((etapa) => {
        const fechaTarea = sumarDias(fechaBase || hoy, etapa.offsetDias);
        const startsAtIso = new Date(`${fechaTarea}T09:30:00-04:00`).toISOString();
        const descripcion = serializarDescripcionChecklist(
          `Plan de trabajo: ${playbook.etiqueta} · ${playbook.resumen}`,
          etapa.pasos.map((texto) => ({ texto, completado: false })),
        );

        return {
            activityType: "task",
            title: etapa.titulo,
            description: descripcion,
            priority: etapa.prioridad,
            startsAt: startsAtIso,
            location: playbook.ubicacionSugerida,
            assigneeId: Number(assigneeId),
            projectId: projectId ? Number(projectId) : null,
            dealId: dealId ? Number(dealId) : null,
            contactId: contactId ? Number(contactId) : null,
        };
      });
      const res = await fetch("/api/actividades/lote", {
        method: "POST",
        headers: { "content-type": "application/json", "Idempotency-Key": (claveLoteRef.current ??= crypto.randomUUID()) },
        body: JSON.stringify({ actividades }),
      });
      const cuerpo = (await res.json().catch(() => ({}))) as { creadas?: number; error?: string };
      const creadas = res.ok ? (cuerpo.creadas ?? actividades.length) : 0;
      if (!res.ok) {
        setError(cuerpo.error ?? "No se pudo desplegar la secuencia de tareas. No se creó ninguna; puedes reintentar.");
        return;
      }
      claveLoteRef.current = null;
      if (creadas > 0) {
        const nombreBroker =
          personas.find((p) => String(p.id) === assigneeId)?.fullName ?? "el broker";
        toast.success(
          `Se asignaron ${creadas} tareas del pack "${playbook.etiqueta}" a ${nombreBroker}`,
        );
        onSaved();
      } else {
        setError("No se pudo desplegar la secuencia de tareas.");
      }
    } catch {
      setError("Error de conexión al desplegar el pack inmobiliario.");
    } finally {
      enviandoPackRef.current = false;
      setEnviando(false);
    }
  }

  return (
    <Modal
      onClose={onClose}
      title="Asignar plan de trabajo a un broker"
    >
      <form onSubmit={handleDesplegar} className="space-y-4">
        {error && <AlertaErrorFormulario mensaje={error} />}

        <div>
          <label className="mb-1.5 block text-[13px] font-bold text-[#0f172a]">
            1. Selecciona la plantilla de trabajo
          </label>
          <select
            value={playbookId}
            onChange={(e) => setPlaybookId(e.target.value)}
            className="min-h-[44px] w-full rounded-lg border border-[#cbd5e1] bg-white px-3 text-[14px] font-bold text-[#0f172a]"
          >
            {PLAYBOOKS_INMOBILIARIOS.map((pb) => (
              <option key={pb.id} value={pb.id}>
                {pb.etiqueta} — {pb.categoriaRea} ({pb.secuenciaMultiTarea.length} tareas)
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-[13px] font-bold text-[#0f172a]">
              2. Broker responsable *
            </label>
            <select
              required
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="min-h-[44px] w-full rounded-lg border border-[#cbd5e1] bg-white px-3 text-[14px] font-semibold text-[#0f172a]"
            >
              <option value="">Seleccionar broker...</option>
              {personas.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {p.fullName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-bold text-[#0f172a]">
              Fecha de inicio de la secuencia
            </label>
            <input
              type="date"
              value={fechaBase}
              onChange={(e) => setFechaBase(e.target.value)}
              className="min-h-[44px] w-full rounded-lg border border-[#cbd5e1] bg-white px-3 text-[14px] tabular-nums text-[#0f172a]"
            />
          </div>
        </div>

        {/* Recursos  */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-[13px] font-semibold text-[#334155]">
              Proyecto (Opcional)
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="min-h-[44px] w-full rounded-lg border border-[#cbd5e1] bg-white px-2.5 text-[13px] text-[#0f172a]"
            >
              <option value="">Sin proyecto</option>
              {proyectos.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[13px] font-semibold text-[#334155]">
              Negocio (Opcional)
            </label>
            <select
              value={dealId}
              onChange={(e) => setDealId(e.target.value)}
              className="min-h-[44px] w-full rounded-lg border border-[#cbd5e1] bg-white px-2.5 text-[13px] text-[#0f172a]"
            >
              <option value="">Sin negocio</option>
              {negocios.map((d) => (
                <option key={d.id} value={String(d.id)}>
                  {d.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[13px] font-semibold text-[#334155]">
              Cliente (Opcional)
            </label>
            <select
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
              className="min-h-[44px] w-full rounded-lg border border-[#cbd5e1] bg-white px-2.5 text-[13px] text-[#0f172a]"
            >
              <option value="">Sin contacto</option>
              {contactos.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.fullName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Vista previa de las tareas que se crearán */}
        <div className="rounded-xl border border-[#fde68a] bg-[#fffbeb]/70 p-3.5 space-y-2">
          <div className="text-[13px] font-bold text-[#92400e]">
            Secuencia escalonada que se asignará al broker ({playbook.secuenciaMultiTarea.length}{" "}
            tareas con sub-checklists):
          </div>
          <ol className="space-y-2">
            {playbook.secuenciaMultiTarea.map((etapa, i) => (
              <li
                key={i}
                className="rounded-lg border border-[#fde68a] bg-white px-3 py-2 text-[13px]"
              >
                <div className="flex items-center justify-between gap-2 font-bold text-[#0f172a]">
                  <span>{etapa.titulo}</span>
                  <span className="shrink-0 tabular-nums text-[#b45309]">
                    Día +{etapa.offsetDias} ({sumarDias(fechaBase || hoy, etapa.offsetDias)})
                  </span>
                </div>
                <div className="mt-1 text-[13px] text-[#475569]">
                  Incluye {etapa.pasos.length} sub-tareas verificables:{" "}
                  {etapa.pasos.join(" · ")}
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="flex items-center justify-end gap-2.5 border-t border-[#e2e8f0] pt-4">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost min-h-[44px] px-4 text-[14px]"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={enviando}
            className="btn btn-primary min-h-[44px] gap-2 px-5 text-[14px]"
          >
            <Sparkles className="size-4" aria-hidden="true" />
            <span>
              {enviando
                ? "Asignando Secuencia..."
                : `Asignar ${playbook.secuenciaMultiTarea.length} Tareas al Broker`}
            </span>
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/* Modal Relevo / Handover de Cola entre Brokers                              */
/* -------------------------------------------------------------------------- */

function ModalRelevoColaBroker({
  origenId,
  origenNombre,
  personas,
  tareasPendientesBroker,
  onClose,
  onSaved,
}: {
  origenId: number | null;
  origenNombre: string;
  personas: PersonaOpcion[];
  tareasPendientesBroker: Array<TareaFila & { urgencia: Urgencia }>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [destinoId, setDestinoId] = useState<string>("");
  const [alcanceRelevo, setAlcanceRelevo] = useState<"vencidas" | "todas">("vencidas");
  const [motivoRelevo, setMotivoRelevo] = useState("Balanceo de carga / Cobertura de guardia");
  const [enviando, setEnviando] = useState(false);
  const enviandoRelevoRef = useRef(false);

  const candidatos = personas.filter((p) => p.id !== origenId);
  const tareasATransferir = useMemo(
    () =>
      alcanceRelevo === "vencidas"
        ? tareasPendientesBroker.filter((t) => t.urgencia === "vencidas")
        : tareasPendientesBroker,
    [alcanceRelevo, tareasPendientesBroker],
  );

  async function handleTransferir(e: FormEvent) {
    e.preventDefault();
    if (enviandoRelevoRef.current || !destinoId || tareasATransferir.length === 0) return;
    enviandoRelevoRef.current = true;
    setEnviando(true);
    try {
      const destinoNombre =
        personas.find((p) => String(p.id) === destinoId)?.fullName ?? "nuevo broker";
      let transferidas = 0;
      for (const t of tareasATransferir) {
        const selloRelevo = `[RELEVO OPERATIVO · America/Santo_Domingo]: Transferida de ${origenNombre} a ${destinoNombre} (${motivoRelevo.trim() || "Reasignación"}).`;
        const nuevaDesc = t.description?.trim()
          ? `${t.description.trim()}\n\n${selloRelevo}`
          : selloRelevo;
        const res = await fetch(`/api/actividades/${t.id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            assigneeId: Number(destinoId),
            description: nuevaDesc,
          }),
        });
        if (res.ok) transferidas++;
      }
      toast.success(
        `Relevo completado: ${transferidas} tarea(s) transferidas de ${origenNombre} a ${destinoNombre}`,
      );
      onSaved();
    } catch {
      toast.error("No se pudo completar el relevo de tareas.");
    } finally {
      enviandoRelevoRef.current = false;
      setEnviando(false);
    }
  }

  return (
    <Modal
      onClose={onClose}
      title={`Relevo Operativo de Tareas · ${origenNombre}`}
    >
      <form onSubmit={handleTransferir} className="space-y-4">
        <p className="text-[14px] text-[#475569]">
          Transfiere las tareas pendientes de <strong>{origenNombre}</strong> a otro broker activo conservando íntegros los sub-checklists To-Do, vínculos operativos y huso horario America/Santo_Domingo.
        </p>

        <div>
          <label className="mb-1.5 block text-[13px] font-bold text-[#0f172a]">
            ¿Qué tareas deseas relevar?
          </label>
          <select
            value={alcanceRelevo}
            onChange={(e) => setAlcanceRelevo(e.target.value as "vencidas" | "todas")}
            className="min-h-[44px] w-full rounded-lg border border-[#cbd5e1] bg-white px-3 text-[14px] font-semibold text-[#0f172a]"
          >
            <option value="vencidas">
              Solo tareas vencidas ({tareasPendientesBroker.filter((t) => t.urgencia === "vencidas").length})
            </option>
            <option value="todas">
              Toda la cola pendiente del broker ({tareasPendientesBroker.length})
            </option>
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-[13px] font-bold text-[#0f172a]">
            Broker receptor del relevo *
          </label>
          <select
            required
            value={destinoId}
            onChange={(e) => setDestinoId(e.target.value)}
            className="min-h-[44px] w-full rounded-lg border border-[#cbd5e1] bg-white px-3 text-[14px] font-semibold text-[#0f172a]"
          >
            <option value="">Seleccionar broker receptor...</option>
            {candidatos.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.fullName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-[13px] font-bold text-[#0f172a]">
            Motivo de relevo (queda registrado en la bitácora de cada tarea)
          </label>
          <input
            type="text"
            value={motivoRelevo}
            onChange={(e) => setMotivoRelevo(e.target.value)}
            className="min-h-[44px] w-full rounded-lg border border-[#cbd5e1] bg-white px-3 text-[14px] text-[#0f172a]"
          />
        </div>

        <div className="flex items-center justify-end gap-2.5 border-t border-[#e2e8f0] pt-4">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost min-h-[44px] px-4 text-[14px]"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={enviando || !destinoId || tareasATransferir.length === 0}
            className="btn btn-primary min-h-[44px] gap-2 px-5 text-[14px]"
          >
            <ArrowRightLeft className="size-4" aria-hidden="true" />
            <span>
              {enviando
                ? "Transfiriendo..."
                : `Transferir ${tareasATransferir.length} Tarea(s)`}
            </span>
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/* Modal Completar Tarea con Resultado / Evidencia (H31)                      */
/* -------------------------------------------------------------------------- */

function ModalCompletarTarea({
  tarea,
  onClose,
  onCompleted,
}: {
  tarea: TareaFila;
  onClose: () => void;
  onCompleted: () => void;
}) {
  const [resultado, setResultado] = useState(tarea.description ?? "");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bloqueoEnvio = useRef(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (bloqueoEnvio.current) return;

    const texto = resultado.trim();
    if (!texto) {
      setError("Registra una nota de resultado o evidencia antes de marcar la tarea como completada.");
      return;
    }

    bloqueoEnvio.current = true;
    setEnviando(true);
    setError(null);

    try {
      const res = await fetch(`/api/actividades/${tarea.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          status: "completed",
          description: texto,
        }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        const msg = body?.error ?? `Error ${res.status} al completar la tarea.`;
        setError(msg);
        toast.error(msg);
        return;
      }

      toast.success("Tarea completada con evidencia registrada");
      onCompleted();
    } catch {
      const msg = "No se pudo conectar con el servidor.";
      setError(msg);
      toast.error(msg);
    } finally {
      bloqueoEnvio.current = false;
      setEnviando(false);
    }
  }

  return (
    <Modal onClose={onClose} title="Completar Tarea y Registrar Evidencia">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-3">
          <div className="text-[13px] font-semibold tracking-wider text-[#64748b] uppercase">
            Tarea a cerrar
          </div>
          <div className="mt-0.5 text-[14px] font-bold text-[#0f172a]">{tarea.title}</div>
        </div>

        {error && <AlertaErrorFormulario mensaje={error} />}

        <div>
          <label className="mb-1.5 block text-[13px] font-bold text-[#0f172a]">
            Resultado / Evidencia de ejecución *
          </label>
          <textarea
            rows={4}
            required
            value={resultado}
            onChange={(e) => setResultado(e.target.value)}
            placeholder="Describe qué se logró, número de recibo, acuerdo con el comprador o enlace al documento validado..."
            className="w-full rounded-lg border border-[#cbd5e1] bg-white p-3 text-[14px] text-[#0f172a] focus:border-[#0f172a] focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-2.5 border-t border-[#e2e8f0] pt-4">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost min-h-[44px] px-4 text-[14px]"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={enviando}
            className="btn btn-primary min-h-[44px] gap-2 px-5 text-[14px]"
          >
            <CheckCircle2 className="size-4" aria-hidden="true" />
            <span>{enviando ? "Completando..." : "Confirmar y Completar"}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/* Modal Eliminar Tarea                                                       */
/* -------------------------------------------------------------------------- */

function ModalEliminarTarea({
  tarea,
  onClose,
  onDeleted,
}: {
  tarea: TareaFila;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [eliminando, setEliminando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmar() {
    setEliminando(true);
    setError(null);
    try {
      const res = await fetch(`/api/actividades/${tarea.id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? `Error ${res.status} al eliminar la tarea.`);
        return;
      }
      toast.success("Tarea eliminada");
      onDeleted();
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setEliminando(false);
    }
  }

  return (
    <Modal onClose={onClose} title="Eliminar Tarea">
      <div className="space-y-4">
        <p className="text-[14px] text-[#334155]">
          ¿Seguro que deseas eliminar la tarea <strong>{tarea.title}</strong>? Esta acción la enviará a la papelera auditada.
        </p>

        {error && <AlertaErrorFormulario mensaje={error} />}

        <div className="flex items-center justify-end gap-2.5 border-t border-[#e2e8f0] pt-4">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost min-h-[44px] px-4 text-[14px]"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={eliminando}
            onClick={() => void confirmar()}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#dc2626] px-4 text-[14px] font-bold text-white hover:bg-[#b91c1c] disabled:opacity-50"
          >
            <Trash2 className="size-4" aria-hidden="true" />
            <span>{eliminando ? "Eliminando..." : "Eliminar Tarea"}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
