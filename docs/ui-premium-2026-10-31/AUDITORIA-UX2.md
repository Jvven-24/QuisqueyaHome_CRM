# Auditoría UX2 · evidencia independiente

Auditor: premium_auditor, solo lectura de producto. Contrato: TAREA-UX2.md y specs/ux-operativa-20261031/spec.md READY. No se tocaron fuentes, git, build, dev ni datos de negocio. Se escribieron únicamente scripts, capturas e informes.

## Baseline breve · versión estable9303

`output/playwright/premium-ux2-baseline/results.json`: 8 visitas a Leads, Negocios, Tareas y Agenda en390/1440, todas200, contenido visible, sin pageerrors ni overflow no contenido detectado. Capturas viewport por ruta/ancho en el mismo directorio. Son capturas de la compilación ya servida, anteriores a los cambios UX2.

### Seis hallazgos prácticos

1. **Negocios · Limpiar filtros deja criterios avanzados activos.** Reproducción: abrir `/negocios?resultado=open&q=__QA_NO_MATCH__&sinAccion=1`, pulsar «Limpiar filtros». Resultado: URL queda `?q=__QA_NO_MATCH__&sinAccion=1`; la búsqueda y «sin próxima acción» siguen filtrando. Se comunicó al productor comercial. Evidencia `interactions.json`. No hubo escrituras API.
2. **Tareas · el primer registro queda fuera del primer viewport.** A390x844, cabecera/navegación de vistas, acciones y5KPI consumen el área inicial; no se ve la tarea antes de desplazarse. La captura `tareas-390.png` muestra el problema. Longitud de documento2889px con1tarea activa; escritorio1504px. Prioridad visual: resumen compacto y controles secundarios plegables.
3. **Tareas/Agenda · REA filtra vocabulario interno a UI.** Baseline Tareas muestra2textos: «Playbooks REA (8)» y «Con evidencia REA». Agenda inicial no lo muestra en el contenido abierto, pero el formulario de cita contiene título/etiquetas REA en el fuente. No se afirma persistencia ni ausencia total de REA sin el pase final.
4. **Campana · no hay actualización accesible en estado normal.** Baseline vacío muestra una bandeja sin botones Actualizar/Cerrar; la carga del header depende del montaje y reintento de error, no de nuevas llegadas mientras se permanece en una ruta. Source `crm-header.tsx`, efecto inicial. Abrir la campana no modificó datos.
5. **Notificaciones · no hay página `/notificaciones` ni push de sistema implementado.** Ruta comprobada404; la bandeja disponible es el popover. Búsqueda de PushManager/serviceWorker/web-push/VAPID/notificationclick no encontró implementación; solo existe manifest público yAPI GET/PATCH. En el contexto aislado del auditor se observaron0registrosServiceWorker. El permisoNotification del contexto headless es denied; no se extrapola al navegador personal del usuario. Se debe distinguir notificación persistida del CRM de push del sistema.
6. **Contador de campana · limitado a la ventana de20avisos.** `api/notificaciones/route.ts` consulta20filas más recientes y deriva unreadCount de ese subconjunto; no es un contador total de todo el historial. Con datos baseline, GET devolvió200/ok/0filas/0sinleer. Riesgo semántico demostrado por código, no un desajuste numérico observado con esa bandeja vacía. Mostrar claramente alcance «últimos20» dentro del límite de UI autorizado.

### Aspectos que sí funcionan en baseline

- Abrir menú «Mover el negocio» presenta7etapas y permite cerrar con Escape, sin elegir destino ni llamar escrituras.
- Sonner ya configura closeButton, duración4500ms y máximo3avisos visibles. No se generó un toast con una operación real de negocio.
- En el script de interacciones se bloquearon todos los métodos API distintos de GET/HEAD/OPTIONS después del login. Ningún intento de escritura se produjo (`blocked: []`).

### Defecto adicional confirmado y revisión estática compartida

