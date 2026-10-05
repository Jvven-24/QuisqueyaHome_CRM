---
id: M01
nombre: Leads
estado: REVIEW
riesgo: R3
owner: D10
revisores: [D02, D03, D12, D14, D07, Claude]
fuente_de_verdad: PostgreSQL local
depende_de: [M02, M03, M06, M11, M12, M14, G04, G05]
actualizado: 2026-10-04
---

# M01 · Leads

Entregable T-E1-2a, productor D01/Codex con contrato arquitectónico D03 solicitado en la tarea. **Nivel L1; revisión independiente pendiente.** No autoriza construcción, no aprueba G1/G2 ni declara E1.2 terminado. La ficha está completa como expediente de especificación, pero los contratos bloqueados en §9 impiden marcarla READY. Dependencias por identificador son vínculos conceptuales del catálogo, no evidencia de que sus fichas estén READY (`.viltrum/vre-os/FLUJO-PASADAS.md:50`).

Mandato: especificar la captación y gestión de leads a máxima capacidad, manteniendo sencillez, permisos y fuente local, con AS-IS separado del objetivo. Solo se escribe este archivo; no se cambia código, índice, base, infraestructura ni documentación externa. Fuentes revisadas por lectura estática; ninguna prueba funcional ni sesión de navegador ejecutada. `spec:check` es validación documental, no aprobación del productor.

Convención de evidencia: **HECHO** = implementación o declaración localizada; **REQUISITO FIRMADO** = decisión atribuida al cliente; **PROPUESTA** = contrato objetivo pendiente de revisión; **UNKNOWN** = dato o comportamiento no acreditado. Una prueba localizada no equivale a una corrida en verde.

## 1. Propósito y usuarios

**Problema:** el equipo comercial necesita reconocer cada solicitud entrante, su procedencia, responsable y seguimiento sin perder oportunidades ni consultar información ajena. El cliente explicó que muchas personas captadas por un proyecto terminan comprando otro y que negocios no concretados pueden reactivarse meses después. No se dispone de frecuencia cuantificada ni de una medición de tiempo perdido. Fuente primaria: `C:/Users/wilbe/Documents/QuisqueyaHome PortalWeb/.viltrum/inputs/whatsapp-qa-seguridad/texto/Expediente_Sprint1_CRM_Quisqueya_Home.md:201` y `:205` (en adelante **Expediente**).

**Objetivo medible del frente:** listado, filtros e inspector derivados de persistencia; cero cifras de negocio fijas; cero exposición entre carteras; una sola conversión y captura por operación concurrente; cobertura de seis estados y cuatro tamaños de pantalla. Es definición técnica de E1, no una métrica comercial aprobada (`.viltrum/vre-os/PLAN-E1.md:21`). Reducción de tiempo hasta primer contacto, SLA, usuarios concurrentes y éxito comercial: UNKNOWN; Q-1007.

| Actor | Trabajo principal | Regla objetivo y límite |
|---|---|---|
| Administrador | Revisar entradas, confirmar responsables, supervisar seguimiento y atribución; autorizar cambios pendientes | Alcance autorizado completo; único rol con métricas globales y precio real. Aprobador exacto de solicitudes de asistente por confirmar, Q-1001 |
| Broker | Encontrar sus leads, inspeccionar contexto, contactar, registrar seguimiento y convertir cuando proceda | Lectura y acciones sobre cartera autorizada; no cifras globales ni comisiones de terceros; reasignación a otro broker pendiente Q-1002 |
| Asistente | Preparar capturas y cambios, reunir contexto y solicitar aprobación | **Cada cambio requiere aprobación previa**, incluso notas/actividades/asignaciones; no basta con ocultar botones. Lectura según permiso; no publicación directa |
| Comprador/cliente final | Enviar solicitud desde portal y recibir información pública | Nunca obtiene sesión ni pantalla del CRM; envío mediado por servidor del portal |
| Portal/integración | Entregar una solicitud autenticada e idempotente | Actor técnico sin sesión humana; no obtiene listado ni capacidades administrativas |

Fuentes firmadas: Expediente `:1440` (varios negocios), `:1447` (contacto recontactable), `:1450` (asistente), `:1453` (datos restringidos), `:1457` (cliente externo), `:1461` (varias negociaciones por propiedad), `:1464` (baja lógica/auditoría). La tarea exige motivo y comentario al archivar negocio perdido; el Expediente `:206` dice que admite comentarios: se conserva la exigencia más estricta de la tarea para M03, sin fingir que existe ese contrato en M01.

**Invariantes REQ-L01…L09:**

| ID | Requisito / fuente | Aceptación |
|---|---|---|
| L01 | Lecturas con alcance, filtros URL y datos reales; tarea T-E1-2a y PLAN-E1 `:23` | CA-01, 02, 03, 06 |
| L02 | Captura con duplicados avisados, sugerencia de broker sin autoasignación; `docs/contexto/decisiones.md:99` y `:110` | CA-07, 08 |
| L03 | Un contacto puede sostener varios negocios; conversión no vende/reserva una propiedad; Expediente `:1440`, `:1461` | CA-10, 11 |
| L04 | Nada se elimina físicamente; descarte conserva contacto; Expediente `:1447`, `:1464` | CA-09 |
| L05 | Aprobación previa de cualquier cambio del asistente; Expediente `:1450` | CA-12 |
| L06 | Datos sensibles/globales solo para admin; cliente fuera del CRM; Expediente `:1453`, `:1457` | CA-06, 13, 20 |
| L07 | Salidas transaccionales, webhooks autenticados e idempotentes; ARQ-VRE-002 `:78`, `:89` | CA-14, 15, 16 |
| L08 | Experiencia PXIL, móvil y seis estados; `docs/DESIGN.md:67`, Constitución `:31` | CA-04, 05, 17 |
| L09 | Nota y estado de seguimiento en todos los módulos; tarea firmada (Acta reunión 2 referida, original no localizado en esta revisión) | CA-18; alcance fino Q-1003 |

Vocabulario visible: módulo de oportunidades **Negocios**, fase **presentación**, sin el término técnico prohibido en menús, exportaciones, ayudas o errores (`docs/contexto/decisiones.md:300`). M01 sigue llamándose Leads: solicitud entrante ≠ negocio. Identificadores internos existentes pueden conservarse. Las etapas comerciales son configurables; no confundirlas con los cinco estados técnicos actuales de leads. Rediseño profundo autorizado, conservando rapidez y legibilidad (`docs/contexto/decisiones.md:305`).

Línea base D01: auditoría, permisos granulares, búsqueda, recuperación lógica, historial y reportes exportables (`.viltrum/os/departments/D01-discovery/reference/expected-capabilities.md:39`). Importación masiva se excluye por tarea; exportación y recuperación se conectan a capacidades globales/M12/M14 y necesitan contrato propio. No se agregan capacidades por copiar una herramienta. Banco aplicado: CRM `question-bank.md:59`, RBAC `:143`, filtros `:177`, comunicaciones `:210`, aprobaciones `:234`, auditoría `:242`, colas `:266`, webhooks `:282` y offline `:290`, dentro del mismo directorio D01/reference.

## 2. Estado actual (AS-IS, del inventario P0)

| Área | HECHO observado y evidencia | Brecha frente al objetivo |
|---|---|---|
| Entrada `/leads` | Actor + `leads:view`, SQL con `visibleRows`, contacto/fuente/proyecto/dos aliases de usuario (`src/app/(crm)/leads/page.tsx:37`, `:59`, `:101`) | SQL aún dentro de página; falta puerto de lectura/`application/leads/consultas.ts` |
| Filtros | `q`, `source_id`, `status`, `page`, `lead`; nombre/teléfono/correo; 20 filas por página (`page.tsx:26`, `:40`) | No hay filtro servidor por broker, zona, campaña ni rango; el inventario `crm-as-is.md:30` menciona broker, pero el código no implementa ese filtro |
| Tabla y tabs | `DataTable`, búsqueda por Enter, WhatsApp/llamada, tabs por los cinco estados (`src/app/(crm)/leads/vista.tsx:126`, `:213`, `:271`, `:298`) | Contadores por estado calculados sobre la página ya filtrada, no sobre el universo; orden local de filas no acredita orden global; etiquetas y textos incrustados |
| Inspector | `?lead=id`, misma condición SQL que la lista, asignar/convertir/descartar y foco controlado (`page.tsx:129`; `inspector.tsx:34`, `:48`, `:73`, `:95`) | Sin pestañas de ficha 360; permisos de acción no llegan al componente; selección puede desaparecer por filtro, no solo por permiso |
| Historial | `Historial entidad="lead"` lee `audit_log` fecha/autor/acción (`page.tsx:156`; `src/app/(crm)/_ui/historial.tsx:60`) | No integra actividades ni describe cambios de estado; `asignar` y `descartar` caen en texto crudo (`historial.tsx:33`, `:95`). Visibilidad de auditoría no usa permiso propio |
| Alta | Zod + `leads:create`; entrada copiada campo por campo; contacto/lead y auditorías en transacción (`src/app/api/leads/route.ts:21`, `:84`, `:89`; `src/application/leads/casos-de-uso.ts:100`) | Los campos nuevos zona/campaña normalizadas no entran en contrato actual; contacto existente solo comprueba existencia, sin alcance (`casos-de-uso.ts:123`) |
| Asignación | Zod + `leads:edit`, broker activo, `reaches`, auditoría (`src/app/api/leads/[id]/route.ts:18`, `:30`; `casos-de-uso.ts:198`) | Solo escribe broker; **no cambia status a assigned** (`src/infrastructure/db/repos/leads.ts:270`); no bloqueo común, guarda de estado ni aprobación de asistente. H16 documentado: `own` puede reasignar a otro (`casos-de-uso.ts:192`) |
| Descarte | Motivo recortado obligatorio, permiso edit, guardas converted/discarded, auditoría (`src/app/api/leads/[id]/descartar/route.ts:23`; `casos-de-uso.ts:244`) | Validación manual sin Zod; no comentario separado, catálogo de motivos ni aprobación. Es cambio de estado, no baja lógica (`repos/leads.ts:279`) |
| Conversión | `leads:edit` + `deals:create`; fila bloqueada, etapa abierta por posición, negocio y lead en misma transacción (`src/app/api/leads/[id]/convertir/route.ts:25`; `src/application/leads/conversion.ts:26`; `repos/leads.ts:108`) | No outbox; no historial de etapa inicial escrito por este adaptador; no aprobación asistente. Un lead produce un negocio; varios leads/negocios por contacto siguen permitidos |
| Webhook | `POST /api/leads/externo`, token compartido, Zod, reserva advisory transaccional, recibo en auditoría, upsert parcial (`src/app/api/leads/externo/route.ts:65`; `repos/leads.ts:116`, `:230`) | No usa inbox de proveedores; sin autenticación por firma en esta ruta; conexión del portal no acreditada; no emisión al outbox |
| Estados | `loading.tsx:8`, `error.tsx:10`, vacío en `vista.tsx:363`, error offline en formulario `vista.tsx:453`, render de éxito y guarda de permiso `page.tsx:38` | No prueba de los seis estados de cada bloque; offline global/feedback de mutaciones/capturas UNKNOWN |
| Integraciones | `CrmPort` y tres tipos de evento presentes (`src/application/compartido/crm.ts:13`, `:20`); outbox en esquema `schema.ts:1131` | `ReposLeads` solo contiene leads/auditoría (`src/application/leads/puertos.ts:220`); **LeadAsignado no existe en catálogo, worker ni CHECK**. Sin `capacidades()` en CrmPort |

