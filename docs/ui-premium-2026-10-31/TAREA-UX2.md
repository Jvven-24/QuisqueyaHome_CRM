# Contrato UX2 · specs/ux-operativa-20261031/spec.md READY

Destino único: E:/\.viltrum-worktrees/crm-integracion-premium. Mantenimiento UI del CRM completo elegido por Wilber. Diseño: docs/DESIGN.md; Impeccable Operate + responsive-design. No APIs, auth, schema, datos de negocio, env, pushes ni producción. Sin modificar Comparador/Catálogo ni Configuración hasta liberación confirmada.

Archivos y responsables:
- premium_operativo: tareas/vista.tsx, tareas/_componentes/** (presentación); tareas/_lib/tipos.ts solo texto REA; agenda/vista.tsx solo retirada REA y ajuste visual asociado. Evidencia D09-UX2-TAREAS.md.
- premium_comercial: negocios/{vista,tablero,tarjeta-negocio,filtros,lista,herramientas}.tsx, leads/vista.tsx. Correcciones funcionales limitadas a interacción cliente demostrada y probada; conservar contratos de transición/validación/permiso. Evidencia D09-UX2-PIPELINE.md.
- Principal: componentes compartidos selectores/filtros, workspace.css, notificaciones visuales, matriz UX e integración. No editar archivos de productores.
- premium_auditor: solo lectura de fuente; scripts/capturas/evidencia UX2, sin cambios de negocio.

Antes de símbolos: GitNexus impact (CLI si MCP no existe); reportar limitación JSX y HIGH/CRITICAL antes de editar. Productores no ejecutan git/build/dev; principal valida conjunto y servidor local. Revisor independiente no corrige archivos de productor. Evidencia observable, no declarar proveedores ajenos sin ejecución real.

Comparador acordado: selección discreta en tarjetas/filas, bandeja contextual al seleccionar con contador y retirar/vaciar, acción Comparar; tabla por atributos en web, pareja seleccionable y etiquetas persistentes en móvil. Mantener máximo existente y datos reales; el agente concurrente posee implementación hasta liberación.
