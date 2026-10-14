# D10 + D19 · Worker del outbox por tipos con consumidor (2026-10-14)

Corrige B-01 (M22) y B-03 (I04) de las revisiones D12/D14: el worker reclamaba cualquier evento pendiente y mandaba a cola muerta los tipos que no conocía. Sin migración. Sin commit, push, `dev` ni `build`.

## 1. Impacto GitNexus (repo QuisqueyaHome_CRM, upstream, con tests)

| Símbolo | Riesgo | Callers directos |
|---|---|---|
| `procesarOutbox` | LOW | `worker.test.ts` (y `runtime.ts:ejecutarLoteOutbox` por import) |
| `colaOutboxDrizzle` | LOW | `ejecutarLoteOutbox` (`runtime.ts`); proceso `ejecutarLoteOutbox` |
| `ColaOutbox` (interfaz) | LOW | `worker.test.ts`, `runtime.ts`, `repositorio.ts`; indirectos `repos/pipeline.ts`, `contenedor/pipeline.ts`, `test-db/cierre.ts` (importan `outboxDrizzle`, que no se tocó) |
| `consultarEstadoOutbox` | LOW | `contenedor/outbox.ts:estadoOutbox` -> `ConfiguracionPage` |
| `ejecutarLoteOutbox` | LOW | ninguno (lo llama `scripts/outbox-worker.mjs`, fuera del grafo) |
| `describirEstadoOutbox` | LOW | `outbox-estado.test.ts` (y `_integraciones.tsx`) |

Ninguno HIGH/CRITICAL. `ejecutarLoteOutbox` / `runtime.ts` no necesitó cambios: usa el registro por defecto.

## 2. Diseño

- **Registro de consumidores** (`outbox/registro.ts`): `ConsumidorOutbox = { destino, manejadores: { tipo -> Manejador } }`; `crearRegistro()` expone `tipos()` y `manejadorDe(tipo)`. Un tipo con dos consumidores lanza al construir el registro (la fila de `outbox` no guarda estado por destino todavía; ver I00 §4, columna `destination` pendiente). Por eso "manejador(es)" queda en un manejador por tipo hasta que I00 añada destino.
- **Consumidor CRM** (`outbox/consumidores.ts`): los tres tipos actuales, con la misma validación Zod, versión 1, coherencia `aggregateId == payload.id` y llamadas al `CrmPort` que antes vivían en el `switch` del worker. `registroPorDefecto` y `TIPOS_CONSUMIDOS_POR_DEFECTO` son el único sitio donde un módulo nuevo se da de alta.
- **Cola** (`ColaOutbox.conSiguiente(cuando, tipos, procesar)`): `tipos` es obligatorio (seguro por defecto). El adaptador Drizzle añade `event_type in (…)` al `SELECT … FOR UPDATE SKIP LOCKED`; con lista vacía devuelve `false` sin consultar.
- **Worker**: pide a la cola solo `registro.tipos()`. Guardia en profundidad: si una cola entrega un tipo sin manejador, lanza un error (revierte la transacción, el evento queda intacto) y NO llama a `fallido`. Un tipo sin manejador jamás llega a `outbox_dead`.
- **Estado**: `EstadoOutbox.sinConsumidor` = pendientes (`sent_at` y `dead_at` nulos) cuyo tipo no está en el registro; subconjunto de `pendientes`. `consultarEstadoOutbox(db, tiposConsumidos)` lo mide en SQL; `describirEstadoOutbox` lo muestra en la tarjeta de Configuración ("sin consumidor: N" y, si N>0, la nota de que esperan intactos). Sin datos inventados: viene de la BD.
- **Conservado**: idempotencia (misma `idempotencyKey`/`correlationId` al puerto, `external_refs` upsert por versión), backoff con jitter (`politica.ts` sin cambios), 5 intentos, clasificación RETRYABLE/NON_RETRYABLE/HUMAN_REQUIRED. Nota: un evento de tipo CONOCIDO con payload inválido o versión desconocida sigue siendo `NON_RETRYABLE` y va a cola muerta de inmediato, como antes (es un fallo de un manejador existente, no un tipo sin consumidor).

