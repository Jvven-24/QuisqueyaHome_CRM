# D00 — Memoria

> Lo que se aprende y no se escribe, se vuelve a pagar.
> Entradas nuevas arriba. Cada una lleva fecha, qué pasó y qué cambió.

## Formato

```
### YYYY-MM-DD — Título corto
**Qué pasó:** hecho observado
**Por qué:** causa real, no síntoma
**Qué cambió:** skill nueva / SOP / checklist / práctica deprecada
**Evidencia:** enlace
```

---

## Lecciones fundacionales

### 2026-09-20 — El sistema existía solo como documentación
**Qué pasó:** Había tres marcos bien pensados (Perfiles IA 00–20, Build System, Agentic OS
V2) repartidos entre Drive, Trello y Notion. Ninguno era ejecutable. El switch de perfiles
dependía de que el humano recordara aplicarlo.

**Por qué:** Se documentó el *qué* y el *por qué* con rigor, pero nunca se construyó el
*runtime*. Un marco que vive en tres sistemas distintos y ninguno ejecutable se erosiona.

**Qué cambió:** Este repositorio pasa a ser la fuente de verdad ejecutable. Trello conserva
el estado del negocio; Drive y Notion el conocimiento; aquí vive la doctrina operativa.

**Evidencia:** `core/`, `registry/departments.yaml`

---

### 2026-09-20 — Los marcos se solapaban en numeración
**Qué pasó:** Coexistían perfiles 00–20, pasos del Build System 00–12 y una ruta de diseño
V00–V10 con gates G0–G8. Tres numeraciones para el mismo trabajo.

**Por qué:** Cada marco nació en un momento distinto resolviendo un problema distinto.

**Qué cambió:** Una sola numeración de departamentos (D00–D22). La ruta V00–V10 pasa a ser
subruta interna de la familia de diseño, no numeración global. Los pasos del Build System
se absorben: el paso 04 (investigación) se eleva a departamento propio, D21.

**Evidencia:** `registry/departments.yaml`, `core/routing.md`

---

## Antipatrones observados en el equipo

### 2026-09-20 — Formulario monolítico como entrega inicial
**Qué pasó:** Patrón repetido: ante la petición de "haz un formulario", la primera entrega
es un formulario largo en una sola vista, sin máscaras y con validación solo de cliente.
La segmentación en pasos o pestañas aparece solo después de que el humano la pide.

**Por qué:** No existía un presupuesto de campos declarado ni un contrato por campo. Sin
regla dura, el criterio por defecto es "poner todos los campos pedidos".

**Qué cambió:** Presupuesto de formularios con regla de ≤7 campos por vista y contrato
obligatorio por campo, como condición de salida del Gate G3. No es recomendación: es check.

**Evidencia:** `core/doctrine/ux-states.md` — sección Presupuesto de formularios

---

### 2026-09-20 — Construir antes de investigar
**Qué pasó:** Patrón de empezar a implementar una capacidad sin verificar qué existe ya.

**Por qué:** El paso de investigación estaba en el Build System pero como recomendación,
sin dueño ni evidencia exigida.

**Qué cambió:** D21 es departamento con puerta propia en G2. Construir sin expediente de
investigación es hallazgo P2 registrable contra el departamento que lo hizo.

**Evidencia:** `core/doctrine/buy-vs-build.md`, `registry/departments.yaml` D21

---

### 2026-09-20 — Primer proyecto auditado: Quisqueya Home
**Qué pasó:** Se auditó el portal de Quisqueya Home con D03, D05, D11 y D12. Nueve
hallazgos, ningún P0. El P1 no fue un defecto técnico sofisticado: el número de WhatsApp
del negocio escrito a mano en cinco archivos.

**Por qué:** El patrón `settings.whatsapp_number || '1809...'` no falla cuando la
configuración está vacía — cae al literal en silencio. Con cinco copias, actualizar el
número dejaba unas pantallas apuntando al nuevo y otras al viejo, sin error visible.
Como toda la conversión del portal termina en WhatsApp, eso son contactos perdidos.

**Qué cambió:** Confirma que el antipatrón más caro no es el más complejo. El check de
"catálogos con fuente única" de D03 debe incluir explícitamente los datos de contacto del
negocio, no solo los enumerados del dominio.

**Lección para el router:** un valor de respaldo que no se anuncia cuando se usa es peor
que un fallo. Si el respaldo importa, debe registrarse cuando se activa.

**Evidencia:** `projects/quisqueya-home/audit-2026-09-20.md`

**Segunda observación — el sistema debe reconocer lo bueno:** el proyecto resultó estar
muy por encima de la media (RLS en 37 tablas, scrypt con comparación en tiempo constante,
CSP completa, 93 restricciones CHECK). Una auditoría que solo lista defectos habría dado
una impresión falsa del estado real y habría desperdiciado esfuerzo en refundar lo que ya
estaba bien. El formato de salida de los departamentos debe conservar la sección de
prácticas a preservar.

