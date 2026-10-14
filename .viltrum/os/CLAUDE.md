# Viltrum Agentic OS — Doctrina operativa

> Este archivo se carga en **toda** sesión del ecosistema. Es el mínimo común denominador
> de conducta técnica. Cada departamento añade su especialidad encima, nunca la contradice.

## Qué es este repositorio

La fuente de verdad ejecutable de los **departamentos agénticos** de Viltrum Tek.
No es documentación sobre cómo trabajar: es el runtime con el que se trabaja.

- `core/` — doctrina, lifecycle, riesgo, evidencia, routing. Lo que nadie puede contradecir.
- `departments/` — un paquete profesional versionado por disciplina (D00–D22).
- `registry/` — índice máquina-legible: qué departamento existe, qué activa, qué cuesta.
- `skills/` — procedimientos ejecutables transversales.
- `commands/` — entradas humanas al sistema (`/orquestar`, `/perfil`, `/intake`, `/gate`, `/handoff`).
- `templates/` — plantillas de artefactos: `mandate`, `research-dossier`, `prd`, `rfc`, `adr`, `test-plan`, `test-closure-report`, `threat-model`, `runbook`, `go-no-go`, `release-notes`, `postmortem`, `outcome-review`, `raci`; contrato y evaluación PXIL (`pxil-experience-contract`, `pxil-component-evaluation`), `design-brief.example.json` y `dashboard.html`.

Entrada global: sigue `skills/orquestar/SKILL.md` y `core/orchestration.md` para
comprender el proyecto, activar los contratos de `departments/*/delivery.json` y
delegar el siguiente entregable. El SDK prepara estado/contexto; el host ejecuta
agentes y herramientas realmente disponibles.

Runtime SDK 0.5: `viltrum run` conecta perfiles a LangGraph con checkpoints SQLite,
entregas y revisión independiente. `codex` ejecuta análisis en sandbox read-only;
`host` pausa hasta recibir entregas reales. Conexiones OpenHands/SwarmClaw/OpenClaw
se acreditan aparte. Consulta `docs/architecture/HANDOFF-RUNTIME-CLAUDE-CODE.md`
y `skills/viltrum-runtime/SKILL.md` antes de operar. Ningún run aprueba gates/C1.
El flujo agéntico autónomo utiliza `viltrum self-audit`, `viltrum sync-monitor`,
`viltrum agent-run` o el módulo Python `viltrum_sdk.agent` para sesiones con telemetría.
Un proyecto ya instalado no recibe cambios de perfiles hasta `viltrum upgrade` (conserva tus ediciones;
empieza con `--dry-run`); `viltrum agents-sync` regenera `.claude/agents` con el modelo, esfuerzo y herramientas
de cada perfil (`registry/models.json`). `viltrum run --mode construction` habilita construcción acotada con C1
vigente, `--backend host` y `.viltrum/verify.json`: sin pruebas en verde no hay handoff. Los puntos que siempre
exigen un humano están en `core/doctrine/human-approvals.md`. `viltrum eval-check|plan|submit|grade|score` mide un
perfil con un evaluador independiente y citas verificadas (`docs/architecture/HANDOFF-EVALS-2026-10-01.md`);
`eval_score: null` significa no medido.

---

## Regla de oro (Wilber, 2026-10-03)

**Cada perfil es meticuloso, modular y cumple solo su función.** Un perfil no hace el trabajo de otro:
produce lo que su contrato (`departments/<Dxx>/delivery.json`) declara, verifica cada afirmación con
evidencia (archivo:línea, comando, captura en los puntos de corte de D05, de 320 a 1440), entrega piezas pequeñas y reemplazables,
y pasa el resto por handoff. Información ordenada de D00 a D22: cada salida dice qué perfil la produjo,
quién la revisa y qué falta. Lo que no está verificado se marca, nunca se presenta como hecho.

## Los 8 principios

### P0 — Todo está creado
Antes de escribir una línea, se investiga qué existe. Open source, SaaS, librería, repo,
componente, patrón. Solo se construye desde cero cuando la evidencia demuestra que
integrar sale peor. La decisión se registra con puntuación, no con intuición.
→ `core/doctrine/buy-vs-build.md`

**Construir sin haber investigado es un hallazgo P2 contra el departamento que lo hizo.**

### P1 — Bajo acoplamiento, contratos estables
Toda pieza reemplazable vive detrás de un contrato propio. La lógica de negocio nunca
conoce al proveedor: no importa el motor de base de datos, el proveedor de correo, el
gateway de pago ni el modelo de IA. Se cambia el adaptador, no el sistema.

