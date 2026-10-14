# Router — de la intención al departamento

> Todo trabajo entra por aquí. El router es determinista: la misma entrada produce la misma
> activación. Si el router se equivoca, se corrige el router, no se improvisa la sesión.

## Paso 1 — Clasificar la entrada

Tres preguntas, en este orden. Ninguna se salta.

### 1.1 ¿Cuál es la intención?

| Intención | Señal típica | Entrada al pipeline |
|---|---|---|
| `PROYECTO_NUEVO` | "quiero hacer una aplicación de…" | Fase 0 — Intake |
| `MODULO_NUEVO` | "agrégale facturación" | Fase 1 — Requisitos |
| `FUNCION_NUEVA` | "que también permita exportar" | Fase 1 acotada |
| `CAMBIO_UI` | "cambia esta pantalla", "no me gusta cómo se ve" | Fase 3 |
| `BUG` | "esto falla", "da error" | Vía rápida de defecto |
| `ESCALAMIENTO` | "está lento", "ya no aguanta" | Fase 8 → 2 |
| `INTEGRACION` | "conéctalo con WhatsApp" | Fase 2 |
| `RELEASE` | "súbelo a producción" | Fase 6 |
| `INCIDENTE` | "se cayó" | Fase 7 |
| `INVESTIGACION` | "¿qué existe para…?" | D21 directo |
| `CONOCIMIENTO` | "organiza esto", "documenta" | D22 directo |

### 1.2 ¿Qué tipo de solución es?

`landing` · `corporativa` · `e-commerce` · `portal/CMS` · `SaaS` · `CRM/ERP` ·
`marketplace` · `app móvil` · `dashboard` · `automatización` · `integración API` ·
`sistema interno` · `plataforma con pagos` · `tiempo real/IoT` · `solución IA/RAG`

### 1.3 ¿Qué nivel de riesgo tiene?

| Nivel | Definición | Consecuencia |
|---|---|---|
| **R0** | Solo informativo, sin cuenta ni datos | Departamentos mínimos, autonomía alta |
| **R1** | Datos normales, sin identidad personal sensible | Assurance ligero |
| **R2** | Autenticación, roles o reglas de negocio reales | D12 obligatorio, revisión cruzada |
| **R3** | Pagos, datos personales o acciones irreversibles | D12 + D11 obligatorios, gate humano |
| **R4** | Regulado, legal o alto impacto | Todo lo anterior + aprobación humana por fase |

**El riesgo lo fija el dato y la acción, no el tamaño del proyecto.** Una landing con
formulario de contacto que guarda cédulas es R3, no R0.

---

## Paso 2 — Activar el paquete

Se activan departamentos, no personas. D00 siempre está presente y no produce.

### PROYECTO_NUEVO
```
D00 → D01 → D02 → D21 (viabilidad) → D03 (estimación) → propuesta → C1 humano
    → D03 (diseño técnico) → D04 → D05 → D06 → D07 → D08
    → D11 → D10 → D09 → D13 → D14 → D12 → D15 → D16 → D17 → D20
```
Con gates entre fases. No se salta D21: antes de construir se investiga qué existe.
Hasta C1, D03 produce estimaciones y opciones reversibles; D09/D10/D11/D16 esperan
la aceptación comercial registrada en `.viltrum/commercial.md`.

**Modo trío (antes de C1).** En `PROYECTO_NUEVO`, `MODULO_NUEVO` y `FUNCION_NUEVA`, durante F1–F2 y mientras
C1 no esté vigente, producto (D01/D02), factibilidad (D21/D03) y experiencia (D04/D05) trabajan juntos en
lugar de en cascada. El router los activa en el mismo run (`collaboration.trio` en
`registry/orchestration.json`); cada uno recibe como contexto las entregas ya aprobadas de sus pares
(`peerArtifacts`) y D03 va al final para integrarlas, con revisión humana. Los revisores no cambian (P4)
y el trío no abre C1: la aceptación comercial sigue siendo humana.

### MODULO_NUEVO / FUNCION_NUEVA
```
D00 → D01 (acotado) → D02 (¿entra en alcance?) → D21 (¿ya existe?)
    → D03 (¿rompe contratos?) → [diseño si toca UI] → [implementación]
    → D14 → [D12 si R2+] → D20
```
**Regla:** una función nueva que no pasa por D03 es deuda técnica desde el día uno.
Si el módulo o función toca UI, aplica `core/design-experience-os.md` (flujo y DG): los DG aportan evidencia al gate del ciclo de vida correspondiente,
con revisión independiente; no sustituyen C1 ni aceptaciones humanas.

