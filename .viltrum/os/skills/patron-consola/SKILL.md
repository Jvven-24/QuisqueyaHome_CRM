---
name: patron-consola
description: Úsala al construir o rediseñar consolas de operación, CMS, CRM y back-office; organiza navegación, trabajo denso, flujos y estados sin inventar capacidades de negocio.
---

# Patrón de consola operativa

Diseña la consola alrededor del trabajo frecuente: localizar un elemento, entender su estado, ejecutar el siguiente paso permitido y confirmar el resultado. Adapta el patrón al dominio, permisos y datos reales del producto. Los ejemplos de esta guía son estructurales, no requisitos de negocio.

## Anatomía de pantalla

1. **Shell y navegación:** identidad del producto, sesión/salida y barra lateral agrupada por tareas. Usa grupos con nombres claros y contadores solo si tienen significado, datos autorizados y actualización definida. Marca la ubicación actual y permite contraer u ocultar la barra en pantallas estrechas.
2. **Orientación:** migas semánticas con padres enlazables, título único y contexto relevante (alcance, periodo o ámbito). Evita repetir el título en varias regiones.
3. **Búsqueda global:** campo visible o acceso de teclado a una paleta `Ctrl+K` (incluye `⌘K` en macOS). Explica qué busca; limita resultados a destinos y registros autorizados. No presentes navegación como búsqueda de entidades si no existe esa capacidad.
4. **Héroe de operación:** encabezado breve con propósito, alcance/fecha y una acción primaria. Incluye hasta tres KPI cuando ayuden a elegir qué hacer; cada cifra indica periodo, unidad, denominador o meta y fuente/alcance comprensible.
5. **Radar de atención:** cola priorizada solo con reglas respaldadas. Cada elemento explica motivo y cantidad/estado y lleva al registro concreto que resuelve el trabajo. No sugieras SLA, prioridad, alertas en tiempo real ni acciones no respaldadas.
6. **Tarjetas KPI:** cifras comparables, progreso respecto de una meta válida y etiquetas legibles. Diferencia “sin meta/dato” de cero; aclara periodo y alcance. Evita adornos o gráficos que oculten valores.
7. **Trabajo principal:** tabla densa, lista, calendario o tablero según la tarea. Muestra primero columnas que permitan identificar, comparar y actuar. Conserva filtros, orden, paginación y selección al abrir un detalle cuando el producto lo permita.
8. **Inspector/detalle:** muestra identidad, estado, siguiente acción y relaciones pertinentes. En móvil puede ocupar una vista completa con retorno al contexto previo.
9. **Acciones y feedback:** botones con verbos concretos, estados ocupados y resultado anunciado. La acción primaria es inequívoca; las destructivas o de alto impacto explican qué cambia y permiten cancelar antes de confirmar.

## Secuencia y linealidad de flujos

- Ordena cada tarea en una secuencia visible: **contexto → localizar/seleccionar → revisar requisitos → editar/actuar → confirmar → resultado y siguiente paso**.
- Conserva orientación y contexto al navegar, filtrar, abrir/cerrar un inspector o volver. Usa enlaces/botones reales; una fila interactiva debe poder abrirse con teclado y tener nombre accesible.
- En formularios, agrupa campos por significado y orden de decisión. Como regla de diseño, procura no exceder siete campos por vista o sección; divide solo si reduce carga y mantén valores al cambiar pestañas.
- Haz visibles los requisitos antes de la acción final. Resume el efecto antes de confirmar cambios relevantes. No conviertas una sugerencia visual en una regla comercial.
- Protege borradores: advierte antes de descartar cambios y ofrece seguir editando o descartarlos. Explica si el borrador solo vive durante la sesión; no prometas autosave ni recuperación tras recarga sin soporte confirmado.
- Evita callejones sin salida. Después de guardar, enlaza el elemento creado/actualizado o indica dónde encontrarlo. Si la respuesta de red es incierta, no anuncies éxito ni dupliques una acción al reintentar.

## Densidad, tokens y reglas visuales

