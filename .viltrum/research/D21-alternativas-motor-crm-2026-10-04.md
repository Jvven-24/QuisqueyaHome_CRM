# D21 · Alternativas al motor CRM detrás de la UI de Quisqueya Home

**Fecha:** 2026-10-04 · **Perfil productor:** D21 · **Revisor propuesto:** D03; D12 para seguridad y licencias · **Riesgo:** R3 · **Estado:** investigación, pendiente de revisión independiente

## Capacidad y límites

Quisqueya Home necesita mostrar en su propia interfaz contactos, leads, negocios, tareas, actividad, comunicaciones, reglas y módulos inmobiliarios, con datos y permisos coherentes. El motor debe poder ejecutarse localmente, exponer API para las operaciones que usa la UI, admitir entidades/campos propios y permitir exportar o sustituir el proveedor. Inglés es aceptable. **No hay autorización para nube, despliegue, migración de datos ni cambio de fuente de verdad.** El PostgreSQL local sigue siendo canónico según I01 y la decisión #43. Una pantalla existente en el producto externo **no implica** que la misma función sea accesible o mantenible desde la UI propia.

La pregunta actual es condicional: **Twenty todavía no está descartado**. El [mapa local](../vre-os/MAPA-SISTEMAS-OSS.md) registra una instancia Twenty activa y una instantánea OpenAPI de 522 operaciones, pero deja sin verificar metadatos/campos propios, autoría, límites y semántica. La ficha [I01](../vre-os/spec/integraciones/I01-twenty.md) detecta además dos bloqueos del adaptador local (lock durante HTTP e idempotencia); son defectos de la integración prevista, no prueba de incapacidad de Twenty. El coste de cambiar de motor solo se justifica si una prueba local demuestra una brecha funcional o económica relevante.

## Búsqueda en los cuatro frentes

| Frente | Hallazgo |
|---|---|
| Ya disponible | Twenty local; puertos `CrmPort` y outbox del CRM; Viltrum Automations Runtime para mensajería. No duplicar esa capa por elegir otro CRM. |
| Nativo del stack | PostgreSQL, dominio propio y UI Next.js pueden conservar identidad, permisos, catálogo inmobiliario y auditoría. Un proveedor externo no debe reemplazarlos implícitamente. |
| Open source | SuiteCRM 8, Frappe CRM, EspoCRM, ERPNext CRM; Dolibarr y Odoo Community como controles de comparación. |
| SaaS/API | No aplica al piloto: el usuario exige trabajo local. Las páginas de precios solo sirven para identificar límites de ediciones comerciales. |

## Matriz de candidatos

**Lectura:** «API amplia» acredita CRUD general documentado, no todas las acciones de administración, PDF o flujo. «Migración» es una estimación relativa **sin benchmark ni volumen de datos**, no una cifra contractual. La función inmobiliaria específica (proyectos/unidades, reservas, rentas, comisiones RD) será propia o extensión en todos los candidatos.

