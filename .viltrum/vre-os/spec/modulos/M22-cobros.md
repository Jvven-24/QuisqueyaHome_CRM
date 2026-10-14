---
id: M22
nombre: Cobros y estado de cuenta del comprador
estado: REVIEW
riesgo: R3
owner: D10
revisores: [D02, D03, D11, D12, D14]
fuente_de_verdad: PostgreSQL local
depende_de: [M03, M10, G04, G05, G07, G10, I00, I03]
actualizado: 2026-10-14
---

# M22 · Cobros y estado de cuenta del comprador

Ficha redactada por D01+D03+D11 (requisitos, arquitectura y datos) el 2026-10-14 por encargo del orquestador D00, frente 5 de `.viltrum/vre-os/PLAN-INTEGRAL-2026-10-14.md` §6. **Estado REVIEW: no la aprueba su autor.** Pasa a READY solo tras revisión independiente de otro proveedor (D02 alcance, D03/D11 datos y concurrencia, D12 dinero y permisos, D14 criterios) y orden de D00. Esta ficha solo escribe documentación: no hay código, git, migración ejecutada ni servicio tocado.

**Convención de evidencia (la de M03):** HECHO = código o documento leído (archivo:línea); DECISIÓN = declaración firmada de Wilber; PROPUESTA = contrato objetivo sometido a revisión; SUPUESTO = valor por defecto seguro y reversible, con dueño, en §9; UNKNOWN = no acreditado. Las pruebas de §8 son obligaciones futuras, no resultados de esta sesión. Los identificadores técnicos (tablas, rutas, columnas) van en inglés, como en `schema.ts`; los textos de producto, en español.

Alcance en una línea: **subauxiliar comercial de cobros** (catálogo D21 A7.1–A7.5, parte de A19.2 y A8.2/A8.3 solo como eventos). Queda fuera la emisión fiscal (I03), el libro mayor, el contrato y la rescisión (§9).

## 1. Propósito y usuarios

### Problema

Tras la venta (M03 cierra el negocio con unidad única en `unit_sales`) el dinero del comprador no se sigue en ningún sitio: el plan 10/40/50 se calcula en memoria para cotizar (`src/domain/confotur.ts:39`) pero no se persiste cronograma, no se registran pagos, no hay estado de cuenta ni mora, y la comisión no puede devengarse «por cobro» (D21 A7, A8.2; PLAN-INTEGRAL §1 fila A7 «AUSENTE»). En preventa el cobro es la mitad del negocio: el cliente paga en USD o DOP, a plazos contra avance de obra, y el equipo necesita saber quién debe qué y desde cuándo. Frecuencia de pagos, volumen de cuotas y tiempo hoy invertido en Excel son **UNKNOWN**; no se inventa una línea base.

### Proceso objetivo

Negocio ganado con unidad (venta en `unit_sales`) → **plan de pagos** creado desde una plantilla del proyecto (separación, cuotas durante construcción, contra entrega) → cronograma de cuotas con vencimientos → **pagos** registrados por admin o asistente (medio de pago, referencia, comprobante opcional, moneda y tasa congelada) → **imputación automática** a las cuotas más antiguas → estado de cuenta por comprador y por unidad (PDF/CSV) → mora derivada y recordatorio por evento → eventos al outbox para facturación (I03) y comisiones (M10). Un pago equivocado no se borra: se **anula** con motivo y segunda aprobación.

### Actores

| Actor | Trabajo principal | Alcance y límites (`payments` = recurso nuevo, ver §4) |
|---|---|---|
| Administrador | Crear planes y plantillas, registrar pagos, aprobar anulaciones, ver cartera global, exportar | `payments:view|create|edit|export:all`. Es el único que crea/versiona plantillas, crea planes, carga tipos de cambio y aprueba anulaciones (distinto del solicitante). Es el único rol que puede ver el precio de lista real, y aun así M22 no lo copia ni lo muestra |
| Asistente | Registrar pagos, adjuntar comprobante, solicitar anulación, consultar estados de cuenta | `payments:view|create:all`, sin `edit` ni `export` de cartera global. Ve cuotas, pagos y saldos (los necesita para cobrar) pero **nunca** precio de lista real, precio interno de proyecto ni comisión (SUPUESTO S-22-02: esto abre al asistente datos financieros del cobro que M03 S-309 le niega en Negocios; D12 debe confirmarlo) |
| Broker | Consultar el estado de cuenta de sus clientes para dar seguimiento | `payments:view|export:own` filtrado por `deals.broker_id`; solo lectura; sin precio real; DTO reducido (sin referencia de pago, sin comprobante, sin motivo de anulación). No registra, no anula, no ve clientes ajenos |
| Comprador (cliente final) | Recibir su estado de cuenta | No entra al CRM (D-08). Recibe el PDF por el canal que decida el equipo; el Client Room es otra ficha (D21 A9) |

### Reglas firmadas que gobiernan el módulo

| Regla | Fuente | Consecuencia en M22 |
|---|---|---|
| Precio de lista real y comisión de terceros solo admin | Decisión #47 (2), `docs/contexto/decisiones.md:311`; D-07 | Ninguna tabla ni DTO de M22 guarda o devuelve `units.real_price_cents` ni `projects.internal_price_cents`; el total del plan es el **monto comercial** acordado (`deals.amount_cents`), proyectado por rol (CA-17) |
| Nada se elimina | D-10 del Expediente, #46, `docs/contexto/decisiones.md:308` | Sin DELETE de planes, cuotas, pagos ni imputaciones; la anulación es un estado con rastro (CA-12). FK `RESTRICT` |
| Un solo nivel de aprobación por un admin distinto del autor, con motivo, caducidad de 7 días | Decisión #47 (1), mismo patrón | La anulación de pago reutiliza ese contrato (A19.2 «doble aprobación»); duración en la misma fuente única de configuración (SUPUESTO S-22-06) |
| Una unidad se vende una sola vez | Decisión #47 (3); `unit_sales` (`schema.ts:758`) | El plan cuelga de la venta durable (`unit_sale_id`), no del negocio abierto; un plan vivo por venta |
| La fuente de verdad comercial es PostgreSQL local; los sistemas externos se ven por puerto | #43, #45, ARQ-VRE-002 | El módulo funciona sin I03 ni ERP; la emisión fiscal y el libro mayor son consumidores del outbox |

## 2. Estado actual (AS-IS, del inventario P0)

