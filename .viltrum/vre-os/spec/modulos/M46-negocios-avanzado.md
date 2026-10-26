---
id: M46
nombre: "Negocios: propuestas, aprobación comercial y cierre avanzado"
estado: REVIEW
riesgo: R3
owner: D01
productor: D01
colaboracion: [D03, D04]
revisores: [D03, D12]
fuente_de_verdad: PostgreSQL local del CRM
depende_de: [M03, M40, M43, M47, M50, G04, G05, G10, I00]
actualizado: 2026-10-18
---

# M46 · Negocios: propuestas, negociación y cierre avanzado

Ficha de descubrimiento para revisión independiente. No autoriza construcción ni declara aprobados los requisitos comerciales. La clasificación R3 responde a datos personales, precios, excepciones comerciales, enlaces externos y efectos de cierre. La decisión #51 limita este corte a una empresa: Quisqueya Home; no agregar `tenant_id`, sucursales ni roles nuevos (`docs/contexto/decisiones.md:348-354`).

**Convenciones de evidencia:** `HECHO` = código o documento leído; `DECISIÓN` = decisión atribuida con fuente; `PROPUESTA` = contrato por revisar; `NO VERIFICADO` = no acreditado en el código, runtime o base activa. Las filas del backlog y la Especificación Maestra son propuestas marcadas “Por validar”; no equivalen a aprobación del cliente.

## 1. Propósito y usuarios

### Problema y resultado

El equipo necesita conservar, comparar y revisar las condiciones ofrecidas en una negociación, y registrar la pérdida, suspensión, reapertura o solicitud de cierre sin confundir una propuesta con un contrato, un pago o una reserva. La evidencia funcional disponible es el backlog P0 UI-016–018 y la Especificación Maestra v1; no acredita frecuencia del problema ni una línea base comercial (`backlog-Pantallas.csv:20-22`; `especificacion-maestra-v1.txt:1315-1363`).

**Objetivo de control propuesto:** 100% de las propuestas emitidas conserva su snapshot y su versión; 0 aprobaciones reutilizadas para otro comprador, unidad, moneda o versión; 0 pérdidas que cancelen o devuelvan dinero por sí solas. Línea base de conversión, tiempo de respuesta y reapertura: **NO VERIFICADO**.

### Alcance P0 de esta ficha

- UI-016: propuestas en español o inglés, comparación, PDF, vista cliente, enlace revocable y solicitud de aceptación.
- UI-017: solicitudes de excepción comercial y decisión atribuible e independiente.
- UI-018: pérdida, suspensión, reapertura y solicitud de cierre ganado, enlazadas con los registros canónicos de M40.

No incluye firmas avanzadas, contratos legales generados, concesión o liberación de inventario desde la propuesta, cobros, reembolsos, modificación de comisiones ni flujos de aprobación complejos. El cierre financiero y la reserva pertenecen a M40. Una propuesta aceptada no crea una reserva ni un contrato (`M40-transaccion.md:210-217`; `especificacion-maestra-v1.txt:1322-1324`).

### Actores y límites

| Actor/capacidad | Trabajo permitido propuesto | Límite |
|---|---|---|
| Agente/broker con acceso al negocio | Consultar, preparar y emitir propuestas dentro del alcance concedido; solicitar excepción; registrar pérdida según permiso | No ve comisión interna ni datos financieros ajenos; no aprueba su propia excepción |
| Responsable con facultad comercial de aprobación | Revisar evidencia y decidir una excepción asignada a su permiso | La decisión se fija a la versión, unidad, comprador, moneda y vigencia; la facultad no nace de editar una regla |
| Administrador | Supervisar los negocios que permite su alcance y resolver las solicitudes autorizadas | El título “admin” no sustituye el permiso de acción; tampoco autoriza acceso financiero por sí solo |
| Asistente | Preparar solicitudes cuando tenga el permiso de edición correspondiente | No obtiene efecto antes de aprobación ni se autoaprueba; coordinar con M43 |
| Cliente | Consultar la proyección externa de la propuesta y responder según el mecanismo aprobado | No accede a la ficha CRM, notas, teléfono del propietario, comisión ni datos de otros clientes |

Las funciones “gerente/director” aparecen en las fuentes, pero no se verificó que existan como roles locales. M43 define capacidades por permisos y una bandeja común; D02/Wilber deben asignar las facultades usando permisos existentes o aprobados, sin crear roles por esta ficha (`D04-arquitectura-ui.md:121`; `M43-inicio-acceso.md:25-31,130-135`).

### Fuente de los requisitos

Las pantallas UI-016–018 están clasificadas P0. Sus filas detallan campos, acciones, filtros, comportamiento y aceptación; la columna de validación indica “Por validar” (`backlog-Pantallas.csv:20-22`). Los ejemplos de etapa, cierre, descuento, reserva y enlace también son configuraciones “Por validar” (`backlog-Configuraciones.csv:31-44,57-64,92`).

## 2. Estado actual (AS-IS)

Lectura estática local del 18-oct-2026. No se consultó la base en ejecución ni se ejecutaron pruebas para esta ficha.

