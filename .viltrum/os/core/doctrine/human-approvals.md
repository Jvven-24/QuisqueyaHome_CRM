# Aprobaciones humanas: dónde un agente no decide

> Los agentes redactan, preparan, ensayan y verifican. Un humano con nombre decide donde
> hay responsabilidad legal, económica, de seguridad o de reputación. La "A" de un RACI
> es siempre una persona (`templates/raci.md`); un agente solo puede ser R, C o I.

Fuente máquina-legible: `human_approvals` en `registry/orchestration.json`. Evidencia que
respalda este diseño: `docs/research/equipos-software-reales-2026-09-30.md` §6.3–6.4
(DORA 2025, OWASP LLM06 «Excessive Agency», prácticas de Google SRE y Atlassian).

## Puntos de control

| # | Punto | Dueño humano | Cómo se aplica |
|---|---|---|---|
| H1 | Aceptación comercial antes de construir | responsable comercial | **SDK:** `commercial_state` / C1 con evidencia humana real |
| H2 | Arquitectura irreversible y modelo de datos | responsable técnico | **SDK:** G2 y D03 con revisor `human` |
| H3 | Riesgo de seguridad, privacidad y pagos (R3/R4) | responsable legal/privacidad **nombrado** | **SDK:** `plan()` bloquea R3/R4 sin `responsable_legal` en `.viltrum/project.md`; D12 con revisor `human` |
| H4 | Despliegue a producción y migraciones | responsable de operación | **SDK:** G6 con revisor `human`; autonomía A4 solo humano |
| H5 | Comunicación externa o en nombre del cliente | responsable de comunicación | Doctrina: el agente deja un borrador; el envío es humano |
| H6 | Mando de incidente SEV1/SEV2 | comandante de incidente humano | Doctrina D17: comandante y aprobador de posmortem nombrados |
| H7 | Aceptación de riesgo residual | dueño del riesgo | **SDK:** excepción P1 con dueño, plazo y evidencia vigente |
| H8 | Acciones destructivas o con datos reales | responsable de operación | Doctrina: lista cerrada abajo |
| H9 | Validación con usuarios reales / UAT | responsable de producto | Doctrina D04: una simulación no acredita; protocolo humano de reclutamiento y consentimiento |
| H10 | Auditoría de aprobaciones automáticas | responsable del programa | Doctrina: muestreo mensual |

«SDK» significa que el código lo comprueba; «Doctrina» significa que hoy depende de que el
perfil la cumpla y de que el revisor la verifique. No se declara control técnico donde no existe.

## Lista cerrada de acciones que siempre exigen aprobación humana (H8)

`DROP`/`TRUNCATE`/`DELETE` masivo o sin `WHERE` · migración con posible pérdida de datos ·
cambio de roles, permisos o políticas RLS en producción · rotación o revocación de secretos ·
desactivar respaldos, alertas o registros de auditoría · cambio de DNS, dominio o certificados ·
pagos, transferencias o cambios de tarifa · publicación pública o envío de mensajes en nombre
de una persona · `git push --force` o reescritura de historial en ramas protegidas.
La aprobación se registra por operación, ambiente y versión; no se hereda de una anterior.

## Muestreo humano (H10)

Un automatismo que aprueba demasiado se vuelve rutina (sesgo de automatización). Cada mes
un humano revisa una muestra aleatoria de handoffs y revisiones aprobados por agentes y
registra: ¿la evidencia sostenía el veredicto?, ¿qué defecto no se detectó?, ¿qué lección
va a `MEMORY.md`? Si la tasa de hallazgos tardíos sube, se baja la autonomía del perfil.

## Responsables en el proyecto

`.viltrum/project.md` admite `responsable_comercial`, `responsable_tecnico`,
`responsable_operacion` y `responsable_legal`. Solo el último se exige hoy (R3/R4).
Una declaración de actor no autentica identidad: es trazabilidad, no un SSO.