| Superficie | HECHO y evidencia | Brecha frente al objetivo |
|---|---|---|
| Plan 10/40/50 | Cálculo puro en memoria: `PlanDePagoConfotur` con reserva, separación, cuotas de construcción, contra entrega (`src/domain/confotur.ts:39-64`); lo expone el cotizador (`src/app/api/cotizador/confotur/`) | No se persiste; porcentajes fijos, no parametrizables por proyecto; no genera cronograma con fechas ni sigue cobros |
| Venta cerrada | `unit_sales`: id uuid, `unit_id`, `deal_id`, `project_id`, `unit_code_normalized`, UNIQUE de unidad, negocio e identidad, `ON DELETE RESTRICT`, RLS (`schema.ts:758-770`); migraciones `0004_cierre_venta_unica.sql` y `0005_identidad_venta_durable.sql` | Es el ancla correcta del plan. Negocios ganados históricos sin unidad concreta no tienen fila (S-303-H en M03): no admiten plan |
| Montos y roles | `deals.amount_cents` bigint nullable, `currency` default USD (`schema.ts:672`, `:689-691`); `units.real_price_cents` restringido por el recurso `unit_real_price` (`schema.ts:475`, comentario del campo); `projects.internal_price_cents` (`:424`) | El monto comercial es el candidato a total del plan; el precio real debe quedar fuera de toda proyección de M22 |
| Comisiones | `commissions` con UNIQUE por negocio, `paid_at`, estados `pending|approved|paid|void` (`schema.ts:909`, `COMMISSION_STATUSES` en `catalogs.ts`) | Se crea al cierre, no se devenga por cobro ni se revierte; M10 consumirá los eventos de M22 |
| Outbox | Tabla con UNIQUE de `idempotency_key`, CHECK de tipos `('LeadCreado','NegocioCambioEtapa','ActividadRegistrada')` (`schema.ts:1153`, `:1175`); `aggregate_id` entero; `TIPOS_EVENTO_CRM` (`application/compartido/crm.ts:20`) | Los tres eventos de M22 no existen en el enum ni en el CHECK. **Riesgo HECHO:** el worker valida con una unión discriminada cerrada (`outbox/worker.ts:7`, `:38`); un tipo desconocido cae en `NON_RETRYABLE` y va a la cola muerta. Sin cambio previo, `PagoRegistrado` se perdería como «fallo» (CA-23) |
| Auditoría y archivos | `audit_log` con `entity_type` de `ENTITY_TYPES` y acciones de `AUDIT_ACTIONS` (`catalogs.ts:61`, `:99`); `files` polimórfica (`schema.ts:1056`); puerto `AlmacenamientoArchivos` (`application/compartido/almacenamiento.ts`) | No existen tipos `payment*` ni acciones de pago; comprobantes reutilizan `files` |
| Mensajería | Puerto de despacho de comunicaciones: `ProveedorDespachoCanal` (`application/comunicaciones/puertos.ts:60`); el nombre `MensajeriaPort` es el de ARQ-VRE-002 y no existe como símbolo TS | M22 no envía: emite el evento y el consumidor (M11) decide plantilla y canal |
| Patrón de casos de uso | `UnidadDeTrabajo<R>` (`application/compartido/unidad-de-trabajo.ts`), `puertos.ts`, `casos-de-uso.ts`, `en-memoria.ts`, `consultas.ts` en `application/pipeline/` | Se replica la forma; no se debilita `arquitectura.test.ts` |
| Permisos | Recursos cerrados en `PERMISSION_RESOURCES`, acciones `view|create|edit|delete|import|export`, alcances `none|own|team|all` (`domain/catalogs.ts:19-45`); `requireScope`, `requireFullScope`, `reaches` (`domain/rbac.ts`) | No hay recurso de cobros; no existe acción `approve` (la aprobación se modela con `edit` + alcance `all` + autor distinto, §4) |
| UI | Sin ruta de cobros en `src/app/(crm)/`; Pagos fue excluido de la ficha M03 por mandato (`M03-negocios.md` §9 «Fuera de M03») | Pendiente de construir por completo |

D21 clasifica A7.1 (cronograma), A7.2 (pagos con imputación), A7.3 (estado de cuenta), A7.4 (mora y cartas) y A7.5 (multimoneda con diferencial) como ESENCIALES y NUEVAS; A7.6 (hitos de obra), A7.7 (comprobante fiscal y conciliación bancaria) y A7.8 (reestructuración de plan) quedan fuera de este núcleo (§9). No se ha consultado la base: los conteos de ventas con plan potencial son UNKNOWN; el único dato verificado es que M03 reporta 15 negocios ganados sembrados con venta (M03, «Corrección de S-303-H»).

Análisis GitNexus/impacto: no aplica a esta entrega (no se edita ningún símbolo). **Cada lote de §9 exige `gitnexus_impact` sobre los símbolos que toque** (en especial `TIPOS_EVENTO_CRM`, `procesarOutbox`, `PERMISSION_RESOURCES`, `AUDIT_ACTIONS`) y `gitnexus_detect_changes` antes del commit del orquestador.

## 3. Pantallas

### Contrato común

Ruta raíz `/cobros` (módulo **Cobros**, workspace comercial, entrada de navegación condicionada a `payments:view`). Diseño según `docs/DESIGN.md`: una acción primaria por vista, inspector/hoja inferior para detalle, tokens semánticos, textos ≥13 px, objetivos táctiles ≥48×48 px, sin confeti ni cifras de adorno. Dinero siempre con su moneda; **nunca se suman USD y DOP** (totales por moneda). Fechas de vencimiento y mora en `America/Santo_Domingo`: una cuota vence al terminar el día de `due_date`; está vencida desde el día siguiente. Móvil 320/390: tarjetas apiladas, filtros y acciones en hoja inferior, dock del shell, cero overflow horizontal; en 768/1440 tabla semántica. Acciones de dinero con confirmación explícita y sin doble envío. Componentes: `Card`, `Tabs`, `Drawer`, `ChartCard` ya instalados; IDs de Viltrum Design pendientes de D05 (no se adquiere nada por esta ficha). Cada texto de producto en español; «recibo» nunca se presenta como «factura» ni «comprobante fiscal» (S-22-01).

### SCR-COB-CARTERA · `/cobros`

- **Tabs:** **Cartera** (planes activos: comprador, proyecto/unidad, moneda, total, cobrado, pendiente, vencido, próxima cuota) · **Vencidas** (cuotas con atraso agrupadas por tramo 1–30, 31–60, 61–90, >90 días, con días de atraso) · **Pagos** (últimos pagos registrados, incluidos anulados marcados) · **Plantillas** y **Tipos de cambio** (solo admin).
- **Consultas:** `consultarCarteraDeCobros(actor, filtros)`, `consultarCuotasVencidas(actor, filtros)`, `consultarPagos(actor, filtros)`, `consultarPlantillas(actor)`. Filtros por proyecto, broker (solo si el alcance lo permite), moneda, estado del plan, rango de vencimiento. Totales siempre calculados con los mismos filtros y alcance que las filas; una fila por plan.
- **Acciones:** abrir plan; **Registrar pago** (admin y asistente; acción primaria contextual); **Nuevo plan** (admin, desde una venta sin plan, también accesible desde la ficha de Negocios); exportar CSV de cartera (admin).
- **Móvil:** lista de tarjetas con indicador de mora, filtros en hoja inferior.
- **Seis estados:**

| Estado | Comportamiento |
|---|---|
| Carga | Esqueleto de filas y de contadores, `aria-busy`; sin acciones de dinero activas |
| Vacío | Distingue «aún no hay planes de pago» (con CTA **Nuevo plan** solo para admin y explicación de que se crean desde una venta cerrada) de «ningún resultado con estos filtros» (limpiar filtros) |
| Error | Mensaje recuperable con reintento; jamás ceros sustitutos ni cifras de ejemplo |
| Sin conexión | Aviso; datos ya cargados en solo lectura; registrar pago, aprobar y exportar desactivados; sin cola de escritura offline |
| Éxito | Tras confirmar el servidor: toast con número de recibo, contadores y saldos actualizados desde la respuesta, foco devuelto |
| Permiso insuficiente | Sin recurso `payments:view`: pantalla denegada; broker ve solo su cartera; ID ajeno responde 404 sin metadatos |

Estados adicionales: conflicto `409` (saldo cambió, pago duplicado) con «Actualizar y revisar»; sesión expirada conserva el formulario sin persistirlo; carga parcial nunca se rotula como total.

### SCR-COB-PLAN · `/cobros/planes/[id]` (detalle y estado de cuenta de la unidad)