| Evidencia | Estado y efecto para M46 |
|---|---|
| `/negocios` y el cambio de etapa existen; la ruta de etapa valida Zod, actor y `deals:edit` (`src/app/api/pipeline/[id]/etapa/route.ts:11-40`). | `HECHO`. Es una transición del pipeline existente, no el contrato completo de propuestas, excepciones y cierre de M46. |
| `deals` conserva etapa, moneda, monto, `closedAt`, motivo y comentario de pérdida; `lossReasons` existe como catálogo (`schema.ts:311-323,677-721`). | `HECHO`. No contiene el snapshot de propuesta ni una secuencia de suspensión/reapertura. |
| `dealProperties`, `unitSales` y `dealStageHistory` existen; la venta tiene unicidad por unidad y negocio (`schema.ts:727-795`). | `HECHO`. M46 debe conservar esa exclusividad y el historial; reabrir un negocio no libera una venta durable. |
| `cerrarNegocioGanado` bloquea negocio y unidad, crea la venta, actualiza efectos del cierre, registra auditoría y emite `NegocioCambioEtapa` (`src/application/pipeline/cierre.ts:44-108,176-219`). | `HECHO` de código; la ejecución con PostgreSQL y su integración M40 no se verificaron en esta tarea. M40 exige coordinar escritores bajo su protocolo de locks (`M40-transaccion.md:654-686`). |
| M40 tiene tablas declaradas para holds, reservas, unidades reservadas y compromisos; sus tablas nuevas tienen RLS en el esquema/migraciones (`schema.ts:1386-1519`; `drizzle/0007_m40_compromisos_reservas.sql:25-50,78-165`). También tiene planes versionados (`schema.ts:1530-1589`). | `HECHO` en archivos locales; aplicación de todas las migraciones en la base activa: **NO VERIFICADO**. |
| La matriz G1 reporta UI-016 y UI-017 como faltantes y UI-018 como parcial; el QA documenta 404 para las rutas de propuestas, aprobación y cierre, y diálogos de pérdida/cierre no ejecutados (`matriz-G1.md:32-34,156-174`; `qa-G1.md:16,97-98,167`). | Evidencia de auditoría del 18-oct. La matriz indica que no localizó ciertas piezas; no reemplaza la inspección del esquema local M40. |
| QA observó dos negocios activos asociados a la misma unidad `PNT-11A`; causa no determinada (`qa-G1.md:90-93`). | No usar datos de prueba ni estado del tablero para afirmar disponibilidad. Emisión y cierre deben revalidarla desde la fuente autorizada de M47/M40. |
| M03 conserva un gate de cierre y dice que no se reabre una etapa terminal mientras Q-311 siga pendiente (`M03-negocios.md:204-216`). | Conflicto funcional abierto con la reapertura P0 solicitada en UI-018; no se altera el comportamiento de M03 por inferencia. |
| M43 propone `ApprovalInboxPort`; su bandeja commercial actual trata propuestas #47 en un nivel, mientras que M40 conserva su aprobación financiera nativa y M47 requiere su fuente de dominio (`M43-inicio-acceso.md:128-135,185,193,201`). | M46 necesita acordar su tipo y fuente de aprobación. No reutilizar `financial_approval_requests` para descuentos. |
| M47 define precios versionados y enlazados a unidades, pero su ficha sigue en REVIEW; el modelo no está demostrado en runtime (`M47-inventario.md:161-169,221-225`). | Dependencia de datos/precios no disponible como capacidad construida verificada. No emitir propuesta con precio ingresado como si fuera precio vigente. |
| M50 distingue obligaciones de M40 y excluye splits y datos de cuentas de los DTO comerciales (`M50-red-brokers.md:155-169`). | M46 no expone comisiones internas ni modifica el libro. |
| M41 es una ficha de correcciones, no de funciones nuevas; M42 describe datos sintéticos y aclara que sus conteos son del código, no de la base viva (`M41-correcciones-1018.md:17-21,55-60`; `M42-datos-prueba.md:47,61`). | No usar semillas ni correcciones de M41 como aceptación de requisitos del cliente. |

**Discrepancias a resolver:** D04 propone comparar de 1 a 3 unidades, pero el backlog y la Maestra indican hasta cuatro (`D04-arquitectura-ui.md:120`; `backlog-Pantallas.csv:20`; `especificacion-maestra-v1.txt:1317-1320`). D04 requiere reserva verificada para cierre ganado, mientras la Maestra habla de un hito configurado y CFG-028 está por validar (`D04-arquitectura-ui.md:122`; `especificacion-maestra-v1.txt:1358-1362`; `backlog-Configuraciones.csv:32`). La ficha conserva ambas discrepancias en §9.

**Discrepancia de secuencia:** la tarea declara M40 en `drizzle/0007-0011`, pero el inventario local `rg --files drizzle` devuelve migraciones hasta `0010` y no muestra `0011`. El DDL relevante sí aparece en `schema.ts`. D00/D11 deben reconciliar índice, journal y rama antes de asignar una migración M46.

## 3. Pantallas

Las tres pantallas son pestañas del expediente de negocio según la arquitectura de navegación propuesta por D04; componentes/wireframes finales no están verificados (`D04-arquitectura-ui.md:119-122,224`). Los estados de abajo son el contrato funcional; pruebas visuales futuras deben cubrir 320, 390, 768 y 1440 px.

### 3.1 UI-016 · Ofertas, comparador y propuesta

