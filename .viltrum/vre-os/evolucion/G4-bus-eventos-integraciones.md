# Expediente de evolución · Bus de eventos e Integraciones (outbox, worker, webhooks, salud)

> Programa «cada módulo a nivel avanzado» (Wilber, 14-oct-2026) · G4 Plataforma · D21 + D03 + D12 · 2026-10-14.
> Reglas: misma tecnología primero; copiar/portar solo MIT, Apache-2.0, BSD o ISC (LICENSE leído, commit fijado, cabecera de procedencia); AGPL/GPL solo como servicio aparte o referencia. Nada se incrusta.
> Diseño transversal: `G4-00-arquitectura-centralizacion.md` (léelo antes). Este expediente es su implementación.

## 1. Nivel actual (0–5) y evidencia
| Eje | Nivel | Evidencia |
|---|---|---|
| Funciones | 2 | Outbox + `external_refs` + worker con política de reintentos; 3 tipos de evento; un solo destino (`crm` local, no-op). Disparador manual `npm run outbox:worker` (`scripts/outbox-worker.mjs:44,54`, bucle 30 s). |
| Datos reales y reglas de negocio | 2 | `outbox` guarda **un estado por evento** (`schema.ts:1153-1169`): sin destino, sin tipo de agregado, sin revisión. CHECK cerrado a 3 tipos (`schema.ts:1175`). `webhook_inbox` sin uso en TypeScript (`seguridad.test.ts:69` solo comprueba su RLS). |
| Diseño y componentes | 1 | `configuracion/_integraciones.tsx:20-29`: 9 tarjetas fijas; solo la de Outbox lee la BD (`describirEstadoOutbox`). `integration_accounts` vacía. |
| Experiencia de uso | 1 | Sin reintento manual, sin ver el evento, sin cola muerta visible; el operador debe saber que existe `npm run outbox:worker`. |
| Calidad | 3 | Pruebas de política, worker, ejecutor y registro (`outbox/*.test.ts`); RLS exigida por `seguridad.test.ts`. Sin prueba de dos workers ni de crash en BD real (I00 §9 la exige). |

## 2. Puntos críticos (arreglar antes de evolucionar)
1. **Tipos de evento desconocidos van a cola muerta, sin vuelta atrás** (`worker.ts:38-39,55-58` → `repositorio.ts:48-51` pone `deadAt` e inserta en `outbox_dead`; la reclamación no filtra por tipo, `repositorio.ts:28`). Es el punto que cualquier módulo nuevo (Cobros, Portal, Facturación) pisa el día que emita. *Otro agente lo corrige ahora* con `registro.ts` (reclamar solo tipos con manejador). La corrección es necesaria pero **insuficiente para la centralización**: ver 2.2.
2. **Un tipo, un consumidor** (`registro.ts`, `crearRegistro` lanza si dos destinos declaran el mismo tipo) porque la fila no guarda estado por destino. `PagoRegistrado` debe llegar a 4–5 consumidores; hoy no cabe. Efecto: o se pierde un consumidor o se marca «enviado» a medias.
3. **El CHECK de tipos ata el orden de lotes** (`schema.ts:1175`; M22 B-01: L2 cambia el CHECK, L4 emite, L7 filtra). Cada evento nuevo = migración. Reemplazar por regla de formato + candado de CI (G4-00 §2.3).
4. **El panel de Integraciones afirma sin medir** (tarjetas con texto como «Espejo transaccional…» aunque el motor es no-op, `_integraciones.tsx:20-22`). Solo la tarjeta de Outbox es honesta. Un administrador no puede saber si el bus está sano.
5. **Secretos de integración sin cifrar**: `integration_accounts.encrypted_credentials` existe (`schema.ts:1103-1115`) pero **no hay cifrador en el código** (búsqueda de `createCipheriv`/`aes-256` en `src`, `scripts`: 0 resultados). Los tokens de WhatsApp/Telegram viven solo en variables de entorno (`env.ts:66-79`); la columna está lista para recibir texto plano por error.
6. **Webhooks de entrada con token estático** (`leads/externo`, `LEADS_WEBHOOK_TOKEN`) y **sin salida firmada**: lo único saliente es un destino por allowlist en Comunicaciones (`CRM_WEBHOOK_DESTINATIONS`), sin firma ni reintento por el bus. `webhook_inbox` (idempotencia de entrada) no se usa.
7. **El worker no es un servicio**: nada lo arranca, reinicia ni supervisa; si el proceso muere la cola se acumula en silencio. El panel lo dice con honestidad (`outbox-estado.ts`), pero no avisa a nadie.
8. **Layering**: `configuracion/page.tsx` consulta la BD directo (`getDb()` en la página); la lectura de salud debe pasar por un caso de uso (`consultarSaludBus`).