Volúmenes: inventario observado por P0, no vuelto a consultar por este productor: 648 leads, 184 negocios, 458 contactos, 1 803 actividades, **404 unidades y 13 perfiles broker** (`.viltrum/vre-os/spec/inventario/crm-as-is.md:221`, `:234`, `:236`, `:237`, `:238`, `:241`). La tarea/PLAN-E1 `:9` cita 400 unidades y 12 brokers. No se homogenizan: semilla genera 640 leads, 176 negocios, 400 unidades y 12 brokers (`scripts/seed/catalog.ts:5`). Son fixtures sintéticas (`scripts/seed/generator.ts:50`, `:62`), no demanda ni datos comerciales validados. Ni 648 ni 640 deben convertirse en constantes de UI.

Pruebas existentes, **no ejecutadas aquí**: alta/duplicados/alcance/rollback/asignación/descarte/webhook y guardas SQL (`src/application/leads/casos-de-uso.test.ts:104`, `:171`, `:208`, `:242`, `:297`, `:346`, `:388`, `:555`); conversión y bloqueo (`conversion.test.ts:17`, `:59`, `:112`, `:188`). Un doble en memoria no acredita exclusión concurrente PostgreSQL. El inventario histórico no cierra hallazgos; el código actual contiene reservas que su registro todavía considera pendientes (`crm-as-is.md:352`).

GitNexus: consulta `leads crear asignar convertir descartar webhook`, repo QuisqueyaHome_CRM, devolvió definiciones y cero procesos; se usó lectura directa para corroborar. No se modifican símbolos, por lo que no se ejecuta análisis de impacto para una edición de código ni `detect_changes`/git. No se atribuye vigencia del índice ni ausencia de funciones a una búsqueda vacía.

## 3. Pantallas

Base visual: consola clara con cabecera, filtros, tabla e inspector, una acción primaria; inspector 400–440 px; fuentes Hanken Grotesk/Atkinson Hyperlegible Next; sin texto menor de 13 px (`docs/DESIGN.md:47`, `:65`, `:71`, `:85`, `:110`). Uso de `ChartCard`/`ChartContainer`, `Drawer`, `Card`, `Tabs` ya instalados (`src/components/ui/chart-card.tsx:6`, `chart.tsx:41`, `drawer.tsx:7`, `card.tsx:4`, `tabs.tsx:8`). Presencia no demuestra adaptación o accesibilidad completa.

DS-1 es el insumo principal: **SCR-LEAD-BANDEJA**, **SCR-LEAD-FICHA**, **SCR-LEAD-ENTRADA** (`.viltrum/vre-os/design/DS-1-negocios-leads.md:239`, `:314`, `:391`). Las siguientes precisiones son propuestas de contrato M01 para revisión, no un diseño D05 aprobado. Las contradicciones se registran en §9; ningún campo SQL ficticio de DS-1 se presenta como columna real.

### 3.1 SCR-LEAD-BANDEJA · `/leads`

- **Tabs:** Activos (new/assigned/contacted), Convertidos, Descartados, según D05-A `:14`; opción Todos para conservar acceso actual. Filtro de estado fino dentro de Activos. Contadores agregados del conjunto autorizado con los demás filtros, antes de paginar y antes de aplicar el estado de tab, sin contar la página como universo.
- **Bloques:** cabecera con Registrar lead; buscador; chips de filtros; tabla paginada con persona/contacto, fuente, campaña, interés/zona, responsable/sugerido, estado, recepción/última interacción/próxima acción y presupuesto desde–hasta. Presupuesto del comprador no equivale a precio real de propiedad. No incluir precio real en DTO de broker/asistente. Dos aliases separados para dueño y sugerido.
- **Filtros URL objetivo:** `q`, `status`, `source_id`, `broker_id`, `zone_id`, `campaign_id`, `from`, `to`, `page`, `lead`; `from/to` propuestos para fecha de recepción y `group_by`, `view_id` para máxima capacidad. Significado de «rango» comercial/presupuesto requiere Q-1004; no se inventa una comparación multimoneda. Cambiar filtro reinicia página y conserva filtros restantes. La búsqueda local sigue funcionando si un buscador externo cae.
- **Acciones:** abrir inspector; asignar/convertir/descartar solo con permisos; llamada y WhatsApp como enlaces contextuales sobre teléfono válido. Registro de contacto efectivo es una acción explícita, no consecuencia de abrir un enlace. Asistente ve solicitud/borrador en lugar de Guardar directo. Exportación solo con permiso y contrato M12; no se implementa importación.
- **Máxima capacidad:** vistas personales guardadas, agrupación por estado/fuente/broker/zona/campaña y tablero alternativo de estados (D05-A `:42`). La tarjeta de tablero abre el mismo inspector. Mover tarjeta invoca un comando válido, nunca un `setState` que omita reglas. Persistencia, alcance y catálogo de transiciones necesitan Q-1005; no existen hoy ni se prometen como E1 verificado.
- **Móvil 320/390:** tarjetas con nombre, fuente, estado, responsable y siguiente acción; filtros en Drawer inferior, sin tabla horizontal. Inspector a pantalla completa inferior; safe area y dock existentes; botones 48×48 px, pestañas y cabecera sticky. No depender de swipe para ninguna acción; alternativa de teclado/botón. 768 adapta densidad y 1440 tabla + inspector.
- **Componentes D05:** filter chips **35042**, side sheet **25010** (DS-1 `:247`); DataTable existente para listado, Card en móvil. IDs existen como JSON locales; calidad/semántica se revisan por D07. Referencia secundaria tabla **22177** en DESIGN `:143`; no se instala otra tabla en esta tarea. Kanban **24339** de D05-A `:27` es candidato sin adquisición verificada aquí.
- **Gráficas:** tab/análisis bajo permiso, leads por canal y conversión por período; fuente `consultarMetricasLeads` propuesta en §5. ChartCard + paleta categórica y tabla textual, según D05-gráficas `:11`, `:24`, `:33`; métricas globales solo admin. Urgencia/SLA requiere configuración aprobada, sin fijar 5 minutos/1 hora.

### 3.2 SCR-LEAD-FICHA · inspector `/leads?lead=<id>`

- **Tabs:** Seguimiento (actividades, nota y cambios), Datos (persona, presupuesto/rango, interés, fuente/campaña/UTM/mensaje original), Negocios vinculados (relación del contacto, solo negocios visibles). Conversaciones como bloque progresivo del seguimiento, no aplicación externa incrustada. D05 propone Datos/Seguimiento; tab de vínculos es propuesta para D03/D05.
- **Contenido:** persona + fuente/campaña bajo título; sugerencia separada de asignación confirmada; línea de tiempo descendente estable y paginada; autor, fecha local, tipo de entrada y resumen del cambio autorizado. Actividades del lead exacto por `activities.lead_id`; actividades solo del contacto se muestran como contexto separado, no se atribuyen a todos sus leads. Historial comercial de negocio solo si existe vínculo y permiso de lectura del negocio. Auditoría administrativa queda separada y requiere aprobación de Q-1003.
- **Acciones:** confirmar broker activo, convertir (diálogo prellenado/confirmación accesible), descartar con motivo, registrar nota/contacto/próxima acción y abrir WhatsApp/llamada. Convertido muestra vínculo al negocio visible, sin volver a convertir; descartado conserva datos y contacto para recontacto. Reactivar necesita regla propia Q-1006. Ninguna acción libera/reserva unidades o registra venta.
- **Móvil 320/390:** Drawer con título/cierre sticky, tabs sticky, cuerpo vertical y pie con acción primaria según contexto; contacto directo fuera del menú oculto; no tapar contenido con dock/teclado. Escape cierra y retorna foco a tarjeta/fila original. Desktop reutiliza inspector lateral; no se inventa ruta `/leads/[id]` ya construida.
- **Componentes:** timeline **28340**, tab panels **4086** (DS-1 `:322`), side sheet **25010**; Drawer móvil + Tabs/Card instalados. Historial como lista semántica, fechas `America/Santo_Domingo`, no tarjetas decorativas por cada auditoría.
- **Analítica:** atribución/tiempo primer contacto y evolución por origen solo con datos demostrables. ROI y gasto global solo admin; broker obtiene seguimiento de su cartera, sin prorratear gasto corporativo. Caída de conversaciones conserva datos locales y acceso externo explícito.

### 3.3 SCR-LEAD-ENTRADA · captura manual y diagnóstico de recepción

