# D21 + D01 · Catálogo de referencia de un CRM inmobiliario completo y capa contable/fiscal de RD

**Fecha:** 2026-10-14 (America/Santo_Domingo)
**Perfiles:** D21 (investigación) y D01 (requisitos)
**Estado:** expediente de investigación. No aprueba alcance, no cambia C1, no instala ni descarga nada. Es insumo para D02 (alcance) y D03 (arquitectura).
**Lee antes (para no repetir):** `.viltrum/research/D02-alcance-funcional-integral-2026-10-04.md`, `D21-catalogo-funcional-vre-2026-10-04.csv` (135 claves), `D21-cobertura-oss-brechas-2026-10-04.csv` (32 brechas), `D21-cobertura-transversal-vre-2026-10-04.csv`, `.viltrum/vre-os/MAPA-SISTEMAS-OSS.md`, `.viltrum/vre-os/D21-cobertura-modulos.md` y la evaluación previa de ERP en `E:/VILTRUM/VILTRUM ERP CRM/research/01-candidatos-open-source.md`.

---

## 0. Resumen ejecutivo

1. **Catálogo (Parte A):** se listan **126 capacidades** de referencia en 21 dominios. Del total, el catálogo previo (135 claves + 32 brechas) cubre bien captación, agenda, reportes base, academia, comunicaciones y portal; **deja sin cubrir** casi todo el **ciclo posterior a la reserva** (contrato → cronograma de cobros → mora → comisión devengada → entrega → escrituración) y casi todo el **cumplimiento PLAFT** (Ley 155-17). Son 10 las capacidades ESENCIALES más importantes que faltan (sección A.3).
2. **Fiscal (Parte B.1):** a 2026-10-14 faltan **17 días** para el 1-nov-2026, fecha en que **Grandes Locales y Medianos** solo pueden emitir e-CF (series B válidas hasta el 31-oct-2026), y **32 días** para el 15-nov-2026, límite de la prórroga automática de **Pequeños, Micro y No clasificados**. La categoría de Quisqueya Home (RNC) **no está en el repositorio**; es la primera pregunta abierta.
3. **Venta de inmuebles (B.2):** según una consulta técnica de la DGII (ago-2024) la venta de inmuebles **no está sujeta** a ITBIS (no es hecho generador), lo cual es distinto de "exenta". Los servicios solo están exentos si los lista el art. 344 del Código Tributario, por lo que el **corretaje (servicio) queda gravado al 18 %** salvo criterio contrario (inferencia sólida, no hay norma específica de corretaje; confirmar con contador).
4. **Contabilidad (B.3 y B.4):** única opción OSS de partida doble con REST nativo, licencia leída y sin restricción comercial para uso propio: **ERPNext (GPLv3)**. No existe localización dominicana con e-CF para ERPNext (solo una app NCF/reportes de 3 estrellas). Odoo Community (LGPLv3) trae plan de cuentas `l10n_do`, pero el módulo e-CF oficial (`l10n_do_edi`, vía Infile) **no está en el repo comunitario** y los NCF requieren terceros. Akaunting (BSL 1.1) e Invoice Ninja (Elastic 2.0) **no son libres para este uso**. **Recomendación:** separar tres roles (ver B.4): (a) CRM = subauxiliar comercial; (b) **emisor e-CF = proveedor certificado con API (corto plazo) o FacturacionV3 una vez certificada (mediano)**; (c) **ERPNext = libro mayor, solo si el contador lo acepta**, alimentado por API.

---

## 1. Método y límites

- Búsqueda web (WebSearch/WebFetch) y lectura de archivos locales. Licencias **leídas del archivo LICENSE** de cada repositorio, no del campo de la API.
- **Fuentes oficiales dgii.gov.do** cuando fue posible. Algunas páginas devolvieron 401 o PDF binario; los PDF se leyeron con `pdftotext` sobre la copia que la herramienta guardó (no se descargó ni instaló nada adicional).
- Lo marcado **(sec.)** proviene de fuentes secundarias (blogs contables, prensa, consultoras) y **debe confirmarse** antes de decidir. Lo marcado **NO VERIFICADO** no se pudo comprobar.
- Las capacidades de productos comerciales provienen de sus páginas de marketing o de consultoras; son **evidencia de que la función existe como oferta**, no de calidad ni de disponibilidad en el plan de Quisqueya.
- No hay datos del RNC, tamaño de contribuyente, estructura societaria (SPV por proyecto, fiduciarias) ni del contador externo de Quisqueya Home. Eso condiciona la Parte B.

---

# PARTE A · Catálogo funcional de referencia

## A.1 Qué ofrece cada referente (resumen verificado)

| Producto | Fortalezas relevantes para Quisqueya | Fuente |
|---|---|---|
| **Sell.Do** (desarrolladoras, India) | Inventario proyecto/torre/configuración/unidad; "cost sheets" y planes de pago desde plantillas; bloqueo de unidad de 15 min mientras el cliente paga; cobro de booking en línea; cartas de demanda ("demand letters") ligadas a hitos de construcción; recibos con aprobación y libro financiero; ciclo de vida de reserva (reservado, acuerdo, registro, posesión) con co-solicitantes; portal de canal (CP) con registro autoservicio, KYC, e-firma de contrato, reglas de titularidad de lead (ventana de atribución y primera etiqueta verificada), acceso controlado a inventario, calculadora de incentivos, comisión por tramos con retención y estados de cuenta | https://sell.do/real-estate-crm/e-commerce-integration · https://www.sell.do/real-estate-crm/customer-management · https://www.sell.do/real-estate-crm/channel-partner-management |
| **LeadSquared Real Estate** | Captura omnicanal, distribución automática de leads, segmentación (tipo de propiedad, financiamiento, crédito hipotecario), autorresponders Email/WhatsApp/SMS, programación de visitas, inventario, app móvil. Reservas de unidad, hitos de pago y canal: **NO VERIFICADO** en lo leído | https://www.leadsquared.com/real-estate-crm/ |
| **Follow Up Boss** | Lead flow: reglas por fuente/geografía/tipo, round-robin y "first to claim" con agente de respaldo si nadie reclama, "ponds" (pool de leads sin dueño), action plans (secuencias con SMS/email/tareas/cambio de etapa), smart lists, 200+ fuentes de leads, registro automático de llamadas | https://help.followupboss.com/hc/en-us/articles/360014656193 · https://help.followupboss.com/hc/en-us/articles/9961386591895 |
| **Propertybase (Lone Wolf)** | CRM sobre Salesforce para agencias de reventa: leads, listados, transacciones y comisiones. **No se encontró** módulo de desarrollo/preventa (reserva, liberación por fase) | https://propertybase.lwolf.com/ · https://www.softwareadvice.com/crm/propertybase-profile/ |
| **Salesforce (vía consultoras)** | Para desarrolladoras: disponibilidad en vivo, planes de pago, formularios de reserva, portal de brokers (alta, registro de leads, comisiones) y portal del cliente (estado, pagos, visitas, documentos). Es construcción a medida de partners, no producto estándar | https://www.netsmartz.com/industry/construction-real-estate/salesforce-for-construction-real-estate/ · https://ceptes.com/salesforce-realestate/ |
| **Zoho CRM / Creator / Bigin** | CRM base con visitas, listados y documentos; inventario, canal y comisiones se construyen en Creator/Books/Sign (arquitectura de partners) | https://zoho.com/realestate · https://www.crmoz.com/zoho-for-real-estate |
| **kvCORE / BoldTrail** | Orientado a agencia: CRM con nurturing conductual, sitios IDX, captura, marketing autopilot, gestión de transacciones y comisiones (heredado de Brokermint), reclutamiento y retención de agentes | https://boldtrail.com/blog/kvcore-vs-boldtrail/ |
| **Odoo Real Estate** | App Properties, contratos de renta con factura recurrente, vista Gantt de disponibilidad; módulos de terceros añaden comisiones y mantenimiento | https://odoo.com/industries/real-estate · https://apps.odoo.com/apps/modules/19.0/leapai_property_management |
| **EspoCRM Real Estate (extensión, AGPLv3)** | Entidades Properties y Requests con "matching" bidireccional (qué propiedades encajan con una solicitud), crear Oportunidad al interesarse, ocultar propiedades descartadas. No se encontró gestión de visitas ni de propietarios | https://www.espocrm.com/extensions/real-estate/ · https://forum.espocrm.com/forum/extensions/9055-real-estate |
| **Twenty** | CRM genérico (personas, empresas, oportunidades, tareas, notas, flujos, calendario, mensajes) sin objetos inmobiliarios; se extiende con objetos propios. Estado y licencia ya documentados en el repo | `.viltrum/vre-os/MAPA-SISTEMAS-OSS.md` |

