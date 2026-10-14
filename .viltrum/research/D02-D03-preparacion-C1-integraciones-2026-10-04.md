# D02 → D03 · Precedencia C1 y secuencia local de integraciones

**Estado:** propuesta de ejecución para revisión D01 (alcance), humana (arquitectura D03), D12/D14 (integraciones). No es gate ni `READY`. **Clasificación:** INTEGRACION, CRM/ERP, R3 por identidad/PII; D00 coordina, D21 investigó, D02 delimita, D03 diseña, D19 implementa solo tras ficha aprobada.

## Precedencia verificable

1. `.viltrum/commercial.md` es C1 activo y define el primer corte: **M01–M15 contractuales**. La confirmación humana de este turno pide completar primero ese C1 y las integraciones locales; las 32 candidatas del anexo D21 no se agregan a la primera entrega.
2. Los números M01–M15 de C1, M01–M21 del Spec y los 12 legos del Blueprint son catálogos distintos. `C1:M10 Academy` se especifica en `Spec:M13 Academy`; `C1:M03 Negocios` corresponde a `Spec:M03 Negocios` por nombre, no por igualdad numérica. El CSV D21 (61 contractual/74 aspiracional) es investigación de operaciones, no enmienda a C1 ni denominador contractual ratificado.
3. Wilber confirmó **seis etapas activas** de C1 M03: Nuevo, Contactado, Presentación, Preselección, Negociación y Cierre. **Perdido es resultado archivado** y sus registros existentes se preservan. El seed y `Spec:M03` aún muestran siete; D03/D11 deben diseñar catálogo de identidad estable y conversión reversible antes de sincronizar etapas con Twenty. Decisión #45 mantiene «presentación» en texto visible.
4. C1 M11 incluye **Telegram Bot API y WhatsApp directo `wa.me`**. Envío WhatsApp por API comercial no se presume contractual; su fila `message.whatsapp_send` queda en revisión. Los simuladores actuales no prueban entrega real.
5. Wilber precisó que C1 M07 requiere **publicar e importar `.ics`**, sin sincronización bidireccional. La exportación existente es evidencia parcial; falta importar de modo seguro. Suscripción continua y reserva pública Cal.diy quedan fuera del corte.
6. C1 M10 exige capacitación y **certificación tras aprobación de Admin**. Moodle es candidato RUN para cursos/evidencia; el acto de aprobación comercial pertenece al CRM con permiso y auditoría. SCORM 2004, LTI, SSO y complemento específico no están en C1. Completar ítems/quiz no equivale a certificado. Decisión #43/#45 fija PostgreSQL local como dueño actual de CRM, Twenty como espejo detrás de `CrmPort`.
7. Decisión #46 permite rediseño profundo, pero no transforma el anexo exploratorio de 32 acciones en compromiso contractual. UI nueva requiere ficha propia, componentes Viltrum, seis estados y móvil; este documento no fija su diseño.
8. Wilber delimitó C1 M15 a **papelera segura y restauración**; la purga física no integra esta primera entrega.

## Equivalencia de nombres, no de numeración

Los IDs C1 son obligaciones contractuales; la segunda columna usa el catálogo histórico del Spec Pack y su inventario `spec/inventario/crm-mapa-modulos.md`. Una referencia parcial exige ficha/criterio específico antes de READY; no se deduce que la función exista por compartir número.

| C1 contractual | Ficha(s) Spec relacionadas | Precisión |
|---|---|---|
| M01 Leads inmobiliarios/scoring | M01 Leads | Scoring requiere criterio propio. |
| M02 Voz WhatsApp/Telegram HITL | G11 IA/asistente + M01 Leads | Sin ficha modular 1:1; canal de voz y revisión humana no acreditados. |
| M03 Negocios seis etapas | M03 Negocios | Perdido es resultado archivado, no séptima etapa activa. |
| M04 Confotur | M16 Cotizaciones/planes | Relación parcial; motor fiscal requiere validación específica. |
| M05 Propiedades/unidades | M04 Propiedades | IDs distintos pese a producto mismo. |
| M06 Contactos | M02 Contactos | `Spec:M06` es Agenda, no Contactos. |
| M07 Agenda/iCalendar | M06 Agenda + G08 Importación/exportación | Publicar e importar `.ics`, sin bidireccional. |
| M08 Comisiones | M10 Comisiones | `Spec:M08` es Brokers. |
| M09 Metas | M09 Metas | Coincidencia nominal y numérica; verificar criterios. |
| M10 Academy | M13 Academy + I02 Moodle | `C1:M13` es Auditoría; Academy requiere aprobación Admin. I02 no sustituye ficha M13. |
| M11 Comunicaciones | M11 Comunicaciones + I03 Mensajería | `wa.me` directo y Telegram; API WhatsApp comercial fuera del corte. |
| M12 Reportes | M12 Reportes | CSV RFC 4180 contractual. |
| M13 Auditoría | G05 Auditoría | `Spec:M13` es Academy, no Auditoría. |
| M14 Dashboard | M21 Inicio | Por rol; no `Spec:M14` Configuración. |
| M15 Papelera | M14 Configuración (panel Papelera) | Relación parcial; recuperación sí, purga física fuera del primer corte. |

