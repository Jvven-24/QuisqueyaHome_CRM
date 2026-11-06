# Revisión independiente de fuente · UX2 comercial y compartidos

31/10/2026. premium_operativo revisa solo cambios ajenos a su producción de Tareas/Agenda. No edita los archivos revisados ni aprueba gate global.

Alcance acotado: crm-header, metric-chart, select, sonner, workspace.css, seis vistas/componentes de Negocios y LeadsVista. Se leyó diff y contexto de handlers/filtros/tabla.

## Hallazgo comunicado

- `src/app/workspace.css:67–82`: la regla que pretende aumentar el cierre de Sonner a44px está en la capa legado. Sonner declara sus estilos sin capa; `node_modules/sonner/dist/styles.css:223–241` fija cierre20×20px y transform. Una declaración normal sin capa gana a las declaraciones normales de cualquier capa, independientemente de especificidad. Por tanto el área táctil y la posición pretendidas no quedan garantizadas. Usar estilo/clase de cierre con precedencia comprobada o una regla con prioridad adecuada y medir el resultado renderizado. Pendiente principal.

## Lectura de seguridad/contrato

No se encontró en el diff revisado cambio de endpoint, payload de transición, autorización o moneda/cálculo. Filtros adicionales limpian cursor y conservan URL base; los nuevos filtros se anuncian como locales a la página. Marcar notificaciones exige confirmación del PATCH antes de mutar UI y emplea revisión para rechazar GET anteriores; hay timeout/limpieza y no se solicita permiso ni registro de push del sistema. Tabla de métricas pinta los mismos datos del gráfico con React y sin HTML inyectado. Los cambios examinados no leen secretos ni añaden transmisión externa.

No se observaron defectos críticos de seguridad en esta revisión estática. La ausencia de hallazgos no sustituye QA visual/teclado ni pruebas de carreras; esas comprobaciones son responsabilidad de la pasada independiente en runtime.