Conclusión del benchmark: **ningún producto único cubre el negocio de Quisqueya**. Sell.Do es el que más se parece (desarrolladora + canal), pero está pensado para India (RERA, TDS, GST). Las agencias de reventa (FUB, kvCORE, Propertybase) aportan la disciplina de distribución y nurturing, no la preventa. Esto confirma el principio P0 del proyecto: componer, no clonar un producto.

## A.2 Catálogo por dominio

**Leyenda de prioridad (para Quisqueya):** ESENCIAL = sin esto no se puede vender, cobrar, pagar comisión o cumplir la ley; IMPORTANTE = mejora materialmente la operación o reduce riesgo; DESEABLE = diferenciador o escala.
**Leyenda de cobertura previa:** CUBIERTA (clave del catálogo D21 de 135) · BRECHA (en las 32 brechas, no aprobada) · PARCIAL (la clave existe pero no cubre todo el alcance descrito) · **NUEVA** (no estaba en ninguno).

### A1. Captación y leads
| ID | Capacidad | Prio | Cobertura previa | Referente |
|---|---|---|---|---|
| A1.1 | Captura multicanal con identidad (web, Meta/Google lead ads, WhatsApp, voz, portal, broker) | ESENCIAL | CUBIERTA `lead.capture_external`, `portal.capture`, `voice.*` | FUB, LeadSquared |
| A1.2 | Reglas de distribución: round-robin, "first to claim" con agente de respaldo y plazo, por fuente/proyecto/idioma/país | ESENCIAL | PARCIAL (`lead.assign` es manual) | FUB |
| A1.3 | Pool de leads sin dueño (pond) y reasignación automática por incumplir SLA de primer contacto | IMPORTANTE | **NUEVA** | FUB |
| A1.4 | Atribución de origen, campaña y UTM por lead | ESENCIAL | BRECHA `portal.lead_source_attribution` | BoldTrail, Sell.Do |
| A1.5 | **Titularidad de lead de broker externo**: registro del lead, ventana de atribución, resolución de conflicto con evidencia | ESENCIAL | **NUEVA** (`brokerportal.lead` solo sube el lead) | Sell.Do |
| A1.6 | Deduplicación y fusión (teléfono E.164, correo, documento) | IMPORTANTE | CUBIERTA `phone.normalize`, `phone.merge` | FUB |
| A1.7 | Scoring de inversión y calificación (presupuesto, financiamiento, país, plazo) | IMPORTANTE | CUBIERTA `lead.investment_score` | LeadSquared |
| A1.8 | Perfil de demanda del comprador y **matching** con inventario disponible (y viceversa) | IMPORTANTE | **NUEVA** (`contact.investor_profile` es perfil, no matching) | EspoCRM |
| A1.9 | Consentimiento y preferencias de contacto (opt-in WhatsApp/correo, canal preferido) con evidencia | ESENCIAL | **NUEVA** | (buena práctica; ver nota de privacidad en A18) |
| A1.10 | Importación CSV con mapeo | IMPORTANTE | CUBIERTA `import.csv` | todos |

### A2. Nurturing y comunicaciones
| ID | Capacidad | Prio | Cobertura previa | Referente |
|---|---|---|---|---|
| A2.1 | Secuencias/planes de acción (drip WhatsApp/correo + tareas + cambio de etapa) | IMPORTANTE | BRECHA `automation.*` | FUB action plans |
| A2.2 | Bandeja multicanal y estado real de entrega | IMPORTANTE | CUBIERTA `message.inbox`, `message.delivery_status` | BoldTrail |
| A2.3 | Plantillas de mensaje **por idioma** (ES/EN y mercados de la diáspora) y por etapa | IMPORTANTE | PARCIAL (`message.template` sin idioma) | — |
| A2.4 | Vistas guardadas / listas inteligentes (leads que necesitan seguimiento) | IMPORTANTE | **NUEVA** (`contact.search` es búsqueda, no listas vivas) | FUB smart lists |
| A2.5 | Alertas de lead frío y de negocio/reserva estancado | IMPORTANTE | **NUEVA** | Sell.Do |
| A2.6 | Registro de llamadas (log, grabación opcional) y dialer | DESEABLE | **NUEVA** | FUB |
| A2.7 | Boletín fotográfico de avance de obra | IMPORTANTE | CUBIERTA `progress.bulletin` | — |

### A3. Inventario de proyectos y unidades
| ID | Capacidad | Prio | Cobertura previa | Referente |
|---|---|---|---|---|
| A3.1 | Jerarquía proyecto → etapa/torre → tipología → unidad, con accesorias vendibles (parqueos, depósitos) ligadas a unidad | ESENCIAL | PARCIAL (`property.*`, `unit.*`; accesorias no) | Sell.Do |
| A3.2 | Estados de unidad y bloqueos con expiración (disponible, bloqueada, reservada, vendida, retenida por dueño) | ESENCIAL | CUBIERTA `unit.availability`, `reserve.expire` | Sell.Do |
| A3.3 | **Listas de precios versionadas** por fase de preventa, con vigencia, y precio base en USD con equivalencia en DOP | ESENCIAL | **NUEVA** | Sell.Do, Damco |
| A3.4 | **Estado legal y documental del proyecto**: titularidad del terreno, permisos, fiduciaria, clasificación Confotur (provisional/definitiva), visible para brokers y comprador | ESENCIAL | PARCIAL (`tax.eligibility`) | clicinmobiliaria (guía de debida diligencia) |
| A3.5 | Cuadro de disponibilidad exportable (PDF/enlace) y vista de masterplan | IMPORTANTE | CUBIERTA `unit.masterplan`; cuadro **NUEVA** | Sell.Do |
| A3.6 | Inventario visible a brokers externos sin márgenes ni precios internos | ESENCIAL | CUBIERTA `brokerportal.inventory` | Sell.Do |
| A3.7 | Mapa, polígonos, zonificación | DESEABLE | BRECHA `map.*` | — |
| A3.8 | Recorrido 360 y gestión de activos multimedia | DESEABLE | CUBIERTA `unit.virtual_tour`; BRECHA `tour.asset_manage` | — |

### A4. Cotizaciones y planes de pago
| ID | Capacidad | Prio | Cobertura previa | Referente |
|---|---|---|---|---|
| A4.1 | Cotizador con **plan de pago configurable por proyecto** (separación, cuotas, contra entrega; % o monto; fechas) | ESENCIAL | PARCIAL (`payment.plan` fija 10-40-50) | Sell.Do |
| A4.2 | Cotización versionada con vigencia y PDF | ESENCIAL | CUBIERTA `quote.persist`, `quote.pdf` | Sell.Do |
| A4.3 | Cotización en USD y DOP con **tipo de cambio congelado** y fecha | ESENCIAL | **NUEVA** | — |
| A4.4 | Descuentos y promociones con **aprobación** y tope por rol | IMPORTANTE | **NUEVA** | Sell.Do |
| A4.5 | Beneficios Confotur en la cotización | ESENCIAL | CUBIERTA `tax.*` (las reglas necesitan versionado: BRECHA `tax.rule_version`, y atención a Ley 30-26, ver B.2) | — |
| A4.6 | Estimado de gastos de cierre (transferencia, legales, notaría, deslinde) | IMPORTANTE | **NUEVA** | — |
| A4.7 | Proyección de retorno y renta por unidad | IMPORTANTE | CUBIERTA `unit.roi` | — |
| A4.8 | Carta de pre-calificación / referencia a financiamiento hipotecario | DESEABLE | **NUEVA** | LeadSquared (segmenta por crédito) |

