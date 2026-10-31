# Presentación Academy y Aprobaciones; formularios comerciales

Producto: premium_comercial, 31/10/2026. G20/G22/M41 READY, ampliación expresa del principal. Nivel L3 hasta QA.

- Academy: cuatro KPI en dos columnas móviles; título independiente del nombre de usuario; proyectos asignados agrupados en un expansivo con indicador visual; header y botones de curso con distribución adaptable; controles de biblioteca en grid sin anchos intrínsecos forzados. Datos, progreso, LMS, decisiones, constancias y mensajes de modo degradado se conservan.
- Aprobaciones: filtros por tipo en un carril de desplazamiento local, resultados con contexto y tipo, jerarquía de fila con título sin cortes. Aviso íntegro de datos de ejemplo y acciones simuladas sin cambios.
- Incidente verificado por auditor en Lead/Contacto 320×500: formularios propios con contenido fuera de un contenedor overflow-hidden. Section ahora usa el contrato `crm-modal` compartido; cabecera fija, formulario con cuerpo scrolleable min-height 0 y pie independiente con dos acciones. Ningún cambio de handler, validación, campos o payload.

GitNexus AcademyVista, ApprovalsPreview, FormularioLead y FormularioContacto upstream: LOW, 0 callers/procesos indexados. Alcance real JSX: sus pantallas y formularios de alta; no se extrapola el índice incompleto como garantía de aislamiento.

Lint focal Academy/Aprobaciones/Leads/Contactos exit 0. Diff-check focal sin errores. Sin build/dev ni pruebas globales por el productor. Pendiente revisión independiente del scroll y botones en viewport corto y móvil/desktop. No se cambia auth, APIs, RLS, schema, cálculos o integraciones.