- **Cabecera:** comprador (contacto), proyecto y unidad (código), moneda, total (monto comercial), cobrado, pendiente, vencido, % cobrado, estado del plan. **No** muestra precio de lista real ni comisión a ningún rol dentro de esta pantalla.
- **Tabs:** **Cronograma** (cuotas: n.º, concepto, vencimiento, monto, cobrado, pendiente, estado `pendiente | parcial | pagada | vencida`, días de atraso) · **Pagos** (fecha, medio de pago, referencia [no broker], monto en la moneda original, tasa congelada, equivalente aplicado, imputación por cuota, estado `registrado | anulado | anulación pendiente`, comprobante [no broker]) · **Estado de cuenta** (vista imprimible/exportable) · **Historial** (auditoría de plan, pagos y anulaciones; solo admin y asistente).
- **Acciones:** **Registrar pago** (admin/asistente), **Adjuntar comprobante** (admin/asistente), **Solicitar anulación** (admin/asistente, sobre un pago registrado), **Revisar anulación** (admin distinto del solicitante: Aprobar/Rechazar con motivo), **Exportar PDF/CSV** (admin, asistente [estado de cuenta, no cartera], broker propio).
- **Consultas:** `consultarPlan(actor, id)`, `consultarEstadoDeCuenta(actor, {planId|unitSaleId|contactId})`, `consultarSolicitudesDeAnulacion(actor, planId)`.
- **Móvil:** cuotas como tarjetas con barra de avance; pagos en una segunda sección desplegable; acciones en el pie sticky de la hoja, nunca tapadas por el dock.
- **Seis estados:** carga con esqueleto del tab; vacío «Sin pagos registrados todavía» con CTA para quien pueda; error con reintento por tab y sin cerrar la hoja; sin conexión solo lectura; éxito con resumen de lo imputado («Se aplicó a las cuotas 2 y 3»); permiso insuficiente 403/404 sin filtrar existencia. Conflicto `409` por saldo, solicitud pendiente o plan completado.

### Diálogos

| Diálogo | Contenido y reglas |
|---|---|
| **Nuevo plan** (admin) | Venta (preseleccionada), plantilla del proyecto (o la global por defecto), fecha de inicio, moneda (por defecto la del negocio), total (por defecto `deals.amount_cents`; cambiarlo exige motivo y queda auditado), tasa de referencia opcional (solo USD). **Vista previa** del cronograma calculada por una función pura sin persistir; **Crear plan** confirma. Si la plantilla usa «contra entrega» y el proyecto no tiene `estimated_delivery_date`, pide una fecha manual |
| **Registrar pago** | Monto, moneda (USD/DOP), fecha de valor (no futura), medio de pago (transferencia, cheque, tarjeta, efectivo, depósito), referencia (≤120 caracteres), tasa del día si la moneda difiere de la del plan (precargada con el último tipo de cambio registrado, editable, con aviso si difiere más de lo razonable), comprobante opcional. Muestra **antes de confirmar** cuánto se aplicará a cada cuota y el saldo restante. Rechaza un monto mayor al saldo pendiente. Clave de idempotencia generada por el cliente por intento |
| **Solicitar anulación** | Motivo obligatorio (texto no blanco); informa que otro administrador debe aprobar y que caduca a los 7 días |
| **Revisar anulación** | Datos del pago, solicitante, fecha, motivo; efecto previsto en cuotas; Aprobar/Rechazar con motivo obligatorio; inactivo si ya caducó o si el revisor es el solicitante |

### Wireframes de adaptación

```text
1440 · /cobros                                             390 / 320
Cobros     [Buscar] [Proyecto] [Moneda] [Estado]  [Registrar pago]   Cobros            [Registrar]
[Cartera][Vencidas][Pagos][Plantillas][Tipos de cambio]              [Cartera][Vencidas][Pagos]
USD: cobrado · pendiente · vencido   DOP: cobrado · pendiente · vencido   [Buscar][Filtros en hoja]
Comprador | Unidad | Mon. | Total | Cobrado | Pendiente | Vencido     > Comprador · Unidad · USD
          | Próxima cuota | Mora                                        Cobrado ▇▇▇░░ 40%  Mora 12 d
                                              [Plan 360 al abrir]      [Ver plan] [Registrar pago]
```

## 4. Funciones (casos de uso)

### Contrato común

Capa `src/application/cobros/` (puertos, casos de uso, consultas, doble en memoria) con SQL y Drizzle solo en `src/infrastructure/db/repos/cobros.ts`. Toda mutación corre en una `UnidadDeTrabajo<ReposCobros>`; la auditoría y el outbox viajan en el mismo juego de repositorios, y un fallo de cualquiera revierte el conjunto. Todos los importes son enteros en centavos (`bigint`); las conversiones de moneda usan **BigInt** (centavos × micros supera 2^53) con redondeo medio hacia arriba definido en una sola función de dominio. Cada ruta de `src/app/api/cobros/**` llama a `requireScope`/`requireFullScope` **antes** de tocar datos; las rutas por `:id` filtran con `visibleRows`/`reaches` por el `broker_id` del negocio de la venta y cumplen `seguridad-rutas-id.test.ts`. Cuerpos JSON con Zod estricto (`.strict()`), asignación campo por campo, actor siempre de la sesión. Errores: 400 forma, 403 sin permiso, 404 inexistente o fuera de alcance, 409 regla de negocio o concurrencia.

**Permisos propuestos (PROPUESTA, se acuerdan con G04):** recurso nuevo `payments` en `PERMISSION_RESOURCES`. `view` ver planes/pagos/estados; `create` registrar pago, adjuntar comprobante y solicitar anulación; `edit` con alcance `all` = crear plan, gestionar plantillas y tipos de cambio, aprobar/rechazar anulaciones (siempre con autor distinto del solicitante); `export` exportar. `delete` no se concede a nadie. Seed: admin `all` en las cuatro; asistente `view:all` y `create:all`; broker `view:own` y `export:own`.

