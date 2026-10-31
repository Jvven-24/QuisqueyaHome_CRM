# D09 · Metas y Avances

31/10/2026. Segunda pasada acotada despachada por principal sobre G22 READY. Solo `metas/vista.tsx` y `avances/vista.tsx`; no datos, APIs ni cálculos.

## Cambios

- Metas: lectura compacta de cierres, porcentaje y monto/objetivo con definición semántica y reflow; acciones móviles que se distribuyen; periodo táctil. Ranking y metas actuales quedan antes de la línea base y comparativa mensual, conservadas en Accordion Radix con títulos explícitos. Nombres de equipos largos pueden envolver.
- Avances: proyecto y controles de supervisión distribuidos con base mínima, progreso semántico y sin gradiente; fases compactas con títulos completos; selectores de evidencia Antes/Después en columnas adaptables. Galería con acciones visibles en tacto y al entrar con teclado, objetivos táctiles y sin zoom al hover; zona de carga accesible por Enter/Espacio, mismo selector/handler de carga. Metadatos pueden envolver.

## Impacto y comprobación

GitNexus upstream MetasVista y AvancesVista: LOW, 0 consumidores/procesos/módulos indexados. Se advierte que JSX no está completo; alcance visual real: ambas vistas. Comprobación sintáctica TypeScript: 0 errores en ambas; `git diff --check`: limpio. Sin build/dev/pruebas globales ni commits.

## Pendiente de revisión independiente

Abrir/cerrar historial y conservar datos/acciones; periodos Metas, ranking y forms existentes. En Avances: selector de proyecto, fases largas, ambos selectores de fotos, foco/visibilidad de ver/eliminar foto y carga por teclado sin enviar archivos de prueba reales. Revisar 320/390/768/1440, permisos y estados vacíos. No se marca L4 ni se declara QA visual realizada por el productor.
