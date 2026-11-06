# Estrategia de interacción · Quisqueya Home

## Objetivo
El broker debe reconocer dónde está, encontrar el siguiente trabajo y actuar sin atravesar resúmenes, plantillas o ajustes secundarios. Se conserva la identidad Private Desk: superficies claras, navegación azul marino y dorado reservado a acciones/selección. Una interfaz sofisticada proviene de organizar bien la información, no de añadir efectos.

## Anatomía compartida
1. Título y una acción principal. Contexto breve, sin referencias a repositorios ni lenguaje de implementación.
2. Vistas con nombres de tarea: Lista, Tablero, Calendario, Equipo o Datos. Cambiar representación conserva filtros y registros.
3. Búsqueda visible, filtros frecuentes juntos; secundarios agrupados bajo un control explícito, con estado activo y restablecimiento completo.
4. Trabajo principal. La tabla compara atributos; la tarjeta ayuda a elegir un inmueble; el tablero muestra progreso; el calendario asigna tiempo. No forzar cuadrículas de tamaño fijo en todos los módulos.
5. Detalle bajo demanda: inspector, fila expandida o formulario con foco protegido. Acciones disponibles según permisos reales.

## Contratos por componente
| Componente | Escritorio | Teléfono | Comportamiento |
|---|---|---|---|
| Filtro | Campo con etiqueta y valor, grupos coherentes | Selector de plataforma o panel revelable; objetivo >=44 px | Restablecer elimina todos los criterios; mostrar resultado vacío útil |
| Selección | Controles discretos en filas/tarjetas; acciones al seleccionar | Contador y acción junto al contenido, fuera del dock | Misma selección entre vistas; límite explícito |
| Comparación | Bandeja contextual y tabla de atributos alineados | Comparar dos productos visibles; cambiar el tercero sin microcolumnas | Quitar/vaciar/cerrar no elimina productos; datos ausentes como no disponibles |
| Kanban | Columnas proporcionadas, título/contador/importe por divisa | Etapa activa y tarjetas completas | Arrastre opcional, menú Mover disponible; confirmaciones existentes intactas |
| Tarea | Próxima acción, plazo, responsable y vínculos | Fila/card breve; checklist y detalles bajo demanda | Trabajo antes de métricas y plantillas; permisos/offline evidentes |
| Calendario | Vista temporal para planificar; lista para ejecutar | Agenda diaria/lista, navegación de fecha táctil | Seleccionar/editar conserva duración y validación de conflictos |
| Gráfico | Forma apropiada al dato; leyenda interactiva | Gráfico contenido y alternativa Datos | Valores completos, unidades, categorías y resumen accesibles |
| Aviso temporal | Máximo3 y cierre dentro del aviso | Debajo del encabezado, sin cubrir navegación inferior | Expira; duplicados se actualizan; errores operativos permanecen en contexto |
| Bandeja | Panel persistente con Todas/Sin leer/Actualizar | Ancho contenido, scroll interno y cierre44px | No confundir leído con eliminado; recuperar errores sin vaciar contenido |

## Barrido por módulos
| Área | Decisión de estructura | Situación de esta pasada |
|---|---|---|
| Inicio/Reportes/Metas | Indicadores compactos, gráficos con acceso a datos | Componente MetricChart compartido, revisión representativa |
| Leads | Búsqueda y filtros; jerarquía de identidad, estado, próxima acción | Productor comercial |
| Negocios | Tablero/lista/análisis; búsqueda visible y reset completo | Productor comercial, bug reproducido |
| Tareas | Lista/tablero/equipo/plantillas separados; resumen secundario | Productor operativo, rediseño estructural |
| Agenda | Contexto inmobiliario claro, sin REA | Productor operativo; controles comunes |
| Propiedades/Comparación | Selección -> bandeja -> comparación por atributos | Propuesta definida; archivos reservados por agente externo |
| Configuración | Navegación de categorías, formularios por contexto; acciones cercanas | Fuente reservada por agente externo; recibe controles comunes |
| Contactos/Brokers | Listas de personas, filtros y acciones compactos | Refinamiento anterior y controles comunes |
| Academy/Avances/Aprobaciones | Contenido principal antes de informes secundarios | Refinamiento anterior; conservar avisos de simulación |
| Comunicaciones/Comisiones | Estado real y formularios progresivos | Controles/avisos comunes; no alterar envíos o cálculos |

## Movimiento y rendimiento
Interacciones de140–220ms, sin entradas escalonadas ni animación que retrase operaciones. Respetar movimiento reducido. Reutilizar Radix, Sonner, Recharts y dnd-kit instalados; no sumar otra biblioteca. Notificaciones consultan solo en primer plano y al recuperar foco/conexión; abortar peticiones antiguas evita carreras. No se atribuye mejora de velocidad sin benchmark controlado.

## Límites funcionales explícitos
La bandeja usa GET/PATCH autenticados existentes y las20notificaciones más recientes. No hay service worker ni suscripciones Web Push: los avisos nuevos de esta pasada funcionan mientras el CRM está abierto. Push con app cerrada requiere especificar y acreditar suscripción, claves, worker y entrega del servidor. Las pantallas de vista previa conservan su advertencia y no se convierten en funciones persistentes por cambiar el diseño.

## Referencias contrastadas
- Android [canonical layouts](https://developer.android.com/develop/ui/compose/layouts/adaptive/canonical-layouts): lista/detalle simultáneos con espacio, navegación entre ambos en compacto.
- Carbon [Data Table](https://www.carbondesignsystem.com/building-blocks/core/components/data-table/guidelines): toolbar, filtros, acciones en lote y expansión contextual.
- Linear [Issue selection](https://linear.app/changelog/issue-selection): coherencia de selección entre listas y tableros; referencia visual, no copia de marca.

Estas referencias orientan la distribución. Las reglas de negocio, los textos de operación y los datos los define el CRM.