| Caso de uso | Entrada (Zod) | Reglas de negocio y salida | Errores | Permiso | Evento (outbox) | Idempotencia |
|---|---|---|---|---|---|---|
| `previsualizarPlan` (función pura) | `{unitSaleId, templateId, startDate, totalCents, currency}` | Calcula cuotas sin persistir: cada línea de la plantilla × total en puntos básicos, repartida en N cuotas; el residuo de centavos va a la **última cuota de la línea**; suma exacta = total | 400 forma, 404 venta o plantilla ajena, 409 plantilla inactiva o suma ≠ 10000 pb, `DELIVERY_DATE_REQUIRED` | `payments:edit:all` | — | Pura y repetible |
| `crearPlanDePagos` | Igual que la vista previa + `referenceRateMicros?` y `reason?` si el total difiere del monto comercial | Venta existente en `unit_sales`; operación `sale`; sin plan vivo para esa venta; moneda USD/DOP; persiste plan + cuotas atómicamente; suma de cuotas = `total_cents` | 404/409 (`PLAN_ALREADY_EXISTS`, `SALE_NOT_FOUND`, `SUM_MISMATCH`) | `payments:edit:all` | — (no hay dinero aún; auditoría `crear`) | UNIQUE parcial por venta + clave de cliente `Idempotency-Key`; repetir devuelve el plan existente |
| `gestionarPlantilla` (crear / nueva versión / desactivar) | `{projectId?, name, lines[{position, kind, label, basisPoints, installments, dueRule, offsetDays?, intervalMonths?}]}` | Líneas suman 10000 pb; versionado: una plantilla usada **no se edita**, se crea la versión siguiente; desactivar no borra | 400/409 suma, 404 proyecto | `payments:edit:all` | — | UNIQUE (proyecto, nombre, versión) |
| `registrarTipoDeCambio` | `{rateDate, rateMicros, source}` | USD→DOP en micros enteros (1 USD = rate/1e6 DOP); rango razonable; una por (fecha, fuente) | 400, 409 duplicada | `payments:edit:all` | — | UNIQUE (fecha, par, fuente) |
| **`registrarPago`** | `{planId, amountCents, currency, receivedAt, method, reference?, exchangeRateMicros?, idempotencyKey}` | Ver algoritmo abajo. Salida: pago, recibo `RC-AAAA-NNNNNN`, imputaciones por cuota, saldo | 400 forma, 404 plan ajeno, 409 `EXCEEDS_BALANCE`, `PLAN_COMPLETED`, `RATE_REQUIRED`, `IDEMPOTENCY_CONFLICT` | `payments:create:all` (admin, asistente) | `PagoRegistrado` | UNIQUE (plan, clave); misma clave + mismo contenido = respuesta original; mismo clave + otro contenido = 409 |
| `adjuntarComprobante` | `{paymentId, archivo}` (MIME y tamaño en lista blanca) | Sube vía `AlmacenamientoArchivos` **fuera** de la transacción y registra en `files` (`entity_type='payment'`, visibilidad `internal`); un comprobante subido nunca se borra después del commit | 400 MIME, 404, 409 | `payments:create:all` | — | Por hash de contenido y pago |
| `solicitarAnulacionDePago` | `{paymentId, reason}` | Pago `registered`; sin solicitud pendiente; motivo no blanco; crea solicitud con `expires_at = requested_at + 7 días` | 404, 409 (`ALREADY_VOIDED`, `REQUEST_PENDING`) | `payments:create:all` | — | UNIQUE parcial una pendiente por pago |
| **`resolverAnulacionDePago`** | `{requestId, decision: approve|reject, reason}` | Solo un administrador activo **distinto** del solicitante; motivo obligatorio; vigente solo si `now < expires_at`. Aprobar: bloquear plan, marcar pago `voided`, revertir sus imputaciones (`reversed_at`) y restar de `paid_cents`, reabrir el plan si estaba completo; en una sola transacción | 403 no admin o mismo autor, 400 sin motivo, 409 resuelta/caducada | `payments:edit:all` | `PagoAnulado` (solo al aprobar) | Resolución única por solicitud (CAS); dos admins simultáneos: uno aplica, el otro 409 |
| `procesarVencimientos` | `{hoy?}` (solo pruebas) | Cuotas abiertas con `due_date < hoy local` y sin notificar en el episodio actual: marca `overdue_notified_at`, incrementa `overdue_episode`, emite evento. La **mora mostrada** se deriva en lectura y no depende de este proceso | 403 | Admin (botón) o el planificador que fije D16 (S-22-09) | `CuotaVencida` | Clave `CuotaVencida:{installmentId}:{episode}` |
| Consultas de cartera, plan, pagos, vencidas, estado de cuenta | Filtros tipados; orden en lista blanca; paginación por cursor | Alcance primero (`visibleRows`); proyección por rol (§5); una fila por plan; totales por moneda | 400, 403, 404 | `payments:view:own|all` | — | Lectura repetible |
| `exportarEstadoDeCuenta` | `{planId|contactId, formato: csv|pdf}` | Mismos datos y proyección que la pantalla; CSV con neutralización de fórmulas (`domain/csv.ts`); PDF servidor con pie «Documento informativo; no es comprobante fiscal» | 400, 403, 404 | `payments:export:own|all` | — | Sin escritura; se audita la descarga |

### Algoritmo de `registrarPago` (contrato obligatorio de concurrencia)

Dentro de **una** transacción:

1. Buscar por (`plan_id`, `idempotency_key`): existente con el mismo hash del contenido → devolver el resultado original marcado `replayed`; distinto hash → `IDEMPOTENCY_CONFLICT`.
2. `SELECT … FROM payment_plans WHERE id = $1 FOR UPDATE` (serializa todos los pagos y anulaciones de un plan; el bloqueo es por plan, no global). Verificar alcance del actor sobre la venta, plan `active`.
3. Bloquear las cuotas `open` con saldo, ordenadas por (`due_date`, `number`, `id`).
4. Si la moneda del pago ≠ moneda del plan, exigir `exchange_rate_micros`; calcular `applied_cents` en moneda del plan con BigInt (medio hacia arriba). Si `applied_cents` > saldo pendiente total → `EXCEEDS_BALANCE` (no hay saldo a favor, S-22-04).
5. Imputar a las cuotas más antiguas hasta agotar el monto; cada imputación hace `UPDATE … SET paid_cents = paid_cents + x WHERE id = $ AND paid_cents + x <= amount_cents` (0 filas = conflicto y rollback), la última absorbe el redondeo para que Σ imputaciones = `applied_cents`.
6. Insertar pago, imputaciones (con diferencial cambiario si aplica), marcar el plan `completed` si todas las cuotas quedaron pagadas, auditar (`registrar_pago`) y emitir `PagoRegistrado`.

La barrera final no es el bloqueo sino la base: `CHECK (paid_cents between 0 and amount_cents)`, UNIQUE (`payment_id`, `installment_id`) y el UPDATE condicional. Un fallo en cualquier paso no deja pago a medias.

### Cálculo de moneda y diferencial cambiario

- `exchange_rate_micros`: pesos por 1 dólar × 1.000.000 (entero, 1.000.000–1.000.000.000 como cota técnica). Pago USD a plan USD o DOP a plan DOP: sin tasa. Pago DOP a plan USD: `applied_usd = round(dop_cents × 1.000.000 / rate_micros)`. Pago USD a plan DOP: `applied_dop = round(usd_cents × rate_micros / 1.000.000)`. La tasa **se congela en el pago**; cambiar la tabla de tipos de cambio nunca altera pagos hechos.
- **Diferencial cambiario** (solo plan USD pagado en DOP): por imputación, `fx_difference_cents` (DOP, con signo) = DOP atribuidos a esa imputación a la tasa del pago − DOP equivalentes a la **tasa de referencia del plan** (congelada al crear el plan). Es un dato informativo para el contador; si el plan no tiene tasa de referencia, queda NULL y la pantalla lo dice (S-22-07).

## 5. Datos

Todas las tablas nuevas: `.enableRLS()` en `schema.ts` (como `outbox`: acceso solo servidor, sin políticas públicas), FK `ON DELETE RESTRICT ON UPDATE RESTRICT`, importes `bigint` en centavos con su moneda, instantes `timestamptz`, fechas de calendario `date`, `timestamps` y `authorship` del archivo. Nombres de columnas son PROPUESTA de D11, sustituibles con garantía equivalente.

### Tablas nuevas

