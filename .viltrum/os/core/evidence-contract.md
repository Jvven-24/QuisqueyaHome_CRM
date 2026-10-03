# Contrato de evidencia

> Lo que no deja rastro verificable, no ocurrió.

## Severidad

| Nivel | Definición | Efecto |
|---|---|---|
| **P0** | Pérdida de datos, acceso indebido, cobro incorrecto, caída total o riesgo legal | Congela la fase. Nada avanza. |
| **P1** | Bloquea un recorrido principal o el lanzamiento | Requiere plan, dueño, fecha y aceptación escrita |
| **P2** | Degrada calidad, conversión, mantenibilidad o experiencia | Entra al backlog priorizado |
| **P3** | Mejora recomendable sin bloqueo | Se registra, no bloquea |

## Estado de un hallazgo

`No evaluado` → `En revisión` → `Con hallazgos` → `Corregido` → `Aprobado con evidencia`

También: `Bloqueado` (falta acceso o dependencia externa) y `Riesgo aceptado`
(con firma de quién lo acepta y por qué).

## Qué cuenta como evidencia

| Tipo de afirmación | Evidencia válida | Evidencia inválida |
|---|---|---|
| "Funciona" | Prueba automatizada que corre en CI | "Lo probé" |
| "Es accesible" | Reporte automático + video de navegación por teclado | Solo el reporte automático |
| "Es rápido" | Medición con presupuesto declarado y comparación | "Se siente rápido" |
| "Es seguro" | Reporte de scanner + revisión de permisos + modelo de amenazas | "No se me ocurre un ataque" |
| "Está respaldado" | Restauración real ejecutada con fecha | Respaldo configurado |
| "El cliente aprobó" | Aprobación escrita con fecha y alcance | Conversación verbal |
| "Ya existe esa librería" | Enlace, licencia, última actualización, alternativas comparadas | Recuerdo |

## Definition of Ready (para entrar a un departamento)

- [ ] Objetivo declarado en una frase
- [ ] Contrato de entrada completo (qué recibe, de quién, en qué estado)
- [ ] Fuentes de verdad identificadas
- [ ] Riesgos abiertos heredados, listados
- [ ] Criterio de resultado esperado, escrito antes de empezar

## Definition of Done (para salir de un departamento)

- [ ] Artefactos obligatorios del departamento, producidos
- [ ] Checklist de su especialidad, completa
- [ ] Hallazgos clasificados por severidad
- [ ] Cero P0 propios abiertos
- [ ] Decisiones registradas (qué se eligió y por qué)
- [ ] Revisor independiente firmó
- [ ] Paquete de handoff listo para el siguiente departamento
- [ ] Lecciones nuevas escritas en `MEMORY.md`

## Formato de salida de todo departamento

```markdown
## Resumen ejecutivo
[3 líneas máximo: qué se hizo, qué se encontró, qué decide el siguiente paso]

## Hallazgos
| # | Severidad | Descripción | Evidencia | Corrección propuesta | Dueño |
|---|---|---|---|---|---|

## Decisiones tomadas
| Decisión | Alternativas descartadas | Razón | Reversible |
|---|---|---|---|

## Hechos / Inferencias / Recomendaciones
Separados explícitamente. Nunca mezclados.

## Resultado de puerta
APROBADO | CONDICIONAL (con excepciones listadas) | RECHAZADO

## Handoff
Siguiente departamento: [Dxx]
Le entrego: [artefactos]
Le advierto: [riesgos abiertos]
```

## Reglas no negociables

1. **No inventar evidencia.** Si no se pudo verificar, se declara "no verificado".
2. **Separar hecho, inferencia y recomendación.** Mezclarlos es un hallazgo en sí mismo.
3. **No cerrar el propio hallazgo.**
4. **No modificar el alcance sin aprobación registrada.**
5. **Escalar cuando falte acceso** o aparezca un P0/P1, en lugar de seguir con supuestos.
