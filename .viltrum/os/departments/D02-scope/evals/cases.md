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

---

## Caso 5 — "Integra X": la petición corta oculta contenido, datos y funciones

**Entrada:** proyecto con sitio y CMS vivos (Quisqueya). Petición: "integra el catálogo de
proveedor X". Proyecto en etapa de construcción con C1 vigente.

**Qué debe detectar D02** (con `skills/alcance-completo/module-impact-matrix.md`):
- Contenido: fichas, imágenes, categorías y textos que el CMS debe alojar o traducir, con SEO e idioma.
- Base de datos: tablas/catálogos nuevos y migración o backfill de los productos existentes.
- Funciones: sincronización programada (job/cola), reintentos y webhooks de X.
- Además: permisos, correos/notificaciones, soporte y rollback, cada uno con `sí` o `N/A` y razón con evidencia.
- La etapa vigente (de `status.md`) y qué rebanadas quedan para la siguiente.

**Aprobado si:** entrega cabecera de etapa, todos los efectos externos de la lista mínima (incluidos legal/fiscal y secretos/cuentas, más los que añada) con `sí` o `N/A` y razón, las
22 filas D01..D22 (D08, D11, D10/D19 y D16 afectadas con su entrega real; cada N/A con razón)
y el cierre por rebanada que impide dar el módulo por terminado con filas abiertas. Reprobado
si responde solo con la integración técnica (D19/D10) o con `N/A` sin razón.

**Rama sin C1 vigente:** D02 marca C1 pendiente en la cabecera y no activa D09/D10/D11/D16/D18/D19
para construir. Antes de C1 solo se analizan opciones conceptuales (D21 construir/comprar/integrar,
D03 estimación pre-C1, D11/D18/D19 en modo análisis), se llena la matriz con las filas como
"siguiente etapa" y se prepara la propuesta. Reprobado si pasa a construcción sin C1 aceptado.