**Ruta:** `/negocios/:id/propuestas`, pestaña en `/negocios/:id`.

**Campos:** versión; unidad; precio base y precio solicitado; moneda; gastos desglosados; plan orientativo; vigencia; idioma ES/EN; condiciones; origen y fecha de cada estimación; destinatario derivado del negocio. La cantidad máxima de opciones queda pendiente por discrepancia §9; la fuente primaria de la tarea pide hasta cuatro.

**Acciones:** crear/editar borrador; comparar opciones; emitir PDF; previsualizar con proyección cliente; crear enlace revocable; solicitar aceptación/respuesta. Cambiar precio de lista no altera versiones emitidas; una nueva versión conserva la anterior y revalida precio y disponibilidad. El PDF no es contrato, no bloquea inventario ni promete rentabilidad o beneficios fiscales no validados (`especificacion-maestra-v1.txt:1317-1328`).

**Filtros:** versión, estado, vencimiento, unidad y destinatario.

**Permisos:** lectura y acciones requieren acceso relacional al negocio; emisión además requiere permiso propuesto `proposals:issue`. La proyección cliente elimina teléfono del propietario, comisión interna, notas, datos de otros compradores e IDs internos. La autorización del enlace externo está pendiente de D12 (§9).

**Móvil:** tarjetas apiladas para opciones; comparación accesible opción por opción; filtros en hoja inferior; formulario por pasos si no cabe a 320 px. El PDF se previsualiza sin exigir una tabla horizontal.

**Seis estados:**

| Estado | Conducta |
|---|---|
| Carga | Skeleton con versión y opciones; refresco muestra antigüedad. |
| Vacío | Explica que no hay propuestas y ofrece crear borrador si el actor tiene permiso. |
| Error | Error saneado con referencia y reintento; no muestra SQL ni error del generador. |
| Sin conexión | Lectura con antigüedad solo si el origen privado ya está disponible; bloquea emisión, enlace y aceptación. No guarda precios o datos de cliente en caché local. |
| Éxito | Confirma borrador, versión emitida o enlace solo tras respuesta durable del servidor. |
| Permiso insuficiente | 403 para acción no permitida; 404 para negocio fuera del alcance, sin revelar su existencia. |

Vencimiento y cambios materiales agregan estado visible de “vencida” o conflicto 409; el aviso de vencimiento no edita el snapshot.

### 3.2 UI-017 · Negociación y aprobación comercial

**Ruta:** `/negocios/:id/aprobaciones`, pestaña del expediente y elemento en bandeja M43.

**Campos:** precio solicitado; precio base y versión fuente; descuento; gastos e incentivos cuantificados; plan; justificación; margen autorizado cuando exista; evidencia; solicitante; aprobador; vencimiento; estado y hash de contenido.

**Acciones:** solicitar excepción; adjuntar evidencia; consultar estado; retirar una solicitud pendiente; aprobar o rechazar con razón. El solicitante solo retira o reformula su solicitud. Toda decisión fija negocio, comprador, unidad, moneda, vigencia y versión. Cambiar un elemento material invalida la revisión anterior y exige nueva decisión (`especificacion-maestra-v1.txt:1331-1343`).

**Filtros:** tipo, umbral, aprobador, proyecto, importe y antigüedad. Totales y moneda se filtran con el alcance autorizado; USD y DOP no se suman entre sí.

**Permisos:** `proposal_exceptions:create:own|all` y `proposal_exceptions:edit:all` son nombres de permiso **propuestos**, no catálogo existente verificado. D02/Wilber deben asignarlos. Solicitante no decide su propia solicitud. Finanzas sensibles requieren permiso financiero específico; “admin” no da visibilidad financiera automática.

**Móvil:** solicitudes en tarjetas; resumen de decisión en hoja; evidencia y campos largos en pasos; botones de decisión etiquetados y con targets de al menos 44 px.

**Seis estados:**

| Estado | Conducta |
|---|---|
| Carga | Skeleton y estado de la decisión. |
| Vacío | Indica que no hay solicitudes dentro del alcance y permite ajustar filtros. |
| Error | Mensaje saneado, referencia y reintento. |
| Sin conexión | No permite solicitar, retirar ni decidir; sin efecto optimista. |
| Éxito | Decisión confirmada por servidor con versión/hash actualizado y auditoría. |
| Permiso insuficiente | Oculta evidencia y montos no autorizados; 403 acción denegada, 404 objeto ajeno. |

Una versión/hash obsoletos responden 409 y requieren releer; una solicitud vencida no se puede aprobar.

### 3.3 UI-018 · Pérdida, suspensión, reapertura y cierre

**Ruta:** `/negocios/:id/cierre`; diálogo transaccional desde UI-014/UI-015, con ficha de historial y pendientes.

**Campos:** motivo normalizado; comentario; competidor opcional; fecha; documentos/evidencia; obligaciones pendientes; próxima acción; historial de pérdidas y reaperturas; checklist y hito de cierre ganado.

**Acciones:** marcar perdido; suspender; reabrir con motivo; solicitar cierre ganado. Perder no cancela reserva ni devuelve dinero; reabrir no recupera inventario vendido. La solicitud de cierre ganado no es un arrastre libre de tarjeta. Cancelar compromisos y reconocer pagos son facultades separadas (`especificacion-maestra-v1.txt:1351-1363`).