Regla práctica: **si cambiar de proveedor obliga a tocar más de un archivo fuera de
`adapters/`, el diseño está mal.**

### P2 — Nada hardcodeado
Ninguna categoría, estado, rol, permiso, tasa, texto visible, umbral, endpoint o clave
vive incrustado en el código. Existe una única fuente por concepto: catálogo en base de
datos, archivo de configuración, enum tipado o tabla de traducción. Un valor que aparece
dos veces ya es un bug esperando.

### P3 — Evidencia sobre opinión
"Funciona en mi máquina" y "se ve bien" no cierran nada. Cierra: una prueba que corre, una
captura, un reporte de herramienta, un PR aprobado, un log. El modelo propone; **el
compilador, la base de datos, los tests, los scanners y la telemetría deciden.**

### P4 — Nadie aprueba su propio trabajo
El que produce no es el que revisa. Cada departamento declara su revisor independiente.
Un hallazgo solo lo cierra quien no lo causó. Las acciones sobre producción requieren
aprobación humana explícita, siempre.

### P5 — Contexto mínimo suficiente
Cada perfil carga solo lo que su rol necesita: su `SOUL.md`, su checklist activa y el
estado del proyecto. Nunca el historial completo. El resumen va primero, el detalle se
carga por sección y bajo demanda. Tarea mecánica → modelo pequeño. Arquitectura → modelo
grande. Gastar tokens en contexto irrelevante es un defecto de proceso, no un costo fijo.
→ `core/doctrine/context-budget.md`

### P6 — Completitud de estados
Ninguna pantalla, módulo o acción se declara terminada sin resolver los seis estados:
**carga · vacío · error · sin conexión · éxito · permiso insuficiente.**
No es una lista de deseos: es condición de salida.
→ `core/doctrine/ux-states.md`

### P7 — Seguridad y datos por diseño
Validación en las tres capas (cliente, servidor, base de datos). Permisos por mínimo
privilegio. Formas normales hasta 3FN salvo desnormalización justificada y documentada.
Auditoría desde el primer día, no como "fase 2". Secretos fuera del repositorio siempre.

---

## Órdenes permanentes del dueño (no se pierden)

Cada orden apunta a lo que la hace cumplir. Una orden sin mecanismo es una brecha, no una nota.

| Orden de Wilber | Se cumple con |
|---|---|
| Extraer siempre la idea y mejorar el prompt con todo lo que implica; sus ejemplos son ejemplos, no límites | `core/doctrine/mandate-layer.md` (paso 2b), `templates/mandate.md` |
| D00 tiene un mapa maestro vivo del sistema completo; cada departamento aporta su parte; Wilber lo lee y lo corrige | `core/system-map.md`, `skills/mapa-maestro`, `viltrum map` |
| Al iniciar un proyecto cada perfil se vuelve experto en ese negocio y declara qué skills/herramientas/conexiones necesita | `core/domain-immersion.md`, `skills/inmersion-de-dominio`, `registry/domain-immersion.json` |
| Entender todo el código rápido y sin gastar tokens; actualizarlo al cerrar cada tarea | `viltrum snapshot` (`.viltrum/snapshot/SNAPSHOT.md`, `delta.json`) |
| Ante "integra X": alcance, etapa y efectos externos determinados solos; cada departamento cierra su parte | `skills/alcance-completo`, `core/routing.md` |
| Formularios y acciones que explican: obligatorio marcado, botón nunca deshabilitado sin motivo, error en su campo | `core/doctrine/ux-states.md` (Contrato R1–R8) |
| Robusto y escalable "como en el mercado"; validación en tres capas con prueba por capa | checklists de D05, D09, D10 y D14 |
| Supabase es el stack insignia | `departments/D11-data/platform-packs/supabase.md` |
| Gastar pocos tokens grandes: pre-gates gratuitos primero, el grande recibe lo filtrado | `registry/free-gates.json`, `tools/free_gates.py` |
| Lo aprendido se persiste y se avisa a los departamentos afectados | `registry/lessons.json`, `tools/check_lessons.py` |
| Se trabaja sobre la fuente, nunca sobre la copia instalada `.viltrum/os` | `tools/check_install_drift.py`, `viltrum upgrade` |
| Diseño senior y creación local: Design & Experience OS; Open Design como creador local (piloto), Claude Design como benchmark, PXIL/VILTRUM DESING como base | `core/design-experience-os.md`, `registry/design-resources.json` |

## Cómo se trabaja aquí

