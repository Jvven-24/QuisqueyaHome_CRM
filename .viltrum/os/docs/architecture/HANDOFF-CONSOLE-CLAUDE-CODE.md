# Handoff · consola operativa Viltrum SDK 0.5

Fecha local: 2026-09-30. Continuación del runtime 0.4 y del webhook/OpenClaw.

## Resultado implementado

La consola propia extiende el dashboard existente con navegación, selector de
proyecto, búsqueda/filtros y fichas de departamentos. Proyecta datos reales de las
autoridades existentes; no mantiene un segundo estado de negocio.

Vistas: resumen, ejecuciones/tareas/entregas/revisión, departamentos y skills/tools,
entradas, comunicación y arquitectura. La comunicación corresponde a eventos y
handoffs registrados; no simula chats entre agentes. Modelo configurado, ejecutor
efectivo, disponibilidad global y autorización por proyecto se distinguen.

## Mecanismo

1. Webhook autenticado recibe datos externos, con ID idempotente y proyecto permitido.
2. Cola SQLite serial registra intención antes del efecto y persiste el runId.
3. D00 enruta; LangGraph conserva estado y checksums. Cada departamento recibe su
   contrato, SOP, skill y fuentes seleccionadas, bajo el scope de análisis.
4. Un ejecutor explícito produce evidencia. Otro actor del revisor canónico la revisa.
5. API local publica proyecciones acotadas y redactadas, sin prompts ni credenciales.
6. UI consulta cada 2 segundos y conserva selección/inspector. Capabilities se comprueban
   asincrónicamente cada 15 segundos, sin llamar modelos; llevan fecha y estado.
7. Gates/C1 usan su circuito independiente. Un entregable revisado no aprueba una fase.

Diagrama: [16-consola-operativa.mmd](diagramas/16-consola-operativa.mmd).

## Archivos y responsabilidades

| Archivo | Cambio |
| --- | --- |
| `templates/dashboard.html` | Consola responsive, navegación, filtros, inspector y estados UI |
| `viltrum_sdk/console.py` | Roster canónico; skills/tools/inputs/eventos/arquitectura; proyecciones seguras y preflight asincrónico |
| `viltrum_sdk/cli.py` | API console/projects; allowlist de proyectos; `up`, `services`, `run-rework`, `openclaw-profiles`, selección explícita webhook |
| `viltrum_sdk/services.py` | Arranque oculto, identidad de proceso, health y cierre cooperativo de servicios propios |
| `viltrum_sdk/runtime.py` | Corrección explícita vinculada a un rechazo, preservando el paquete anterior |
| `viltrum_sdk/webhooks.py` | Identidad/health de servicio, cierre administrado y selección de backend con cola libre |
| `viltrum_sdk/openclaw_setup.py` | Restaurar archivos faltantes sin ejecutar el CLI; preservar backend elegido |
| `viltrum_sdk/adapters/openclaw.py` | Diagnóstico de versión instalada y conflicto de estado local/Gateway antes de dispatch |
| `start-viltrum.ps1` | Arranque del panel técnico local y proyecto SDK con el entorno runtime |
| `skills/orquestar`, `skills/viltrum-runtime` | Procedimiento de operación/corrección y límites de la consola |

## Comandos

Desde la raíz de este checkout:

```powershell
.\start-viltrum.ps1
```

Entrada portable del SDK instalado:

```powershell
viltrum up "RUTA_PROYECTO" --include-project "otro=RUTA_OTRO_PROYECTO"
viltrum services status
viltrum services stop
```

Si el ejecutable no está en PATH, usar `py -m viltrum_sdk.cli` o el Python del entorno
que tenga el SDK. `up --dashboard-only` funciona sin receptor; un receptor ausente
no se inventa. El projectId del webhook sigue su allowlist privada independiente.
El selector del panel no habilita recepción de entradas para un proyecto nuevo.

```powershell
py -m viltrum_sdk.cli webhooks backend --backend codex
py -m viltrum_sdk.cli openclaw-profiles
py -m viltrum_sdk.cli run-rework "RUTA_PROYECTO" --run-id "RUN-ID" --backend host --reason "Corrección concreta"
```

Cambiar backend requiere receptor detenido y cola libre; se adquiere su lock. No hay
fallback automático ni selección de backend desde payload externo. `services stop`
espera una cola libre y sólo señala procesos cuya identidad/health está acreditada.
Los servicios no se registran automáticamente para iniciar después de reiniciar Windows.

