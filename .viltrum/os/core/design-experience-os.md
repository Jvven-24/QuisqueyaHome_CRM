# Design & Experience OS — diseño como sistema senior, no como "dibujar pantallas"

> Fuente: documento de Wilber *Viltrum Design & Experience OS · Style 2* (2026-10-06) + auditorías de D04, D05, D06, D07, D08, D09, D14 y D15
> (`.viltrum/evolucion/diseno.json`) + encargo `20261006T194257Z-D00-codex/TAREA.md`. Regla central: **la IA no inventa una interfaz desde cero si existe un patrón probado**:
> requisitos → flujo → patrón → componente → adaptación de marca → estados → responsive → accesibilidad → QA. La calidad sale del proceso, no del modelo.
> No se crean departamentos nuevos: las 13 responsabilidades viven en los existentes. La integración global descrita aquí queda pendiente de revisión independiente de Claude; la guía de portfolios editoriales de §9 tiene aprobación documental específica de D00 en HND-012 y no aprueba las demás secciones.

## 1. Responsabilidades senior → departamento dueño
| Responsabilidad | Dueño | Apoyo | Ya existe en |
|---|---|---|---|
| Dirección de diseño y coherencia | D00 (coordina) · D05 (decide lo visual) | D04 | `skills/viltrum-pxil-design` |
| UX Research (usuarios, competencia, JTBD, journey) | D04 | D21 | `departments/D04-ux-research` |
| Arquitectura de información | D04 | D08 | D04 checklists |
| Producto: flujos, wireframes, estados | D04 + D06 | D05 | `core/doctrine/ux-states.md` |
| Dirección de arte (marca, composición) | D05 | D08 | D05 SOP |
| Design system (tokens, primitives, registry) | D05 | D09 | `registry/design-resources.json`, galería PXIL |
| Responsive / web móvil tipo app | D09 | D05 | `skills/mobile-native-experience` |
| Motion | D09 (implementa) · D05 (intención) | D07 | — (nuevo en checklists de D09) |
| Accesibilidad | D07 | D14 | `skills/viltrum-accessibility`, `skills/pxil-a11y-qa` |
| Landing y conversión | D08 | D04, D05 | D08 auditado: checklist de contenido/conversión, SOP de experimentos y evals de landing |
| QA visual / regresión | D14 | D07 | `skills/pxil-visual-qa` |
| Design-to-code | D09 | D05 | `skills/pxil-compose` |
| Rendimiento percibido | D15 | D09 | `skills/viltrum-performance` |

## 2. Flujo obligatorio y gates de diseño (DG0–DG11)
Hay **14 fases de trabajo de diseño y 12 gates DG0–DG11**; no sustituyen las nueve fases F0–F8 ni sus gates G0–G8 de `core/lifecycle.md`.
Un DG es evidencia dentro del ciclo de vida, no una fase ni una aprobación automática. Los **PXIL-G0..G8 de `registry/design-resources.json` son solo referencia**;
no son equivalentes a los DG, no aprueban gates Viltrum ni C1.

| # | Fase | Salida mínima | Gate | Dueño |
|---|---|---|---|---|
| 1 | Intake | objetivo, audiencia, restricciones, marca, contenido, métricas, plataforma | DG0 Brief | D04 |
| 2 | Research | competidores con URL, patrones, anti-patrones, evidencia (alimenta la **inmersión de dominio**) | DG1 Research | D04 |
| 3 | IA | sitemap, navegación, modelo de contenido, prioridades | DG2 IA (sin callejones sin salida) | D04 |
| 4 | Flujos | camino feliz + alterno + error + vacío + carga + permisos | DG5 Estados (en diseño) | D04 + D06 |
| 5 | Low-fi | jerarquía y tareas sin decoración | — | D04 |
| 6 | Dirección visual | 2–3 direcciones con rationale; tokens, tipografía, espaciado, imágenes | decisión humana si la marca lo exige | D05 |
| 7 | Component Scout | reutilizar antes de crear (§3) | DG3 Sistema | D05 |
| 8 | High-fi | móvil + escritorio, denso/ligero, claro/oscuro si aplica | — | D05 |
| 9 | Prototipo | interacciones críticas, motion, feedback | DG7 Motion | D05 + D09 |
| 10 | Accesibilidad | teclado, foco, etiquetas, contraste, objetivo táctil, reduced motion | DG6 Accesibilidad | D07 |
| 11 | Implementación | código real, responsive, semántica, rendimiento | DG4 Responsive · DG9 Performance UX | D09 + D15 |
| 12 | QA | capturas por punto de corte, pruebas visuales, a11y, matriz de dispositivos | DG8 QA visual | D14 |
| 13 | Revisión | revisor distinto del creador; hallazgos por severidad y decisión firmada | DG10 Revisión independiente | según `registry/departments.yaml` |
| 14 | Entrega de evidencia y gate | manifiesto vigente que enlaza pruebas y revisión; PASS / FIX / HUMAN_DECISION | DG11 Evidencia | productores aportan; D00 custodia, no se autoaprueba |

