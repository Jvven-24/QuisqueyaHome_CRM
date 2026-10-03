# Runbook de reversión (rollback) — <proyecto> / release v<X.Y.Z>

```
Release que se revierte:  v<X.Y.Z>
Tag/commit al que se vuelve: <sha completo anterior estable>
Motivo de la reversión:   <P0/P1 detectado, con enlace a la evidencia>
Decide revertir:          <nombre humano> — <fecha y hora>
```

## 1. Criterio de decisión

Se revierte si ocurre cualquiera de estos (no se espera a "ver si mejora"):

- [ ] Health check en rojo por más de `___` minutos
- [ ] Tasa de error supera el presupuesto declarado
- [ ] Pérdida o corrupción de datos detectada
- [ ] Incidente P0 confirmado por D17

## 2. Punto de no retorno

Declarar explícitamente hasta qué paso del release el rollback es trivial y desde
cuál deja de serlo (por ejemplo: después de la fase `contract` de una migración, ya no
hay vuelta atrás sin restaurar desde respaldo).

```
Rollback trivial hasta:  <paso>
A partir de aquí requiere: <restauración de respaldo / migración inversa manual>
```

## 3. Pasos de reversión de código

1. Identificar la versión estable anterior: `<tag/sha>`
2. Desplegar esa versión con la misma estrategia sin caída (rolling/blue-green)
3. Verificar health check de cada servicio
4. Confirmar que el tráfico vuelve a servirse desde la versión anterior

## 4. Pasos de reversión de esquema (si aplica)

- [ ] Si el release estaba en fase `expand`: revertir es solo dejar de usar la columna/tabla nueva; no requiere borrarla de inmediato
- [ ] Si el release estaba en fase `contract`: la reversión de esquema **no es trivial**; requiere restauración desde respaldo
- [ ] Migración inversa ejecutada y verificada, o restauración desde el último respaldo con fecha `___`

## 5. Verificación post-rollback

- [ ] Health checks en verde con la versión anterior
- [ ] Tasa de error vuelve al valor previo al release
- [ ] Confirmado que no quedó código nuevo escribiendo en el esquema viejo de forma inconsistente
- [ ] Usuarios/clientes afectados identificados, si los hay

## 6. Tiempo medido

```
Hora de decisión:        ___
Hora de tráfico restaurado en versión anterior: ___
Tiempo total de rollback: ___ minutos
```

## 7. Cierre

- [ ] Incidente documentado (handoff a D17 para postmortem si aplica)
- [ ] Causa raíz asignada a un departamento, no cerrada por D16 mismo
- [ ] Runbook de release corregido si el rollback reveló un paso faltante
- [ ] Lección escrita en `MEMORY.md` si el rollback no salió como estaba ensayado
