# Pendientes de runtime OpenClaw — 2026-09-30

## Resultado y cambio aplicado

El cliente del SDK exige OpenClaw 2026.9.4 con Node 24.18.0, transporte explícito `local` y el estado original `C:/Users/wilbe/.openclaw`. El Gateway original tiene un listener activo en 18789 según la inspección del supervisor. `agent --local` y el Gateway compiten por la misma propiedad exclusiva del estado; cambiar sólo el fichero de configuración no separa esa propiedad.

La investigación del fallo genérico de `runtime-doctor` encontró una causa previa: `package.json` de esa ruta instalada declara **2026.9.7**, mientras el adaptador exige **2026.9.4**. `_settings()` resuelve correctamente el cliente en MSIX `LocalCache/Local/Viltrum/openclaw/client.json`; la diferencia de `LOCALAPPDATA` no explica ese fallo. `_snapshot()` rechaza la versión antes de validar el resto de política. `capability()` ahora publica `installedVersion` sólo tras validar un formato de versión acotado y preserva el diagnóstico constante de `PolicyError`, en vez de ocultarlo tras el mensaje genérico. No se actualizó la versión permitida sin revisar el contrato.

Un segundo bloqueo apareció al inspeccionar exclusivamente existencia de archivos de método: los 23 registros del cliente apuntan a `C:/Users/wilbe/.clawd/viltrum/workspaces/viltrum-d00` hasta `viltrum-d22`, pero en el contexto actual hay **0 directorios de workspace y 0 `profile.json` presentes** en esas rutas. La raíz administrada sí existe. La consola encuentra el cliente y su transporte local, pero proyecta 0 agentes configurados porque faltan sus perfiles. Esto necesita restaurar o regenerar explícitamente el método de los 23 perfiles antes de acreditar el runtime; cambiar solamente la versión permitida no resuelve la disponibilidad.

Las fuentes oficiales de docs/dist consultadas en esa ruta pertenecen por tanto al **paquete instalado 2026.9.7** y describen sus mecanismos. No acreditan por sí mismas el comportamiento binario del contrato fijado 2026.9.4. El supervisor debe decidir entre recuperar una instalación realmente fijada o revisar y acreditar explícitamente el contrato de 2026.9.7 antes de admitir llamadas.

En `viltrum_sdk/adapters/openclaw.py`, tras acreditar versión y política, `capability()` declara `available=false` y `localStateConflict=true` cuando el cliente selecciona `local` y el endpoint loopback `/healthz` responde 200. `execute()` repite la comprobación antes de escribir `dispatch.json` y devuelve un bloqueo claro sin arrancar el CLI ni llamar al modelo. Evita gastar el arranque frío conocido en un turno que el runtime debe rechazar. Mientras exista el desacuerdo de versión, ése sigue siendo el bloqueo inicial.

Sin un Gateway saludable, el estado sigue siendo una candidatura respaldada por metadatos: `exclusiveStateOwnershipVerified=false`. La adquisición nativa del lock antes de inferencia permanece obligatoria. Un Gateway puede aparecer después del preflight; el lock nativo resuelve esa carrera. Ausencia de respuesta HTTP no demuestra que otro escritor haya liberado el estado. El resultado de capability se conserva hasta 15 segundos; la admisión del despacho comprueba el endpoint de nuevo.

`/healthz` acredita únicamente un endpoint saludable. No demuestra identidad del proceso, autenticación del cliente, configuración efectiva de perfiles, limpieza de descendientes ni permiso para ejecutar un turno. El cambio usa el conflicto conocido en este entorno; no transforma el probe en una atestación de política.

## Coexistencia con el Gateway y OAuth nativo

La documentación y los módulos distribuidos sí contienen un mecanismo nativo de ejecución temporal con credenciales originales: `agent exec`, sin `--state-dir`, crea estado temporal; captura el directorio del agente y del estado de autenticación antes de cambiar el estado del turno, y ejecuta bajo `withAuthProfileStoreAgentDir(storedAuthAgentDir, storedAuthStateDir, ...)`. El SDK no necesita abrir, copiar o exportar la base OAuth para ese mecanismo.

Sin embargo, no es un reemplazo compatible con el contrato actual:

- El CLI `agent exec` no expone `--agent` ni transmite el selector del comando padre. Resuelve el agente ambiente mediante `agents.defaults.systemAgent.agentId`; `deps.agentId` es una dependencia interna. No sirve directamente para seleccionar D00–D22 con el contrato actual.
- Su envelope estable proyecta campos de resultado y métricas, pero omite `terminalReceipt`, `agentHarnessId` y el `runId` necesarios para comprobar la identidad, ausencia de herramientas y ausencia de entrega por canales que exige el adaptador.
- Su configuración fija el cwd y `skipBootstrap=true`; por tanto el método nativo de los perfiles no se consume como en `agent --local`.
- `--isolated` y `--auth-env-only` cambian configuración y descubrimiento de credenciales. No sustituyen de forma acreditada los perfiles restringidos registrados.

El read-through ordinario usa la base compartida seleccionada por `OPENCLAW_STATE_DIR`. Cambiar esa variable para `agent --local` también cambia la ubicación de credenciales compartidas; no existe en los switches de ese CLI un selector público independiente para el estado de OAuth original. La separación explícita del módulo de autenticación existe en la implementación de `agent exec`, pero usarla mediante imports internos requeriría desarrollar y mantener un puente privado con otro contrato. No se implementó ese puente.

