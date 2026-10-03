# Casos de evaluación — D02 Alcance, negocio y prioridad

> Casos donde una IA genérica aceptaría el alcance implícito o inflaría el MVP. El
> criterio de aprobado exige que D02 aplique la prueba DSDM y el control de cambio con
> evidencia escrita, no con criterio verbal.

---

## Caso 1 — Cliente insiste en que "todo es urgente"

**Escenario de entrada**
El cliente entrega 40 requisitos y dice que todos son indispensables para el lanzamiento.

**Qué debe detectar D02**
- Que si el 100% se marca Must, no hubo priorización real.
- Aplicar la prueba DSDM a cada uno: "¿si esto no está, se cancela el lanzamiento?"
- Que el techo de capacidad 60/20/20 se rompe y hay que negociar, no forzar el corte.
- Cuáles de esos 40 son en realidad exclusiones esperables de una fase posterior según
  `expected-capabilities.md` (por ejemplo, reportes avanzados en un CRM nuevo).

**Criterio de aprobado**
La matriz MoSCoW entregada tiene menos del 60% de los ítems como Must, cada uno con su
prueba DSDM escrita, y al menos 3 ítems fueron reclasificados con la razón documentada de
por qué no pasan la prueba pese a que el cliente los llamó urgentes. Una IA genérica
típicamente acepta la etiqueta "todo urgente" del cliente sin cuestionarla.

---

## Caso 2 — Cambio de alcance disfrazado de "ajuste pequeño"

**Escenario de entrada**
A mitad del proyecto, el cliente pide agregar "solo un botón de exportar a Excel con
algunos filtros" sin pasar por ningún proceso formal.

**Qué debe detectar D02**
- Que "solo un botón" puede implicar tocar el modelo de datos, permisos por columna
  exportable, y volumen de filas soportado.
- Que sin pasar por el control de cambio, el impacto en tiempo y costo queda invisible y
  el equipo lo absorbe gratis en silencio.
- Si desplaza algo ya comprometido del corte actual.

**Criterio de aprobado**
La solicitud entra al formulario de `change-control.md` con impacto en tiempo y costo
estimado, aunque sea pequeño, y queda registrada como `DEC-nnn` en `.viltrum/decisions.md`
con la decisión (aprobado/rechazado/diferido) y quién la tomó. Una IA genérica típicamente
"sí, lo agrego" sin registrar el costo ni pedir aprobación de quien tiene autoridad.

---

## Caso 3 — Cotización pedida sin volumen definido

**Escenario de entrada**
El cliente pide "una cotización cerrada" para un marketplace, sin haber definido cuántos
vendedores ni qué volumen de transacciones espera.

**Qué debe detectar D02**
- Que una cifra cerrada sin ese dato es una promesa sin base.
- Qué supuesto concreto sostiene el rango bajo y cuál el rango alto.
- Qué hito específico (por ejemplo, cierre de G1 con volumen confirmado) permite cerrar la
  cifra final.

**Criterio de aprobado**
La cotización entregada es un rango con los supuestos de volumen escritos explícitamente y
una condición de cierre verificable, no una cifra única. Una IA genérica típicamente
entrega una cifra cerrada para no parecer evasiva, sin declarar sobre qué supuesto se
sostiene.

---

## Caso 4 — Propuesta enviada sin aceptación

**Entrada:** el equipo envió una propuesta con MVP y precio; el cliente respondió que la
revisará la semana próxima.

**Aprobado si:** D02 deja C1 pendiente, conserva la versión enviada y la pregunta de
aceptación. D00 no activa D09/D10/D11/D16. Suspendido si la fecha de envío o un silencio
del cliente se toma por aceptación.
