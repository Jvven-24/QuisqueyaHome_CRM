# Checklist — handoff al cliente y capacitación

> La firma es de D00, nunca de quien preparó el handoff.

## A. Alcance del handoff

- [ ] Qué se entrega, listado explícitamente (módulos, integraciones, documentación)
- [ ] Qué queda pendiente o fuera de alcance, listado explícitamente
- [ ] Contacto técnico responsable después del handoff, identificado con nombre y canal

## B. Accesos

- [ ] Cada acceso entregado (repositorio, VPS, dominio, panel de terceros) listado
- [ ] Accesos entregados por escrito, con fecha, no solo mencionados en una llamada
- [ ] Ningún secreto entregado por un canal inseguro (correo plano, chat sin cifrar)
- [ ] Confirmación de recepción del cliente registrada

## C. Documentación entregada

- [ ] README, manual de usuario y manual de administración incluidos
- [ ] Documento de arquitectura e índice de ADR incluidos
- [ ] Runbooks de release, reversión y restauración incluidos
- [ ] Todo enlace de este handoff verificado como accesible por el cliente (no un enlace interno de Viltrum)

## D. Capacitación

- [ ] Sesión de capacitación realizada, con fecha y asistentes registrados
- [ ] Documento que respalda la sesión, entregado antes o durante la sesión, no después
- [ ] Preguntas del cliente durante la sesión, registradas y respondidas por escrito

## E. Verificación del criterio junior

- [ ] Una persona del lado del cliente, sin haber participado en el desarrollo, intentó
      seguir el procedimiento de restauración con el documento entregado
- [ ] El resultado del intento (logrado / bloqueado en qué paso) está registrado
- [ ] Si se bloqueó, el documento se corrigió antes de cerrar el handoff

## F. Cierre

- [ ] Fecha de cierre del handoff acordada con el cliente
- [ ] Periodo de acompañamiento post-handoff (si existe) definido con su alcance
- [ ] Lección relevante, si la hay, escrita en `MEMORY.md`

---

## Veredicto

```
APROBADO      — handoff completo, accesos confirmados, criterio junior verificado
CONDICIONAL   — pendientes con dueño y fecha, ningún acceso crítico faltante
RECHAZADO     — vuelve a D20: documentación o accesos incompletos
```

**Recordatorio:** un handoff que depende de que el equipo de Viltrum siga disponible
para responder preguntas básicas no es un handoff — es una entrega a medias.

Firma del revisor (D00): _______________________  Fecha: _______________
