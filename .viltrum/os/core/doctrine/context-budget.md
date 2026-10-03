# Presupuesto de contexto y tokens

> Gastar tokens en contexto irrelevante no es un costo fijo: es un defecto de proceso.

## El paquete de contexto por perfil

Un departamento arranca con **cinco piezas** y nada más:

| # | Pieza | Tamaño objetivo |
|---|---|---|
| 1 | `CLAUDE.md` raíz — doctrina | ~6 KB, estable, cacheable |
| 2 | `SOUL.md` + `AGENTS.md` del departamento | ~4 KB |
| 3 | Checklist activa de la fase | ~2 KB |
| 4 | Paquete de handoff del departamento anterior | variable, resumido |
| 5 | `current-status.md` del proyecto | ~1 KB |

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

## Criterio de terminado

Un agente nuevo puede empezar a trabajar con **tres archivos y dos enlaces**, sin releer
el historial y sin recibir material irrelevante a su rol.

Si no puede, el problema es la organización del contexto, no el tamaño de la ventana.
