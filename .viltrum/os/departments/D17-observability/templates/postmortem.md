# Postmortem — <título del incidente>

> Sin culpables. El objetivo es qué le faltó al sistema, no quién se equivocó.

```
Incidente:          INC-<nnn>
Severidad:          SEV<1-4>
Fecha:               <YYYY-MM-DD>
Duración total:      <hh:mm> (desde inicio real hasta cierre verificado)
Coordinador:         <nombre>
Autor del postmortem: <nombre> — publicado dentro de 48h del cierre
```

## Resumen ejecutivo

<3 líneas: qué pasó, a quién afectó, cuál fue el impacto medible.>

## Impacto

| Dimensión | Medición |
|---|---|
| Usuarios/clientes afectados | |
| Recorrido crítico afectado | |
| Duración del impacto real (no solo del incidente) | |
| Costo de negocio (ingresos, confianza, soporte) | |
| Presupuesto de error consumido | |

## Línea de tiempo

| Hora | Evento |
|---|---|
| | Inicio real del problema (si se pudo determinar, puede ser anterior a la detección) |
| | Primera señal detectada (alerta, reporte, monitoreo) |
| | Incidente declarado, severidad asignada |
| | Primera acción de mitigación |
| | Causa identificada |
| | Mitigación aplicada / rollback ejecutado por D16 |
| | Síntoma confirmado como resuelto |
| | Incidente cerrado |

## Causas contribuyentes

> Del sistema, no de una persona. Si una frase aquí nombra a alguien como la causa,
> reformularla: ¿qué le faltó al proceso, la herramienta o la revisión para que ese
> paso humano no dependiera de la memoria de nadie?

1. <causa>
2. <causa>
3. <causa>

## Qué funcionó bien

<Explícito, no solo lo que falló. Ayuda a no desmontar por error lo que sí sirvió.>

## Qué no funcionó

<Detección tardía, alerta ausente, runbook incompleto, comunicación confusa, etc.>

## Acciones de seguimiento

| # | Acción | Tipo (prevención/detección) | Dueño | Fecha | Estado |
|---|---|---|---|---|---|
| 1 | | | | | |
| 2 | | | | | |

## Lecciones para MEMORY.md

<Si hay una lección que debe persistir más allá de este incidente, se escribe también
en el MEMORY.md del departamento responsable — si no se escribe, no ocurrió.>
