# Checklist — revisión de UI

> La firma D07, nunca quien diseñó.

## A. Fundaciones

- [ ] Escala tipográfica cerrada — ningún tamaño fuera de la escala
- [ ] Escala de espaciado — ningún margen o relleno fuera del ritmo
- [ ] Color semántico con nombre por función, no por tono
- [ ] Conjunto corto de radios, bordes y sombras
- [ ] Máximo tres duraciones de movimiento
- [ ] Modo claro y oscuro definidos a la vez
- [ ] **Ningún valor literal en pantalla — todo pasa por token**

## B. Componentes

- [ ] Todas las variantes necesarias, ninguna especulativa
- [ ] Estados de interacción: reposo, hover, **foco visible**, activo, deshabilitado, cargando
- [ ] El foco visible existe y **no fue eliminado**
- [ ] Comportamiento idéntico en todas las pantallas donde aparece
- [ ] Inventario de componentes reutilizados vs creados, con razón de cada creación

## C. Composición

- [ ] Jerarquía de máximo tres niveles
- [ ] Una sola acción primaria por pantalla, inequívoca
- [ ] Densidad justificada por la tarea, no por costumbre
- [ ] Alineación consistente — nada a la deriva
- [ ] Nada decorativo sin función

## D. Estados (los seis)

Por cada pantalla:
- [ ] **Carga** — skeleton con la forma del contenido, no un spinner genérico
- [ ] **Vacío** — explica para qué sirve y ofrece la acción inicial
- [ ] **Error** — mensaje específico, lo escrito se conserva
- [ ] **Sin conexión** — página propia, no el error del navegador
- [ ] **Éxito** — confirmación específica, estado final visible
- [ ] **Permisos** — deshabilitado con razón visible, no falla después de intentar; acciones y obligatorios según R1–R2 de `core/doctrine/ux-states.md` § "Contrato de retroalimentación de acciones y formularios"

- [ ] Los mensajes son texto real, no "TBD"
- [ ] Matriz pantalla × estado completa

## E. Formularios

- [ ] `checklists/form-design.md` aprobada en cada formulario

## F. Responsive

Verificado y capturado en:
- [ ] 320 y 390 px — los que más duelen
- [ ] 430 px
- [ ] 768 px
- [ ] 1024 px
- [ ] 1440 px

- [ ] Sin desbordamiento horizontal en ningún punto
- [ ] Texto legible sin acercar
- [ ] Objetivos táctiles alcanzables
- [ ] La acción primaria es alcanzable con el pulgar en móvil

## G. Accesibilidad básica (D07 profundiza)

- [ ] Contraste verificado automáticamente
- [ ] Navegación completa solo con teclado
- [ ] Orden de tabulación lógico
- [ ] Ningún estado comunicado solo por color
- [ ] Imágenes con texto alternativo o marcadas como decorativas
- [ ] El movimiento respeta la preferencia de movimiento reducido

## H. Contenido

- [ ] Sin texto de relleno
- [ ] Mensajes de error redactados, no genéricos
- [ ] Textos de botón que dicen qué hacen, no "Aceptar"
- [ ] Números, fechas y moneda con el formato local correcto

---

## Veredicto

```
APROBADO      — checklist completa
CONDICIONAL   — excepciones con dueño y fecha. Nunca con P0
RECHAZADO     — vuelve al diseño con hallazgos clasificados
```