### A5. Reservas y apartados
| ID | Capacidad | Prio | Cobertura previa | Referente |
|---|---|---|---|---|
| A5.1 | Reserva sin doble asignación y con expiración | ESENCIAL | CUBIERTA `reserve.create`, `reserve.expire` | Sell.Do |
| A5.2 | Cobro/comprobante de separación y **conciliación** | ESENCIAL | BRECHA `finance.reconcile`; pago en línea **NUEVA** | Sell.Do |
| A5.3 | Recibo numerado de separación, con comprobante fiscal | ESENCIAL | BRECHA `finance.ecf` (parcial) | Sell.Do |
| A5.4 | Reglas de devolución/penalidad de la separación y su registro | IMPORTANTE | **NUEVA** | — |
| A5.5 | **Co-compradores, representante, comprador persona jurídica** (con beneficiario final) | ESENCIAL | PARCIAL (`contact.family_group` agrupa, no modela titularidad) | Sell.Do |
| A5.6 | Lista de espera por unidad | DESEABLE | **NUEVA** | — |

### A6. Contratos
| ID | Capacidad | Prio | Cobertura previa | Referente |
|---|---|---|---|---|
| A6.1 | Plantillas de promesa de venta y compraventa que toman datos de unidad, comprador y plan | ESENCIAL | PARCIAL (`document.pdf`) | Zoho/Sign, Sell.Do |
| A6.2 | Revisión legal, versionado y aprobación del contrato | IMPORTANTE | BRECHA `document.version`; aprobación **NUEVA** | — |
| A6.3 | Firma electrónica / separación digital | IMPORTANTE | CUBIERTA `document.signature` (sin proveedor probado; Documenso excluido) | Sell.Do (e-firma CP) |
| A6.4 | **Vínculo con fideicomiso/fiduciaria**: carta de instrucción, constancia de aportes, estado de cada cuota depositada | ESENCIAL | **NUEVA** | Ley 189-11 (ver fuentes B.2) |
| A6.5 | **Cesión de derechos** (traspaso entre compradores) y adendas (cambio de unidad o plan) | IMPORTANTE | **NUEVA** | — |
| A6.6 | Rescisión/cancelación con liquidación y liberación de unidad | IMPORTANTE | **NUEVA** | Sell.Do (ciclo de vida) |

### A7. Cobros y estados de cuenta del comprador
| ID | Capacidad | Prio | Cobertura previa | Referente |
|---|---|---|---|---|
| A7.1 | **Cronograma de cuotas por contrato** (fechas, montos, moneda), generado desde el plan | ESENCIAL | **NUEVA** (`payment.plan` calcula, no persiste cronograma de cobro) | Sell.Do |
| A7.2 | Registro de pagos (transferencia, cheque, tarjeta, efectivo) con imputación a cuotas, pagos parciales y adelantos a capital | ESENCIAL | BRECHA `finance.ledger_post`; imputación **NUEVA** | Sell.Do |
| A7.3 | **Estado de cuenta** del comprador (PDF y portal) | ESENCIAL | BRECHA `clientroom.payment_history` | — |
| A7.4 | Recordatorios y cartas de cobro por vencer/vencida (demand letters), mora y recargos | ESENCIAL | **NUEVA** | Sell.Do |
| A7.5 | **Multimoneda**: cuota en USD pagada en DOP al TC del día; diferencial cambiario | ESENCIAL | **NUEVA** | — |
| A7.6 | Cuotas ligadas a **hitos de obra** (disparo de cobro al cumplir fase) | IMPORTANTE | **NUEVA** (relaciona `progress.*` con cobro) | Sell.Do |
| A7.7 | Comprobante fiscal por cobro y conciliación bancaria | ESENCIAL | BRECHA `finance.invoice`, `finance.ecf`, `finance.reconcile` | — |
| A7.8 | Reestructuración de plan (refinanciamiento de cuotas) con aprobación | DESEABLE | **NUEVA** | — |

### A8. Comisiones y co-broking
| ID | Capacidad | Prio | Cobertura previa | Referente |
|---|---|---|---|---|
| A8.1 | Esquemas de comisión por proyecto/broker/nivel (tramos), reparto agencia-broker y multi-broker | ESENCIAL | CUBIERTA `commission.split`, `commission.multi_split` | Sell.Do |
| A8.2 | **Devengo por cobro**: la comisión se libera por cuotas o al cumplir X % del precio pagado, no al reservar | ESENCIAL | BRECHA `commission.installment` | — |
| A8.3 | **Reversa (clawback)** si el comprador cancela o rescinde | IMPORTANTE | **NUEVA** | — |
| A8.4 | Retenciones dominicanas y formato 606 | ESENCIAL | CUBIERTA `commission.withholding`, `commission.606` (ver B.2 por reglas y Norma 02-26) | — |
| A8.5 | Documento fiscal del broker: factura (E31) si es contribuyente o **comprobante de compras (E41)** si no | ESENCIAL | **NUEVA** | — |
| A8.6 | Acuerdo de co-broking entre agencias y estado de cuenta de comisiones autoservicio para el broker | IMPORTANTE | CUBIERTA `broker.cobroking`; estado de cuenta **NUEVA** | Sell.Do |
| A8.7 | Pago por lote (archivo bancario) y calendario de pagos | DESEABLE | **NUEVA** | — |

### A9. Portal del cliente
| ID | Capacidad | Prio | Cobertura previa | Referente |
|---|---|---|---|---|
| A9.1 | Expediente, documentos compartidos, avance de obra | ESENCIAL | CUBIERTA `clientroom.*` | Ceptes/Salesforce |
| A9.2 | Estado de cuenta, pagos y recibos | ESENCIAL | BRECHA `clientroom.payment_history` | — |
| A9.3 | Solicitudes postventa y firma de documentos desde el portal | IMPORTANTE | **NUEVA** | — |
| A9.4 | Acceso para diáspora: idioma, huso horario, doble factor, revocación | IMPORTANTE | BRECHA `clientroom.access_revoke`; 2FA **NUEVA** | — |

### A10. Portal del broker
| ID | Capacidad | Prio | Cobertura previa | Referente |
|---|---|---|---|---|
| A10.1 | Inventario con permisos, subir lead, invitar broker | ESENCIAL | CUBIERTA `brokerportal.*`, `broker.invite` | Sell.Do |
| A10.2 | **Alta de broker externo con KYC**, contrato de corretaje y datos fiscales (RNC/cédula, cuenta bancaria) | ESENCIAL | **NUEVA** | Sell.Do |
| A10.3 | Kit de ventas y material co-branded con enlace rastreable | IMPORTANTE | **NUEVA** | — |
| A10.4 | Tabla de posiciones y niveles de incentivo | DESEABLE | **NUEVA** | Sell.Do |
| A10.5 | Acceso a inventario condicionado a certificación del broker en el proyecto | IMPORTANTE | **NUEVA** (ver A16) | — |

### A11. Marketing y ROI por canal
| ID | Capacidad | Prio | Cobertura previa | Referente |
|---|---|---|---|---|
| A11.1 | Gasto de marketing por canal/campaña y costo por lead / por reserva / por venta | ESENCIAL | PARCIAL (`report.channel`, `report.roi` sin costo) | BoldTrail |
| A11.2 | Conversiones offline a Meta/Google (Conversions API) | IMPORTANTE | **NUEVA** | — |
| A11.3 | Eventos y roadshows (diáspora): registro, asistencia, leads y retorno | IMPORTANTE | **NUEVA** | — |
| A11.4 | Páginas de captura por proyecto | IMPORTANTE | CUBIERTA `portal.capture` | BoldTrail |
| A11.5 | Biblioteca de activos de marketing | DESEABLE | **NUEVA** | — |

