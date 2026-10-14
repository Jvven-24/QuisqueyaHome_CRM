# D21 · ¿FacturacionV3 puede ser la capa fiscal/contable del CRM Quisqueya Home?

- Fecha: 2026-10-14
- Perfil: D21 (investigación de reutilización), modo solo lectura
- Sistema evaluado: `C:\Users\wilbe\Downloads\FacturacionV3\secure-access-hub-68` (paquete `vite_react_shadcn_ts`, SPA React + Supabase)
- Método: lectura de código, migraciones SQL, edge functions y config; `tsc` y `vitest` ejecutados sin tocar código fuente (ver sección 4). Los `.env*` no se abrieron. Los secretos encontrados se citan por archivo:línea, sin reproducir su valor.

---

## 0. Veredicto

**No, como capa fiscal y contable completa. Sí, como fuente parcial de código para numeración NCF, notas de crédito, cobros y el builder del 607.**

Razones principales:

1. **El bloqueo que paró ERPNext (e-CF/DGII) no está resuelto aquí.** Existe el XML e-CF sin firma, tablas y un asistente de 7 pasos, pero no hay firma XML-DSIG, ni envío a DGII, ni TrackId, ni estado de respuesta. El botón de "Enviar Documentos de Prueba" no tiene manejador. El paso de certificado no carga archivo.
2. **No hay contabilidad de partida doble.** No hay catálogo de cuentas, ni asientos persistidos, ni libro mayor, ni balance. Solo hay asientos "sugeridos" calculados al vuelo con `account_key` placeholder y una línea de cuadre silenciosa.
3. **No hay 606, 608, IT-1, IR-17 ni nómina.** El 607 existe, pero exporta CSV, no el formato TXT oficial.
4. **No hay API de escritura para otro sistema que cree facturas o registre pagos.** La única API pública de reportes es de solo lectura. Las ingestas de escritura existentes son para cotizaciones (bot y portal web) y para comprobantes de pago revisados por un usuario interno.
5. **Hay hallazgos de seguridad que impedirían reutilizarlo como fuente fiscal sin remediación previa** (sección 4.3): clave de API de bot con valor de respaldo escrito en el código, token de Telegram en una migración versionada, y políticas RLS `USING (true)` sobre las tablas e-CF.
6. **Estado del repo:** último commit el 2026-05-16, 62 cambios sin commit y un objeto Git corrupto que impide `git log -S` y reporta un blob faltante en `git fsck`.

Recomendación para la decisión (D03/usuario): no adoptarlo como capa fiscal. Si se quiere reutilizar, extraer solo el módulo NCF/notas/cobros como servicio con API transaccional, después de remediar seguridad. El e-CF debe resolverse con un componente separado (proveedor homologado o construcción propia), que es el riesgo que ya frenó ERPNext.

---

## 1. Módulos funcionales y madurez

Leyenda: **Real** = flujo completo con datos y transacciones en BD. **Parcial** = existe pero le faltan piezas. **Maqueta** = interfaz o código sin conexión operativa. **No existe** = sin evidencia.

