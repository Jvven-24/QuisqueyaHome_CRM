# T-E1-3a · Ficha READY de Propiedades (inventario)

Perfil: **D01 Discovery + D03 Arquitectura** (un solo entregable). Modo: fix **limitado a escribir un archivo**.
Revisor: `npm run spec:check` + lectura del orquestador de §8 (Codex no se autorrevisa). Tier: medium.
Plan: `.viltrum/vre-os/PLAN-E1.md` (léelo: §2 definición de hecho y §4 asignación). Constitución:
`.specify/memory/constitution.md`. Plantilla: `.viltrum/vre-os/spec/_plantilla-modulo.md`.

## Entradas (léelas; cita archivo:línea, nada de memoria)
- Estado real del CRM: `.viltrum/vre-os/spec/inventario/crm-as-is.md` (si no está completo, léelo parcial y revisa el código).
- Diseño y UX: `.viltrum/vre-os/D05-ux-modulos-A.md` (sección (propiedades: ver D05-ux-modulos-B, sección Propiedades; en A no está)) y `.viltrum/vre-os/D05-ux-modulos-B.md`; sistema visual
  `docs/DESIGN.md`; gráficas y móvil `.viltrum/vre-os/D05-graficas-movil.md`; componentes ya instalados `src/components/ui/{chart,chart-card,drawer,card,tabs}.tsx`.
- Arquitectura: `.viltrum/vre-os/ARQ-VRE-002-integraciones.md` y `src/application/README.md`.
- Código a leer: `src/app/(crm)/propiedades/**`, `src/app/(crm)/avances/**`, `src/application/proyectos/**`, `src/infrastructure/db/repos/proyectos.ts`
- Datos reales sembrados (648 leads, 184 negocios, 400 unidades, 12 brokers): esquema en `src/infrastructure/db/schema.ts`, tablas: `projects`, `units`, `unit_inventory_states`, `zones`, `construction_phases`, `files`, `deal_properties`.
- Referencia de capacidades (solo ideas, sin copiar): Twenty (vistas guardadas, agrupar/filtrar, timeline, kanban).

## Qué entregar
Un archivo `.viltrum/vre-os/spec/modulos/M04-propiedades.md` con la plantilla completa, **cabecera YAML incluida** (`id: M04`,
`estado`, `riesgo`, `owner`, `revisores`, `fuente_de_verdad`, `depende_de`, `actualizado`) y las 9 secciones con contenido real:
1. propósito, usuarios y trabajo principal por rol (admin, broker, asistente);
2. estado actual con evidencia (lo que existe, lo que es boceto, SQL dentro de la página, datos fijos);
3. pantallas: pestañas, bloques, acciones, móvil 320/390, **seis estados**, componentes por id de la librería Viltrum Design cuando D05 los eligió;
4. funciones (casos de uso): entrada Zod, reglas, salida, errores, permiso `recurso:acción:alcance`, evento al outbox, idempotencia;
5. datos: tablas y columnas que usa, qué consultas **nuevas** hacen falta (SQL a migrar a `application/<modulo>/consultas.ts`), índices;
6. integraciones y puertos: ninguna externa; almacenamiento de fotos por `AlmacenamientoPort`; la restricción de precio por rol que ya existe;
7. métricas y reportes que alimenta;
8. **criterios de aceptación numerados y verificables**, cada uno con la prueba que lo demuestra (unitaria, `test:db`, mutación, captura 320/390/768/1440);
9. fuera de alcance y preguntas abiertas.
Ámbito propio de este frente: lista de 20 proyectos con KPIs reales (unidades por estado, % vendido), filtros zona/Confotur/estado, detalle con pestañas (Resumen, Unidades con matriz torre/piso, Avances), regla de precio restringido por rol. Quedan FUERA rentas, mapas y recorridos 360.

## Estado de la ficha
`estado: READY` **solo** si no queda ningún apartado vacío ni `UNKNOWN` en §8. Si falta información, `estado: REVIEW` y las
preguntas concretas en §9 (quién debe responder). No inventes comportamiento: si no lo puedes verificar en el código, márcalo.

## Reglas
Escribe solo ese archivo. No toques código ni otros documentos. Sin git, sin commit, sin `npm run dev`/`build`.
Termina con `npm run spec:check` y pega su salida al final del archivo bajo `## Verificación`.
