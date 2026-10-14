# Presupuesto de contexto y tokens

> Gastar tokens en contexto irrelevante no es un costo fijo: es un defecto de proceso.

## El paquete de contexto por perfil

Un departamento arranca con **cinco piezas** y nada más:

| # | Pieza | Tamaño objetivo |
|---|---|---|
| 1 | `CLAUDE.md` raíz — doctrina | ~6 KB (hoy ~11 KB), estable, cacheable |
| 2 | `SOUL.md` + núcleo `AGENTS.md` del departamento (referencias aparte) | ~6 KB |
| 3 | Checklist activa de la fase | ~2 KB |
| 4 | Paquete de handoff del departamento anterior | variable, resumido |
| 5 | `.viltrum/status.md` del proyecto (resumen) | ≤ 1,5 KB |

**Nunca** entra: el historial de la conversación anterior completo, documentos de otros
departamentos, transcripciones sin procesar, ni el árbol completo del repositorio.

## Reglas de ahorro

1. **Resumen primero, detalle bajo demanda.** Todo documento largo tiene un resumen
   ejecutivo de 3 a 5 líneas al inicio. El agente lee el resumen y solo baja al detalle
   de la sección que necesita.

2. **Prefijos estables al frente.** Lo que no cambia (doctrina, SOUL, checklists) va
   primero y textual, para que el caché lo reutilice. Lo variable va después.

3. **Separar transcripción de decisión.** Las reuniones se procesan una vez: la
   transcripción se archiva, las decisiones se extraen a un documento corto. Ningún
   agente lee transcripciones crudas.

4. **Un archivo, un propósito.** Documentos que mezclan requisitos, diseño y notas
   obligan a cargar todo para usar una parte.

5. **Delegar lo mecánico.** Búsqueda amplia, conteo, formato, verificación de listas:
   subagente con modelo pequeño. El resultado vuelve resumido, no el material crudo.

6. **Cerrar el contexto al cambiar de fase.** El handoff es un documento nuevo y corto,
   no el arrastre de todo lo anterior.

## Asignación de modelo

| Naturaleza de la tarea | Nivel | Por qué |
|---|---|---|
| Decisión arquitectónica, riesgo, ambigüedad, diseño de datos | `large` | El costo de equivocarse supera el costo del token |
| Producción especializada con criterio | `medium` | Equilibrio para la mayoría del trabajo |
| Mecánico, volumen, formato, verificación, búsqueda | `small` | El resultado es verificable objetivamente |

El nivel, el esfuerzo y la condición de subida de cada perfil están en
`registry/models.json`; el host traduce el nivel a su modelo (en Claude Code:
`opus`/`sonnet`/`haiku`). Los perfiles no nombran proveedores.

Bajar de nivel dentro del propio ámbito: libre.
Subir de nivel: requiere la condición `escalate.when` del perfil, registrada.

## Cuándo usar subagentes

**Sí:**
- Búsqueda amplia cuyo resultado es una conclusión corta
- Trabajo paralelo e independiente entre departamentos
- Verificación por un revisor que debe ser independiente del productor
- Procesar un volumen grande de material del que solo interesa el resumen

**No:**
- Tareas que ya tienes el contexto para hacer directamente
- Cadenas donde cada paso necesita el resultado completo del anterior
- Trabajo que requiere la doctrina completa para decidir bien

Cada subagente arranca en frío: pagar por re-derivar contexto que ya tienes es
exactamente el desperdicio que esta doctrina evita.

## Reglas de forma (2026-10-05)

- **Una sola doctrina por sesión.** En el repositorio del OS la doctrina es `CLAUDE.md` de la
  raíz; en un proyecto instalado, `.viltrum/os/CLAUDE.md`. Nunca ambas.
- **`status.md` es un resumen ≤ 1,5 KB.** Cada sesión añade como máximo 5 líneas; lo anterior
  pasa a `status-history.md`, que no se carga por defecto.
- **Perfil = núcleo + referencias.** `AGENTS.md` conserva contrato de entrada y salida, reglas
  que aplican siempre y checklist de salida. Lo que solo aplica a un proveedor, stack o caso va
  a `departments/<Dxx>/references/*.md`, con una línea en el núcleo que diga **cuándo** cargarlo.
  Se mueve sin reescribir; la evaluación del perfil se repite antes y después.
- **Código: consulta antes que lectura.** `viltrum repo-pack`/`repo-context` antes de abrir
  archivos completos; nunca el árbol entero.

## Línea base medida (bytes, 2026-10-05; tokens pendientes de medir con el proveedor)

| Pieza | Antes | Ahora | Meta |
|---|---|---|---|
| Arranque en el repo del OS: `CLAUDE.md` + `AGENTS.md` + `.viltrum/status.md` (+ `.viltrum/os/CLAUDE.md` antes) | 9,8 + 1,9 + 17,0 + 11,2 ≈ 40 KB | 10,9 + 2,0 + 1,3 ≈ 14 KB | ≤ 12 KB |
| `SOUL.md` + `AGENTS.md` por perfil, promedio | 14 KB | 14 KB | ~6 KB |
| D19 (piloto núcleo + referencias) | 28 KB | 19,6 KB | ~10 KB |

La métrica que manda es el **costo por entrega aceptada** (tokens de entrada, salida y caché
más revisiones y reintentos), no los bytes de un archivo. La PoC de memoria contextual
(`experiments/context-memory-poc/`) midió 33,6 % menos tokens de entrada en corrida
sintética; no se adopta hasta completar su evaluación.

## Criterio de terminado

Un agente nuevo puede empezar a trabajar con **tres archivos y dos enlaces**, sin releer
el historial y sin recibir material irrelevante a su rol.

Si no puede, el problema es la organización del contexto, no el tamaño de la ventana.