## 3. Cambios (archivo:línea)

- `src/infrastructure/integraciones/outbox/registro.ts` (nuevo): tipos y `crearRegistro` (todo el archivo).
- `src/infrastructure/integraciones/outbox/consumidores.ts` (nuevo): consumidor CRM, `registroPorDefecto`, `TIPOS_CONSUMIDOS_POR_DEFECTO`.
- `src/infrastructure/integraciones/outbox/worker.ts:13-18` (firma `conSiguiente` con `tipos`), `:24-34` (registro, tipos, guardia), `:37` (manejador). Se retira la unión Zod y el `switch`.
- `src/infrastructure/integraciones/outbox/repositorio.ts:25-33` (filtro por tipos y atajo de lista vacía).
- `src/infrastructure/integraciones/outbox/estado.ts:6-28` (parámetro `tiposConsumidos`, contador `sinConsumidor`).
- `src/infrastructure/contenedor/outbox.ts:1-9` (pasa `TIPOS_CONSUMIDOS_POR_DEFECTO`).
- `src/application/compartido/outbox-estado.ts:12-16` (campo `sinConsumidor`), `:37-40` (texto de la tarjeta).
- Pruebas: `outbox/worker.test.ts` (doble con `tipos` + 6 pruebas nuevas), `outbox/registro.test.ts` (nuevo, 3), `application/compartido/outbox-estado.test.ts` (literales + 1), `scripts/test-db/outbox.ts` (nuevo, 4), `src/infrastructure/db/outbox.db.test.ts` (nuevo, puerta del runner), `scripts/test-db/comunicaciones.ts` (firma nueva + `sinConsumidor` delta 0).

## 4. Pruebas

Unitarias (dobles): tipo desconocido no se reclama, queda pendiente con 0 intentos y nunca muere (varias pasadas); tipo conocido se procesa; consumidor nuevo registrado procesa su tipo; manejador que falla siempre pasa a muerta solo en el quinto intento (4 pasadas siguen pendientes); registro vacío no reclama nada; cola que ignora el filtro provoca error sin tocar el evento; la cola recibe exactamente `[ActividadRegistrada, LeadCreado, NegocioCambioEtapa]`; registro rechaza duplicados; el registro por defecto no incluye tipos financieros; texto "sin consumidor".

BD (`scripts/test-db/outbox.ts`, PostgreSQL local temporal):
1. El CHECK `outbox_type_check` rechaza hoy `PagoRegistrado` (SQLSTATE 23514). Por eso no se puede insertar un tipo realmente desconocido; el "sin consumidor" se prueba con un tipo válido para el CHECK (`ActividadRegistrada`) que el registro de la prueba no declara, que es exactamente el mecanismo de selección por tipos que usará el worker real.
2. Evento sin consumidor, el más antiguo (`created_at` anterior), más un `LeadCreado`: tras dos pasadas el primero conserva `sent_at`/`dead_at` nulos, 0 intentos, historial vacío y sin fila en `outbox_dead`; el segundo queda enviado; contadores de estado correctos (`sinConsumidor` +1, pendientes +1, enviados +1).
3. Contador `sinConsumidor` solo cuenta pendientes (no enviados ni muertos); con registro completo es 0; sin consumidores es igual a `pendientes`.
4. Manejador que falla RETRYABLE: `attempts` 1..5 persistidos, `dead_at` y fila en `outbox_dead` únicamente en el quinto.

## 5. Prueba de mutación

- M1: quitar el filtro `event_type in (…)` de `repositorio.ts`. `npm run test:db` -> exit 1, falla `DB outbox reclamo por tipos…` (150 pass, 1 fail). Restaurado.
- M2: el worker pide un tipo extra (`PagoRegistrado`) a la cola. Fallan 2 pruebas unitarias (`un tipo sin consumidor no se reclama…`, `la cola recibe exactamente los tipos…`). Restaurado.
- M3: M2 + tipo sin manejador a `fallido(NON_RETRYABLE, null)` (comportamiento antiguo). Fallan 3 pruebas unitarias (las anteriores y la de cola que ignora el filtro). Restaurado; `diff` contra la copia previa sin diferencias y 12/12 pruebas del worker en verde después.

