# Comunicaciones

## Propósito
Centro de mensajes a clientes: plantillas con variables, despacho auditado por canal (WhatsApp, email, SMS, Telegram, webhook), registro de actividad de contacto y, a futuro, bandeja de conversaciones y campañas segmentadas.

Buenas prácticas de industria (RD, WhatsApp y correo):
- Fuera de la ventana de 24 h de WhatsApp, solo se envían plantillas aprobadas por Meta.
- Consentimiento y baja (opt-out) registrados por contacto y por canal, con la Ley 172-13 de protección de datos como referencia. Un contacto sin consentimiento de comunicaciones comerciales no recibe campañas.
- Variables sin valor bloquean el envío (nunca salen `{{nombre}}` al cliente).
- Contenido con términos fiscales (Confotur, IPI, exenciones) requiere revisión antes de enviar.
- Correo con SPF, DKIM y DMARC configurados en el dominio.
- Límite de frecuencia por contacto para que una campaña no sature.
- Registro de entrega, lectura y error por mensaje, con el proveedor (YCloud) como fuente.

## Roles y permisos
Recurso RBAC: `communications` (view, create, edit). El despacho exige alcance `all` (`requireFullScope`).

| Rol (slug) | Acciones | Alcance | Efecto |
|---|---|---|---|
| Administrador (`admin`) | view, create, edit, delete | all | Gestiona plantillas y despacha |
| Asistente (`assistant`) | view, create, edit | all | Gestiona plantillas y despacha |
| Broker (`broker`) | view; create | all (view); own (create) | Ve plantillas, crea las propias, no despacha |
| Gerente (`manager`) | Sin fila en el seed | — | Sin acceso al módulo |

- Canales configurados (`GET /api/comunicaciones/canales`): `view`.
- Bandeja, campañas y actividad: `requireScopeInPage(communications, view)`.
- Registro de actividad además exige `activities:view`.
- Decisión a confirmar: si el gerente debe ver plantillas de su equipo, falta una fila en el seed.

## Flujos principales
1. Ver plantillas (`GET /api/comunicaciones/plantillas`) y el estado de cada canal (`GET /api/comunicaciones/canales`).
2. Crear plantilla: nombre, categoría, canal (por defecto WhatsApp), cuerpo con variables `{{...}}` (`POST`).
3. Editar plantilla (`PATCH /api/comunicaciones/plantillas/[id]`). No hay borrado: desactivar con `is_active`.
4. Revisión fiscal: si el texto contiene términos fiscales, la UI lo marca y el servidor rechaza el envío.
5. Preparar envío: elegir plantilla y destinatario. El sistema sustituye variables, exige que no quede ninguna sin valor, y normaliza el teléfono con código de país (WhatsApp y SMS).
6. Despachar (`POST /api/comunicaciones/despachar`): valida permiso, registra la auditoría del envío y devuelve el destinatario enmascarado.
7. Ver la actividad de comunicación de los últimos 30 días (llamadas, correos y WhatsApp) en `comunicaciones/actividad`.
8. Recibir estados del proveedor por webhook (`/api/integraciones/webhooks/whatsapp`). Hoy no llegan a una bandeja.
9. Bandeja y campañas: vistas previas de ejemplo.

## Datos
- `message_templates`: `name`, `category`, `channel` (por defecto whatsapp), `body`, `variables` (JSON), `is_active`, autoría y timestamps.
- Canales: `CANALES_COMUNICACION` = telegram, whatsapp, email, sms, webhook. Las cuentas están en `integration_accounts`; los tokens se guardan cifrados en servidor.
- `webhook_inbox` y `outbox`: eventos entrantes y salientes, con idempotencia.
- `audit_log`: auditoría de cada despacho (`AuditoriaDespachos`).
- **Faltan:** tabla de conversaciones y mensajes (bandeja); tabla de entregas por mensaje (estado, lectura, error); tabla de consentimientos y bajas; campañas propias (`marketing_campaigns` es de gasto de marketing, no de envíos).

## Estados de UI
| Estado | Situación en código | Qué debe mostrar |
|---|---|---|
| Vacío | No verificado en `comunicaciones/vista.tsx` | "Sin plantillas" con acción de crear |
| Cargando | Falta: no hay `loading.tsx` en el segmento | Esqueleto de la lista de plantillas |
| Error | Parcial: inline en la vista (`setErrorMensaje`); sin `error.tsx` propio | Mensaje junto al formulario, sin perder el texto |
| Sin permiso | Sí: `requireScopeInPage(communications, view)` | Aviso de permiso |
| Éxito | No verificado | "Plantilla guardada" o "Mensaje enviado" con la auditoría |
| Parcial | Sí: estado por canal (`consultarEstadosCanales`) | Canal sin configurar o con error, sin bloquear los demás |

## Estado actual vs PRD
Fuentes: código en `/tmp/qh-review` y `AUDITORIA-MODULOS.md` (27/10/2026, Comunicaciones: severidad Alta).

- **Existe y funciona:** plantillas (crear, editar), canales con estado, despacho con validaciones (variables, fiscal, teléfono), auditoría y enmascarado del destinatario, actividad real de 30 días.
- **Es demo:** bandeja (hilos de ejemplo en `_ejemplo.ts`) y campañas (`campanasEjemplo`).
- **Falta:** bandeja real de WhatsApp e Instagram (YCloud ya tiene el relay); registro de entrega y lectura; consentimiento y baja; borrado o archivo de plantillas en uso; límite de longitud en el despacho (según auditoría).
- **PRD (compendio):** no define requisitos de comunicaciones. El compendio menciona "Brokers, clientes, favoritos" y "CMS, métricas, agenda" como fases, pero sin criterios funcionales.

## Checklist de aceptación
- [x] Plantillas con variables y canal por plantilla
- [x] Bloquear envío con variables sin valor
- [x] Bloquear envío con contenido fiscal sin revisión
- [x] Despachar solo con alcance total (admin y asistente)
- [x] Destinatario enmascarado y auditoría de envío
- [x] Estado por canal visible en la pantalla
- [ ] Bandeja real de WhatsApp e Instagram
- [ ] Registro de entrega y lectura por mensaje
- [ ] Consentimiento y baja registrados (Ley 172-13)
- [ ] Campañas segmentadas con tope de frecuencia
- [ ] Borrar o archivar plantillas en uso

## Dependencias
- **Contactos y leads:** destinatarios y consentimiento por contacto.
- **Agenda y Tareas:** registro de actividad (`whatsapp`, `email`, `call`).
- **Integraciones:** YCloud (WhatsApp), proveedor de correo, SMS, Telegram; `integration_accounts`, `webhook_inbox`, `outbox`.
- **Configuración:** cuentas de canal y catálogo de plantillas.
- **Automatizaciones:** envíos disparados por reglas (pendiente; hoy sin motor).
- **RBAC y auditoría:** `requireFullScope`, `audit_log`.