Esta matriz no reemplaza fichas ni amplía alcance. El productor de Academy prepara `Spec:M13 Academy` con `contract_id: C1:M10`; el de auditoría conserva `C1:M13` separado.

## Orden de trabajo que evita dependencias circulares

| Orden | Resultado local y evidencia de salida | Condición |
|---|---|---|
| 0 | Alcance C1-01..04 confirmado por Wilber y registrado en `questions.md`; D03/D11/D12 concretan datos, contratos, PII y escenarios negativos. | La respuesta humana no marca `READY`: actualizar fichas e índice, obtener revisión independiente. |
| 1 | Reparar outbox compartido: claim/lease, HTTP fuera de lock, idempotencia durable, orden/reconciliación; pruebas de concurrencia y caída. | I01-A y ficha de infraestructura READY; sin activar proveedores aún. |
| 2 | Twenty local espejo de contacto/negocio/actividad, con versión fija, IDs externos, mapeo aprobado, datos sintéticos, pruebas de contrato y G10 de salud. | I01-B/C/D; seis etapas resueltas antes del espejo de negocio; D12/D14 independientes. |
| 3 | Moodle local PoC de curso→matrícula→intento→aprobación→certificado, aislamiento A/B y suspensión; documentar edición/API/plugin exacto. | I02 precondiciones; si falla requisito duro, comparar alternativa sin ocultar costo de integración. |
| 4 | Vertical Academy en UI propia y resto de C1 por módulos; Telegram y `wa.me`, iCalendar, Confotur, comisiones y papelera se verifican contra fichas C1 respectivas. | Fichas `READY`, tareas ≤45 min con archivos exactos y revisión de otro proveedor. |

Cada lote recibe un `TAREA.md` nuevo con lista **cerrada** de archivos, impacto GitNexus sobre símbolos que se editen, prueba positiva y negativa, y salida `typecheck`, `lint`, `npm test` más build únicamente en worktree donde no bloquee `.next`. D12 revisa secretos/RLS/PII y D14 comprueba flujo completo por rol. No se infiere funcionamiento del hecho de instalar contenedores o pasar pruebas unitarias. No push, VPS ni nube.

## Preguntas bloqueantes mínimas

`Q-C1-01..04` están respondidas en `questions.md` por confirmación humana transmitida por D00 el 2026-10-04. Pendientes **técnicos**, no nuevas decisiones comerciales: catálogo y preservación de Perdido; contrato de importación `.ics`; aprobación Admin con auditoría/revocación; verificación de papelera sin purga. `Q-C1-05` sigue abierta para datos permitidos a Twenty/Moodle por rol, consentimiento y retención; D12/D11 revisan antes de tráfico real. `wa.me` + Telegram ya está resuelto por C1.

## Insumos

`.viltrum/commercial.md`; `docs/contexto/decisiones.md` #43–#46; `.viltrum/vre-os/ARQ-VRE-002-integraciones.md`; `.viltrum/vre-os/spec/inventario/crm-as-is.md` (REVIEW, no gate); `.viltrum/research/D02-alcance-funcional-integral-2026-10-04.md`; `.viltrum/research/D21-sintesis-cobertura-integral-2026-10-04.md`; `.viltrum/research/D03-arquitectura-multi-oss-cobertura-2026-10-04.md`; `.viltrum/reviews/D12-revision-cobertura-oss-2026-10-04.md`.