### DG → gate del ciclo de vida

Los DG se enumeran abajo en orden numérico. Sus insumos pueden prepararse antes; se verifican en el G indicado. Para alcance con UI son evidencia obligatoria,
con `N/A` justificado y revisado si un criterio no aplica. G3 verifica diseño/prototipo; G4 y G5 revalidan la implementación contra esa base.
DG10 acredita una revisión real por actor independiente; DG11 acredita integridad, vigencia y trazabilidad del paquete. Uno no sustituye al otro.

| DG y nombre | Evidencia mínima | G que exige la evidencia |
|---|---|---|
| DG0 Brief | audiencia, objetivo, restricciones, contenido, marca y métricas | G1 Requisitos; base vigente de G3 Diseño |
| DG1 Research | pregunta, método, fuentes, límites y decisiones ligadas a requisitos | G1 Requisitos; elección de patrones en G2 Arquitectura |
| DG2 IA | sitemap, taxonomía, navegación, roles y encontrabilidad | G2 Arquitectura; recorridos del prototipo en G3 Diseño |
| DG3 Sistema | tokens, componentes, scout, procedencia y licencias | G3 Diseño; correspondencia con código en G4 Construcción |
| DG4 Responsive | variantes y capturas en los puntos de corte de D05 | G3 Diseño (prototipo); G4 Construcción y G5 Verificación (código) |
| DG5 Estados | matriz pantalla × estado, transiciones y permisos | G3 Diseño; ejecución de estados en G5 Verificación |
| DG6 Accesibilidad | auditoría de contraste, teclado/foco y demás criterios de §6 | G3 Diseño; comprobación automática y manual en G5 Verificación |
| DG7 Motion | intención, interacción, feedback y alternativa de movimiento reducido | G3 Diseño; implementación verificada en G5 Verificación |
| DG8 QA visual | matriz navegador/dispositivo/estado y capturas/diffs vinculados a build | G5 Verificación |
| DG9 Performance UX | presupuesto por pantalla, estabilidad y medición laboratorio/campo | G4 Construcción (presupuesto e instrumentación); G5 Verificación (medición) |
| DG10 Revisión independiente | actor distinto del productor, hallazgos y decisión con evidencia | G3 Diseño, G4 Construcción y G5 Verificación, sobre la entrega de cada fase |
| DG11 Evidencia | manifiesto de artefactos/build, resultados, hashes vigentes y enlace a DG10 | G3 Diseño, G4 Construcción y G5 Verificación, sobre la entrega de cada fase |

G6 Release conserva la aprobación humana y hereda la evidencia vigente de G5; G7 Estabilidad y G8 Aprendizaje conservan sus requisitos propios.
No se crea una aprobación de G0, C1 o producción a partir de un DG.

## 3. Component Scout (reuse-first)
1. Galería PXIL / registro Viltrum (`registry/design-resources.json`) · 2. registries de shadcn · 3. 21st (catálogo; revisar licencia **por componente**) ·
4. primitives de Radix · 5. adaptar uno existente · 6. crear nuevo solo con rationale escrito. Cada candidato se registra con licencia y procedencia
(`skills/pxil-21st-scout`). Un componente nuevo sin esta búsqueda es hallazgo P2 (P0 de `CLAUDE.md`).

