# Checklist — auditoría WCAG 2.2 AA

> Se aplica a toda pantalla antes de cerrar Gate G3 o Gate G5.
> Firma D14, nunca quien auditó.
> El escáner automático solo, nunca cierra esta checklist.
> Es una lista operativa parcial: la matriz normativa del SOP registra todos los criterios aplicables A/AA. Aprobar proceso con excepciones no equivale a conformidad WCAG.

## A. Perceptible

- [ ] 1.1.1 — Toda imagen informativa tiene alternativa textual equivalente; decorativas marcadas como tales
- [ ] 1.3.1 — La estructura semántica (encabezados, listas, tablas, etiquetas) coincide con la estructura visual
- [ ] 1.3.2 — El orden de lectura/navegación tiene sentido cuando se linealiza
- [ ] 1.4.1 — Ningún estado o información se transmite solo por color
- [ ] 1.4.3 — Contraste de texto normal ≥ 4.5:1, texto grande ≥ 3:1 — **medido, no estimado**
- [ ] 1.4.4 — Zoom del navegador a 200% sin pérdida de contenido ni función
- [ ] 1.4.5 — Texto real en vez de imágenes de texto, salvo excepción justificada
- [ ] 1.4.10 — Reflow a ~320px CSS de ancho sin scroll horizontal en contenido de lectura
- [ ] 1.4.11 — Contraste de componentes de interfaz y gráficos informativos ≥ 3:1

## B. Operable

- [ ] 2.1.1 — Toda funcionalidad disponible completa por teclado
- [ ] 2.1.2 — Ningún control atrapa el foco sin salida
- [ ] 2.1.4 — Atajos de un solo carácter desactivables o remapeables
- [ ] 2.3.1 — Ningún contenido parpadea más de 3 veces por segundo
- [ ] 2.3.3 **AAA / práctica del proyecto** — Animaciones disparadas por interacción respetan `prefers-reduced-motion`; no contarlo como criterio AA
- [ ] 2.4.3 — Orden de foco lógico y predecible
- [ ] 2.4.6 — Encabezados y etiquetas describen tema o propósito
- [ ] 2.4.7 — Foco visible en todo elemento interactivo
- [ ] **2.4.11 (nuevo 2.2)** — El componente con foco no queda totalmente oculto por contenido creado por el autor; 2.4.12 AAA exige que ninguna parte quede oculta
- [ ] **2.5.7 (nuevo 2.2)** — Toda acción de arrastre tiene alternativa de un solo puntero
- [ ] **2.5.8 (nuevo 2.2)** — Objetivos táctiles ≥ 24×24 px CSS, o excepción válida documentada

## C. Comprensible

- [ ] 3.2.3 — Navegación consistente entre pantallas del mismo tipo
- [ ] **3.2.6 (nuevo 2.2)** — Mecanismo de ayuda en la misma ubicación relativa en toda la app
- [ ] 3.3.1 — Errores identificados en texto, no solo color o ícono
- [ ] 3.3.2 — Etiquetas o instrucciones presentes en todo campo que las necesita
- [ ] 3.3.3 — Sugerencia de corrección cuando se conoce el error
- [ ] 3.3.4 — Confirmación y oportunidad de corregir antes de acciones legales, financieras o de datos irreversibles
- [ ] **3.3.7 (nuevo 2.2)** — No se repite un dato ya ingresado en el mismo proceso, sin justificación
- [ ] **3.3.8 (nuevo 2.2)** — Autenticación no depende solo de prueba cognitiva sin alternativa

## D. Robusto

- [ ] 4.1.2 — Nombre, rol y valor programáticos correctos en todo componente interactivo
- [ ] 4.1.3 — Mensajes de estado se anuncian a tecnología asistiva sin requerir foco

## E. Origen de la verificación

- [ ] Cada ítem marcado indica si se verificó automático, manual, o ambos
- [ ] Se declara explícitamente qué quedó "no verificado" y por qué

---

## Veredicto

```
APROBADO      — checklist completa, automático + manual, sin P0 abiertos
CONDICIONAL   — excepciones listadas, con dueño y fecha. Nunca con un P0
RECHAZADO     — vuelve al departamento dueño de la corrección con hallazgos clasificados
```

Firma el revisor (D14), **nunca** quien auditó.
