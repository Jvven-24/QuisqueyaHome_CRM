# Checklist — revisión de recorridos críticos

> Se aplica a todo recorrido antes de entregarlo a D05.
> Firma D05, nunca quien diseñó el recorrido.

## A. Selección del recorrido

- [ ] El recorrido corresponde a una tarea que cumple el objetivo medible del proyecto, no a un capricho de cobertura
- [ ] El disparador del recorrido está identificado (qué lo inicia, desde dónde)
- [ ] El criterio de éxito está escrito en una frase verificable, no "el usuario queda contento"

## B. Camino feliz

- [ ] Cada paso referencia una pantalla del inventario, ninguna pantalla inventada sobre la marcha
- [ ] El número de pasos es el mínimo necesario para la tarea, sin pasos decorativos
- [ ] La acción primaria de cada paso es única e inequívoca

## C. Caminos alternos

- [ ] Toda decisión intermedia real del negocio tiene su rama documentada (no solo el camino más común)
- [ ] Los caminos alternos vuelven a converger o terminan en un estado final claro
- [ ] Ninguna rama alterna deja al usuario sin salida

## D. Caminos de error

- [ ] Cada paso tiene su posible fallo identificado (validación, permiso, red, servidor)
- [ ] El mensaje de error de cada fallo está anotado en términos de qué pasó y qué hacer (D06 lo redacta con detalle, pero el punto de fallo se identifica aquí)
- [ ] Ningún camino de error termina en callejón sin salida — siempre hay una acción disponible
- [ ] Se identifica qué se pierde y qué se conserva si el usuario abandona el recorrido a mitad de camino

## E. Heurísticas de Nielsen aplicadas

Por cada recorrido, verificación explícita:
- [ ] Visibilidad del estado del sistema en cada paso
- [ ] Lenguaje del recorrido coincide con el vocabulario del usuario, no con el del sistema
- [ ] Existe salida o cancelación en cada paso donde tiene sentido
- [ ] El mismo tipo de acción se resuelve igual que en otros recorridos del mismo producto
- [ ] El recorrido previene el error antes de tener que explicarlo (validación temprana, confirmación en lo irreversible)
- [ ] El usuario no necesita recordar información de un paso anterior sin que esté visible
- [ ] Existe atajo para el usuario frecuente sin obligar al usuario nuevo a usarlo

## F. Formularios dentro del recorrido

- [ ] Todo formulario del recorrido respeta el presupuesto de 7 campos o está segmentado
- [ ] El recorrido especifica si hay guardado parcial entre pasos de un formulario largo

## G. Cierre

- [ ] El estado final del recorrido es visible y persistente, no solo un mensaje que desaparece
- [ ] Se especifica si la acción final es reversible y cómo

---

## Veredicto

```
APROBADO      — recorrido completo con camino feliz, alterno y de error
CONDICIONAL   — excepciones listadas, con dueño y fecha. Nunca con un P0
RECHAZADO     — vuelve a D04 con hallazgos clasificados
```

Firma el revisor (D05), **nunca** quien diseñó el recorrido.