**Filtros:** motivo, etapa, fecha de pérdida, número de reaperturas y pendientes de cierre.

**Permisos:** permisos candidatos `deals:lose`, `deals:suspend`, `deals:reopen` y `deals:close`, con alcance `own|all`; no están confirmados en el catálogo actual. Se debe revalidar alcance del negocio antes de leer/escribir. Cierre ganado delega a M03/M40; no altera directamente reserva, pago ni comisión.

**Móvil:** flujo por pasos con motivo y resumen de efectos antes de confirmar; confirmación destructiva explícita; teclado no tapa el campo ni la acción principal.

**Seis estados:**

| Estado | Conducta |
|---|---|
| Carga | Checklist y estado actual con `aria-busy`. |
| Vacío | Distingue ausencia de pendientes de un checklist de cierre no configurado; no inventa cumplimiento. |
| Error | Error saneado, referencia y opción de volver a consultar. |
| Sin conexión | Bloquea todas las mutaciones y explica que requieren servidor. |
| Éxito | Confirma el cambio y sus efectos reales; no afirma pago o cancelación no ejecutados. |
| Permiso insuficiente | 403 para acción, 404 para negocio fuera de alcance; no muestra información sensible. |

Conflicto de unidad vendida/comprometida, hito faltante, decisión obsoleta o cambio concurrente devuelve 409 sin efecto parcial.

## 4. Funciones y contratos de API

**Reglas comunes:** actor autenticado y `requireScope`/`requireFullScope` antes de consultar datos; para rutas por ID, filtrar el padre con `visibleRows`/`reaches`. Cuerpos Zod estrictos, sin asignación `...body`; copiar cada campo permitido. Errores saneados: 401 sesión, 403 permiso, 404 fuera de alcance, 409 versión/regla/concurrencia, 422 formato/regla de negocio y 503 integración no disponible. Toda mutación usa clave idempotente, hash canónico de entrada y una transacción; una clave repetida con payload distinto da 409. Patrón alineado a `transaction_commands` de M40 (`schema.ts:1363-1384`; `M40-transaccion.md:281`).

| Caso de uso / contrato propuesto | Entrada Zod y reglas | Salida, permisos, auditoría e idempotencia |
|---|---|---|
| Consultar propuestas | Filtros enumerados y paginados; reautorizar el negocio y cada unidad/archivo relacionado antes de proyectar. | DTO por alcance; sin evento. `deals:view` más permiso de propuesta aprobado. Lectura repetible. |
| Crear borrador/nueva versión | Moneda USD/DOP; idioma `es|en`; vigencia explícita; 1..N opciones según decisión pendiente; refs de unidad, precio y plan versionados; importes como cadenas enteras de centavos, no `number` monetario. No aceptar actor, estado, precio base, aprobación o snapshot enviados por cliente. | Borrador o versión nueva. `deals:edit` + permiso propuesto `proposals:create|edit`. Transacción y auditoría; clave de operación. |
| Emitir propuesta | ID/version esperado; reevaluar precio publicado M47, moneda, disponibilidad, aprobación vigente, gastos, plan y vigencia; generar PDF desde snapshot. | Versión emitida con hash y referencia a archivo privado. `proposals:issue`; 409 si cambió precio/unidad/hash. No crea hold ni contrato. |
| Crear/revocar enlace | Versión emitida y destinatario permitido; expiración dentro de política aprobada. Token de alta entropía, persistir solo hash. | `share_links` común coordinado con M47; no informar “enviado” si solo se creó/copió. `proposals:issue`/permiso de compartir. Repetición idempotente. |
| Registrar respuesta del cliente | Tipo de respuesta y versión exacta; método de identificación definido por política. Ningún dato de identidad lo elige el cliente sin validar. | Respuesta atribuible; no significa firma, contrato, reserva o compromiso de inventario. Contrato de acceso externo en espera de D12. |
| Solicitar excepción | Versión, justificación, evidencia y componentes exactos de la excepción; no cambiar unidad, comprador, moneda ni vigencia en una aprobación existente. Calcular el descuento efectivo incluyendo extras e incentivos según regla aprobada. | Registro tipado `price_exceptions`; se proyecta en bandeja mediante `ApprovalInboxPort`, con comando del dueño M46. Sin efecto en la propuesta emitida. |
| Decidir excepción | Decisión `approve|reject`, razón no vacía, versión/hash esperado; actor distinto del solicitante; reevaluar alcance, vigencia, umbral y versión en servidor. | Un solo efecto, auditoría y aviso M43; 409 para obsoleto/duplicado. No usar `financial_approval_requests` de M40. |
| Pérdida | Motivo activo y comentario cuando el motivo/configuración lo requiera; competidor opcional; revalidación del negocio abierto. | Actualizar negocio e historial bajo transacción. Si hay depósito, crear una tarea de resolución financiera; no cancelar reserva, liberar unidad ni devolver dinero. `deals:lose`; idempotente. |
| Suspensión / reapertura | Comando discriminado, razón, versión esperada; solo cuando se decida el significado y las transiciones permitidas. | Evento atribuible; reapertura no modifica M40 ni restaura disponibilidad. Bloqueado por pregunta de política en §9. |
| Solicitar cierre ganado | Hito y checklist configurados; unidad y disponibilidad revalidadas; compromiso/reserva propia según gate aceptado por M03/M40. | Ejecutar el caso transaccional M03/M40; 409 y rollback completo al fallar. `deals:close`; no crear segundo efecto de venta o comisión. |

