import type { PlaybookInmobiliario } from "./tipos";

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
