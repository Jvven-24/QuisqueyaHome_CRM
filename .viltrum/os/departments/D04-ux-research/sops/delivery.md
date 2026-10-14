# D04 · Entrega de UX research y arquitectura de información

Versión 1 · 2026-09-29 · etapa F3 · revisor D05. D07 participa como consultor de accesibilidad. La revisión de D05 no sustituye G3, custodiado por D00 según `core/lifecycle.md`.

Leer `../AGENTS.md`, `../SOUL.md`, `../../../core/doctrine/ux-states.md` y el mandato vigente. Trabajar únicamente sobre módulos del alcance. Un inventario completo no autoriza agregar funciones al negocio.

## Entradas y control del contexto

- D01/D02: requisitos con identificadores, roles, permisos, prioridades, objetivo y restricciones aprobadas.
- D03: límites de módulo, canales, contratos y restricciones de integración cuando estén disponibles.
- D22: fuentes, entrevistas y hallazgos de soporte con procedencia y fecha; datos sintéticos etiquetados.
- Proyecto existente: rutas, pantallas, componentes y analítica disponible. Confirmar la revisión o versión inspeccionada.

Si faltan roles o reglas necesarias para un recorrido, registrar pregunta con dueño D01/D02 y avanzar solo en recorridos independientes. Una simulación permite ensayar preguntas y prototipos; no demuestra necesidad real ni usabilidad. Conceptos previos a C1 se identifican como propuesta.

## Procedimiento por entregable

1. **Contexto y riesgo de experiencia.** Mapear quién realiza cada tarea, dispositivo, frecuencia, alfabetización digital, conectividad y asistencia requerida. Vincular cada necesidad a una fuente. Separar observación, hipótesis y decisión. Priorizar incertidumbres que cambian alcance o arquitectura.
2. **Plan de investigación.** Por incertidumbre registrar pregunta, método, participantes relevantes, criterio de respuesta suficiente y decisión que desbloquea. Preferir entrevista contextual para proceso actual y prueba de tareas para un prototipo. No imponer una muestra universal ni usar una encuesta pequeña como prueba estadística. El contacto o grabación con personas requiere autorización del proyecto y manejo de datos acordado.
3. **Análisis de evidencia.** Extraer tareas, obstáculos y vocabulario de fuentes entregadas. Cada hallazgo conserva cita o localizador y grupo afectado. Una opinión del cliente no equivale a observación de usuarios. Contradicciones vuelven a D01, sin promediar necesidades incompatibles.
4. **Inventario e información.** Para cada vista o equivalente: ID estable, módulo, tarea, patrón, roles, entradas/salidas, datos, acciones, catálogo usado, prioridad y REQ de origen. Derivar matriz vista × rol y sitemap. Registrar explícitamente vistas descubiertas fuera del alcance para decisión de D02. API, CLI o bot sin pantallas puede usar nodos de interacción equivalentes; no inventar UI web.
5. **Recorridos y estructura.** Describir disparador, precondición, camino principal, alternativas, error, salida, éxito y recuperación. Cubrir enlaces directos, volver/recargar, búsqueda sin resultados, permisos revocados, registro eliminado y tareas interrumpidas. Dividir formularios por significado y presupuesto local de campos; justificar segmentación y guardado parcial.
6. **Wireframes verificables.** Componer jerarquía y acciones sobre datos representativos, incluidos nombres largos, volúmenes altos y traducciones. Evaluar orientación, móvil, teclado y ayudas antes de detalle visual. Una regla comercial ausente bloquea ese paso, no se completa con una elección de UI.
7. **Validación de tareas.** Preparar escenarios neutrales, sin indicar qué botón pulsar. Con usuarios disponibles registrar finalización, errores, ayuda recibida y observaciones; con agentes registrar revisión heurística o simulación. Guardar versión del prototipo y cambios derivados. Dar seguimiento a necesidades no resueltas.

