# D21 · Investigación y Benchmarking Competitivo: CRM Inmobiliarios de Clase Mundial

**Expediente D21 (Investigación y Decisión Construir / Comprar / Integrar) – Viltrum Agentic OS**  
**Vertical:** Real Estate Turístico, Pre-construcción y Lujo (República Dominicana: Punta Cana, Bávaro, Cap Cana, Las Terrenas, Santo Domingo)  
**Sistemas Evaluados:** Follow Up Boss (FUB), kvCORE (BoldTrail / Inside Real Estate), HubSpot Real Estate, Sierra Interactive, Lofty (anteriormente Chime).  
**Revisor Independiente:** D01 Arquitectura  
**Estado:** Aprobado y Sincronizado

---

## 1. Resumen Ejecutivo y Mapa de Entorno Competitivo

El mercado inmobiliario turístico y de lujo en el Caribe (liderado por República Dominicana) opera bajo una dinámica radicalmente diferente a la del corretaje tradicional estadounidense o europeo:
1. **Ausencia de MLS centralizado:** Los brokers transaccionan sobre inventario de desarrolladores (proyectos en pozo / pre-construcción / off-plan) con listas de precios dinámicas en USD, contratos privados de separación/promesa y co-broking directo entre agencias.
2. **Canal de comunicación casi 100% WhatsApp/Telegram:** El comprador internacional (diáspora dominicana en EE.UU./Europa, norteamericanos, canadienses, latinoamericanos) y los agentes en campo rara vez responden correos en tiempo real o SMS tradicionales. Las notas de voz y los PDFs enviados por mensajería instantánea dominan el cierre.
3. **Complejidad fiscal y legal caribeña:** El régimen de incentivo turístico (**Ley 158-01 / CONFOTUR** con exención del 3% de impuesto de transferencia y 1% anual de IPI por 10-15 años), la normativa antilavado (**Ley 155-17** de la UAF/DGII), y los esquemas de pago diferidos por hitos de obra (10% reserva, 40% construcción, 50% entrega) definen la viabilidad de la venta.

### Resumen de Posicionamiento de los 5 Titanes del Mercado:

| CRM | Enfoque / Filosofía Core | Fortaleza Principal | Debilidad Crítica en Real Estate Turístico / RD |
| :--- | :--- | :--- | :--- |
| **Follow Up Boss (FUB)** | Hub de velocidad de prospección y colaboración en equipo. "Best-of-Breed". | Smart Lists dinámicas, velocidad extrema de interfaz, dialer y routing de leads en <60s. | No tiene inventario de unidades/pre-construcción ni WhatsApp nativo; gestión de deals y comisiones muy básica (requiere Trackxi/Brokermint). |
| **kvCORE (BoldTrail)** | Ecosistema masivo all-in-one para franquicias y grandes corretajes. | Automatización de marketing conductual y módulo BackOffice (Brokermint) robusto. | UI pesada, caótica y anticuada; pensada exclusivamente para MLS de EE.UU. (RETS/IDX); app móvil deficiente para campo. |
| **HubSpot Real Estate** | Plataforma CRM corporativa adaptable con motor de workflows líder. | Timeline 360° inigualable, validación de etapas en deals, automatización omnicanal y reporting. | Costo prohibitivo a escala; no tiene semántica inmobiliaria nativa (unidades, desarrolladores, planos, splits); requiere desarrollo custom intensivo. |
| **Sierra Interactive** | Motor de conversión lead-gen, SEO e IDX para equipos de alto volumen. | Búsqueda conductual (IntelliSearch), tracking preciso de actividad en web y PPC. | Pipeline de deals rígido; sin adaptación para inventario fuera de MLS; nula integración nativa con mensajería instantánea latinoamericana. |
| **Lofty (ex-Chime)** | Suite moderna impulsada por IA ("Agentic AI") con marketing multicanal integrado. | Asistente de IA autónomo para prospección, app móvil moderna, interfaz limpia. | Foco exclusivo en contratos residenciales estadounidenses (NAR/MLS); no maneja comisiones por hitos de obra ni exenciones fiscales internacionales. |

