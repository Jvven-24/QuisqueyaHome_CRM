# D21 · Brechas del catálogo funcional de 135 acciones

**Fecha:** 2026-10-04 · **Estado:** anexo de investigación, pendiente D02/D03/D12 · **Alcance:** lectura local; no modifica el catálogo CSV ni amplía C1 por inferencia.

## Resultado

El [catálogo de 135 acciones](D21-catalogo-funcional-vre-2026-10-04.csv) es un **denominador inicial insuficiente para «todo el proyecto»**. Cubre los 15 rótulos de `.viltrum/commercial.md`, los 21 módulos y 11 globales de `.viltrum/vre-os/FLUJO-PASADAS.md` §3 y muchas capacidades del Blueprint, pero ciertos rótulos agrupan decisiones y operaciones independientes. Tampoco están terminadas las fichas M01–M21/G01–G11/I01–I08: `.viltrum/vre-os/spec/00-indice.md` y `roadmap.json` sitúan P2/P4/P5 pendientes. Por tanto, **no sumar estas propuestas automáticamente ni publicar un porcentaje definitivo**. D02 debe decidir alcance y prioridad, D03 debe definir contratos, y D12 validar reglas fiscales, privacidad y seguridad.

Los nombres propuestos a continuación son claves candidatas nuevas; se verificó que no están en el CSV de 135. `Contractual` se usa solo cuando la acción deriva directamente del texto C1. Los demás renglones son `aspiracional` o `desconocido` si falta decisión de producto.

| Clave propuesta | Acción verificable omitida | Alcance | Fuente y razón |
|---|---|---|---|
| `finance.ledger_post` | Registrar asiento contable vinculado a operación inmobiliaria | aspiracional | `MAPA-SISTEMAS-OSS.md` §§1 y 3: ERPNext diferido como capa financiera; el catálogo solo contiene comisión/exportación. |
| `finance.invoice` | Emitir factura formal desde el sistema financiero | aspiracional | `MAPA-SISTEMAS-OSS.md` §3 y `E:/VILTRUM/VILTRUM ERP CRM/research/01-candidatos-open-source.md`; no equivale a PDF de cotización. |
| `finance.ecf` | Emitir y validar e-CF dominicano | aspiracional | `MAPA-SISTEMAS-OSS.md` §§1 y 5: bloqueo DGII/e-CF; no declarar cobertura de ERPNext sin localización aprobada. |
| `finance.reconcile` | Conciliar cobro real con reserva/comisión | aspiracional | `MAPA-SISTEMAS-OSS.md` §3 (cobros y finanzas) y Blueprint LEGO 7 (desembolso por fases); flujo contable pendiente. |
| `commission.installment` | Liquidar comisión por hitos de pago verificados | aspiracional | `docs/architecture/04-OPEN-SOURCE-LEAP-LEGO-BY-LEGO.md` LEGO 7; `commission.pay` del CSV solo marca estado. |
| `tax.rule_version` | Conservar versión de regla Confotur aplicable a cada operación | desconocido | C1 M04 exige motor fiscal, pero no prescribe versionado. D02/D12 deben definir trazabilidad legal y vigencia; `tax.eligibility` no la cubre. |
| `map.project_pin` | Situar proyecto en mapa geográfico | aspiracional | `MAPA-SISTEMAS-OSS.md` §3: MapLibre; CSV incluye master plan de unidad pero no mapa territorial. |
| `map.polygon` | Dibujar o consultar polígono de proyecto | aspiracional | `D21-cobertura-modulos.md` §Mapas (polígonos). |
| `map.zoning` | Superponer zonificación turística verificable | aspiracional | `D21-cobertura-modulos.md` §Mapas. La fuente jurídica del polígono queda por identificar. |
| `map.heatmap` | Mostrar mapa de calor de oferta/demanda | aspiracional | `D21-cobertura-modulos.md` §Mapas; requiere métrica y procedencia de datos. |
| `tour.asset_manage` | Cargar y asociar panorama 360 a unidad/proyecto | aspiracional | Blueprint LEGO 3 y `MAPA-SISTEMAS-OSS.md` §3. `unit.virtual_tour` del CSV cubre visualización, no ingesta/procedencia/permisos de medios. |
| `agenda.timezone` | Convertir disponibilidad y confirmación a zona horaria del cliente | aspiracional | Blueprint LEGO 5; `D21-cobertura-modulos.md` §Agenda. `agenda.public_booking` no resuelve zona horaria. |
| `agenda.reminder` | Programar recordatorios de visita 24 h y 2 h | aspiracional | Blueprint LEGO 5; requiere permiso/consentimiento y `MensajeriaPort`. |
| `agenda.cancel_reschedule` | Cancelar o reprogramar reserva pública sin crear duplicados | desconocido | Inferencia de `agenda.public_booking`; no está especificado por C1 ni Blueprint. D02 define comportamiento. |
| `academy.enroll` | Matricular broker en curso concreto | contractual | `.viltrum/commercial.md` M10 (LMS de capacitación y certificación) y `.viltrum/crm-ux/D21-academy-opensource.md` §§2 y 10; el CSV solo lista catálogo/progreso/quiz. |
| `academy.attempt` | Registrar intento y calificación de examen | contractual | C1 M10 certificación; `D21-academy-opensource.md` §3 indica que faltan intentos y umbral. |
| `academy.certificate_revoke` | Revocar o vencer certificado de broker | desconocido | `D21-academy-opensource.md` §§2 y 13 pregunta vigencia; no asumir obligación de C1. |
| `academy.scorm12` | Importar y reproducir curso SCORM 1.2 con resultado persistido | desconocido | `D21-academy-opensource.md` §§9–10: decidir si existe contenido que lo exige. Moodle no está integrado. |
| `academy.scorm2004` | Ejecutar SCORM 2004 con secuenciación completa | desconocido | `D21-academy-opensource.md` §9 advierte soporte nativo incompleto en Moodle; no contarlo por nombre de producto. |
| `academy.lti_sso` | Abrir LMS con identidad federada y revocación sincronizada | desconocido | `D21-academy-opensource.md` §§9–10; Supabase Auth↔Moodle no verificado. |
| `clientroom.payment_history` | Mostrar pagos acreditados al comprador | aspiracional | `D21-cobertura-modulos.md` §Client Room; `clientroom.view` y `clientroom.documents` del CSV no incluyen pagos. |
| `clientroom.progress` | Mostrar avances autorizados al comprador | aspiracional | `D21-cobertura-modulos.md` §Client Room; vincular inmueble y permiso del cliente está sin definir. |
| `clientroom.access_revoke` | Revocar acceso a un dossier compartido | desconocido | Inferencia de data room; Papermark aporta seguimiento de lectura, no acredita política de identidad/alcance de Quisqueya. |
| `dealroom.role_access` | Separar permisos de comprador, abogado y broker en la negociación | aspiracional | `D21-cobertura-modulos.md` §Deal Room; `dealroom.participants` del CSV solo invita. |
| `dealroom.offer_version` | Versionar oferta y aceptación de participantes | desconocido | Inferencia de negociación multipartes; C1 no define flujo legal, D02/asesoría legal deben precisarlo. |
| `automation.trigger` | Configurar evento disparador de flujo | aspiracional | `D21-cobertura-modulos.md` §Automatizaciones; el CSV tiene solo `automation.flow`. |
| `automation.branch` | Definir condición y ramas de un flujo | aspiracional | Misma fuente; requiere especificar permisos y efecto de cada acción. |
| `automation.run_history` | Consultar ejecución, fallos y reintentos de flujo | aspiracional | `MAPA-SISTEMAS-OSS.md` §3 y Spec G10; no equivale al outbox de un evento individual. |
| `automation.disable` | Desactivar flujo sin perder historial | desconocido | Operación de gobierno deducida, sin requisito aprobado. |
| `document.kyc_collect` | Recibir y clasificar documento KYC con acceso restringido | aspiracional | `D21-cobertura-modulos.md` §Documentos y Blueprint LEGO 2; `lead.kyc_gate` valida, no recoge evidencia. |
| `document.version` | Versionar dossier/brochure entregado | aspiracional | `D21-cobertura-modulos.md` §Cotizaciones/Documentos; `document.read_track` no preserva versión enviada. |
| `portal.lead_source_attribution` | Enlazar captura del Portal con campaña/origen y consentimiento | aspiracional | `MAPA-SISTEMAS-OSS.md` §3 y `FLUJO-PASADAS.md` I06; `portal.capture` del CSV no cubre atribución. |

