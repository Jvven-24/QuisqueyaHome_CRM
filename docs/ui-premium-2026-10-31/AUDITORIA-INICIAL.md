# Auditoría independiente · 31/10/2026

Auditor: subagente premium_auditor, solo lectura de producto. Fuentes revisadas en `E:\.viltrum-worktrees\crm-integracion-premium`; navegador sobre `http://127.0.0.1:3000`.

## Identidad del servidor y límites

El proceso padre de Next ejecuta el CLI desde el worktree integración. El hijo resuelve Next desde `quisqueya-crm-b7cee93/node_modules` porque la carpeta de dependencias es una junction. Esto no implica que las vistas procedan del checkout origen. En un contexto de navegador nuevo, `/login` redirige a `/inicio` como administrador mediante acceso local de evaluación del modo development; no se presentó como sesión de producción.

Las fuentes cambiaron por trabajo concurrente durante el recorrido. Esta evidencia describe lo renderizado en el momento y no representa un snapshot inmutable de un commit. La confirmación debe hacerse sobre compilación estable. No se crearon, editaron ni borraron registros de negocio.

## Evidencia

- `output/playwright/premium-baseline/results.json`: 48 visitas a 16 rutas en 320/390/1440.
- `output/playwright/premium-shared-viewport/results.json`: 9 visitas enfocadas a Inicio/Leads/Proyectos; capturas viewport.
- `output/playwright/premium-shared-settled320/overlays.json` y `stacking.json`: formularios y menú Más en 320px.
- Scripts reproducibles en este directorio, sin secretos embebidos. La credencial se carga desde archivo privado externo, sin imprimir valores. El acceso de evaluación local hizo innecesario el login en 3000.

## Hallazgos comunicados

1. **P1 · Apilamiento de modal legacy.** Nuevo Proyecto (`propiedades/_formulario-proyecto.tsx:117–118`) usa `.modal-backdrop` con z-index 40; el dock móvil también z-index 40 y aparece después en DOM. A320x500, `elementsFromPoint(160,475)` devuelve el dock antes que el formulario. El dock tapa la zona inferior del modal. No hay transform/isolation/filter de ancestros que expliquen otro contexto. El principal recibió evidencia y corrige el estilo compartido.
2. **P1 · Formularios propios de Lead/Contacto.** Estos formularios no usan el Modal compartido de `_ui/prototipo-ui.tsx`. A320x500, el contenedor queda correctamente top40/bottom500 tras esperar layout, pero las acciones inicialmente aparecen por debajo del viewport (Lead835–940, Contacto707–812). Se debe confirmar alcance por scroll interno, no inferir pérdida de acción por la posición inicial. Productor comercial comunicó corrección a flex/min-height0/cuerpo scroll/footer fijo, pendiente confirmación estable.
3. **P2 · Proyectos consume el primer viewport con herramientas.** A390x844 no aparece ninguna ficha: cabecera113–285, aviso306–363, filtros380–500, modo518–689 y comparador706–783. Captura `premium-shared-viewport/propiedades-390.png`. La altura de catálogo es10.725px a390 y11.324px a320, con24proyectos. La longitud sola no es un bug, pero la ausencia del primer registro en el viewport y la herramienta en varias filas sí son fricción visible.
4. **P2 · Densidad de listas comerciales.** Leads presentaba6.956px a390 (20tarjetas) y7.716px a320. Tras cambios comerciales se midieron5.503px y6.183px, reducción~21%. No se detectó desbordamiento geométrico de página en esas rutas.
5. **UNKNOWN · Tres renderizados incompletos en dev.** Comunicaciones390 y Reportes390/320 quedaron en skeleton sin h1 y registraron `Invalid or unexpected token`. Coincidieron con HMR y modificaciones concurrentes, sin respuestas HTTP>=400. No se aprueban esos renderizados ni se atribuye causa hasta repetir en build estable.

## Aspectos que sí se observaron correctos

- 45/48 visitas baseline terminaron con h1; ninguna respuesta HTTP>=400.
- Ningún desbordamiento no contenido fue detectado por geometría en las48 visitas. La presencia de `overflow-x:hidden` en el legado limita esa conclusión.
- Al esperar350ms después de resize, todos los modales medidos se ajustaron al alto: top40/bottom500. La primera medición inmediata que daba altura776 en viewport500 fue descartada por lectura sin asentar layout.
- Menú Más: fondo no se desplazó con rueda y Escape cerró al esperar la animación.
- Inicio, Leads y Proyectos en la pasada enfocada cargaron9/9 con h1, sin pageerrors ni overflow detectado.

## Pendiente

Confirmación final en servidor estable del principal: rutas con h1 visible, desktop/móvil, modales con encabezado/footer alcanzables y sin dock por encima, menú Más, comparación y distribución de herramientas. No se declara cierre de ficha, gate, issue ni aprobación de otro proveedor.
