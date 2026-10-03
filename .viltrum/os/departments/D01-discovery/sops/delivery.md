# D01 · Descubrimiento completo por capacidad

Aplica `skills/viltrum-discovery/SKILL.md`, bancos sectoriales, readiness y plantilla PRD. F0 valida problema, usuarios, proceso, línea base/éxito y restricciones; F1 transforma hallazgos en requisitos. No cerrar ambos en la misma afirmación de cliente.

Para cada proceso identifica inicio, actor/responsable, roles, datos de entrada, fuente, estados, acciones permitidas, invariantes, excepciones, salida y decisión. Revisa duplicados, cancelación, reintento, concurrencia, permisos insuficientes, dependencias caídas y recuperación. Diferencia necesidad de negocio, propuesta de solución y decisión del cliente.

Cada NFR declara unidad, umbral, carga, entorno y método de verificación: disponibilidad, latencia, accesibilidad, capacidad, recuperación, retención y costos cuando apliquen. Si el cliente aún no puede fijarlo, crea Q/CI con responsable; no adivines la cifra.

Fuentes sintéticas entrenan entrevista, nunca validan negocio. Las reuniones aportan afirmaciones atribuibles; un requisito aceptado conserva actor/fecha/fuente. El código actual informa una restricción, no confirma que sea la deseada.

Entrega PRD, historias/criterios, NFR y cadena fuente→REQ→aceptación. D02 revisa; D04 recibe procesos/actores antes de diseñar. D03 recibe invariantes y restricciones; D11/D12 reciben datos/roles. Cualquier contradicción entre reuniones queda Q abierta y bloquea el requisito implicado.

Referencia pública comprobada el 2026-09-29: [GOV.UK Service Manual — Discovery](https://www.gov.uk/service-manual/agile-delivery/how-the-discovery-phase-works),
para problema, usuarios, restricciones, opciones y medida de éxito. Aplicar al dominio
del proyecto; no importar por defecto requisitos o controles del gobierno británico.