Esta pantalla D05 contiene CSV, turnos e iframe (DS-1 `:393`, `:396`); **no se construye tal receta con esta ficha**. Adaptación propuesta: captura manual en Drawer desde Registrar lead, con pasos Persona / Interés y origen / Revisar; reutiliza contacto existente visible o crea uno con aviso de duplicado. Botón Confirmar registra; para asistente solicita aprobación. Cancelar no escribe; fallo mantiene entrada mientras la sesión autorizada continúe.

Datos: nombre o contacto existente, teléfono/correo, proyecto o texto de interés, zona, operación, presupuesto/divisa, canal/campaña y contexto; campos progresivos, no formulario largo. Fuente/configuración de catálogos servidor. No exigir cada dato por comodidad del diseño: mínimo actual nombre/contacto, obligatorios comerciales Q-1004.

Diagnóstico de recepción/sincronización enlaza a Configuración/Integraciones (E1.5), admin autorizado; estado real, fecha y códigos no sensibles, sin token ni payload personal completo. Broker no recibe monitor técnico; conserva su captura manual según `leads:create`. Formbricks es candidato sin cobertura en el catálogo recibido, no sistema acreditado. No iframe, CSV ni autoasignación por turnos.

Móvil 320/390: pasos verticales cortos, foco en errores y pie sticky; teclado no oculta acción. IDs **31802** y **26969** de DS-1 `:399` corresponden al importador excluido: se citan, pero no se reutilizan fingiendo que sirven para captura manual; D05 debe elegir/adaptar componentes, Q-1008.

### 3.4 Matriz de seis estados por pantalla/bloque

| Estado | Bandeja | Ficha/seguimiento/conversaciones | Captura/diagnóstico |
|---|---|---|---|
| Carga | Esqueleto de tabla/tarjetas con alto estable; sin acciones de fila | Esqueleto local de ficha/timeline; no mezclar anterior lead con el seleccionado | Guardado en curso con `aria-busy`, envío bloqueado; monitor en carga |
| Vacío | Sin leads: Registrar si puede; sin resultados: Limpiar filtros | Sin actividades/negocios/hilo con mensaje específico; registro fuera de alcance usa respuesta neutral | Persona no seleccionada pide entrada; sin recepciones no significa proveedor sano |
| Error | Fallo de lectura con Reintentar; errores de filtro al campo | Fallo parcial de timeline/chat no borra ficha; error de acción mantiene contexto | Zod junto a campo, error servidor neutral, conservar datos y reintentar |
| Sin conexión | Aviso persistente; últimos datos solo si disponibles, sin fingir frescura | Solo lectura de datos disponibles; comandos bloqueados, enlace externo explícito si procede | No cola de escrituras offline inventada; conservar formulario y reintentar al volver; monitor desconocido |
| Éxito | Filas/count reales y estado de proveedor derivado de salud | Confirmación de acción, refresh desde servidor, timeline actualizado | Confirmación de registro o **solicitud pendiente**, nunca ambos; monitor muestra estado acreditado |
| Permiso insuficiente | Servidor deniega; ningún dato global/ajeno en respuesta | Ocultar/inhabilitar acción con motivo; ID no visible responde neutral/404 | Sin create no formulario; monitor reservado; expiración no envía ni revela datos |

Conflicto adicional: 409 duplicado ofrece reutilizar contacto visible o crear explícitamente; conflicto concurrente recarga con explicación sin publicar de nuevo. Sesión expirada pide autenticación segura; persistencia local de PII no se presupone (Q-1007). Modo degradado de proveedor ≠ navegador offline: local sigue operativo con outbox si falla proveedor; navegador sin conexión no puede confirmar una escritura.

Wireframes base en DS-1 `:280`, `:355`, `:432`; refinamiento propuesto sin copiar datos de ejemplo como reales:

```text
1440 · Bandeja + ficha
[Leads] [Buscar] [Registrar lead]
[Activos] [Convertidos] [Descartados] [Análisis autorizado]
[Estado] [Fuente] [Broker] [Zona] [Campaña] [Rango] [Vista]
| Tabla y paginación autorizada | Persona · origen · campaña |
| Contadores de toda consulta   | Seguimiento | Datos | Vínculos |
| Acciones contextuales        | Timeline + acción con permiso |

390/320 · Bandeja                390/320 · Drawer ficha
[Leads] [Buscar] [Registrar]     [Volver/cerrar] [Persona]
[Tabs compactas] [Filtros]      [Seguimiento] [Datos] [Vínculos]
[Persona · fuente · estado]     [Origen · campaña · responsable]
[Responsable · próxima acción] [Timeline vertical paginado]
[Llamar] [WhatsApp]             [Acción contextual autorizada]
[Anterior] [Siguiente]          [Pie sticky sobre safe area]
[Dock estable]
```

## 4. Funciones (casos de uso)

En permisos, `S` significa alcance resuelto de tabla de permisos: `all|own`; `none` deniega. Rol no sustituye comprobación servidor. **Estado actual** conserva comportamiento descrito en §2; **objetivo** exige los candados siguientes, con preguntas explícitas donde falta decisión. Zod en frontera + invariantes dominio + CHECK/FK en base, sin importar Drizzle a application (Constitución `:23`, `:31`; `src/application/README.md:47`).

| Función | Entrada Zod / reglas | Salida y errores | Permiso objetivo | Outbox e idempotencia |
|---|---|---|---|---|
| Listar/contar/inspeccionar | Query tipada; IDs enteros positivos, page entero; estado de catálogo, fechas válidas y ordenadas, búsqueda literal parametrizada; alcance + deletedAt antes de filtrar/agregar | DTO de lista, total, contadores, catálogos y ficha visible; query inválida 422; sin view 403; ID inaccesible 404 | `leads:view:S`; contactos/negocios/actividades visibles se proyectan según permiso independiente | Ningún evento; lectura sin efecto |
| Crear manual `crearLead` | Contacto visible existente o nombre recortado; email válido, teléfono normalización actual; centavos enteros seguros ≥0, min≤max, divisa validada; FK/catálogos activos; `crear_igual` booleano explícito | `{ok:true,lead}` actual; 409 aviso sin candidatos ajenos; 422 inválido; 404 contacto no accesible; rollback completo | `leads:create:S`; comprobación del contacto enlazado y visibilidad del creado; aprobación asistente obligatoria | **Objetivo LeadCreado**, una vez en transacción con dominio/auditoría; alta manual hoy no tiene clave durable. Contrato commandId/reintento Q-1010 |
| Capturar externo `capturarLeadExterno` | Token antes de leer JSON; `externalId` y nombre no vacíos + campos actuales, copiados uno a uno; mismo payload canónico → replay; diferente → conflicto; broker solo sugerido | `{ok:true,lead,creado}`; 401 token, 422 Zod, 409 clave distinta/histórica sin recibo, error neutral de infraestructura | Excepción pública técnica expresamente declarada; no sesión de comprador | **Objetivo LeadCreado** solo en creación; reserva + recibo sin expirar; replay cero eventos/contactos/auditorías nuevos |
| Asignar `asignarResponsableDeLead` | ID/brokerId positivos; candidato activo; fila visible releída/bloqueada; sugerencia requiere confirmación; transición de estado y reasignación pendientes Q-1002 | Lead actualizado y confirmación; 422 broker inválido, 404 fuera de alcance, 409 conflicto terminal/concurrente objetivo | `leads:edit:S`; Q-1002 determina si transferir exige `all`; asistente solicita aprobación | **Objetivo LeadAsignado** solo al cambio confirmado; no repetir evento por reintento/no-op. Payload, versión, clave y dispatch Q-1009/1010 |
| Convertir `convertirLead` | ID positivo por Zod objetivo; sin JSON de negocio arbitrario; bloquear lead, estados no terminales, primera etapa abierta por configuración, broker confirmado o actor según contrato actual | `{ok:true,lead,deal}`; 404 invisible, 409 convertido/descartado/sin etapa; fallo revierte lead/negocio/auditoría | `leads:edit:S` + `deals:create:S`; aprobación previa asistente | Evento de conversión no definido por la tarea: Q-1009; no inventar cambio de etapa inicial. Actual segundo intento = 409; exactamente un negocio por lead |
| Descartar `descartarLead` | Zod objetivo `{discardReason: texto.trim().min(1)}`; no converted/discarded; bloqueo común de mutaciones; contacto preservado | Lead discarded con motivo; 422 vacío; 404 invisible; 409 terminal/concurrente | `leads:edit:S`, aprobación asistente | Sin evento externo aprobado para descarte; auditoría obligatoria. Repetición actual 409; rollback atómico |
| Registrar nota/seguimiento | Entrada tipada sobre actividad de lead exacto, tipo/título/texto/estado/fecha/asignación, referencias visibles; no inyectar dealId ajeno; no declarar contacto al abrir tel/WhatsApp | Actividad/nota y seguimiento actualizado; 422 inválido; 404 referencia invisible; 409 conflicto | `leads:view:S` + `activities:create:S` o `activities:edit:S`; permiso de contacto/negocio asociado; aprobación asistente | Reutilizar `ActividadRegistrada` solo con contrato M06 y mapping validado; commandId Q-1010, primer contacto Q-1003 |
| WhatsApp/llamar | Teléfono de DTO autorizado; enlace construido seguro, sin afirmar entrega; sin teléfono mostrar indisponibilidad | Redirección externa explícita o UI local alimentada por puerto; caída → fallback | `leads:view:S`; envío dentro del CRM requiere permiso de mensajería de M11; asistente no envía sin aprobación | Enlace no emite LeadAsignado/LeadCreado ni contacto completado; recibo de envío corresponde a M11 |
| Guardar vista/agrupar/tablero | Configuración Zod sin SQL libre; filtros/orden de lista permitida; alcance recalculado en cada lectura | Vista personal/agrupación; no aumentar permisos al cargar vista compartida | `leads:view:S` más contrato de preferencias; compartir/editar catálogo pendiente | Sin evento CRM para preferencias; transiciones usan comandos anteriores; persistencia Q-1005 |
| Aprobar/rechazar solicitud asistente | Borrador inmutable con actor, propuesta y versión leída; permiso/alcance del aprobador reevaluados; rechazo sin cambio publicado | Estado pendiente/aprobado/rechazado, evidencia separada de publicación | Contrato de aprobación G04/M14 **UNKNOWN**, Q-1001 | Evento únicamente al aplicar cambio aprobado y una sola vez; no se construye workflow incompleto |

