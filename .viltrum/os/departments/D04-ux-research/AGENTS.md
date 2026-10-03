# D04 — Método operativo

## Contrato de entrada

De D01/D02 exijo antes de empezar:
- Objetivo medible del producto o del módulo
- Roles definidos, con qué puede hacer cada uno en términos de negocio
- Reglas de negocio que afectan el flujo (aprobaciones, límites, excepciones)
- Catálogos identificados (estados, categorías, tipos)

De D03 heredo: módulos, límites entre ellos, integraciones externas que implican pantallas
(pagos, firma, mapas).

**Si no hay roles definidos, no diseño matriz pantalla × rol — la invento, y eso es peor
que no tenerla.** Escalo a D01 y lo dejo como pregunta abierta bloqueante.

**Si el objetivo no es medible, no puedo decidir qué recorrido es crítico y cuál es
secundario.** Sin objetivo, todo parece igual de importante y no lo es.

---

## Procedimiento

### 1 — Inventario de pantallas por módulo

Para cada módulo del alcance, listar **todas** las pantallas, no solo las pedidas:

```
MÓDULO: <nombre>
PANTALLA: <nombre>
PROPÓSITO: <qué tarea resuelve, en una frase>
PATRÓN DE VISTA: lista | detalle | formulario | asistente | dashboard | configuración | vacío inicial
ROLES QUE LA VEN: <catálogo de roles>
ENTRA DESDE: <pantalla(s) o punto de entrada>
SALE HACIA: <pantalla(s) siguientes>
DATOS QUE MUESTRA: <alto nivel, D11 detalla el modelo>
ACCIONES DISPONIBLES: <por rol>
```

Salida: tabla completa por módulo. Formato de referencia: `templates/screen-inventory.md`
(si el proyecto no lo tiene todavía, esta tabla lo sustituye sin perder los campos).

**Ninguna pantalla sin propósito en una frase.** Si no se puede resumir en una frase, la
pantalla está mezclando dos tareas y debe dividirse.

### 2 — Matriz pantalla × rol

Tabla: filas = pantallas, columnas = roles, celdas = `ve` / `ve y actúa` / `no ve`.

- [ ] Ningún rol ve una acción que no puede ejecutar — eso se resuelve mostrando
  deshabilitado con razón (contrato con D06), no ocultando en silencio cuando el usuario
  necesita entender por qué no puede
- [ ] Todo rol mencionado en las reglas de negocio aparece en la matriz
- [ ] La matriz se entrega a D07 como insumo de "permiso insuficiente"

### 3 — Sitemap y navegación

- Jerarquía de navegación: máximo 3 niveles de profundidad antes de una pantalla de tarea
- Navegación primaria (siempre visible) vs. contextual (aparece según la tarea)
- Breadcrumb o equivalente en cualquier jerarquía de más de 2 niveles
- Búsqueda global si el inventario supera ~15 pantallas o el volumen de datos lo justifica
- **Ninguna pantalla huérfana:** toda pantalla del inventario tiene entrada y salida en el sitemap

### 4 — Recorridos críticos

Para cada recorrido que cumple el objetivo medible (no todos los recorridos posibles):

```
RECORRIDO: <nombre orientado a la tarea del usuario, no a la pantalla>
ROL: <quién lo ejecuta>
DISPARADOR: <qué lo inicia>
CAMINO FELIZ: paso a paso, pantalla por pantalla
CAMINOS ALTERNOS: <decisiones intermedias — ej. "si no tiene método de pago guardado">
CAMINOS DE ERROR: <qué puede fallar en cada paso y qué ve el usuario>
CRITERIO DE ÉXITO: <cómo se sabe que el recorrido se completó>
```

Formato de referencia: `templates/user-flow.md` (mismo criterio que el punto 1 si el
proyecto no lo tiene todavía).

**El camino de error se diseña en el mismo documento que el camino feliz, no después.**

### 5 — Patrones por tipo de vista

| Patrón | Decisiones obligatorias |
|---|---|
| **Lista** | Columnas visibles por defecto, orden inicial, filtros, búsqueda, paginación o scroll infinito, acción masiva si aplica, densidad |
| **Detalle** | Qué se ve de un vistazo vs. qué requiere expandir, acciones primarias vs. secundarias, relación con otras entidades |
| **Formulario** | Presupuesto de campos (≤ 7 por vista), agrupación semántica, pasos si excede el presupuesto — ver `core/doctrine/ux-states.md` |
| **Asistente / wizard** | Número de pasos, si se puede saltar o reordenar, guardado parcial, resumen antes de confirmar |
| **Dashboard** | Qué métrica responde a qué decisión (nunca una métrica sin acción asociada), densidad por rol, tiempo real vs. actualización manual |
| **Configuración** | Agrupación por impacto (afecta a todos vs. afecta solo a mí), quién puede cambiar qué, confirmación en cambios irreversibles |
| **Vacío inicial** | Qué es esta pantalla, por qué está vacía, cuál es la primera acción — nunca "no hay datos" a secas |

### 6 — Búsqueda, filtros y densidad

- [ ] Todo listado de más de ~20 registros tiene búsqueda o filtro
- [ ] Los filtros aplicados persisten al navegar y volver
- [ ] La densidad de información la fija la frecuencia de la tarea: uso diario intensivo →
  densa; uso ocasional → espaciada. Nunca la costumbre del diseñador

### 7 — Onboarding

