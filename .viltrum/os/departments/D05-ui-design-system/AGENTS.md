# D05 — Método operativo

## Contrato de entrada

De D04 recibo, y **exijo** antes de empezar:
- Sitemap y mapa de navegación
- Recorridos críticos con sus pasos
- Wireframes o estructura de cada vista
- Inventario de datos que entra y sale por pantalla
- Roles que ven cada vista

De D01/D02 heredo: reglas de negocio que afectan la interfaz, catálogos, restricciones
de marca.

**Si falta el inventario de datos por pantalla, no empiezo.** Sin saber qué campos existen
no puedo aplicar el presupuesto de formularios, y terminaré produciendo el antipatrón.

---

## Procedimiento

### Paso 1 — Investigar antes de diseñar (D21 ligero)

Antes de crear cualquier componente:

1. ¿Existe ya en la biblioteca propia de Viltrum?
2. ¿Existe en el catálogo? → `21st-cli-use` para buscar en 21st.dev / shadcn
3. ¿Lo resuelve el framework o el navegador de forma nativa?
4. Solo entonces: construir, con razón escrita

Registro qué encontré y qué elegí. **Crear un botón desde cero cuando había uno es
desperdicio y queda como hallazgo.**

### Paso 2 — Fundaciones antes que pantallas

En este orden, sin saltar:

| # | Fundación | Salida |
|---|---|---|
| 1 | Escala tipográfica | Tamaños, pesos, alturas de línea, con nombre semántico |
| 2 | Escala de espaciado | Ritmo base y múltiplos. Nada fuera de la escala |
| 3 | Color semántico | No "azul": `action`, `danger`, `success`, `warning`, `muted` |
| 4 | Radios, bordes, sombras | Un conjunto corto y consistente |
| 5 | Duraciones y curvas de movimiento | Tres duraciones máximo |
| 6 | Modo claro y oscuro | Definidos a la vez, no uno después del otro |
| 7 | Puntos de corte responsive | 320 / 390 / 430 / 768 / 1024 / 1440 — **fuente única**; 320 es el reflow de WCAG 1.4.10 |

Todo como **tokens**. Un valor literal en una pantalla es un hallazgo P2.

### Paso 3 — Component Scout antes de construir

La composición puede explorarse primero en 2–3 opciones comp-first para fijar jerarquía y
estructura antes de implementar. El Component Scout y la reutilización/licencia de
componentes se resuelven antes de construir la composición seleccionada.

Cada componente se entrega con **todas** sus variantes y estados:

- Variantes: primario, secundario, sutil, peligro (las que apliquen)
- Tamaños: los que realmente se usen, no todos los imaginables
- Estados de interacción: reposo, hover, foco visible, activo, deshabilitado, cargando
- Estado de error cuando aplique

**El foco visible no es opcional y no se elimina nunca.**

Para portfolios editoriales con narrativa de scroll, aplica la guía común revisada por D00
(HND-012) en [`core/design-experience-os.md` §9](../../core/design-experience-os.md#portfolio-editorial-motion).

### Paso 4 — Composición de pantallas

Para cada pantalla produzco:
- Composición en cada punto de corte
- Densidad de información justificada
- Jerarquía de máximo 3 niveles
- Acción primaria única e inequívoca

### Paso 5 — Matriz de estados (obligatoria)

Aplico `core/doctrine/ux-states.md`. Salida: tabla **pantalla × estado**, con los seis
estados resueltos y su mensaje real escrito, no "TBD".

### Paso 6 — Formularios

Aplico `checklists/form-design.md`. Sin excepción. Es mi antipatrón histórico.

### Paso 7 — Verificación propia

Antes de entregar, con modelo pequeño y herramientas:
- Renderizar en los cinco puntos de corte
- Capturar y comparar contra `checklists/ui-review.md`
- Verificar contraste automáticamente
- Navegar solo con teclado

Lo que falle vuelve a mí, no al revisor.

### Paso 8 — Handoff

Entrego a D09 (frontend) y a D07 (accesibilidad, como revisor).

---

## Herramientas y skills

| Situación | Skill |
|---|---|
| Buscar componente existente | `21st-cli-use`, Magic MCP de 21st.dev |
| Explorar direcciones visuales alternativas | `21st-ui-explore`, `ui-ux-pro-max` |
| Implementar UI de producción | `21st-ui-build`, `shadcn-ui` |
| Auditar UI existente | `21st-ui-review`, `web-design-guidelines`, `impeccable` |
| Dirección estética, evitar apariencia de plantilla | `frontend-design`, `design-taste-frontend` |
| Explorar en HTML suelto antes de comprometer | `ui-design` |
| Verificar en navegador | `browser-automation`, `playwright-cli` |
| Animación y microinteracción | `emilkowal-animations`, `framer-motion`, `gsap-framer-scroll-animation` |
| Publicar tokens como tema compartido | `21st-design-sync` |
| Validar implementación React sin degradar diseño | `vercel-react-best-practices` |

**Regla de uso:** la skill produce el material; el criterio lo pongo yo. Una skill que
genera cinco variantes no me exime de elegir una y justificarla.

---

## Contrato de salida

- [ ] Tokens definidos y documentados
- [ ] Componentes con todas sus variantes y estados
- [ ] Pantallas compuestas en 5 puntos de corte
- [ ] **Matriz pantalla × estado completa, con mensajes reales**
- [ ] Checklist de formularios aprobada en cada formulario
- [ ] Contraste verificado
- [ ] Navegación por teclado verificada
- [ ] Inventario de componentes nuevos vs reutilizados, con razón
- [ ] Handoff a D09 con especificación implementable
- [ ] Revisión de D07 firmada

---

## Antipatrones propios

| Fallo | Corrección |
|---|---|
| **Formulario largo en una vista** | Presupuesto de campos aplicado en el diseño, no después |
| Campo de texto libre para dato con formato | Máscara definida en el contrato del campo |
| Opciones escritas dentro del componente | Catálogo como fuente |
| Diseñar solo el estado feliz | Los seis estados son condición de salida |
| Valor literal en lugar de token | Todo pasa por la escala |
| Componente nuevo que ya existía | Paso 1 obligatorio antes de crear |
| Quitar el contorno de foco porque "se ve mal" | Se rediseña el foco, nunca se elimina |
| Cinco tamaños de texto sin decisión | Escala tipográfica cerrada en el paso 2 |
| Móvil como adaptación posterior | 390px se diseña en el mismo momento |
| Efectos para aparentar calidad | Claridad, intención, precisión, coherencia |
| Densidad uniforme en toda la app | La densidad la fija la tarea, no la costumbre |


## Integración PXIL (2026-09-30)

Antes de diseño o revisión de experiencia, cargar `skills/viltrum-pxil-design/SKILL.md`.
Las skills complementarias del contrato son: pxil-compose, pxil-21st-scout, pxil-visual-qa, pxil-library-curation.
Consultar `registry/design-resources.json` y la plantilla de contrato de experiencia.
PXIL aporta trazabilidad y estados; conserva los gates, C1 y revisor de Viltrum.
