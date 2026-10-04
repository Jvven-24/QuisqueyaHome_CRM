# D21 Cobertura de Módulos (Barrido OSS y Estado)

## Resumen Ejecutivo

| Módulo | Estado Hoy | Qué Falta (Fase Pro) | Candidatos OSS | Licencia | Modo | Decisión |
|---|---|---|---|---|---|---|
| Inicio | Presente | KPIs RD, Confotur, Multi-moneda | Ninguno directo | - | - | Construir (P1, W1) |
| Leads | Presente | Diáspora, Origen detallado | Twenty | NOASSERTION | REFERENCE | Integrar (P0, W1) |
| Pipeline | Presente | Múltiples embudos, Conversión USD/DOP | Twenty | NOASSERTION | REFERENCE | Integrar (P0, W1) |
| Contactos | Presente | Enriquecimiento, Redes sociales | Twenty | NOASSERTION | REFERENCE | Integrar (P0, W1) |
| Propiedades | Presente | Multi-unidad, Bloqueos, Confotur | OpenProperty | UNKNOWN | REFERENCE | Construir (P0, W1) |
| Avances | Presente | Visores 360, Documentos PDF | Pannellum | MIT | APP | Integrar (P1, W4) |
| Agenda | Presente | Sync Google/Outlook, Zonas Horarias | cal.com, schedule-x | MIT | RUN/APP | Integrar (P0, W2) |
| Tareas | Presente | Subtareas, Delegación | Ninguno directo | - | - | Construir (P1, W2) |
| Brokers | Presente | Portal externo, Co-broking | Prolink (Ref) | NONE | REFERENCE | Construir (P0, W1) |
| Metas | Presente | Metas por equipo/broker | Ninguno directo | - | - | Construir (P2, W3) |
| Comisiones | Presente | Split múltiple, Retenciones RD | Ninguno directo | - | - | Construir (P0, W1) |
| Comunicaciones | Presente | WhatsApp, SMS, Email | chatwoot, Baileys | NOASSERTION, MIT | RUN | Integrar (P0, W1) |
| Reportes | Presente | Exportación DGI, Dashboards | growthbook, posthog | NOASSERTION | RUN | Integrar (P1, W4) |
| Academy | Presente | Tracking, Certificados | moodle, frappe/lms | GPL-3.0, AGPL-3.0 | RUN | Integrar (P0, W2) |
| Configuración | Presente | Roles RBAC granulares | Ninguno directo | - | - | Construir (P0, W1) |
| Cotizaciones | Ausente | Motor de reglas, PDF dinámico | gorules/zen, react-pdf | MIT | RUN/APP | Integrar (P0, W4) |
| Reservas | Ausente | Concurrencia, Pago online | Ninguno directo | - | - | Construir (P0, W2) |
| Planes de Pago | Ausente | Fórmulas 10/40/50, Préstamos | gorules/zen | MIT | RUN | Construir/Port (P0, W4) |
| Rentas | Ausente | Contratos, Renovaciones | clawnify/OpenProperty | MIT | PORT | Portar OpenProperty (P1, W4b) |
| Client Room | Ausente | Portal cliente, Pagos | papermark | NOASSERTION | RUN | Integrar (P1, W3) |
| Deal Room | Ausente | Negociación multi-parte | papermark | NOASSERTION | RUN | Integrar (P1, W3) |
| Mapas | Ausente | Polígonos, Zonificación RD | Ninguno directo | - | - | Construir (P2, W4) |
| IA/Asistente | Ausente | Clasificación automática, Chat | Ninguno directo (API) | - | APP | Integrar (P1, W3) |
| Notificaciones | Presente | Push, Email, In-app | novu | NOASSERTION | RUN | Integrar (P0, W2) |
| Automatizaciones | Ausente | Workflows visuales | n8n, activepieces | NOASSERTION | RUN | Integrar (P1, W3) |
| Captura Leads | Ausente | Formularios dinámicos | formbricks | NOASSERTION | RUN | Integrar (P1, W3) |
| Documentos | Ausente | Plantillas, Firmas | react-pdf, papermark | MIT, NOASSERTION | APP/RUN | Integrar (P0, W2) |
| Búsqueda | Ausente | Búsqueda global (typos) | meilisearch | NOASSERTION | RUN | Integrar (P0, W2) |
| Auditoría | Presente | Logs inmutables | posthog | NOASSERTION | RUN | Integrar (P1, W4) |
| PWA/Offline | Presente | Modo sin conexión, Sync | Ninguno directo | - | APP | Construir (P2, W4) |
| i18n | Ausente | Inglés (Diáspora), Español | Ninguno directo | - | APP | Construir (P0, W1) |
| Import/Export | Presente | CSV/Excel, Mapeo campos | Ninguno directo | - | APP | Construir (P1, W2) |
| Deduplicación | Ausente | Normalización E.164 | libphonenumber-js | MIT | APP | Integrar (P0, W1) |
| Portal Broker | Ausente | Vista externa aislada | Ninguno directo | - | APP | Construir (P0, W2) |
| Certificación | Ausente | Emisión diplomas | moodle, frappe/lms | GPL-3.0, AGPL-3.0 | RUN | Integrar (P1, W2) |