- Define una escala pequeña y consistente de espacio, tipografía, superficies, bordes, foco y elevación. Consume tokens del sistema de diseño activo; evita colores, radios y sombras aislados por componente.
- Mantén jerarquía tipográfica legible y contraste suficiente. No uses texto diminuto para “hacer caber” más columnas. Prioriza alineación, etiquetas breves, truncado con acceso al valor completo y filas compactas pero cómodas.
- En escritorio, aprovecha el ancho para tabla e inspector solo cuando ambos sigan legibles. En móvil, reduce columnas a datos esenciales y permite desplazamiento local explícito si una tabla realmente lo necesita; evita overflow horizontal de toda la página.
- Usa color semántico consistente para éxito, advertencia, peligro e información, acompañado por texto o icono con nombre; el color solo no comunica estado.
- Mantén una acción primaria por región/tarea y limita elementos decorativos. Gráficos deben incluir valores o una alternativa textual equivalente.
- Registra tokens y decisiones compartidas en la fuente de diseño del proyecto; no copies estilos del producto de referencia sin revisar legibilidad, contraste y consistencia.

## Seis estados por pantalla y región

Diseña y revisa explícitamente los seis estados siguientes en cada vista y acción relevante:

1. **Carga:** indicador/skeleton estable, texto comprensible y `aria-busy` donde aplique. Bloquea doble envío sin perder los valores.
2. **Vacío:** distingue colección sin datos de búsqueda sin coincidencias; explica la causa conocida y ofrece una acción permitida o limpiar filtros.
3. **Error:** explica qué falló y cómo recuperarse; conserva datos editados, asocia validación al campo y evita ocultar errores asíncronos.
4. **Offline:** comunica que no se pudo contactar al servicio. Conserva el borrador local de la sesión si es seguro; no afirmes sincronización o cola offline inexistente.
5. **Éxito:** confirma el objeto o cambio concreto y su estado persistido, anuncia el feedback a tecnologías de asistencia y ofrece continuidad.
6. **Permiso:** no reveles datos fuera del alcance. Explica una acción deshabilitada cuando ayude; maneja revocación/403 sin filtrar identidades.

Modela además respuestas parciales/conflictos e interrupción cuando existan: indica qué se guardó, relee el estado antes de repetir transiciones inciertas y permite cancelar sin mutaciones inesperadas.

## Responsive: 320 / 390 / 768 / 1440 px

Comprueba los cuatro anchos con contenido realista, nombres largos, zoom y formularios largos. Son puntos de revisión, no breakpoints obligatorios:

| Ancho | Comportamiento a comprobar |
|---|---|
| **320 px** | Prioriza cola/registro y acción; apila KPI; navegación como panel; detalle a pantalla completa; controles sin recorte; sin scroll horizontal del documento. |
| **390 px** | Mantén visible la próxima acción; filtros accesibles en panel; diálogo con scroll y acciones alcanzables; targets táctiles cómodos. |
| **768 px** | Mide el ancho útil real; decide entre navegación overlay, lista/detalle superpuesto o una columna; no fuerces una tabla de escritorio estrecha. |
| **1440 px** | Usa el espacio para comparación, filtros e inspector si son legibles; limita ancho de lectura y evita columnas vacías o paneles sobredimensionados. |

En todos los tamaños, permite wrapping de contenido, foco visible, orden de lectura coherente y zoom/reflow sin pérdida de función. La inspección estática no acredita comportamiento: verifica en navegador y dispositivos/viewport objetivo.

## Accesibilidad WCAG 2.2 nivel AA

Trata WCAG 2.2 AA como criterio de aceptación; verifica criterios aplicables con herramientas automáticas y evaluación manual. La conformidad no se infiere de una librería o captura.