**Concurrencia objetivo:** asignar, descartar y convertir comparten exclusión transaccional de la misma fila y vuelven a validar estado/alcance dentro del bloqueo; ningún descarte puede pisar una conversión ni viceversa. Hoy solo conversión tiene ese bloqueo. D03/D11 concretan versión/comando e idempotencia de las demás escrituras antes de READY. Auditoría y evento fallidos deben revertir dominio; nunca se llama a proveedor dentro de la transacción de usuario. Borradores no modifican la fila oficial.

Errores usan clases de dominio y `errorResponse`; mensajes visibles sin términos comerciales prohibidos, SQL, detalles de driver, token ni PII ajena. Catálogos y textos con una fuente por concepto. Las etapas editables de negocios se leen por posición/kind y etiqueta; ningún ID o nombre se fija en vista. Descartar lead no equivale a negocio perdido ni venta cerrada; esos controles/motivo/comentario viven en M03.

## 5. Datos

### 5.1 Tablas y campos existentes

| Tabla / fuente | Campos relevantes y uso |
|---|---|
| `leads`, `src/infrastructure/db/schema.ts:605` | id, contact_id, source_id, project_id, project_interest_text; zone_interest heredado + zone_interest_id; campaign heredado + campaign_id; operation_type, currency, budget_min/max_cents, bedrooms, delivery_horizon_months, payment_method_id, confotur_interest; status, broker_id, suggested_broker_id; source_video_url, UTM, original_message, external_id; received_at, first_contacted_at, converted_deal_id, discard_reason; timestamps/authorship/deleted_at |
| `contacts`, `schema.ts:569` | id, nombre, teléfono normalizado/display, email, país/ciudad, canal, broker, notes, last_interaction_at, consent_at/source, autoría y baja lógica. Identidad recontactable; no exclusividad teléfono/email |
| `lead_sources`, `schema.ts:324` | id/slug/name/position/is_active; fuente en tabla, etiquetas históricas aunque ya inactiva |
| `zones`, `schema.ts:342` | id/public_id/slug/name/position/is_active; filtro por FK y visualización heredada claramente distinguida |
| `marketing_campaigns`, `schema.ts:388` | id/public_id/slug/name/source_id/starts_on/ends_on/is_active/deleted_at; atribución por identidad, no por nombre libre |
| `campaign_spend`, `schema.ts:407` | campaign_id/month/amount_cents/currency; gasto USD mensual; no asignación por broker o proyecto inventada |
| `activities`, `schema.ts:779` | lead_id exacto, contact_id/deal_id/project_id, tipo, title/description, assignee_id, fechas, estado/prioridad/completed_at, autores/deleted_at. Nota/seguimiento y próxima acción |
| `deal_stage_history`, `schema.ts:753` | deal_id/from_stage_id/to_stage_id/changed_by/changed_at; cambios del negocio, **no estados del lead** |
| `deals`, `schema.ts:672`; `pipeline_stages`, `schema.ts:287` | Vinculación de conversiones/negocios por contacto; primera etapa abierta por posición, etiqueta editable; restringir precio/importe sensible antes de serializar |
| `users`/`broker_profiles`, `repos/leads.ts:84` | Broker activo/perfil/especialidad; selector con ID y nombre, sin divulgar annualSalesCents del candidato al cliente |
| `audit_log`, `repos/leads.ts:331` | Cambios antes/después, actor/fecha/acción; recibo de captura en previous_value con captureKey/payloadHash y snapshot de respuesta. No devolver snapshots completos en timeline |
| `outbox`/`outbox_dead`/`external_refs`/`webhook_inbox`, `schema.ts:1131`, `:1157`, `:1166`, `:1181` | Sobre de salida, fallos operables, referencias externas por identidad, recepción durable. Tablas existentes; contrato LeadAsignado requiere ampliar CHECK/tipos/worker |

El tipo `Lead` actual no declara los campos normalizados nuevos del esquema (`src/application/leads/puertos.ts:48`); DTO/puertos se deben actualizar explícitamente, no esparcir la fila. `converted_deal_id` no tiene FK por ciclo intencional; integridad por transacción (`schema.ts:645`). No imponer UNIQUE(contact_id) ni UNIQUE(propiedad) durante captación; vulneraría D-03/D-09.

### 5.2 Lecturas a migrar y consultas nuevas

Responsabilidad: `application/leads/consultas.ts` coordina, normaliza y aplica reglas mediante un **puerto de lectura** en `puertos.ts`; SQL/Drizzle quedan en adaptador `infrastructure/db/repos/`. No trasladar imports SQL desde page directamente a application. Patrón existente `src/application/README.md:129`; páginas solo auth/parámetros/consulta/render.

| Consulta propuesta | Base a migrar / consultas adicionales |
|---|---|
| `consultarListadoLeads` | Migrar `page.tsx:59` y `:101`: lista+count+catálogos. Añadir filtros de broker confirmado (incluido sin asignar, contrato Q-1002), zona/campaña por FK, fecha `[desde,hasta)` derivada de días locales. Búsqueda literal escapando comodines `%/_`, orden estable status/receivedAt/id, paginación servidor única; no volver a paginar localmente |
| `consultarContadoresLeads` | Nuevo GROUP BY status con alcance y demás filtros; totales independientes de offset y del tab activo; resultados no autorizados jamás influyen en cifras |
| `consultarFichaLead` | Migrar `page.tsx:129`; verificar lead por alcance aunque no coincida con filtros visuales (propuesta para revisión D05); proyección de campos sensibles y relaciones con permisos propios |
| `consultarTimelineLead` | Migrar lectura audit_log de `historial.tsx:60` + actividades exactas + cambios de estado extraídos de antes/después. UNION de DTOs con tipo/ID/fecha/autor/resumen, cursor estable; separación de contexto del contacto y de historia de negocio visible; no duplicar auditoría de actividad como actividad nueva |
| `consultarProximaAccionLead` | Nuevo mínimo de fecha pertinente de activities pending/no borradas sobre lead_id; mostrar sin fecha como sin programar, no hacerla urgente por una constante; reglas de seguimiento Q-1003 |
| `consultarMetricasLeads` | Cohorte por received_at y filtros; estados/canales/zonas/campañas y primer contacto. Lógica coherente con M12 (`src/infrastructure/db/repos/reportes.ts:32`); ratio convertido/cohorte, no ingresos. Datos de histórico de negocio asociados sin contar varias etapas como varios negocios |
| `consultarVistasLeads` / agrupaciones | Nueva persistencia y puerto por aprobar Q-1005; agregar/grupar antes de paginar; preferencias no contienen SQL ni sustituyen alcance |
| `consultarSaludCapacidadesLeads` | Nueva composición servidor de salud/banderas (§6); no consultar red externa para completar cada fila ni asumir conexión por defecto |

Zonas/campañas sin FK usan fallback explícito «Sin zona normalizada»/«Sin campaña vinculada», manteniendo texto legado visible sin vincular por coincidencia nominal. Migración/backfill necesita D11 con evidencia, no lo ejecuta esta tarea.

### 5.3 Restricciones, índices, RLS y auditoría

Existentes: `leads_external_id_unq` único parcial por external_id activo, índices contact/status/broker/received; CHECK de presupuestos/horizonte (`schema.ts:653`). Índices no únicos contacts.phone/email (`:594`), historial por deal (`:767`), actividades contact/deal/assignee/starts/status (`:809`). No hay índice lead_id de actividades en ese bloque.

**Índices candidatos nuevos**, por medir con EXPLAIN y carga definida antes de migrar: leads activos `(broker_id, received_at, id)`; `(source_id, received_at, id)`; `(zone_interest_id, received_at, id)`; `(campaign_id, received_at, id)`; activities activas `(lead_id, starts_at, id)`; audit_log `(entity_type, entity_id, created_at, id)` y acceso de recibo captureKey; historial `(deal_id, changed_at, id)`. ILIKE con comodín inicial puede requerir trigram, pero extensión/índice se decide con medida Q-1007, no se instala por intuición. No añadir todos sin verificar planes.

RLS: tablas originales lo activan por migración 0001; nuevas normalizadas/outbox lo declaran con `.enableRLS()`. Inventario P0 registró RLS=true, FORCE=false, **políticas y privilegios efectivos UNKNOWN** (`crm-as-is.md:215`); no se vuelve a comprobar base aquí. Nuevas preferencias/borradores, si se aprueban, requieren RLS, FK y autoría desde su primera migración. No acceso navegador directo. Guardas existentes se conservan.

Toda publicación/mutación debe auditar en la misma unidad de trabajo; borrador, aprobación y rechazo dejan trazas distinguibles. Actual recibo de webhook usa audit_log sin actor humano. Su conservación no puede romper idempotencia: plazo/archivo/purga requieren política definida Q-1007; no se deduce consentimiento comercial del mero éxito de un webhook. El código actual fija consentAt y portal_externo (`casos-de-uso.ts:328`), pero aceptación legal/comercial de ese modelo no se acredita.

## 6. Integraciones y puertos

### 6.1 Matriz de cobertura a máxima capacidad

