# D10 Backend + D12 Seguridad · correcciones de seguridad y enlace (2026-10-14)

Autorización: decisión #48. Sin git commit/push/stash/checkout, sin `npm run dev`/`build`. Hallazgos de origen: `.viltrum/research/D21-inventario-funcional-crm-2026-10-14.md` (hallazgos 5 y 9, rutas `[id]`) y `.viltrum/research/D19-enlace-portal-crm-2026-10-14.md` (fila 3, ACK). No se tocó `src/app/(crm)/negocios/**`, `src/application/academy/**`, `src/app/(crm)/academy/**` ni `repos/academy.ts`. No hay tabla, columna ni migración nuevas.

## Impacto GitNexus (índice `QuisqueyaHome_CRM`, `impact` upstream / `api_impact`)

| Símbolo | Callers directos | Riesgo |
|---|---|---|
| `prepararYDespacharMensaje` | 0 en el grafo; Grep: `api/comunicaciones/despachar/route.ts` y su prueba. No se modificó: se añadió `despacharMensajeAuditado` que lo envuelve | LOW |
| `IntegracionesPanel` | 0 (Grep: `configuracion/vista.tsx`) | LOW |
| `ejecutarLoteOutbox` | 0 (no se modificó; ahora lo invoca `scripts/outbox-worker.mjs`) | LOW |
| `POST /api/leads/externo` (`api_impact`) | 0 consumidores internos; cambio aditivo | LOW |
| `POST /api/comunicaciones/despachar` (`api_impact`) | 1: `comunicaciones/vista.tsx` (lee `ok`, `resultado`, `error`; no se quitó ninguno, se añadió `auditado`) | MEDIUM por la regla "1 consumidor", sin HIGH/CRITICAL |

Ningún HIGH/CRITICAL: no hubo que detenerse.

## 1. Despacho de comunicaciones con permiso de lectura

**Hallazgo.** `api/comunicaciones/despachar/route.ts` enviaba mensajes externos (Telegram, WhatsApp, email, SMS, webhook) con `communications:view`, y el envío no dejaba rastro.

**Criterio de permiso.** `PERMISSION_ACTIONS` es una lista cerrada (`view, create, edit, delete, import, export`) y no existe `send`/`manage`. Añadir una acción habría tocado catálogo, UI de permisos, `db/seed.sql` y los datos de las bases ya sembradas. Se usó la acción de escritura existente: **`communications:create` con alcance `all`** (`requireFullScope`). Razón del `all`: el destinatario es texto libre, no cuelga de un registro con responsable, así que un alcance `own` no se puede aplicar. Efecto sobre los roles sembrados (`db/seed.sql:65-66,92`): admin `create/all` sí, asistente `create/all` sí, **broker `create/own` deja de poder despachar** (antes podía con `view/all`). Si Wilber quiere que el broker siga despachando, el cambio es una línea (`requireScope` en lugar de `requireFullScope`); queda como decisión de producto, no se tomó.

**Rastro.** Reutiliza `audit_log` (sin tabla nueva): `action='enviar'` (nuevo valor en `AUDIT_ACTIONS`, es `text` sin CHECK), `entity_type='user'`, `entity_id` = quien envió, `user_id` = quien envió, `created_at` = cuándo, `new_value` = JSON `{canal, destinatario (enmascarado), ok, mensajeId, error (recortado a 200 y sin tokens de bot), enviadoAt}`. No se guarda el cuerpo del mensaje ni el destinatario completo. Se registra también el fallo del proveedor (resultado `ok:false` y excepción). Si es la auditoría la que falla después de enviar, no se oculta el envío: la respuesta lleva `auditado:false` y el log del servidor no incluye el error del driver.