## 3. Funciones objetivo de nivel avanzado
| ID | Función | Prioridad | Catálogo | Hoy |
|---|---|---|---|---|
| BUS-01 | Catálogo de eventos tipado (`application/compartido/eventos.ts`) + esquemas Zod `.strict()` + candado de CI | ESENCIAL | A21.3 | 3 tipos en una unión de `crm.ts:20` |
| BUS-02 | Fan-out: estado de entrega por (evento, consumidor); cola muerta y cuarentena por consumidor | ESENCIAL | A21.3 | 1 estado por evento |
| BUS-03 | Tipo sin consumidor = `sin_consumidor` reproducible; versión desconocida = `HUMAN_REQUIRED`; jamás muerto | ESENCIAL | A21.3 | muere |
| BUS-04 | Orden por agregado + revisión (`aggregate_type`, `aggregate_revision`, destino) | ESENCIAL | A21.3 | ausente (I00 DRAFT) |
| BUS-05 | Programador de tareas (cron/RRULE): mora, vencimientos de KYC, SLA de lead, recordatorios, reindexado | ESENCIAL | A21.3 | ausente |
| BUS-06 | Panel de salud por consumidor: pendientes, edad, cuarentena, cola muerta, reintento/redrive manual con motivo y auditoría | ESENCIAL | A21.3 | tarjeta fija |
| BUS-07 | Cifrado de secretos de integración (AES-256-GCM, clave en `env.ts`, versión de clave) + pantalla «Conectar» por proveedor | ESENCIAL | A21.3 | columna sin cifrador |
| BUS-08 | Webhooks de **entrada** verificados (HMAC + ventana, cuerpo crudo antes de parsear) con `webhook_inbox` idempotente | ESENCIAL | A21.3 | token estático (I04-A define el patrón) |
| BUS-09 | Webhooks de **salida** firmados (Standard Webhooks), reintentos por el bus, anti-SSRF, panel de entregas | IMPORTANTE | A21.3 | ausente |
| BUS-10 | Worker como servicio supervisado (Windows local) con latido y alerta de «worker detenido» | ESENCIAL | A21.3 | script manual |
| BUS-11 | `external_refs` con revisión y reconciliación (qué dice el sistema externo vs. local) | IMPORTANTE | A21.3 | tabla existe |
| BUS-12 | Trazabilidad `correlationId` de extremo a extremo (log + auditoría + panel) | IMPORTANTE | A19 | parcial (uuid por evento) |
| BUS-13 | Observabilidad OpenTelemetry (trazas/métricas de cola) | DESEABLE | A21.3 | ausente |

