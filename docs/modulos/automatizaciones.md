# Automatizaciones

## Propósito
Diseñar reglas de seguimiento automático (lead recibido, negocio sin próxima acción, cambio de etapa) y supervisar la cola de envíos. Hoy solo existe un constructor de borradores en memoria y un monitor de conteos reales del outbox. No hay motor de ejecución ni flujos activos.

Referencia del compendio (sección 4, "Integraciones y automatización"): lead inbound, reenganche de lead sin respuesta X días, actualización de obra (notificar), contenido nuevo y reporte semanal. El compendio deja fuera de alcance inicial las "automatizaciones complejas con múltiples terceros".

Buenas prácticas de industria (referencia, validar con el equipo):
- Primera respuesta a un lead en minutos; el disparador debe ser verificable y tener dueño.
- Cada ejecución registra disparador, condición evaluada, acción, resultado y quién activó la regla.
- Mensajes a clientes solo con consentimiento vigente (Ley 172-13) y plantilla aprobada.
- Límite de frecuencia por contacto y opt-out visible.
- Acciones que hablan con el cliente (WhatsApp, cambio de responsable) con revisión humana.
- Pausa global y reintentos con cola de fallidos (dead letter) visible.

## Roles y permisos
Recurso `settings`: ver con `view`, preparar cambios con `edit`. Ambos exigen alcance `all`; no hay filtro por fila.

- **Admin**: ver y editar (`all`). Debería ser el único que active reglas y reintente eventos.
- **Gerente** (`manager`): sin acceso hoy. Propuesto: ver el monitor de su equipo; crear borradores, no activar.
- **Broker**: sin acceso. Ve la pantalla "Sin permiso".
- **Asistente** (`assistant`): depende del seed, no verificado en `settings`. Propuesto: solo consulta del monitor.
- **Consulta (`readOnly`)**: solo `view`. La UI muestra "Permiso de consulta" y deshabilita el constructor.

Acciones previstas `activate` y `retry` deberían exigir `requireFullScope` y rol admin. Hoy no existen como endpoints.

## Flujos principales
1. El usuario abre Automatizaciones. La página exige `settings:view` con alcance `all`; si no, responde 403.
2. En **Constructor**, elige una plantilla ("Bienvenida desde Meta" o "Seguimiento sin próxima acción") o parte de cero.
3. Define nombre (máx. 100), disparador (lead recibido desde Meta, lead nuevo, negocio sin próxima acción, cambio de etapa), condición (máx. 500, verificable) y de 1 a 4 acciones en orden.
4. "Conservar borrador de sesión" valida con `validarFlujo` (zod) y muestra los errores. El borrador queda en memoria del tab y se pierde al recargar. El aviso dice que no está activado.
5. "Revisar activación" abre un diálogo. Hoy responde que no se activó porque falta el motor persistente.
6. En **Monitor real**, muestra pendientes, enviados, fallidos y sin consumidor, y la fecha del último envío (zona America/Santo_Domingo). "Actualizar conteos" recarga la página.
7. "Revisar reintentos" solo se habilita si hay fallidos. Hoy no reintenta: falta el contrato administrativo.
8. En **Copiloto**, genera un texto de ejemplo a partir de un lead ficticio. Exige marcar "He revisado" antes de "Revisar envío supervisado", que no envía nada.

Flujo objetivo (no construido): disparador → condición → acciones (asignar, crear tarea, preparar WhatsApp como borrador) → aprobación si hay mensaje a cliente → registro en `audit_log` → monitor por evento.

## Datos
Tablas existentes:
- `outbox` y `outbox_dead`: cola de eventos y cola muerta. Se leen con `consultarEstadoOutbox`.
- `message_templates`: plantillas que usaría la acción de WhatsApp.
- `webhook_inbox`: entrada de eventos externos (origen de leads).

Entidades que faltan (propuestas):
- `automation_rules`: id, nombre, disparador (enum), condición, acciones (ordenadas, máx. 4), estado (borrador, activa, pausada), versión, creado_por, activado_por, activado_en.
- `automation_runs`: regla_id, evento_id, resultado, error, ejecutado_en. Idempotente por (regla_id, evento_id).

Modelo de borrador en código (`application/reportes/automatizaciones.ts`): `FlujoBorrador` con los disparadores `lead-meta`, `lead-nuevo`, `negocio-sin-accion`, `cambio-etapa` y las acciones `asignar`, `borrador-whatsapp`, `crear-tarea`, `avisar-supervisor`.

## Estados de UI
- **Vacío**: "No hay borradores conservados." (verificado).
- **Cargando**: `loading.tsx` muestra "Cargando permisos y estado de la cola…" (verificado).
- **Error**: `error.tsx` muestra "No se pudieron cargar las automatizaciones" con botón de reintento (verificado). Si la cola no se lee: "No se pudo leer la cola. No se sustituyen sus conteos por ceros." (verificado).
- **Sin permiso**: `forbidden()` en la página. Con permiso solo de consulta, aparece el aviso y se deshabilitan las acciones (verificado).
- **Éxito**: "Borrador guardado en memoria de esta pestaña. No está activado ni persistido" (verificado). No existe éxito de activación.
- **Parcial**: el monitor muestra conteos y "Sin registro disponible" si no hay último envío. Sin conexión, guardar y solicitar acciones quedan en pausa (verificado).

## Estado actual vs PRD
- **Existe y es real**: página protegida por permiso; conteos reales del outbox; validación del borrador (zod); estados de sin conexión y de solo consulta; pruebas unitarias del modelo (`automatizaciones.test.ts`, no ejecutadas en esta revisión).
- **Es vista previa o de ejemplo**: el constructor se rotula "Vista previa · datos de ejemplo"; el copiloto usa `LEAD_EJEMPLO` ("Cliente de ejemplo"); los diálogos de activación, reintento y envío no escriben nada.
- **Falta**: persistencia de reglas, motor de ejecución, activación auditada, reintentos, permisos por acción, revisión humana para WhatsApp y copiloto con proveedor de IA y contexto autorizado.
- **Auditoría 27/10/2026**: "No hay motor y los borradores solo viven en memoria". Confirmado en código. Prioridad media.

## Checklist de aceptación
- [x] Página exige settings:view con alcance total
- [x] Monitor muestra conteos reales del outbox
- [x] Sin conexión pausa guardar y solicitar acciones
- [x] Borrador validado: nombre, condición y acciones
- [ ] Reglas persistidas con versión y auditoría
- [ ] Motor ejecuta reglas con idempotencia por evento
- [ ] Activación solo admin, con motivo registrado
- [ ] Reintento de eventos fallidos con contrato admin
- [ ] Permiso por acción: asignar, tarea, WhatsApp
- [ ] WhatsApp como borrador revisado, nunca envío directo
- [ ] Copiloto con proveedor IA y cola de revisión

## Dependencias
- Outbox y workers (`infrastructure/integraciones/outbox`, consumidores por defecto).
- Comunicaciones: plantillas y canal WhatsApp/IG (YCloud).
- Leads y Negocios: disparadores `lead-meta`, `negocio-sin-accion`, `cambio-etapa`.
- Actividades/Tareas: acción `crear-tarea`.
- Brokers y asignación: acción `asignar`.
- Contactos: consentimiento antes de cualquier mensaje.
- Acceso/RBAC: recurso `settings` y futuros permisos por acción.
- Integración Meta Lead Ads como origen de leads.