- ListaNegocios: los encabezados de fila `<tbody><th scope=row class="px-4 text-left">` heredan `position:sticky;top:0` de globals.css. Se confirmó en las3primeras filas de `/negocios?vista=lista` en9303. Puede provocar superposición de nombres al desplazar tabla; productor comercial recibió confirmación y corrige clase de posición. Script: audit-rowheaders.mjs.
- Header nuevo en fuente: éxito de GET usa revisión de lecturas para ignorar datos anteriores a un PATCH; se señaló al principal que el catch debía usar la misma guarda para evitar un error antiguo tras marcado exitoso. También se señaló validación de forma de los avisosJSON y timeout de PATCH. Pendiente comprobar en compilación.
- Nueva tabla MetricChart: se señalaron los efectos de reglas globales table min-width880 y th sticky sobre tabla de datos; principal corrige alcance de estilos. Select y Sonner compartidos revisados estáticamente, sin afirmar aprobación visual hasta build.

## Confirmación final

Primera compilación UX2 estable en9306 inspeccionada:6rutas(Tareas,Negocios,Leads,Agenda,Inicio,Reportes) en320/390/768/1440,24/24visitasHTTP200,0pageerrors,0HTTP>=400 y0desbordamientos no contenidos detectados. Evidencia `output/playwright/premium-ux2-final/results.json` y capturas viewport.

Interacciones comprobadas sin escrituras de API: limpiar filtros básicos+avanzados de Pipeline, preservar q/sinAccion al cambiar Tablero/Lista, selector móvil de etapa, abrir/cerrar Mover sin destino, selección local/limpieza, encabezados de fila estáticos; filtro de Leads preserva q y limpia todo; Tareas búsqueda/limpieza, Equipo/Lista, selección local/cancelación y modal sinREA; Agenda Lista/Día y modal sinREA; MetricChart Datos/Gráfico con rowheadersstatic y tabla322px dentro de región322px, min-width0. La primera ejecución de Tareas usó equivocadamente rolecheckbox para un botónaria-pressed; el harness se corrigió y se repitió únicamente ese caso, que pasó. Evidencia `premium-ux2-interactions/results.json` y `premium-ux2-interactions-tasks/results.json`. Métodos API distintos deGET/HEAD/OPTIONS bloqueados por el harness después de auth: ningún intento de escritura.

Notificaciones con API totalmente interceptada:17/18comprobaciones correctas. Pasaron carga inicial sin toast, refresh al abrir, nuevoID genera aviso, expiración, descarte, no duplicar mismosIDs, GET503 conserva bandeja y recupera, timeoutGET15s habilita controles y recupera, PATCHrechazado conserva sinleer, errorGETantiguo no invalida marcado confirmado, filtrosTodas/Sinleer, cierre y0JS. Fecha/cuerpo de bandeja sin recorte. El único fallo de producto de esa pasada: botón cerrar toast20x20px, inferior a44px; principal corrigió cascada de Sonner en fuente y prepara la última compilación. El primer harness cerraba la bandeja al pulsar el cierre de toast (interacción exterior normal del Popover); se adaptó para reabrirla y completar la prueba. Evidencia `premium-ux2-notifications/results.json`.

Dos ajustes visuales solicitados por el principal tras capturas: compactar herramientas/etapa de Pipeline y colocar resumen/equipo de Tareas después del trabajo. Se confirmarán junto al tamaño y color del toast en una pasada focal, sin repetir el recorrido global. RadixSelect compartido fue revisado estáticamente; no hay consumidores importándolo en las vistasCRM, por lo que no se presenta como migración de todos los selectores. Los selectores nativos reales sí se ejercitaron.

No se declara push del sistema ni verificación de procesos no implementados. No se cierran gates ni se atribuye revisión a otro proveedor.

## Adaptación independiente de pruebas existentes

El principal amplió explícitamente el contrato para adaptar exclusivamente los casos GET/PATCH de `src/app/(crm)/leads/m41-r3.test.ts`. GitNexus campana LOW,0dependientes indexados. Se conservaron las14pruebas existentes de error/reintento, rechazo de marcado, espera de confirmación y prevención de doble clic. Cambios: fixture con entityType/entityIdnull, texto del vacío actual y selección/recuento semántico de acciones «Marcar como leída» en lugar de depender de un div y de su colorCSS. Se aisló Sonner en el loader.

Se añadieron2pruebas de comportamiento: rechazo de aviso JSON malformado con recuperación y descarte de error de GETantiguo tras PATCHconfirmado. Comando observado `node --test src/app/(crm)/leads/m41-r3.test.ts`:24pruebas,23correctas,0fallos,1HTTPomitida por requerir variable de servidor. Esto no sustituye el pase visual final ni demuestra push de sistema.