**Cambio.**
- `src/app/api/comunicaciones/despachar/route.ts:27-50` — `requireFullScope(actor,"communications","create")`, usa `despacharMensajeAuditado`, responde `{ok, resultado, auditado}`.
- `src/application/comunicaciones/casos-de-uso.ts` — nueva `despacharMensajeAuditado` (antes de `consultarEstadosCanales`).
- `src/application/comunicaciones/puertos.ts` — tipos `RegistroDespacho` y puerto `AuditoriaDespachos`.
- `src/domain/comunicaciones.ts` — `enmascararDestinatario`, `sanitizarErrorDespacho`.
- `src/domain/catalogs.ts` — `"enviar"` en `AUDIT_ACTIONS`.
- `src/infrastructure/db/repos/auditoria-despachos.ts` (nuevo) y `src/infrastructure/contenedor/comunicaciones.ts` — adaptador sobre `auditar(tx, ...)` en su propia transacción.
- `src/app/(crm)/_ui/historial.tsx` — etiqueta «Envío de mensaje».

**Pruebas.**
- `src/app/api/comunicaciones/despachar/route.test.ts` (ejecuta el `route.ts` real): 401 anónimo; 403 con solo `view`, con `create/own` y sin permisos, y el proveedor no se invoca; 200 con `create/all` deja un registro con `***142` y sin el teléfono; 400 con cuerpo inválido. Mutación verificada: con `"view"` en lugar de `"create"` el primer test falla.
- `src/application/comunicaciones/casos-de-uso.test.ts`: registro sin cuerpo ni teléfono completo; resultado fallido registrado; excepción del proveedor registrada y propagada; fallo de auditoría no oculta el envío ni filtra SQL.
- `src/domain/comunicaciones.test.ts`: máscaras por canal y saneo de tokens.
- `scripts/test-db/comunicaciones.ts` (vía `src/infrastructure/db/comunicaciones.db.test.ts`): el seed deja `create/all` solo a admin y asistente; el despacho escribe en `audit_log` real con acción `enviar`, autor, entidad y destinatario enmascarado (dentro de una transacción que se revierte).

## 2. Outbox sin disparador

**Hallazgo.** `ejecutarLoteOutbox` no tenía invocador y la UI decía «Worker transaccional activo».

**Cambio.**
- `scripts/outbox-worker.mjs` (nuevo) + `package.json:24` `"outbox:worker": "node scripts/outbox-worker.mjs"`. Sin dependencias nuevas: Node 24 con `registerHooks` para el alias `@/` (mismo mecanismo que `scripts/test-db/loader.mjs`). Reutiliza `ejecutarLoteOutbox` (contenedor `crmParaIntegraciones`, `colaOutboxDrizzle`, `procesarOutbox`); no duplica lógica.
- Modos: `npm run outbox:worker -- --once` (una pasada, código 1 si falla) y bucle `--interval=<s>` (30) `--limit=<1..1000>` (100); SIGINT/SIGTERM paran limpio. Rechaza `DATABASE_URL` no local salvo `--allow-remote`. Los fallos se registran solo con su código SQLSTATE/nombre, nunca el mensaje del driver. Lee `.env` solo si `DATABASE_URL` no viene del entorno; no imprime valores.
- `src/infrastructure/integraciones/outbox/ejecutor.ts` (nuevo, lógica del bucle probada sin DB) y `estado.ts` (conteos reales: pendientes, enviados, fallidos, último enviado), `src/infrastructure/contenedor/outbox.ts` (frontera exigida por ARQ-1: la página no importa `infrastructure/integraciones`).
- `src/application/compartido/outbox-estado.ts` (nuevo): tipo y `describirEstadoOutbox`.
- `src/app/(crm)/configuracion/_integraciones.tsx:21-23,33-40,52`, `vista.tsx`, `page.tsx:144-152`: la tarjeta Outbox muestra «Worker manual: ejecuta "npm run outbox:worker" (no hay proceso en segundo plano). Pendientes: N · enviados: N · fallidos: N · último procesado: …»; si la cola no se puede leer dice «Estado de la cola no disponible». Se corrigió también la tarjeta «Réplica CRM»: el motor `local` solo registra en consola (`contenedor/crm.ts`, `env.ts` `crmMotor`), ya no dice «motor configurable».

