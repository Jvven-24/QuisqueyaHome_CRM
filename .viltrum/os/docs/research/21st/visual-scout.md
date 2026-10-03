# Investigación visual de componentes 21st

Fecha: 2026-09-30. Productor: subagente `design_visual_scout`, rol D21.
Clasificación: investigación para CAMBIO_UI de consola interna R2. Esta entrega
compara referencias; no aprueba la implementación ni gates de cliente.

## Evidencia obtenida

Se inspeccionaron dos páginas oficiales y sus previews visibles mediante CUA.
Las capturas son evidencia acotada solicitada por el usuario; no se creó un mirror,
un crawler ni un conjunto para entrenamiento. No hubo publicación, pago ni instalación
de dependencias de los candidatos.

| Candidato | Fuente oficial | Evidencia local |
|---|---|---|
| Dashboard Sidebar, Arun Dass, id 14941 | https://21st.dev/@arunjdass/components/dashboard-sidebar | `output/design-review/21st-dashboard-sidebar.png`, `21st-sidebar-preview.png` |
| App Dashboard Layout, shadcnstore, id 28770 | https://21st.dev/@shadcnstore/components/app-1 | `output/design-review/21st-app-dashboard-layout.png`, `21st-app-preview.png`, `21st-app-full.png` |

El código de Sidebar ya había sido recuperado por la CLI oficial en
`output/21st/dashboard-sidebar.json`; no se volvió a consumir una recuperación.
Las búsquedas oficiales `21st search` con nombre y autor devolvieron otros resultados
relevantes, pero no confirmaron estos dos IDs en sus primeras tres posiciones.
La identidad visual se confirmó en las páginas exactas y, para Sidebar, en el JSON
ya disponible. El id 28770 fue proporcionado por la investigación coordinadora y no
se volvió a acreditar mediante una recuperación de código.

## Decisión recomendada

Adaptar el shell de Sidebar y la jerarquía de información de App Dashboard Layout
a los componentes HTML nativos de Viltrum. La consola no necesita migrar a React
para aplicar estos patrones. La fuente de verdad continúa siendo la API local.

| Necesidad del operador | Patrón aprovechable | Condición PXIL |
|---|---|---|
| Ubicar el proyecto y la sección actuales | Selector persistente, navegación lateral agrupada y elemento activo | El proyecto seleccionado debe cambiar el contexto completo y mantener feedback claro |
| Conocer qué sucede ahora | Cuatro contadores de resumen y actividad reciente | Cada cifra debe derivar de registros reales, con fecha de actualización y estado sin datos |
| Examinar un departamento sin perder el conjunto | Directorio compacto más inspector lateral | Selección visible, foco estable, permiso y herramientas declaradas separados de las conectadas |
| Comprender una ejecución | Lista legible con estado, actor y detalle progresivo | Productor y revisor distinguibles; evidencia y bloqueos accesibles |
| Relacionar capacidad con diseño | Ficha de skills y recursos PXIL | Referencia documental no equivale a permiso ni herramienta ejecutable |

No se recomienda copiar la gráfica de rendimiento de App Dashboard Layout: sus
ocho semanas y porcentajes son datos de demostración. Viltrum puede mostrar una
gráfica cuando disponga de una serie temporal y una definición de métrica verificables.
Tampoco se deben trasladar sus personas, avatares, proyectos o actividad de ejemplo.

## Hallazgos observados

1. **Semántica de Sidebar:** el árbol accesible del preview muestra opciones de
   navegación como texto; una consulta DOM acotada encontró un único `button`, sin
   nombre accesible ni texto. El selector de workspace recuperado utiliza un `div`
   con `onClick`. Su adopción literal requeriría corregir controles y teclado.
   En Viltrum deben conservarse enlaces, botones, nombres y foco semánticos.
2. **Composición de Sidebar:** el contenido principal es un esqueleto ilustrativo.
   La captura demuestra distribución y espaciado, no una pantalla operativa terminada.
3. **App Dashboard Layout:** presenta una composición más completa de contadores,
   gráfico, progreso y actividad. En el árbol observado la navegación son enlaces
   y las barras de proyecto tienen nombres accesibles. Esto no sustituye una
   auditoría de teclado, contraste o estados alternativos.
4. **Dependencias declaradas:** Sidebar muestra `lucide-react`; App Dashboard Layout
   muestra `recharts` y `lucide-react`. Ninguna fue añadida al SDK por esta investigación.

## Contrato de revisión para la adaptación

La dirección visual debe conservar el recorrido de PXIL: requisito → flujo → pantalla
→ estado → evento → permiso/dato/API → prueba. Primero se decide la tarea del operador;
después se elige el componente. D05 compone, D06 especifica estados, D07 revisa acceso,
D09 implementa cuando procede y D14 verifica de forma independiente.

La revisión de la pantalla propia debe incluir: carga, vacío, error, sin conexión,
éxito y permiso insuficiente; selección de proyecto; búsqueda de departamentos;
inspector; navegación por teclado; ancho reducido; fuente y fecha de cada estado.
Una captura de catálogo no acredita ninguno de esos comportamientos en Viltrum.

## Límites de esta entrega

Se capturaron previews en el viewport de escritorio disponible (aproximadamente
1280 × 720) y una vista de página completa del segundo candidato. No se validaron
breakpoints móviles ni se ejecutaron los seis estados de los componentes de catálogo.
No se revisaron términos de licencia completos para redistribuir su código: la
recomendación es una adaptación de patrones, sin distribuir estos componentes.
El subagente no modificó dashboard, runtime ni permisos.

Se ejecutó también `21st review templates/dashboard.html --json`: 1 archivo,
0 errores, 0 advertencias y 0 sugerencias. Recibo en
`output/design-review/21st-static-review-scout.json`. Es revisión estática del
archivo observado durante trabajo concurrente; no certifica versiones posteriores
ni reemplaza la revisión visual y funcional de la consola.
