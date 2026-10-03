# D06 — Casos de evaluación

> Casos donde una IA genérica fallaría: entrega solo el estado feliz y un spinner
> genérico para todo lo demás. Estos casos verifican que D06 resuelva los seis estados
> de verdad, con mensajes reales y comportamiento reproducible.

## Caso 1 — Formulario largo de cotización con error de servidor a mitad de envío

**Escenario:** Un formulario de cotización de tres pasos (ya segmentado por D04) falla en
el servidor justo al confirmar el paso final, después de que el usuario invirtió varios
minutos llenándolo.

**Qué debe detectar/producir:**
- El mensaje de error de servidor no es genérico: dice que algo falló del lado del sistema,
  no del usuario, con un código de referencia
- **Todo lo escrito en los tres pasos se conserva** — el usuario no vuelve a empezar
- Existe un reintento seguro que no duplica la cotización si el servidor sí llegó a
  procesarla parcialmente (coordinado con idempotencia de backend)

**Criterio de aprobado:** el documento de D06 especifica explícitamente que el estado del
formulario persiste ante el error de servidor, describe el mecanismo (guardado local o en
servidor por paso) y el mensaje sigue la estructura qué-pasó + qué-hacer sin exponer detalle
técnico interno.

---

## Caso 2 — Tabla de resultados con carga que tarda y con error parcial

**Escenario:** Una tabla de reportes trae datos de dos fuentes: una responde rápido, la
otra tarda o falla intermitentemente.

**Qué debe detectar/producir:**
- Estado de carga con skeleton de filas, no spinner centrado que bloquea toda la tabla
- Si una fuente falla y la otra no, la tabla muestra lo que sí cargó y aísla visualmente
  la columna o sección que falló, con opción de reintentar solo esa parte
- Ningún mensaje de "no hay datos" cuando en realidad hubo un error — la distinción entre
  vacío real y error debe quedar explícita

**Criterio de aprobado:** la matriz pantalla × estado distingue explícitamente "vacío" de
"error parcial" para esta pantalla, con mensajes distintos para cada uno, y el error parcial
no bloquea ver los datos que sí llegaron.

---

## Caso 3 — Dos usuarios editan el mismo registro al mismo tiempo

**Escenario:** Un módulo de edición de inventario donde dos usuarios con permiso de
edición abren el mismo producto casi simultáneamente y ambos intentan guardar cambios.

**Qué debe detectar/producir:**
- D06 no asume que "el último que guarda gana" sin que esa sea una decisión de negocio
  explícita y documentada
- Si no existe una estrategia de resolución de conflictos definida por D01/D11, D06 la
  escala como pregunta abierta en lugar de inventar el comportamiento
- Si existe la estrategia, D06 especifica cómo se le informa al segundo usuario que su
  base de datos local está desactualizada, antes de que sobrescriba en silencio

**Criterio de aprobado:** el documento entregado no contiene una sobrescritura silenciosa
sin haber verificado antes si existe regla de negocio; si no existía, la pregunta quedó
escalada con su identificador, no resuelta por supuesto.

---

## Caso 4 — Botón de "Eliminar cuenta" con doble clic accidental

**Escenario:** Una acción irreversible de alto impacto (eliminar cuenta de usuario, con
pérdida de datos asociados) accesible desde configuración.

**Qué debe detectar/producir:**
- No se acepta una confirmación genérica de tipo "¿Estás seguro? Sí/No"
- Se exige un mecanismo de confirmación reforzada: por ejemplo, escribir el nombre de la
  cuenta o un texto específico antes de habilitar el botón final
- El botón bloquea doble clic mientras la eliminación está en curso
- Se especifica qué pasa con los datos: borrado lógico con ventana de recuperación, o
  borrado real con advertencia explícita de que no hay vuelta atrás — nunca ambiguo

**Criterio de aprobado:** el documento distingue esta acción como "irreversible de alto
impacto" según la tabla de confirmaciones destructivas, especifica el mecanismo reforzado
concreto (no genérico) y dice explícitamente si hay ventana de recuperación o no.
