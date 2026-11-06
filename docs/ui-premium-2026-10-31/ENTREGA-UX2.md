# Entrega UX2 · interacción y distribución

Base: rama codex/integracion-premium, sobre checkpoint 790e794, en E:/.viltrum-worktrees/crm-integracion-premium. Mandato y aceptación: specs/ux-operativa-20261031/spec.md (READY). Decisiones por componente y módulo: ESTRATEGIA-UX2.md. Solo entrega local; sin merge al checkout principal, push ni despliegue remoto.

## Cambios implementados
- Tareas: vistas Lista/Tablero/Equipo/Plantillas, búsqueda/estado antes del trabajo, filtros revelables, resumen y carga del equipo después del contenido principal. En teléfono, selector de columna del tablero y controles del tamaño adecuado. Checklist y gestión bajo demanda, con acciones existentes preservadas.
- Negocios: búsqueda visible, filtros etiquetados y removibles, limpiar completo (incluidos criterios avanzados), herramientas agrupadas, tablero móvil por etapa con alternativa táctil Mover. Nombres de fila dejaron de heredar posición sticky que provocaba solapamiento. Totales por divisa y alcance local de búsqueda explícitos.
- Leads: filtros activos removibles y limpiar accesible; búsqueda GET conserva criterios canónicos y contexto adicional sin repetir claves, incluso antes de hidratar.
- Agenda/Tareas: REA retirado de textos del producto, etiquetas y nuevo contenido generado por planes. Identificadores técnicos conservados; no se reescriben registros históricos.
- Selectores: contrato visual compartido para nativos, picker de plataforma en teléfono; Radix Select con objetivos táctiles y menú contenido. El componente Radix no tiene consumidores operativos detectados actualmente, por lo que su cobertura es estática.
- Gráficos: alternancia Gráfico/Datos, valores y nombres completos en tabla accesible, filas no pegajosas; altura de barras horizontales acorde a categorías.
- Notificaciones: bandeja Todas/Sin leer, actualización y cierre explícitos, contenido íntegro, reintento y conservación de datos ante fallos. Consulta en primer plano cada 30 segundos y al recuperar foco/conexión; aviso temporal solo para nuevas IDs. Timeout y cancelación de peticiones, protección contra GET antiguo durante marcado, validación del JSON. Sonner con cierre de 44 px y ubicación que respeta la navegación.

## Verificación y revisión
La revisión independiente está en AUDITORIA-UX2.md y REVISION-UX2.md. Se separó producción (principal/comercial/operativo) de auditoría. No hubo intervención de otro proveedor: no se declara aprobación formal de Claude/Gemini ni se cierran gates.

Primera compilación .next-review y typecheck: correctos. Lint global: 0 errores, 17 advertencias previas en archivos ajenos a esta pasada. Ronda inicial de runtime: 24 visitas, seis rutas a 320/390/768/1440, sin errores JS/HTTP ni overflow detectado. Se comprobaron filtros, cambio de vista/etapa, listas, datos de gráficos y formularios sin escribir datos de negocio.

La ronda inicial encontró densidad móvil excesiva y cierre de toast de 20 px por prioridad CSS. Se corrigieron en un único lote: resumen de Tareas después del trabajo, navegación compacta, búsqueda/filtros de Negocios en una distribución más breve y prioridad explícita del cierre. La confirmación final y los comandos del release se registran debajo al terminar.

Pruebas de notificaciones conservan las 14 regresiones originales y añaden JSON malformado + error de GET obsoleto tras PATCH confirmado. Se ajustaron selectores del test a botones semánticos, sin depender de color o etiqueta div. Se corrigió en producción una regresión de preservación de filtros en el formulario GET de Leads; no se debilitó su prueba.

## Seguridad y alcance
Sin cambios en API, dominio, esquema, migraciones, autenticación o variables de entorno. Sin credenciales en el diff. Datos visualizados con React; no HTML inyectado ni nuevos envíos externos. Las mutaciones de notificaciones siguen en su endpoint autenticado y no se dan por correctas sin confirmación. Revisión estática independiente sin hallazgos críticos; no equivale a auditoría integral de seguridad.

GitNexus reportó riesgo alto por alcance compartido (82 símbolos/11 flujos en la primera detección). El índice registrado no cubre con precisión todos los rangos JSX; no se usa para afirmar aislamiento. Evidencia: gitnexus-changes-ux2.json. Los archivos de producción intervenidos se identifican por hash en source-hashes-ux2.json.

## Límites conservados
- Comparador/Catálogo y Configuración siguen reservados al agente externo. Esta pasada define su patrón de interacción pero no sobrescribe su implementación.
- Los avisos funcionan con el CRM abierto. No existe Web Push con la aplicación cerrada: faltan worker, suscripciones y entrega del servidor. No se solicitó permiso del navegador ni se simuló esa capacidad.
- La API devuelve las 20 notificaciones más recientes y su contador corresponde a esa ventana; la bandeja lo identifica.
- Las vistas de ejemplo conservan sus advertencias. No se activaron integraciones sin credenciales ni se atribuyen mejoras de rendimiento sin medición controlada.

## Evidencia local
Capturas y resultados: output/playwright/premium-ux2-baseline, premium-ux2-final y confirmaciones UX2 que registra el auditor. No se versionan sesiones, cookies, contraseñas ni capturas con datos privados. Logs de comandos en TEMP: crm-ux2-build-release.log, crm-ux2-tests-release.log, crm-ux2-lint.log, crm-ux2-typecheck-final.log.