## Detalle por Módulo

### Inicio
* **Hoy:** src/app/(crm)/inicio y src/application/dashboard/ existen.
* **Falta:** KPIs específicos de RD (ventas bajo Confotur vs normal), conversión multi-moneda (USD/DOP) en tiempo real, vista de metas de broker.
* **Candidatos:** N/A
* **Decisión:** Construir (P1, W1).

### Leads
* **Hoy:** src/app/(crm)/leads y src/application/leads/ existen.
* **Falta:** Captura de origen detallado (diáspora vs local), enriquecimiento automático, calificación predictiva.
* **Candidatos:**
  - 	wentyhq/twenty: Licencia: NOASSERTION, Fecha: 2026-10-04, Estrellas: 57898, Stack: TypeScript, Modo: REFERENCE.
* **Decisión:** Integrar / Referencia (P0, W1).

### Pipeline
* **Hoy:** src/app/(crm)/pipeline y src/application/pipeline/ existen.
* **Falta:** Múltiples embudos (renta vs venta), vistas por moneda (USD/DOP), probabilidad de cierre.
* **Candidatos:**
  - 	wentyhq/twenty: Licencia: NOASSERTION, Fecha: 2026-10-04, Estrellas: 57898, Stack: TypeScript, Modo: REFERENCE.
* **Decisión:** Integrar / Referencia (P0, W1).

### Contactos
* **Hoy:** src/app/(crm)/contactos y src/application/contactos/ existen.
* **Falta:** Perfilamiento de inversores extranjeros (diáspora), agrupación por familia/empresa, historial unificado.
* **Candidatos:**
  - 	wentyhq/twenty: Licencia: NOASSERTION, Fecha: 2026-10-04, Estrellas: 57898, Stack: TypeScript, Modo: REFERENCE.
* **Decisión:** Integrar / Referencia (P0, W1).

### Propiedades
* **Hoy:** src/app/(crm)/propiedades existe (parte application en proyectos).
* **Falta:** Gestión multi-unidad (torres/lotes), flag de Confotur activo, bloqueos de reserva temporal.
* **Candidatos:**
  - OpenProperty/open-property: Licencia: UNKNOWN, Fecha: UNKNOWN, Estrellas: UNKNOWN, Stack: UNKNOWN, Modo: REFERENCE.
  - prolink (privado): Licencia: NONE, Modo: REFERENCE.
* **Decisión:** Construir (P0, W1).

### Avances (Obra)
* **Hoy:** src/app/(crm)/avances existe.
* **Falta:** Integración de visores 360, generación de reportes PDF para inversores, historial fotográfico por etapa.
* **Candidatos:**
  - mpetroff/pannellum: Licencia: MIT, Fecha: 2026-07-12, Estrellas: 4905, Stack: JavaScript, Modo: APP.
* **Decisión:** Integrar (P1, W4).

### Agenda
* **Hoy:** src/app/(crm)/agenda existe.
* **Falta:** Sincronización bidireccional (Google/Outlook), manejo de zonas horarias (clientes diáspora), link de agendamiento.
* **Candidatos:**
  - calcom/cal.com: Licencia: MIT, Fecha: 2026-09-26, Estrellas: 48859, Stack: TypeScript, Modo: RUN, Puerto: AgendaPort.
  - schedule-x/schedule-x: Licencia: MIT, Fecha: 2026-10-03, Estrellas: 2593, Stack: TypeScript, Modo: APP.
  - ullcalendar/fullcalendar: Licencia: MIT, Fecha: 2026-10-03, Estrellas: 20662, Stack: TypeScript, Modo: APP.
* **Decisión:** Integrar (P0, W2).