### A12. Agenda y visitas
| ID | Capacidad | Prio | Cobertura previa | Referente |
|---|---|---|---|---|
| A12.1 | Citas, iCal RFC 5545, recordatorios, huso horario, reserva pública | IMPORTANTE | CUBIERTA `agenda.*`; BRECHA `agenda.timezone/reminder` | LeadSquared |
| A12.2 | **Visita con resultado**: check-in, interés, objeciones, siguiente paso; modalidad sala de ventas / obra / video | IMPORTANTE | **NUEVA** | Zoho (etapa de visita) |
| A12.3 | Asignación de visitas por disponibilidad del equipo | DESEABLE | **NUEVA** | — |

### A13. Reportes
| ID | Capacidad | Prio | Cobertura previa | Referente |
|---|---|---|---|---|
| A13.1 | Embudo, ventas por canal, pronóstico, velocidad, exportación CSV | ESENCIAL | CUBIERTA `report.*` | todos |
| A13.2 | **Cartera por cobrar con antigüedad (aging)**, mora y proyección de flujo de caja | ESENCIAL | **NUEVA** | — |
| A13.3 | Absorción de inventario por proyecto/fase y cancelaciones/rescisiones | IMPORTANTE | **NUEVA** | — |
| A13.4 | Productividad y SLA por broker/agente | IMPORTANTE | PARCIAL (`broker.profile`) | FUB |
| A13.5 | Reportes regulatorios PLAFT y datos para 606/607/IR-17 | ESENCIAL | **NUEVA** | — |

### A14. Rentas y property management
| ID | Capacidad | Prio | Cobertura previa | Referente |
|---|---|---|---|---|
| A14.1 | Contrato de renta, cobro, renovación | IMPORTANTE | CUBIERTA `rent.*` | Odoo |
| A14.2 | Propietario como entidad, **liquidación al propietario** y comisión de administración | IMPORTANTE | **NUEVA** | Odoo (terceros) |
| A14.3 | Depósito en garantía, inspección de entrada/salida, mantenimiento (tickets) | IMPORTANTE | **NUEVA** | Odoo (terceros) |
| A14.4 | Facturación recurrente con comprobante fiscal (tratamiento de ITBIS del alquiler: verificar con contador) | IMPORTANTE | **NUEVA** | Odoo |
| A14.5 | Renta vacacional (calendario, sincronización con plataformas) | DESEABLE | **NUEVA** | — |

### A15. Postventa, entrega y garantías
| ID | Capacidad | Prio | Cobertura previa | Referente |
|---|---|---|---|---|
| A15.1 | Avance de obra por fase y publicación a compradores | IMPORTANTE | CUBIERTA `progress.*` | — |
| A15.2 | **Acta de entrega, inspección de recepción con lista de detalles (snagging) y llaves** | ESENCIAL | **NUEVA** (Sell.Do no lo cubre) | — |
| A15.3 | **Escrituración y transferencia de título**: checklist, expediente notarial/Registro de Títulos, pago de impuestos de transferencia (exentos en Confotur), seguimiento | ESENCIAL | **NUEVA** | — |
| A15.4 | Garantías y solicitudes de servicio con plazo (SLA) y proveedor | IMPORTANTE | **NUEVA** | — |
| A15.5 | Administración de condominio (cuotas de mantenimiento, reglamento) | DESEABLE | **NUEVA** | — |
| A15.6 | Encuesta de satisfacción (NPS) y programa de referidos | DESEABLE | **NUEVA** | — |

### A16. Formación de brokers
| ID | Capacidad | Prio | Cobertura previa | Referente |
|---|---|---|---|---|
| A16.1 | Catálogo, progreso, quiz, aprobación en servidor, certificado | IMPORTANTE | CUBIERTA `academy.*` | — |
| A16.2 | Matrícula/intentos, SCORM/LTI, revocación | DESEABLE | BRECHA `academy.*` | — |
| A16.3 | **Conocimiento por proyecto como requisito** para desbloquear inventario | IMPORTANTE | **NUEVA** | — |
| A16.4 | Capacitación PLAFT con constancia (obligación del sujeto obligado) | IMPORTANTE | **NUEVA** | Ley 155-17 (B.2) |

### A17. Documentos
| ID | Capacidad | Prio | Cobertura previa | Referente |
|---|---|---|---|---|
| A17.1 | Repositorio por entidad con permisos, versiones y lectura rastreada | ESENCIAL | CUBIERTA `document.read_track`; BRECHA `document.version` | Papermark |
| A17.2 | **Lista documental por etapa** (qué falta y quién lo debe) | ESENCIAL | **NUEVA** | Sell.Do (marca faltantes) |
| A17.3 | Caducidad de documentos (pasaporte, cédula, certificados) con aviso | IMPORTANTE | **NUEVA** | — |
| A17.4 | Extracción asistida de datos de cédula/pasaporte | DESEABLE | **NUEVA** | — |

### A18. Cumplimiento, KYC y PLAFT (Ley 155-17)
Base normativa verificada: el aviso DGII sobre constructoras (jul-2026) confirma que son sujetos obligados no financieros las empresas que **compran, venden o promueven bienes raíces, o ponen en contacto compradores y vendedores a cambio de comisión**, y que quedan bajo supervisión de la DGII. https://ws945695e.dgii.gov.do/publicacionesOficiales/avisosInformativos/Documents/2026/12-26.pdf (Aviso 12-26). Las obligaciones concretas (registro ante la UAF, oficial de cumplimiento, debida diligencia, ROS, Formato 647 trimestral, conservación de 10 años, umbral de efectivo de US$15,000, plazo del ROS de 5 días hábiles) provienen de fuentes **secundarias**: https://siemprealdia.co/republica-dominicana/impuestos/sujeto-obligado-no-financiero-en-sector-construccion/ y https://phlaw.com/es/norma-general-no-01-2018-para-la-aplicacion-de-la-ley-no-155-17-sobre-lavado-de-activos-y-financiamiento-del-terrorismo/ (las fuentes discrepan entre Norma 01-2018 y 03-2018). **Confirmar texto vigente con el oficial de cumplimiento/abogado antes de implementar.**

| ID | Capacidad | Prio | Cobertura previa |
|---|---|---|---|
| A18.1 | Registro del sujeto obligado, oficial de cumplimiento y manual PLAFT (gestión del programa) | ESENCIAL | **NUEVA** |
| A18.2 | **Debida diligencia del cliente**: identificación, beneficiario final, origen de fondos, PEP y listas restrictivas, con evidencia y vigencia | ESENCIAL | PARCIAL (`lead.kyc_gate` valida; BRECHA `document.kyc_collect` recoge) |
| A18.3 | Matriz de riesgo por cliente/transacción y debida diligencia reforzada | ESENCIAL | **NUEVA** |
| A18.4 | Monitoreo de transacciones y alertas (efectivo, fraccionamiento, terceros pagadores, giros desde jurisdicciones de riesgo) | ESENCIAL | **NUEVA** |
| A18.5 | **Flujo de reporte de operación sospechosa**: alerta interna, revisión del oficial, reporte a la UAF (goAML), plazos y confidencialidad | ESENCIAL | **NUEVA** |
| A18.6 | Reporte de efectivo sobre umbral y Formato 647 trimestral | ESENCIAL | **NUEVA** |
| A18.7 | Conservación de registros 10 años (sec.) y bloqueo de borrado | ESENCIAL | PARCIAL (`audit.immutable`, `trash.*`) |
| A18.8 | KYC también del **broker externo** (A10.2) | ESENCIAL | **NUEVA** |
| A18.9 | Protección de datos personales de compradores (consentimiento, acceso restringido a KYC, minimización; ley dominicana de protección de datos y, para compradores en la UE, RGPD). **Ley 172-13 y alcance del RGPD NO fueron investigados aquí** | ESENCIAL | **NUEVA** |

### A19. Auditoría y control
| ID | Capacidad | Prio | Cobertura previa |
|---|---|---|---|
| A19.1 | Registro, lectura e inmutabilidad de auditoría; exportación | ESENCIAL | CUBIERTA `audit.*` |
| A19.2 | **Aprobación de dos personas** (maker-checker) para descuentos, comisiones, cancelaciones, reversos y cambios de precio | ESENCIAL | **NUEVA** |
| A19.3 | Auditoría de **lectura** de datos sensibles (KYC, estado de cuenta) | IMPORTANTE | **NUEVA** |

