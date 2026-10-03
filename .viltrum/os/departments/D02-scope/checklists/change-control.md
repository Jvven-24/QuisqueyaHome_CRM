# Checklist — control de cambio de alcance

> Se aplica a toda solicitud nueva que llega después de que el alcance fue aprobado.
> Firma el revisor (D01), nunca quien negoció el cambio con el cliente.

## A. Solicitud

- [ ] Qué se pide, escrito en una frase verificable (no "algo más de reportes")
- [ ] Quién lo pide y con qué autoridad para pedirlo
- [ ] Fecha de la solicitud registrada

## B. Impacto

- [ ] Prueba DSDM aplicada a la solicitud nueva (Must/Should/Could/Won't)
- [ ] Impacto en el backlog: qué se desplaza o re-prioriza para que quepa
- [ ] Impacto en tiempo, en días o semanas, no en "un poquito más"
- [ ] Impacto en costo, en rango
- [ ] Si la solicitud reemplaza algo ya construido, el costo de deshacer está incluido

## C. Reprioridad

- [ ] El techo de capacidad 60/20/20 se revisó después de insertar la solicitud
- [ ] Si el cambio desplaza un Must ya comprometido, está explícito y aceptado
- [ ] Las exclusiones vigentes se revisaron por si el cambio las contradice

## D. Aprobación

- [ ] Decisión registrada: aprobado / rechazado / diferido a fase futura
- [ ] Quién aprobó, con autoridad real para hacerlo (no solo quien lo pidió)
- [ ] Fecha de la decisión

## E. Registro

- [ ] Entrada `DEC-nnn` en `.viltrum/decisions.md`, con alternativas descartadas y razón
- [ ] Si el cambio afecta la cotización vigente, el rango se actualiza y se anota por qué
- [ ] Si el cambio se rechaza, la razón queda escrita — un rechazo también es una decisión

---

## Veredicto

```
APROBADO      — checklist completa, decisión registrada con autoridad real
CONDICIONAL   — excepción con dueño y fecha. Nunca con un cambio aplicado sin registro
RECHAZADO     — la solicitud vuelve al formulario, incompleta para decidir
```

Firma el revisor (D01), **nunca** quien negoció el cambio con el cliente.
