# D06 — Método operativo

## Contrato de entrada

De D04 recibo: inventario de pantallas, matriz pantalla × rol, recorridos con sus caminos
alternos y de error.

De D05 recibo: composición de cada pantalla, componentes usados y sus variantes.

**Si no tengo el camino de error de D04, no puedo completar la columna de error de la
matriz — lo pido antes de empezar.** Inventar el camino de error sin el recorrido real
produce mensajes genéricos que no corresponden a lo que realmente puede fallar.

---

## Procedimiento

### 1 — Matriz pantalla × estado (obligatoria, base de `core/doctrine/ux-states.md`)

Por cada pantalla del inventario de D04, una fila; columnas = los seis estados. Ninguna
celda queda en blanco ni con "TBD".

```
PANTALLA: <nombre>
CARGA:        <qué se ve — skeleton, indicador en botón, barra, sincronización de fondo>
VACÍO:        <mensaje + acción inicial>
ERROR:        <cada tipo de error posible en esta pantalla + su mensaje>
SIN CONEXIÓN: <qué se ve, qué se conserva, qué se encola>
ÉXITO:        <confirmación específica, si es reversible o irreversible>
PERMISOS:     <qué se oculta o deshabilita, con qué razón visible>
```

### 2 — Carga: seis casos, seis soluciones distintas

| Caso | Solución obligatoria |
|---|---|
| Carga inicial de pantalla | Skeleton con la forma aproximada del contenido real — nunca spinner centrado genérico |
| Carga de acción (guardar, enviar) | Indicador dentro del botón + texto explícito ("Guardando…") + bloqueo de doble envío |
| Progreso conocido (subida de archivo, importación) | Barra con porcentaje real, no estimado si no es confiable |
| Carga larga (> 3-4 segundos esperables) | Explicación de qué está pasando, opción de cancelar si es técnicamente posible |
| Sincronización de fondo | Indicador discreto que no bloquea la interacción con el resto de la pantalla |
| Actualización optimista | Cambio inmediato en pantalla + reversión visible y explicada si el servidor rechaza |

**Prohibido:** un spinner centrado como única respuesta, sin importar el caso.

### 3 — Catálogo de mensajes de error

Estructura obligatoria de todo mensaje: **qué pasó** (en lenguaje humano) + **qué puede
hacer el usuario ahora**. Nunca un código técnico o un stack trace como única explicación.

| Tipo de error | Qué pasó (ejemplo de tono) | Qué hacer |
|---|---|---|
| Error de campo | "El correo no tiene un formato válido" | Corregir el campo señalado; lo demás se conserva |
| Error general de formulario | "Hay 3 campos por corregir" | Resumen con enlace a cada campo afectado |
| Error de servidor (5xx) | "Algo falló de nuestro lado, no fue nada que hicieras" | Reintentar + código de referencia para soporte, nunca detalle interno |
| Timeout | "Esto está tardando más de lo normal" | Para escritura, consultar el resultado o usar idempotencia antes de prometer que reintentar no duplica |
| Límite de peticiones (429) | "Demasiados intentos seguidos" | Indicar cuándo se puede reintentar |
| Error parcial | "Se cargó la mayoría, esto no se pudo traer" | Mostrar lo que sí llegó, aislar y señalar lo que falló |
| Sesión expirada | "Tu sesión venció" | Guardar lo escrito, pedir acceso, volver exactamente al punto anterior |
| Permiso insuficiente | "Tu rol no incluye esta acción" | Explicar qué rol o autorización se necesita, a quién pedirla si aplica |
| 404 | "No encontramos esto" | Ofrecer rutas útiles, no un callejón sin salida |
| 500 | Mensaje humano genérico | Nunca exponer detalle interno del error |
| Mantenimiento programado | Estado + alcance estimado | Canal de contacto o estado público si existe |
| Conflicto de edición concurrente | "Alguien más cambió esto mientras editabas" | Mostrar ambas versiones o la diferencia; nunca sobrescribir en silencio |

**Conservar borradores permitidos por D12** ante errores recuperables. Contraseñas, tokens,
datos sensibles prohibidos y recursos inaccesibles tras revocación no se persisten como
borrador. Documentar la excepción y la recuperación, sin prometer conservación insegura.

### 4 — Skeletons

- [ ] La forma del skeleton se aproxima al contenido real (líneas donde hay texto, bloques
  donde hay imágenes) — un skeleton genérico que no se parece a nada es solo otro spinner
- [ ] El skeleton desaparece de una vez cuando llega el contenido, sin parpadeo
- [ ] Si la carga es casi instantánea (< ~300ms), no se muestra skeleton — evita el parpadeo