**Rutas autenticadas candidatas:** `GET/POST /api/pipeline/[id]/propuestas`; `POST /api/pipeline/[id]/propuestas/[proposalId]/versiones`; `POST .../[proposalId]/emision`; `POST .../[proposalId]/enlaces`; `GET/POST /api/pipeline/[id]/aprobaciones`; `POST .../[approvalId]/resolucion`; `POST /api/pipeline/[id]/cierre` con unión discriminada. Son rutas propuestas, no existentes.

La lectura/aceptación mediante enlace externo no tiene contrato de API final: D12 debe resolver cómo se satisface el requisito global de autorización de rutas API antes de habilitar acceso externo. No se agrega un endpoint anónimo sin esa decisión.

**Eventos:** registrar tipos con D00/I00 antes de emitirlos. Eventos candidatos: propuesta emitida, excepción solicitada/resuelta, negocio perdido/reabierto y solicitud de cierre. Payload mínimo con identificador público, versión y correlación; nunca PII, token, nota, monto privado o credenciales. No se afirma que I00 tenga hoy consumidores para estos eventos.

## 5. Datos y controles

El modelo lógico se basa en objetos P0 del backlog (`backlog-Datos.csv:22,46-53,69,89-95,167`). D11 determina el mapeo físico, claves, migración, precisión y triggers; esta ficha no declara tablas implementadas.

| Entidad lógica | Fuente o cambio requerido |
|---|---|
| Negocio, motivos y transiciones | Reutilizar `deals`, `loss_reasons`, `deal_properties` y `deal_stage_history` (`schema.ts:311-323,677-795`). La historia debe distinguir pérdida, reapertura, suspensión y cierre solicitado; D11/D03 confirman si se amplía el historial existente o se mantiene otra representación append-only. |
| Propuestas | `proposals`: negocio, estado y puntero a versión actual. `proposal_versions`: número, moneda, vigencia, idioma, snapshot de términos, precio y estimaciones con fuente/fecha, hash, emisor y referencia al PDF. `proposal_lines`: unidades y referencias a precios/versiones M47, gastos por separado e inclusiones. |
| Excepciones e incentivos | `price_exceptions`: versión, base, solicitado, comprador/unidad/moneda/vigencia congelados, razón, evidencia, solicitante, hash y decisión. `incentive_rules`: catálogo versionado de beneficios, elegibilidad y vigencia; solo consumir reglas autorizadas, sin editor nuevo en M46. |
| Respuestas | Captura de aceptación o rechazo en registro atribuible y enlazado a versión, con evidencia de identidad. Es entidad inferida; su necesidad y retención deben validarse antes de fijar DDL. |
| Checklist de cierre | `closure_checklists` del backlog; versión de plantilla, ítems, evidencia, fecha y validador. No sustituye contrato o pago (`backlog-Datos.csv:48`). |
| Enlaces/entregas | Extender la fuente compartida `share_links`/`share_deliveries` de M47 para una versión de propuesta solo si D11 confirma FK y tipos seguros; no crear una segunda bóveda de enlaces. M47 actual limita los objetivos documentados a proyecto/unidad/medios (`M47-inventario.md:181-187`). |
| Reservas, planes, pagos, compromisos, venta y comisiones | Leer/escribir solo por contratos de M40/M03. Reutilizar entidades canónicas existentes; no duplicarlas ni borrarlas (`schema.ts:1386-1648`; `M40-transaccion.md:281-315`). |

**Restricciones de seguridad requeridas:** claves foráneas restrictivas, unicidad de versión, hash de contenido, una sola decisión válida por snapshot y bloqueo contra reuso entre comprador/unidad/moneda. Toda entidad nueva expuesta tendrá `public_id` UUID único; los IDs internos no se consideran secreto ni sustituyen autorización. Importes sin coma flotante y moneda explícita; la cotización hereda la representación canónica de M47/M40, no la precisión numérica propuesta en el CSV (`M47-inventario.md:38,163-167`).

Todas las tablas nuevas deben tener `.enableRLS()` en Drizzle y RLS en la migración; permisos SQL, grants y políticas se prueban por separado. No se considera `enableRLS` prueba suficiente de aislamiento. Auditoría append-only registra actor, fecha, versión, acción y motivo; no se permite borrado físico de propuesta emitida, aprobación, respuesta o cierre. Borrador descartable solo mediante baja lógica atribuible y recuperable; enlaces se revocan preservando su historia. La decisión #51 excluye tenant y sucursales.

## 6. Integraciones y puertos

