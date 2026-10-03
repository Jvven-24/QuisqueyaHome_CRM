# Receptor webhook Viltrum — 2026-09-29

Implementación: `viltrum_sdk/webhooks.py`. Este documento describe el contrato
implementado y sus límites; no acredita una ejecución de servidor, modelos,
proveedores ni pruebas HTTP. La validación operativa se registra aparte.

## Transporte y configuración

`serve(configpath, port=8771)` enlaza exclusivamente `127.0.0.1`; no existe opción
para publicar el socket en otra interfaz. `status(configpath)` consulta contadores
SQLite en modo de solo lectura, sin recuperar ni despachar eventos.

Se usa HTTP de la biblioteca estándar para una entrada local pequeña. Python
documenta que `http.server` implementa comprobaciones básicas y no lo recomienda
como servidor de producción expuesto. Este diseño limita interfaz, conexiones y
entradas; cualquier futura recepción pública necesita un gateway autenticado con
TLS y una evaluación independiente.

La configuración privada puede compartir `client.json` con el adaptador OpenClaw;
el receptor lee `schemaVersion: 1`, `dataDir`, `secretEnvFile`, `tokenEnv`, `backend`,
`projects`, `maxPending` y `requestsPerMinute`. Los campos adicionales del adaptador
no se ejecutan. El ejemplo público contiene rutas ficticias y ningún secreto.

`projects` es una allowlist exacta de ID a ruta absoluta, con instalación Viltrum
existente. El backend administrativo admite `openclaw` o `codex`. La configuración,
el archivo de secretos y la cola deben estar fuera de proyectos y del SDK. Se
rechazan enlaces simbólicos, junctions y otros componentes reparse. El instalador
debe establecer ACL privadas para estos archivos y su directorio en Windows.

El Bearer se lee desde un archivo env pequeño, como texto: no se ejecuta, importa
ni expande. El nombre por defecto es `VILTRUM_WEBHOOK_TOKEN`; exige 32–512 caracteres
ASCII sin espacios. El proceso no imprime ni devuelve el token. Las comparaciones
de autenticación usan `hmac.compare_digest`.

## Contrato HTTP

| Entrada | Autenticación | Resultado |
| --- | --- | --- |
| `POST /webhooks/viltrum` | Un único `Authorization: Bearer ...` | `202` después del commit SQLite |
| `GET /events/<eventId>` | El mismo Bearer | Estado, runId y referencias locales de evidencia |
| `GET /health` | Sin Bearer | Nombre del servicio, estado y versión de esquema |

Host debe ser exactamente `127.0.0.1:<puerto>` o `localhost:<puerto>`. No se admiten
query strings, fragments, Origin de navegador ni CORS. El token solo se acepta por
header. No se registran headers, bodies, prompts ni trazas de excepciones.

El POST exige JSON UTF-8, un único Content-Length y Content-Type application/json;
admite el parámetro exacto `charset=utf-8`. Rechaza Transfer-Encoding,
Content-Encoding, claves JSON duplicadas y valores JSON no finitos. Body máximo:
64 KiB. Texto máximo: 32 KiB UTF-8, no vacío. Lectura del body: plazo total de cinco
segundos. Timeout de socket también limita esperas sin datos en headers.

Payload exacto, sin otros campos:

```json
{
  "eventId": "crm-demo-20260929-001",
  "projectId": "runtime-demo",
  "text": "Analiza el alcance de integrar el formulario de contacto.",
  "intent": "INTEGRACION"
}
```

eventId usa 1–96 caracteres ASCII seguros: primer carácter alfanumérico y después
alfanuméricos, punto, guion o guion bajo. projectId debe existir en la allowlist.
intent admite `AUTO` o los valores del catálogo `orchestration.INTENTS`. AUTO usa
el clasificador local de intención sobre el texto; el goal del runtime conserva
una instrucción administrativa fija con referencia al artefacto.

No existen campos para ruta de proyecto, backend, agente, modelo, comandos ni
callbackURL. Las rutas desconocidas devuelven 404; credenciales inválidas, 401;
formato inválido, 400/411/413/415; conflicto de idempotencia, 409; capacidad o tasa
excedida, 429. Las respuestas no incluyen texto del cliente ni salida libre del
modelo; summary informa estado y número de tareas, y evidence lista rutas locales
existentes. El endpoint de evento requiere autenticación también después de terminar.

## Durabilidad y ejecución