## 2026-09-29 — SDK 0.3: runtime durable

LangGraph1.2.12/SQLite3.1.1 conserva un run por thread con locks, interrupciones y hashes.
Host real D21 (/root/investigar_motores) → D03 (/root/skills_agencia) completó
RUN-2803f9e11abd44d4ad655319b4218347 / HND-001, sin aprobar gates/C1.
Codex es adaptador de análisis read-only; OpenHands local fue autorizado y su montaje
se documenta aparte. Actores son declaraciones trazables, no autenticación SSO.
Fuentes: docs/architecture/HANDOFF-RUNTIME-CLAUDE-CODE.md y verificacion-runtime-2026-09-29.md.
23 protocolos no equivalen a 23 perfiles evaluados. Mantener eval_score null.

Codex real también completó D21→D03 en RUN-1ebce7071d324f0dae92f1a0f3b27252/HND-003.
OpenHands local1.50.0 activo con auth/mount read-only verificados, backend compuesto
openhands-codex aporta contexto y Codex produce/revisa. LLM propio OpenHands aún no
configurado. Docker se reactivó usando WSL existente y reanudó contenedores previos;
sin reset ni segundo engine. Consultar expediente final antes de atribuir estado a
otros proyectos o inferir gates/pericia a partir de estos runs.

## 2026-09-29 — SDK 0.4: OpenClaw y webhook local

23 agentes en .clawd/viltrum; webhook autenticado8771, cola SQLite idempotente y
CLI OpenClaw local con OAuth existente/GPT-5.6-sol. RUN-df40231836ed4293af8b468549f00ca0
entregó análisis D21 y revisión D03 en sesiones independientes. D03 rechazó
una afirmación SwarmClaw sin fuente y pidió aclarar integridad; estado blocked,
no gates/C1/eval100%. Supervisor verifica SHA256; el modelo revisa contenido.
Gateway18789 detenido por fallo stdio/MCP; local requiere estado nativo exclusivo.
Evidencia y operación: docs/architecture/HANDOFF-OPENCLAW-WEBHOOK-CLAUDE-CODE.md
y evidencia-openclaw-webhook-2026-09-29.json. No atribuir entrenamiento por registro.


## Consola SDK 0.5 / 2026-09-30

Panel y webhook administrados con `viltrum up`. Ruta activa Codex; RUN-6b70cf74a1964e42af935a6cf1c202de aprobado por actor D03 separado. OpenClaw/OpenHands tienen bloqueos documentados, no conexión acreditada. PXIL aporta 8 skills y contratos a 9 perfiles; 21st se consultó por CLI oficial. Ver HANDOFF-CONSOLE-CLAUDE-CODE.md y HANDOFF-PXIL-21ST.md en docs/architecture.

## SDK 0.6 / 2026-09-30: Ingesta Semántica, Canales Agénticos, GitNexus y Servicios On-Demand

1. **Ingesta de Reuniones y Detección de Faltantes (`viltrum_sdk.intake`):** Parser semántico que clasifica requerimientos en [AFIRMADO], [INFERIDO] y [FALTANTE], computa la completitud de F1 en 4 dimensiones (VPS, Público, Negocio, Legal) y genera cuestionarios de despeje en Markdown con bloqueo estricto en semáforo rojo (<70%).
2. **Slack Local para IAs (`viltrum_sdk.channels`):** Broker SQLite WAL ultraligero (<10 MB RAM) con canales temáticos persistentes (#d00 a #d14) y CLI nativo (`channel-post`, `channel-read`, `channel-list`).
3. **Gestión de Recursos On-Demand (`Manage-ViltrumServices.ps1`):** Perro guardián (*watchdog*) que vigila conexiones TCP activas y apaga servicios automáticamente tras inactividad para evitar consumo innecesario de RAM y CPU.
4. **Integración con GitNexus (`viltrum_sdk.gitnexus`):** Consulta programática al grafo de conocimiento local de 13 repositorios; cálculo instantáneo de radio de daño (*blast radius*) y vista 360° de llamadas sin quemar tokens leyendo archivos masivos.
5. **Experiencia Móvil Nativa en React (`mobile-native-experience`):** Bottom Sheets con resortes, Tab Bars ergonómicas en la zona del pulgar, Pull to Refresh elástico, `100dvh`, safe-area insets y hook de teclado virtual `VisualViewport`.
6. **Generador Jurídico y Financiero (`viltrum_sdk.legal`):** Emisión automatizada de contratos C0, C1, C4 y pagarés notariales con cálculo de amortización y hash criptográfico SHA256 inmutable.
7. **Sincronizador con Viltrum Agent Monitor (`Sync-ViltrumMonitor.ps1`):** Proyección en vivo de agentes, tareas y gates hacia el monitor web local en Next.js (`http://127.0.0.1:4310`).
