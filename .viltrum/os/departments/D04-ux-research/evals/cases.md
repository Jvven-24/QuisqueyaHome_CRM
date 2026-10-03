# D04 — Casos de evaluación

> Casos donde una IA genérica fallaría: entrega la pantalla pedida y se detiene ahí,
> sin ver el sistema completo. Estos casos verifican que D04 no cometa ese error.

## Caso 1 — "Agrégale una pantalla de facturas"

**Escenario:** El cliente pide una pantalla para ver facturas. No menciona crear, editar,
anular, ni quién puede hacer qué.

**Qué debe detectar/producir:**
- Inventario del módulo completo de facturación, no solo la pantalla de listado pedida:
  lista, detalle, creación, anulación, historial de cambios, impresión/descarga
- Matriz pantalla × rol que distinga, como mínimo, quién puede ver vs. quién puede anular
  una factura — y si esa regla no existe todavía, una pregunta abierta escalada a D01/D02
- El patrón "lista" con filtros y búsqueda si el volumen esperado de facturas lo justifica

**Criterio de aprobado:** el inventario entregado cubre el ciclo de vida completo de una
factura sin que nadie lo haya pedido explícitamente, y toda regla de negocio sin definir
(quién anula, si una factura anulada se puede reactivar) queda como pregunta abierta, no
como supuesto silencioso.

---

## Caso 2 — Formulario de alta de cliente con 14 campos pedidos de una vez

**Escenario:** El cliente entrega una lista de 14 campos para "el formulario de registro
de cliente nuevo": nombre, cédula/RNC, teléfono, correo, dirección completa (5 campos),
tipo de cliente, límite de crédito, vendedor asignado, forma de pago preferida, notas.

**Qué debe detectar/producir:**
- El inventario del formulario ya segmentado en pasos o pestañas antes de llegar a D05:
  por ejemplo, "Identificación" (nombre, documento, tipo de cliente), "Contacto" (teléfono,
  correo, dirección), "Condiciones comerciales" (crédito, vendedor, forma de pago, notas)
- Agrupación por significado de negocio, no por tipo de dato (no "todos los textos juntos")
- Guardado parcial especificado entre pasos

**Criterio de aprobado:** ningún paso del formulario supera 7 campos, la segmentación
aparece en el documento de D04 sin que D05 tenga que corregirlo, y la agrupación
corresponde a bloques que un vendedor reconocería como pasos naturales de la conversación
con el cliente, no a una partición arbitraria de una lista larga.

---

## Caso 3 — Dashboard pedido como "resumen general" sin más contexto

**Escenario:** El cliente pide "un dashboard con un resumen general del negocio" para el
rol de gerencia, sin especificar métricas.

**Qué debe detectar/producir:**
- D04 no dibuja el dashboard directamente: primero busca el objetivo medible del proyecto
  y las decisiones que la gerencia toma con esa información. Si no existen, lo escala como
  pregunta abierta a D01/D02 en lugar de inventar cuatro tarjetas genéricas
- Si hay objetivo y decisiones identificables, cada métrica del dashboard queda ligada por
  escrito a una decisión concreta ("si las devoluciones superan X%, se revisa al proveedor")
- Densidad y frecuencia de actualización justificadas por cómo se usa el dashboard (una vez
  al día vs. monitoreo continuo), no por defecto

**Criterio de aprobado:** ninguna métrica del dashboard entregado carece de una decisión
asociada por escrito; si la información para decidir eso no estaba disponible, el
recorrido quedó bloqueado por una pregunta abierta en lugar de avanzar con una versión
genérica sin sentido de negocio.

---

## Caso 4 — "Cambia esta pantalla, no me gusta cómo se ve"

**Escenario:** Petición de tipo `CAMBIO_UI` según `core/routing.md`. El cliente describe
el síntoma como estético, pero la causa real es que la acción principal está enterrada
detrás de tres clics.

**Qué debe detectar/producir:**
- D04 no delega directo a D05 para "ponerla más bonita". Analiza el recorrido real: cuántos
  pasos toma llegar a la acción, si el patrón de vista es el correcto, si la jerarquía visual
  reportada como "fea" en realidad es un problema de densidad o de jerarquía de información
- Si concluye que el problema es de arquitectura de información, lo dice explícitamente y
  no se maquilla: se reabre el recorrido en lugar de pasar directo a diseño visual

**Criterio de aprobado:** el hallazgo distingue explícitamente "esto es un problema de
flujo/jerarquía" de "esto es un problema estético", con evidencia del recorrido (número de
pasos, pantalla donde se pierde el usuario), antes de decidir si el siguiente paso es D04
de nuevo o pasar directo a D05.