| Módulo | Madurez | Evidencia (archivo:línea) |
|---|---|---|
| Clientes + validación RNC contra padrón DGII | Real | `src/adapters/catalogos-adapter.ts:992-1013` (create/update/delete); padrón en `supabase/migrations/20260310053919_create_padron_rnc.sql`; RPC `validar_rnc_padron` en `supabase/migrations/20260318234622_rpc_validar_rnc_padron_v2.sql:5` |
| Productos y servicios | Real | `src/adapters/catalogos-adapter.ts:1056-1083`; `src/pages/ProductosPage.tsx` (16 errores de tipo, ver 4.2) |
| Cotizaciones con aprobación | Real | `src/adapters/cotizacion-adapter.ts:416-701`; `src/adapters/aprobaciones-adapter.ts:422-605`; RPC transaccional `crear_cotizacion_tx` en `supabase/migrations/20260301141711_cotizacion_rpc_transaction.sql:1` |
| Proformas | Real | `src/adapters/documentos-adapter.ts:512-572` (CRUD + `convertCotizacionToProforma` en :705) |
| Facturas | Real (parcial) | `src/adapters/documentos-adapter.ts:609-665` (fetch/create/update), `convertProformaToFactura` en :808. Protección de factura emitida: trigger `proteger_factura_emitida` en `supabase/migrations/20260317043927_mejora_fix_01_trigger_facturas_estados.sql:7` |
| Secuencias NCF (B01, B02, B04, B11, B13, B14, B15 …) | Real (con reservas) | Reserva en cliente con reintento optimista: `src/adapters/documentos-adapter.ts:101-170` (`assignNextNCFSequence`, hasta 5 intentos). Mapa de códigos: `documentos-adapter.ts:51-60` y `supabase/functions/accounting-reports-api/index.ts:230-245`. Control de agotamiento y vigencia en `accounting-reports-api/index.ts:405-430` |
| Notas de crédito | Real | `src/adapters/documentos-adapter.ts:1184` (`crearNotaCredito`) y RPC `crear_nota_credito_tx` en `supabase/migrations/20260319011958_notas_credito_anulacion_ecf.sql:125`; anulación con `anular_factura_tx` en la misma migración :55 |
| Pagos y cobros | Real (manual) | `src/adapters/documentos-adapter.ts:969-1058` (`registrarPago`: valida saldo, numera con `get_next_doc_number`); aplicación con RPC `aplicar_pago_a_facturas` en `supabase/migrations/20260317044227_mejora_06_pipeline_financiero.sql:20`; anticipos y aplicaciones multi-factura en `supabase/migrations/20260317034209_019_refactor_pagos_anticipos.sql:1-46` (`pagos.factura_id` nullable, tabla `pagos_aplicaciones`) |
| Impuestos ITBIS | Parcial | `src/lib/calculos-fiscales.ts:7` (`TASA_ITBIS = 18`), `calcularResumenDocumento` en :62. Solo 18% y exento; sin 16% en el cálculo del documento |
| Retenciones ISR / ITBIS | Maqueta (solo lectura) | Columnas `retencion_isr`, `retencion_itbis` en `facturas` (`supabase/migrations/20260317043434_mejora_02_proteccion_facturas.sql:9`). Solo se leen en dashboards y auditoría (`src/pages/AnalyticsDashboard.tsx:693`, `src/pages/AuditoriaPage.tsx:312`). No encontré escritura en `src/` ni RPC que las calcule o capture |
| e-CF (facturación electrónica) | Maqueta | Ver detalle abajo |
| Reporte 607 | Parcial | Builder: `supabase/functions/accounting-reports-api/index.ts:376-403` (`buildSales607`). Vista "Exportable 607" en `src/pages/ReportesPage.tsx:205` y `:1002-1041`. Exporta CSV (`exportCsv`, `ReportesPage.tsx:260`), no el TXT de formato DGII |
| Reporte 606 (compras) | No existe | Sin coincidencias en `src/` ni en `supabase/functions/` |
| Reporte 608, IT-1, IR-17 | No existe | Sin coincidencias en `src/` ni en `supabase/functions/` |
| Cuentas por cobrar y antigüedad | Real (lectura) | `buildAging` en `accounting-reports-api/index.ts:432-457` (buckets 0, 1-30, 31-60, 61-90, +90) |
| Empleados, departamentos, puestos | Real (catálogo RRHH) | `src/adapters/empleados-adapter.ts`, `puestos-adapter.ts`; `supabase/migrations/20260309202146_create_departamentos_puestos.sql:31-32` (salario mínimo/máximo por puesto) |
| Nómina | No existe | Sin tablas de nómina en las 69 tablas creadas por migraciones; sin cálculo de TSS ni ISR de nómina |
| Contabilidad general (catálogo, asientos, mayor, balance) | **No existe partida doble** | Ver detalle abajo |
| Inventario, obras, conduces | Real | `supabase/migrations/20260226053444_crear_tablas_inventario_gps.sql`, `movimientos_inventario`; `src/adapters/obras-adapter.ts`; conduces en `src/adapters/catalogos-adapter.ts:1614-1686` |

### 1.1 e-CF: detalle de la maqueta