## 4. Web móvil que se siente app (D09)
App shell estable · objetivos táctiles ≥44 px (mínimo WCAG 2.2: 24×24) · inputs ≥16 px en móvil · safe areas con `env(safe-area-inset-*)` · Back y estado
importante en la URL · feedback optimista solo si es seguro, con undo y reintento · menos columnas y divulgación progresiva · PWA solo si aporta · sin
layout shift · nunca depender solo de gestos. Puntos de corte: fuente única en D05 (320/390/430/768/1024/1440); **propuesta** añadir 360 y ultra-wide (≥1920) — decisión humana.

## 5. Landing pages (D08)
Narrativa problema → promesa → prueba → mecanismo → oferta → objeciones → CTA · una promesa dominante en el hero · cada sección responde una pregunta del usuario.
La auditoría D08 exige evidencia social trazable (fuente, permiso de uso y alcance del resultado), nunca inventada; una variante móvil que conserve promesa,
prueba y CTA sin truncar el argumento; y aceptación verificable de la narrativa contra público/tarea. Motion explica, sin scroll-jacking.
Cada versión liga contenido, eventos y medición a su hipótesis. La ficha de experimento declara hipótesis, métrica primaria, guardrails, asignación,
duración/regla de parada y decisión (incluido inconcluso); scroll es diagnóstico, no prueba por sí solo de conversión.
GrowthBook es **PILOT opcional**: licencia mixta (mayoría MIT Expat, enterprise comercial), decisión humana y revisión D12/D19 de eventos/privacidad antes de integrar.
El contrato operativo está en `departments/D08-content-seo/checklists/content-conversion.md` y `sops/delivery.md`; no se presume herramienta instalada ni experimento ejecutado.