| Tabla | Campos clave | Restricciones e índices |
|---|---|---|
| `payment_plan_templates` | `id` serial, `project_id` nullable (NULL = plantilla global), `name`, `version` int, `is_active`, auditoría | UNIQUE (`project_id`, `name`, `version`) (con NULL tratado vía índice parcial); una plantilla global «Preventa 10/40/50» sembrada |
| `payment_plan_template_lines` | `template_id`, `position`, `kind` (`separation|construction|delivery|other`), `label`, `basis_points`, `installments` (1–120), `due_rule` (`on_start|monthly_from_start|on_delivery|fixed_date`), `offset_days`, `interval_months`, `fixed_date` | UNIQUE (`template_id`, `position`); CHECK `basis_points` 1–10000, `installments` 1–120; suma = 10000 validada por Zod/caso de uso y verificada otra vez al crear el plan |
| `payment_plans` | `id` serial, `unit_sale_id` uuid → `unit_sales(id)`, `template_id` (procedencia), `template_version`, `currency` (`USD|DOP`), `total_cents` > 0, `start_date`, `reference_rate_micros` nullable, `status` (`active|completed|cancelled`), `completed_at`, auditoría | UNIQUE parcial (`unit_sale_id`) donde `status <> 'cancelled'` (un plan vivo por venta); `cancelled` lo reserva el futuro módulo de contratos/rescisión (M22 no lo establece); sin columna de precio real |
| `payment_installments` | `id` serial, `plan_id`, `number`, `kind`, `label`, `due_date`, `amount_cents` > 0, `paid_cents` default 0, `status` (`open|void`), `overdue_notified_at`, `overdue_episode` int default 0 | UNIQUE (`plan_id`, `number`); **CHECK `paid_cents between 0 and amount_cents`**; índice (`plan_id`, `due_date`, `number`); parcial (`due_date`) donde `status='open' and paid_cents < amount_cents` para el barrido de mora |
| `payments` | `id` serial, `plan_id`, `receipt_number` text, `received_at` date, `amount_cents` > 0, `currency`, `applied_currency`, `applied_cents` > 0, `exchange_rate_micros`, `exchange_rate_source`, `method` (`transfer|check|card|cash|deposit`), `reference` ≤120, `idempotency_key`, `request_hash`, `status` (`registered|voided`), `voided_at`, `voided_by`, `void_reason`, auditoría | UNIQUE (`plan_id`, `idempotency_key`); UNIQUE (`receipt_number`) (secuencia `payment_receipt_seq`, huecos por rollback aceptados: es un recibo interno no fiscal); **CHECK de tasa**: misma moneda ⇒ tasa NULL; moneda distinta ⇒ tasa > 0; CHECK `(status='voided') = (voided_at is not null)` y motivo no blanco; índice (`plan_id`, `received_at`, `id`) |
| `payment_allocations` | `id` serial, `payment_id`, `installment_id`, `amount_cents` > 0 (moneda del plan), `fx_difference_cents` nullable, `reversed_at`, `reversed_by` | UNIQUE (`payment_id`, `installment_id`) (un pago no se imputa dos veces a la misma cuota); índices por `installment_id` y `payment_id`; las filas nunca se borran: la anulación fija `reversed_at` |
| `payment_void_requests` | `id` serial, `payment_id`, `requested_by`, `reason`, `requested_at`, `expires_at`, `status` (`pending|approved|rejected|expired`), `resolved_by`, `resolved_at`, `resolution_reason` | UNIQUE parcial (`payment_id`) donde `status='pending'`; CHECK `expires_at > requested_at`, motivos no blancos, `resolved_by <> requested_by`, resolución completa si `status <> 'pending'`; resolución única (CAS sobre `status='pending'`) |
| `exchange_rates` | `id` serial, `rate_date`, `from_currency` (`USD`), `to_currency` (`DOP`), `rate_micros`, `source`, auditoría | UNIQUE (`rate_date`, `from_currency`, `to_currency`, `source`); CHECK rango de `rate_micros` |

### Modificaciones a catálogos y tablas existentes (migración aditiva)

| Cambio | Detalle |
|---|---|
| `PERMISSION_RESOURCES` | Añadir `payments` y sembrar permisos (admin, asistente, broker) como en §4 |
| `ENTITY_TYPES` | Añadir `payment_plan`, `payment`, `payment_void_request`, `payment_plan_template` (columna de texto sin CHECK, no exige migración según el comentario de `catalogs.ts:66`) |
| `AUDIT_ACTIONS` | Añadir `registrar_pago`, `anular_pago`, `aprobar`, `rechazar` |
| `outbox` | Reemplazar `outbox_type_check` para admitir `PagoRegistrado`, `PagoAnulado`, `CuotaVencida`; `aggregate_id` ya es entero (id del pago o de la cuota) |
| `unit_sales` | Sin cambios. No se toca el CHECK ni los UNIQUE de venta única |

### Migración propuesta

Archivo `drizzle/0006_cobros_plan_de_pagos.sql` (el último existente es `0005_identidad_venta_durable.sql`), generado con `drizzle-kit` y revisado a mano, con `SET LOCAL lock_timeout = '5s'` como las anteriores. Solo `CREATE` y `ALTER … CONSTRAINT` del outbox; sin backfill (los negocios ganados existentes no reciben plan automático: lo crea el admin). Debe aplicarse con el migrador oficial y pasar el ensayo sobre base poblada de `scripts/test-db/migracion-poblada.mjs`. Reversión: tablas nuevas sin datos pueden descartarse; con datos, la reversión es una migración posterior revisada, nunca un DROP con datos de pago.

### Reglas de integridad

| # | Regla | Dónde se garantiza |
|---|---|---|
| IR-01 | Σ `amount_cents` de cuotas no anuladas = `payment_plans.total_cents` | Caso de uso en la creación **y** barrera en BD: disparador de restricción diferido (`DEFERRABLE INITIALLY DEFERRED`) sobre `payment_installments`; sin él la propiedad no se puede afirmar |
| IR-02 | `paid_cents` nunca supera `amount_cents` ni baja de 0, ni con pagos simultáneos | CHECK + UPDATE condicional + bloqueo del plan |
| IR-03 | Σ imputaciones vigentes de un pago = `applied_cents` y un pago no se imputa dos veces a una cuota | UNIQUE (`payment_id`, `installment_id`); suma verificada en el caso de uso y por consulta de invariantes en `test:db` |
| IR-04 | Σ imputaciones vigentes de una cuota = `paid_cents` | Prueba de invariantes en `test:db` (consulta de control) |
| IR-05 | Un pago solo se registra una vez por clave de cliente | UNIQUE (`plan_id`, `idempotency_key`) + hash del contenido |
| IR-06 | Anulación única y con segunda persona distinta | UNIQUE parcial de solicitud pendiente, CHECK `resolved_by <> requested_by`, CAS de estado |
| IR-07 | Moneda y tasa coherentes | CHECK de `payments` (§5) |
| IR-08 | Un plan vivo por venta | UNIQUE parcial de `payment_plans` |
| IR-09 | Nada se elimina | FK `RESTRICT`, sin ruta ni permiso `delete`, `guards` de adaptador |

### Proyección por rol (se aplica antes de leer, no en JSX)

| Dato | Administrador | Asistente | Broker (solo `own`) |
|---|---|---|---|
| Total del plan (monto comercial), cuotas, saldos, mora | Sí | Sí | Sí |
| Pagos: fecha, monto, medio de pago, moneda, tasa | Sí | Sí | Sí (medio de pago sí) |
| `reference`, comprobante, motivos de anulación y solicitudes | Sí | Sí | No |
| Diferencial cambiario, tasa de referencia, historial de auditoría | Sí | No | No |
| `units.real_price_cents`, `projects.internal_price_cents`, comisión | **No se leen** | **No se leen** | **No se leen** |

Un DTO por rol, centinelas en pruebas (CA-17). Las consultas seleccionan columnas por proyección; nunca `SELECT *` seguido de ocultación.

## 6. Integraciones y puertos

| Puerto | Uso en M22 | Estado y degradado |
|---|---|---|
| `UnidadDeTrabajo<ReposCobros>` | Toda mutación atómica | Existe el patrón (`compartido/unidad-de-trabajo.ts`) |
| `ConsultasCobros` (lectura) | SQL fuera de `application/` | Nuevo; la página solo ve DTO |
| `OutboxFinanzas` (nuevo, mismo patrón que `OutboxCrm`) | Emitir `PagoRegistrado`, `PagoAnulado`, `CuotaVencida` en la misma transacción | El adaptador escribe en la tabla `outbox`; si insertar falla, la transacción revierte |
| `AlmacenamientoArchivos` | Comprobantes opcionales | Si falla la subida, el pago se puede registrar sin adjunto y se avisa; un adjunto no condiciona el dinero |
| `Reloj` inyectado | Vencimiento y mora determinista | Sin dependencia de reloj global en dominio |
| `GeneradorEstadoDeCuentaPdf` (nuevo) | PDF servidor (react-pdf, ya previsto para cotizaciones en D21) | Si falla, CSV sigue disponible |
| `MensajeriaPort` (ARQ-VRE-002; hoy `ProveedorDespachoCanal`) | **No lo llama M22**: M11 consume `CuotaVencida` y decide plantilla/canal | Sin proveedor, el recordatorio queda como tarea visible en Vencidas |
| `FacturacionPort` (I03) | Consumidor futuro de `PagoRegistrado`/`PagoAnulado` | Sin I03 el módulo funciona completo con recibo interno |
| `ContabilidadPort` | Consumidor futuro (subauxiliar → libro) | Diferido por decisión del contador |
| `TipoDeCambioPort` (BCRD) | **Fuera del núcleo**; hoy la tasa se carga a mano | S-22-05 |