## API de lectura

| Ruta | Contenido |
| --- | --- |
| `/api/health` | Salud e identidad del dashboard |
| `/api/projects` | Proyectos explícitamente permitidos en esta consola |
| `/api/console?project=ID` | Departamentos, capacidades, entradas, actividad y arquitectura |
| `/api/status?project=ID` | Fases, gates y siguiente acción |
| `/api/runs?project=ID` | Proyecciones públicas de ejecuciones |
| `/api/runs/RUN-ID?project=ID` | Detalle, evidencia/revisión vigentes y eventos |

Por defecto `project=default`; se rechazan proyectos desconocidos y consultas ajenas.
El servidor sólo escucha IPv4 loopback; exige Host permitido y Origin de la misma
consola, usa no-store/CSP y no habilita CORS. El webhook mantiene Bearer propio y
rechazo de Origin. La consola es un panel local del operador, sin URL pública ni
credenciales incorporadas en el navegador.

## Evidencia y corrección del rechazo anterior

El run OpenClaw `RUN-df40231836ed4293af8b468549f00ca0` conserva su rechazo y bloqueo.
La corrección explícita creó `RUN-3eecb4a97af3493192f7ced29716ba20`, backend host,
con `reworkOf`, fuentes anteriores y rechazo como contexto. Se retiró la atribución
de herramientas no sustentada y se separó hashing determinista de análisis semántico.

Productor: `host:codex:root:D21:20260930`. Revisor independiente D03:
`host:codex:runtime_pending:D03:20260930`. D03 volvió a calcular los cuatro hashes y
tamaños del recibo y aprobó la corrección documental. Handoff HND-006; nuevo run
`finished`. No representa una nueva ejecución de OpenClaw ni aprobación G0/C1.

## Estado actual de integraciones y bloqueos

- 23 workspaces de `.clawd/viltrum/workspaces` estaban ausentes; se restauraron sus
  138 archivos de método. Los eval_score permanecen null; esto no entrena pesos.
- El paquete OpenClaw de la ruta existente ahora declara **2026.9.7**, mientras el
  contrato acreditado exige **2026.9.4**. El SDK bloquea el despacho y muestra la causa.
- El Gateway nativo 18789 está activo. Su estado pertenece a otra instancia; no se
  detiene ni se comparte un escritor local sobre ese mismo estado. `agent exec`
  temporal no conserva selector/recibos requeridos y no sustituye silenciosamente el adaptador.
- Se eligió explícitamente `backend=codex` en el receptor para mantener el flujo
  operativo con ChatGPT/Codex existente; el transporte OpenClaw sigue registrado
  y podrá seleccionarse tras validar su versión/política y propiedad del estado.
- Docker Desktop falla al iniciar por su endpoint IPC `dockerInference` inaccesible.
  Se intentó arranque oficial y preservar el endpoint mediante rename acotado;
  Windows rechazó el acceso, sin alterar el archivo. No se reseteó Docker ni volúmenes.
  OpenHands/hybrid figuran no disponibles mientras Agent Server no responda.
- SwarmClaw conserva bundle de integración; no hay instancia conectada acreditada.

Detalle técnico: [runtime-pending-2026-09-30.md](../research/runtime-pending-2026-09-30.md).

## Validación posterior

La evidencia operativa de esta sesión se registra en
`docs/architecture/verificacion-console-2026-09-30.json`. Consultar allí el resultado
final de la entrada nueva `console-functional-20260930-001`, los checks HTTP y el
paquete generado. No inferir éxito de modelo a partir de HTTP 202 ni de health.

Para una migración a OpenClaw 2026.9.7: revisar contrato nativo/modelo/harness,
metadatos terminales, tools, auth read-through, cancelación y ownership; después
hacer una prueba acotada y revisión independiente. Para habilitar construcción de
producto hay que implementar/acreditar executor y gates correspondientes: el scope
actual de ejecución sigue siendo análisis de lectura.


## Ampliación 21st y PXIL

Ver [HANDOFF-PXIL-21ST.md](HANDOFF-PXIL-21ST.md) para la integración de diseño, capturas y revisión con subagentes. La interfaz mantiene APIs reales y la ruta operativa Codex.
