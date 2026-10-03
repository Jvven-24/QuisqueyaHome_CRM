# Revisión independiente de consola — 2026-09-30

Revisor: subagente `console_visual_reviewer`; sin participación en la implementación. Alcance: UI local en `http://127.0.0.1:8765/#departments`, contexto `.21st/design.json`, patrón Dashboard Sidebar y metodología PXIL. Clasificación: CAMBIO_UI, sistema interno R2. No implica aprobar gates de cliente.

## Evidencia observada

- `21st review templates/dashboard.html --json`: 1 archivo, 0 errores, 0 avisos, 0 sugerencias. Este resultado del analizador no acredita por sí solo accesibilidad completa.
- Directorio: 23 perfiles, 9 con PXIL. Búsqueda `D05`: 1 resultado. Inspector muestra UI premium y sistema de diseño, revisor D07, 12 skills y 4 tools declaradas.
- Callout PXIL visible antes de los metadatos operativos; cadena REQ → MOD → FLOW → SCR → STA → EVT → API / DATA / PERM → TST.
- `Recursos y procedencia` se expande con Enter. Muestra fuente VILTRUM DESING, snapshot 2026-09-30, entrypoint, plantilla, referencia, procedencia y `runtimeAccessGranted: false`.
- Diferencia explícita entre metodología disponible y acceso del ejecutor. No se simula una sesión D05: muestra «Sin dispatch registrado para este departamento».
- Navegación se contrae con Enter y cambia `aria-expanded` a false. Defecto de nombre accesible encontrado abajo.
- Móvil 390 × 844: sin desbordamiento horizontal del documento (`scrollWidth=clientWidth=390`). Barra de navegación conserva desplazamiento interno; cards e inspector se apilan. Foco visible en buscador. Viewport restaurado al terminar.

## Capturas reales

- [D05 escritorio](../../../output/design-review/console-d05-desktop.png)
- [D05 móvil](../../../output/design-review/console-d05-mobile.png)
- [D05 móvil completo](../../../output/design-review/console-d05-mobile-full.png)

- [Directorio PXIL final con D05 seleccionado](../../../output/design-review/console-pxil-final.png)

## Hallazgos corregidos y revalidados

1. **P2 — nombre accesible ausente en navegación compacta.** Al ocultar los labels, los seis botones pasan a aparecer sin nombre en el árbol accesible. Referencia: `templates/dashboard.html`, navegación y estilos `.compact`. Solución sugerida: `aria-label` permanente en cada botón. **Cerrado por el revisor:** tras reinicio y recarga, los seis botones conservan nombres accesibles en modo compacto; probado con Enter.
2. **P2 — selección visual y semántica no representa el inspector automático.** Al filtrar D05 aparece su ficha, pero tarjeta conserva `aria-pressed=false`. Referencia: `templates/dashboard.html`, función `departmentsView` (línea 74 al revisar). **Cerrado por el revisor:** tras reinicio y recarga, búsqueda D05 devuelve un resultado, el inspector muestra D05 y su tarjeta expone `aria-pressed=true`.

## Límites

Revisión dirigida, no suite ni auditoría WCAG exhaustiva. No se probaron todos los estados offline/error o permisos. Capturas desktop/móvil corresponden al funcionamiento real de la consola, no a una ejecución remota del componente original 21st. El bootstrap del plugin browser-use no pudo inicializar el bridge; la captura se realizó mediante CUA documentado en una pestaña creada por el revisor. No se instaló software ni se cambió código o configuración de servicios.

## Resultado

Sin hallazgos bloqueantes abiertos en el alcance inspeccionado. Se revalidaron independientemente las dos correcciones. Filtro `viltrum-pxil-design`: 9 perfiles; selección explícita D05 refleja borde activo y ficha correcta. Captura final guardada después de las correcciones. No implica una certificación de accesibilidad completa.