Reusar el `agentDir` de un agente nativo como atajo de autenticación compartiría también su estado y sesiones. La documentación de multi-agent indica que no deben reutilizarse directorios de agentes. Tampoco se propone enlazar o copiar la base de datos original, retirar locks ni habilitar `OPENCLAW_ALLOW_MULTI_GATEWAY` para compartir estado mutable.

## Transporte Gateway

Cambiar el cliente de `local` a `gateway` evita la competencia por estado, pero el proceso activo ejecuta su propia configuración. El adaptador actual proyecta y valida el fichero indicado por el cliente; `/healthz` no prueba que coincida con la configuración cargada por el Gateway. El supervisor conoce una diferencia entre el registro privado de 23 perfiles y el registro global de 27 entradas con otras integraciones. La presencia de los IDs en ambos registros no demuestra igualdad de política efectiva, hooks, plugins o canales.

Antes de admitir este transporte hace falta acreditar la política del proceso que atenderá el turno y conservar el recibo terminal estricto. No se cambió la configuración nativa, los canales, la autenticación ni el transporte del cliente para sortear esa comprobación. Se conserva el Gateway operativo. Para continuar trabajo autorizado mientras se resuelve OpenClaw pueden emplearse los backends coexistentes ya soportados por el SDK que indique el supervisor.

## Arranque y rendimiento

El supervisor observó arranques fríos de CLI cercanos a 3,5 minutos. Los artefactos `process-metadata.json` existentes registran exit code, límites, tamaños y fin del proceso; no separan duración de carga del CLI, inferencia y cleanup. Esa observación no permite atribuir toda la demora al modelo.

El entorno del adaptador fija `NODE_DISABLE_COMPILE_CACHE=1`. El launcher oficial dispone de una caché de bytecode por versión/build y la desactiva al encontrar esa variable. Es una causa potencial de trabajo repetido, no una mejora medida: no se retiró la protección ni se promete una reducción concreta. Requiere estudiar la custodia de caché y los procesos de mantenimiento antes de modificarla. Tampoco se añadió un proceso persistente ni se dejó un CLI vivo para simular calentamiento.

El fail-fast aplicado elimina el gasto evitable del arranque cuando el transporte seleccionado entra en conflicto con el Gateway. Una próxima medición autorizada debería registrar por separado preflight, arranque, turno y cleanup; conservar valores ausentes como desconocidos y no presentar tiempos de inferencia estimados.

## Rework de la última ejecución real

`RUN-df40231836ed4293af8b468549f00ca0`, en `tmp/runtime-demo/.viltrum/runtime/runs`, produjo resultados con exit code 0 para D21 y D03. D03 rechazó la entrega por dos razones semánticas: atribuyó al modelo la imposibilidad de recalcular los SHA-256 y detectó una afirmación de SwarmClaw no respaldada por las fuentes adjuntas. El rechazo de revisión no es un fallo de conexión ni un error del proceso productor.

El contrato del adaptador ya aclara que el supervisor calcula hashes antes del turno, exige verificarlos después y que el revisor evalúa contenido y referencias sin atribuir el cálculo al modelo. No se realizó una segunda llamada de modelo en esta investigación; la afirmación sin fuente sigue requiriendo retiro o evidencia autorizada en una nueva entrega revisable. No deben alterarse en sitio los resultados cerrados para hacerlos parecer aprobados ni volver a despachar una sesión ambigua. El adaptador rechaza los reintentos cuyo fingerprint cambia: el rework debe usar un run nuevo cuando exista un transporte admisible.

## Evidencia consultada y límites

Fuentes primarias locales del paquete instalado 2026.9.7, bajo `C:/Users/wilbe/tools/node-v24.18.0-win-x64/node_modules/openclaw/`:

| Fuente | Evidencia |
| --- | --- |
| `package.json` | Versión instalada 2026.9.7; desacuerdo con el contrato 2026.9.4 del SDK. |
| `docs/cli/agent.md`, líneas 26–50 y 368–375 | Exec temporal, credenciales originales, selección de config y propiedad exclusiva de local; no replay automático tras pérdida de Gateway. |
| `docs/gateway/gateway-lock.md`, líneas 17–53 | Propietario común para Gateway y embedded; verificación de identidad y recursos antes de liberar; no basta antigüedad del lock. |
| `docs/concepts/oauth.md`, líneas 71–128 | SQLite compartido, read-through sin copia y respeto de `OPENCLAW_STATE_DIR`. |
| `docs/concepts/multi-agent.md`, líneas 9–39 | `agentDir` contiene sesiones y auth; no compartir directorios entre agentes. |
| `dist/register.agent-turn-CcWIhfSW.mjs` | Opciones públicas y transmisión de selectores para agent y exec. |
| `dist/agent-exec-BXynOEeI.mjs`, líneas 49–70, 219–232 y 302 | Proyección del envelope, selección ambiente y scope de autenticación. |
| `dist/agent-exec-input-gcGsO-uR.mjs` | Configuración de exec, pin de cwd y skipBootstrap. |
| `dist/store-vsKwB1ol.mjs`, líneas 1042–1090 | Scope de auth original y read-through en memoria. Sólo código; no se abrió el almacén. |
| `openclaw.mjs` y `node-compile-cache.mjs` | Comportamiento oficial de la caché compilada y sus workers. |
| Artefactos D21/D03 de `RUN-df40231836ed4293af8b468549f00ca0` | Metadatos públicos del proceso y rechazo de revisión conservado. |

Se hizo revisión estática del cambio. No se ejecutaron suites de pruebas, llamadas de modelo, acciones sobre procesos, modificaciones de estado nativo ni lecturas de bases de credenciales o contactos privados. No se afirma que OAuth esté autenticado por observar únicamente sus metadatos de configuración.