Lo que existe:
- Constantes de URLs DGII (certificación y producción) en `src/adapters/ecf-adapter.ts:77-92`. Solo se muestran como texto en la página; no hay `fetch` a esos hosts en todo el código (verificado: `ecf-adapter.ts` no contiene `fetch(` y ningún archivo de `src/` ni `supabase/functions/` referencia `ecf.dgii.gov.do` salvo el adaptador y la página).
- Generador de XML `generarXMLEcf` en `ecf-adapter.ts:287-431`. Su propio comentario dice que no está firmado (`ecf-adapter.ts:283-285`). Incluye `<FechaHoraFirma>` con la hora actual (`ecf-adapter.ts:429`) aunque no hay firma: es un campo engañoso.
- Funciones de envío `registrarEnvioECF` (`ecf-adapter.ts:213`) y `updateEnvioECF` (:235). **Ninguna se llama** desde fuera del adaptador (verificado).
- Wizard de 7 pasos (`src/pages/FacturacionElectronicaPage.tsx`):
  - Paso 3, cargar certificado: la zona de carga (`:351-356`) es visual, sin input de archivo ni manejador. El campo de contraseña (`:361`) no está enlazado a estado.
  - Paso 6, pruebas: el botón "Enviar Documentos de Prueba" (`:545`) no tiene `onClick`.
  - Cada paso se marca "completado" manualmente (`marcarPasoCompletado`, `:174-190`). No hay verificación contra DGII.
- Tablas `ecf_configuracion`, `ecf_envios`, `ecf_certificacion_pasos` creadas en `supabase/migrations/20260319011958_notas_credito_anulacion_ecf.sql:287, 338, 377`. Columnas de token en `:308-310`.
- Tipos e-CF definidos en `ecf-adapter.ts:95-105`.

Lo que falta para e-CF real: firma XML-DSIG con el certificado P12 del RNC, autenticación (semilla y token) contra DGII, envío y consulta de TrackId, procesamiento de aceptación o rechazo, reintentos, y almacenamiento seguro del certificado. Nada de esto existe.

Error de mapeo verificable dentro del propio proyecto: `ecf-adapter.ts:102-103` asigna E44 a B15 y E45 a B14, y `ecf-adapter.ts:457-458` repite el cruce. El Accounting API asigna B14 a regímenes especiales y B15 a gubernamental (`accounting-reports-api/index.ts:241-242`). Por lo que conozco de la norma DGII, la correspondencia correcta es B14 = Regímenes Especiales y B15 = Gubernamental, lo que haría erróneo el adaptador. **Esto debe verificarse contra la norma vigente antes de usarlo.**

### 1.2 Contabilidad: no hay partida doble

- No hay tablas de cuentas, asientos, líneas de asiento, periodos ni saldos. El listado completo de 69 tablas (sección 2) no contiene ninguna de ellas.
- `buildAccountingEntries` (`supabase/functions/accounting-reports-api/index.ts:474-535`) genera asientos al vuelo a partir de facturas y pagos, con `account_key` como texto (`cuentas_por_cobrar_clientes`, `ingresos_por_ventas`, `itbis_por_pagar`, `bancos`, `caja`, `anticipos_de_clientes`). Marca `requires_account_mapping: true` (`:505`, `:528`). El catálogo de cuentas lo delega al sistema destino (`handleLedger`, `:722-737`, con un `account_catalog_contract` solo descriptivo).
- `addBalancedAdjustment` (`:458-472`) **fuerza el cuadre con una línea de ajuste** (`ajuste_redondeo_o_descuento`) en lugar de marcar el error. Esto oculta descuadres reales.
- En `src/pages/ReportesPage.tsx:514-515` hay una columna debe/haber, pero es un estado de cuenta por cliente (factura = debe, pago = haber), no un libro mayor.
- `ChartContabilidad.tsx` y `AnalyticsDashboard.tsx` son gráficos de tablero, no contabilidad.

Conclusión: para contabilidad general, el CRM necesita su propio módulo de asientos o un sistema contable externo. FacturacionV3 solo puede exportar eventos fuente (facturas, NC, pagos) con `source_id` como llave idempotente.

---

## 2. Modelo de datos