## 6. Accesibilidad (D07)
WCAG 2.2 AA como objetivo (incluye *Focus Not Obscured*, *Dragging Movements*, *Target Size* 24×24) · patrones de WAI-ARIA APG por tipo de widget ·
axe-core automatiza solo una parte: siempre hay revisión manual con lector de pantalla y teclado · reduced motion como práctica interna.
Contraste de texto **1.4.3** (4.5:1; texto grande 3:1, con sus excepciones) y contraste no textual **1.4.11** (3:1 para información visual requerida de controles/gráficos,
con sus excepciones); autenticación accesible **3.3.8**: evitar pruebas cognitivas obligatorias salvo las alternativas/mecanismos admitidos y permitir asistencia.
Fuente normativa: [WCAG 2.2](https://www.w3.org/TR/WCAG22/). **Un fallo crítico de accesibilidad bloquea DG6 y el PASS**, aunque la scorecard sea alta;
la evidencia automática sola no cierra la auditoría.

## 7. Evaluación de calidad (D14)
Evidencia visual con formato común: captura + build/commit + viewport + navegador + estado + decisión. Matriz de navegadores/dispositivos por riesgo.
**Scorecard 100 (propuesta, HUMAN_DECISION):** Task success/UX 18 · IA 10 · Interacción/estados 10 · Craft visual 12 · Consistencia del sistema 10 ·
Responsive/móvil 10 · Accesibilidad 10 · Performance UX 7 · Contenido 5 · Motion 3 · Evidencia/QA 5. PASS ≥90 y ningún crítico (accesibilidad, navegación,
datos o acción destructiva bloquean aunque la suma sea alta). Hasta que Wilber la apruebe, es una rúbrica de revisión, no un gate.

## 8. Herramientas (estado al 2026-10-06; licencias verificadas en la fuente cuando dice "sí")
| Herramienta | Licencia | Costo | Recomendación | Dueño | Verificada |
|---|---|---|---|---|---|
| Lucide | ISC | FREE | ADOPT | D05 | sí |
| axe-core | MPL-2.0 (aprobada por Wilber 2026-10-06) | FREE | ADOPT como auditoría automática + revisión manual | D07, D14 | sí (licencia; copia local en PXIL `verification/axe-core`) |
| Lighthouse CI | Apache-2.0 | FREE | ADOPT | D15 | sí |
| Playwright (capturas y comparación visual) | Apache-2.0 (pendiente de verificar) | FREE | PILOT | D14 | no (pendiente) |
| Storybook (+ interaction tests, a11y) | MIT | FREE | PILOT (opcional por proyecto) | D09, D06, D07 | parcial (auditorías discrepan por paquete/acceso) |
| Motion for React | MIT | FREE | PILOT | D09 | parcial (auditorías discrepan por paquete/API) |
| MSW (simular errores y latencia) | MIT | FREE | PILOT | D06, D14 | sí |
| web-vitals (RUM) | Apache-2.0 | FREE | PILOT | D15 | sí |
| shadcn/ui + registries · Radix | MIT | FREE | PILOT | D05 | no (pendiente) |
| 21st CLI/MCP | propietaria; licencia por componente | FREE-TIER | PILOT (ya en uso) | D05 | sí |
| Figma MCP/Dev Mode | propietaria | FREE-TIER | PILOT si el proyecto ya usa Figma | D05 | sí |
| Penpot | MPL-2.0 (aprobada por Wilber 2026-10-06) | FREE | PILOT (canvas opcional; elección Figma/Penpot sigue en §10) | D04, D05 | sí (licencia; acceso no acreditado) |
| Onlook | Apache-2.0 (LICENSE.md local) | FREE-TIER (servicios por verificar) | PILOT (edición visual) | D09, D05 | parcial (repositorio/licencia; runtime no verificado) |
| Chromatic | propietaria | FREE-TIER | WATCH | D14 | sí |
| Grafana k6 | AGPL-3.0 (aprobada por Wilber 2026-10-06, uso local sin modificar) | FREE | ADOPT para pruebas de carga autorizadas | D15 | sí (v2.3.0 instalada con SHA-256 oficial; smoke 3/3, no acredita capacidad) |
| GrowthBook | mixta: MIT Expat / enterprise comercial (núcleo MIT aprobado por Wilber 2026-10-06) | FREE (solo núcleo) | PILOT cuando un proyecto tenga experimentos; enterprise excluido | D08 | sí (auditoría D08; host no verificado) |

**ADOPT es recomendación, no significa instalado ni acceso concedido.** `registry/toolchain.json` se actualiza solo tras piloto con evidencia de integración,
licencia/costo y decisión registrada (`core/doctrine/buy-vs-build.md`). MPL-2.0 requiere revisión humana según `registry/system-map.json`;
ninguna herramienta MPL-2.0 pasa a ADOPT sin esa decisión (axe-core y Penpot ya la tienen: Wilber, 2026-10-06). Open Design está instalado como piloto con autorización de Wilber.

### Creación de diseño (herramienta local)

**Open Design — PILOT como creador local**, [repositorio oficial](https://github.com/nexu-io/open-design), Apache-2.0. El encargo atribuye a Claude
verificación oficial el 2026-10-06: local-first, instalador Windows x64, ejecución desde código con Node 24 + pnpm o Docker; motor nativo `dsh` y motores por MCP
(Claude Code, Codex, Kimi, Antigravity, OpenClaw y más) mediante `od mcp install <agente>`. Usa el contrato de marca `DESIGN.md`, declara 151 sistemas de diseño,
exporta HTML/PDF/PPTX/MP4 y traspasa a React/Next/Vue. **Instalado el 2026-10-06** (0.24.1, autorizado por Wilber, hash oficial verificado). Arranque solo con `integrations/open-design/start-daemon.ps1`:
loopback, motor Codex por PATH, 163 skills (`OD_RESOURCE_ROOT`) y consentimiento de telemetría forzado a `false` (la instalación lo trae en `true`, hallazgo D12).
**Regla D12: solo proyectos ficticios o internos; datos de clientes no, hasta medir conexiones salientes.** Uso sin GUI: `od automation create|run`;
el sandbox de Codex en Windows bloquea loopback, así que el orquestador dispara las rutinas y los perfiles revisan los archivos generados. Corridas en serie (límite de uso de Codex).

Claude Design (Anthropic, propietario; `/design` y `/design-sync` en Claude Code, según su [documentación oficial](https://support.claude.com/en/articles/14604416-get-started-with-claude-design)) es **benchmark**. Onlook es edición visual sobre código;
Penpot es canvas abierto sujeto a decisión de licencia; 21st + biblioteca privada aportan componentes. Rutas, rol y estado verificable viven en
`registry/design-resources.json`, clave `creation`. Disponibilidad de archivos no acredita acceso de ejecución ni integración.

Ciclo de creación, con evidencia por paso:

1. D05 genera `DESIGN.md` del proyecto desde sus tokens; entrega contrato/versionado y restricciones de marca.
2. Open Design, con nuestro agente como motor y ese `DESIGN.md`, produce 2–3 direcciones/prototipos; conserva entradas, motor y salidas.
3. D05 elige con rationale; registra decisión humana si la marca lo exige.
4. Component Scout consulta biblioteca privada → shadcn → 21st → Radix; registra candidatos, procedencia, licencia y descarte (§3).
5. D09 implementa en código; enlaza tokens/receta/componentes y pruebas de estados.
6. Onlook permite ajustes visuales sobre código; registra diff y correspondencia con la dirección elegida.
7. Storybook/Playwright/axe aportan pruebas D14/D07 dentro de su disponibilidad/piloto; revisión independiente → DG10 → paquete DG11 → G correspondiente.

**Bake-off previo a adopción:** Open Design vs Claude Design, las mismas 10 tareas reales, mismo brief, `DESIGN.md`, contenido y restricciones;
aplicar scorecard de §7 como rúbrica, registrar tiempo/costo, estados, responsive, a11y y trazabilidad de cada salida. D14 revisa sin ser creador,
D07 audita accesibilidad y D12 revisa telemetría/datos. Resultados y decisión humana antes de ADOPT; ensayo todavía no ejecutado.

### VILTRUM DESING

El ecosistema **PXIL v2** en `E:/VILTRUM/VILTRUM DESING/` (`AGENTS.md`, `pxil-ecosystem/AI-CONTEXT.md`) es la base de creación;
`registry/design-resources.json` declara `ecosystemRoot` y rutas de Onlook, Storybook, Penpot, XState y biblioteca privada.
Su regla **«cero inventos» con 21st** aplica a todos los perfiles: solo CLI/MCP oficial, con evidencia de invocación y procedencia;
no inventar comandos, endpoints ni disponibilidad. Consultar el contexto PXIL antes de operar; declarar explícitamente todo acceso no verificado.

## 9. "Entrenar" sin fine-tuning (cómo encaja con lo que ya existe)
Gold set de pantallas aprobadas con rationale → galería PXIL · corpus de crítica antes/después → `.viltrum/evidence` + `registry/lessons.json` · memoria de fallos
(overflow, densidad, contraste, móvil, callejones) → `MEMORY.md` de cada departamento con aviso por el bus de lecciones · evals repetibles con capturas →
`viltrum eval-*` · separación creador/revisor → P4 · regla de promoción: un perfil "sube" solo con score sostenido en tareas variadas (pendiente de la campaña de evaluación).

### Portfolio editorial, composición y motion
<a id="portfolio-editorial-motion"></a>

**Estado:** guía operativa aprobada para la fuente canónica por revisión independiente D00,
HND-012 (2026-10-07). Sincronizar el paquete distribuible requiere validar perfiles y
deriva fuente-paquete; las instalaciones se actualizan aparte, con dry-run y sin forzar
conflictos locales.

Esta receta orienta briefs, handoffs y evals; no modifica pesos del modelo ni acredita
fine-tuning, pericia o aprobación de perfil.

- **Composición primero:** presentar 2–3 composiciones comparables con el mismo contenido,
  viewport y dirección visual. Registrar la elección humana como base antes de implementar;
  conservar alternativas y rationale. Hacer Component Scout/reuse y verificar licencias,
  compatibilidad y estados antes de construir la selección.
- **Narrativa de scroll:** especificar capítulos, orden, relación entre scroll y escena,
  orientación/progreso y puntos de entrada/salida. Mantener scroll nativo, anclas y controles
  accesibles; no bloquear rueda, teclado, gesto, ni navegación del navegador. Una secuencia
  visual pasiva no se convierte por sí sola en estado de negocio. Si un retrato conecta dos
  capítulos, definir su marco de salida/llegada y su presentación estática cuando no hay motion.
- **Temas:** si la experiencia necesita claro y oscuro, definir tokens semánticos y contrastes
  para ambos desde la composición, y verificar texto, controles, foco, gráficos e imágenes en
  cada tema. Declarar tema por defecto y comportamiento de preferencia del sistema. Si se
  recuerda una elección entre visitas, registrar la decisión y su responsable; no inferirla.
- **Retrato y recursos visuales:** conservar fuente, autoría/procedencia, autorización, fecha,
  hash y transformaciones permitidas. En imágenes de personas reales no alterar identidad ni
  rasgos sin autorización específica. Las imágenes generadas para explorar composición son
  referencias; no sustituyen recursos aprobados de producción. Separar blur, glow y máscaras
  en capas decorativas cuando sea posible.
- **Motion y accesibilidad:** cada transición declara propósito, trigger, duración/easing,
  propiedades animadas y estado final; priorizar transform/opacity y evitar movimiento continuo
  sin propósito. `prefers-reduced-motion` debe ofrecer versión estática o transiciones mínimas
  conservando contenido y CTA. Verificar teclado/foco, contraste, zoom/reflow y contenido con
  movimiento apagado según WCAG y la matriz del proyecto.
- **Evidencia y revisión:** adjuntar composición elegida, mapa de motion, manifiesto de recursos,
  capturas por viewport/tema/preferencia, build o commit y hallazgos D07/D14. El creador no se
  revisa a sí mismo; cada cambio posterior a esta guía y toda promoción de aprendizaje de perfil
  requieren revisión independiente. Esta aprobación incorpora documentación, no evalúa pericia
  ni promueve perfiles. Registrar evals, nunca declarar que cambió el modelo ni elevar
  `eval_score` por haber añadido instrucciones.

Referencias breves por perfil: D04 aporta secuencia narrativa y elección de estructura cuando
corresponda; D05 dirige composiciones/temas; D06 define estados solo si el scroll añade
comportamiento o navegación; D07 audita accesibilidad; D08 valida claims/contenido; D09
implementa el contrato; D14 verifica evidencia y regresión independiente.

## 10. Decisiones de Wilber (HUMAN_DECISION)
1. Adoptar la scorecard 100 / PASS ≥90 como gate institucional, sus pesos y quién acepta excepciones.
2. Figma o Penpot como canvas (costo, hosting, privacidad, dependencia).
3. Storybook obligatorio u opcional por proyecto; MSW en gates.
4. Puntos de corte: añadir 360 px y ultra-wide a la fuente única de D05.
5. Navegadores/sistemas soportados y combinaciones mínimas de lector de pantalla por riesgo.
6. JTBD y análisis de competencia obligatorios o según riesgo; tratamiento de hallazgos UX críticos como política de gates.
7. Presupuestos de rendimiento más estrictos y RUM (costo, retención, consentimiento).
8. Cuándo exigir 2–3 direcciones visuales; ratificar la dirección de marca de cada proyecto.
9. ~~Licencias de k6, axe-core, Penpot y GrowthBook~~ — **resuelto por Wilber 2026-10-06**: aprobadas las cuatro (k6 uso local sin modificar; GrowthBook solo núcleo MIT).
10. ~~Instalar Open Design~~ — **autorizado e instalado 2026-10-06**; pendiente: decidir adopción tras el bake-off con Claude Design y uso con datos de clientes tras la medición D12.

## 11. Plan
**7 días:** cambios de bajo riesgo por cada departamento (en revisión) · Lucide/Lighthouse CI recomendados ADOPT, axe en PILOT/decisión de licencia · formato común de evidencia visual (D14).
**30 días:** piloto en un proyecto real con Storybook + axe + Playwright screenshots + MSW · Component Scout con registro de licencias · scorecard como rúbrica.
**60 días:** campaña de evaluación de los perfiles de diseño con 10 tareas reales; decidir la scorecard como gate; evaluar Penpot/Onlook según la decisión 2.