- [ ] Primera sesión distinta de las siguientes: qué necesita saber antes de poder actuar
- [ ] Estado vacío inicial explica el propósito y ofrece la primera acción, no un tutorial
  que bloquea la pantalla
- [ ] El onboarding se puede saltar y se puede retomar

### 8 — Heurísticas de Nielsen (aplicadas, no citadas)

Verificación por recorrido crítico contra las 10 heurísticas de usabilidad de Nielsen
Norman Group:

1. Visibilidad del estado del sistema — el usuario sabe dónde está y qué está pasando
2. Correspondencia entre el sistema y el mundo real — lenguaje del usuario, no del sistema
3. Control y libertad del usuario — salida clara de cualquier estado, deshacer donde aplique
4. Consistencia y estándares — mismo patrón para la misma acción en toda la app
5. Prevención de errores — antes de mensajes de error, evitar que el error ocurra
6. Reconocer antes que recordar — opciones visibles, no depender de la memoria del usuario
7. Flexibilidad y eficiencia de uso — atajos para el usuario frecuente sin estorbar al nuevo
8. Diseño estético y minimalista — nada compite con la tarea principal
9. Ayudar a reconocer, diagnosticar y recuperarse de errores — mensaje humano + salida
10. Ayuda y documentación — disponible en contexto, no solo en un manual aparte

Cada violación encontrada se registra como hallazgo antes de pasar a D05, no se corrige
en silencio sin dejar rastro.

### 9 — Presupuesto de formularios (aplicado en el diseño)

Aplico `core/doctrine/ux-states.md` — sección "Presupuesto de formularios" — sobre cada
formulario del inventario:
- [ ] ≤ 7 campos por vista o segmentado en pasos/pestañas
- [ ] Agrupación por significado, no por tipo de dato
- [ ] Orden de campos según la tarea, no según la tabla de base de datos

Esto se decide **aquí**, no se corrige después en D05. Es el antipatrón histórico del
equipo y la razón por la que este paso existe con nombre propio.

### 10 — Verificación propia

Antes de entregar:
- [ ] Toda pantalla del inventario aparece en el sitemap
- [ ] Todo recorrido crítico tiene camino feliz, alterno y de error
- [ ] Toda pantalla tiene patrón de vista asignado
- [ ] Matriz pantalla × rol sin celdas vacías sin explicar
- [ ] Ningún formulario del inventario excede el presupuesto sin segmentar

### 11 — Handoff

Entrego a D05 (construcción visual y revisor según registry) y a D07 (consultor que
verifica que la estructura no cree barreras de acceso desde el origen).

---

## Herramientas y skills

| Situación | Skill |
|---|---|
| Diagramar sitemap y recorridos | `artifact-diagramming` |
| Explorar patrones de vista alternativos antes de comprometer | `ui-design`, `ui-ux-pro-max` |
| Aplicar heurísticas y estándares web actuales | `web-design-guidelines` |
| Explorar direcciones de navegación con inspiración real | `21st-ui-explore`, Magic MCP de 21st.dev |
| Mapear un sitio o app de referencia (propio o competencia) | `browser-automation`, `playwright-explore-website` |

**Regla de uso:** la skill produce el material de exploración; el criterio de qué recorrido
es correcto lo pongo yo, con el objetivo medible como referencia — no la variante más
vistosa.

---

## Contrato de salida

- [ ] Inventario de pantallas completo por módulo, con patrón de vista asignado
- [ ] Matriz pantalla × rol sin celdas ambiguas
- [ ] Sitemap sin pantallas huérfanas
- [ ] Recorridos críticos con camino feliz, alterno y de error
- [ ] Formularios del inventario segmentados según presupuesto, antes de D05
- [ ] Heurísticas de Nielsen aplicadas y hallazgos registrados por recorrido
- [ ] Preguntas abiertas de reglas de negocio escaladas a D01/D02, no supuestas
- [ ] Handoff a D05 con especificación que no requiere adivinar estructura
- [ ] Revisión de D05 firmada

---

## Antipatrones propios

| Fallo | Corrección |
|---|---|
| Diseñar la pantalla pedida sin inventariar el módulo completo | Paso 1 obligatorio: inventario del módulo, no de la pantalla suelta |
| Formulario largo en una sola vista | Presupuesto aplicado en el paso 9, antes de que exista un campo dibujado |
| Camino de error diseñado después del camino feliz | Mismo documento, mismo momento, paso 4 |
| Pantalla sin patrón de vista definido | Paso 5 obligatorio antes de estructurar contenido |
| Matriz de roles inventada sin confirmar con D01/D02 | Se escala como pregunta abierta, nunca se supone |
| Dashboard con métricas sin acción asociada | Cada métrica responde a una decisión, o no entra |
| Navegación con más de 3 niveles antes de una tarea | Se aplana o se reorganiza el sitemap |
| "No hay datos" como estado vacío | Propósito + primera acción, siempre |
| Onboarding que bloquea la pantalla como tutorial obligatorio | Se puede saltar y retomar |
| Heurísticas de Nielsen revisadas al final como checklist decorativa | Se aplican mientras se dibuja el recorrido, no después |


## Integración PXIL (2026-09-30)

Antes de diseño o revisión de experiencia, cargar `skills/viltrum-pxil-design/SKILL.md`.
Las skills complementarias del contrato son: pxil-experience-contract.
Consultar `registry/design-resources.json` y la plantilla de contrato de experiencia.
PXIL aporta trazabilidad y estados; conserva los gates, C1 y revisor de Viltrum.
