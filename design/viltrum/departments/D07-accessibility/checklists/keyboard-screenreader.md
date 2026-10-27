# Checklist — verificación manual con teclado y lector de pantalla

> Complementa `wcag-audit.md`. Ningún ítem de esta lista lo cubre un escáner automático.
> Firma D14, nunca quien verificó.

## A. Preparación

- [ ] Se identificó el recorrido crítico a verificar (de D04)
- [ ] Se desconectó o ignoró el mouse por completo durante la sesión de teclado
- [ ] Se eligió lector de pantalla y navegador, y quedaron citados en el informe (NVDA+Chrome, VoiceOver+Safari, o equivalente)

## B. Navegación por teclado

- [ ] Tab recorre todos los controles interactivos, en orden lógico según la tarea
- [ ] Shift+Tab regresa en el mismo orden inverso
- [ ] Ningún control queda inalcanzable por teclado
- [ ] El foco nunca queda atrapado sin salida (2.1.2)
- [ ] El foco visible se distingue claramente en cada control, en todo momento
- [ ] El foco **no queda oculto** al pasar detrás de un header fijo, un banner de cookies o un chat flotante (2.4.11)
- [ ] Modales y menús: Esc cierra, el foco regresa al elemento que los abrió
- [ ] Listas desplegables se abren, navegan con flechas y se seleccionan con Enter/Espacio
- [ ] Cualquier interacción de arrastrar tiene equivalente accesible por teclado (2.5.7)
- [ ] El recorrido crítico completo se pudo terminar de inicio a fin sin tocar el mouse

## C. Lector de pantalla

- [ ] El propósito de cada control se entiende al enfocarlo, sin ver la pantalla
- [ ] Los encabezados permiten navegar la pantalla por su estructura (jerarquía real, no solo visual)
- [ ] Las imágenes informativas se anuncian con su alternativa; las decorativas se omiten
- [ ] Los errores de formulario se anuncian en el momento en que aparecen, sin tener que buscar
- [ ] Los mensajes de éxito, carga y cambios de estado se anuncian sin requerir que el usuario mueva el foco (regiones vivas correctas)
- [ ] Las tablas de datos anuncian encabezado de columna y de fila al navegar celdas
- [ ] Los campos obligatorios se anuncian como obligatorios
- [ ] El nombre anunciado de cada control coincide con su etiqueta visible

## D. Formularios (verificación cruzada con D06)

- [ ] Cada campo anuncia su etiqueta, su estado de error si aplica, y su texto de ayuda
- [ ] El resumen de errores al inicio del formulario es navegable y cada enlace lleva al campo real
- [ ] Ya se verificó que no se repite un dato pedido antes en el mismo proceso, o existe justificación (3.3.7)

## E. Autenticación

- [ ] El flujo de inicio de sesión se completó solo con teclado y lector de pantalla
- [ ] Si hay CAPTCHA u otro reto cognitivo, existe alternativa accesible verificada
- [ ] Copiar y pegar funciona en campos de contraseña y códigos de verificación

## F. Evidencia

- [ ] Grabación o registro paso a paso de la navegación por teclado del recorrido crítico
- [ ] Notas textuales de lo que anunció el lector de pantalla en los puntos críticos (errores, confirmaciones, cambios de estado)

---

## Veredicto

```
APROBADO      — recorrido completo verificado con teclado y lector, sin barreras
CONDICIONAL   — excepciones listadas, con dueño y fecha. Nunca con un P0
RECHAZADO     — vuelve al departamento dueño de la corrección con hallazgos clasificados
```

Firma el revisor (D14), **nunca** quien verificó.
