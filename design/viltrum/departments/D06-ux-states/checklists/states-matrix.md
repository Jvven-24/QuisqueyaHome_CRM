# Checklist — matriz pantalla × estado

> En F3 se revisa especificación/plan antes de D09; la reproducción real corresponde a F5 tras implementación.
> Firma D14, nunca quien documentó los estados.

## A. Cobertura

- [ ] Toda pantalla del inventario de D04 tiene su fila en la matriz
- [ ] Los seis estados están presentes en cada fila: carga, vacío, error, sin conexión, éxito, permisos
- [ ] Ninguna celda dice "TBD", "pendiente" o queda en blanco
- [ ] Cada estado aplicable enlaza un escenario reproducible, resultado esperado y real, y referencia de evidencia; `N/A` incluye justificación. Clasificar evidencia MSW como mock y distinguirla de backend real (ver plantilla en `../sops/delivery.md`)

## B. Carga

- [ ] Carga inicial usa skeleton con la forma del contenido real, no spinner genérico
- [ ] Carga de acción bloquea doble envío y muestra texto explícito
- [ ] Carga larga (>3-4s esperables) explica qué pasa y ofrece cancelar si es posible
- [ ] Sincronización de fondo no bloquea el resto de la pantalla
- [ ] Si se usa UI optimista, la reversión ante rechazo del servidor es visible y explicada

## C. Vacío

- [ ] Primera vez explica para qué sirve la pantalla y ofrece la acción inicial
- [ ] Lista vacía explica qué falta y cómo crear el primer registro
- [ ] Búsqueda sin resultados conserva los filtros aplicados y sugiere qué cambiar
- [ ] Elemento eliminado o archivado explica el estado y la ruta de recuperación si existe

## D. Error

- [ ] Cada tipo de error posible en la pantalla está identificado (campo, formulario, servidor, timeout, límite de peticiones, parcial, sesión expirada, permisos, 404, 500, mantenimiento, conflicto de edición)
- [ ] Cada mensaje sigue la estructura qué-pasó + qué-hacer
- [ ] **Borradores permitidos por D12 se conservan** ante errores recuperables; secretos y datos inaccesibles tras revocación se excluyen conforme a política, con evidencia
- [ ] Ningún mensaje expone detalle técnico interno (stack trace, nombre de tabla, excepción cruda)
- [ ] El código de referencia existe para errores de servidor, sin exponer información sensible

## E. Sin conexión

- [ ] Página o estado propio, no el error genérico del navegador
- [ ] Se muestra cuándo fue la última sincronización exitosa
- [ ] Si aplica cola offline, es visible qué queda pendiente y cuándo se enviará

## F. Éxito

- [ ] Confirmación específica, no solo un color o un ícono
- [ ] Se ofrece deshacer si la acción es reversible
- [ ] Confirmación reforzada si la acción fue irreversible o de alto impacto
- [ ] El estado final es visible y persistente, no un mensaje que desaparece solo

## G. Permisos

- [ ] Sin permiso de lectura: no se muestra, o se muestra deshabilitado con explicación
- [ ] Sin permiso de acción: deshabilitado con razón visible, nunca falla después de intentar
- [ ] Permiso revocado en sesión: la interfaz se degrada sin romperse
- [ ] **Verificado que el permiso se controla también en el servidor**, no solo ocultando el botón

## H. Reproducción real (F5, pendiente durante F3)

- [ ] Al menos un error de servidor fue provocado y observado en un entorno real, no solo documentado
- [ ] La sesión expirada fue provocada y se verificó recuperación del borrador permitido sin persistir secretos
- [ ] El estado sin conexión fue probado desconectando la red de verdad

---

## Veredicto

```
APROBADO      — matriz completa, mensajes reales, verificación reproducida
CONDICIONAL   — excepciones listadas, con dueño y fecha. Nunca con un P0
RECHAZADO     — vuelve a D06 con hallazgos clasificados
```

Firma el revisor (D14), **nunca** quien documentó los estados.