| Capacidad | Contrato |
|---|---|
| Precio y disponibilidad | Consumir consultas y versiones de M47; precio/frescura y concesión se revalidan al emitir y cerrar. No usar `deals.amountCents` como precio de lista. Si falta fuente vigente, bloquear emisión con causa visible. |
| Plan orientativo | Reutilizar plantillas/versions aprobadas de M40. Una propuesta no crea `payment_plans`, cuotas, reserva ni pagos. |
| Bandeja de aprobación | Consumir `ApprovalInboxPort` M43 como proyección `source=m46`; M46 conserva comando y estado tipado de excepción. M43 debe aceptar la extensión; no crear otro motor genérico ni usar aprobaciones financieras M40 (`M43-inicio-acceso.md:130-135,193`; `M47-inventario.md:221-225`). |
| PDF | D21 propone `@react-pdf` para renderizar el documento; negocio, permisos, snapshot y contenido son propios del CRM. Paquete, licencia efectiva y almacenamiento privado en runtime: **NO VERIFICADO** (`D21-ensamblaje-oss.md:36,181`). |
| Reglas | D21 propone ZEN para evaluar reglas declarativas. No aprueba ni firma solicitudes. Umbrales, beneficiarios, vigencia y despliegue del motor requieren configuración autorizada (`D21-ensamblaje-oss.md:36,103-107`). |
| Enlace/entrega | Reutilizar el contrato de enlaces de M47, con expiración, revocación y entrega diferenciada de creación. No afirmar recepción por copiar URL. Duración de CFG-088 está “Por validar” (`backlog-Configuraciones.csv:92`; `M47-inventario.md:185-187`). |
| Auditoría y outbox | `Auditoria` y outbox en la misma unidad de trabajo. Registrar nuevos tipos/consumidores con I00 antes de activarlos. Si PDF, storage, auditoría u outbox falla, no mostrar éxito ni dejar emisión parcial. |

Los identificadores de incentivos y descuentos se versionan; el motor no contiene tasas o importes de negocio hardcodeados. No se incorpora servicio nuevo de firma, mensajería, almacenamiento o pago en esta ficha.

## 7. Métricas y reportes

Proyección propuesta, siempre filtrada por el mismo alcance del actor:

- Conteo de propuestas por estado, moneda, proyecto y período; vencidas por separado.
- Tiempo entre solicitud y decisión, con solicitante/aprobador y resultado.
- Excepciones por tipo/umbral y motivos de pérdida; reaperturas y pendientes de cierre.
- Tasa de respuesta solo cuando el mecanismo de aceptación y su evidencia queden definidos.

No sumar USD y DOP ni equiparar propuesta, reserva, venta, cobro o comisión. M03/M40 siguen siendo la fuente de resultados financieros. No hay baseline ni meta de mejora comercial validada; no se inventa un SLA.

## 8. Criterios de aceptación (verificables)

Criterios propuestos para pruebas futuras; ninguno se ejecutó en esta tarea.

1. **Snapshot:** dado un precio de lista y condiciones publicados, cuando se emite una propuesta, entonces se guarda versión, hash, fuente y fecha; cambiar la lista no modifica el PDF ni el snapshot anterior.
2. **Versión nueva:** dado un cambio material de precio, unidad, moneda, comprador, plan, incentivo o vigencia, cuando se crea nueva versión, entonces la anterior permanece trazable y las aprobaciones incompatibles no se heredan.
3. **Comparador:** dadas opciones autorizadas del mismo negocio, cuando se comparan, entonces la interfaz respeta el máximo aprobado, muestra gastos separados y no mezcla monedas. Se prueba límite exacto y una opción por encima.
4. **Privacidad externa:** dado un PDF/enlace, cuando se renderiza la proyección cliente, entonces no incluye teléfono del propietario, comisión interna, notas ni campos financieros restringidos; el contrato del enlace rechaza token revocado o vencido y responde sin caché pública.
5. **Aprobación ligada:** dada una excepción aprobada para versión/unidad/comprador/moneda/validez concretos, cuando se intenta reutilizar para otro objeto o versión, entonces la API devuelve 409 con motivo saneado y no muta datos.
6. **Cuatro ojos:** dado que el solicitante intenta resolver su propia excepción o un usuario sin permiso decide, entonces servidor y base deniegan; un decisor distinto deja una única decisión auditable.
7. **Descuento efectivo:** dado que la propuesta incluye descuento, gastos e incentivo, cuando se evalúa contra política vigente, entonces se consideran todos los componentes monetarios configurados; sin regla o valoración aprobada, la emisión se bloquea.
8. **Pérdida con depósito:** dado un negocio perdido con depósito, cuando se registra la pérdida, entonces se crea una sola tarea de resolución financiera y los estados/importes de reserva y pagos permanecen intactos.
9. **Reapertura y unidad:** dada una oportunidad reabierta cuya unidad está vendida o comprometida, cuando se intenta reutilizarla, entonces no se libera ni reserva la unidad; M40 conserva el estado y la historia.
10. **Cierre ganado:** dado un hito/checklist y compromiso válidos, cuando el actor autorizado solicita cierre, entonces M03/M40 verifica disponibilidad y locks; ante carrera, unidad ajena o falta de gate devuelve 409 sin efectos parciales.
11. **Permisos relacionales:** dado un actor con alcance `own` que intenta leer un negocio ajeno, entonces obtiene 404 sin campos, conteos, PDF o evidencia; acción sin facultad sobre negocio visible devuelve 403.
12. **Validación API:** dado JSON adicional, campo de actor/estado no permitido, importe no entero o moneda incompatible, cuando se envía mutación, entonces Zod rechaza sin persistencia; cada ruta comprueba permisos antes de datos y copia campos permitidos uno por uno.
13. **Idempotencia:** dada la misma clave y payload, al repetir una mutación, entonces existe un solo efecto; la misma clave con hash distinto devuelve 409.
14. **RLS e historia:** dada una tabla nueva, cuando se ejecutan pruebas SQL/API, entonces anon/authenticated no acceden directamente, `enableRLS` y grants se verifican, y borrar lógicamente una propuesta no borra versiones, decisiones ni eventos.
15. **Fallo de integración:** dado que PDF, storage, auditoría u outbox falla, cuando se emite o comparte, entonces no hay éxito falso ni documento parcial; el borrador se conserva y el error se puede reintentar.
16. **Seis estados y tamaños:** en cada una de las tres pantallas se comprueban carga, vacío, error, sin conexión, éxito y permiso insuficiente; capturas E2E a 320/390/768/1440 confirman etiquetas, foco, scroll y ausencia de desborde.