**Pruebas.** `ejecutor.test.ts` (args, rangos, destino local, `--once`, intervalo, lote lleno sin dormir, fallo en bucle sin filtrar secreto, parada), `outbox-estado.test.ts` (nunca afirma worker activo; no inventa conteos), prueba DB `consultarEstadoOutbox` con eventos pendiente/enviado/muerto reales. Humo manual: `npm run outbox:worker -- --once` contra la base local de desarrollo (`outbox` tenía 0 filas, sin cambios) imprimió `pasada 1, procesados 0` y salió 0; `--bogus` salió 2; con `DATABASE_URL` remota salió 2 sin conectar; el bucle `--interval=1` hizo 3 pasadas en 4 s. **No verificado:** entrega real de un evento (la base de desarrollo no tiene eventos y no se insertaron; el destino `crmLocal` solo registra).

## 3. Acuse del webhook de leads externos

**Cambio.** `src/app/api/leads/externo/route.ts` (respuesta): `{ ok:true, ...resultado, leadId: resultado.lead.id }`. Aditivo: `ok`, `lead` y `creado` siguen igual. Se documentó el contrato en el comentario de cabecera.

**Verificado en la ruta (sin cambios necesarios).** El token se comprueba antes de leer el cuerpo (`coincideToken`, tiempo constante, 401 genérico). Idempotencia por `externalId` + huella (`capturarLeadExterno`, índice `leads_external_id_unq`): un reintento devuelve el mismo lead con `creado:false`. Zod valida y la asignación es campo por campo. El payload **ya acepta** origen/UTM/proyecto: `sourceId`, `projectId`, `projectInterestText`, `zoneInterest`, `campaign`, `utmSource`, `utmMedium`, `utmCampaign`, `sourceVideoUrl`, `operationType`, presupuesto y `currency`. No hizo falta columna nueva. Pendiente del lado del Portal (D19 puntos 8-9): el Portal no los envía y debería mandar el origen por código estable, no por id numérico.

**Pruebas.** `src/app/api/leads/externo/route.test.ts` (ejecuta el `route.ts` real): `leadId === lead.id` y conserva `ok/lead/creado`; reintento `creado:false` con el mismo `leadId`; 401 sin token / vacío / incorrecto / truncado, sin `leadId` y sin llamar al caso de uso; el token se comprueba antes de `request.json()`; 400 por Zod (sin `externalId`, sin nombre, correo inválido, `projectId` negativo) y campos desconocidos (`brokerId`, `isAdmin`) no llegan al caso de uso. Mutación verificada: sin `leadId` fallan 2 pruebas.

## 4. Rutas `[id]` sin `visibleRows`/`reaches` en el route.ts

Hay **23** rutas dinámicas (el inventario contó 21) que no nombran `visibleRows`/`reaches` en su `route.ts`. Revisadas una por una: **ninguna es un hueco; no se corrigió ninguna.**

- Caso de uso con alcance por fila (14): `actividades/[id]` (`buscarVisible`), `leads/[id]/convertir` y `descartar` (`reaches` sobre `lead.brokerId`), `pipeline/[id]`, `/etapa`, `/propiedades`, `/propiedades/[propId]` (`reaches` / `negocioAbiertoVisible`), y las 7 de `proyectos/[id]/**` (`proyectoVisible`, `unidadVisible`, `faseVisible`).
- Recurso global sin responsable por fila, protegido con permiso (6): `catalogos/[tipo]` y `[tipo]/[id]`, `etapas/[id]`, `roles/[id]/permisos` (`settings:*`), `comunicaciones/plantillas/[id]` (`communications:edit`), `usuarios/[id]/invitacion` (`requireFullScope users:edit`).
- `brokers/[id]/proyectos`: el caso de uso exige alcance `all` sobre `projects:edit` (`application/brokers/casos-de-uso.ts`, `alcance !== "all"`). Sin brecha para un broker.
- `academy/[id]/progreso` y `academy/checklist/[id]`: usan `actor.userId`, solo tocan el progreso propio. No se editó nada de Academy.