| Motor | Funciones libres y API para UI propia | Metadatos / extensión / seguridad | Funciones comerciales o brechas | Migración desde Twenty y juicio |
|---|---|---|---|---|
| **Twenty actual** | Instancia local y OpenAPI capturada: personas, empresas, oportunidades, tareas, notas, timeline y workflows. [Ficha I01](../vre-os/spec/integraciones/I01-twenty.md). | API de metadatos GraphQL, campos propios, atribución, roles y límites: **NO VERIFICADO en instancia**. Núcleo AGPLv3, archivos Enterprise aparte según [LICENSE](https://github.com/twentyhq/twenty/blob/main/LICENSE). | Puede requerir funciones Enterprise para necesidades aún sin inventariar. Bloqueos de outbox propios pendientes. | **Baja** si pasa PoC; primero probar antes de reemplazar. |
| **SuiteCRM 8** | Amplio CRM libre: leads, contactos, oportunidades, agenda, campañas, casos, documentos, cotizaciones, facturas, contratos, informes y [workflows](https://8-x.docs.suitecrm.com/user/advanced-modules/workflow/). La [API v8](https://docs.suitecrm.com/developer/integration-api/v8/endpoints/) documenta CRUD, relaciones, metadatos y Swagger. | [Studio](https://docs.suitecrm.com/admin/administration-panel/studio/) agrega campos, relaciones y auditoría por campo; [Module Builder](https://docs.suitecrm.com/admin/administration-panel/developer-tools/) crea módulos. OAuth2 en [API v8](https://docs.suitecrm.com/developer/integration-api/v8/authentication/). AGPLv3, [repositorio activo](https://github.com/SuiteCRM/SuiteCRM-Core). | No se ha probado que PDF, adjuntos, ejecución/edición de workflows y todas las acciones del producto estén cubiertas por API v8; pueden requerir rutas personalizadas. Operación PHP/MySQL separada. | **Alta**: nuevo esquema, mapeo de actividad y permisos. **Primera alternativa a probar** si Twenty falla. |
| **Frappe CRM** | Leads, deals, contactos, organizaciones, notas/tareas y [automatizaciones visuales](https://docs.frappe.io/crm/automations/getting-started) con webhooks. Frappe genera [REST CRUD para cada DocType](https://docs.frappe.io/framework/user/en/api/rest); [CRM v1 estable self-host](https://github.com/frappe/crm), AGPLv3. | [Campos personalizados](https://docs.frappe.io/crm/custom-fields), DocTypes propios y roles/permisos del framework. La versión exacta de las automatizaciones debe comprobarse en la imagen estable elegida. | CRM enfocado en ventas; cotizaciones/contabilidad avanzadas dependen de [ERPNext](https://github.com/frappe/crm) y aumentan operación. Paridad de campañas, soporte y documentos frente a SuiteCRM no acreditada. | **Media-alta**: flexible, pero múltiples apps si se busca suite completa. Segunda opción de PoC. |
| **EspoCRM** | Leads, contactos, oportunidades, campañas/casos; [REST](https://docs.espocrm.com/development/api/) refleja la SPA y OpenAPI de instancia incluye entidades y campos propios (desde v9.3). [Entity Manager](https://docs.espocrm.com/administration/entity-manager/) agrega entidades/relaciones; PostgreSQL soportado. [Núcleo AGPLv3](https://github.com/espocrm/espocrm). | Usuario API con rol acotado; metadatos expuestos. Muy buen encaje técnico con UI propia. | [Workflows](https://docs.espocrm.com/administration/workflows/) y [BPM](https://docs.espocrm.com/administration/bpm/) son **Advanced Pack comercial**. La fórmula básica no equivale a ese motor. | **Media-alta**. Queda detrás de SuiteCRM si workflows OSS completos son requisito. |
| **ERPNext CRM / Frappe** | Pipeline lead→opportunity→quotation→order→invoice y REST/DocTypes extensibles; GPLv3 para ERPNext. [ERPNext CRM](https://docs.frappe.io/erpnext/CRM) y [Frappe REST](https://docs.frappe.io/framework/user/en/api/rest). | Roles y personalización Frappe. Puede ser buena capa financiera **separada**. | La documentación actual de ERPNext recomienda evaluar **Frappe CRM**, pues el módulo CRM de ERPNext `develop` anuncia retirada en v17. Fiscalidad DGII/e-CF ya es un bloqueo local. | **Alta** como reemplazo CRM; mantener diferido para finanzas. |

**Controles de descarte relativo.** [Dolibarr](https://github.com/Dolibarr/dolibarr) GPLv3+ ofrece ERP/CRM completo y [REST activable por módulo](https://wiki.dolibarr.org/index.php/Module_Web_Services_API_REST_%28developer%29), pero la cobertura de entidades y operaciones inmobiliarias por API depende de los módulos activados y no está comprobada: no aventaja con evidencia a SuiteCRM. [Odoo Community 19](https://www.odoo.com/documentation/19.0/legal/licenses.html) es LGPLv3 y su [JSON-2 API](https://www.odoo.com/documentation/19.0/developer/reference/external_api.html) es extensa. La página de API vincula el acceso a plan Custom mientras una [respuesta en foro oficial](https://www.odoo.com/es_ES/forum/ayuda-1/xml-rpc-api-deprecation-json-rpc-availability-in-odoo-community-300519) afirma que JSON-2 funciona en Community: **contradicción por aclarar en instalación self-host local**. Además, módulos Enterprise y de terceros requieren licencias individuales. No lo elegiría sin inventario de edición exacta.

## Evaluación D21 provisional

Escala de la doctrina D21 (20 cobertura, 15 licencia, 15 mantenimiento, 15 seguridad, 10 integración, 10 salida, 10 coste a tres años, 5 UX). Son **rangos orientativos** porque faltan PoC, versión fijada, medición de recursos, retención, volumen y coste operativo. No autorizan compra ni migración.

| Motor | Cobertura | Licencia | Mantenimiento | Seguridad | Integración | Salida | Coste 3 años | UX propia | Total provisional |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Twenty | 15 | 11 | 12 | 7 | 6 | 7 | 7 | 4 | **69/100** |
| SuiteCRM 8 | 18 | 12 | 12 | 9 | 7 | 7 | 6 | 3 | **74/100** |
| Frappe CRM | 15 | 12 | 12 | 9 | 8 | 8 | 6 | 4 | **74/100** |
| EspoCRM | 14 | 8 | 12 | 10 | 9 | 8 | 6 | 4 | **71/100** |
| ERPNext CRM | 15 | 11 | 12 | 9 | 7 | 8 | 5 | 2 | **69/100** |

Todos caen en el umbral **65–79 = prueba técnica acotada**. Empates no significan equivalencia: SuiteCRM gana cobertura OSS actual; Frappe CRM gana extensión/API pero necesita ERPNext para parte del ciclo comercial. El coste a tres años se expresa por componentes, **no se cuantifica sin recursos/volumen**: licencia comunitaria 0; infraestructura local (CPU/RAM/backup), parches de seguridad, adaptación y regresión de cada upgrade, eventual soporte comercial. D03/D16 deben medirlo en PoC. No prometer coste cero por licencia gratuita.

## Decisión y PoC local propuesta

**Decisión propuesta:** conservar Twenty en su estado actual mientras se ejecuta una PoC de paridad; preparar SuiteCRM 8 como primer reemplazo y Frappe CRM como segundo. Estrategia **E1: RUN separado detrás de `CrmPort`**, versión fijada y sin copiar código AGPL al CRM. Es una propuesta técnica, pendiente de revisión D03/D12 y de decidir fuente de verdad. Evita incorporar una suite completa solo por su catálogo: la UI propia puede requerir funciones que la API no publica.

**PoC máxima:** dos jornadas de investigación/ejecución local con datos **sintéticos**; detener la elección si un candidato falla un requisito duro. D03 diseña el contrato y D12 revisa secretos, permisos, PII y licencia; D14 valida. No arrancar PoC hasta tener tarea y ficha de integración `READY` para cualquier código nuevo.

1. Fijar versión local de Twenty y verificar API de metadatos: crear `investor_profile`, `external_id` y siete etapas, consultar/escribir desde API; repetir con un registro sintético y usuario de mínimo privilegio.
2. En SuiteCRM 8, crear módulos/campos «Propiedad», «Unidad» y «Reserva», relacionarlos con lead/oportunidad; operar todo desde API v8, incluido búsqueda, paginación, adjuntos, documento/cotización, auditoría y workflow disparado por cambio de etapa. Marcar cada acción `nativa API`, `ruta propia requerida` o `no posible`; una función visible solo en su UI no cuenta.
3. En Frappe CRM estable, repetir lead→deal, campos/DocTypes propios, workflow/webhook y permisos. Verificar que la versión estable instalada contiene las automatizaciones documentadas y la integración con ERPNext que se pretende usar.
4. Para los tres, ensayar idempotencia, 429/5xx/timeout, recuperación, exportación completa con relaciones, IDs externos, borrado lógico/retención y aislamiento por rol. Cronometrar reconstrucción de réplica desde PostgreSQL local; no usar PII real.

**Criterios de salida:** 100% de operaciones requeridas por las fichas `READY` accesibles con API o extensión de coste documentado; cero uso de edición comercial si el objetivo es OSS completo; campos/relaciones/etapas preservados tras reinicio y actualización; permisos de broker/admin comprobados por llamadas negativas; exportación y recreación demostradas; coste de operación medido. Si Twenty cumple, no migrar. Si falla y SuiteCRM cumple, D03 prepara contrato, mapa y plan de migración reversible para decisión humana. Si tampoco, evaluar Frappe CRM; no declarar un ganador sin estas pruebas.

## Salida y riesgos abiertos

Hasta una decisión posterior, PostgreSQL local retiene la fuente de verdad y `external_refs` enlaza IDs. Para cambiar proveedor: congelar outbox, exportar relaciones y adjuntos en formato abierto, construir nuevo espejo, comparar conteos y hashes, cambiar adaptador, observar y poder volver al anterior. **Sin migración en este expediente.** Desconocidos: volumen real, coste de mantenimiento a tres años, cobertura de acciones administrativas por API, límites de tasa, semántica de borrado/auditoría, cumplimiento DGII/e-CF, compatibilidad exacta de versión y obligaciones AGPL al ofrecer la UI por red. D12 debe revisar estos últimos; este expediente no es dictamen legal.

**Handoff solicitado:** D03 revisa selección/contrato/PoC y confirma el alcance de funciones que deben vivir en la UI propia; D12 revisa seguridad/licencias; D14 revisa criterios de prueba. Ningún perfil aprueba este expediente por sí mismo.