### 5 — UI optimista con reversión

- [ ] El cambio se refleja de inmediato en la interfaz al confirmar la intención del usuario
- [ ] Si el servidor rechaza, la reversión es visible y se explica por qué, no desaparece en silencio
- [ ] Nunca se usa UI optimista en acciones irreversibles o de alto costo (pagos, borrado permanente)

### 6 — Reintentos y timeouts

- [ ] Reintento manual siempre disponible tras un error recuperable
- [ ] Reintento automático solo para fallos de red transitorios, con límite de intentos y backoff — nunca infinito
- [ ] El reintento nunca duplica la acción original (idempotencia coordinada con D10/D19)
- [ ] El timeout tiene un valor explícito, no "lo que tarde"

### 7 — Sin conexión y cola offline

- [ ] Página o estado propio para "sin internet" — nunca el error genérico del navegador
- [ ] Se muestra cuándo fue la última sincronización exitosa
- [ ] Si la app permite trabajar sin conexión, existe cola visible de lo pendiente por enviar
- [ ] El usuario puede ver, y si aplica cancelar, lo que está en la cola antes de que se envíe

### 8 — Sesión expirada conservando lo escrito

- [ ] Se detecta la expiración antes de perder la acción, no después de que falle silenciosamente
- [ ] El borrador permitido se conserva hasta reingresar conforme a la política D12; secretos y datos prohibidos no se persisten
- [ ] Tras reautenticar, el usuario vuelve exactamente al punto donde estaba, con lo escrito intacto

### 9 — Permisos

- [ ] Sin permiso de lectura: el elemento no se muestra, o se muestra deshabilitado con explicación — nunca falla al cargar sin decir por qué
- [ ] Sin permiso de acción: deshabilitado con razón visible, nunca se deja intentar y falla después
- [ ] Acción primaria deshabilitada por cualquier causa (validación incompleta, dependencia): razón visible que nombra qué falta, o no se deshabilita y se responde con resumen de errores (R2); obligatorios marcados (R1)
- [ ] Permiso revocado en sesión activa: la interfaz se degrada sin romperse (no crashea, no queda en un estado inconsistente)
- [ ] **El permiso se verifica siempre en el servidor.** Ocultar el botón en el cliente no es control de acceso, es apenas una ayuda visual

### 10 — Conflictos de edición concurrente

- [ ] Se detecta que otro usuario cambió el registro antes de sobrescribir
- [ ] Se ofrece ver la diferencia o elegir qué versión prevalece — nunca se pierde el cambio de nadie en silencio
- [ ] Si el negocio no tiene estrategia de resolución definida, se escala a D01/D11 antes de inventar una

### 11 — Confirmaciones destructivas y deshacer

| Tipo de acción | Tratamiento |
|---|---|
| Reversible (archivar, marcar como leído) | Ejecutar directo + ofrecer deshacer por un tiempo razonable |
| Irreversible de bajo impacto | Confirmación simple con descripción de la consecuencia |
| Irreversible de alto impacto (borrar, pagar, publicar, cambiar permisos de otros) | Confirmación reforzada: escribir el nombre del elemento, doble paso, o equivalente — nunca un solo clic accidental |

- [ ] El texto de confirmación describe la consecuencia real, no un genérico "¿Estás seguro?"
- [ ] "Deshacer" tiene ventana de tiempo visible y explícita

### 12 — Estados de componentes

Cada componente se revisa contra sus estados obligatorios de interacción y de datos:

| Componente | Estados obligatorios |
|---|---|
| Botón | reposo, hover, foco visible, activo, deshabilitado (con razón: permiso, validación, dependencia u operación en curso; nombra qué falta), cargando (bloquea doble clic), éxito. Contrato R1–R8 en `core/doctrine/ux-states.md` |
| Input | vacío, con valor, foco, error (con mensaje), deshabilitado, de solo lectura |
| Tabla | cargando (skeleton de filas), vacía, con datos, error parcial por fila/columna, ordenada, filtrada |
| Select / combobox | cerrado, abierto, buscando (si tiene búsqueda), sin resultados, cargando opciones remotas |
| Upload de archivo | en espera, subiendo con progreso, éxito, error total, **error parcial** (algunos archivos sí, otros no — cada uno se reporta individual), cancelado por el usuario |
| Paginación | página actual, sin página siguiente/anterior deshabilitada correctamente, total conocido vs. desconocido, salto directo a página si aplica |

**Prohibido declarar un componente terminado sin sus estados de la tabla anterior
verificados en ejecución**, no solo dibujados.

### 13 — Verificación propia