0. **Entender antes de hacer — capa de mandato.** Ninguna petición no trivial se ejecuta
   tal como llega. Se extrae la intención, se verifica el estado real en el código, se
   elige el enfoque y se escribe el mandato que habría redactado un ingeniero con
   experiencia. Se ejecuta ese mandato, no la frase original. La capa escala con la
   tarea: una línea para lo trivial, un archivo `M-nnn.md` para lo sustancial.
   → `core/doctrine/mandate-layer.md` · comando `/mandato`

1. **Clasificar antes de ejecutar.** Todo trabajo entra por el router: tipo de solución,
   riesgo R0–R4, intención (nuevo / cambio / bug / escalamiento). Eso determina qué
   departamentos se activan y con qué profundidad. No se corren 22 departamentos siempre.
   → `core/routing.md`

2. **Un departamento a la vez, con handoff explícito.** Cada uno recibe un contrato de
   entrada y entrega un contrato de salida verificable. Sin paquete de handoff no hay
   avance de fase.

3. **Gate antes de fase.** Una fase no se declara completa por sensación. Tiene puerta con
   evidencia enlazada. → `core/lifecycle.md`

4. **El aprendizaje se persiste.** Un bug recurrente, un incidente o un hallazgo nuevo
   genera una skill, un cambio de SOP, un test o la deprecación de una práctica. Se escribe
   en el `MEMORY.md` del departamento. Si no se escribe, no ocurrió.

5. **Lo aprobado se integra con commit al cierre.** Toda entrega termina en un commit a la rama
   principal cuando, y solo cuando, su revisor independiente la aprobó y la verificación está en
   verde (build, pruebas, verificadores). Nada aprobado queda sin commit; nada sin aprobar entra.
   Los agentes productores no hacen commit: lo hace el orquestador tras la aprobación, con mensaje
   que nombre productor, revisor y evidencia. Así cada ciclo deja el sistema integrado y reversible.

---

## Antipatrones prohibidos

Estos son errores concretos y repetidos. Cometerlos es un hallazgo, no una preferencia.

| Antipatrón | Regla que lo sustituye |
|---|---|
| Formulario largo en una sola vista | Presupuesto de campos por vista; segmentar en pasos/tabs desde el primer diseño |
| Campo de texto libre para dato estructurado | Máscara + validación + catálogo desde el inicio |
| Categorías repetidas en varios archivos | Catálogo único con una sola fuente |
| Validar solo en el cliente | Tres capas: cliente, servidor, restricción en base de datos |
| `id` autoincremental expuesto al usuario | Identificador público separado del interno |
| Lógica de negocio dentro del componente de UI | Capa de dominio independiente de la vista |
| Roles comparados por string suelto | Catálogo de roles y permisos con verificación en servidor |
| Borrado físico sin rastro | Borrado lógico + auditoría, salvo requisito legal contrario |
| "Después le ponemos tests" | Criterio de aceptación con prueba desde el diseño |
| Escalar copiando y pegando el módulo anterior | Extraer el patrón, parametrizarlo, reutilizarlo |
| Catálogo público en 503 o pantalla vacía si cae la base de datos | Fallback a snapshot estático con HTTP 200 y consultas secundarias aisladas; la vitrina pública nunca se bloquea |

---

## Herramientas oficiales

Rutas, versiones y licencias viven en `registry/toolchain.json` y `registry/design-resources.json`;
aquí solo la regla.

- **Diagramas → Archify.** Arquitectura, PRD/RFC/ADR, flujos de datos, secuencias y ciclos
  de vida se entregan como HTML validado con `finalize --quality showcase`. Sin receipt de
  Archify en verde, el diagrama no cuenta como evidencia; Mermaid solo como borrador declarado.
- **Componentes → Galería PXIL privada.** D04, D05, D09 y D10 la consultan
  antes de crear componentes o pantallas desde cero, y evalúan ajuste visual, responsive,
  estados y licencia antes de integrar.
- **Código existente → `viltrum repo-*`** (skill `viltrum-repo-map`: ripgrep + ast, sin índice).
  Inventario, impacto y paquete de contexto antes de tocar código que no escribiste.

---

## Fuentes de verdad

| Dominio | Sistema |
|---|---|
| Doctrina y departamentos | Este repositorio |
| Estado del negocio y ejecución | Trello |
| Conocimiento y expedientes | Drive / Notion / Obsidian |
| Diseño | Figma / galería PXIL (`VILTRUM DESING`) |
| Código, PR, CI | GitHub |
| Aplicación viva | Runtime cloud / VPS |

Cuando dos fuentes se contradicen, gana la de la tabla y se corrige la otra en el acto.

@AGENTS.md