---

## 2. Arquitectura de Información y Diseño de Dashboard Adaptativo

El error más común de los CRM genéricos es ofrecer un dashboard único para todos con widgets que cambian de tamaño según el usuario. En el sector inmobiliario turístico de lujo, la asimetría operativa exige tres arquitecturas de información especializadas:

### A. Vista Director General / Broker Propietario (Executive & Cash Flow Focus)
- **Pipeline Total Ponderado (USD):** Volumen de transacciones en curso multiplicado por la probabilidad de cierre según etapa (ej. $12.4M USD brutos = $4.8M USD ponderados).
- **Cash Flow de Comisiones Proyectado a 30/60/90 días:** Desglose del Gross Commission Income (GCI) programado según los cronogramas de pago reportados por los desarrolladores.
- **Cuentas por Cobrar a Constructoras (Overdue Developer Receivables):** Alerta roja con comisiones pendientes de liquidación por promotores que superan los 45 días pos-depósito del comprador.
- **Net Brokerage Margin (% y USD):** Margen neto de la agencia tras deducir splits de captación, cierre, referidos y retenciones DGII.
- **Matriz de Absorción por Desarrollador / Proyecto:** Gráfico de calor que muestra volumen de reservas y promesas firmadas por proyecto.

### B. Vista Broker / Asesor Inmobiliario (Field, Pipeline & Speed-to-Lead)
- **SLA de Primer Toque Personal (< 5 min):** Tiempo medio de respuesta a nuevas solicitudes entrantes.
- **Unidades Reservadas Activas (Active Unit Locks):** Conteo de unidades apartadas con temporizador regresivo de expiración (bloqueo de 48-72h).
- **Proyección de Ingresos Personales (Agent Net Payout):** Comisión acumulada propia lista para cobro en el mes en curso.
- **Smart Lists de Acción Inmediata (Estilo Follow Up Boss):**
  - *Calientes Hoy:* Leads que volvieron a entrar a la web en las últimas 4h, revisaron el video de un proyecto o abrieron el dossier PDF.
  - *Bloqueos por Vencer:* Compradores con unidad bloqueada sin comprobante de transferencia bancaria antes de las 18:00.
  - *Seguimiento Promesa:* Compradores con borrador de promesa enviado hace >3 días sin firma.
- **Agenda Multizona Horaria:** Hora local de Punta Cana (GMT-4) junto a la hora del comprador (Madrid GMT+2 o Toronto GMT-4).

### C. Vista Asistente / Transaction Coordinator (Compliance, Dossiers & Expedientes)
- **Expedientes Incompletos para Promesa:** Cantidad de deals atascados por falta de documentos KYC/AML.
- **Validaciones de Pago Pendientes (Wire Pending Verification):** Transferencias internacionales (SWIFT/ACH) recibidas por la fiduciaria pendientes de conciliar con el banco.
- **Dossiers Confotur en Tramitación:** Solicitudes de compradores pendientes de constancia de exención emitida por el Ministerio de Hacienda / DGII.

---

## 3. Pipeline y Kanban de Deals: Micro-Interacciones y Validaciones de Etapa

### Micro-interacciones Críticas en la Tarjeta:
1. **WhatsApp / Telegram One-Click sin apertura de modal:** Pulsar el ícono de WhatsApp/Telegram abre la conversación instantáneamente con deep linking (`t.me/...` o `wa.me/...`), inyectando automáticamente una plantilla contextual basada en la etapa.
2. **Inline Edit de Datos Financieros:** Ajuste directo de precio final, descuento autorizado o porcentaje de comisión con doble clic directo sobre la tarjeta.
3. **Indicador de Riesgo por Inactividad (Stale Deal Indicator):** Cambio progresivo de borde (Verde < 48h, Ámbar 48-96h, Rojo intermitente > 96h sin interacción en el timeline).
4. **Preview Hover con Quick View:** Ventana flotante con plano arquitectónico, metraje cuadrado, fecha de entrega y saldo pendiente de cobro de comisión.