### Tareas
* **Hoy:** src/app/(crm)/tareas existe.
* **Falta:** Subtareas, delegación entre brokers, plantillas de tareas por etapa.
* **Candidatos:** N/A.
* **Decisión:** Construir (P1, W2).

### Brokers
* **Hoy:** src/app/(crm)/brokers y src/application/brokers/ existen.
* **Falta:** Portal del broker y co-broking (se construye UI externa e invitaciones), onboarding automatizado (se integra con Notificaciones).
* **Candidatos:**
  - prolink (privado): Licencia: NONE, Modo: REFERENCE.
* **Decisión:** Construir (P0, W1).

### Metas
* **Hoy:** src/app/(crm)/metas y src/application/metas/ existen.
* **Falta:** Metas jerárquicas (agencia > equipo > broker), cálculo de bonos por volumen, ajustes por estacionalidad.
* **Candidatos:** N/A.
* **Decisión:** Construir (P2, W3).

### Comisiones
* **Hoy:** src/app/(crm)/comisiones y src/application/comisiones/ existen.
* **Falta:** Splits y retenciones RD (se construyen calculadoras y flujos locales, no hay integración externa).
* **Candidatos:** N/A.
* **Decisión:** Construir (P0, W1).

### Comunicaciones (Conexiones)
* **Hoy:** src/app/(crm)/comunicaciones y src/application/comunicaciones/ existen.
* **Falta:** Bandeja unificada (WhatsApp, Email, SMS), plantillas aprobadas (Meta), bots de primer nivel.
* **Candidatos:**
  - chatwoot/chatwoot: Licencia: NOASSERTION, Fecha: 2026-10-04, Estrellas: 37526, Stack: Ruby, Modo: RUN, Puerto: MensajeriaPort.
  - WhiskeySockets/Baileys: Licencia: MIT, Fecha: 2026-10-04, Estrellas: 11230, Stack: JavaScript, Modo: RUN, Puerto: MensajeriaPort.
  - EvolutionAPI/evolution-api: Licencia: NOASSERTION, Fecha: 2026-07-14, Estrellas: 9758, Stack: TypeScript, Modo: RUN, Puerto: MensajeriaPort.
  - 
esend/react-email: Licencia: MIT, Fecha: 2026-10-03, Estrellas: 19805, Stack: TypeScript, Modo: APP.
* **Decisión:** Integrar (P0, W1).

### Reportes
* **Hoy:** src/app/(crm)/reportes y src/application/reportes/ existen.
* **Falta:** Exportación para contabilidad local, dashboards dinámicos, métricas de ROI.
* **Candidatos:**
  - growthbook/growthbook: Licencia: NOASSERTION, Fecha: 2026-10-04, Estrellas: 8473, Stack: TypeScript, Modo: RUN, Puerto: AnalyticsPort.
* **Decisión:** Integrar (P1, W4).

### Academy
* **Hoy:** src/app/(crm)/academy y src/application/academy/ existen.
* **Falta:** Seguimiento y certificación de brokers (se construye vista local, se integra Moodle/Frappe para SCORM y tracking).
* **Candidatos:**
  - moodle/moodle: Licencia: GPL-3.0, Fecha: 2026-10-03, Estrellas: 7461, Stack: PHP, Modo: RUN, Puerto: AprendizajePort.
  - rappe/lms: Licencia: AGPL-3.0, Fecha: 2026-10-03, Estrellas: 3285, Stack: TypeScript, Modo: RUN, Puerto: AprendizajePort.
* **Decisión:** Integrar (P0, W2).

### Configuración
* **Hoy:** src/app/(crm)/configuracion existe.
* **Falta:** RBAC granular, campos personalizados dinámicos, webhooks.
* **Candidatos:** N/A.
* **Decisión:** Construir (P0, W1).

### Cotizaciones
* **Hoy:** Ausente.
* **Falta:** Motor de reglas de precios, PDF dinámico con branding, control de versiones.
* **Candidatos:**
  - gorules/zen: Licencia: MIT, Fecha: 2026-10-02, Estrellas: 2035, Stack: Rust, Modo: RUN, Puerto: MotorPort.
* **Decisión:** Integrar (P0, W4).

### Reservas
* **Hoy:** Ausente.
* **Falta:** Motor de concurrencia, pasarela de pago online (Azul/Cardnet), expiración automática.
* **Candidatos:** N/A.
* **Decisión:** Construir (P0, W2).