## Capacidades ya inventariadas que no deben duplicarse

- 360: `unit.virtual_tour`; queda pendiente solo la gestión del activo (`tour.asset_manage`).
- Agenda pública: `agenda.public_booking`; quedan zona horaria y recordatorios como acciones independientes.
- Salas: `clientroom.view`, `clientroom.documents`, `dealroom.participants` y `dealroom.activity`; faltan pagos, permisos y estado de negociación.
- ERPNext: no confundir `commission.606` del Blueprint con e-CF, libro contable o conciliación. [Mapa OSS](../vre-os/MAPA-SISTEMAS-OSS.md) difiere ERPNext por DGII.
- Academy: `academy.quiz`, `academy.pass_rule`, `academy.certificate` ya existen como filas **ausentes**, no como producto integrado. SCORM/LTI son decisiones de estándar separadas.
- Automatización: `automation.flow` ya existe; no acredita constructor, disparadores, ramas ni observabilidad.

## Control de alcance y siguiente paso

Las 32 claves propuestas son **candidatas**, no se agregan al denominador ni al contrato. D02 debe resolver una tabla `aceptada / diferida / descartada / requiere entrevista` con criterio de aceptación por acción. D03 y D11 deciden datos/puertos para las aceptadas. D12 revisa e-CF, Confotur, KYC, identidad de LMS y firma. Solo entonces se versiona un catálogo consolidado y se calcula cobertura OSS potencial e integración real por separado.

El [Blueprint](../../docs/architecture/04-OPEN-SOURCE-LEAP-LEGO-BY-LEGO.md) precede a decisiones posteriores: propone Documenso, pero el mapa OSS §7 indica exclusión por Wilber; esa propuesta no autoriza reinstalarlo ni contar su firma como cubierta. El mapa también habla de despliegue VPS futuro; el mandato humano actual es **local**. No se hizo instalación, edición de código, prueba de funcionalidad ni publicación.
