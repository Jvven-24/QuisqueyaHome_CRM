# Checklist — gestión de un incidente y su postmortem

> La firma es de D16, nunca de quien resolvió el incidente.

## A. Declaración

- [ ] Incidente declarado formalmente, con hora de inicio
- [ ] Severidad asignada en los primeros minutos (SEV1–SEV4)
- [ ] Coordinador del incidente nombrado — no necesariamente quien lo resuelve
- [ ] Canal único de comunicación abierto, con línea de tiempo en vivo

## B. Durante el incidente

- [ ] Mitigación priorizada sobre diagnóstico de causa raíz
- [ ] Si aplica, rollback solicitado a D16 con la evidencia que lo justifica
- [ ] Cambios de severidad durante el incidente, registrados con hora
- [ ] Comunicación a las partes afectadas (equipo, cliente) según la severidad

## C. Cierre

- [ ] Síntoma verificado como resuelto, no solo "parece que sí"
- [ ] Hora de cierre registrada
- [ ] Impacto medido: a quién afectó, cuánto tiempo, qué costó (negocio, no solo técnico)
- [ ] Presupuesto de error consumido por este incidente, calculado

## D. Postmortem — línea de tiempo

- [ ] Cada evento con hora exacta, desde la primera señal hasta el cierre
- [ ] Momento de detección vs. momento de inicio real del problema, diferenciados
- [ ] Tiempo hasta la primera respuesta humana, medido

## E. Postmortem — causas

- [ ] Causas contribuyentes del sistema, no de una persona
- [ ] Ninguna frase del tipo "el desarrollador olvidó..." — se reformula como falla de
      proceso, revisión o herramienta
- [ ] Qué funcionó bien durante la respuesta, documentado explícitamente
- [ ] Qué habría reducido el tiempo de detección o de respuesta, identificado

## F. Postmortem — acciones de seguimiento

- [ ] Cada acción tiene dueño individual
- [ ] Cada acción tiene fecha
- [ ] Ninguna acción genérica tipo "mejorar el monitoreo" sin qué exactamente
- [ ] Acciones de prevención (evitar que vuelva a pasar) separadas de las de detección
      (saberlo más rápido la próxima vez)

## G. Cierre del proceso

- [ ] Postmortem publicado dentro de las 48 horas de cerrado el incidente
- [ ] Postmortem accesible al equipo completo, no solo a quien lo escribió
- [ ] Lección relevante escrita en el `MEMORY.md` del departamento correspondiente
- [ ] Si el incidente reveló una alerta faltante, la alerta queda creada, no solo anotada

---

## Veredicto

```
APROBADO      — postmortem sin culpables, con acciones, duenos y fechas
CONDICIONAL   — acciones de seguimiento definidas pero pendientes de dueno o fecha
RECHAZADO     — vuelve a D17: falta linea de tiempo, causas raiz o senala a una persona
```

**Recordatorio:** un postmortem que señala a alguien no cerró el hallazgo real — solo
lo escondió detrás de un nombre.

Firma del revisor (D16): _______________________  Fecha: _______________
