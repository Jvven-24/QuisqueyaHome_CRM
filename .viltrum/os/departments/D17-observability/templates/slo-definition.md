# Definición de SLO — <recorrido crítico>

```
Recorrido crítico:    <ej. completar checkout>
Servicio(s) involucrados: <lista>
Dueño de negocio:      <nombre — firma abajo>
Fecha de definición:   <YYYY-MM-DD>
Ventana de medición:   <ej. 30 días móviles>
```

## SLI — Indicador de nivel de servicio

```
Qué se mide:      <ej. % de peticiones de checkout que responden en <800ms con éxito>
Cómo se mide:      <consulta/fuente exacta — métrica, no percepción>
Excluye:           <mantenimiento planificado, si aplica, con límite de horas/mes>
```

## SLO — Objetivo de nivel de servicio

```
Objetivo:          <ej. 99.9% en ventana de 30 días>
Justificación del número: <por qué este valor y no otro — costo de más nueves vs.
                            impacto de negocio de menos>
```

## Presupuesto de error

| Ventana | SLO | Presupuesto de error | En unidades de negocio |
|---|---|---|---|
| 30 días | 99.9% | 0.1% | ≈ 43 minutos/mes |

## Política de presupuesto agotado

```
Umbral de alerta temprana:   <ej. 50% del presupuesto consumido>
Umbral de freno de releases: <ej. 80% del presupuesto consumido>
Quién decide frenar:          <rol/nombre>
Qué implica frenar:           <solo hotfixes y correcciones de fiabilidad hasta recuperar margen>
```

## Alertas derivadas de este SLO

| Alerta | Umbral | Runbook |
|---|---|---|
| | | |

## Revisión

```
Próxima revisión programada: <fecha>
Criterio de revisión:        <consumo real vs. esperado, cambios en el recorrido>
```

---

**Firma del dueño de negocio:** _______________________  **Fecha:** _______________