### A20. Capa financiera (nuevo dominio, hoy solo en las brechas)
| ID | Capacidad | Prio | Cobertura previa |
|---|---|---|---|
| A20.1 | Libro mayor, plan de cuentas, cuentas por cobrar y por pagar | IMPORTANTE | BRECHA `finance.ledger_post` |
| A20.2 | Emisión de comprobantes fiscales electrónicos (E31/E32/E33/E34/E41) y recepción de TrackId | ESENCIAL | BRECHA `finance.invoice`, `finance.ecf` |
| A20.3 | Conciliación bancaria | IMPORTANTE | BRECHA `finance.reconcile` |
| A20.4 | Generación de 606/607/608/609 y datos de IR-17 / IT-1 | ESENCIAL | CUBIERTA `commission.606` (solo comisiones) |
| A20.5 | Cuentas segregadas por **fideicomiso/proyecto** | ESENCIAL | **NUEVA** |

### A21. Plataforma transversal
| ID | Capacidad | Prio | Cobertura previa |
|---|---|---|---|
| A21.1 | **Multientidad**: cada proyecto suele ser una sociedad (SPV) o fideicomiso distinto, con su RNC, cuentas y reportes | ESENCIAL | **NUEVA** |
| A21.2 | Roles y alcance por proyecto/entidad | ESENCIAL | CUBIERTA `auth.scope` |
| A21.3 | Idioma ES/EN, PWA, búsqueda, notificaciones, integraciones con reintento | IMPORTANTE | CUBIERTA (`i18n`, `offline`, `search`, `notification`, `integration`) |

## A.3 Las 10 capacidades ESENCIALES que faltan

Criterio: ESENCIAL para vender/cobrar/pagar/cumplir y **NUEVA** o solo PARCIAL en el catálogo previo. Orden por riesgo de negocio si no existen.

| # | Capacidad | IDs | Por qué no se puede omitir |
|---|---|---|---|
| 1 | Cronograma de cuotas por contrato, imputación de pagos, estado de cuenta, mora y cartas de cobro | A7.1 A7.2 A7.3 A7.4 | Es el dinero de la desarrolladora. Hoy el plan 10-40-50 se calcula pero no se cobra ni se sigue. |
| 2 | Cobro multimoneda USD/DOP con tipo de cambio y diferencial | A4.3 A7.5 | Precios en USD y pagos en DOP; sin esto la contabilidad y el estado de cuenta no cuadran. |
| 3 | Contratos con vínculo a fideicomiso/fiduciaria, cesión y rescisión | A6.4 A6.5 A6.6 | En preventa la protección del comprador y el flujo de fondos pasan por la fiduciaria (Ley 189-11, fuentes en B.2). |
| 4 | Titularidad de leads de brokers externos y reglas de distribución | A1.2 A1.5 | Evita conflictos de comisión entre brokers internos y externos; es la causa típica de disputa. |
| 5 | Comisión devengada por cobro, reversa y documento fiscal del broker (E31/E41) con retenciones | A8.2 A8.3 A8.4 A8.5 | Pagar comisión al reservar y no al cobrar es el riesgo financiero mayor del negocio; además hay retenciones y comprobante obligatorio. |
| 6 | Programa PLAFT completo: debida diligencia, matriz de riesgo, monitoreo, flujo ROS/UAF, oficial | A18.1 a A18.8 | Quisqueya es sujeto obligado (Aviso DGII 12-26); las infracciones graves incluyen no tener oficial de cumplimiento ni manual (sec.). |
| 7 | Aprobación de dos personas para descuentos, comisiones, cancelaciones y reversos | A19.2 A4.4 | Control antifraude básico; el repo de facturación del usuario ya tiene un módulo de aprobaciones. |
| 8 | Listas de precios versionadas y estado legal/documental del proyecto (Confotur, fiduciaria, permisos) | A3.3 A3.4 | Cada cotización debe poder reconstruirse con el precio y las condiciones vigentes ese día. |
| 9 | Entrega y escrituración: acta, lista de detalles, transferencia de título | A15.2 A15.3 | Cierra la venta; sin ello el cobro final y las garantías quedan fuera del sistema. |
| 10 | Multientidad legal (RNC por proyecto/fideicomiso) con comprobantes y reportes por entidad | A21.1 A20.5 A20.2 | Determina quién factura, quién declara y de qué cuenta se paga la comisión. |

Otras NUEVAS de peso que no entran en el top 10: matching comprador-unidad (A1.8), co-compradores y compradores persona jurídica (A5.5), lista documental por etapa (A17.2), cartera por cobrar con aging (A13.2), gasto de marketing por canal (A11.1).

## A.4 Contraste con el catálogo previo (sin duplicar)

