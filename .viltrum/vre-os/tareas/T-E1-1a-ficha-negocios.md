# T-E1-1a · Ficha READY de Negocios (antes llamado «pipeline»)

Perfil: **D01 Discovery + D03 Arquitectura** (un solo entregable). Modo: fix **limitado a escribir un archivo**.
Revisor: `npm run spec:check` + lectura del orquestador de §8 (Codex no se autorrevisa). Tier: medium.
Plan: `.viltrum/vre-os/PLAN-E1.md` (léelo: §2 definición de hecho y §4 asignación). Constitución:
`.specify/memory/constitution.md`. Plantilla: `.viltrum/vre-os/spec/_plantilla-modulo.md`.

## Entradas (léelas; cita archivo:línea, nada de memoria)
- Estado real del CRM: `.viltrum/vre-os/spec/inventario/crm-as-is.md` (si no está completo, léelo parcial y revisa el código).
- Diseño y UX: `.viltrum/vre-os/D05-ux-modulos-A.md` (sección 2. Pipeline) y `.viltrum/vre-os/D05-ux-modulos-B.md`; sistema visual
  `docs/DESIGN.md`; gráficas y móvil `.viltrum/vre-os/D05-graficas-movil.md`; componentes ya instalados `src/components/ui/{chart,chart-card,drawer,card,tabs}.tsx`.
- Arquitectura: `.viltrum/vre-os/ARQ-VRE-002-integraciones.md` y `src/application/README.md`.
- Código a leer: `src/app/(crm)/pipeline/**`, `src/app/api/pipeline/**`, `src/application/pipeline/**`, `src/infrastructure/db/repos/pipeline.ts`
- Datos reales sembrados (648 leads, 184 negocios, 400 unidades, 12 brokers): esquema en `src/infrastructure/db/schema.ts`, tablas: `deals`, `deal_properties`, `deal_stage_history`, `pipeline_stages`, `loss_reasons`, `commissions`.
- Referencia de capacidades (solo ideas, sin copiar): Twenty (vistas guardadas, agrupar/filtrar, timeline, kanban).


## Requisitos FIRMADOS del cliente (mandan sobre esta ficha y sobre cualquier otro documento)
Fuente: Expediente del Sprint 1, decisiones D-01 a D-11 (`C:/Users/wilbe/Documents/QuisqueyaHome PortalWeb/.viltrum/inputs/whatsapp-qa-seguridad/texto/Expediente_Sprint1_CRM_Quisqueya_Home.md`, líneas ~192-230 y ~1431-1470) y `docs/contexto/decisiones.md` #45.
- **D-04 · Vocabulario:** el módulo se llama **«Negocios»**. La palabra «pipeline» **no puede aparecer en ningún texto visible al cliente** (menú, títulos, KPIs, botones, vacíos, errores, ayudas, exportaciones). La fase «clasificación» se llama **«presentación»**.
- **D-03 / D-09 · Un contacto puede tener negocios en varios proyectos a la vez;** varias negociaciones conviven sobre una misma propiedad hasta el cierre.
- **D-05 / D-10 · Nada se elimina:** las bajas son lógicas; el negocio perdido se archiva con motivo obligatorio (y comentario) y el contacto sigue recontactable. Hace falta un control que distinga **venta cerrada** de **negocio no concretado**.
- **D-06 · Asistente sin publicación directa:** todo cambio del rol asistente requiere aprobación previa. **D-07 · Solo el administrador ve** precio real, métricas globales y comisiones de terceros. **D-08 · El cliente final nunca entra al CRM.**
- **D-01 / D-02 · Inventario por rangos** (desde-hasta) y documentación enlazada; no cargar el detalle fino unidad por unidad.
- **D-11 · Diseño aprobado sin rediseño:** replicar la demo (`referencia-prototipo/`, `docs/DESIGN.md`) lo más fielmente posible; solo **mejoras puntuales, sin recargar la interfaz** («si es lento, no se usa»). Esta ficha especifica **pulido y funcionalidad dentro del diseño aprobado**, no un diseño distinto.
- Etapas editables por el cliente (no fijas en código) y nota/estado de seguimiento disponible en todos los módulos (Acta de la Reunión 2).

## Qué entregar
Un archivo `.viltrum/vre-os/spec/modulos/M03-pipeline.md` con la plantilla completa, **cabecera YAML incluida** (`id: M03`,
`estado`, `riesgo`, `owner`, `revisores`, `fuente_de_verdad`, `depende_de`, `actualizado`) y las 9 secciones con contenido real:
1. propósito, usuarios y trabajo principal por rol (admin, broker, asistente);
2. estado actual con evidencia (lo que existe, lo que es boceto, SQL dentro de la página, datos fijos);
3. pantallas: pestañas, bloques, acciones, móvil 320/390, **seis estados**, componentes por id de la librería Viltrum Design cuando D05 los eligió;
4. funciones (casos de uso): entrada Zod, reglas, salida, errores, permiso `recurso:acción:alcance`, evento al outbox, idempotencia;
5. datos: tablas y columnas que usa, qué consultas **nuevas** hacen falta (SQL a migrar a `application/<modulo>/consultas.ts`), índices;
6. integraciones y puertos: emite `NegocioCambioEtapa` al outbox (ver `src/infrastructure/integraciones/outbox/` y `CrmPort`) y qué pasa si el proveedor cae;
7. métricas y reportes que alimenta;
8. **criterios de aceptación numerados y verificables**, cada uno con la prueba que lo demuestra (unitaria, `test:db`, mutación, captura 320/390/768/1440);
9. fuera de alcance y preguntas abiertas.
Ámbito propio de este frente: kanban con las 7 etapas canónicas, mover etapa con reglas (cierre y pérdida con motivo), vista lista, filtros proyecto/broker/rango, tarjeta con monto USD, días en etapa y próxima acción; lecturas hoy con SQL en `page.tsx`. Quedan FUERA plan de pagos 10/40/50 y cotizaciones.

## Estado de la ficha
`estado: READY` **solo** si no queda ningún apartado vacío ni `UNKNOWN` en §8. Si falta información, `estado: REVIEW` y las
preguntas concretas en §9 (quién debe responder). No inventes comportamiento: si no lo puedes verificar en el código, márcalo.

## Reglas
Escribe solo ese archivo. No toques código ni otros documentos. Sin git, sin commit, sin `npm run dev`/`build`.
Termina con `npm run spec:check` y pega su salida al final del archivo bajo `## Verificación`.