- [ ] Cada celda de la matriz pantalla × estado tiene mensaje real, no "TBD"
- [ ] Los mensajes de error siguen la estructura qué-pasó + qué-hacer
- [ ] Se reprodujo al menos el error de servidor y la sesión expirada en un entorno real, no solo en el documento
- [ ] Ningún estado se comunica solo por color (coordinado con D07)

### 14 — Handoff

Entrego a D09 (implementación) y a D07 (revisor de accesibilidad de los estados). Mi
revisor de cierre es D14, que verifica en ejecución.

---

## Herramientas y skills

| Situación | Skill |
|---|---|
| Verificar estados en navegador real (reproducir error, timeout, offline) | `browser-automation`, `playwright-cli` |
| Explorar patrones de microinteracción y estados alternativos | `ui-design`, `ui-ux-pro-max`, MCP `open-design` |
| Prototipar pantallas de estados vacíos / error / carga | MCP `open-design` (`create_project`, `start_run`) |
| Animación de transición entre estados (carga → éxito, skeleton → contenido) | `emilkowal-animations`, `framer-motion`, `gsap-framer-scroll-animation` |
| Auditar estados ya implementados | `21st-ui-review`, `web-design-guidelines`, `code-review` |
| Comprobar que estados y mensajes no crean barreras | `accessibility` |

**Regla de uso:** ninguna skill sustituye reproducir el estado real. Documentar un error de
servidor sin haberlo provocado al menos una vez en un entorno controlado es una hipótesis,
no una verificación.

---

## Contrato de salida

- [ ] Matriz pantalla × estado completa, sin celdas en blanco ni "TBD"
- [ ] Catálogo de mensajes de error aplicado con la estructura qué-pasó + qué-hacer
- [ ] Skeletons especificados por tipo de contenido, no genéricos
- [ ] Reintentos, timeouts y cola offline definidos donde aplica
- [ ] Sesión expirada conserva el contenido no guardado, verificado
- [ ] Permisos: cliente y servidor coordinados, ninguno depende solo del cliente
- [ ] Conflictos de edición concurrente resueltos o escalados como pregunta abierta
- [ ] Confirmaciones destructivas reforzadas según impacto; deshacer donde es reversible
- [ ] Estados de cada componente de la tabla del paso 12 verificados en ejecución
- [ ] Handoff a D09 con especificación implementable
- [ ] Revisión de D14 firmada

---

## Antipatrones propios

| Fallo | Corrección |
|---|---|
| Spinner centrado como única respuesta a la carga | Seis casos de carga, seis soluciones distintas — paso 2 |
| "No hay datos" a secas | Propósito + acción inicial, siempre |
| Perder lo que el usuario escribió ante un error | Regla dura, sin excepción — se verifica explícitamente |
| Código técnico como mensaje de error | Estructura qué-pasó + qué-hacer, siempre en lenguaje humano |
| Botón sin bloqueo de doble envío | Indicador en botón + bloqueo obligatorio durante la carga de acción |
| Permiso verificado solo en el cliente | Verificación siempre en servidor; el cliente solo ayuda visualmente |
| Sobrescribir la edición de otro usuario en silencio | Detección de conflicto + elección explícita, nunca automática y silenciosa |
| Confirmación genérica ("¿Estás seguro?") en acción de alto impacto | Confirmación reforzada describiendo la consecuencia real |
| Estado documentado pero nunca reproducido en ejecución | Verificación propia obligatoria antes de handoff — paso 13 |
| Error de carga de archivos reportado como todo-o-nada | Error parcial por archivo, cada uno con su propio estado |
| Estado comunicado solo con color | Texto real siempre, color es refuerzo, nunca la única señal |
| Guardar deshabilitado sin decir por qué / obligatorios sin marca | Ver sección "Contrato de retroalimentación de acciones y formularios" de `core/doctrine/ux-states.md` |


## Integración PXIL (2026-09-30)

Antes de diseño o revisión de experiencia, cargar `skills/viltrum-pxil-design/SKILL.md`.
Las skills complementarias del contrato son: pxil-experience-contract, pxil-permission-matrix.
Consultar `registry/design-resources.json` y la plantilla de contrato de experiencia.
PXIL aporta trazabilidad y estados; conserva los gates, C1 y revisor de Viltrum.

Activa la guía revisada por D00 (HND-012) de [`core/design-experience-os.md` §9](../../core/design-experience-os.md#portfolio-editorial-motion)
si el scroll añade navegación, capítulo activo o comportamiento de tema; define anclas y
acuerda con D02 el requisito de persistencia antes de implementarlo. El scroll pasivo no crea
por sí mismo un estado de negocio.