- **Migraciones:** 168 archivos en `supabase/migrations/` (2026-02-04 a 2026-05).
- **Tablas creadas:** 69 `CREATE TABLE` distintas. Principales: `empresas`, `sucursales`, `usuarios`, `perfiles`, `permisos`, `roles_permisos`, `usuarios_permisos`, `clientes`, `obras`, `productos_servicios`, `cotizaciones`, `cotizaciones_items`, `cotizacion_estados`, `proformas`, `proformas_items`, `conduces`, `conduce_items`, `facturas`, `facturas_items`, `pagos`, `pagos_aplicaciones`, `secuencias_ncf`, `numeraciones_documentos`, `aprobaciones`, `reglas_aprobacion`, `validaciones`, `impuestos`, `padron_rnc`, `equipos`, `inventario`, `movimientos_inventario`, `empleados`, `departamentos`, `puestos`, `audit_log`, `audit_modulo_detalle`, `trazabilidad_eventos`, `ecf_configuracion`, `ecf_envios`, `ecf_certificacion_pasos`, `alito_web` (esquema con solicitudes web y comprobantes), `app_config`, más tablas de agentes IA y un esquema `dwh` (matviews de dashboard).
- **Tabla `facturas`** (`supabase/migrations/20260204233740_create_facturas_tables.sql:2-52`): `numero_factura`, `numero_ncf` UNIQUE, `tipo_ncf` (enum), `empresa_id`, `sucursal_id`, `proforma_id`, `cotizacion_id`, `cliente_id`, moneda y tasa, subtotal, descuento, valor exento y gravado, `itbis_18`, totales, `estado_pago`, `monto_pagado`, `saldo_pendiente`, `enviado_dgii`, `fecha_envio_dgii`, anulación. Columnas de retención añadidas en `20260317043434` :9.
- **Multiempresa y sucursales:** sí. `empresas` es el tenant y casi todas las tablas llevan `empresa_id`; `sucursales` existe y `facturas.sucursal_id` la referencia. Las funciones auxiliares `get_user_empresa_id()` (`supabase/migrations/20260204234733_create_helper_functions.sql:7`) y `has_permission(text)` (:26) sostienen RLS.
- **RLS:** 70 sentencias `ENABLE ROW LEVEL SECURITY`. Problemas:
  - `ecf_configuracion`, `ecf_envios`, `ecf_certificacion_pasos` tienen `FOR ALL USING (true)` **sin cláusula `TO`**, es decir, aplica al rol `public` (incluido `anon`). Ver `supabase/migrations/20260319011958_notas_credito_anulacion_ecf.sql:414, 419, 424`. No encontré una migración posterior que las elimine. `ecf_configuracion` guarda `token_semilla` y `token_autenticacion` (`:308-309`). Esto debe verificarse en la BD viva.
  - Otras políticas `USING (true)` son de lectura sobre catálogos (`catalogo_motivos_nc`) o de permisos para `authenticated`, no de escritura pública.
  - `app_config` (que contiene la configuración del bot de Telegram) tiene RLS con política `no_public_access` de denegación total (`supabase/migrations/20260425032100_create_app_config_with_telegram_token.sql:8-15`). Bien.
- **Esquema de cálculo:** numeración con `get_next_doc_number` (`supabase/migrations/20260217004050_add_get_next_doc_number.sql:3`), concurrencia optimista de NCF en cliente (ver 1, "Secuencias NCF"). La reserva de NCF ocurre en el navegador, no en una transacción de servidor.

---

## 3. Superficie de integración

### 3.1 Edge functions (17)

Ubicación `supabase/functions/`, `supabase/config.toml` (solo declara `verify_jwt = false` para `accounting-reports-api`, `equipos-api` e `import-dash-equipos`):

| Función | Tamaño | Escritura | Auth | Uso para el CRM |
|---|---|---|---|---|
| `accounting-reports-api` | 931 l. | **Ninguna (solo lectura)** | `x-api-key` o JWT de rol contador/admin/gerente/super_admin | Lectura de paquete fiscal, CxC, asientos sugeridos, resumen |
| `bot-cotizaciones-api` | 1121 l. | Cotizaciones, aprobaciones, clientes, auditoría | `x-api-key` (ver 4.3, hallazgo 1) | Crear cotización desde sistema externo, idempotente por `external_quote_id` |
| `alito-web-intake` | 1963 l. | Solicitudes de cotización, clientes, comprobantes de pago, pagos (al aprobar comprobante) | JWT de usuario; `submit-quote` admite invitado | Portal de cliente y flujo de cotización a ERP |
| `tablet-conduce-api` | 277 l. | Conduces | Auth propia | Conduces desde tablet |
| `void-bi-api` | 679 l. | Ninguna (llama RPC de dashboard) | Auth propia | BI |
| `document-email-api` | 79 l. | Envía correo vía Resend | Ninguna visible en el código | Envío de documentos por correo |
| `nvidia-agent` | 4384 l. | Varias | 56 referencias de auth | Agente IA del ERP |
| `equipos-api`, `import-dash-equipos` | 309, 383 l. | Equipos | `verify_jwt=false` | Equipos (no fiscal) |
| `admin-update-user`, `create-user`, `ensure-superadmin`, `sync-usuarios-auth`, `seed-initial-data`, `bot-notify-client`, `voice-speak`, `voice-transcribe` | varias | Usuarios, semillas, notificaciones | varias | Administración |

