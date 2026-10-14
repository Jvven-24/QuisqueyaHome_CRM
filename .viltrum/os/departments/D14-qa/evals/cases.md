# D14 — Casos de evaluación

> Casos donde una IA genérica de QA falla: valida el camino feliz, confía en la interfaz,
> o cierra un bug sin dejar prueba.

## Caso 1 — Permiso oculto en el botón, abierto en el endpoint

**Escenario:** Un panel de administración oculta el botón "Eliminar usuario" para el rol
`editor`. El equipo de desarrollo declara la funcionalidad de permisos "terminada" porque
el botón no aparece para ese rol.

**Qué debe detectar D14:** Que ocultar un botón no es control de acceso. Debe autenticarse
como `editor` y llamar directamente al endpoint `DELETE /usuarios/:id` (o su equivalente)
sin pasar por la interfaz. Una IA genérica de QA que solo prueba a través del navegador y
del flujo de UI nunca descubre esto, porque desde la interfaz el botón "correctamente" no
existe.

**Criterio de aprobado:** El hallazgo demuestra que la petición directa con rol `editor`
tiene éxito (elimina el usuario) y lo clasifica P0 — escalamiento de privilegio real, no
cosmético. El reporte incluye la petición exacta usada como evidencia reproducible.

---

## Caso 2 — Formulario que "valida bien" pero pierde todo al fallar

**Escenario:** Un formulario de registro de cinco pasos valida correctamente cada campo. Al
llegar al paso 5 y que el servidor rechace el correo por estar duplicado, la pantalla
regresa al paso 1 en blanco.

**Qué debe detectar D14:** Que el criterio de "validación correcta" no es solo si rechaza
el dato malo, sino si conserva todo lo demás. Una IA genérica que prueba "¿el formulario
valida el correo duplicado? sí" marca el caso como aprobado sin notar la pérdida completa
del progreso.

**Criterio de aprobado:** El hallazgo se clasifica P1 (perder el progreso de un formulario
largo es P1 según `core/doctrine/ux-states.md`), con pasos exactos: llenar los cinco pasos,
usar un correo ya registrado, observar la pérdida. La prueba nueva que cierra el bug
verifica explícitamente que el estado de los pasos 1–4 persiste tras el error del paso 5.

---

## Caso 3 — Test E2E que pasa, pero no prueba lo que dice probar

**Escenario:** Un test E2E llamado `deberia completar el checkout` hace clic en "Comprar" y
verifica que aparece un `toast` con el texto "Procesando...". El test pasa siempre, incluso
en un build donde el pago realmente falla en el backend, porque el `toast` aparece antes de
que la petición responda.

**Qué debe detectar D14:** Que un test en verde no es evidencia de que el recorrido
funciona — es evidencia de que la aserción elegida es débil. Una IA genérica que solo mira
"la suite pasa" no cuestiona si las aserciones realmente prueban el resultado de negocio
(pedido creado, pago confirmado, correo de confirmación disparado).

**Criterio de aprobado:** El hallazgo señala la aserción débil como el problema raíz, no el
checkout en sí. La corrección exige que el test espere el resultado final verificable
(confirmación visible, pedido consultable) antes de darse por exitoso, no un mensaje
intermedio.

---

## Caso 4 — Bug corregido sin prueba, reaparece en el siguiente release

**Escenario:** Un bug de fecha (`fecha fin` podía guardarse antes que `fecha inicio`) se
corrigió hace dos releases agregando una validación en el formulario del frontend. En el
release actual, alguien agregó un endpoint nuevo que crea el mismo tipo de registro sin
pasar por ese formulario, y el mismo bug vuelve a ser posible.

**Qué debe detectar D14:** Que el bug nunca tuvo una prueba automatizada de la regla de
negocio en sí (`fecha_fin > fecha_inicio`) a nivel de servidor — solo una validación de
interfaz. Sin esa prueba, cualquier camino nuevo que no pase por el mismo formulario
reabre el defecto. Una IA genérica que solo revisa "¿el formulario original sigue
validando?" concluye que está resuelto y no prueba el endpoint nuevo.

**Criterio de aprobado:** El hallazgo señala que el defecto original se cerró sin dejar
prueba a nivel de servidor (violación del principio "todo bug cerrado deja una prueba
nueva"), y la corrección ahora exige una prueba de la regla de negocio que cubra **todos**
los caminos de escritura, no solo el formulario original.

---

## Caso 5 — Regresión visual ignorada "porque el contenido cambió, no el diseño"

**Escenario:** Una comparación de regresión visual marca una diferencia en la página de
precios: el layout se movió porque un texto legal nuevo se agregó sin ajustar el
espaciado, empujando el botón de "Comprar" fuera del área visible en 390px de ancho. El
equipo aprueba la diferencia diciendo "es solo contenido nuevo, no un cambio de diseño".

**Qué debe detectar D14: ** Que la causa del cambio (contenido nuevo) no exime de evaluar
el efecto (acción primaria inalcanzable en móvil). Una IA genérica que automatiza la
aprobación de diferencias visuales "esperadas" porque hubo un commit de contenido en el
mismo PR, aprobaría esto sin mirar el resultado real en el punto de corte más pequeño.

**Criterio de aprobado:** El hallazgo se levanta como P1 (acción primaria inalcanzable en
390px, el ancho que más duele) independientemente de que el cambio "solo" fuera de
contenido. La referencia visual no se actualiza hasta que el layout se corrige y el botón
vuelve a ser alcanzable con el pulgar.

---

## Caso 6 — Guardar deshabilitado sin motivo y obligatorios sin marca (Quisqueya)

**Escenario:** Un formulario de cliente tiene Teléfono y Dirección obligatorios, sin asterisco ni `aria-required`. El botón Guardar permanece deshabilitado hasta completarlos y no muestra por qué. El E2E del equipo solo llena todo y comprueba que guarda.

**Qué debe detectar D14:** Dos hallazgos P2 según "Contrato de retroalimentación de acciones y formularios" (`core/doctrine/ux-states.md`): botón primario deshabilitado sin razón visible y obligatorios sin marca visible/programática. Una IA genérica da por bueno el camino feliz.

**Criterio de aprobado:** Reporta ambos como P2 con pasos y captura, prueba el formulario vacío/incompleto (no solo el completo) y deriva a D05/D09 sin corregir ella misma.

## Caso 7 — Error de servidor genérico y efímero, validación probada en una sola capa

**Escenario:** Se envía un teléfono inválido. El cliente lo deja pasar, el servidor responde 422 con `errors[{field:"telefono"}]` y la UI muestra un toast "Error al guardar" de 3 s. Las pruebas solo validan la capa de cliente.

**Qué debe detectar D14:** P2 por error de servidor genérico/efímero que no aparece en el campo `telefono`; y que faltan pruebas negativas de API directa y de restricción de BD.

**Criterio de aprobado:** Exige la prueba por capa (cliente, API directa sin cliente, BD) y verifica que el error aparezca en su campo con el dato conservado. Marcar el formulario "aprobado" por solo la prueba de interfaz lo reprueba.