## 6. Salidas (ejecutadas por mí, 2026-10-14)

```
typecheck EXIT=0          (tsc --noEmit, sin errores)
lint EXIT=0               (eslint ., sin avisos)
test EXIT=0               ℹ tests 607 · pass 607 · fail 0
test:db EXIT=0            # tests 151 · pass 151 · fail 0
                          CLEANUP PASS · DEV COUNTS PASS · DEV HASHES PASS (BD de desarrollo intacta, outbox 0 filas)
spec:check EXIT=0         "Sin bloqueos."
outbox:worker -- --once EXIT=0
  outbox: pasada 1, procesados 0
  outbox: terminado (1 pasadas, 0 procesados, 0 fallos).
```

## 7. Procedimiento para emitir tipos nuevos (Cobros, Portal, Academy): cada módulo en su lote

No se tocó `outbox_type_check` (definición en `src/infrastructure/db/schema.ts:1175`, creado en `drizzle/0003_curly_charles_xavier.sql:31`). La última migración es `0005_identidad_venta_durable`; la siguiente es `0006_*`. Cada módulo, en su lote y con su ficha READY:

1. Añadir el tipo a `TIPOS_EVENTO_CRM` (`src/application/compartido/crm.ts`) o, mejor, a un catálogo propio del módulo y unir ambos en el `enum` de la columna `eventType` (`schema.ts`); revisión B-01(d): los eventos de cobro no son del CRM comercial.
2. Editar el CHECK en `schema.ts:1175` con la lista ampliada y generar la migración con `npx drizzle-kit generate` (nombre `0006_<modulo>_tipos_outbox`). Contenido esperado: `ALTER TABLE "outbox" DROP CONSTRAINT "outbox_type_check";` y `ALTER TABLE "outbox" ADD CONSTRAINT "outbox_type_check" CHECK ("outbox"."event_type" in (…lista completa…));`. Cada migración posterior debe incluir la lista completa vigente (no solo el tipo nuevo).
3. Verificar con `npm run test:db` (el migrador oficial la aplica en una BD temporal; la prueba 1 de `scripts/test-db/outbox.ts` asume que `PagoRegistrado` aún se rechaza: el módulo que lo añada debe actualizarla).
4. Registrar el consumidor: crear `ConsumidorOutbox` del módulo (`destino`, `manejadores`) y añadirlo a `crearRegistro([...])` en `consumidores.ts`; si necesita dependencias propias, ampliar `ContextoConsumo` en `registro.ts` y su alimentación en `worker.ts`/`runtime.ts`. Un tipo con dos consumidores lanza al arrancar.
5. Orden de lotes recomendado (cierra B-01): el filtro por tipos ya está en la rama, así que L2 (CHECK) y L4/L5 (emisión) pueden ir antes que el consumidor; mientras no haya consumidor, los eventos quedan pendientes y el panel de Configuración los cuenta como "sin consumidor". Un evento emitido con consumidor ausente NO se pierde.
6. Pendiente conocido: sin columna de destino (I00 §4) un tipo solo puede tener un consumidor, y el estado `enviado` es por evento. Fan-out a varios destinos requiere I00 antes.

## 8. Archivos tocados

Nuevos: `src/infrastructure/integraciones/outbox/registro.ts`, `.../consumidores.ts`, `.../registro.test.ts`, `scripts/test-db/outbox.ts`, `src/infrastructure/db/outbox.db.test.ts`.
Modificados: `src/infrastructure/integraciones/outbox/worker.ts`, `.../repositorio.ts`, `.../estado.ts`, `.../worker.test.ts`, `src/infrastructure/contenedor/outbox.ts`, `src/application/compartido/outbox-estado.ts`, `.../outbox-estado.test.ts`, `scripts/test-db/comunicaciones.ts`.
Sin migración, sin cambios en `schema.ts`, `drizzle/`, `package.json` ni en el servidor 9301.
