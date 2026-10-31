# UI premium · refinamiento del sistema existente

Orden directa de Wilber (31/10/2026): mejorar sistema de diseño, distribución, fluidez y funcionalidad conservando la base completa de 3460. Destino: rama `codex/integracion-premium`; no se aplica a otro checkout ni a servicios remotos.

Contratos vigentes: G20 READY (cabeceras, pestañas y secciones), G22 READY (controles, avisos, KPI compactos y reflow), M41 READY CA6 (320–1440 sin cortes). Diseño: `docs/DESIGN.md`. Nivel de entrega L3 hasta validación; no cerrar fichas ni gates.

## Reparto de archivos

- Principal: componentes compartidos `src/components/modulo/**`, `src/components/ui/dialog.tsx`, `sheet.tsx`, `sonner.tsx`, `_ui/prototipo-ui.tsx`, `_ui/mobile-dock.tsx`, CSS compartido y su importación. Sin cambios de datos, auth o permisos.
- Soporte de verificación local: `src/components/ui/run-src-tests.mjs` transmite las opciones solicitadas al runner Node (concurrencia acotada); `.gitignore`, `eslint.config.mjs` y `tsconfig.json` excluyen salidas aisladas de Next para evitar analizar código generado.
- Comercial: `inicio/vista.tsx`, `leads/vista.tsx`, `contactos/vista.tsx` y sus componentes visuales; conservar cambios locales previos.
- Operativo: vistas y componentes visuales de `agenda/`, `brokers/`, `reportes/`, `comunicaciones/`. No editar consultas, payloads o cálculos.
- Segunda pasada acotada: comercial evalúa `academy/` y `aprobaciones/`; operativo evalúa `metas/` y `avances/`, solo vistas/componentes de presentación existentes bajo G20/G22; sin añadir capacidades ni ocultar contenido o avisos.
- Corrección del catálogo tras evidencia móvil: principal ajusta únicamente etiquetas y selector de vista en `propiedades/_componentes/catalog-explorer.tsx` (G20/G22; impacto previo CatalogExplorer LOW0 con límite JSX). Se conserva el resto del trabajo local concurrente.
- Corrección P1 de reflow confirmada en revisión final: `components/ui/phone-input.tsx`, solo ancho del selector y flex de entrada, tokens de ayuda/éxito. Impacto PhoneInput LOW0 (montaje real en formularios compartidos). Sin cambios de máscara, validación o valores enviados.
- Corrección de nota recortada observada en Inicio: `components/ui/resumen-compacto.tsx` muestra íntegro el detalle del KPI. Impacto intentado: símbolo no indexado; alcance real compartido en resúmenes, solo eliminación de truncado.
- Auditor: solo lectura; capturas y evidencia en este directorio o output, sin escrituras de negocio.

Cada productor ejecuta impacto GitNexus antes de modificar símbolos. El índice no prueba aislamiento JSX. No build/dev/commit por productores. Principal gestiona compilación local aislada y comprobaciones. No depender de proveedores sin autenticación. Revisión cruzada explícita; no atribuir una aprobación a otro proveedor sin su intervención.

## Aceptación

Jerarquía coherente, herramientas que se distribuyen sin solapamiento, campos y controles táctiles utilizables, diálogos contenidos en la altura disponible, avisos completos, movimiento reducido respetado. Verificar rutas representativas a 320/390/768/1440 y flujos de abrir/cerrar/filtro/selección sin modificar datos de negocio. Tipos, lint, suite y build; documentar limitaciones y métricas. Mantener avisos de vista previa y fallos de servicios. No añadir capacidades nuevas bajo apariencia de diseño.