### 3.2 Endpoints y funciones concretas

**`accounting-reports-api`** (solo lectura, `supabase/functions/accounting-reports-api/index.ts`):
- `GET /` y `GET /health`, `GET /docs`, `GET /openapi.json`, `GET /accounting/connectors` (`:897-909`).
- `GET|POST /accounting/package`: paquete completo (`handlePackage`, `:683`).
- `GET|POST /accounting/documents`: facturas, NC, ND, pagos (`:708`).
- `GET|POST /accounting/ledger`: asientos sugeridos (`:722`).
- `GET|POST /accounting/summary`: resumen fiscal, CxC y validaciones (`:739`).
- Filtros: `from`, `to`, `clienteId`, `obraId`, `includeVoided`, `limit` (máx. 5000) (`readFilters`, `:136`).
- Autenticación: `resolveContext` (`:161`). `x-api-key` contra `ACCOUNTING_REPORTS_API_KEY`. Si `ACCOUNTING_REPORTS_ALLOWED_EMPRESA_IDS` está vacío, la clave sirve para cualquier empresa (`:180-186`). Con JWT, roles permitidos en `:216`.
- Validaciones que emite: NCF faltante, cliente sin RNC o cédula, total cero, secuencia NCF crítica (`buildValidations`, `:536-557`).
- CORS `*` (`:7-8`).

**`bot-cotizaciones-api`** (`supabase/functions/bot-cotizaciones-api/index.ts`):
- `GET /health` (`:1066-1075`): responde `api_key_configured` y `api_key_source` (env o bootstrap) a cualquiera.
- `GET ?empresa_id=` (`:1083-1095`): estado del bot de la empresa.
- `POST` (`:1097-1120`): si el cuerpo trae eventos de trazabilidad, los ingesta (`ingestTraceabilityEvent`, :1013). Si no, exige `empresa_id`, `external_quote_id`, `cliente.nombre` e `items` y llama `ingestBotQuote` (`:734-1000`).
- `ingestBotQuote` busca duplicados por `external_quote_id`, resuelve o crea cliente (`resolveClient`, :554), inserta cotización (`from("cotizaciones").insert`), inserta ítems, escribe `audit_log`, y crea `aprobaciones` si hay reglas (`reglas_aprobacion`).

**`alito-web-intake`** (`supabase/functions/alito-web-intake/index.ts`, dispatcher en `:1703`, acción en `body.action`):
- `submit-quote` (`:1953`): crea solicitud de cotización. Admite invitado (sin JWT).
- `convert-quote` (`:1890`): convierte solicitud en cotización ERP con RPC `crear_cotizacion_tx` (`:1580`).
- `submit-payment-proof` (`:1776`): comprobante de pago de cliente.
- `admin-update-payment-proof` (`:1871`): al aprobar, inserta en `pagos` (escritura en `:933`). Requiere usuario interno con permiso.
- `register-client` (`:1919-1949`): requiere usuario autenticado.
- Otras: `client-approve-quote`, `list-my-quotes`, `list-admin-quotes`, `client-portal-summary`, `get-client-document-url`, `resolve-session`.
- Espejo hacia un tablero externo: `mirrorQuoteRequestToBotDashboard` (`:232`), configurado por `ALITO_BOT_DASHBOARD_INTAKE_URL` (`:133`). Envía datos de solicitudes a un tercero: debe revisarse frente a la política de privacidad.

**Adaptadores (`src/adapters/`, 22 archivos, 9 440 líneas):** son wrappers de `supabase-js` que usa la SPA. **No son una API para terceros**. Los más relevantes:
- `documentos-adapter.ts` (1285 l.): NCF, cotizaciones, proformas, facturas, conversión, pagos (`registrarPago` :969), anulación (`anularFactura` :1060, RPC), NC (`crearNotaCredito` :1184, RPC).
- `catalogos-adapter.ts` (2062 l.): clientes, productos, conduces, pagos (`createPago` :1718), secuencias NCF (`createSecuenciaNCF` :1759), impuestos, empresas, sucursales.
- `cotizacion-adapter.ts` (711 l.), `aprobaciones-adapter.ts` (648 l.), `ecf-adapter.ts` (461 l.; la UI solo usa configuración y pasos del wizard, nunca XML ni envíos), `reportes-adapter.ts`, `dashboard-adapter.ts`, `empleados-adapter.ts`.

