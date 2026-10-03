---
name: viltrum-runtime-review
description: Revisa de forma independiente entregas y evidencias de un run Viltrum y registra aprobación o rechazo sin confundir revisión del run con aprobación de fase o producción.
---

# Revisar un run Viltrum

Usa esta skill al recibir una entrega producida por otro actor. Localiza proyecto, OS, ID del run/tarea, entrega, productor y versiones. Lee contrato/SOP del perfil, criterios pertinentes de la fase y revisor en `registry/departments.yaml`. Contrato SDK 0.3: runs de lectura/análisis; consulta `viltrum --help` y `viltrum run-review --help` antes de registrar el resultado.

## Independencia y alcance

Comprueba que el actor revisor es distinto del productor y tiene la autoridad canónica para el perfil. Otro nombre o prompt dentro de una misma ejecución no demuestra independencia. Identificadores declarados por CLI no autentican a personas ni prueban aceptación humana; conserva evidencia del actor real según el host. Si no existe revisor real, deja la revisión pendiente.

Recibe mandato, entradas, artefactos, resultados de herramientas, hallazgos, IDs de requisitos y hashes. Lee los archivos actuales, no solo el resumen del productor. Verifica que las rutas resuelven dentro del alcance autorizado y que hashes/versiones coinciden con lo entregado. No aceptes evidencia cambiada, ausente, enlaces inaccesibles o una captura sin build/entorno identificables como prueba de un criterio distinto.

## Decisión

Para cada criterio relevante registra evidencia, resultado y límite: aprobado, fallido, no ejecutado o no aplicable con razón. Un documento de diseño demuestra especificación; ejecución necesita resultado reproducible de la herramienta. Una simulación del runtime demuestra su flujo bajo ese fixture; no demuestra calidad de frontend, seguridad de API ni necesidad del cliente.

Usa las pruebas/checks pertinentes ya autorizadas para comprobar conducta y riesgos. Revisa permisos y cruces de tenant, estados y recuperación, idempotencia y efectos inciertos cuando el contrato los incluya. Para agentes revisa también grounding, instrucciones indirectas, límites de herramientas y presupuesto. No agregues producción ni datos reales al alcance de una revisión en sandbox.

Conserva hallazgos con severidad, ubicación, reproducción, dueño y evidencia. P0 bloquea. P1 necesita el tratamiento y aceptación independiente definidos por el OS; no lo cierres por declaración del productor. El revisor observa y entrega correcciones al dueño: corregir el trabajo durante esta misma revisión convierte ese cambio en una entrega que necesita otro revisor.

Escribe el informe dentro del proyecto, registra fecha, actor, perfil revisor, run, tarea, criterios, rutas/hashes, resultados y pendientes. Asocia el informe con la entrega mediante:

```text
viltrum run-status PROJECT --run-id RUN_ID
viltrum run-review PROJECT --run-id RUN_ID --task-id TASK_ID --actor ACTOR_REVISOR_REAL --result approved|rejected --report FILE
```

Sustituye valores en mayúscula por los reales y elige un único resultado (`approved` o `rejected`); `FILE` es un informe existente dentro del proyecto. Un registro con `approved` exige haber revisado realmente; el CLI valida estructura/integridad y no realiza tu juicio profesional. El backend puede producir ejecuciones separadas para productor/revisor; verifica sus actores y evidencia. Cuando el revisor es humano, conserva pausa y recepción de decisión explícita.

## Fase y continuación

Una revisión de run o handoff no cierra automáticamente una fase. Para `gate-review`, comprueba [lifecycle](../../core/lifecycle.md) y [orquestación](../../core/orchestration.md): todos los paquetes requeridos, preguntas bloqueantes, hallazgos, gates previos, C1 cuando aplique y evidencia vigente. Si no eres el revisor canónico de fase, entrega el paquete a quien lo sea. Aprobaciones humanas requieren evidencia humana real.

Rechazo: registra qué artefacto/criterio falla y la corrección necesaria; conserva la entrega original y pide nueva versión. Aprobación: habilita únicamente la transición que el SDK y el mandato admitan. No escribas checkpoints o estado manualmente para forzar continuación. Si el contenido cambia después de aprobar, invalida el resultado dependiente y repite la revisión del cambio.

**Salida:** informe atribuible y vigente, decisión por criterios, registro asociado al run/handoff, hallazgos y siguiente transición permitida. La skill no convierte revisión documental en evaluación certificada ni fine tuning.
