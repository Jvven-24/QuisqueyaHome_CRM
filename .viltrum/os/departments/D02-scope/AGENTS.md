# D02 — Método operativo

Para entrega coordinada aplica `sops/delivery.md` y el contrato `delivery.json`.
Su skill local es `viltrum-scope`; `core/orchestration.md` define el handoff y la revisión.

## Contrato de entrada

De D01 recibo, y **exijo** antes de empezar:
- Requisitos con criterio de aceptación verificable
- Roles y permisos como catálogo
- Reglas de negocio con sus excepciones
- Evidencia de que el problema es real
- `questions.md` sin preguntas `bloquea:G1` abiertas

**Si un requisito no tiene criterio de aceptación, no lo priorizo** — lo devuelvo a D01.
Priorizar algo ambiguo es fabricar una prioridad sobre humo.

Para control de cambio de alcance heredo además: el estado actual del backlog priorizado,
lo que ya se cotizó y lo que ya se comprometió con fecha.

---

## Procedimiento

### 1. Clasificar con MoSCoW y su prueba

Para cada requisito, aplico la prueba de DSDM:

```
REQUISITO: <id de D01>
PRUEBA: ¿qué pasa si esto no se cumple?
  → Se cancela el proyecto / pierde su razón de ser  → MUST
  → Duele, pero hay rodeo y el release igual sale     → SHOULD
  → Deseable, impacto pequeño si falta                → COULD
  → Fuera de este corte, registrado                   → WON'T (por ahora)
```

**Si la respuesta no es clara, no es Must.** El Must se reserva para lo que de verdad
detiene el proyecto sin él.

### 2. Aplicar el techo de capacidad (regla 60/20/20 de DSDM)

Por cada corte o fase: Must no debe superar ~60% de la capacidad declarada, Should ~20%,
Could ~20% como margen real. Si Must supera el 60%, algo mal clasificado está inflando la
lista — se revisa antes de aceptar el corte.

### 3. Definir MVP y fases

```
MVP = todos los Must, verificados contra la prueba DSDM, y nada que no la pase
FASE 2 = Should con mayor valor / menor esfuerzo
FASE 3+ = Could, reevaluado en cada corte
```

El MVP es lo mínimo **vendible**, no lo mínimo agradable de mostrar. Si el MVP no genera
valor por sí solo sin la fase 2, no es un MVP — es una fase 1 cualquiera.

### 4. Escribir exclusiones explícitas

Toda función que un cliente similar suele esperar (ver
`departments/D01-discovery/reference/expected-capabilities.md`) y que **no** entra a esta
fase, se escribe como exclusión con su razón:

```
NO INCLUYE: <función> · RAZÓN: <por qué queda fuera de este alcance> · REVISAR EN: <fase o fecha>
```

Callar una exclusión esperable es la forma más cara de "alcance implícito".

### 5. Definition of Done de negocio

Distinta de la DoD técnica de `core/evidence-contract.md`. Responde: ¿qué tiene que ser
verdad para que el negocio considere esto entregado? Ejemplos: métrica de éxito alcanzada
en el piloto, aprobación escrita del dueño de producto, capacitación del equipo del
cliente completada, datos migrados y verificados por el cliente.

### 6. Cotización por rangos

```
RANGO: $<mín> – $<máx>
SUPUESTOS QUE LO SOSTIENEN: <volumen, integraciones, iteraciones de diseño>
QUÉ LO BAJA AL MÍNIMO: <condición>
QUÉ LO SUBE AL MÁXIMO: <condición>
SE CIERRA CUANDO: <hito que reduce la incertidumbre — p. ej. "al cerrar G1">
```

Nunca una cifra cerrada sin los supuestos escritos al lado.

### 7. Riesgo comercial

Identifico y registro: dependencias del cliente que pueden atrasar (accesos, contenidos,
aprobaciones), penalidad o consecuencia si el cliente no entrega a tiempo, y quién asume
el costo de un cambio de alcance no solicitado formalmente.

### 8. Control de cambio de alcance

Toda solicitud nueva pasa por este formulario antes de aceptarse o rechazarse:

```
SOLICITUD: <qué se pide> · FECHA: · QUIEN LO PIDE:
IMPACTO EN BACKLOG: <qué se re-prioriza o se desplaza para que quepa>
IMPACTO EN TIEMPO: <días/semanas>
IMPACTO EN COSTO: <rango>
¿ES MUST, SHOULD O COULD?: <prueba DSDM aplicada>
DECISIÓN: aprobado / rechazado / diferido a fase <n>
APRUEBA: <quién tiene autoridad> · FECHA:
```

Se registra en `.viltrum/decisions.md` con el formato `DEC-nnn`, siempre — incluso si la
decisión es rechazar el cambio.

### 9. Handoff

Antes de activar construcción, preparo `.viltrum/commercial.md` con la versión de
propuesta, alcance/exclusiones y condiciones. El estado solo pasa a `aceptada` cuando
hay aprobador humano, fecha y evidencia enlazada. D00 verifica C1; la propuesta enviada
no equivale a aceptación.

Entrego a D21 (investigar antes de construir lo priorizado) y a D03 (arquitectura), con el
backlog priorizado, el MVP definido, las exclusiones y el riesgo comercial.

---

## Herramientas y skills

| Situación | Cómo lo resuelvo |
|---|---|
| Calcular impacto de cambios de alcance acumulados | Subagente propio, modelo pequeño, sobre `decisions.md` y el backlog |
| Estimar esfuerzo técnico real | Consulta a D03/D09/D10/D11 — no lo invento yo solo |
| Verificar qué es línea base esperable del mercado | `departments/D01-discovery/reference/expected-capabilities.md` |

La skill local `skills/viltrum-scope/SKILL.md` guía priorización, propuesta y control
de cambios. Herramientas de hojas o Trello se usan solo cuando estén disponibles y
autorizadas; no sustituyen la decisión comercial del cliente o dueño.

---

## Contrato de salida

- [ ] Cada requisito clasificado con MoSCoW y su prueba escrita
- [ ] Techo de capacidad 60/20/20 verificado, sin Must inflado
- [ ] MVP definido como mínimo vendible, no mínimo agradable
- [ ] Fases 2+ ordenadas por valor/esfuerzo
- [ ] Exclusiones explícitas, con razón y fecha de revisión
- [ ] Definition of Done de negocio escrita
- [ ] Cotización por rango, con supuestos y condición de cierre
- [ ] Riesgo comercial identificado y con dueño
- [ ] Ningún cambio de alcance aceptado sin pasar por el formulario de impacto
- [ ] `decisions.md` actualizado con cada `DEC-nnn`
- [ ] Handoff a D21 y D03 con el paquete completo

---

## Antipatrones propios

| Fallo | Corrección |
|---|---|
| Todo el backlog marcado Must | Aplicar la prueba DSDM a cada ítem, sin excepción |
| MVP con quince pantallas "para completar la experiencia" | MVP es lo mínimo vendible, se recorta hasta que duela |
| Alcance verbal aceptado en una llamada | Todo cambio pasa por el formulario de impacto y `decisions.md` |
| Cotización cerrada sin supuestos | Rango + supuestos + condición de cierre, siempre |
| Exclusión no escrita porque "se sobreentiende" | Se escribe igual — lo sobreentendido es lo que más se discute después |
| Priorizar sin criterio de aceptación del requisito | Se devuelve a D01, no se prioriza a medias |
| Cambio de alcance absorbido "gratis" para quedar bien | Todo cambio tiene costo declarado, aunque se decida no cobrarlo |
| Fecha fija prometida sin margen de riesgo | Rango de fecha con la condición que lo cierra |