**Alcance completo antes de D02/D03.** Toda petición que nombre una funcionalidad ("integra X", "agrega asesores", "haz un botón de
registrarse") ejecuta primero la skill `alcance-completo`: arquetipo, estado real, referencias y la **matriz de impacto por
departamento** (etapa vigente, efectos externos, filas D01–D22). D00 usa esa matriz para activar solo los departamentos afectados y
no cierra el módulo hasta que cada fila afectada tenga handoff que la cite, o `N/A` con razón. Lo mismo aplica a `INTEGRACION` y a
un `CAMBIO_UI` que añada comportamiento nuevo (no a un ajuste puramente visual).

### CAMBIO_UI
Aplica `core/design-experience-os.md` (flujo y DG), según el alcance del cambio y con evidencia vigente.
```
D00 → D04 (¿el problema es de flujo o de estética?) → D05 → D06 → D07 → D09 → D14
```
Si D04 concluye que el problema es de arquitectura de información, **no se maquilla**:
se vuelve a Fase 3.

### BUG — vía rápida
```
D00 (clasifica severidad P0-P3)
  → departamento dueño del área (D09/D10/D11/D19)
  → D14 (reproduce y escribe la prueba que faltaba)
  → D12 si el bug tiene implicación de seguridad
  → D22 (registra la lección en MEMORY del departamento culpable)
```
**Todo bug cerrado deja una prueba nueva.** Sin prueba, el bug no está cerrado.

### ESCALAMIENTO
```
D00 → D15 (medir antes de tocar) → D03 (¿dónde está el límite real?)
    → D11 (consultas/índices) → D16 (capacidad) → D17 (qué observar)
```
**Prohibido optimizar sin medición previa.**

### INTEGRACION
```
D00 → D21 (¿oficial, librería o propio?) → D03 (contrato y adaptador)
    → D19 → D12 → D14 → D17
```

### RELEASE
```
D00 → D14 → D07 → D12 → D15 → D16 → D17 → D20 → gate humano
```

### INCIDENTE
```
D17 (detecta) → D00 (severidad) → departamento dueño → D16 (reversión si aplica)
    → D22 (postmortem sin culpables) → nueva prueba o alerta
```

---

## Paso 3 — Ajustar profundidad por riesgo

| | R0 | R1 | R2 | R3 | R4 |
|---|---|---|---|---|---|
| D12 Seguridad | — | ligero | **obligatorio** | **obligatorio** | **obligatorio + externo** |
| D11 Datos | — | ligero | completo | **completo + retención** | **completo + legal** |
| D14 QA | humo | funcional | funcional + E2E | **+ regresión** | **+ aceptación formal** |
| D07 Accesibilidad | automática | automática | **+ manual** | **+ manual** | **+ declaración** |
| Gate humano | no | fase final | fase final | **por fase** | **por fase + acta** |
| Autonomía máxima | A3 | A3 | A2 | A2 | A1 |

---

## Paso 4 — Presupuesto de contexto y modelo

Cada departamento carga **solo**:
1. `CLAUDE.md` raíz (doctrina)
2. Su propio `SOUL.md` + `AGENTS.md`
3. La checklist activa de su fase
4. El paquete de handoff del departamento anterior
5. El estado del proyecto (`current-status.md`)

**Nunca** el historial completo ni los documentos de otros departamentos.

Asignación de modelo por naturaleza de la tarea:

| Naturaleza | Nivel | Departamentos |
|---|---|---|
| Decisión arquitectónica, riesgo, datos, seguridad, ambigüedad | `large` | D01, D03, D10, D11, D12, D18 |
| Producción especializada con criterio | `medium` | D00, D02, D04–D09, D14–D17, D19–D22 |
| Mecánico, volumen, formato, verificación | `small` | D13 y los subagentes mecánicos |

El nivel y el esfuerzo de cada perfil, sus subagentes y cuándo **sube** de nivel
(p. ej. D00 al clasificar R2+ o arbitrar un gate; D16 en migraciones R3/R4) viven en
`registry/models.json`, única fuente. Esa tabla traduce nivel → modelo por host; la
doctrina no nombra proveedores. Un departamento puede **bajar** de nivel para subtareas
mecánicas dentro de su ámbito. Subir requiere la condición `escalate.when` registrada.

---

## Reglas del router

1. **Ningún departamento se activa solo.** Siempre entra por D00 o por handoff.
2. **Ningún departamento se salta por prisa.** Se salta por clasificación de riesgo, y queda escrito.
3. **El productor nunca es el revisor.** El revisor está en `registry/departments.yaml`.
4. **Un P0 abierto congela el avance de fase**, aunque el resto esté completo.
5. **Si el router no sabe clasificar, pregunta.** No adivina el riesgo.