## 4. Open source que aporta (verificado)
| Proyecto | Repo + commit/tag | Licencia (LICENSE leído) | Stack | Pieza exacta | Modo | Encaje | Esfuerzo |
|---|---|---|---|---|---|---|---|
| **pg-boss** | `timgit/pg-boss` @ `b53278b0af` (master), npm 12.38.0 (gitHead `2c1005b`), pushed 2026-10-14 | MIT (`package.json` y API); npm `pg-boss` | TS/Node ≥22.12, solo PostgreSQL, SKIP LOCKED | `send/publish` **dentro de la transacción de Drizzle** (`docs/api/adapters.md`, `fromDrizzle(tx, sql)`); `subscribe/publish` (fan-out, `docs/api/pubsub.md`); política de cola `key_strict_fifo` (orden por clave = por agregado) y `deadLetter` con redrive (`docs/api/queues.md`); `schedule` cron/RRULE (`docs/api/scheduling.md`); OTel (`docs/opentelemetry.md`); `@pg-boss/dashboard` (MIT, 1.12.0) solo como herramienta de operación | **APP** (dependencia npm) detrás de `BusPort`/`ProgramadorPort` | Excelente: misma BD, mismo Node que exige `engines >=22.13`, adaptador Drizzle oficial. Elimina el código propio de claim/lease/épocas que I00 intenta especificar. | M (PoC 1 lote + migración 2–3 lotes) |
| graphile-worker | `graphile/worker` @ `4cda192c5d`, v0.18.0 (aún 0.x) | MIT | TS/Node ≥22.18, PostgreSQL | `add_job` en SQL y `queue_name` serie; cron | REF (alternativa) | Sólido, pero sin cola muerta nativa ni redrive ni fan-out propio; versión 0.x | — |
| Trigger.dev | `triggerdotdev/trigger.dev` @ `3a1f00bab5` | Apache-2.0 | TS, plataforma completa | tareas duraderas con UI | NO (RUN pesado) | Autoalojar la plataforma completa para lo que pg-boss resuelve en la BD actual; **requisitos de infraestructura NO VERIFICADOS** | — |
| Inngest | `inngest/inngest` (servidor); SDK `inngest/inngest-js` v4.23.0 | Servidor: **SSPL + «Apache 2.0 Future License»** (`LICENSE.md` leído); SDK: Apache-2.0 (`packages/inngest/package.json`) | TS | — | **DESCARTADO** | SSPL en el servidor: incompatible con la regla de licencias del programa | — |
| Vercel Workflow | `vercel/workflow` @ `59b76f8dea` | Apache-2.0 (API) | TS | flujos durables | REF | Pensado para la plataforma Vercel; adaptador a Postgres **no verificado** | — |
| Standard Webhooks | `standard-webhooks/standard-webhooks` @ `7537d2a2d3`, npm `standardwebhooks` 1.1.1 | Apache-2.0 (repo) / MIT (npm) | spec + libs | cabeceras `webhook-id/-timestamp/-signature` y verificación de firma | **APP** | Estándar para BUS-08/09; evita inventar el formato | S |
| Svix | `svix/svix-webhooks` @ `ae6b40db92` | MIT | servidor Rust + Redis + Postgres | emisión de webhooks como servicio | NO | Servicio entero para algo que BUS-09 resuelve con la librería | — |

Qué adaptamos y qué no: de pg-boss se adopta el motor de entrega y de tareas programadas; **no** se adopta su dashboard como pantalla (nuestra interfaz es propia, se alimenta de `getQueues`/`getJobs`). Riesgos: (a) pg-boss crea su propio esquema `pgboss` y migra solo (`boss.start()`): hay que revocar acceso a `anon/authenticated` y registrar el esquema como excepción del candado «toda tabla con RLS» (`seguridad.test.ts:15` solo lee `public`); (b) su semántica de reintentos es la suya: nuestra clasificación `RETRYABLE/NON_RETRYABLE/HUMAN_REQUIRED` se implementa en el manejador (lanzar con `retryLimit` por job); (c) mantenimiento: un mantenedor principal, pero actividad diaria y 12.38 de versión. Salida: `BusPort` con adaptador propio sobre `outbox_entrega` (la fase A del §7 ya lo deja funcionando sin pg-boss).

## 5. Diseño y componentes a elevar
| Patrón | Componente | Dónde |
|---|---|---|
| Fila de salud por consumidor con semáforo | `Card` + `Badge` de `components/ui` + `ChartCard` (sparkline de `getQueueStats`) | Configuración → Integraciones |
| Tabla de eventos con filtros y detalle | `data-table.tsx` + `Sheet` (detalle con payload sin PII, intentos, `correlationId`) | ídem |
| Acciones peligrosas (redrive, pausar) | `Dialog` con motivo obligatorio + doble aprobación si el consumidor es financiero (G4-auditoria-aprobaciones) | ídem |
| Estado «Conectar proveedor» | formulario shadcn con campo secreto write-only, «probar conexión» (`salud()`) | ídem |

## 6. Comunicación con el resto (centralización)
Este módulo **es** la centralización: define `eventos.ts`, `BusPort`, `ProgramadorPort` y el panel. Emite `SaludBusDegradada`, `EntregaEnCuarentena`. Consume nada de dominio; todos los demás se suscriben (catálogo en G4-00 §3). Puertos: `CrmPort`, `MensajeriaPort`, `AprendizajePort`, `FacturacionPort`, `PortalPort`, `ContabilidadPort` (todos registran su consumidor aquí). Datos que comparte: `external_refs`, `webhook_inbox`, `integration_accounts`.