### Eventos (todos con payload mínimo, sin montos, nombres ni referencias)

| Evento | `aggregateId` | Payload | Se emite cuando | Consumidor |
|---|---|---|---|---|
| `PagoRegistrado` | id del pago | `{id, planId}` | Commit de un pago | I03 (documento fiscal/recibo), M10 (devengo de comisión por cobro, D21 A8.2) |
| `PagoAnulado` | id del pago | `{id, planId}` | Commit de una anulación aprobada | I03 (nota de crédito si hubo documento), M10 (reversa A8.3) |
| `CuotaVencida` | id de la cuota | `{id, planId}` | `procesarVencimientos` marca el episodio de mora | M11 (recordatorio), M21 (alertas) |

Idempotencia: claves `PagoRegistrado:{id}`, `PagoAnulado:{id}`, `CuotaVencida:{id}:{episode}` sobre `outbox_idempotency_unq`.

**Requisito previo bloqueante para estos eventos (HECHO en §2):** el worker actual (`outbox/worker.ts:7`) solo conoce tres tipos y manda cualquier otro a cola muerta. Antes de emitir, un lote de D19/D10 debe (a) ampliar `TIPOS_EVENTO_CRM`/CHECK, (b) hacer que la cola del worker CRM **reclame solo sus tipos**, de modo que los eventos financieros permanezcan pendientes (sin consumir intentos ni pasar a `outbox_dead`) hasta que exista su consumidor (I03/M10/M11). Hasta entonces el negocio funciona y los eventos quedan como cola pendiente legible.

## 7. Métricas y reportes que alimenta

Todas por moneda, con alcance del actor, fechas en `America/Santo_Domingo`; los nulos son dato ausente, no cero.

| Métrica / destino | Definición |
|---|---|
| Cartera por cobrar · M12, Inicio | Σ (`amount_cents − paid_cents`) de cuotas abiertas de planes `active`, por moneda |
| Cobrado del período · M12 | Σ `applied_cents` de pagos `registered` con `received_at` en el período, por moneda del plan |
| Vencido y antigüedad (aging) · M12/M21 | Saldo de cuotas con `due_date < hoy` por tramos 1–30, 31–60, 61–90, >90 días (D21 A13.2) |
| % cobrado por proyecto/unidad | cobrado ÷ total del plan |
| Pagos anulados | Conteo y monto por período; control antifraude (A19.2) |
| Cobrado acumulado de una venta · M10 | Insumo de devengo de comisión por cobro (porcentaje cobrado del plan) |
| Diferencial cambiario del período · contador | Σ `fx_difference_cents` de imputaciones vigentes (informativo, DOP) |

El tiempo de respuesta, la carga y la retención son **UNKNOWN**; los NFR numéricos los fija una tarea de D15 con carga documentada. Verificación de rendimiento: EXPLAIN de la consulta de cartera y del barrido de mora sobre un conjunto sintético documentado.

## 8. Criterios de aceptación (verificables)

Pruebas futuras; ninguna se ejecutó en esta sesión. Las de dinero corren en PostgreSQL local aislado (`npm run test:db`), con credenciales solo del entorno.

