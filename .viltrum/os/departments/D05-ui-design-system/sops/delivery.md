# D05 · Entrega de UI y sistema de diseño

Versión 1 · 2026-09-29 · F3 · revisor D07. Leer `../AGENTS.md`, `../SOUL.md`, el mandato, el sistema visual del proyecto y `../../../core/doctrine/ux-states.md`.

## Entradas

D04 entrega inventario, roles, datos, sitemap, recorridos y wireframes. D02 aporta marca y prioridad; D06 aporta comportamiento de estados; D08 aporta voz y contenido cuando corresponda. Inspeccionar biblioteca y tokens reales antes de diseñar. Si no hay archivo de diseño o acceso, producir especificación local y declarar que no se sincronizó Figma. No convertir un concepto comercial previo a C1 en frontend de producto.

## Procedimiento

1. **Inventario y reutilización.** Comparar componentes existentes, nativos y candidatos de catálogo por comportamiento, licencia, accesibilidad, compatibilidad de stack y mantenimiento. Registrar reutilizar/adaptar/crear. D21 evalúa una dependencia nueva relevante; D12 revisa riesgo de código externo. Un componente visual encontrado en internet no es automáticamente apto para producción.
2. **Fundaciones.** Documentar tokens primitivos, semánticos y de componente; referencias y temas, tipografía, espacio, color, bordes, elevación y movimiento. Mantener una fuente y mapa a nombres usados por código. Registrar versión y migración de tokens eliminados. DTCG sirve de formato de intercambio si el stack lo soporta; no obliga a introducir un compilador de tokens.
3. **Contratos de componente.** Para cada componente definir propósito, variantes utilizadas, API conceptual, contenido, comportamiento, interacción, foco, nombre accesible, datos y estados. Diferenciar deshabilitado y solo lectura; definir tamaños intrínsecos, contenido extenso, iconos y fallback de assets. Un componente nuevo entra al catálogo con ejemplos del producto y decisión de reutilización.
4. **Composición.** Resolver jerarquía y tarea primaria por vista sobre datos representativos. Diseñar juntos los puntos de corte del token 7 (320/390/430/768/1024/1440); además probar condiciones intermedias donde quiebre el contenido. Definir grid, comportamiento de contenedores, wrapping, sticky, overflow, tablas y navegación móvil. Tratar los puntos como evidencia del proyecto, no constantes dispersas en cada componente.
5. **Estados y formularios.** Aplicar matriz D06 con textos reales: carga, vacío, error, sin conexión, éxito y permiso insuficiente, o inaplicabilidad justificada. Definir etiquetas, ayuda, formatos por localidad, catálogos, validación, mensajes y resumen de errores; una máscara no reemplaza validación del servidor ni debe bloquear pegar/autocompletar. Coordinar borradores permitidos con D12 y no guardar secretos.
6. **Prototipo y trazabilidad.** Conectar recorridos críticos e interrupciones, conservar IDs de vista/REQ y estados. Etiquetar datos sintéticos. Registrar decisiones y alternativas descartadas; obtener feedback o aceptación de prototipo de la autoridad de producto según G3. Feedback visual no equivale a aceptación comercial C1.
7. **Verificación y entrega.** Registrar capturas o enlaces por variante, tema y ancho; medir contraste, orden de lectura y foco. Revisar datos largos, zoom, reflow, RTL si aplica, movimiento reducido y contenido vacío/parcial. Especificación sin app ejecutable tiene verificación de diseño; teclado y lector reales quedan pendientes de ejecución D07/D14.

## Dirección visual

Antes de componer vistas, registrar la dirección visual acordada: referencias, atributos observables (jerarquía, densidad, tipografía, color, forma e imagen), contexto de uso y variantes/temas aplicables. Vincular cada decisión con tokens existentes o propuestos y evidencia (archivo, enlace o captura, con fecha/versión); marcar como hipótesis lo que no tenga evidencia. D02 define marca y prioridad: D05 traduce esos insumos a expresión visual, sin redefinirlos.

## Mapeo de diseño a tokens y componentes

Para cada vista o patrón, registrar una fila con elemento/propiedad de diseño, token o componente de destino, estado/variante, evidencia y divergencia, además de los dos campos obligatorios siguientes:

| Elemento/propiedad | Token o componente de destino | Estado/variante | Evidencia y divergencia | Estados cubiertos (seis de P6) y verificación | Accesibilidad (contraste, foco, nombre accesible) |
|---|---|---|---|---|---|
| [vista/patrón y elemento] | [token/componente] | [estado/variante] | [evidencia o brecha y divergencia] | [CARGA, SIN DATOS, ERROR, SIN CONEXIÓN, ÉXITO, PERMISOS: indicar cada uno verificado/no verificado; N/A requiere razón] | [evidencia de contraste, foco y nombre accesible; si falta, `pendiente D07`] |

Completar ambas columnas en cada fila: indicar para cada estado cuál está verificado y cuál no; cualquier N/A requiere razón escrita. En accesibilidad, citar evidencia para contraste, foco y nombre accesible o marcar `pendiente D07`. Si no existe correspondencia, indicar brecha y propuesta para revisión; no crear un token o componente paralelo sin justificar la fuente única. Registrar divergencias respecto del sistema y su motivo, impacto, responsable de resolver y estado; no presentar una propuesta como aprobada sin evidencia.

El mapeo conserva los límites: D04 es autoridad de recorridos y arquitectura de información; D06 define comportamiento y estados; D07 revisa accesibilidad; D09 implementa. Escalar cambios de recorrido a D04, reglas de negocio a D01/D02 según corresponda, y hallazgos de accesibilidad a D07. D05 especifica y deja trazabilidad; no sustituye esas decisiones ni aprueba su propio trabajo.

## Salidas y handoff

`.viltrum/design/design-system.md`: tokens, temas, tipos, componentes, variantes, estados y mapeo a código. `ui-spec.md`: vista/REQ, contenido, layout responsive y comportamiento. `prototype-review.md`: versión, enlaces, feedback, decisión y límites. `.viltrum/departments/D05-ui-design-system.md` indexa evidencia, reutilización, preguntas y siguiente acción.

Entregar a **D07** para revisión independiente; **D09** recibe especificación de implementación tras los gates aplicables. **D06** valida comportamiento y **D08** contenido. Una corrección que cambia navegación vuelve a D04; una regla nueva vuelve a D01/D02.

## Checklist de aceptación

- [ ] Tokens, temas y referencias tienen fuente única y correspondencia con nombres del stack.
- [ ] Componentes usados tienen variantes, interacción, estados y contenido real especificados.
- [ ] Cada vista enlaza REQ, recorrido, matriz de estados y evidencia de los anchos del gate.
- [ ] Formularios cumplen presupuesto local y toleran pegar, autocompletar, formatos locales y errores sin pérdida indebida de datos.
- [ ] Contraste, foco y reflow se midieron o figuran como no verificados; el prototipo no prueba semántica de HTML.
- [ ] Reutilización documentada; candidato externo tiene procedencia/licencia y decisión de adopción pendiente o aprobada.
- [ ] Prototipo tiene decisión de producto registrada y revisión D07; D05 no cierra su propio gate.

## Herramientas y especialistas

Figma/MCP necesita conexión y permiso al archivo; consulta/edición depende de herramientas disponibles. Con archivos locales se puede entregar tokens y prototipo documentado. Un CLI de catálogo necesita estar instalado y contar con red/acceso; no se presume disponible. Playwright requiere runtime y navegador; sirve para capturas cuando ya existe una UI renderizable. No instalar dependencias ni publicar temas como efecto de leer esta skill.

Delegar `ui-responsive-review` para capturas y hallazgos por grupos de vistas; recibe URLs/fixtures, anchos y versión, y entrega evidencia comparable. Delegar `component-reuse-review` para muchos candidatos con licencia y compatibilidad. D05 decide la composición; D07 conserva la revisión. Tipografía multilingüe, visualización compleja, 3D o interfaces médicas requieren especialista; no elegir librería por apariencia. Las dependencias y credenciales faltantes quedan en el informe con alternativa local.

## Fuentes oficiales consultadas el 2026-09-29

- [DTCG · Design Tokens Format 2025.10](https://www.designtokens.org/tr/2025.10/format/) · especificación de community group; no declararla Recommendation W3C.
- [Figma · MCP server](https://developers.figma.com/docs/figma-mcp-server/) para contexto de diseño sujeto a acceso.
- [Playwright · Emulation](https://playwright.dev/docs/emulation) para viewport y preferencias.
- [W3C · WCAG 2.2](https://www.w3.org/TR/WCAG22/) para los criterios de contraste y operación.
