# D15 — Casos de evaluación

> Casos donde una IA genérica de rendimiento falla: optimiza sin medir, prueba un solo
> escenario de carga, o confunde promedio con percentil.

## Caso 1 — "Le agrego un índice" sin ver el plan de ejecución

**Escenario:** Un endpoint de listado de pedidos tarda 3 segundos. Un desarrollador agrega
un índice a la columna `estado` porque "es la que más se filtra" y reporta que ahora tarda
2.8 segundos — mejora marginal, problema declarado "en progreso" sin más investigación.

**Qué debe detectar D15:** Que nunca se capturó el plan de ejecución antes del cambio, y
que la causa real probablemente no es la falta de índice en `estado` sino, por ejemplo, un
N+1 disparado por el ORM al cargar la relación de cada pedido con su cliente. Una IA
genérica de rendimiento, entrenada en "consulta lenta → agregar índice" como reflejo,
aprobaría el cambio con la mejora marginal como si fuera la solución.

**Criterio de aprobado:** D15 exige el plan de ejecución de antes del cambio (no
disponible, así que se marca como no verificado) y el de después, identifica el patrón N+1
real con el perfil de consultas, y clasifica el índice agregado como cambio no justificado
por medición — antipatrón "índice por si acaso".

---

## Caso 2 — Presupuesto de rendimiento cumplido en promedio, roto en p75

**Escenario:** El equipo reporta "LCP promedio: 1.8 s, dentro del presupuesto de 2.5 s".
La medición de campo real (RUM) muestra que el p75 está en 3.4 segundos porque un
segmento grande de usuarios en conexiones móviles lentas tiene experiencias mucho peores
que el promedio, que las esconde.

**Qué debe detectar D15:** Que Core Web Vitals se evalúa en **p75**, no en promedio — un
promedio bueno con una cola larga de experiencias malas sigue siendo un presupuesto
incumplido para una porción real de usuarios. Una IA genérica que reporta "promedio dentro
del rango: aprobado" pasa por alto exactamente el segmento que más sufre.

**Criterio de aprobado:** El hallazgo se clasifica como presupuesto incumplido (bloqueante
de Gate G5), citando el p75 real de 3.4 s contra el umbral de 2.5 s, y exige investigar el
segmento de conexión lenta específicamente, no optimizar para el caso promedio.

---

## Caso 3 — Prueba de carga única declarada suficiente

**Escenario:** Antes de un release que espera triplicar usuarios por una campaña de
marketing, el equipo corre una prueba de carga sostenida con el tráfico normal actual
durante 5 minutos, ve que pasa sin errores, y declara el sistema listo para la campaña.

**Qué debe detectar D15:** Que una prueba de carga sostenida con tráfico normal no dice
nada sobre el comportamiento ante un pico súbito (que es justo lo que una campaña de
marketing produce) ni sobre degradación en el tiempo (la campaña puede durar horas). Una
IA genérica que valida "corrió una prueba de carga: aprobado" no distingue qué tipo de
prueba responde a qué riesgo real.

**Criterio de aprobado:** El hallazgo señala que falta la prueba de picos (el escenario más
relevante para una campaña) y la de resistencia (si la campaña dura horas), y bloquea la
aprobación del Gate hasta que ambas se ejecuten con el perfil de tráfico real esperado de
la campaña, no el actual.

---

## Caso 4 — Caché que sirve datos viejos tras una actualización crítica

**Escenario:** Se activa caché de 10 minutos en el endpoint de disponibilidad de
inventario "para bajar la carga de la base de datos". Días después, un producto se agota,
se actualiza el inventario a cero, y durante los siguientes 10 minutos el sitio sigue
mostrándolo disponible — varios usuarios completan la compra de un producto que no existe.

**Qué debe detectar D15:** Que el caché se activó sin estrategia de invalidación explícita
para el evento "el inventario cambió" — solo con expiración por tiempo. Una IA genérica
centrada en "reducir carga a la base de datos" ve el caché como una mejora de rendimiento
pura y no evalúa el costo de mostrar un dato desactualizado en un flujo transaccional.

**Criterio de aprobado:** El hallazgo se clasifica P1 (vender un producto sin stock es un
defecto de negocio real, no solo de rendimiento) y exige invalidación activa del caché en
el momento en que el inventario cambia, no solo expiración por tiempo — coordinado con D11
para el mecanismo de invalidación.

---

## Caso 5 — Degradación no elegante: un proveedor de terceros tumba todo el checkout

**Escenario:** El checkout llama a un servicio de verificación de dirección de un tercero
para autocompletar el formulario. El servicio del tercero empieza a responder con timeout
de 30 segundos. El checkout completo queda bloqueado esperando esa respuesta antes de
permitir continuar, aunque la verificación de dirección no sea estrictamente necesaria
para completar la compra.

**Qué debe detectar D15:** Que una dependencia externa no esencial no tiene timeout corto
ni plan de degradación — su falla se propaga como si fuera crítica. Una IA genérica que
revisa "el checkout funciona en la prueba feliz" no prueba el escenario donde el tercero
falla o tarda.

**Criterio de aprobado:** El hallazgo exige timeout corto y explícito para la llamada al
tercero (segundos, no 30), y que su fallo permita continuar el checkout sin autocompletar
la dirección, en vez de bloquear la compra completa. Se verifica simulando el timeout del
tercero y confirmando que el checkout sigue siendo completable.