Ningún proveedor se incrusta: navegador → servidor propio → puerto → adaptador. PostgreSQL local sigue dueño hasta PoC/migración/aprobación humana (ARQ-VRE-002 `:65`; decisión #43 `docs/contexto/decisiones.md:293`). Puerto lógico no significa puerto TCP ni servicio vivo. Puertos TCP 9320/9322/9323 citados son plan del catálogo, no una sonda de disponibilidad; los 3000/8080 de DS-1 no autorizan despliegue.

| Capacidad de M01 | Sistema y puerto lógico | Pantalla/evento | Caída o ausencia / evidencia |
|---|---|---|---|
| Listar/buscar/filtrar/asignar/convertir/descartar | Núcleo local, RepositorioLeads + lectura propuesta | Bandeja/ficha; eventos según §4 | Independiente de OSS; fallo BD = error real, no lista ficticia. HECHO `repos/leads.ts:39` |
| Espejo contacto asociado a LeadCreado | Twenty candidato detrás de **CrmPort.reflejarContacto**; hoy crmLocal | Bandeja/diagnóstico; LeadCreado | Local sigue operando, outbox pendiente. Catálogo propone crearContacto/actualizarContacto/listarContactos (`CAPACIDADES.md:9`, `capacidades.json:3`), pero esos nombres no son métodos actuales CrmPort. No sustituir lista local por vacío si cae Twenty |
| Espejo negocio/actividad | CrmPort.reflejarNegocio/registrarActividad, proveedores locales/Twenty futuro | Ficha; NegocioCambioEtapa/ActividadRegistrada según módulo dueño | Pendientes/reintentos sin bloquear operación local; cambio inicial/conversión debe acordarse Q-1009. `crm.ts:15`, `:23` |
| Vistas guardadas/grupos/tablero | Interfaz propia + persistencia por definir; Twenty solo referencia conceptual | Bandeja; preferencias sin evento CRM | Mantener listado/filtros básicos; catálogo no acredita API de vistas/kanban. Q-1005; no afirmar soporte mediante crearContacto |
| Conversaciones, etiquetas y agente | Chatwoot candidato, **MensajeriaPort** propuesto; métodos catálogo crearContactoChat, listarConversaciones, crearConversacion, asignarAgente, etiquetarConversacion | Ficha/Bandeja, delegación M11 | Aviso «Conversaciones no disponibles», timeline local y enlace externo explícito; no autoasignar broker por fallback de agente. `CAPACIDADES.md:47`, `capacidades.json:243`; procedimiento exacto no implementado aquí |
| Envío texto/medios/plantillas WhatsApp | Evolution API candidato, MensajeriaPort; catálogo enviarTextoWa/enviarMedioWa/enviarPlantillaWa/verificarConexion; puerto actual **ProveedorDespachoCanal.despachar** | Ficha; eventos de entrega corresponden a M11 | Mantener contacto local; wa.me explícito, sin éxito simulado ni envío alternativo automático. `CAPACIDADES.md:63`; `src/application/comunicaciones/puertos.ts:59` |
| Búsqueda ampliada | Meilisearch candidato, BuscarPort propuesto, buscarTexto/buscarConFacetas del catálogo | Bandeja; índices derivados | Fallback SQL con mismo alcance; ningún resultado externo se acepta sin filtrar localmente. No necesaria para E1 básico; endpoint/adapter/permisos pendientes Q-1005 |
| Métricas, SLA y atribución | Consulta local/M12; herramientas externas de analítica no acreditan ownership | Bandeja/Ficha, sin eventos comerciales fabricados | Agregados locales autorizados; si no hay fórmula/datos, «No disponible», no cero. SLA/ROI pendientes Q-1007 |
| Captura pública | Portal Quisqueya, puerto/contrato capturarLead del catálogo; recepción propia capturarLeadExterno | Entrada; LeadCreado | Captura manual autorizada como alternativa, portal no promete recepción sin confirmación. `capacidades.json:733` indica **verificado:false** |
| Encuestas/formularios externos | Formbricks citado solo por DS-1; puerto de Captura propuesto, procedimiento pendiente | Entrada | Captura manual/API propia; no iframe. Ausente del catálogo recibido; capacidad/adapter/mapeo/licencia UNKNOWN, Q-1008 |
| Colas, salud y reintentos | OutboxCrm + worker/DLQ, Configuración E1.5 | Diagnóstico/enlace configuración | Estado pendiente/fallido/desconocido, nunca «Conectado» predeterminado. Scheduler operativo UNKNOWN (`crm-as-is.md:314`) |

Consulta externa de fuentes primarias el 2026-10-04: [API oficial Twenty](https://docs.twenty.com/developers/extend/api) confirma Core CRUD y Metadata API generadas por el esquema del workspace; **no confirma los anchors `capacidad-1…12` como endpoints ni un contrato Leads ya mapeado**. [Crear mensaje, documentación Chatwoot](https://developers.chatwoot.com/api-reference/messages/create-new-message) confirma creación de mensaje en conversación; no confirma nuestra integración. La URL específica de Evolution consultada no devolvió contenido usable: soporte local del adaptador y contrato actual UNKNOWN. `verificado:true` del catálogo es declaración de su productor, no verificación de esta sesión ni licencia aprobada. No se despliegan ni conectan servicios en esta tarea.

**Banderas `capacidades()` que consumirá la UI (PROPUESTA, nombres a validar Q-1008):** `espejoCrm`, `conversaciones`, `enviarTextoWhatsApp`, `enviarMediosWhatsApp`, `plantillasWhatsApp`, `busquedaExtendida`, `capturaPortal`, `capturaFormularios`. Cada bandera expresa soporte; salud por separado expresa disponible/no_disponible/desconocida. Capacidad ausente o desconocida usa núcleo local y no habilita botón de envío/hilo; caída usa fallback indicado, conservando indicador de frescura. Vistas/agrupación/kanban son capacidades locales pendientes, no banderas de conexión a Twenty. `CrmPort` hoy **no tiene capacidades()** (`crm.ts:13`); ni DS-1 ni el catálogo justifican fingirlo implementado. Servidor proyecta únicamente capacidades permitidas al actor.

### 6.2 Salida transaccional

**LeadCreado:** evento existente tipado `{tipo:"LeadCreado", aggregateId: lead.id, payload:{contactId: lead.contactId}}` (`crm.ts:22`). Objetivo: emitir en alta manual y primer webhook dentro de la misma transacción que lead/contacto/auditoría. Replay no vuelve a emitir. El worker existente refleja contacto, **no lead completo**; ese límite se preserva hasta definir mapeo adicional (`src/infrastructure/integraciones/outbox/worker.ts:44`).

**LeadAsignado:** obligación de la tarea, todavía no implementada. Propuesta mínima para revisión: aggregateId del lead y payload con brokerId confirmado y broker anterior nullable, versión del comando y correlación; sin nombres/teléfonos/notas. D03 debe concretar procedimiento receptor (CrmPort actual no representa asignación), versión, clave durable y compatibilidad. Añadir tipo/unión, Zod del worker, CHECK DB y contratos en una futura tarea explícita; no emitir un tipo que `schema.ts:1153` rechazaría.

Sobre existente: event_id UUID, tipo, version positiva, aggregate_id, correlation_id UUID, payload tipado, idempotency_key única; auditoría/domain/outbox en una unidad de trabajo (`schema.ts:1131`). No derivar claves de reloj mutable para esconder duplicados. No-op y reintento manual requieren contrato durable Q-1010. Outbox at-least-once exige deduplicación del receptor; external_refs enlaza identidad/version, no email. Clasificaciones RETRYABLE/NON_RETRYABLE/HUMAN_REQUIRED y dead letter corresponden a integraciones; no borrado físico desde M01.

### 6.3 Contrato de entrada pública y portal

- Ruta actual **POST `/api/leads/externo`**, Content-Type JSON; cabecera **`x-webhook-token`**; secreto comparado en servidor y obtenido en ejecución, sin copiarlo ni mostrarlo (`src/app/api/leads/externo/route.ts:56`, `:65`). Token ausente/incorrecto: 401 neutral. Longitud distinta tiene salida temprana: no se afirma comparación constante de longitud variable. Sin actor/RBAC solo por esta excepción pública (`seguridad.test.ts:41`).
- Entrada actual: externalId/nombre obligatorios, teléfono/email opcionales, sourceId/projectId/interés/zona/operación/presupuesto/divisa/campaign/UTM/mensaje/video opcionales (`route.ts:25`). No acepta brokerId confirmado ni permiso por payload. Campos nuevos normalizados no están en este Zod; cambio de versión/mapeo Q-1011.
- Una clave identifica una captura, no una persona. Reserva por clave **antes de cualquier efecto**; misma clave/payload canónico devuelve snapshot original con creado=false; distinto payload o clave histórica sin recibo = 409; primera captura creado=true. Comparación de payload normaliza teléfono y defaults (`casos-de-uso.ts:299`). Sin Idempotency-Key en el contrato HTTP actual.
- Transacción usa advisory lock + recibo auditado durable y upsert parcial exacto con `deleted_at IS NULL` (`repos/leads.ts:116`, `:257`). Mantener respuesta original incluso después de editar/baja lógica. Token/PII no entran en errores o logs de verificación.
- Futuro portal: formulario público → servidor portal (custodia secreto) → API CRM; navegador público no lleva token ni credencial CRM; generación externalId estable y conservación de pendiente/reintento por confirmar D19/Portal. No confundir timeout de cliente con captura rechazada; repetir misma clave. **No se acredita enlace portal–CRM operativo** (`capacidades.json:740`).
- Webhooks de Chatwoot/Evolution/Twenty futuros usan endpoints propios de proveedor con firma/token y webhook_inbox `(system,account_id,event_id)` único antes de comando. No reemplazar reserva/recibo actual por inbox sin plan de compatibilidad; recepción durable no equivale a efecto aplicado (`schema.ts:1181`). Rate limit, rotación, rechazo de replay temporal, límites de cuerpo y retención necesitan Q-1011; no se dan por existentes.

## 7. Métricas y reportes que alimenta

| Métrica objetivo | Definición y datos | Visibilidad, límite y prueba |
|---|---|---|
| Volumen y estados | Count de leads visibles no borrados, cohorte received_at dentro del rango y filtros; contadores antes de paginar | Cartera por alcance; global solo admin; test:db comparando conteos SQL y UI |
| Conversión captación → negocio | Leads de cohorte con status converted / total de cohorte ×100; un lead se cuenta una vez; denominador 0 → no disponible | No confundir con ventas ganadas. Fecha efectiva de conversión histórica no tiene columna propia: tendencia por fecha de conversión requiere auditoría íntegra o modelo aprobado |
| Primer contacto | first_contacted_at − received_at donde existen ambos; pendientes sin timestamp se muestran pendientes, no latencia 0 | Instrumentación de primer contacto Q-1003; SLA/ventana/calendario/percentiles aceptados Q-1007 |
| Canales, zonas y campañas | Distribución de la misma cohorte por FK; sin normalizar en grupo separado; campañas de marketing por identidad | Gráficas + tabla alternativa, mismas reglas que listado; no atribuir por texto libre |
| Siguiente acción/atrasos | Actividades del lead exacto pending/no borradas, comparación contra instante de consulta | No mezclar actividad de otra cartera o lead del mismo contacto; política actividad sin fecha Q-1003 |
| Motivos de descarte | Conteo discarded con motivo; catálogo o clasificación aprobada pendiente | Contactos conservados; no usar motivo del negocio como motivo del lead |
| Cierres/ingresos/ROI | M03/M12: deals y etapas/history; gasto campaign_spend por campaña/mes USD; fórmula y atribución por aprobar | Solo admin global; no prorratear gasto por broker/proyecto ni sumar divisas; `src/infrastructure/db/repos/reportes.ts:24`, `:75` |
| Salud captación/sincronización | Recibos, eventos pendientes/fallidos, fecha último éxito confirmado y estado proveedor | Admin/configuración; cero tokens/payloads completos en UI; no SLA calculado con datos simulados |

Feeds: M12 Reportes, M21 Inicio, M08 rendimiento broker y M09 metas mediante sus consultas autorizadas; fuente compartida, no constantes duplicadas. Formato local de fecha y divisa con Intl; intervalo temporal documentado y mismo `asOf` para cada respuesta agregada. Las fórmulas comerciales pendientes no se convierten en números de ejemplo.

**NFR verificables ya sustentados:** seis estados × tres pantallas/variantes; 320/390/768/1440 px sin scroll horizontal de página; touch targets ≥48×48 px; texto ≥13 px; contraste AA y no usar solo color; teclado/foco/reduced-motion; cero publicaciones de asistente sin aprobación y cero referencias ajenas; una conversión por lead y una captura por clave; rollback conjunto sin registros huérfanos. Fuentes `docs/DESIGN.md:65`, `:95`, `:103`; D05-gráficas `:39`; PLAN-E1 `:21`.

**NFR pendientes:** P95 con unidad ms, carga/usuarios concurrentes, disponibilidad %, RPO/RTO, retención días, plazo de aprobación y coste mensual: sin número comercial aprobado; Q-1007/CI-1001. El umbral «menos de 5 minutos» de DS-1 `:278` es propuesta de diseño, no SLA del cliente. Cuando se resuelvan, la prueba de carga declarará dataset, entorno, usuarios, muestra, unidad, umbral y procedimiento; no se escribe una cifra por analogía.

## 8. Criterios de aceptación (verificables)

Todos son **criterios objetivo**, no corridas realizadas. Pruebas nuevas nombradas a continuación son especificaciones de evidencia para tareas posteriores. D14/Gemini verifica interfaz; Claude observa comandos y revisa; D02/D03/D12 resuelven contrato. **La existencia de criterios no aprueba esta ficha.**

1. **CA-01 · Separación de lecturas.** Dado un actor autenticado, al cargar listado/ficha/catálogos la página delega en application y no contiene SQL/imports DB; application utiliza puerto sin Drizzle. Prueba: guarda `src/infrastructure/arquitectura.test.ts` ampliada a páginas Leads + nuevas unitarias `src/application/leads/consultas.test.ts`; quitar una delegación debe hacer caer guarda. Fuente L01.
2. **CA-02 · Filtros y URL.** Dado un dataset con distintos estados/fuentes/brokers/zonas/campañas/fechas y nombres con `%/_`, al combinar filtros y buscar por nombre/teléfono/email la URL reproduce la consulta, los comodines son literales y cada fila cumple filtros; cambiar filtro reinicia página; rango inválido no llega a DB. Prueba: nuevas `leads/consultas.test.ts` y `leads/consultas.db.test.ts` + E2E recargar/atrás/enlace compartido. Definición exacta de rango pendiente Q-1004; no se implementa su variante de presupuesto sin resolverla.
3. **CA-03 · Datos, conteo y paginación.** Dado un conjunto de más de una página, total y tabs provienen del conjunto visible con filtros, no de las 20 filas; orden estable sin duplicar/saltar filas y paginación única. Prueba: test:db contra fixture 640 y regresión/captura del conjunto local observado por el revisor; no exigir cifra 648 literal ni datos de producción. Agregar una fila en DB debe cambiar total sin editar UI.
4. **CA-04 · Móvil y diseño.** Dado SCR-LEAD-BANDEJA/FICHA/ENTRADA aprobados, al navegar 320/390/768/1440 se ven tarjetas en móvil, hoja inferior, tabs/cierre/pie sticky y safe area; `scrollWidth ≤ clientWidth` de página; foco/teclado/targets de 48 px y texto ≥13 px. Prueba: capturas D14 de **cada pantalla** en cuatro tamaños y recorrido teclado; evidencia en `.viltrum/vre-os/evidencia/E1/leads/`. Aprobar adaptación de Entrada corresponde a D05 (Q-1008).
5. **CA-05 · Seis estados.** Dado cada variante de pantalla y ChartCard, al simular carga, vacío, error, offline, éxito y permiso insuficiente se renderiza el comportamiento de §3.4 sin inventar caché/datos ni confirmar cambios offline. Prueba: E2E con respuestas controladas y capturas por estado/rol; offline del navegador y proveedor caído se ensayan por separado.
6. **CA-06 · Alcance extremo a extremo.** Dado broker A/B, al listar/contar/inspeccionar/mutar ID ajeno, A no obtiene fila, PII, agregados, actividad o historia de B; 404 neutral para referencias. Prueba: test:db con dos actores + pruebas HTTP por endpoint, incluido contacto existente ajeno, ID lead ajeno, actividad/negocio enlazado ajeno; quitar `visibleRows`/`reaches` provoca fallo por dato expuesto. Permisos efectivos RLS se prueban con el rol DB real por D11/D12, no se deducen del flag.
7. **CA-07 · Captura y duplicados.** Dado mismo teléfono/email y candidato visible, crear sin confirmación devuelve 409; `crear_igual:true` permite alta explícita, no unique duro por contacto. Sin contacts:view o con duplicado ajeno no aparecen candidatos identificables. Prueba: existentes `casos-de-uso.test.ts:150`, `:171`, `:194` + HTTP y test:db de vinculación visible; fallo de auditoría revierte contacto/lead/evento.
8. **CA-08 · Asignación.** Dado broker activo y lead visible, confirmar escribe responsable y auditoría/evento una vez; sugerencia sola nunca asigna. Broker inactivo 422, fuera de alcance 404; cambios simultáneos no pisan conversión/descarte. Prueba: unitarias existentes `casos-de-uso.test.ts:242`, `:255` y nuevas reglas/transición + test:db con dos conexiones. **UNKNOWN: transición status y transferencia own→otro**, pendiente Q-1002; ambas deben convertirse en casos concretos antes de READY.
9. **CA-09 · Descarte sin eliminación.** Dado lead no terminal, motivo vacío falla por Zod; motivo válido marca discarded, audita y conserva contacto/relaciones; convertido o descartado devuelve 409, ninguna eliminación física. Prueba: `casos-de-uso.test.ts:297`, `:310` + nuevos tests Zod/HTTP/test:db, conteo del contacto antes/después y carrera con convertir. Comentario/cierre de negocio se prueba en M03, no se inventa aquí.
10. **CA-10 · Conversión atómica.** Dadas dos conexiones sobre mismo lead, convertir crea exactamente un negocio, una marca converted y una auditoría coherente; la otra operación devuelve conflicto; fallo intermedio revierte la transacción completa; sin etapa abierta no escribe. Prueba: `conversion.test.ts:17`, `:59`, `:161`, `:188` + nuevo test:db real concurrente. Mutación obligatoria: quitar bloqueo `.for("update", {of:leads})` y observar caída de guarda y/o prueba de carrera con barrera determinista; restaurar y volver a verde por revisor.
11. **CA-11 · Multiplicidad y venta.** Dado contacto con dos leads de proyectos diferentes, convertir cada uno produce dos negocios sin duplicar/eliminar contacto ni reservar propiedad; múltiples negociaciones no se bloquean antes del cierre. Prueba: unitarias + test:db que comparen contacto/negocios/unit status; el negocio resultante usa etiqueta configurable de primera etapa, no una etapa literal. M03 demuestra distinción venta cerrada/negocio no concretado.
12. **CA-12 · Asistente.** Dado permiso efectivo de escritura y rol asistente, POST/PATCH directo no publica captura/asignación/conversión/descarte/nota/actividad/envío; solo el cambio aprobado por actor autorizado afecta dominio/auditoría/outbox una vez; rechazar/duplicar aprobación no publica. Prueba: HTTP por todas las mutaciones, test:db de workflow y captura pendiente/rechazado/aprobado. **UNKNOWN: quién aprueba, scopes, persistencia/versionado y plazo**, Q-1001; el test requiere ese contrato previo.
13. **CA-13 · Métricas y sensibles.** Dado broker/asistente, la respuesta serializada no incluye precio real, gasto global ni comisiones de terceros; admin obtiene fórmulas con cohorte correcta, cero denominador como no disponible y campañas huérfanas diferenciadas. Prueba: inspección de respuestas + test:db + snapshots DTO; mutación que quite proyección/guard de global debe fallar. M12 coordina ROI, Q-1007.
14. **CA-14 · LeadCreado.** Dadas alta manual y primera captura externa, transacción confirmada tiene dominio/auditoría y exactamente un evento validable por worker; fallo al emitir revierte la transacción completa; replay webhook crea cero eventos extra. Prueba: nuevos unitarios de unidad de trabajo + test:db de outbox y contrato del worker; no basta constatar catálogo existente.
15. **CA-15 · LeadAsignado.** Dado cambio autorizado de broker, existe un evento tipado, admitido por CHECK DB, deduplicable y procesado por procedimiento propio sin PII; caída proveedor conserva evento y operación local. Prueba: nuevos tests unitarios/contrato/worker/test:db y rollback de emisión. **UNKNOWN: payload, versión, procedimiento receptor y clave de idempotencia de asignación**, Q-1009/1010; no sustituir por LeadCreado ni emitir un CHECK inválido.
16. **CA-16 · Webhook protegido y durable.** Dado token ausente/incorrecto, rechazo 401 antes de JSON/DB; dato inválido 422; misma clave/payload, incluso concurrente/sin teléfono/tras baja lógica, devuelve respuesta original con un solo contacto/lead/recibo/evento; distinta carga o clave histórica sin recibo 409. Prueba: HTTP sin credenciales literales (leerlas en ejecución), tests existentes `casos-de-uso.test.ts:346`, `:388`, `:404`, `:457`, `:466`, `:555` + test:db de dos conexiones. Mutar predicado parcial hace caer guarda por nombre. Portal se prueba con stub servidor, sin afirmar conexión viva.
17. **CA-17 · Proveedores y banderas.** Dadas capacidades ausentes/desconocidas y fallos timeout/401/403/404/409/429/5xx/payload inválido/duplicado/fuera de orden, UI propia se degrada como §6; núcleo local sigue funcional, sin iframe, sin llamar SDK externo desde vista, sin éxito de entrega simulado. Prueba: suite de contrato doble/adaptador simulado + guarda arquitectura + E2E falla red de proveedor. **UNKNOWN: firma de capacidades() y procedimiento de cada puerto nuevo**, Q-1008.
18. **CA-18 · Timeline y seguimiento exactos.** Dado contacto con varios leads, ficha A muestra activities.lead_id=A y cambios del lead A; contexto contacto/historia negocio se identifica separado y exige permisos; orden fecha/tipo/ID estable, sin duplicar eventos, notas disponibles y próximo seguimiento persistido. Prueba: nueva `leads/consultas.db.test.ts` con dos leads y actividad ajena + E2E tab/foco. **UNKNOWN: primer contacto, alcance de auditoría y flujo de actualización**, Q-1003.
19. **CA-19 · Máxima capacidad.** Dada vista guardada/agrupación/tablero, preferencias se recuperan y se filtran por el actor actual; agrupaciones cuentan antes de paginar; ninguna transición por arrastre omite permisos, aprobación o estados terminales. Prueba: nuevos tests de preferencias/contrato/test:db/E2E teclado y capturas. **UNKNOWN: persistencia, uso compartido, permisos y transiciones**, Q-1005; estos pendientes no se esconden bajo un botón desactivado para declarar máximo alcance READY.
20. **CA-20 · Contrato firmado y seguridad.** Dado cualquier acción/estado/rol, textos visibles dicen Negocios/presentación donde corresponda, jamás vocabulario técnico prohibido; cliente final no entra al CRM; ningún secreto aparece en HTML/logs/exportaciones. Prueba: E2E/barrido textos visibles, revisión D12 de DTOs y nuevas rutas/tablas con `seguridad.test.ts`/`arquitectura.test.ts`; recuperación/baja lógica y CSV seguro según módulos dueños.
21. **CA-21 · Cierre técnico independiente.** Futura construcción solo se entrega cuando Claude observa `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:db`, mutación restaurada en verde y capturas D14; build se ejecuta por orquestador en entorno autorizado, **nunca por Codex en esta carpeta**. Guardas de RLS/permisos no se debilitan. Criterios de rendimiento/recuperación/retención requieren umbrales aprobados Q-1007 y prueba con unidad/carga/entorno. Esta entrega solo acredita spec:check bajo Verificación; no cierra issue ni E1.2.

## 9. Fuera de alcance y preguntas abiertas

Exclusiones expresas de T-E1-2a: **IA, importación masiva y E.164 avanzado**. También se excluyen de esta tarea código, migraciones, despliegues, git/commit/push, nuevas ramas, comandos dev/build, actualización del índice/roadmap, envío de mensajes y aprobación de gates. Licencias/despliegue OSS requieren ficha de integración y revisión; no se presume preparación por un listado de capacidades. Firma digital fuera del programa. No construir visor externo/iframe ni sustituir ownership local.

Exclusión de responsabilidad M01: cerrar/reservar/vender propiedad, pérdida de negocio con motivo/comentario (M03); inventario por rangos/documentación (M04); comisiones/precio real; motor de comunicación/recibos (M11); workflow de permisos/aprobaciones (G04/M14). M01 exige sus contratos para integrar, sin declararlos implementados. Importación sigue línea base general pero queda excluida aquí por instrucción explícita.

### 9.1 Contradicciones y decisiones que requiere el revisor

| Fuente | Contradicción | Tratamiento en esta ficha |
|---|---|---|
| DS-1 `:242`, `:310`, `:393`, `:458` | E.164 avanzado/CSV/turnos frente a exclusiones y sugerencia sin asignación automática | Fuera de alcance; D05 ajusta Entrada y bandeja sin reabrir regla #21 por un wireframe |
| DS-1 `:396`, `:438` | Iframe de Formbricks frente a prohibición de incrustar proveedores | No iframe; puerto y UI propia; cobertura Formbricks no acreditada |
| DS-1 `:252`, `:327`, `:404` | fecha_creacion/estado_actual/valor_asignado y visible_para no existen en esquema | Mapeo a received_at/status/presupuesto y visibleRows; no SQL literal del diseño |
| DS-1 `:277`, `:352`, `:429` | Conectado por defecto, no respaldado por salud real | Disponible solo por comprobación; desconocido conserva operación local |
| DS-1 `:278`, `:306` | SLA 5 min/ejemplo rojo 1 h sin regla atribuida | Hipótesis, Q-1007; no umbral fijo |
| DS-1 `:386` | Asistente puede archivar/registrar actividad sin detallar aprobación | D-06 tiene prioridad en **todos** los cambios; Q-1001 define workflow |
| D05-A `:40` | Toast Deshacer sin contrato de reversión | No prometer undo de conversión/descarte; requiere comando y autorización propios |
| D05-A `:28`, DESIGN `:63` | Radius 2px/densidad frente tokens vigentes; propuestas de scroll horizontal | DESIGN/PXIL y móvil de tarjetas prevalecen, D05/D07 revisan adaptación |
| P0 `:30`, código page `:40` | Inventario atribuye filtro broker que parser no admite | AS-IS corregido aquí con código; implementación filtro pendiente |
| PLAN-E1 `:9`, P0 `:221`, `:234` | 400/12 vs 404 unidades/13 perfiles; semilla vs total | Conteos atribuidos, sin fabricar igualdad ni recontar base |
| Catálogo capacidades vs crm.ts `:13`, `:20` | Nombres de métodos/eventos distintos, capacidades() ausente, LeadAsignado inexistente | Contratos nuevos Q-1008/1009, no fingir endpoints por anchors |
| Expediente `:224`, historial.tsx `:60` | Auditoría administrativa solo admin, historia embebida sin permiso propio | Separar seguimiento de bitácora administrativa; Q-1003 antes de exponer snapshots |

### 9.2 Abiertas

IDs Q/CI de este paquete se mantienen dentro del único archivo autorizado; D00 debe incorporarlos al registro global sin renumerarlos/reutilizarlos tras revisar colisiones. Consulta de questions/client-inputs y fichas existentes no encontró estos IDs al producir el archivo. No se registran respuestas ficticias ni se pide al usuario aprobar un contrato incompleto.

- [ ] Q-1001 ¿Quién aprueba cada cambio del asistente, con qué alcance, niveles y plazo; dónde se guarda el borrador, qué ocurre si cambia la fila/rol o el aprobador no responde? · a:cliente · bloquea:G1 · dep:D02 · prioridad:P0
  - Necesitan respuesta Wilber/cliente + contrato G04/M14 por D03; bloquea CA-12 y toda publicación del asistente, no lectura segura.
- [ ] Q-1002 ¿Puede un broker transferir un lead propio a otro; cómo ve/atiende no asignados y qué status queda al asignar, reasignar o intentar sobre terminal? · a:cliente · bloquea:G1 · dep:D02 · prioridad:P0
  - Fuente discrepante H16/estado actual; D03 concreta locking/alcance. Bloquea CA-08.
- [ ] Q-1003 ¿Qué actividades/notas/cambios del contacto y del negocio se incluyen por lead, quién puede verlos, cómo se registra primer contacto y cuál es la transición contactado autorizada? · a:cliente · bloquea:G1 · dep:D01 · prioridad:P0
  - D03/M06/D12 resuelven contrato y separación de auditoría solo admin. Original de Acta reunión 2 requerido como insumo CI-1001. Bloquea CA-18 y medición de primer contacto.
- [ ] Q-1004 ¿Qué campos son obligatorios; «rango» significa fechas de recepción, presupuesto u otro, y cómo se filtra sin asignar, zona/campaña heredada y varias divisas? · a:cliente · bloquea:G1 · dep:D02 · prioridad:P1
  - Propuesta fechas `[desde,hasta)` no sustituye respuesta comercial; bloquea variante de filtro CA-02 y captura ampliada.
- [ ] Q-1005 ¿Cómo se persisten/comparten vistas personales, agrupación y tablero; cuáles transiciones de lead se permiten y cuáles capacidades del proveedor respaldan cada operación? · a:equipo · bloquea:G2 · dep:D03 · prioridad:P1
  - D02 confirma alcance máximo; D11 define preferencias/índices/RLS. No hay endpoint verificado de Twenty para estas capacidades en este paquete. Bloquea CA-19.
- [ ] Q-1006 ¿Cómo se reactiva un lead descartado sin borrar motivo/historia, y se crea nueva captura o se reabre la anterior? · a:cliente · bloquea:G1 · dep:D02 · prioridad:P1
  - Contacto recontactable sí firmado; reactivación exacta no. No se agrega botón con efecto supuesto.
- [ ] Q-1007 ¿Cuál es la línea base y objetivo de tiempo hasta primer contacto/SLA, horario; P95 ms bajo cuántos leads/usuarios; disponibilidad %, RPO/RTO, retención en días, política offline/consentimiento y coste mensual aprobado? · a:cliente · bloquea:G1 · dep:D01 · prioridad:P1
  - D15/D16/D11/D12 preparan procedimiento, volumen/entorno y política; sin respuesta no se aprueba NFR ni se purgan recibos. No se convierte sintético en éxito comercial.
- [ ] Q-1008 ¿Qué firma/nombres/tipos de capacidades() y puertos son canónicos, qué proveedor/cuenta se autoriza para conversaciones/WhatsApp/captura, y cómo adapta D05 SCR-LEAD-ENTRADA sin CSV/E.164/iframe? · a:equipo · bloquea:G2 · dep:D03 · prioridad:P1
  - D19/D21 verifican endpoints/mapeo/licencias; D05/D07 revisan UI e IDs; selección de cuenta humana no se da por recibida. Bloquea CA-04/17.
- [ ] Q-1009 ¿Cuál es payload/version/procedimiento receptor de LeadAsignado, qué sincroniza realmente el lead y qué evento debe salir al convertir o descartar? · a:equipo · bloquea:G2 · dep:D03 · prioridad:P0
  - D19/D11 alinean tipos/CHECK/worker/contrato sin PII innecesaria; LeadCreado hoy refleja contacto. Bloquea CA-15.
- [ ] Q-1010 ¿Cuál es commandId/recibo durable para alta manual y asignación, cómo se deduplican reintentos y no-op y cómo comparte bloqueo con conversión/descarte/aprobación? · a:equipo · bloquea:G2 · dep:D03 · prioridad:P0
  - D11/D14 exigen prueba concurrente real; no basta bloqueo del botón ni timestamp. Bloquea atomicidad/idempotencia de CA-08/14/15.
- [ ] Q-1011 ¿Qué versión/mapeo externalId/campos normalizados usa servidor portal, cuál es política de reintento/rotación/rate limit/límite JSON/retención y cómo convive el webhook actual con inbox de proveedores? · a:equipo · bloquea:G2 · dep:D19 · prioridad:P1
  - Portal no acreditado, catálogo verificado:false; compatibilidad/token solo runtime; no solicitar credenciales para redactar ficha. Bloquea conexión portal real, no contrato actual protegido.

### 9.3 Insumos y estado del descubrimiento

- [ ] CI-1001 Acta de Reunión 2 con procedencia/fecha y decisiones sobre seguimiento; línea base y objetivos medibles con volumen/entorno/plazo; matriz de aprobación por rol y de confidencialidad de historial · a:cliente · bloquea:G1 · dep:D01 · prioridad:P1
- [ ] CI-1002 Contratos revisados de capacidades/eventos/idempotencia, selección de proveedores y evidencia de licencias/endpoints, receta D05 Entrada corregida, plan y datos de prueba sin secretos · a:equipo · bloquea:G2 · dep:D03 · prioridad:P1

Cobertura de preguntas generadas para Leads: **0/11 respondidas**; las decisiones firmadas se levantaron como requisitos, no se cuentan como respuestas a estas preguntas nuevas. Preguntas abiertas que bloquean G0: **0** (no se declara G0 aprobado); G1: **6**; G2: **5**. CI pendientes: **2**. Tres pantallas cubiertas por contrato propuesto, con adaptación Entrada pendiente; integraciones vivas verificadas: **0** en esta entrega. Siguiente paso: D00/Claude dirige respuestas de negocio a D02/Wilber y contratos a D03/D19/D11; D05 ajusta contradicciones, D12 revisa confidencialidad, y otro proveedor verifica criterios y UI.

Revisión estática de seguridad del entregable según `docs/contexto/flujo-de-trabajo.md:153`: solo documento, sin nuevas tablas/rutas/SQL ejecutado, sin credenciales copiadas ni acceso a .env. **Correcto en código leído:** permisos servidor en mutaciones internas, visibleRows de listado/ficha y alcance en conversión; token en entrada pública antes de JSON; asignación campo por campo; snapshot de captura conservado con reserva; tabla outbox con RLS. **Hallazgos para revisión, no explotación ni cierre:** descarte sin Zod (`src/app/api/leads/[id]/descartar/route.ts:23`, JSON arbitrario validado manualmente); vincular contacto existente ajeno no verifica alcance (`casos-de-uso.ts:123`, actor con create y ID ajeno puede intentar enlazarlo); falta aprobación previa asistente en casos de uso (`casos-de-uso.ts:100`, `:198`, `:244`, `conversion.ts:26`, sujeto a permiso efectivo); historial sin permiso propio (`historial.tsx:60`, registro visible no implica acceso a bitácora); carrera asignación/descarte frente a conversión (`repos/leads.ts:270`, `:279`); RLS/políticas/privilegio real no verificados aquí. Cada corrección requiere tarea autorizada y revisión independiente; esta ficha no altera guardas ni implementa fixes.

## 10. Registro técnico

Anexo de evidencia separado de las nueve secciones funcionales para preservar la salida literal del validador.

## Verificación

Comprobación ejecutada el 2026-10-04. El intento `npm run spec:check` terminó con código 1 antes de arrancar el validador: PowerShell rechazó `npm.ps1` por falta de firma (`PSSecurityException`, `UnauthorizedAccess`). Se usó `npm.cmd run spec:check`, que ejecuta el mismo script sin cambiar políticas de ejecución. Una primera corrida señaló falsos positivos del marcador de pendiente en palabras españolas; se ajustó únicamente la redacción de M01. El anexo numerado separa la salida literal de las nueve secciones funcionales porque el validador analiza el texto hasta la siguiente sección numerada (`scripts/spec/check.mjs:59`).

**Última corrida efectiva: código de salida 1; cero hallazgos de estructura en M01.** El Spec Pack global no está verde: los once bloqueos reportados corresponden a `CAPACIDADES.md`, que no es una ficha con cabecera y estructura Ixx, pero el validador lo incluye. Se preserva el archivo recibido; corregir su tratamiento/ubicación pertenece al orquestador y no está autorizado en este despacho. Los avisos de tareas legadas no cuentan como bloqueos (`scripts/spec/check.mjs:188`). REVIEW sigue requerido por los contratos abiertos; cero hallazgos estructurales no equivale a READY ni aprobación independiente.

Salida literal de `npm.cmd run spec:check`:

```text
> quisqueya-home-crm@0.1.0 spec:check
> node scripts/spec/check.mjs

Spec Pack: 3 fichas; listas READY o superior: 0%
Estados: DRAFT 0 · REVIEW 2 · READY 0 · BUILT 0 · VERIFIED 0
Tipos: Módulo 2 · Global 0 · Integración 1
Bloqueos: 11
- .viltrum/vre-os/spec/integraciones/CAPACIDADES.md: falta cabecera YAML entre ---
- .viltrum/vre-os/spec/integraciones/CAPACIDADES.md: falta campo obligatorio id
- .viltrum/vre-os/spec/integraciones/CAPACIDADES.md: falta campo obligatorio sistema
- .viltrum/vre-os/spec/integraciones/CAPACIDADES.md: falta campo obligatorio estado
- .viltrum/vre-os/spec/integraciones/CAPACIDADES.md: falta campo obligatorio riesgo
- .viltrum/vre-os/spec/integraciones/CAPACIDADES.md: falta campo obligatorio owner
- .viltrum/vre-os/spec/integraciones/CAPACIDADES.md: falta campo obligatorio revisores
- .viltrum/vre-os/spec/integraciones/CAPACIDADES.md: falta campo obligatorio actualizado
- .viltrum/vre-os/spec/integraciones/CAPACIDADES.md: estado inválido (vacío); permitido: DRAFT|REVIEW|READY|BUILT|VERIFIED
- .viltrum/vre-os/spec/integraciones/CAPACIDADES.md: nombre de archivo no sigue el patrón INN-descripcion.md
- .viltrum/vre-os/spec/integraciones/CAPACIDADES.md: secciones vacías, con TODO o ausentes: §1, §2, §3, §4, §5, §6, §7, §8, §9, §10
- .viltrum/vre-os/tareas/T-DS-1-negocios-leads.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-DS-2-propiedades-brokers.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-DS-3-integraciones-shell.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-E1-0-renombrar-negocios.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-E1-1a-ficha-negocios.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-E1-2a-ficha-leads.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-E1-3a-ficha-propiedades.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-E1-4a-ficha-brokers.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-E1-5a-ficha-integraciones.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-I0-capacidades.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-P0-cms-reutilizable.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-P0-crm-inventario.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-P1-spec-check.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-QA-test-db.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-TW-D21-twenty-inventario.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-W1-D05-graficas-movil.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-W1-D09a-higiene-visual.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-W1-D11-datos-seed.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-W1-D11-rework-catalogos.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-W1-D21-cobertura-modulos.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-W1-D21-oss-intake.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-W1-D21b-rework.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-W2-D10-reportes-reales.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-W2-D19-base-integraciones.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-W3-D05-ux-visual-A.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-W3-D05-ux-visual-B.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-W3-D09-inicio-reportes.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-W4b-D10-rentas.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-W4b-D21-rentas-porte.md: legado (sin Ficha:)
```

No se ejecutan dev/build, pruebas de aplicación, DB ni mutaciones con este despacho documental. El índice no se escribe (no se usa `--md`); D00 sincroniza estado/roadmap en su entrega autorizada. No apareció un secreto en las salidas revisadas.

## Handoff

Destinatarios: **Claude/D00 + D02** (criterios y decisiones), **D03** (contratos), **D12** (datos/seguridad), **D05/D07** (receta/accessibilidad) y **D14/Gemini** (verificación independiente).

Salida: este único archivo M01 con YAML y nueve secciones; REQ L01–L09 → CA-01…21, AS-IS trazable, tres pantallas/seis estados/móvil, puertos/eventos/webhook, datos/consultas/índices, métricas/NFR y once preguntas. Revisar expresamente los UNKNOWN de §8 y las contradicciones §9.1; responder Q/CI sin inventar aprobación. D00 incorpora preguntas/índice y despacha únicamente después de revisión y READY real. Este productor no aprueba su trabajo, no cierra issue, no marca E1.2 completado ni realiza commit/push.