### 3.3 Respuesta directa: ¿qué puede llamar otro sistema hoy?

| Acción para el CRM | ¿Existe endpoint? | Dónde |
|---|---|---|
| Crear cliente | Sí, indirecto | `bot-cotizaciones-api` (crea o resuelve cliente al ingestar cotización); `alito-web-intake` `register-client` (requiere usuario) |
| Crear cotización | Sí | `bot-cotizaciones-api` `POST`; `alito-web-intake` `submit-quote` / `convert-quote` |
| Crear proforma | No | Solo en adaptador de cliente |
| Crear factura con NCF | **No** | Solo en `documentos-adapter.ts:633` (cliente). La reserva de NCF es del lado del navegador |
| Registrar pago | Parcial | Solo al aprobar un comprobante, con usuario interno (`alito-web-intake` `:1871`). No hay endpoint de servicio |
| Emitir e-CF | **No** | Ver 1.1 |
| Leer paquete fiscal, CxC, asientos sugeridos | Sí | `accounting-reports-api` |
| Webhooks salientes | No encontrados | Solo el espejo de solicitudes de `alito-web-intake` (:232) |

---

## 4. Calidad

### 4.1 Repositorio y estado

- Repo git en la carpeta. Último commit: `2026-05-16 03:05:09 -0400 fix: harden gemini tool turns`. Total: 38 commits en HEAD.
- `git status`: 62 entradas sin commit.
- Objeto corrupto: `git fsck --no-dangling` reporta `missing blob f4a3a69af71969094fc682c3bd8c69389458f39f` (`.git/objects/f4/a3a6…`). `git log -S` falla con "corrupt loose object". No aparece en el árbol de HEAD, pero impide búsquedas históricas y comparaciones. Esto es el mismo tipo de problema que el CRM registró en su AGENTS.md (punto 2 de "candados"): hay que arreglarlo antes de comparar o dar trabajo por perdido.
- Autoría (`git log --format`): 33 commits de `wilberdelarosa`, 4 de `gpt-engineer-app[bot]`, 1 de `Lovable`.

### 4.2 Tipos, lint y pruebas (ejecutado, sin modificar código)

- **Typecheck:** `package.json` no tiene script `typecheck`. `tsc -p tsconfig.app.json` falla antes de compilar: `TS5103 Invalid value for '--ignoreDeprecations'` (`tsconfig.app.json:21` declara `"ignoreDeprecations": "6.0"`, y el proyecto usa TypeScript 5.8.3). Para medir errores reales usé un tsconfig temporal fuera del proyecto (en el directorio de scratch) que extiende el de la app y solo cambia `ignoreDeprecations` a `5.0` y `types` a `vite/client`. Resultado: **128 errores TS** (modo estricto). Concentración: `AnalyticsDashboard.tsx` 23, `ProductosPage.tsx` 16, `document-traceability.test.ts` 8, `ItemsGrid.tsx` 8, `aprobaciones-adapter.ts` 8, `Login.tsx` 7, `CotizacionesPage.tsx` 7, `cotizacion-adapter.ts` 5, `documentos-adapter.ts` 4, `ChartContabilidad.tsx` 4, `ecf-adapter.ts` 1 (`:136`). El código no está limpio en tipos.
- **Pruebas unitarias:** `vitest run` (config por defecto) → 22 archivos, 85 pruebas: **84 pasan, 1 falla** (`src/lib/alita-system-context.test.ts`: se esperaba `current_module` `/app/void-ia` y devolvió `null`). Hay pruebas para NCF (`src/lib/ncf.test.ts`), pagos de factura, flujo de factura, RNC, cotizaciones y permisos. **No hay pruebas para** `ecf-adapter.ts`, `accounting-reports-api`, `calculos-fiscales.ts` ni para la lógica del 607.
- **E2E:** 6 especificaciones Playwright en `tests/e2e/` (`credit-note`, `traceability-2026`, etc.). No ejecutadas (requieren navegador y datos).
- **Lint y build:** no ejecutados.