## Evidencia UX y trazabilidad

- Para decisiones de producto, explicitar el JTBD y, cuando aplique, la alternativa o competencia que el usuario utiliza hoy; si no se investigó, marcarlo como pendiente, no como hecho.
- Por cada actividad de investigación o evaluación, registrar método, fechas, participantes o alcance, artefacto/versión y límites (sesgo, muestra, acceso o condiciones). Distinguir investigación con usuarios, revisión heurística y simulación.
- En `ux-research.md` (o el artefacto de evaluación correspondiente), cada hallazgo debe enlazar evidencia localizable → REQ → decisión afectada; registra también la decisión pendiente y su responsable. Referencia el REQ por su ID en el mapa maestro o, si no está allí, por el ID del documento de requisitos. No conviertas una observación en regla de negocio sin validación de D01/D02.

## Salidas y handoff

Guardar en `.viltrum/design/` o el directorio de diseño existente: `ux-research.md` (plan y hallazgos), `screen-inventory.md`, `screen-role-matrix.md`, `sitemap.md`, `user-flows.md` y `wireframes.md` con enlaces al prototipo. El informe `.viltrum/departments/D04-ux-research.md` indexa artefactos, REQ, fuentes, versión, preguntas, limitaciones y estado `propuesto`, `bloqueado` o `listo_para_revision`.

Entregar a **D05** para composición y revisión, a **D06** para comportamiento de estados y a **D07** para barreras estructurales. D09 recibe especificación después del diseño; D01/D02 reciben reglas abiertas y cambios de alcance. El paquete incluye siguiente acción y dueño, no una orden implícita de construir.

## Checklist de aceptación con evidencia

- [ ] Cada vista tiene tarea, requisito, rol y enlaces de entrada/salida; no hay huérfanas sin justificación.
- [ ] Matriz de permisos distingue visibilidad de autorización real en servidor.
- [ ] Recorridos prioritarios incluyen alternativas, errores, interrupción y éxito observable.
- [ ] Hallazgos diferencian investigación real, heurística y simulación; cada uno tiene fuente y decisión relacionada.
- [ ] Wireframes respetan catálogos, campos y alcance; las funciones nuevas tienen decisión D02 pendiente o aprobada.
- [ ] Validación realizada tiene método, muestra o alcance, versión y resultados; lo no ejecutado figura como pendiente.
- [ ] D05 puede componer sin inventar datos, estructura o reglas; revisión independiente registrada.

## Herramientas, dependencias y delegación

Repositorio y archivos bastan para especificar. Para inspeccionar una interfaz se necesita navegador accesible y URL/entorno autorizado; Playwright requiere runtime, paquete y binarios presentes si se elige CLI. Figma/MCP requiere conexión habilitada y acceso al archivo. Mermaid permite diagramar en Markdown sin servidor. Las skills de exploración del manifest se cargan solo si existen en el entorno; su nombre no concede acceso a herramientas.

Delegar `ux-inventory` cuando hay módulos independientes o un sitio grande: entregar alcance, rutas y roles; recibir tabla con localizadores y pantallas fuera del alcance. Delegar `ux-evidence-analysis` con entrevistas numerosas: recibir hallazgos enlazados sin decisiones de negocio. La revisión de agentes no sustituye usuarios ni investigación con necesidades de acceso. Un producto médico, juego, editor complejo o interacción física requiere especialista del dominio y D07 cuando el paradigma exceda patrones ordinarios. D00 limita concurrencia y mantiene un dueño por artefacto.

## Fuentes oficiales consultadas el 2026-09-29

- [GOV.UK · Plan user research](https://www.gov.uk/service-manual/user-research/plan-user-research-for-your-service).
- [GOV.UK · Moderated usability testing](https://www.gov.uk/service-manual/user-research/using-moderated-usability-testing).
- [W3C · ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/) para patrones de interacción, sin sustituir WCAG.