**Pruebas por planificar:** unitarias de casos de uso; PostgreSQL desechable para RLS, FKs, unicidad y concurrencia; HTTP con JSON serializado y roles; E2E/capturas. Los controles generales se alinean con `backlog-QA.csv:5-18,23-42` (aislamiento, doble control, idempotencia, offline, accesibilidad, móvil y retención).

## 9. Fuera de alcance y preguntas abiertas

### 9.1 Evolución excluida

Multiempresa, sucursales, roles nuevos, MFA/AAL2 nuevo, workflows multinivel complejos, firma avanzada, contratos legalmente ejecutables, CRM para cliente, publicación abierta, inventario/hold desde propuesta, pagos, cancelaciones, reembolsos y cambios de comisión. P1 queda fuera. M40 conserva el cierre transaccional y financiero; M47 conserva precio/inventario. La aprobación financiera de M40 no se rebaja ni se imita.

### 9.2 Preguntas bloqueantes

| ID | Pregunta | bloquea: | dep: |
|---|---|---|---|
| Q46-01 | ¿El comparador acepta hasta cuatro opciones como backlog/Maestra o máximo tres como D04? | M46-READY/UI-016 y su layout | D02, D04 |
| Q46-02 | ¿Qué autoridad existente decide excepciones, cuántos niveles exige P0, qué umbrales se aplican y cómo se calcula el valor monetario de extras/incentivos? CFG-040 y el mapeo de cargos siguen por validar. | M46-READY/UI-017/emisión con excepción | D02, Wilber, D03, D11 |
| Q46-03 | ¿Qué identificación requiere el destinatario, cómo responde, qué significa “aceptar”, qué canal acredita envío y cuánto dura el enlace? No asumir que “aceptar” es firma o compromiso. | M46-READY/enlace externo/respuesta | D02, Wilber, D12, D16 |
| Q46-04 | ¿Qué hito aprobado permite marcar ganado: reserva verificada como sugiere D04, o el hito/contrato configurado de la Maestra y CFG-028? | M46-READY/cierre ganado | D02, Wilber, D03, D11, M40 |
| Q46-05 | ¿Qué significa suspender y qué estados terminales pueden reabrirse? M03 mantiene pendiente Q-311 contra la reapertura pedida por UI-018. | M46-READY/suspensión/reapertura | D02, Wilber, D03, D10 |
| Q46-06 | ¿Qué plazos de retención aplican a snapshots, evidencias, respuestas y enlaces, y quién autoriza su purga? | M46-READY/purga y respuesta externa | Ismael/Legal, Wilber, D12 |
| Q46-07 | ¿Cuál es la representación monetaria canónica para unir backlog, M47 y M40? El CSV propone `numeric(20,4)`, mientras M47/M40 documentan centavos enteros. | Slice de datos/API monetaria | D03, D11, M47, M40 |
| Q46-08 | La tarea cita migración M40 hasta `0011`, pero el inventario local llega a `0010`. ¿Qué rama, journal y ordinal deben tomarse como vigentes? | Slice D11; migración no se despacha hasta tener nombre exacto | D00, D11 |

### 9.3 Cobertura y disposición

Cobertura documental: **3/3 pantallas P0** y **18/18 dimensiones** —campos, acciones, filtros, comportamiento, permisos y aceptación— incorporadas desde las filas de UI-016–018. Validación comercial ratificada: **0/18**; las filas siguen “Por validar”. Hay **8 preguntas abiertas** que bloquean partes de P0. Resultado: **REVIEW**, no READY ni aprobación de G1. Siguiente paso: revisión independiente D03/D12 y resolución de las preguntas con sus dependencias.

## Rebanadas

Las rebanadas son plan de trabajo futuro, cada una de hasta 45 minutos. Esta ficha no autoriza código. Los archivos de esquema/rutas de Negocios figuran reservados en `.viltrum/vre-os/EN-CURSO.md`; D00 debe liberar y asignar los despachos antes de ejecutarlos.