**Candado nuevo.** `src/infrastructure/seguridad-rutas-id.test.ts`: la lista de rutas dinámicas sin `reaches/visibleRows` debe coincidir exactamente con la lista revisada, y cada excepción conserva la garantía citada (regex sobre el caso de uso o la ruta). Una ruta `[id]` nueva sin alcance, o una excepción que pierda su garantía, rompe `npm test`.

## Verificación (salidas reales, ejecutadas al final)

```
typecheck  exit=0   (tsc --noEmit, sin errores)
lint       exit=0   (eslint ., sin salida de errores)
npm test   exit=0   ℹ tests 576 / ℹ pass 576 / ℹ fail 0
test:db    exit=0   # tests 147 / # pass 147 / # fail 0
                    DB comunicaciones: ok 9 (seed create/all), ok 10 (outbox), ok 11 (audit_log enviar)
                    DEV COUNTS PASS: todas las tablas public idénticas antes/después
                    DEV HASHES PASS: todas las columnas idénticas antes/después
spec:check exit=0   «Sin bloqueos.»
```

Nota de proceso: en una corrida intermedia `npm test` y `typecheck` fallaron solo en `src/app/(crm)/negocios/**` (4 pruebas de `tablero.test.ts` y un error de tipos en `negocios/page.tsx`), edición en curso del otro agente; no son de este trabajo. Una corrida previa también mostró un fallo propio, ARQ-1 (la página de Configuración importaba `infrastructure/integraciones`), que se resolvió con `contenedor/outbox.ts`. La corrida final es la de arriba.

## Archivos

Modificados: `package.json` (1 línea), `src/app/api/comunicaciones/despachar/route.ts`, `src/app/api/leads/externo/route.ts`, `src/application/comunicaciones/casos-de-uso.ts`, `src/application/comunicaciones/puertos.ts`, `src/application/comunicaciones/casos-de-uso.test.ts`, `src/domain/comunicaciones.ts`, `src/domain/comunicaciones.test.ts`, `src/domain/catalogs.ts`, `src/infrastructure/contenedor/comunicaciones.ts`, `src/app/(crm)/_ui/historial.tsx`, `src/app/(crm)/configuracion/_integraciones.tsx`, `src/app/(crm)/configuracion/page.tsx`, `src/app/(crm)/configuracion/vista.tsx`.

Creados: `scripts/outbox-worker.mjs`, `scripts/test-db/comunicaciones.ts`, `src/infrastructure/db/comunicaciones.db.test.ts`, `src/infrastructure/db/repos/auditoria-despachos.ts`, `src/infrastructure/contenedor/outbox.ts`, `src/infrastructure/integraciones/outbox/ejecutor.ts`, `src/infrastructure/integraciones/outbox/ejecutor.test.ts`, `src/infrastructure/integraciones/outbox/estado.ts`, `src/application/compartido/outbox-estado.ts`, `src/application/compartido/outbox-estado.test.ts`, `src/app/api/comunicaciones/despachar/route.test.ts`, `src/app/api/leads/externo/route.test.ts`, `src/infrastructure/seguridad-rutas-id.test.ts`, este informe.

## Pendientes y decisiones para Wilber

1. **Broker sin despacho.** Con `create/all` el broker (`create/own`) ya no puede despachar desde Comunicaciones. Confirmar si es lo deseado.
2. La UI de Comunicaciones (`comunicaciones/vista.tsx`, no tocada) mostrará el 403 como error genérico a quien no tenga permiso; el botón no se oculta según permiso.
3. Registro de despachos en `audit_log` con `entity_type='user'`: es el mejor encaje sin tabla nueva. Una tabla `message_dispatches` propia (con bandeja e historial por contacto) requeriría migración: no se creó.
4. El worker no corre solo: hay que lanzarlo (`npm run outbox:worker`) o programarlo; en producción/VPS queda para D16 (ficha I01-A, A5/A7: roles de base separados).
5. El Portal sigue sin enviar origen/UTM/proyecto estructurado y sin leer `leadId` (D19 puntos 2, 8, 9): trabajo del lado del Portal.
