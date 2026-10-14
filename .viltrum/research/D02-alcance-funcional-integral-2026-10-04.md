# D02 · Alcance funcional integral y control de denominadores

**Fecha:** 2026-10-04 (America/Santo_Domingo)  
**Perfil:** D02, revisión de alcance separada del dictamen arquitectónico D03  
**Estado:** propuesta de clasificación; sin aprobación de gate, ampliación C1 ni publicación.  
**Fuentes:** `.viltrum/commercial.md`, catálogo D21 de 135 claves, anexo D21 de 32 brechas y revisión independiente D12. La petición actual exige investigar **todo el programa local**, incluso ideas no contratadas. No autoriza nube, VPS, `git push` ni puesta en producción.

## Regla de alcance

C1 aprueba 15 módulos M01–M15, no cada fila de un CSV posterior. La clave `key` identifica una acción funcional; `Mxx` en el catálogo D21 identifica una agrupación del Spec y `C1:Mxx` referencia el contrato. Los números coincidentes no implican equivalencia entre catálogos. D21 marcó 61 filas `contractual` y 74 `aspiracional`; D12 comprobó 135 claves únicas y correspondencia exacta con los dos CSV de cobertura, pero **no** validó su granularidad ni su clasificación contractual. Las 32 brechas son candidatas adicionales y no se suman automáticamente.

## Clasificación D02 de las 32 brechas

| Grupo | Claves | Juicio de alcance |
|---|---|---|
| Derivación necesaria de C1 M10 | `academy.enroll`, `academy.attempt` | **2** acciones requeridas para que capacitación y certificación de brokers sean comprobables. C1 no nombra literalmente matrícula o intento; D02 las interpreta como criterios funcionales de M10, pendientes de ratificación humana y de evitar solape con `academy.quiz`/`academy.certificate`. |
| Propuestas del programa, fuera del texto C1 | `finance.ledger_post`, `finance.invoice`, `finance.ecf`, `finance.reconcile`, `commission.installment`, `map.project_pin`, `map.polygon`, `map.zoning`, `map.heatmap`, `tour.asset_manage`, `agenda.timezone`, `agenda.reminder`, `clientroom.payment_history`, `clientroom.progress`, `dealroom.role_access`, `automation.trigger`, `automation.branch`, `automation.run_history`, `document.kyc_collect`, `document.version`, `portal.lead_source_attribution` | **21** acciones con valor potencial, pero C1 no compromete módulo contable formal, cartografía avanzada, Client/Deal Room, constructor de automatizaciones, KYC documental ni atribución de campañas. Algunas podrían volverse criterios técnicos de una función existente; D02/cliente deben decidir antes de ampliar el contrato. |
| Definición de producto o estándar pendiente | `tax.rule_version`, `agenda.cancel_reschedule`, `academy.certificate_revoke`, `academy.scorm12`, `academy.scorm2004`, `academy.lti_sso`, `clientroom.access_revoke`, `dealroom.offer_version`, `automation.disable` | **9** decisiones abiertas. Confotur requiere trazabilidad, pero C1 no define versionado de reglas; Academy no fija vigencia de certificados, SCORM ni federación; reserva pública, dossiers y negociación multipartes son aspiracionales. No asignarles cobertura hasta definir resultado y edición/API. |

**Total: 2 + 21 + 9 = 32.** “Derivación necesaria” no significa autorización para cambiar el texto comercial; se propone anexar criterios de aceptación a M10 tras revisión de Wilber. Los otros 30 se investigan sin convertirlos en obligación de entrega.

## Omisiones, duplicados y contradicciones que bloquean un porcentaje final