### 4.3 Seguridad (hallazgos con evidencia; valores secretos no reproducidos)

1. **Clave de API con valor de respaldo en código (alta).** `supabase/functions/bot-cotizaciones-api/index.ts:10` define `BOOTSTRAP_BOT_COTIZACIONES_API_KEY` con un valor literal. `getConfiguredApiKey` (`:190-192`) la usa si no existe la variable de entorno `BOT_COTIZACIONES_API_KEY`. `checkApiKey` (`:198-219`) la acepta. Quien tenga acceso al repositorio puede escribir cotizaciones en el ERP en cualquier despliegue sin configurar esa variable. `/health` además revela la fuente (`:1072`). El archivo está versionado en git.
2. **Token de Telegram en texto plano en una migración (alta).** `supabase/migrations/20260425032100_create_app_config_with_telegram_token.sql:19-20` inserta un token de bot en `app_config`. Está en el historial de git. Debe rotarse y moverse a variable de entorno o Vault. (La tabla sí tiene RLS de denegación total, `:8-15`.)
3. **Políticas `USING (true)` sin `TO` en tablas e-CF (alta, a verificar en BD viva).** `supabase/migrations/20260319011958_notas_credito_anulacion_ecf.sql:414, 419, 424`. Según migraciones, un cliente con la clave pública `anon` podría leer y escribir `ecf_configuracion` (incluye columnas de token, `:308-309`) y `ecf_envios` (XML firmado). Verificar con los advisors de Supabase.
4. **Clave del Accounting API sin límite de empresa por defecto (media).** `accounting-reports-api/index.ts:180-186`: si `ACCOUNTING_REPORTS_ALLOWED_EMPRESA_IDS` no está definida, cualquier `empresaId` es aceptado con la misma clave. Con un solo tenant hoy, el riesgo es bajo; con varias empresas, es fuga entre tenants.
5. **Registro de invitado sin protección visible (media-baja).** `alito-web-intake` `submit-quote` (`:1953-1956`) acepta invitados. No encontré captcha, límite de tasa ni validación de origen en el código. Riesgo de spam de solicitudes.
6. **`FechaHoraFirma` sin firma (media, de integridad).** `ecf-adapter.ts:429` escribe fecha de firma en un XML que no está firmado. Si el XML se enviara así, sería rechazado; si se almacena, induce a error.
7. **Certificado digital sin diseño de almacenamiento (informativo).** El paso 3 no sube archivo ni cifra contraseña. Cuando se implemente, usar almacenamiento cifrado y no guardar la contraseña en texto.

Buenas prácticas observadas: `accounting-reports-api` usa el cliente de servicio solo en el servidor y filtra `empresa_id` en cada consulta; `proteger_factura_emitida` impide modificar facturas emitidas; la anulación y la NC son RPC transaccionales; hay trazabilidad de auditoría (`audit_log`, `audit_modulo_detalle`).

### 4.4 Licencia y propiedad

- No hay archivo `LICENSE` en la raíz. El nombre del paquete (`vite_react_shadcn_ts`) y el README son de plantilla Lovable.
- Autoría mayoritaria del usuario (`wilberdelarosa`, 33 commits). El código es suyo; no hay términos de terceros declarados. Reutilizarlo dentro de sus propios proyectos es decisión del usuario, sin condiciones de licencia externas identificadas.

---

## 5. Encaje con el CRM (necesidades)