- Estas capacidades ya estaban inventariadas y **no se vuelven a proponer**: captura y voz, Kanban de negocios, Confotur en cotización, propiedades/unidades, avances de obra, agenda iCal, comisiones y retenciones, metas, academia, mensajería, reportes base, auditoría, papelera, importación/exportación, deduplicación, integraciones.
- Las 32 brechas siguen sin aprobar (D02). Este expediente **no las promueve**; solo indica cuáles son prerequisito de las ESENCIALES (por ejemplo `finance.*` y `commission.installment` para #1, #5 y #10).
- Posible solape a decidir en D02: A7.1 (cronograma) con `payment.plan`; A8.2 con `commission.installment`; A18.2 con `lead.kyc_gate` + `document.kyc_collect`.

---

# PARTE B · Contabilidad y fiscalidad RD

## B.1 Facturación electrónica e-CF a octubre de 2026

### Base legal y vías
- **Ley 32-23** de Facturación Electrónica (promulgada el 16-may-2023) y **Reglamento 587-24**. El art. 37 da plazos de 12 / 24 / 36 meses según tamaño: https://dgii.gov.do/cicloContribuyente/facturacion/comprobantesFiscalesElectronicosE-CF/Paginas/Listados-contribuyentes-obligados-implementar-facturacion-electronica.aspx
- **Vías de emisión** (Ley 32-23, art. 12): sistema propio certificado, **proveedor de servicios de facturación electrónica (PSFE)** autorizado, o **Facturador Gratuito** de la DGII (para quien no use otra vía; certificado digital sin costo). https://dgii.gov.do/cicloContribuyente/facturacion/comprobantesFiscalesElectronicosE-CF/Paginas/facturador-gratuito.aspx. La DGII indicó en su aviso de oct-2025 que los certificados gratuitos son de uso exclusivo del Facturador Gratuito y duran 1 año: https://dgii.gov.do/publicacionesOficiales/avisosInformativos/Documents/2025/19-25.pdf
- **Proceso para ser emisor propio:** solicitud (FI-GDF-016), set de pruebas (datos, simulación, comunicación) en el portal de certificación, declaración jurada y habilitación del menú de e-NCF en la Oficina Virtual. Un PSFE debe además haber certificado al menos 5 emisores. https://dgii.gov.do/cicloContribuyente/facturacion/comprobantesFiscalesElectronicosE-CF/Documentacin%20sobre%20eCF/Documentaciones%20Proceso%20de%20Certificaci%C3%B3n%20FE/Proceso%20de%20Certificacion%20para%20ser%20Emisor%20Electronico.pdf y https://dgii.gov.do/publicacionesOficiales/bibliotecaVirtual/contribuyentes/facturacion/Documents/Facturaci%C3%B3n%20Electr%C3%B3nica/Guia-Basica-para-ser-Emisor-Electronico.pdf
- El e-CF es un XML firmado con certificado de prestadora acreditada (INDOTEL, sec. EDICOM) que la DGII valida y responde con **TrackId**.

### Calendario por tamaño de contribuyente (estado al 2026-10-14)
| Grupo | Plazo original | Estado vigente | Fuente |
|---|---|---|---|
| Grandes Contribuyentes Nacionales | 15-ene, 15-mar, 15-may-2024 (por grupo, Aviso 08-23) | **Vencido** | página DGII (listados) |
| Instituciones del Estado | 15-may-2024 (grandes) / 15-may-2026 (resto), Aviso 16-23 | vencido o prorrogado según caso | página DGII (listados) |
| **Grandes Locales y Medianos** | 15-may-2025 | Prórroga a 15-nov-2025 (Aviso 12-25, requería solicitud). **Desde el 1-nov-2026 solo e-CF**; las series B no electrónicas valen hasta el **31-oct-2026** (Reglamento 587-24, art. 55) y después solo en contingencia declarada (cap. IX) | nota DGII del 26-ago-2026: https://dgii.gov.do/noticias/Paginas/DGII-informa-emision-exclusiva-de-facturas-electronicas-para-Grandes-Locales-y-Medianos-contribuyentes-desde-noviembre.aspx · Aviso 12-25: https://ws945695e.dgii.gov.do/publicacionesOficiales/avisosInformativos/Documents/2025/12-25.pdf |
| **Pequeños, Micro y No clasificados** | 15-may-2026 | **Prórroga administrativa automática de 6 meses (sin solicitud) hasta el 15-nov-2026**; vencida, aplican infracciones de la Ley 32-23 | nota DGII del 26-ago-2026 (misma URL); anuncio del 6-may-2026: https://presidencia.gob.do/noticias/dgii-concede-prorroga-de-seis-meses-para-implementacion-de-facturacion-electronica |

Discrepancias a tener en cuenta: (1) la nota de Presidencia del 6-may-2026 menciona "medianas" entre los beneficiarios de la prórroga, pero la nota DGII del 26-ago-2026 ubica a Medianos en el grupo de emisión exclusiva desde el 1-nov. Prevalece la nota DGII más reciente. (2) Los números de aviso 06-26 y 14-26 solo aparecen en fuentes secundarias (https://www.banqup.com/es-es/resources/compliance-pulse/republica-dominicana); el texto íntegro no se pudo abrir. Sanciones: numerales 1, 2, 8, 9, 10, 13, 14, 15 y 16 del art. 26 de la Ley 32-23 (según Aviso 12-25).

**Qué falta saber para Quisqueya Home:** el grupo del RNC (verificable en los listados de la DGII y en la Oficina Virtual). Si es micro/pequeño/no clasificado, el límite es **15-nov-2026**; si es mediano o grande local, es **1-nov-2026**. Aplica además a cada sociedad/SPV por proyecto, cada una con su propio RNC.

### Tipos de comprobante electrónico (página oficial de tipos)
https://dgii.gov.do/cicloContribuyente/facturacion/comprobantesFiscalesElectronicosE-CF/Paginas/TipoyEstructurae-CF.aspx

| Código | Nombre | Uso para una inmobiliaria |
|---|---|---|
| E31 | Factura de Crédito Fiscal | Venta o servicio a un contribuyente que necesita crédito/costo (comprador empresa; comisión facturada por un broker con RNC) |
| E32 | Factura de Consumo | Consumidor final (comprador persona física sin necesidad de crédito fiscal). En el 607 las de consumo ≥ RD$250,000 exigen identificar al comprador (sec. catálogo de formatos DGII) |
| E33 / E34 | Nota de Débito / Nota de Crédito | Solo al mismo adquiriente, para modificar comprobantes previos (cancelaciones, descuentos, devoluciones de separación facturada) |
| E41 | Comprobante de Compras | Pago a quien **no es contribuyente registrado**; aplica a comisiones a brokers externos sin RNC/comprobantes |
| E43 | Gastos Menores | Gastos operativos menores del personal |
| E44 | Regímenes Especiales | Ventas exentas de ITBIS/ISC a entes con régimen especial por ley o contrato |
| E45 | Gubernamental | Ventas al Estado |
| E46 | Exportaciones | Zonas francas / exportadores (no es el caso) |
| E47 | Pagos al Exterior | Pagos a no residentes con retención total de ISR (publicidad en plataformas extranjeras, agentes en el extranjero) |
| E42 | No figura en la página oficial | — |

El e-NCF tiene 13 caracteres (E + 2 dígitos de tipo + 10 de secuencia), según el Aviso 24-19. Existe además el formato **Resumen de Factura de Consumo** (RFCE) para consumo. Los proveedores certificados: la DGII publica la lista en su portal (el conteo varía entre fuentes: 47, 83, 143, 190); no se pudo abrir la lista, así que **verificar vigencia y RNC del PSFE elegido**. Alegra (operando con Alanube, sec.) e Infile (usado por el módulo de Odoo) aparecen citados, pero su autorización **NO se verificó en la lista de la DGII**.

## B.2 Obligaciones típicas de inmobiliaria/desarrolladora

| Tema | Hallazgo | Confianza | Fuente |
|---|---|---|---|
| **ITBIS en la venta de un inmueble** | "No está sujeta" a ITBIS: la transferencia de inmuebles no es hecho generador (Código Tributario arts. 335 y ss.; Decreto 293-11 arts. 1 y 3). La misma consulta aclara que la **actividad de construcción** sí es gravada. Importante: es "no sujeta", no "exenta" | Alta (consulta técnica DGII, caso individual) | https://dgii.gov.do/legislacion/consultas/Consultas%20Tecnicas%202024/Agosto/Consulta%2017-ITBIS%20Transferencia%20inmobiliarias.pdf |
| **ITBIS en servicios (corretaje)** | La misma consulta dice que **solo están exentos los servicios expresamente listados en el art. 344**. El corretaje inmobiliario no figura en esa lista según lo leído, por lo que queda gravado al 18 %. No hay norma específica de corretaje; un caso reportado muestra retención conjunta de 28 % (18 % ITBIS + 10 % ISR) sobre una comisión de alquiler y disputa si es doble retención | Media (inferencia + prensa) | consulta anterior; https://inmobiliario.do/pt/corretores-de-imoveis-alegam-dupla-tributacao-sobre-comissoes-advogado-afirma-que-isso-e-permitido-se-nao-houver-regulamentacao/ |
| **Comisiones a vendedores externos** | Consulta DGII 2022: comisiones por venta de un servicio **exento** (planes funerarios) quedan excluidas de ITBIS. Por analogía, el ITBIS de la comisión sigue la naturaleza del servicio vendido; para inmuebles la venta es "no sujeta", lo que **abre la pregunta de si la comisión de venta de inmueble causa ITBIS** | Baja, pregunta abierta para el contador | https://dgii.gov.do/legislacion/consultas/Consultas%20Tecnicas%202022/Junio/Consulta%206-ITBIS%20en%20venta%20de%20planes%20funerarios.pdf |
| **Retención ISR a personas físicas** | 10 % sobre honorarios/comisiones por servicios profesionales; 2 % servicios técnicos o manuales (Decreto 139-98). La frontera es zona gris | Media (sec.) | https://siemprealdia.co/republica-dominicana/impuestos/retencion-isr-a-personas-fisicas/ · https://phlaw.com/es/retencion-de-impuestos-en-la-republica-dominicana-guia-completa-por-tipo-de-impuesto-para-empresas-y-profesionales/ |
| **Retención de ITBIS** | 100 % del ITBIS cuando una persona jurídica paga un servicio gravado a una persona física (consulta DGII 2024; Decreto 293-11 art. 25 párr. I); 30 % entre sociedades en servicios profesionales liberales (Norma 02-05). **Norma General 02-2026**: quien paga **no debe retener** si la contraparte (persona jurídica) es **emisor electrónico autorizado** y emite e-CF | Media-alta | https://kpmg.com/do/es/tendencias/flashes-fiscales/flash-fiscal-republica-dominicana-dgii-emite-norma-general-que-excluye-de-determinadas-retenciones-delitbis-a-emisores-electronicos.html |
| **Formatos de envío** | 606 compras y retenciones hechas a terceros; 607 ventas y retenciones recibidas; 608 comprobantes anulados; 609 pagos al exterior; 623 retenciones del Estado; 987 libro de ventas. El 606 se envía antes del IT-1; los demás mensualmente (día 15 del mes siguiente, sec.). IT-1 es la declaración mensual de ITBIS (fecha sujeta a calendario) | Alta para descripciones (catálogo DGII), media para días | https://dgii.gov.do/cicloContribuyente/obligacionesTributarias/remisionInformacion/Paginas/formatoEnvioDatos.aspx |
| **IR-17** | Declaración de retenciones y retribuciones tributarias; debe conciliar con el 606. Desde el 1-jul-2026 la **Ley 30-26** fija 15 % (antes 27 %) para pagos a no residentes por regalías, licencias de software, publicidad digital y nube (relevante para gasto de Meta/Google): sec., sin norma DGII hallada | Media-baja | https://siemprealdia.co/republica-dominicana/impuestos/retencion-a-servicios-tecnologicos-del-exterior/ |
| **Confotur (Ley 158-01, mod. Ley 195-13)** | Desarrolladores: exención de ISR, aranceles/ITBIS de importación de equipos y materiales, impuestos municipales. Compradores: exención del impuesto de transferencia inmobiliaria (3 %) y del IPI, según clasificación (la norma 01-2009 de la DGII permitió comprar con clasificación provisional). **Ley 30-26** añade una regla de no acumulación de regímenes de incentivo, cuyo alcance está sin precisar | Media (sec.) | https://inmobiliario.do/ley-158-01-la-guia-sobre-confotur-rd-que-los-inversionistas-deben-consultar/ · https://phlaw.com/es/la-ley-no-158-01-de-confotur-bajo-la-ley-no-30-26-implicaciones-para-desarrolladores-e-inversionistas/ · https://dgii.gov.do/legislacion/normasGenerales/Documents/NG%20sobre%20Leyes%20de%20Incentivos/norma01-09.pdf |
| **Reconocimiento del ingreso** | La DGII indica que el sector construcción registra ingresos desde que el bien se vende o entrega y que debe sustentarse con comprobante fiscal válido. **Pendiente de contador**: si las cuotas de preventa llevan comprobante fiscal propio o un recibo de anticipo, y cómo se factura el saldo | Media | https://dgii.gov.do/publicacionesOficiales/bibliotecaVirtual/contribuyentes/Otros/Documents/Brochure-Obligaciones-Exenciones-Sector-Construccion.pdf |
| **Preventa y fideicomiso** | La Ley 189-11 crea patrimonio separado administrado por fiduciaria; el pago a una fiduciaria que libera fondos según avance de obra es la protección principal del comprador. Riesgo reportado: promesas sin fideicomiso constituido | Media (análisis y opinión) | https://phlaw.com/wp-content/uploads/2025/01/Ley-para-el-Desarrollo-del-Mercado-Hipotecario-y-el-Fideicomiso-en-la-Rep%C3%BAblica-Dominicana.pdf · https://clicinmobiliaria.com/en/articles/inversion/due-diligence-desarrollador-comprar-en-planos-rd-guia · https://acento.com.do/opinion/estafas-inmobiliarias-en-punta-cana-9464019.html |
| **PLAFT** | Ver A18. Sujeto obligado no financiero supervisado por la DGII | Alta para la condición, media para el detalle | Aviso 12-26 (arriba) |

**No investigado:** alquiler y su ITBIS (si el arrendamiento residencial es exento), impuesto de transferencia inmobiliaria y IPI en operaciones sin Confotur, ISR de la desarrolladora (régimen y anticipos), tratamiento fiscal del fideicomiso, retención a no residentes que cobran comisión (agentes de la diáspora).

## B.3 Opciones open source de partida doble (licencia leída del repositorio)

| Sistema | Licencia leída | API REST | NCF / e-CF | Esfuerzo de integración | Veredicto |
|---|---|---|---|---|---|
| **ERPNext** (frappe/erpnext) | **GPLv3** (`license.txt`: https://raw.githubusercontent.com/frappe/erpnext/develop/license.txt). El framework Frappe es **MIT** (https://raw.githubusercontent.com/frappe/frappe/develop/LICENSE) | Sí, automática para todo DocType: `/api/resource/:doctype` con token API key:secret, sesión u OAuth (https://docs.frappe.io/framework/user/en/api/rest) | **Sin localización oficial dominicana.** Existe `LewisMojica/dgii-compliance` (GPL-3.0, 3 estrellas, 84 commits): secuencias NCF, asignación a facturas y reportes DGII; **no menciona e-CF** (https://github.com/LewisMojica/dgii-compliance). No se encontró app de e-CF | Medio-alto: plan de cuentas RD, impuestos y retenciones, campos fiscales, formatos 606/607/608/609, conexión con el emisor e-CF. Corre aparte; el CRM la usa solo por API | **Candidato principal para libro mayor.** Ya evaluado 93/100 en el repo hermano |
| **Frappe Books** | **AGPL-3.0** (https://raw.githubusercontent.com/frappe/books/master/LICENSE) | No indicada; app de escritorio Electron/SQLite; el repo consultado está **archivado (fin de vida)** | No | No aplica | Descartado: archivado, un usuario, sin API |
| **Akaunting** | **Business Source License 1.1** (https://raw.githubusercontent.com/akaunting/akaunting/master/LICENSE.txt): producción limitada a 2 usuarios, 1 empresa o 1,000 facturas; sin marca blanca; sin "Accounting Service". Se vuelve GPLv3 4 años después | La doc leída no confirma API | No se encontró módulo RD | Alto | **No es libre para este uso.** Descartado (coincide con la evaluación previa del repo hermano) |
| **Invoice Ninja v5** | **Elastic License 2.0** (https://raw.githubusercontent.com/invoiceninja/invoiceninja/v5-stable/LICENSE): prohíbe ofrecerlo como servicio alojado/gestionado y eludir claves de licencia | Sí, API REST documentada (https://api-docs.invoicing.co/; página >10 MB, no leída en detalle) | No se encontró módulo RD | Alto | Es facturación, **no partida doble**. Descartado |
| **Odoo Community** | **LGPLv3** (https://raw.githubusercontent.com/odoo/odoo/master/LICENSE). Enterprise y Odoo.sh no son LGPL | Sí: API externa con llave de API (JSON-2, reemplaza XML-RPC/JSON-RPC); disponibilidad por plan **no verificada** (https://www.odoo.com/documentation/master/developer/reference/external_api.html) | `l10n_do` (LGPL-3) trae plan de cuentas, impuestos, retenciones y secuencias NCF, pero su descripción dice que **las secuencias NCF requieren módulos de terceros o desarrollo** (https://raw.githubusercontent.com/odoo/odoo/master/addons/l10n_do/__manifest__.py). Los módulos e-CF `l10n_do_edi` (vía Infile, tipos E31-E34) y `l10n_do_reports` aparecen en la documentación (https://www.odoo.com/documentation/master/applications/finance/fiscal_localizations/dominican_republic.html) pero **`l10n_do_edi` no existe en `odoo/odoo`** (404) → probablemente **Enterprise** (NO verificado). Comunidad: `odoo-dominicana/l10n-dominicana` (LGPL-3, rama 17.0 activa, 110 estrellas, sin e-CF mencionado: https://github.com/odoo-dominicana/l10n-dominicana); no se halló repo OCA dominicano | Medio-alto; duplica CRM, inventario y ventas de Odoo que no se usarían | Alternativa viable solo si se acepta pagar Enterprise o mantener módulos comunitarios de una sola mantenedora |
| **Dolibarr** | **GPL-3+** (README/COPYING: https://raw.githubusercontent.com/Dolibarr/dolibarr/develop/README.md) | Sí: módulo "API REST", cabecera `DOLAPIKEY` (https://wiki.dolibarr.org/index.php/Module_Web_Services_API_REST_(developer)) | No se encontró módulo RD | Medio; contabilidad de partida doble con diario y mayor (https://wiki.dolibarr.org/index.php/Module_Double_Entry_Accounting); multicompañía requiere módulo externo | Opción ligera si se prefiere simplicidad a profundidad |

Nota: Odoo, Dolibarr y EspoCRM como CRM ya fueron descartados en el mapa por duplicar el CRM propio; aquí se consideran solo como contabilidad.

## B.4 Recomendación

### Premisa
El usuario ya tiene una app propia de facturación RD (`C:\Users\wilbe\Downloads\FacturacionV3\secure-access-hub-68`; Vite + React + shadcn + Supabase). Lectura rápida (solo README, `src/pages`, `src/adapters` y `menu-config`; otro agente la inventaría a fondo): tiene páginas de **Facturas, Notas de Crédito, Pagos, NCF, Impuestos, Facturación Electrónica, Cotizaciones/Proformas, Conduces, Clientes, Reportes, Aprobaciones, Auditoría, Empresa/Sucursales y Usuarios/Roles**, y un `ecf-adapter.ts` con configuración de ambiente, pasos de certificación, registro de envíos y generación de XML. Según el propio comentario del adapter, **el XML se genera "sin firma" para referencia y pruebas** y la firma real requiere certificado P12; esa pieza (firma XMLDSig, cliente de los servicios de la DGII, set de pruebas) **no aparece cubierta** en lo leído. Verificarlo en el inventario del otro agente. Además el texto de pasos habla de facturas B01/B02, lo que sugiere contenido previo a la migración a e-CF.

### Propuesta por roles (tres piezas, no una)

1. **CRM Quisqueya = subauxiliar comercial** (A7, A8, A5, A6): contratos, cronograma de cuotas, pagos registrados, comisiones devengadas, retenciones calculadas. Es la fuente de verdad de *qué se cobró y a quién se debe*. Publica eventos por el outbox ya existente (`integration.outbox`) hacia contabilidad y emisor. Debe llevar el RNC emisor por proyecto (A21.1).

2. **Emisor de NCF/e-CF = un solo punto de emisión.**
   - **Ahora (plazo del 1-nov o 15-nov-2026):** contratar un **PSFE autorizado con API** y ponerlo detrás de un puerto `FacturacionPort` en el CRM. Evita construir firma, certificación y contingencia en semanas. El Facturador Gratuito de la DGII cubre el cumplimiento legal pero es un portal manual (no se halló API ni límites), por lo que no sirve como integración y tiene sentido solo como respaldo.
   - **Mediano plazo:** FacturacionV3 puede convertirse en emisor propio **solo si** completa firma del XML en servidor (no en el navegador), cliente de los servicios DGII, set de pruebas, declaración jurada y contingencia. Hasta entonces, conviene usarla para cotizaciones, proformas y conduces, no como emisor fiscal real.
   - Cualquiera que sea el emisor, el CRM guarda el e-NCF, TrackId, estado y XML por cobro, y no genera numeración fiscal propia.

3. **Libro mayor (partida doble) = ERPNext, condicionado.**
   - Es la única opción OSS evaluada con licencia libre para este uso (GPLv3 en servicio aparte, uso interno), REST nativo y multiempresa; encaja con el principio "RUN aparte, solo por API" ya aprobado en el mapa. Sin e-CF propio: recibe de los pasos 1 y 2 la factura con su e-NCF como referencia (campos personalizados), el pago y la comisión, y genera asientos, cuentas por cobrar/pagar y conciliación. Una cuenta de fideicomiso por proyecto se modela como compañía o centro de costo.
   - **Condición previa:** confirmar con el contador externo si llevará la contabilidad en ERPNext, en su propio sistema o en una herramienta contable ya existente. En muchas empresas dominicanas el contador usa su software y solo necesita 606/607/608 y soportes limpios. Si es así, **no desplegar ERPNext todavía**: el CRM debe exportar subauxiliares y los formatos 606/607/608/609 desde el emisor, y ERPNext queda para una fase posterior.
   - **Alternativas:** Odoo Community solo si se paga Enterprise por `l10n_do_edi` (y entonces es un segundo CRM/ERP que duplica); Dolibarr si se quiere un contable mínimo.

### Decisiones que necesita Wilber
1. ¿En qué grupo DGII está cada RNC (Quisqueya y cada SPV/fideicomiso)? Define 1-nov vs 15-nov-2026.
2. ¿Quién es el contador y dónde lleva los libros? Define si ERPNext entra ahora.
3. ¿PSFE con API o certificar FacturacionV3? Pedir al otro agente el estado real de firma/envío de FacturacionV3.
4. Criterio contable: ¿cuotas de preventa con comprobante propio o recibo de anticipo? ¿Quién factura la comisión (agencia, broker, ambos)? ¿El ITBIS de la comisión de venta de inmueble aplica? (pregunta de consulta formal a la DGII).
5. ¿Existe fiduciaria en todos los proyectos? Si no, A6.4 y A20.5 cambian.
6. ¿Quién es el oficial de cumplimiento PLAFT y se registró ante la UAF?

## B.5 Riesgos y brechas de este expediente

- No se leyó el texto completo de los avisos 06-26 y 14-26 ni la lista oficial de PSFE; las fechas sí están respaldadas por la nota de la DGII del 26-ago-2026.
- Ley 30-26, regla de no acumulación de incentivos y su efecto en Confotur: alcance no precisado por las fuentes.
- Umbrales y plazos PLAFT (US$15,000, 5 días hábiles, Formato 647, 10 años) son de fuentes secundarias.
- Capacidad de productos comerciales: marketing, no demostración. LeadSquared y Propertybase quedaron con poca evidencia de preventa.
- Odoo: no se verificó si `l10n_do_edi` es Enterprise ni si la API externa está en Community.
- Akaunting e Invoice Ninja: licencia leída, API no verificada a fondo; igual quedan descartados por licencia o por no ser contabilidad.
- Ley 172-13 (datos personales) y RGPD no fueron investigados.
- Este expediente no ejecuta ni instala nada; las recomendaciones requieren PoC local y revisión independiente (D03, D12) antes de cualquier decisión.

## Anexo · Fuentes

**DGII oficiales:** listados y calendario https://dgii.gov.do/cicloContribuyente/facturacion/comprobantesFiscalesElectronicosE-CF/Paginas/Listados-contribuyentes-obligados-implementar-facturacion-electronica.aspx · tipos e-CF .../Paginas/TipoyEstructurae-CF.aspx · Facturador Gratuito .../Paginas/facturador-gratuito.aspx · nota 26-ago-2026 https://dgii.gov.do/noticias/Paginas/DGII-informa-emision-exclusiva-de-facturas-electronicas-para-Grandes-Locales-y-Medianos-contribuyentes-desde-noviembre.aspx · Aviso 12-25 https://ws945695e.dgii.gov.do/publicacionesOficiales/avisosInformativos/Documents/2025/12-25.pdf · Aviso 19-25 https://dgii.gov.do/publicacionesOficiales/avisosInformativos/Documents/2025/19-25.pdf · Aviso 12-26 https://ws945695e.dgii.gov.do/publicacionesOficiales/avisosInformativos/Documents/2026/12-26.pdf · consultas técnicas 17 (2024) y 6 (2022) · formatos de envío https://dgii.gov.do/cicloContribuyente/obligacionesTributarias/remisionInformacion/Paginas/formatoEnvioDatos.aspx · brochure sector construcción.

**Prensa y consultoras (secundarias):** https://presidencia.gob.do/noticias/dgii-concede-prorroga-de-seis-meses-para-implementacion-de-facturacion-electronica · https://blog.alegra.com/republica-dominicana/prorroga-ecf-pymes/ · https://inmobiliario.do/?p=69954 · https://kpmg.com/do/es/tendencias/flashes-fiscales/dgii-informa-sobre-la-emision-exclusiva-de-comprobantes-fiscales-electronicos-para-grandes-contribuyentes-locales-y-medianos.html · https://siemprealdia.co/republica-dominicana/impuestos/sujeto-obligado-no-financiero-en-sector-construccion/ · https://siemprealdia.co/republica-dominicana/impuestos/sanciones-a-sujetos-obligados-no-financieros/ · https://www.banqup.com/es-es/resources/compliance-pulse/republica-dominicana

**Repositorios y documentación OSS:** los enlaces `raw.githubusercontent.com` de la tabla B.3, https://github.com/LewisMojica/dgii-compliance · https://github.com/odoo-dominicana/l10n-dominicana · https://github.com/frappe/books · https://docs.frappe.io/framework/user/en/api/rest · https://www.odoo.com/documentation/master/applications/finance/fiscal_localizations/dominican_republic.html

**Productos inmobiliarios:** enlaces de la tabla A.1.