1. `report.export_csv` (C1 M12) y `export.csv` (aspiracional G08) pueden ser una misma exportación o dos alcances distintos. Definir conjunto de datos, filtros, permisos y formato antes de contar ambos.
2. `trash.purge_policy` figura contractual, pero C1 M15 dice papelera segura y recuperación; no aprueba purga física. Revisar etiqueta y política de retención con D12. `trash.list` y `trash.restore` sí concretan el compromiso.
3. `message.whatsapp_send` aparece contractual aunque C1 M11 prioriza **WhatsApp directo `wa.me`** y Telegram Bot API, y excluye proveedores caros. Decidir si envío vía API oficial forma parte de C1 o es ampliación; `message.whatsapp_link` ya cubre el modo directo.
4. C1 M07 dice **sincronización RFC 5545 iCalendar**; `agenda.export_ics` por sí sola podría no satisfacer importación/suscripción, recurrencia, cancelación y conflictos. Precisar el verbo exigido; `agenda.external_sync` aspiracional no debe absorber silenciosamente una obligación contractual si es la interpretación elegida.
5. C1 M03 fija **seis etapas**, mientras `spec/modulos/M03-negocios.md` usa siete. D02 no cambia etapas; Wilber debe fijar lista y transiciones antes de prueba de aceptación.
6. `academy.enroll` y `academy.attempt` son distintos de `academy.catalog`, `academy.quiz`, `academy.pass_rule` y `academy.certificate` solo si se especifican registro, identidad, intentos, umbral y revocación. Evitar contabilizar dos nombres para una misma acción.
7. El anexo separa correctamente `tour.asset_manage` de `unit.virtual_tour`, `document.version` de `document.read_track`, y libro/factura/e-CF de CSV de comisiones. Mantener separados cuando tengan actor, dato y resultado verificables propios.
8. D12 identifica `document.signature` sin proveedor o API probados, `agenda.public_booking` aspiracional y cobertura Academy inconsistente entre Moodle y Frappe Learning. Son investigaciones, no funciones entregadas ni selección de proveedor.

## Denominadores versionados propuestos

| Medida | Valor base D21 v0 | Estado y uso |
|---|---:|---|
| Inventario etiquetado C1 | 61 | **Provisional** hasta revisar las filas 2–6 anteriores y criterios atómicos. No publicar como porcentaje contractual aprobado. |
| Inventario aspiracional | 74 | Ideas ya catalogadas; no amplían C1. |
| Programa investigado inicial | 135 | Unión de 61 + 74; inventario de investigación, no alcance humano aprobado ni porcentaje final. |
| Brechas candidatas separadas | 32 | 2 derivaciones M10, 21 propuestas, 9 por definir. Mantener como anexo hasta decisión por clave. |
| Universo de exploración máximo sin depurar | 167 | 135 + 32 **solo para comprobar omisiones**; no denominador de avance ni cobertura. |

Tras una sesión de definición, emitir un catálogo versionado con `key` estable, `scope_decision` (`C1 ratificado`, `programa aceptado`, `diferido`, `descartado`, `requiere definición`), `decision_id`, criterio de aceptación, actor/rol, dependencia y evidencia. El denominador contractual será el número de **acciones C1 ratificadas y no solapadas**; el del programa será el número de **acciones aceptadas para investigación/implementación**, siempre mostrado por separado. Las claves diferidas o desconocidas se informan como tales. Conservar snapshots de la versión anterior y registrar fusiones/splits para que los porcentajes sean comparables. El inventario de exploración puede incluir las 167 candidatas sin declararlas implementadas.

## Definiciones que requiere Wilber

1. Seis o siete etapas de negocios, nombres y transiciones.
2. Alcance de sincronización iCalendar y si reserva pública/reprogramación entra en el producto.
3. Si M11 incluye WhatsApp enviado por API o únicamente enlace directo y Telegram Bot API.
4. Matrícula, intentos, vigencia de certificado, SCORM 1.2/2004 y SSO del LMS.
5. Si el programa futuro incluye contabilidad/e-CF, salas de cliente/negociación, automatizaciones editables, KYC documental y cartografía avanzada; su prioridad y criterios de aceptación.
6. Política de retención y purga de la papelera, con revisión D12 antes de cualquier borrado irreversible.

La investigación puede continuar en local con datos sintéticos mientras estas decisiones se documentan. D02 no aprueba licencias, seguridad, fiscalidad, migraciones ni gate; D12 y D14 conservan sus revisiones independientes.
