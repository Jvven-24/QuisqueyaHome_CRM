# Auditoría funcional del CRM Quisqueya Home

Fecha de revisión: 24 de julio de 2026

## 1. Dictamen ejecutivo

El CRM actual funciona como un prototipo navegable de alta fidelidad. Permite probar estructura, roles, módulos y algunos flujos, pero todavía no es un sistema de operación diaria.

La brecha principal no es visual ni de cantidad de pantallas. Es de confiabilidad:

1. Los datos no persisten al recargar.
2. El inicio de sesión y los permisos solo se simulan en el navegador.
3. Las métricas, metas y comisiones no se calculan desde registros reales.
4. Las comunicaciones no se guardan en el historial del cliente.
5. Las integraciones todavía no tienen identidad, tokens, webhooks ni sincronización.

La recomendación es mantener el alcance pequeño y convertir primero el núcleo `Lead -> Actividad -> Negocio -> Cierre` en una fuente de verdad. Avance de obra, inventario privado y Academy deben mantenerse como diferenciadores, pero no deben distraer de esa base.

## 2. Escala de referencia

La escala recomendada para el MVP es:

- 3 a 10 usuarios internos.
- Un administrador, una asistente y varios brokers.
- Un único negocio inmobiliario, sin red de agencias externas.
- Un pipeline comercial principal.
- Decenas o cientos de leads mensuales, no millones.
- Automatizaciones cortas y explícitas, no un constructor empresarial de workflows.

No conviene copiar Salesforce, Dynamics ni las capas avanzadas de HubSpot Enterprise. Para esta escala, las referencias más útiles son:

- **Pipedrive:** disciplina de actividades, próxima acción y calendario.
- **Bigin by Zoho:** alcance pequeño, pipelines, campos obligatorios, automatizaciones sencillas e integraciones esenciales.
- **Follow Up Boss:** captación y asignación inmobiliaria, velocidad de respuesta e historial de comunicación.
- **HubSpot Sales Hub Starter:** ficha unificada, tareas, reuniones y automatización básica.

## 3. Comparación con CRM líderes

| Capacidad | Quisqueya Home actual | Referencia del mercado | Brecha |
|---|---|---|---|
| Pipeline visual | Disponible y permite cambio de etapa | Pipedrive y Bigin agregan reglas, campos obligatorios, actividades y alertas de estancamiento | Alta |
| Próxima acción | Visible como texto de demostración | Pipedrive centra la operación en actividades asociadas a leads y negocios | Alta |
| Asignación de leads | Simulada por broker | Follow Up Boss ofrece reglas por zona, precio, fuente, round-robin y first-to-claim | Alta |
| Historial del contacto | Vista de demostración | Follow Up Boss y HubSpot registran email, llamadas, mensajes, reuniones, tareas y notas en una línea de tiempo | Crítica |
| Calendario | Agenda local con citas de ejemplo | Pipedrive, Bigin y HubSpot sincronizan calendarios externos y evitan doble reserva | Alta |
| Comunicación | Plantilla y enlace a WhatsApp | Bigin y Follow Up Boss guardan conversaciones y automatizan respuestas iniciales | Alta |
| Automatización | No existe motor de reglas | Bigin permite workflows y automatización por etapa; Follow Up Boss usa Action Plans | Alta |
| Datos y auditoría | Datos en memoria | Bigin incluye campos obligatorios/únicos, importaciones, backups, auditoría y papelera | Crítica |
| Reportes | Gráficas fijas | Los referentes calculan conversión, velocidad, actividad, fuente y forecast desde datos reales | Crítica |
| Seguridad | Selector de rol en cliente | Los referentes aplican permisos en servidor, sesiones, auditoría y controles de acceso | Crítica |
| Inventario inmobiliario | Fuerte y adaptado al negocio | Los CRM generalistas requieren personalización; FUB se enfoca más en leads que en obra | Ventaja |
| Avance de obra | Diferenciador claro | No es una función central en los CRM comparados | Ventaja |
| Academy | Diferenciador para crecimiento del equipo | Los CRM comparados dependen de herramientas externas o contenido separado | Ventaja |

Fuentes oficiales consultadas:

- [Pipedrive: calendario y sincronización](https://www.pipedrive.com/en/features/activity-calendar)
- [Pipedrive: actividades y metas](https://www.pipedrive.com/en/features/activities-goals)
- [Pipedrive: sincronización de calendario](https://support.pipedrive.com/en/article/calendar-sync)
- [Bigin: funciones para pequeñas empresas](https://www.bigin.com/features/)
- [Bigin: pipelines y actividades](https://help.zoho.com/portal/en/kb/bigin/modules/pipelines/articles/pipeline-records)
- [Bigin: configuración, datos, workflows y canales](https://help.zoho.com/portal/en/kb/bigin/get-started-with-bigin/articles/explore-settings)
- [Follow Up Boss: asignación inmobiliaria](https://www.followupboss.com/features/lead-routing)
- [Follow Up Boss: Action Plans](https://help.followupboss.com/hc/en-us/articles/1500008539982-Action-Plans-Overview)
- [Follow Up Boss: comunicaciones e historial](https://www.followupboss.com/features/texting)
- [HubSpot: funciones para equipos de ventas pequeños](https://www.hubspot.com/products/sales/small-business-sales-software-guide)
- [HubSpot: sincronización de calendario](https://knowledge.hubspot.com/integrations/use-hubspots-integration-with-google-calendar-or-outlook-calendar)

## 4. Hallazgos críticos

### F01. No existe persistencia

**Estado actual:** leads, tareas, citas, progreso, permisos y Academy se guardan con `useState`. La carpeta `db/` no contiene tablas.

**Riesgo:** cualquier recarga elimina cambios. Dos usuarios no pueden compartir información.

**Ajuste mínimo:** crear base de datos para usuarios, contactos, leads, negocios, actividades, proyectos, unidades, fases, archivos, metas, comisiones e integraciones.

### F02. Autenticación y RBAC son demostrativos

**Estado actual:** se puede elegir Administrador, Asistente o Broker desde un selector. Los permisos solo ocultan componentes.

**Riesgo:** cualquier usuario podría cambiar su perfil. Los precios reales, comisiones y métricas no están protegidos en servidor.

**Ajuste mínimo:** identidad real, sesión segura, membresía organizacional y verificación de rol en cada lectura y escritura.

### F03. La oportunidad no es todavía la fuente de verdad

**Estado actual:** lead y negocio comparten el mismo objeto. No existe una separación persistente entre contacto, lead, oportunidad y actividad.

**Riesgo:** duplicados, cierres mal contabilizados y pérdida de historial cuando un contacto tiene varias oportunidades.

**Ajuste mínimo:** entidades separadas:

`Contacto -> Lead -> Negocio -> Actividades`

Un contacto puede tener varios leads y negocios. Un negocio puede relacionarse con varias propiedades.

### F04. Métricas, metas y comisiones son fijas

**Estado actual:** cifras y gráficas están escritas en la interfaz.

**Riesgo:** el usuario podría tomar decisiones sobre datos que no corresponden a la operación.

**Ajuste mínimo:** calcular desde eventos de dominio:

- Al mover a `Cierre`, registrar fecha, monto y responsable.
- Actualizar meta mensual.
- Calcular nivel anual del broker.
- Generar comisión pendiente.
- Mantener registro de auditoría.

La operación debe ser transaccional para evitar que solo una parte se actualice.

### F05. No hay controles de calidad de datos

Faltan:

- Normalización de teléfonos.
- Email y teléfono únicos cuando corresponda.
- Detección y fusión de duplicados.
- Campos obligatorios por etapa.
- Motivo obligatorio al marcar `Perdido`.
- Validación de una o más propiedades antes de `Preselección`.
- Monto, probabilidad, comisión y fecha antes de `Negociación`.
- Documentos y validación antes de `Cierre`.
- Registro de quién cambió cada dato y cuándo.

## 5. Hallazgos de alta prioridad

### F06. Próxima acción no obligatoria

Cada negocio abierto debe tener responsable, tipo de actividad y fecha. Si no existe próxima acción, debe aparecer en una cola de riesgo.

Implementación recomendada:

- Indicador `Sin próxima acción`.
- Actividades vencidas.
- Negocios estancados por etapa.
- Vista diaria `Qué debo hacer hoy`.
- Recordatorio al broker y escalamiento a Alexandra/Ismael según SLA.

### F07. Asignación de leads insuficiente

La regla inicial debe ser pequeña y explicable:

1. Alquiler -> broker especialista en alquiler.
2. Proyecto con broker asignado -> ese broker.
3. Lead de alto presupuesto -> Ismael o broker autorizado.
4. Sin coincidencia -> bandeja de Alexandra.
5. Si no se contacta dentro del SLA -> reasignación manual sugerida.

No se recomienda todavía construir round-robin, lead ponds o scoring predictivo. Añadirlos cuando el volumen lo justifique.

### F08. Historial de comunicación incompleto

La ficha del contacto debe registrar:

- Llamada iniciada o completada.
- WhatsApp abierto y, en una fase con API, mensajes enviados/recibidos.
- Email enviado/recibido.
- Cita creada, modificada, cancelada o completada.
- Nota y archivo.
- Cambio de broker, etapa, monto o propiedad.

### F09. Filtros y acciones parcialmente decorativos

Varios filtros y botones existen visualmente, pero no modifican datos. Antes de producción, cada control debe:

- Ejecutar una acción real.
- Mostrar error si falla.
- Confirmar éxito.
- Respetar permisos.
- Registrar auditoría cuando cambia datos.

### F10. Falta importación, exportación y recuperación

Mínimo necesario:

- Importar contactos/leads desde CSV con previsualización y detección de duplicados.
- Exportar datos permitidos por rol.
- Backup programado.
- Papelera con recuperación.
- Registro de importaciones y errores.

## 6. Integraciones recomendadas

### Prioridad 1. Google Calendar

**Disponible ahora en el prototipo:**

- Abrir cada cita en Google Calendar.
- Exportar la agenda como `.ics`.

**Fase de producción:**

- OAuth 2.0 por usuario.
- Sincronización CRM -> Google.
- Posteriormente, sincronización de dos vías.
- Guardar `external_event_id`, calendario, usuario, estado de sync y última versión.
- Webhook HTTPS para cambios externos.
- Reintentos idempotentes y prevención de duplicados.

Google exige proyecto Cloud, pantalla de consentimiento, cliente OAuth y scopes. Las notificaciones requieren un webhook HTTPS. Debe solicitarse el scope mínimo necesario.

Fuentes:

- [Google Calendar API: inicio para JavaScript](https://developers.google.com/workspace/calendar/api/quickstart/js)
- [Google Calendar: scopes OAuth](https://developers.google.com/workspace/calendar/api/auth)
- [Google Calendar: push notifications](https://developers.google.com/workspace/calendar/api/guides/push)

### Prioridad 2. WhatsApp Business

**Disponible ahora:**

- Click-to-chat desde el lead.
- Plantillas con variables.

**Fase de producción:**

- Número empresarial de Alexandra.
- Consentimiento y origen del opt-in.
- Plantillas aprobadas.
- Webhook para mensajes entrantes y estados.
- Historial asociado al contacto.
- Asignación de conversación al broker.
- Cola de fallos y reintentos.

No se recomienda automatizar campañas masivas en el MVP.

### Prioridad 3. Captura del portal y Meta Lead Ads

Todo lead debe entrar por un único endpoint con:

- Firma o secreto de origen.
- Idempotencia.
- UTM, fuente, campaña y contenido.
- Fecha y consentimiento.
- Detección de duplicado.
- Regla de asignación.
- Creación automática de primera actividad.

Primero conectar el portal propio. Meta Lead Ads debe entrar después, cuando el flujo de consentimiento y asignación esté probado.

### Prioridad 4. YouTube

Primera fase:

- Guardar y validar URL/video ID.
- Mostrar miniatura, título, canal y fecha.
- Asociar video de origen al lead.

Segunda fase:

- Importar videos del canal o una playlist de proyectos.
- Respetar cuota y cachear respuestas.

La API de YouTube permite consultar videos y playlists con API key; las operaciones privadas o de escritura requieren OAuth.

Fuente: [YouTube Data API](https://developers.google.com/youtube/v3/getting-started)

### Prioridad 5. Zoom o Google Meet

Primera fase:

- Guardar enlace manual en la cita.

Segunda fase:

- Crear reunión al confirmar una cita.
- Guardar ID externo.
- Registrar asistencia o finalización.
- Crear actividad de seguimiento.

Zoom usa OAuth y webhooks para integraciones por usuario.

Fuente: [Zoom OAuth apps](https://developers.zoom.us/docs/integrations/)

## 7. Modelo funcional mínimo

Entidades principales:

- `users`
- `roles`
- `contacts`
- `leads`
- `deals`
- `deal_properties`
- `activities`
- `projects`
- `units`
- `construction_phases`
- `construction_updates`
- `files`
- `goals`
- `commissions`
- `academy_items`
- `academy_progress`
- `message_templates`
- `integration_accounts`
- `external_events`
- `audit_log`

Campos transversales:

- `id`
- `created_at`
- `updated_at`
- `created_by`
- `updated_by`
- `organization_id`
- `deleted_at` para recuperación cuando aplique

## 8. Automatizaciones del MVP

Solo cinco:

1. Nuevo lead -> sugerir/asignar broker y crear tarea de contacto.
2. Lead sin contacto dentro del SLA -> alerta.
3. Cambio de etapa -> crear próxima actividad según plantilla.
4. Perdido -> exigir motivo y cerrar actividades futuras.
5. Cierre -> actualizar meta, nivel y comisión en una transacción.

Todo lo demás debe permanecer manual hasta que exista suficiente volumen y datos limpios.

## 9. Indicadores que sí importan

Para administración:

- Tiempo medio hasta primer contacto.
- Leads sin asignar.
- Leads sin próxima acción.
- Actividades vencidas.
- Conversión por etapa.
- Días promedio por etapa.
- Pérdidas por motivo.
- Conversión por fuente, proyecto y broker.
- Valor ponderado del pipeline.
- Cierres y comisión por mes.

Para broker:

- Acciones de hoy.
- Leads sin respuesta.
- Citas próximas.
- Negocios estancados.
- Meta mensual.
- Comisiones propias cuando el alcance lo autorice.

No se recomienda agregar más gráficos hasta que estos indicadores se calculen desde datos reales.

## 10. Hoja de ruta priorizada

### P0. Fundamento de producción

- Base de datos y migraciones.
- Autenticación real.
- RBAC en servidor.
- CRUD de contacto, lead, negocio y actividad.
- Auditoría.
- Validación y errores.
- Pruebas de flujos críticos.

### P1. Operación comercial

- Próxima acción obligatoria.
- SLA y cola diaria.
- Reglas de asignación.
- Motivos de pérdida.
- Cierre transaccional.
- Metas y comisiones calculadas.
- Importación CSV y deduplicación.

### P2. Integraciones

- Google Calendar por usuario.
- Captura del portal.
- WhatsApp Business.
- YouTube.
- Zoom/Meet.
- Meta Lead Ads.

### P3. Diferenciadores

- Archivos y evidencias de obra.
- Publicación segura al portal.
- Academy persistente.
- Progreso y onboarding de broker.
- Recomendación de propiedades basada en presupuesto y preferencias.

## 11. Criterio de salida a producción

El CRM puede considerarse listo para operación cuando:

- Un usuario no autorizado no puede leer ni modificar datos restringidos.
- Los cambios persisten y tienen autor/fecha.
- Crear lead, asignar, contactar, mover, perder y cerrar tienen pruebas.
- Cierre actualiza metas y comisiones una sola vez.
- Los duplicados principales se detectan.
- Cada oportunidad abierta tiene próxima acción.
- La agenda exporta y sincroniza sin duplicar eventos.
- Los fallos de integración se registran y pueden reintentarse.
- Existe backup y restauración probada.
- Métricas y reportes provienen de datos, no de constantes de interfaz.

## 12. Recomendación final

La identidad funcional correcta para Quisqueya Home no es “un CRM con muchas secciones”. Es:

> Un sistema inmobiliario privado que asegura que cada lead tenga responsable y próxima acción, conserva todo el contexto de YouTube/WhatsApp, protege el inventario real y convierte el cierre en metas, comisiones y seguimiento de obra.

Ese núcleo es pequeño, diferenciador y defendible. La siguiente inversión debe ir a datos, seguridad y seguimiento antes que a agregar módulos.