| Necesidad del CRM | ¿Lo cubre FacturacionV3? | Cómo se conectaría | Qué falta |
|---|---|---|---|
| **(a) Cotización formal con plan 10/40/50 de una unidad** | **Parcial.** Cotizaciones con ítems, aprobación, PDF y conversión a proforma/factura: sí. Plan de pagos por hitos: **no**. "Unidad" inmobiliaria: **no** (solo productos/servicios y obras de construcción) | `POST` de `bot-cotizaciones-api` (idempotente por `external_quote_id`) o `submit-quote` de `alito-web-intake` | Modelo de plan de cuotas o hitos con porcentajes; entidad unidad/propiedad; reserva; vínculo de cada hito con una factura o anticipo |
| **(b) Factura con NCF/e-CF de la reserva o del inicial** | **Parcial.** NCF, facturas, anticipos (`pagos` sin factura, `pagos_aplicaciones`) y NC: sí. **e-CF: no** (maqueta) | No hay endpoint de creación de factura. Habría que portar `assignNextNCFSequence` (`documentos-adapter.ts:101-170`) de cliente a servidor, transaccional (RPC), y exponerlo | Firma e-CF, envío DGII, TrackId, estados aceptado/rechazado, certificado seguro, numeración e-NCF. Este es el bloqueo principal |
| **(c) Facturar y pagar comisiones a brokers con retención** | **No.** Retenciones solo en factura de venta, sin captura ni cálculo. Sin módulo de proveedores, cuentas por pagar ni comisiones | Ninguna disponible | Módulo de comisiones y proveedores (brokers), cuentas por pagar, cálculo y captura de retención según tipo de pago (verificar tasa vigente), 606 para compras |
| **(d) Cobros de rentas mensuales** | **Parcial bajo.** Cobros manuales con `registrarPago` y antigüedad de cartera: sí. Contratos recurrentes y generación mensual: **no** | Requiere (b) primero; después, un job mensual que cree factura y reciba pago | Motor de recurrencia, contrato de arrendamiento, recordatorios |
| **(e) Libro de ingresos y reportes 606/607** | **607: parcial** (builder CSV con validaciones de NCF y RNC faltantes, `accounting-reports-api/index.ts:376-403, 536-557`). **606: no.** Libro de ingresos: como 607, no como libro diario | `GET /accounting/package` o `/accounting/documents` (solo lectura, ya existen) | Generación del TXT oficial DGII para 607; 606, 608; retenciones capturadas; export de libro diario |
| **Contabilidad general (asientos, partida doble, mayor, balance)** | **No.** Solo asientos sugeridos sin persistencia | `GET /accounting/ledger` como contrato de exportación de eventos (con `source_id` idempotente) hacia un sistema contable | Catálogo de cuentas, asientos persistidos, periodos, mayor y balance. Eliminar la línea de cuadre silencioso |
| Nómina | **No** | — | Todo |

---

## 6. Remediación mínima antes de cualquier reutilización

Orden sugerido, si el usuario decide reutilizar el código (no se ejecutó nada):

1. Quitar `BOOTSTRAP_BOT_COTIZACIONES_API_KEY` del código (`bot-cotizaciones-api/index.ts:10`), exigir la variable de entorno, rotar la clave y dejar de exponer `api_key_source` en `/health` (`:1072`).
2. Rotar el token de Telegram, sacarlo de la migración `20260425032100` (reescribir historial o declarar la fuga) y moverlo a Vault o variable de entorno.
3. Reemplazar las políticas `FOR ALL USING (true)` de `ecf_*` por políticas por `empresa_id` y `has_permission`, y revisar con los advisors de Supabase.
4. Hacer obligatoria `ACCOUNTING_REPORTS_ALLOWED_EMPRESA_IDS` o mapear la clave a una empresa.
5. Reparar el objeto Git corrupto `f4a3a69…` (`git fsck`) y llevar los 62 cambios a commit antes de comparar.
6. Corregir la tipología de tsconfig (`ignoreDeprecations`) y los 128 errores de tipo, empezando por `documentos-adapter.ts` y `ecf-adapter.ts`.
7. Validar la correspondencia B14/B15 frente a la norma DGII vigente (sección 1.1).
8. Quitar la línea de cuadre silencioso de `addBalancedAdjustment` (`accounting-reports-api/index.ts:458-472`) y que el paquete falle con error.

---

## 7. Qué no pude verificar (y cómo verificarlo)

- Estado real de políticas RLS, ecf y advisors: requiere consulta a la BD viva (`list_migrations` / advisors) o revisar `pg_policies`. Solo se leyeron migraciones.
- Variables de entorno y valores de claves: no se abrieron `.env*` ni `supabase/functions/.env*`, a propósito.
- Ejecución del E2E y del build: no ejecutados.
- Correspondencia de códigos NCF B14/B15 con la norma DGII: verificar contra la norma vigente.
- Cobertura real del 607 frente al formato TXT de DGII: requiere revisión contra la especificación oficial.

---

## 8. Ubicaciones de referencia (resumen)

- Código fuente del sistema evaluado: `C:\Users\wilbe\Downloads\FacturacionV3\secure-access-hub-68\`
- Esta investigación: `C:\Users\wilbe\Documents\QuisqueyaHome_CRM\.viltrum\research\D21-facturacionv3-como-capa-fiscal-2026-10-14.md`