### Planes de Pago
* **Hoy:** Ausente.
* **Falta:** Fórmulas 10/40/50, cálculo de cuotas contra avance de obra, proyecciones hipotecarias.
* **Candidatos:**
  - gorules/zen: Licencia: MIT, Fecha: 2026-10-02, Estrellas: 2035, Stack: Rust, Modo: RUN, Puerto: MotorPort.
* **Decisión:** Construir / Portar (P0, W4).

### Rentas
* **Hoy:** Ausente.
* **Falta:** Gestión de contratos de alquiler, recordatorios de renovación, indexación anual.
* **Candidatos:**
  - clawnify/OpenProperty: Licencia: MIT, Fecha: 2026-10-04, Estrellas: N/A, Stack: PHP, Modo: PORT.
* **Decisión:** Portar OpenProperty (P1, W4b).

### Client Room
* **Hoy:** Ausente.
* **Falta:** Portal para ver documentos, pagos realizados y avances.
* **Candidatos:**
  - mfts/papermark: Licencia: NOASSERTION, Fecha: 2026-08-28, Estrellas: 9237, Stack: TypeScript, Modo: RUN, Puerto: DocumentosPort.
* **Decisión:** Integrar (P1, W3).

### Deal Room
* **Hoy:** Ausente.
* **Falta:** Negociación multi-parte (comprador, abogado, broker).
* **Candidatos:**
  - mfts/papermark: Licencia: NOASSERTION, Fecha: 2026-08-28, Estrellas: 9237, Stack: TypeScript, Modo: RUN, Puerto: DocumentosPort.
* **Decisión:** Integrar (P1, W3).

### Mapas
* **Hoy:** Ausente.
* **Falta:** Polígonos de proyectos, zonificación turística, heatmaps.
* **Candidatos:** N/A.
* **Decisión:** Construir (P2, W4).

### IA/Asistente
* **Hoy:** Ausente en UI (src/application/ai/ existe base).
* **Falta:** Chat contextual, resumen de interacciones, sugerencia de respuestas.
* **Candidatos:** N/A (Uso directo de APIs de LLM).
* **Decisión:** Integrar (P1, W3).

### Notificaciones
* **Hoy:** Presente (tabla `notifications` en `src/infrastructure/db/schema.ts`).
* **Falta:** Integración de Push, Email y centro in-app unificado.
* **Candidatos:**
  - 
ovuhq/novu: Licencia: NOASSERTION, Fecha: 2026-10-04, Estrellas: 40111, Stack: TypeScript, Modo: RUN, Puerto: NotificacionesPort.
* **Decisión:** Integrar (P0, W2).

### Automatizaciones / Workflows
* **Hoy:** Ausente.
* **Falta:** Constructor visual de flujos condicionales.
* **Candidatos:**
  - 
8n-io/n8n: Licencia: NOASSERTION, Fecha: 2026-10-04, Estrellas: 206646, Stack: TypeScript, Modo: RUN, Puerto: AutomatizacionesPort.
  - ctivepieces/activepieces: Licencia: NOASSERTION, Fecha: 2026-10-04, Estrellas: 24894, Stack: TypeScript, Modo: RUN, Puerto: AutomatizacionesPort.
* **Decisión:** Integrar (P1, W3).

### Captura de Leads
* **Hoy:** Ausente.
* **Falta:** Formularios embeddables, captura vía webhook desde portales de RD.
* **Candidatos:**
  - ormbricks/formbricks: Licencia: NOASSERTION, Fecha: 2026-10-03, Estrellas: 13060, Stack: TypeScript, Modo: RUN, Puerto: EncuestasPort.
* **Decisión:** Integrar (P1, W3).

### Documentos / Dossiers
* **Hoy:** Ausente.
* **Falta:** Generación de brochures PDF, recolección de firmas, validación de KYC.
* **Candidatos:**
  - diegomura/react-pdf: Licencia: MIT, Fecha: 2026-09-23, Estrellas: 16817, Stack: TypeScript, Modo: APP.
* **Decisión:** Integrar (P0, W2).

### Búsqueda
* **Hoy:** Ausente.
* **Falta:** Búsqueda difusa global (typos), filtros facetados, atajos.
* **Candidatos:**
  - meilisearch/meilisearch: Licencia: NOASSERTION, Fecha: 2026-10-02, Estrellas: 59487, Stack: Rust, Modo: RUN, Puerto: BusquedaPort.
* **Decisión:** Integrar (P0, W2).