1. **CA-01 · Plan desde plantilla.** Dada una venta y la plantilla 10/40/50 con 12 cuotas, el cronograma suma exactamente `total_cents`, el residuo de centavos cae en la última cuota de cada línea y las fechas siguen las reglas. **Prueba:** unitaria de dominio con totales que no dividen exacto (p. ej. 100.001 centavos) + BD.
2. **CA-02 · Plantilla parametrizable.** Un proyecto con plantilla propia (p. ej. 20/30/50, 6 cuotas) genera un plan distinto al global; una plantilla cuyas líneas no suman 10000 pb se rechaza; una plantilla usada no se edita, se versiona. **Prueba:** unitaria + BD.
3. **CA-03 · Un plan vivo por venta.** Crear un segundo plan para la misma venta responde 409 y repetir la misma clave devuelve el plan original. Una venta sin fila en `unit_sales` (negocio ganado histórico) no admite plan. **Prueba:** BD + API.
4. **CA-04 · Suma de cuotas en BD.** Un `INSERT`/`UPDATE` directo que deje Σ cuotas ≠ total se rechaza al confirmar la transacción. **Prueba:** `test:db` con SQL directo (IR-01).
5. **CA-05 · Registro e imputación.** Un pago parcial se aplica a la cuota más antigua; un pago mayor cubre varias en orden de (`due_date`, `number`); un pago por adelanto cubre cuotas futuras sin saltarse las anteriores abiertas. **Prueba:** unitaria + BD con los tres casos y verificación de IR-03/IR-04.
6. **CA-06 · Pago mayor al saldo.** Un pago cuya aplicación supera el saldo pendiente se rechaza con 409 `EXCEEDS_BALANCE` sin crear pago, imputación, recibo ni evento. **Prueba:** API + BD.
7. **CA-07 · Moneda y tasa congelada.** Un pago en DOP a un plan en USD exige tasa; el equivalente se calcula con BigInt y redondeo medio hacia arriba; cambiar después el catálogo `exchange_rates` no altera el pago. Un pago en la moneda del plan con tasa se rechaza. **Prueba:** unitaria (valores grandes que desbordarían 2^53 en Number) + CHECK directo en BD.
8. **CA-08 · Diferencial cambiario.** Con tasa de referencia 58,00 y pago a 62,10, el diferencial por imputación es el esperado y el total de imputaciones cuadra; sin tasa de referencia queda NULL y la pantalla lo indica. **Prueba:** unitaria + BD.
9. **CA-09 · Idempotencia.** Reenviar el mismo pago con la misma clave devuelve el original (marcado repetido), sin segundo pago, imputación, recibo ni evento; la misma clave con otro monto responde 409 `IDEMPOTENCY_CONFLICT`; dos envíos simultáneos con la misma clave producen un solo pago. **Prueba:** API + `test:db` (dos conexiones).
10. **CA-10 · Concurrencia sin sobreimputación.** Plan con saldo 1.000: (a) dos pagos simultáneos de 700 con claves distintas → exactamente uno confirma y el otro recibe 409; (b) dos de 400 → ambos confirman y Σ `paid_cents` = 800; en ambos casos ninguna cuota supera `amount_cents`, Σ imputaciones = Σ `applied_cents` de los pagos confirmados y hay un `PagoRegistrado` por pago confirmado. **Prueba:** `test:db` con dos conexiones sincronizadas; un `UPDATE` directo que supere el monto lo rechaza el CHECK; el revisor quita temporalmente el bloqueo del plan y el UPDATE condicional y observa que la prueba falla (mutación independiente).
11. **CA-11 · Un pago no se imputa dos veces.** Insertar una segunda imputación del mismo pago a la misma cuota viola el UNIQUE. **Prueba:** SQL directo en `test:db`.
12. **CA-12 · Anulación con doble aprobación.** Solicitar anulación no cambia saldos ni emite evento; solo un administrador distinto del solicitante, con motivo no blanco y antes de los 7 días, puede aprobar; el solicitante, el asistente y el broker reciben 403; aprobar restaura `paid_cents`, marca imputaciones `reversed_at` y emite un `PagoAnulado`; rechazar o caducar no muta saldos. **Prueba:** matriz de roles + reloj antes/igual/después de `expires_at` + BD antes/después.
13. **CA-13 · Anulación concurrente.** Dos administradores aprueban a la vez la misma solicitud: uno aplica, el otro recibe 409, un solo `PagoAnulado`, saldos restaurados una sola vez. Una anulación y un pago simultáneos en el mismo plan se serializan sin dejar `paid_cents` inconsistente. **Prueba:** `test:db`.
14. **CA-14 · Nada se elimina.** No existe ruta, permiso ni consulta que borre planes, cuotas, pagos, imputaciones o solicitudes; los FK son `RESTRICT`; un pago anulado sigue visible con su motivo para quien puede verlo. **Prueba:** guardas de adaptador + intento de DELETE directo rechazado.
15. **CA-15 · Estado de cuenta.** El estado de cuenta por unidad y por comprador muestra pagado, pendiente, vencido y saldo por moneda, con las mismas cifras que la consulta de control, y exporta a CSV (sin inyección de fórmulas) y PDF con el pie no fiscal. **Prueba:** comparación con consulta de control + exportación abierta + captura.
16. **CA-16 · Mora derivada.** Una cuota con `due_date` anterior a hoy y saldo > 0 aparece vencida con los días de atraso correctos (día de vencimiento incluido como no vencida), sin ejecutar ningún proceso; pagarla la retira; anular un pago que la cubría la reabre. **Prueba:** unitaria con reloj inyectado en bordes de medianoche de Santo Domingo.
17. **CA-17 · Roles y precio real.** El admin y el asistente registran pagos; el broker solo lee su cartera (ID ajeno responde 404, sin metadatos) y no ve `reference`, comprobante ni motivos de anulación; ningún rol recibe `real_price_cents`, `internal_price_cents` ni comisión en SELECT, DTO, HTML/RSC, PDF, CSV o errores. **Prueba:** centinelas con valores sembrados distintivos, matriz own/all/none, `seguridad-rutas-id.test.ts` y `precios-respuestas.test.ts` extendidos.
18. **CA-18 · Seguridad de entrada.** Fechas imposibles, futuras, montos no enteros o negativos, monedas fuera de USD/DOP, tasa fuera de rango, campos extra y booleanos textuales se rechazan sin 500; ninguna ruta de `src/app/api/cobros/**` carece de `requireScope`/`requireFullScope`; las tablas nuevas tienen `.enableRLS()`. **Prueba:** API + `npm test`.
19. **CA-19 · Eventos.** `PagoRegistrado`, `PagoAnulado` y `CuotaVencida` se escriben en el `outbox` en la misma transacción que su efecto, con payload `{id, planId}` y la clave de idempotencia de §6; si falla la inserción en el outbox, no queda pago ni anulación. **Prueba:** unidad de trabajo con fallo inyectado + Zod del evento.
20. **CA-20 · `CuotaVencida` sin duplicados.** Ejecutar `procesarVencimientos` dos veces emite un solo evento por cuota y episodio; tras una anulación que reabra la cuota y un nuevo vencimiento, se emite uno nuevo con episodio siguiente. **Prueba:** BD con reloj inyectado.
21. **CA-21 · Recordatorios sin envío.** El módulo no importa ningún proveedor de mensajería y no envía nada; sin consumidor, la cuota aparece en «Vencidas». **Prueba:** guarda de arquitectura + captura.
22. **CA-22 · Continuidad.** Con I03, ERP o proveedor de mensajería caídos o ausentes, planes, pagos, anulaciones y estados de cuenta funcionan; los eventos quedan pendientes. **Prueba:** puerto fallando + E2E.
23. **CA-23 · Worker no pierde eventos financieros.** Con un `PagoRegistrado` pendiente, `procesarOutbox` del CRM no lo reclama, no consume intentos y no lo manda a `outbox_dead`. **Prueba:** worker con cola real + consulta del outbox.
24. **CA-24 · Seis estados y móvil.** Cartera, plan y diálogos cubren carga, vacío, error, sin conexión, éxito y permiso insuficiente; sin overflow horizontal a 320/390/768/1440; objetivos ≥48×48 px, texto ≥13 px; sin datos de adorno. **Prueba:** E2E con fallos inyectados, capturas por rol y revisión D07.
25. **CA-25 · Teclado y anuncios.** Registrar un pago, solicitar y revisar una anulación se completan con teclado, con foco visible y devuelto, y resultado anunciado (`aria-live`). **Prueba:** teclado + DOM + revisión manual independiente.
26. **CA-26 · Vocabulario.** Ningún texto presenta el recibo como factura o comprobante fiscal; ningún texto visible usa «pipeline». **Prueba:** inventario de textos + `vocabulario.test.ts`.
27. **CA-27 · Auditoría.** Cada plan creado, pago registrado, solicitud, aprobación y rechazo deja `audit_log` con actor de sesión y sin incluir referencias bancarias completas. **Prueba:** consulta a `audit_log` antes/después.
28. **CA-28 · Salida del frente.** Otro proveedor verifica código, flujos y capturas; el orquestador observa `typecheck`, `lint`, `npm test`, `npm run test:db`, `build` y `spec:check` en verde antes de cerrar cada lote. **Prueba:** salidas en la evidencia del lote.

## 9. Fuera de alcance y preguntas abiertas

### Tramo construible ahora (lotes de ≤45 minutos)

Cada lote lleva `Ficha: M22` en su `TAREA.md` y solo puede despacharse cuando esta ficha esté en READY. Orden de dependencia: L1 → L2 → L3 → L4 → L5 → L6/L7 → L8 → L9…L11. Archivos permitidos por lote (nada fuera de la lista):

| Lote | Perfil | Contenido | Archivos permitidos | CA |
|---|---|---|---|---|
| L1 | D10 | Dominio puro: cronograma desde plantilla, imputación, conversión BigInt, diferencial, mora | `src/domain/cobros.ts`, `src/domain/cobros.test.ts` | 01, 02, 05, 07, 08, 16 |
| L2 | D11 | Catálogos, esquema, migración, RLS, seed de permisos y plantilla global, prueba de RLS | `src/domain/catalogs.ts`, `src/infrastructure/db/schema.ts`, `drizzle/0006_cobros_plan_de_pagos.sql`, `drizzle/meta/*`, `db/seed.sql`, `scripts/seed/catalog.ts`, `src/infrastructure/db/seed-invariantes.test.ts` | 04, 11, 14, 18 |
| L3 | D10 | Puertos, doble en memoria, plantillas, tipos de cambio y `crearPlanDePagos` | `src/application/cobros/puertos.ts`, `casos-de-uso-plan.ts`, `en-memoria.ts`, `casos-de-uso-plan.test.ts` | 01–04 |
| L4 | D10 | `registrarPago`: idempotencia, imputación, exceso de saldo, evento | `src/application/cobros/casos-de-uso-pago.ts`, `casos-de-uso-pago.test.ts`, `en-memoria.ts` | 05–09, 19 |
| L5 | D11 | Repositorio Drizzle de cobros y pruebas de concurrencia en BD | `src/infrastructure/db/repos/cobros.ts`, `src/infrastructure/db/cobros.db.test.ts`, `scripts/test-db/cobros.ts`, `scripts/test-db/run.mjs` (solo registrar el archivo) | 04, 06, 09–11 |
| L6 | D10 | Anulación con doble aprobación y caducidad | `src/application/cobros/casos-de-uso-anulacion.ts`, `…test.ts`, `src/infrastructure/db/repos/cobros.ts` | 12–14 |
| L7 | D19 | Eventos: ampliar tipos y CHECK, cola del worker por tipos, `OutboxFinanzas`, `procesarVencimientos` | `src/application/compartido/crm.ts`, `src/infrastructure/integraciones/outbox/worker.ts`, `…/repositorio.ts`, `src/application/cobros/vencimientos.ts`, `…test.ts`, tests de worker | 19, 20, 23 |
| L8 | D10 | Consultas (cartera, plan, pagos, vencidas, estado de cuenta) con proyección por rol | `src/application/cobros/consultas.ts`, `consultas.test.ts`, `src/infrastructure/db/repos/cobros-lectura.ts`, `dto.ts` | 15, 17 |
| L9 | D10 | Rutas API con Zod, `requireScope` y filtro por `:id` | `src/app/api/cobros/**`, `src/application/cobros/entrada.ts`, `src/infrastructure/seguridad-rutas-id.test.ts`, `src/infrastructure/precios-respuestas.test.ts` | 17, 18 |
| L10 | D09 | Pantalla `/cobros` (cartera, vencidas, pagos) y navegación | `src/app/(crm)/cobros/page.tsx`, `vista.tsx`, `loading.tsx`, `error.tsx`, `src/app/(crm)/modulos.ts` | 24, 26 |
| L11 | D09 | Pantalla de plan y diálogos (nuevo plan, registrar pago, anulación) | `src/app/(crm)/cobros/planes/[id]/*` | 24, 25 |
| L12 | D09 | Exportación CSV/PDF del estado de cuenta | `src/app/api/cobros/exportacion/**`, `src/infrastructure/pdf/estado-de-cuenta.tsx`, `src/domain/csv.ts` (solo uso) | 15, 17 |
| L13 | D14 | E2E, capturas por rol y revisión independiente de dinero (mutación del bloqueo) | pruebas E2E y capturas en la ruta que fije D14 (el repositorio no tiene hoy carpeta e2e), evidencia del lote | 10, 24, 25, 28 |

