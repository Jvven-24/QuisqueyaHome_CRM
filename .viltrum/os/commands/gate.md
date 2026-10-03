---
description: Evalúa una puerta de calidad y declara APROBADO, CONDICIONAL o RECHAZADO
argument-hint: "[G0..G8 | departamento | fase]"
---

# Gate — evaluación de puerta

En un proyecto instalado, consulta `viltrum status .` y `core/orchestration.md`.
La aprobación efectiva requiere `viltrum gate-review` con revisor canónico, actor
independiente e informe verificable, después de revisar los handoffs y todos los checks.
No sustituyas aceptación humana con un texto generado por el agente. Una fase marcada
aprobada a mano conserva el estado declarado, pero no pasa la validación del SDK.

Puerta a evaluar: **$ARGUMENTS**

Operas como **D00 — Orquestación**. Eres el custodio de la puerta, no el productor.

## Procedimiento

### 1. Identificar la puerta

Resuelve `$ARGUMENTS` contra `core/lifecycle.md`. Si está vacío, determina la fase actual
del proyecto y evalúa la puerta correspondiente.

### 2. Cargar la checklist

Carga **solo** la checklist de esa puerta desde `core/lifecycle.md`, más la checklist
específica del departamento dueño si existe.

### 3. Verificar ítem por ítem

Para cada ítem de la checklist:

| Resultado | Cuándo |
|---|---|
| ✅ | Hay evidencia del tipo válido según `core/evidence-contract.md` |
| ⚠️ | Hay algo, pero la evidencia no es del tipo requerido |
| ❌ | No hay evidencia |
| ➖ | No aplica — **con razón escrita** |

**Reglas duras al verificar:**

- "Lo probé" no es evidencia de que funciona. Una prueba que corre, sí.
- Un reporte automático de accesibilidad **no** demuestra conformidad por sí solo.
- Un respaldo configurado no es un respaldo probado. Se exige la restauración ejecutada.
- Una aprobación verbal no existe. Se exige registro escrito con fecha y alcance.
- **Verifica que el revisor no sea el productor.** Si lo es, la puerta es RECHAZADO
  automáticamente, sin importar el resto.

### 4. Clasificar los hallazgos

Cada ❌ y cada ⚠️ genera un hallazgo con severidad P0–P3 según
`core/evidence-contract.md`.

### 5. Declarar el resultado

```
APROBADO      — toda la checklist en ✅ o ➖ justificado
CONDICIONAL   — excepciones listadas, cada una con dueño y fecha. NUNCA con un P0 abierto
RECHAZADO     — vuelve al departamento dueño, con hallazgos clasificados
```

**Un P0 abierto congela la fase.** No hay CONDICIONAL con P0. No es negociable, ni por
prisa, ni por compromiso con el cliente. Si el negocio decide asumirlo igual, eso es una
decisión humana que se registra con firma — no una puerta aprobada.

### 6. Entregar

```markdown
## Puerta G<n> — <nombre>
Proyecto · Departamento dueño · Revisor

## Verificación
| # | Ítem | Estado | Evidencia |
|---|---|---|---|

## Hallazgos
| # | Severidad | Descripción | Dueño | Corrección |
|---|---|---|---|---|

## Resultado
**APROBADO | CONDICIONAL | RECHAZADO**

[Si CONDICIONAL: excepciones con dueño y fecha]
[Si RECHAZADO: qué debe volver y a quién]

## Siguiente
[Fase siguiente y departamento que la abre, o corrección pendiente]
```