### Auditoría
* **Hoy:** Presente (tabla `audit_log` y puerto `src/application/compartido/auditoria.ts`).
* **Falta:** UI de logs inmutables, versionado, exportación avanzada.
* **Candidatos:**
  - PostHog/posthog: Licencia: NOASSERTION, Fecha: 2026-10-04, Estrellas: 40133, Stack: Python, Modo: RUN, Puerto: AnalyticsPort.
* **Decisión:** Integrar (P1, W4).

### PWA / Offline
* **Hoy:** Presente (dock móvil y manifiesto en `public/`).
* **Falta:** Lógica compleja de funcionamiento sin internet, sync en background.
* **Candidatos:** N/A.
* **Decisión:** Construir (P2, W4).

### i18n
* **Hoy:** Ausente.
* **Falta:** Soporte Inglés/Español para portal de clientes y diáspora.
* **Candidatos:** N/A.
* **Decisión:** Construir (P0, W1).

### Importación / Exportación
* **Hoy:** Presente (exportación CSV en comisiones/reportes).
* **Falta:** Importador genérico, mapeador de campos, validación en masa.
* **Candidatos:** N/A.
* **Decisión:** Construir (P1, W2).

### Deduplicación E.164
* **Hoy:** Ausente.
* **Falta:** Normalización estricta de números, merge automático.
* **Candidatos:**
  - catamphetamine/libphonenumber-js: Licencia: MIT, Fecha: 2026-06-18, Estrellas: 2998, Stack: JavaScript, Modo: APP.
* **Decisión:** Integrar (P0, W1).

### Portal del Broker
* **Hoy:** Ausente.
* **Falta:** Acceso restringido a inventario compartido, subida de leads propios, marca blanca.
* **Candidatos:** N/A.
* **Decisión:** Construir (P0, W2).

### Certificación y Seguimiento
* **Hoy:** Ausente.
* **Falta:** Emisión de diplomas, perfil público de broker certificado.
* **Candidatos:**
  - moodle/moodle: Licencia: GPL-3.0, Fecha: 2026-10-03, Estrellas: 7461, Stack: PHP, Modo: RUN, Puerto: AprendizajePort.
  - rappe/lms: Licencia: AGPL-3.0, Fecha: 2026-10-03, Estrellas: 3285, Stack: TypeScript, Modo: RUN, Puerto: AprendizajePort.
* **Decisión:** Integrar (P1, W2).

## Fuentes
* GitHub API para licencias y datos: https://api.github.com/repos/<owner>/<repo>
* Arquitectura VRE: .viltrum/vre-os/ARQ-VRE-002-integraciones.md
* Inventario actual: Verificación en src/app/(crm)/ y src/application/

## Cambios respecto a la versión anterior
- Corrección de OpenProperty a `clawnify/OpenProperty` con licencia MIT y módulo Rentas (P1, W4b).
- URLs de `prolink` y `reality-crm` añadidas y marcadas como REFERENCE_ONLY.
- Corrección de estados "Ausente" a "Presente" (Auditoría, Notificaciones, PWA/Offline, Import/Export) en base al código fuente.
- Especificación sobre Brokers, Academy y Comisiones (qué se integra y qué se construye).
- Marcado de licencias `NOASSERTION` y aclaración de n8n no siendo OSI open source.

## Handoff
D03: El barrido está completo según los parámetros exigidos. 
- **Licencias:** Hemos marcado a n8n, twenty, chatwoot, novu, formbricks, posthog, meilisearch y papermark como NOASSERTION, por ser fair-code u otras licencias custom que impiden distribuirlo como código abierto estándar. Deberán evaluarse restricciones específicas de uso comercial. Los candidatos GPL-3.0 (Moodle) y AGPL-3.0 (Frappe LMS) están confinados exclusivamente a modo RUN detrás de AprendizajePort para no contaminar el CRM. Las licencias ausentes (OpenProperty) y repositorios privados (Prolink, Reality CRM) se han catalogado estrictamente como REFERENCE.
- **Estrategia:** La priorización se asigna balanceando lo requerido en fase PRO para República Dominicana (Confotur, manejo USD/DOP, gestión de contactos diáspora). 
- **Entregables generados:** .viltrum/vre-os/D21-cobertura-modulos.md y .viltrum/vre-os/oss-registry.json. No se modificó ningún otro archivo. Ninguna credencial ni variable de entorno ha sido filtrada o registrada.