## 7. Lotes asignables
Fase A (sin dependencias nuevas, tras el filtro en curso) · Fase B (pg-boss, bajo decisión). Todos requieren **ficha nueva** `G10-bus-entregas` (D01/D03) y la actualización de I00; ninguno despacha hasta que I00 esté READY. Los lotes de esquema tocan `schema.ts` y `drizzle/` (zona reservada: coordinar con `EN-CURSO.md`).
| Lote | Entrega verificable | Archivos permitidos | Ficha | Modelo | Revisor | Depende de |
|---|---|---|---|---|---|---|
| BUS-L1 | `eventos.ts` con catálogo, esquemas Zod `.strict()` y tipo `EventoDominio`; `EventoCrm` pasa a derivar de él; prueba: cada tipo del catálogo tiene esquema | `src/application/compartido/eventos.ts` (+test), `src/application/compartido/crm.ts` | G10-bus-entregas | Sonnet | D12 | filtro en curso |
| BUS-L2 | Candado de CI: todo `emitir()` usa un tipo del catálogo; ningún `payload` con claves de PII (lista) | `src/infrastructure/arquitectura.test.ts` (o `eventos.guardas.test.ts` nuevo) | ídem | Haiku | D14 | BUS-L1 |
| BUS-L3 | Migración: `outbox` + `aggregate_type`, `aggregate_revision`, `schema_version`; CHECK de tipo → regla de formato; `outbox_entrega` (UNIQUE evento+consumidor, estado, intentos, `next_at`, clase) con RLS | `src/infrastructure/db/schema.ts`, `drizzle/0006_*`, `scripts/test-db/**` | ídem + D11 | Sonnet | D11+D12 | BUS-L1 |
| BUS-L4 | Registro con fan-out (N consumidores por tipo) + `sin_consumidor` reproducible + cuarentena por versión; el manejador no cambia de firma | `src/infrastructure/integraciones/outbox/{registro,worker,repositorio,consumidores}.ts` (+tests) | ídem | Sonnet | D14 | BUS-L3 |
| BUS-L5 | `consultarSaludBus` (caso de uso + repo) con edad del más antiguo por consumidor | `src/application/integraciones/consultas.ts`, `src/infrastructure/db/repos/salud-bus.ts` | ídem | Haiku | D14 | BUS-L4 |
| BUS-L6 | Panel de salud (seis estados) y redrive con motivo | `src/app/(crm)/configuracion/_integraciones.tsx`, `configuracion/page.tsx` (solo la rama integraciones) | ídem | Sonnet | D05+D07 | BUS-L5 |
| BUS-L7 | `cifrado-secretos.ts` AES-256-GCM (versión de clave), `INTEGRATIONS_KEY` en `env.ts`, pruebas de ida/vuelta, manipulación y rotación | `src/infrastructure/seguridad/cifrado-secretos.ts` (+test), `src/infrastructure/env.ts` | ídem | Sonnet | D12 | — |
| BUS-L8 | Entrada verificada: `verificarFirmaWebhook` (HMAC, ventana ±300 s, cuerpo crudo, rotación de 2 claves) + `webhook_inbox` idempotente | `src/infrastructure/seguridad/firma-webhook.ts` (+test) (= I04-A) | I04 | Sonnet | D12 | — |
| BUS-L9 | **PoC pg-boss**: arrancar en modo solo-envío desde Next, `publish` dentro de `tx` Drizzle, `key_strict_fifo` y DLQ; informe con `pg_locks`; **sin cambiar producción** | `scripts/poc-pgboss.mjs` (nuevo), informe en `.viltrum/vre-os/evidencia/` | ídem | Sonnet | D12+D16 | BUS-L4 |
| BUS-L10 | `BusPort` + adaptador pg-boss tras decisión; programador (`schedule`) para mora/KYC/SLA | `src/application/compartido/bus.ts`, `src/infrastructure/integraciones/bus/**` | ídem | Sonnet | D12 | BUS-L9 + decisión |
| BUS-L11 | Webhooks de salida firmados (`standardwebhooks`) + anti-SSRF (sin IP privada, HTTPS exacto, sin redirecciones) | `src/infrastructure/integraciones/webhooks-salida/**` | ídem | Sonnet | D12 | BUS-L8 |
| BUS-L12 | Worker como servicio Windows (programador de tareas o servicio) con latido y alerta | `scripts/outbox-worker.mjs`, `docs/ops/` | ídem | Haiku | D16 | BUS-L4 |

## 8. No verificado
Requisitos de infraestructura de Trigger.dev y su comportamiento autoalojado; que `vercel/workflow` tenga un «world» para PostgreSQL local; el envío de pg-boss desde el proceso Next sin su supervisor (`supervise:false`) y con el pooler de Supabase; carga real de eventos; que la extensión/grants de Postgres local permitan REVOKE sobre el esquema `pgboss` (D11/D16 lo comprueban); versión exacta de Node en el entorno de Windows de Wilber (hay `engines >=22.13`).
