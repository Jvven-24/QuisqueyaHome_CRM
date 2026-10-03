---
description: Clasifica una petición de trabajo y activa los departamentos correspondientes
argument-hint: "[qué se quiere hacer]"
---

# Intake — entrada al sistema

Petición recibida: **$ARGUMENTS**

Operas como **D00 — Orquestación**. Carga `departments/D00-orchestrator/SOUL.md` y
`AGENTS.md` antes de continuar.

## Procedimiento

### 1. Clasificar

Aplica `core/routing.md` paso 1. Produce, explícitamente:

```
INTENCIÓN: <de la tabla de routing>
TIPO:      <tipo de solución>
RIESGO:    R<n> — porque <razón en una línea>
FASE:      F<n>
```

**Si no puedes determinar el riesgo, pregunta.** Las preguntas que lo determinan:
- ¿Maneja datos personales? ¿Cuáles?
- ¿Hay dinero de por medio?
- ¿Hay acciones irreversibles?
- ¿Hay obligación legal o regulatoria?

Clasificar el riesgo por debajo de lo real es la causa más barata de un P0.

### 2. Inventariar lo existente

Antes de activar nada, averigua qué ya hay:
- Repositorio, documentos, tarjetas de Trello, diseño en Figma
- Gates ya cerrados y con qué evidencia
- P0/P1 heredados y abiertos

**No mandes a rehacer trabajo que ya tiene evidencia válida.**

Si el inventario es grande, delégalo a un subagente con modelo pequeño y pide solo la
conclusión.

### 3. Activar el paquete

Aplica `core/routing.md` pasos 2 y 3. Para cada departamento:

```
Dxx — <nombre>
  recibe:    <artefactos>
  entrega:   <artefactos>
  revisor:   <Dyy|humano>
  modelo:    <opus|sonnet|haiku>
  autonomía: A<n>
```

Ajusta la profundidad por riesgo con la tabla del paso 3. **No actives 22 departamentos
para un cambio de tres líneas** — y tampoco recortes por prisa sin registrar la excepción.

### 4. Entregar el plan

```markdown
## Clasificación
[el bloque del paso 1]

## Lo que ya existe
[inventario, o "nada previo"]

## Secuencia de departamentos
[la cadena, con gates marcados]

## Primer paso
[uno solo, concreto, con su departamento]

## Decisiones que necesito de ti
[lo que no puedo decidir — o "ninguna"]
```

### 5. Empezar

Si no hay decisiones bloqueantes pendientes, **arranca el primer departamento** con
`/perfil`. No te quedes esperando confirmación de un plan que el usuario ya pidió.

Si hay una decisión bloqueante real (riesgo mal definido, acceso faltante, alcance
ambiguo con consecuencias materialmente distintas), pregúntala — pero avanza en todo lo
que no dependa de esa respuesta.
