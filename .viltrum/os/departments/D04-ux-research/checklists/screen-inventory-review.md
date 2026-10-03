# Checklist — revisión de inventario de pantallas y sitemap

> Se aplica a todo inventario antes de que D05 empiece a diseñar.
> Firma D05, nunca quien inventarió.

## A. Cobertura del inventario

- [ ] Todas las pantallas del módulo están listadas, no solo las pedidas explícitamente
- [ ] Cada pantalla tiene propósito resumido en una sola frase
- [ ] Ninguna pantalla mezcla dos tareas distintas bajo un mismo propósito
- [ ] Pantallas de administración/configuración del módulo están incluidas, no solo las de uso diario
- [ ] Pantallas de los seis estados (carga, vacío, error, sin conexión, éxito, permisos) están contempladas como parte de la misma pantalla, no como pantallas aparte olvidadas

## B. Patrón de vista

- [ ] Cada pantalla tiene un patrón asignado: lista, detalle, formulario, asistente, dashboard, configuración o vacío inicial
- [ ] El patrón asignado coincide con la tarea real, no con lo que es más fácil de construir
- [ ] Pantallas con patrón "dashboard" tienen cada métrica ligada a una decisión o acción

## C. Matriz pantalla × rol

- [ ] Todo rol del catálogo de negocio aparece como columna
- [ ] Ninguna celda está vacía sin marcar explícitamente "no ve"
- [ ] Las celdas distinguen "ve" de "ve y actúa" — no son binarias
- [ ] Ningún rol tiene una acción disponible que las reglas de negocio no le permiten
- [ ] Las celdas de "permiso insuficiente" están anotadas para que D06 les dé mensaje y D07 verifique que no dependen solo del cliente

## D. Sitemap y navegación

- [ ] Ninguna pantalla del inventario queda huérfana (sin entrada o sin salida en el sitemap)
- [ ] Profundidad de navegación ≤ 3 niveles antes de llegar a una pantalla de tarea
- [ ] Existe breadcrumb o equivalente en toda jerarquía de más de 2 niveles
- [ ] Búsqueda global presente si el inventario supera ~15 pantallas
- [ ] La navegación primaria y la contextual están diferenciadas explícitamente

## E. Formularios del inventario

- [ ] Todo formulario con más de 7 campos aparece ya segmentado en pasos o pestañas
- [ ] La segmentación agrupa por significado, no por tipo de dato
- [ ] Cada formulario segmentado especifica si tiene guardado parcial

## F. Preguntas abiertas

- [ ] Toda regla de negocio sin definir que afecta el inventario está escalada a D01/D02, no supuesta
- [ ] Las preguntas abiertas están registradas con su identificador y a quién bloquean

---

## Veredicto

```
APROBADO      — inventario y sitemap completos, sin pantallas huérfanas ni supuestos
CONDICIONAL   — excepciones listadas, con dueño y fecha. Nunca con un P0
RECHAZADO     — vuelve a D04 con hallazgos clasificados
```

Firma el revisor (D05), **nunca** quien hizo el inventario.