- **Perceptible:** estructura y encabezados semánticos; etiquetas/instrucciones; texto alternativo útil; contraste de texto y componentes; no depender solo del color; subtítulos/transcripciones para medios cuando corresponda.
- **Operable:** toda función por teclado, orden y foco visibles, sin trampas; foco no oculto por barras fijas; saltar bloques repetidos; alternativas a gestos/arrastre; objetivos táctiles con tamaño/espaciado suficiente según 2.5.8.
- **Comprensible:** idioma, nombres consistentes, errores identificados y asociados, instrucciones antes de campos complejos, prevención/revisión para cambios de datos importantes.
- **Robusto:** HTML semántico, nombre/rol/valor accesibles, actualizaciones de estado anunciadas y compatibilidad con lector de pantalla.
- Revisa específicamente foco visible y no oculto, arrastre alternativo, tamaño de objetivo, ayuda consistente, entrada redundante y autenticación accesible introducidos en WCAG 2.2.
- Prueba navegación solo teclado, lector de pantalla al menos en los flujos críticos, ampliación/reflow, contraste y mensajes de error/éxito. Registra lo no verificado como pendiente; no declares conformidad sin evidencia.

Referencia normativa vigente consultada: [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/).

## Elegir componentes de Viltrum Design

Orden de elección (P0, buy-vs-build): (a) componentes propios del proyecto; (b) **shadcn/ui** si el proyecto
tiene `components.json` (primitivas accesibles sobre Radix; se instalan con la CLI oficial `npx shadcn@latest add
<componente>` y se adaptan a los tokens del proyecto; skill `shadcn-ui`); (c) biblioteca privada Viltrum Design;
(d) 21st.dev solo por su CLI oficial (skill `21st-cli-use`); (e) construir, con puntuación registrada.

Biblioteca de referencia: `E:/VILTRUM/VILTRUM DESING/pxil-ecosystem/private-library`. Antes de adoptar un componente:

1. Busca en la biblioteca por función e inspecciona su ficha y fuente auténtica en `components/`; el nombre, preview o `verified: true` no bastan para acreditar calidad.
2. Registra identificador/ruta, procedencia y si el código fuente está presente. Si solo hay metadatos, trátalo como candidato no verificado.
3. Revisa licencia, versión, framework, dependencias, mantenimiento, API, estados, teclado, lector de pantalla y compatibilidad con los targets del producto. Si algo falta, márcalo pendiente y solicita revisión del responsable de diseño/accesibilidad.
4. Compara con primitivas ya disponibles en el proyecto. Prefiere adaptación consistente con tokens y contratos existentes sobre duplicar una dependencia.
5. Valida integración y comportamiento en contexto. No atribuyas código propio a un componente de biblioteca; la biblioteca no sustituye la revisión independiente.

## Checklist de salida verificable

- [ ] Navegación agrupada y contadores explicables; ubicación actual y migas semánticas funcionan.
- [ ] Búsqueda/paleta tiene alcance y permisos definidos; `Ctrl+K`/`⌘K`, Escape y foco se comportan correctamente.
- [ ] KPI muestran periodo, alcance y denominador/meta; radar lleva al objeto y explica su motivo.
- [ ] Tabla/lista conserva tarea, filtros y selección; filas y acciones funcionan con teclado.
- [ ] Formularios siguen orden de tarea, conservan valores entre secciones y protegen el borrador ante salida/error.
- [ ] Carga, vacío, error, offline, éxito y permiso están diseñados y comprobados por región.
- [ ] 320, 390, 768 y 1440 px revisados; sin solapamiento ni scroll global accidental; detalle y filtros utilizables.
- [ ] Teclado, foco, contraste, nombres accesibles, validación/feedback y targets se revisaron según WCAG 2.2 AA.
- [ ] Componentes de biblioteca tienen procedencia/licencia/dependencias/estados revisados o se marcan expresamente no verificados.
- [ ] Evidencias (capturas, pasos, viewport, criterio y resultado) enlazadas; pendientes, supuestos y dueño del siguiente paso declarados.

## Fuente y alcance

Patrón sintetizado de la auditoría UX D04 del CMS Quisqueya Home, revisada por D05/D07. Se generalizaron anatomía, continuidad, estados, responsive, tokens y selección de componentes. Los nombres de pantallas, reglas comerciales, datos, contratos y recomendaciones exclusivos de ese producto no son requisitos para otros sistemas.