El enlace «Ver cobros» desde la ficha de Negocios (M03) se despacha como tarea aparte de M03 y no forma parte de estos lotes.

### Fuera de alcance de M22

Emisión de e-CF y numeración fiscal (I03; el CRM nunca genera e-NCF); libro mayor y asientos (ERPNext condicionado, decisión del contador); conciliación bancaria y pago en línea (A5.2, A7.7); comprobante fiscal por cobro; contratos, cesión y rescisión (A6.5/A6.6) y por tanto la cancelación del plan; reestructuración o refinanciamiento (A7.8); cuotas ligadas a hitos de obra (A7.6); cuentas segregadas por fideicomiso/fiduciaria (A6.4, A20.5); co-compradores y comprador persona jurídica (A5.5); cartas de cobro automáticas y envío de recordatorios (M11); cobro de rentas (M15); portal del cliente (Client Room); recargos por mora; devoluciones y penalidades de la separación (A5.4); importación masiva de pagos; tipo de cambio automático del BCRD; cálculo de comisiones y retenciones (M10).

### Preguntas abiertas para Wilber (cada una con valor por defecto seguro)

| ID | Pregunta | SUPUESTO por defecto (reversible) | Dueño / reversión |
|---|---|---|---|
| S-22-01 | ¿La separación genera recibo interno o comprobante fiscal? | **Recibo interno numerado no fiscal** (`RC-AAAA-NNNNNN`); el evento `PagoRegistrado` deja a I03 la decisión de emitir comprobante. D21 B.4 deja el criterio pendiente del contador | Wilber + contador; cambiar es una decisión de I03, no de M22 |
| S-22-02 | ¿El asistente puede ver cuotas, saldos y pagos? | Sí, sin precio real, precio interno ni comisión; contradice solo en apariencia M03 S-309, que limita al asistente en Negocios | D12 confirma; revertir = quitar `payments:view` al asistente |
| S-22-03 | ¿Quién crea planes y plantillas? | Solo administrador | Wilber; ampliar es sembrar un permiso |
| S-22-04 | ¿Pago mayor al saldo? | Rechazado; no existe saldo a favor | Wilber/contador; un saldo a favor sería una ficha nueva |
| S-22-05 | ¿Fuente del tipo de cambio? | Carga manual con último valor sugerido; tasa congelada por pago; tasa de referencia del plan opcional | Wilber/contador; `TipoDeCambioPort` BCRD queda para después |
| S-22-06 | ¿Doble aprobación de anulación? | Solicitante (admin o asistente) + otro admin con motivo, un nivel, caduca a los 7 días (mismo contrato que #47) | Wilber |
| S-22-07 | ¿Cómo medir el diferencial cambiario? | Contra la tasa de referencia del plan, solo planes USD pagados en DOP, informativo | Contador |
| S-22-08 | ¿Comprador = contacto del negocio? | Sí; sin co-compradores ni persona jurídica en este corte | D02 (A5.5) |
| S-22-09 | ¿Quién ejecuta `procesarVencimientos` periódicamente? | Botón de admin y consulta derivada; el planificador lo define D16 (no hay scheduler acreditado) | D16/D19 |
| S-22-10 | ¿Recargo por mora? | Ninguno; solo días de atraso | Wilber |
| S-22-11 | ¿El broker exporta el estado de cuenta de sus clientes? | Sí, DTO reducido (sin referencia ni comprobante ni motivos) | D12/Wilber |
| S-22-12 | ¿Imputación manual a una cuota concreta? | No; solo automática a las más antiguas. Para corregir: anular y registrar de nuevo | Wilber |
| S-22-13 | ¿Monedas admitidas? | Solo USD y DOP; cotas técnicas de tasa 1–1000 DOP por USD | Wilber |
| S-22-14 | ¿Plantilla global inicial? | «Preventa 10/40/50» (10 % separación, 40 % en cuotas mensuales durante construcción, 50 % contra entrega) con 12 cuotas por defecto como valor técnico editable por proyecto | Wilber/D02 |
| S-22-15 | ¿Ventas anteriores sin unidad concreta (S-303-H)? | No admiten plan; se resuelven cuando exista el mapa negocio→unidad | Responsable del dato |

### Decisiones y verificaciones que esta ficha no resuelve

Tratamiento fiscal del anticipo de preventa y quién factura qué (contador, D21 B.4 punto 4); grupo DGII del RNC (define el plazo e-CF; condiciona I03, no M22); si existe fiduciaria en todos los proyectos (cambia el destino de los fondos). Ninguno bloquea el tramo construible.

## 10. Anexos de entrega

Fuentes leídas en esta sesión: `PLAN-INTEGRAL-2026-10-14.md` (§1, §3, §6), plantilla de módulo, ficha M03 (formato y contratos de venta única, aprobación y roles), expediente D21 de catálogo (A4–A8, A19, A20, A.3, B.1–B.4), `docs/contexto/decisiones.md` #43–#48, `src/infrastructure/db/schema.ts` (deals, units, projects, commissions, unit_sales, outbox, audit_log, files), `src/domain/catalogs.ts`, `src/domain/rbac.ts`, `src/domain/confotur.ts`, `src/application/pipeline/puertos.ts`, `src/application/compartido/{crm,unidad-de-trabajo,almacenamiento}.ts`, `src/application/comunicaciones/puertos.ts`, `src/infrastructure/integraciones/outbox/worker.ts`, `drizzle/0005_identidad_venta_durable.sql`, `scripts/spec/check.mjs`. No se leyó la base de datos, no se ejecutó nada del CRM y no se consultó la normativa fiscal original: los puntos fiscales son los del expediente D21 (confianza media, a validar por el contador).

## Handoff

Para D00 (Claude) y D02: revisión independiente por otro proveedor antes de pasar a READY, con D03/D11 sobre §4 (algoritmo de pago, bloqueo por plan, disparador de suma) y §5 (modelo, migración 0006, proyección), D12 sobre dinero, roles y S-22-02, y D14 sobre §8 (en especial CA-10 y CA-13 con la mutación del bloqueo). Hallazgo que condiciona la construcción: el worker del outbox descarta tipos desconocidos (§2, §6, L7, CA-23). Ninguna aprobación propia, gate, C1 ni aceptación del cliente por esta ficha.