SQLite conserva el payload canónico, su SHA256, la ruta absoluta del proyecto en
el momento de aceptación, backend administrativo, artefacto asignado, timestamps,
estado y runId. `event_id` es PRIMARY KEY. La aceptación y la comprobación de
capacidad se serializan mediante `BEGIN IMMEDIATE`; SQLite usa WAL y
`synchronous=FULL`. Una respuesta 202 significa entrada durable, no tarea terminada.

Un reintento con el mismo ID y payload devuelve 202 y la identidad original con su
estado actual. El mismo ID con otro payload devuelve 409. No se asigna otro artefacto
ni otro run para un duplicado. Los registros completados se conservan; no hay
retención automática ni una operación remota para borrar o reenviar eventos.

El límite de eventos pending/processing es 32 por defecto, configurable hasta 100.
La tasa global es 60 solicitudes por minuto por defecto, con deque protegida por
lock y máximo administrativo de 600. Incluye health, solicitudes sin autenticación
y consultas de estado. Hay ocho slots HTTP y un único worker de ejecución. Los
controles en memoria se reinician con el proceso; la idempotencia persiste.

Un lock del sistema operativo sobre `dataDir/receiver.lock` protege toda la vida
del receptor, incluido cierre del worker. Dos procesos no pueden recuperar ni
despachar sobre la misma cola. El worker marca `processing` mediante commit antes
de escribir artefactos o crear un run. Persiste la entrada por escritura temporal,
fsync y reemplazo atómico bajo `.viltrum/intake/webhooks/<uuid>.md`, comprobando
contención y componentes de ruta. Nunca toma un nombre de archivo del caller.

La entrada se marca explícitamente como datos externos no confiables, con un
delimitador aleatorio. El contenido no se concatena al goal autorizado. El runtime
recibe `source_paths=[artefacto]`, registra la fuente y su fingerprint, y conserva
la política de análisis de solo lectura y los gates existentes. El delimitador
es una marca de procedencia; no acredita inmunidad del modelo a prompt injection.

`runtime.start(..., on_created=callback)` llama el callback después de guardar el
run preparado y su evento y antes del dispatch. El callback guarda runId en SQLite;
si ese commit falla, no se despacha. Al regresar el runtime, el evento queda
completed si el run terminó, o blocked si requiere atención; las excepciones
producen failed con una explicación fija sin detalles del proveedor.

## Recuperación y límites

Tras un cierre abrupto, cualquier evento que conservaba processing pasa a blocked
con una nota de reconciliación. No se crea ni reanuda automáticamente otro run.
Si runId existe, se inspecciona el run registrado. Una caída entre crear el run y
guardar runId exige correlacionar el goal, la fuente y la carpeta local de runtime;
el sistema conserva el bloqueo aunque no conozca aún el ID. Evitar duplicados
ambiguos tiene prioridad sobre una reejecución automática.

Los pendientes sí se despachan después del reinicio. Si cambia la ruta asignada a
un projectId entre aceptación y ejecución, falla sin redirigir la entrada. Los
errores de almacenamiento dejan un evento processing para recuperación si no se
puede persistir el error. No existen callbacks externos ni envío de mensajes.

El cierre normal detiene la recepción, solicita fin del loop y espera que el
runtime activo complete su ejecución acotada antes de liberar el lock. Una
terminación forzada deja los estados durables para reconciliación. No se promete
entrega exactly-once de proveedores externos: se impide la redistribución automática
del evento después de side effects ambiguos.

Un usuario local con permisos para mutar simultáneamente rutas, SQLite, la
configuración o secretos puede alterar la confianza del sistema. Las comprobaciones
de enlaces y contención se repiten antes de operaciones administradas; Python
portable no elimina todas las carreras de sustitución de directorio en Windows.
Las ACL privadas y la autorización sobre el proyecto siguen siendo necesarias.

## Fuentes primarias consultadas

- [Python: http.server](https://docs.python.org/3/library/http.server.html): comportamiento de handlers, headers y límites de uso.
- [Python: sqlite3](https://docs.python.org/3/library/sqlite3.html): conexiones, transacciones y acceso de solo lectura con URI.
- [Python: hmac](https://docs.python.org/3/library/hmac.html): comparación de secretos con compare_digest.

Se comprobó la sintaxis mediante `ast.parse` sin importar ni ejecutar el módulo.
No se añadieron pruebas ni se arrancó el servidor durante esta implementación.