| Slice | Duración | Resultado y archivos permitidos exactos | Prueba / dependencia |
|---|---:|---|---|
| S0 · Resolver gates | 30 min | Sin archivos de código. Cerrar Q46-01–08 y registrar decisiones con dueño/fuente. | Evidencia de decisiones; requisito previo de cualquier slice afectado. |
| S1 · Reglas monetarias puras | 45 min | `src/domain/negocios-avanzado.ts`; `src/domain/negocios-avanzado.test.ts` | Casos de centavos, moneda y componentes de descuento aprobados. Espera Q46-02/Q46-07. |
| S2 · Puertos y propuestas | 45 min | `src/application/negocios-avanzado/puertos.ts`; `src/application/negocios-avanzado/propuestas.ts`; `src/application/negocios-avanzado/propuestas.test.ts` | Snapshot, nueva versión, vencimiento y errores; depende de M47/M40 READY. |
| S3 · Esquema y migración | 45 min | **Ningún archivo autorizado en esta ficha.** D00/D11 deben reconciliar el ordinal y entregar una lista exacta que incluya `src/infrastructure/db/schema.ts`, migración, snapshot y journal. | Pruebas PostgreSQL de RLS, unicidad, FKs y preservación M40; bloqueado por Q46-08. |
| S4 · Repositorio y contenedor | 45 min | `src/infrastructure/db/repos/negocios-avanzado.ts`; `src/infrastructure/contenedor/negocios-avanzado.ts`; `src/infrastructure/db/repos/negocios-avanzado.test.ts` | Adaptadores con filtros de alcance, transacción y auditoría; depende de S3 y del contrato M43/M47. |
| S5 · API de propuestas | 45 min | `src/app/api/pipeline/[id]/propuestas/route.ts`; `src/app/api/pipeline/[id]/propuestas/route.test.ts` | GET/POST, Zod estricto, scope antes de datos, visibilidad del padre e idempotencia. Requiere liberación D00 de `src/app/api/pipeline/**`. |
| S6 · Versionado y emisión | 45 min | `src/app/api/pipeline/[id]/propuestas/[proposalId]/versiones/route.ts`; `src/app/api/pipeline/[id]/propuestas/[proposalId]/versiones/route.test.ts`; `src/app/api/pipeline/[id]/propuestas/[proposalId]/emision/route.ts`; `src/app/api/pipeline/[id]/propuestas/[proposalId]/emision/route.test.ts` | PDF y snapshot inmutable; depende de S2–S5 y del adaptador D21/storage aprobado. |
| S7 · Aprobación comercial | 45 min | `src/application/negocios-avanzado/aprobaciones.ts`; `src/application/negocios-avanzado/aprobaciones.test.ts`; `src/app/api/pipeline/[id]/aprobaciones/route.ts`; `src/app/api/pipeline/[id]/aprobaciones/route.test.ts`; `src/app/api/pipeline/[id]/aprobaciones/[approvalId]/resolucion/route.ts`; `src/app/api/pipeline/[id]/aprobaciones/[approvalId]/resolucion/route.test.ts` | Cuatro ojos, hash, vencimiento y 409; depende de Q46-02 y de extensión M43 por su dueño. |
| S8 · Enlace/cliente | 45 min | `src/app/api/pipeline/[id]/propuestas/[proposalId]/enlaces/route.ts`; `src/app/api/pipeline/[id]/propuestas/[proposalId]/enlaces/route.test.ts` | Token hash, expiración, revocación y proyección cliente; no crear ruta pública hasta decisión D12 de Q46-03. |
| S9 · Cierre y pérdida | 45 min | `src/application/negocios-avanzado/cierre.ts`; `src/application/negocios-avanzado/cierre.test.ts`; `src/app/api/pipeline/[id]/cierre/route.ts`; `src/app/api/pipeline/[id]/cierre/route.test.ts` | Pérdida con tarea, cierre M40 y revalidación transaccional; depende de Q46-04/Q46-05 y liberación D00 de `src/app/api/pipeline/**`. |
| S10 · UI-016/017/018 | 45 min cada pantalla | `src/app/(crm)/negocios/[id]/propuestas/page.tsx`; `src/app/(crm)/negocios/[id]/aprobaciones/page.tsx`; `src/app/(crm)/negocios/[id]/cierre/page.tsx`; para cada una, su correspondiente `page.test.tsx` en la misma ruta. | E2E y capturas 320/390/768/1440; cada pantalla es un turno separado y requiere liberación D00 de `src/app/(crm)/negocios/**`. |

## Handoff

**Revisión solicitada:** D03 y D12, de proveedor distinto al productor. Revisar especialmente Q46-02–08, permisos/RLS, enlace externo, money scale y compatibilidad de cierre con M03/M40. D04 valida navegación y la discrepancia del comparador.

**Hallazgos de seguridad documental:** no se debe confiar en precio, disponibilidad o aprobaciones enviados por el cliente; la decisión debe quedar ligada a una versión/hash; negocio fuera de alcance responde sin datos; el PDF público excluye teléfono del propietario y comisión interna; la pérdida no cancela compromisos ni reconoce devoluciones. RLS, permisos SQL, enlaces y autorización HTTP siguen **NO VERIFICADOS** como comportamiento integrado.

**Bloqueos de coordinación:** EN-CURSO reserva rutas de Negocios, API pipeline, `schema.ts` y `drizzle/`; la ficha M47 también deja pendientes contratos de precio/enlace/aprobación. No despachar las rebanadas afectadas hasta que D00 asigne archivos exactos y libere esos espacios. No actualizar el índice ni declarar gate cerrado desde esta entrega.

**Estado del corte:** documental REVIEW; 8 preguntas abiertas; 3 pantallas cubiertas; 0 pruebas ejecutadas; no hay autoaprobación.