### Validaciones de Etapa Obligatorias (Stage Gates):
- **Paso a "Unidad Bloqueada":** Requiere vincular obligatoriamente una unidad física del inventario de proyectos y establecer fecha/hora límite de expiración. La unidad pasa automáticamente a estado `BLOQUEADA` en el portal web público.
- **Paso a "Promesa de Compraventa":** Requiere:
  - Adjuntar comprobante de pago bancario de la reserva verificado por administración.
  - Documento de identidad legible (Pasaporte si es extranjero, Cédula si es dominicano).
  - Formulario KYC y Declaración Jurada de Origen de Fondos (cumplimiento Ley 155-17 contra el lavado de activos).
- **Paso a "Cierre / Escrituración":** Requiere número de expediente de transferencia inmobiliaria ante la DGII, confirmación de aplicación de beneficio Confotur (código de resolución ministerial) y recepción del 100% de los honorarios pactados.

---

## 4. Ficha de Lead / Contacto 360°
1. **Timeline Unificado Multicanal (Omnichannel Single Stream):** Feed cronológico consolidado: mensajes de Telegram/WhatsApp, llamadas registradas, eventos de navegación en el portal web (proyectos vistos, videos abiertos, dossiers descargados).
2. **Notas de Voz Nativas con Transcripción e Inferencia por IA:**
   - Reproductor integrado con aceleración de audio (1.0x, 1.5x, 2.0x) y forma de onda interactiva.
   - Transcripción instantánea multilingüe (español, inglés, francés, ruso) con Whisper.
   - Extracción estructurada de datos por IA con confirmación HITL (propuesta automática de zona, presupuesto y requisitos).
3. **Matriz Dinámica de Requerimientos Inmobiliarios (Matching Engine):**
   - Zonas Geográficas (Cap Cana Marina, Bávaro, Piantini, Las Terrenas).
   - Presupuesto en USD con cálculo de inicial 20% y cuotas mensuales.
   - Requerimiento Confotur: `Obligatorio` | `Deseable` | `Indiferente`.
   - Propósito de Compra: Renta Corta (Airbnb), Segunda Residencia, Retiro o Plusvalía.

---

## 5. Motor de Comisiones e Incentivos y Cumplimiento DGII
1. **Deducciones Previas (Off-The-Top):** Fondo de comercialización o marketing cooperativo (ej. 5%) antes del cálculo de splits.
2. **Reparto Captación vs Cierre:** 50/50 o 40/60 de la comisión neta.
3. **Liquidación por Tramos de Obra (Milestones):**
   - Hito 1: 50% a la firma de la promesa y pago del inicial.
   - Hito 2: 25% al avance de estructura (vaciado de losa).
   - Hito 3: 25% a la entrega de llaves y saldo final.
4. **Retenciones Fiscales DGII:**
   - Persona Física: Comprobante B11, retención 10% ISR y 100% ITBIS.
   - Persona Jurídica (SRL): Comprobante B01, 0% retención ISR, 30% retención ITBIS.
   - Broker No Residente: Invoice exterior, 27% de retención por remesa al exterior (Código Tributario Art. 305).
   - Conversión automática a DOP para formatos 606/607 según tasa del Banco Central de la República Dominicana.

---

## 6. Rendimiento y UX Móvil (Thumb Zone)
- **Largest Contentful Paint (LCP):** ≤ 1.2s local / ≤ 1.8s móvil.
- **Interaction to Next Paint (INP):** ≤ 80ms.
- **Cumulative Layout Shift (CLS):** 0.00.
- **Ergonomía del Pulgar:** Área táctil mínima de 48x48 dp, Bottom Sheets inferiores en vez de modales centrados para pantallas < 768px, y gestos swipe en listas de leads (swipe derecha = WhatsApp/Telegram, swipe izquierda = cambio de etapa).
