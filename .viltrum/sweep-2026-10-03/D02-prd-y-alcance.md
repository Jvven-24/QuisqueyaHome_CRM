# D02 · Especificación de Producto y Alcance (PRD M01–M15) · QuisqueyaHome CRM

**Fecha:** 2026-10-03  
**Perfil:** D02 Product Management & Requisitos  
**Revisor Independiente:** D04 UX Research  
**Estado:** Definido

---

## 1. Visión del Producto
QuisqueyaHome CRM es la plataforma de gestión operativa para agencias inmobiliarias y brokers especializados en el mercado de alta gama y turismo de inversión en República Dominicana. Combina velocidad operativa, cálculo tributario automatizado bajo la Ley 158-01 (Confotur), y sincronización en tiempo real con el portal inmobiliario.

## 2. Inventario de Módulos (M01 – M15)

### M01 · Leads Inmobiliarios & Scoring
- Captura multicanal (PortalWeb, YouTube, referidos, ferias de inversión en la diáspora).
- Scoring por capacidad financiera, urgencia de compra y afinidad con proyectos turísticos.

### M02 · Extractor y Triaje HITL de Notas de Voz
- Transcripción y procesamiento de notas de voz de clientes (WhatsApp/Telegram).
- Detección automática de zonas dominicanas (Bávaro, Punta Cana, Cap Cana, Piantini), presupuesto en USD y fecha límite.
- Aprobación en 1 clic antes de impactar el registro oficial.

### M03 · Embudo de Ventas Kanban (6 Etapas Validadas)
- Etapas: `Nuevo` → `Contactado` → `Presentación` → `Preselección` → `Negociación` → `Cierre (Ganado/Perdido)`.
- Requisitos estrictos de transición (no se permite avanzar a Negociación sin monto, porcentaje de comisión y fecha tentativa de cierre).

### M04 · Motor Fiscal Confotur (Ley 158-01)
- Exención del 3% del impuesto de transferencia inmobiliaria.
- Exención anual del 1% del Impuesto a la Propiedad Inmobiliaria (IPI) durante 15 años.
- Generación de cotizaciones y planes de pago estándar (Reserva US$2,000 / 10-20% Inicial / 30-40% Construcción / 50% Contra entrega).

### M05 · Propiedades & Unidades Disponibles
- Catálogo de desarrollos turísticos y residenciales.
- Asociación directa de deals a inventario físico y disponibilidad.

### M06 · Contactos & Libreta de Inversionistas
- Ficha unificada 360° con perfil de comprador (inversionista local, dominicano ausente en NY/FL/Madrid, extranjero retiro).
- Historial consolidado de comunicaciones y propiedades de interés.

### M07 · Agenda & Citas (RFC 5545 iCalendar)
- Agendamiento de reuniones presenciales y tours virtuales.
- Exportación universal de archivos `.ics` compatibles con Google Calendar, Apple Calendar y Outlook.

### M08 · Comisiones & Liquidaciones
- Cálculo de comisiones sobre precio final de venta.
- Matriz de splits: Agencia (ej. 50%), Broker Captador (25%), Broker Cerrador (25%).
- Máquina de estados estricta e inmutable: `Pending` → `Approved` → `Paid` (o `Void`).

### M09 · Metas Mensuales y Pronóstico Ponderado
- Configuración de objetivos por broker (volumen en US$ y cantidad de cierres).
- Cálculo dinámico de probabilidad ponderada en el pipeline.

### M10 · Quisqueya Academy LMS
- Escuela de corretaje digital para brokers y agentes asociados.
- Módulos formativos sobre Ley Confotur, fideicomisos inmobiliarios, ley de lavado de activos (Ley 155-17) y ventas a la diáspora.
- Indicador radial de certificación en tiempo real.

### M11 · Comunicaciones Multicanal
- Generación de enlaces universales `t.me` mediante Telegram Bot API oficial (cero costo por mensaje).
- Generación de enlaces profundos `wa.me` para WhatsApp con plantillas parametrizadas (`{nombre}`, `{proyecto}`, `{precio_desde}`).

### M12 · Reportes & Business Intelligence
- Análisis de embudo de conversión, distribución de canales de atracción, ranking de zonas con mayor demanda y motivos de pérdida.
- Exportación instantánea a CSV bajo estándar RFC 4180 con protección contra inyección de fórmulas.

### M13 · Auditoría y Registro Inmutable (`audit_log`)
- Registro de auditoría para cada mutación de datos con autor, IP, estado anterior y nuevo estado serializado en JSON.

### M14 · Dashboard Ejecutivo Multi-Rol
- Vistas personalizadas por rol: Administrador (visión 360° de la empresa), Broker (cartera individual y metas), Asistente (leads entrantes y citas de hoy).

### M15 · Papelera Segura y Recuperación
- Soft-delete en todas las entidades críticas (`deletedAt`) con capacidad de restauración y aislamiento de visibilidad vía RLS.
