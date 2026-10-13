# D03 · Revisión independiente de HND-038 (D21, G2)

**Fecha:** 2026-10-04 (America/Santo_Domingo)  
**Revisor:** D03 (`codex-d03-review`)  
**Objeto revisado:** síntesis y matrices de investigación D21 entregadas en HND-038.  
**Resultado:** **aprobado como expediente de investigación exploratoria**, con hallazgos abiertos. No aprueba G2, arquitectura D03, alcance C1 ampliado, porcentaje de cobertura, proveedor, instalación ni uso de datos reales. D03 no revisa su propio dictamen arquitectónico.

## Integridad y alcance del paquete

Los SHA-256 del resumen y de las cuatro evidencias registradas en `.viltrum/handoffs/HND-038.json` coinciden byte por byte con los archivos actuales: síntesis integral, matrices CRM (85), transversal (50), brechas (32) y apéndice de firma. La referencia a catálogo D21 (135) y anexo de 32 brechas existe, aunque ambos son referencias indirectas y no figuran entre los cinco hashes del handoff. El cruce por `key` arroja 85 + 50 + 32 = **167 claves distintas**, de las cuales las primeras dos matrices cubren exactamente las 135 del catálogo; las 32 restantes coinciden con el anexo sin colisiones. Catálogo: 61 etiquetadas contractuales y 74 aspiracionales. D02 propone 2 derivaciones M10 pendientes de ratificación, 21 propuestas y 9 por definir. Estas son cifras de inventario, no denominadores aprobados ni avance medido.

La síntesis consignada en el handoff informa matriz CRM 8 `api_documentada`, 17 `extension`, 54 `propio`, 6 `desconocido`; transversal 7 `si`, 12 `parcial`, 23 `no`, 8 `desconocido`; brechas 17 `parcial`, 1 `no`, 14 `desconocido`. Recalculé la transversal y brechas desde sus CSV: coinciden. La tercera pasada del informe D12 contiene una cifra transversal anterior, 7/14/23/6, que **no coincide** con el snapshot HND-038 (7/12/23/8); la síntesis D21 sí usa el snapshot correcto. D12 tampoco describe ya el contenido actual de `dealroom.participants`/`dealroom.activity`, pues las filas entregadas se cambiaron a `CRM propio`, `desconocido` y aclaran que Papermark Data Rooms es Enterprise. Es una discrepancia temporal del informe D12, no un defecto restante de estas filas D21.

## Hallazgos de arquitectura y evidencia

| ID | Prioridad | Hallazgo y límite |
|---|---|---|
| D03-H038-01 | P1 para implementación | Las 167 claves y la integridad de matrices no prueban exhaustividad ni paridad de UI. El numerador de entrega sigue **no medido**. Solo una prueba vertical UI Quisqueya → BFF/política → puerto → servicio/dato → fallo, por rol y versión, permitirá contar la acción. D21 explicita este límite; se aprueba la investigación, no la cobertura. |
| D03-H038-02 | P1 para implementación | C1 sigue con decisiones abiertas de D02: seis frente a siete etapas, WhatsApp directo frente a API, significado de sincronización iCalendar, purga de papelera, solape CSV y matrícula/intentos de Academy. No se puede convertir 61/135/167 en porcentaje contractual ni añadir las 32 por inferencia. |
| D03-H038-03 | P1 para implementación | La decisión #43 conserva PostgreSQL local como dueño de contacto, lead, negocio y actividad; Twenty es espejo. SuiteCRM permanece alternativa condicional, sin sustituir Twenty hasta prueba de brecha dura. `CrmPort` y outbox actuales son limitados; la integración requiere contrato por capacidad, IDs externos, idempotencia durable, HTTP fuera de lock y permisos. La síntesis respeta estos límites. |
| D03-H038-04 | P1 para selección | [Papermark EE](https://github.com/papermark/papermark/blob/main/ee/README.md) incluye Data Rooms, Q&A y permisos avanzados: no son potencial OSS libre. Las dos filas Deal Room del snapshot ya lo expresan y no cuentan cobertura. [Cal.diy](https://github.com/calcom/cal.diy) es MIT y su README recomienda uso personal no productivo; la API v2 de Cal.com no se hereda. El mapa OSS conserva tablas antiguas, pero tiene advertencia prominente local/Cal.diy; no usar sus tablas como fuente de adopción. |
| D03-H038-05 | P2 | `document.signature` continúa `desconocido`. LibreSign publica [OpenAPI](https://github.com/LibreSign/libresign/blob/main/openapi-full.json), suficiente para justificar PoC local, no para afirmar ciclo completo, seguridad o validez legal RD. OpenSign tiene una excepción de licencia para `apps/OpenSignServer/cloud/customRoute` en su [LICENSE](https://github.com/OpenSignLabs/OpenSign/blob/main/LICENSE); las rutas API libres y la paridad self-host deben mapearse en versión fijada. D21 conserva ambas incertidumbres. |
| D03-H038-06 | P2 trazabilidad | Añadir catálogo 135 y anexo 32 al próximo handoff con SHA propios, junto con edición/versión y enlaces de evidencia por fila. La referencia indirecta es legible pero un paquete de decisión posterior debe inmovilizar todos sus denominadores. |

## Dictamen

**Aprobar HND-038 como entrega de investigación D21**: contiene un corpus trazable, conserva incertidumbres y corrige las atribuciones comerciales importantes. Los hallazgos anteriores condicionan cualquier fase de selección o implementación. La revisión D12 mantiene abiertos identidad/PII, licencia por versión y ausencia de pruebas verticales; D02 requiere ratificación del alcance; D14 debe verificar las futuras pruebas. No se ejecutó PoC, instalación, migración, publicación ni `git push` en esta revisión. No se registra gate.
