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

Fuente: Nielsen Norman Group, [“10 Usability Heuristics for User Interface Design”](https://www.nngroup.com/articles/ten-usability-heuristics/). Por cada recorrido, registra cada heurística por separado con hallazgo (o «sin hallazgo»), severidad, evidencia/localizador, decisión y estado (pendiente, en curso, resuelto o aceptado con motivo). Usa la escala de severidad 0–4 de NN/g: 0 = no es un problema de usabilidad; 1 = problema cosmético; 2 = problema menor; 3 = problema mayor; 4 = catástrofe de usabilidad.

Plantilla (una fila por heurística):

| Heurística | Hallazgo | Severidad 0–4 | Evidencia | Decisión | Estado |
|---|---|---:|---|---|---|
| 1. Visibilidad del estado del sistema |  |  |  |  |  |
| 2. Correspondencia entre el sistema y el mundo real |  |  |  |  |  |
| 3. Control y libertad del usuario |  |  |  |  |  |
| 4. Consistencia y estándares |  |  |  |  |  |
| 5. Prevención de errores |  |  |  |  |  |
| 6. Reconocimiento antes que recuerdo |  |  |  |  |  |
| 7. Flexibilidad y eficiencia de uso |  |  |  |  |  |
| 8. Diseño estético y minimalista |  |  |  |  |  |
| 9. Ayudar a reconocer, diagnosticar y recuperarse de errores |  |  |  |  |  |
| 10. Ayuda y documentación |  |  |  |  |  |

Criterios operativos para orientar la revisión:
- **1. Visibilidad del estado:** verifica que el usuario conozca el estado del sistema en cada paso.
- **2. Correspondencia:** comprueba que el lenguaje del recorrido coincida con el vocabulario del usuario, no con el del sistema.
- **3. Control y libertad:** confirma que exista salida o cancelación en cada paso donde tiene sentido.
- **4. Consistencia:** comprueba que el mismo tipo de acción se resuelva igual que en otros recorridos del producto.
- **5. Prevención de errores:** verifica que el recorrido prevenga el error antes de tener que explicarlo (validación temprana, confirmación en lo irreversible).
- **6. Reconocimiento:** comprueba que el usuario no necesite recordar información de un paso anterior sin que esté visible.
- **7. Flexibilidad y eficiencia:** confirma que exista un atajo para el usuario frecuente sin obligar al usuario nuevo a usarlo.
- **8. Diseño minimalista:** comprueba que cada información o acción mostrada sea pertinente al objetivo del paso.
- **9. Recuperación de errores:** verifica que los errores expliquen qué ocurrió y permitan retomar la tarea.
- **10. Ayuda y documentación:** comprueba que la orientación necesaria esté disponible y sea localizable cuando el usuario la necesite.

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
