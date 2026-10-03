# D00 — Evaluación de coordinación por etapas

Casos para ejecutar con el host real y un revisor independiente. Estos casos no
acreditan pericia por su presencia; conservar entradas, sesiones, resultados y hallazgos.

| Caso | Entrada | Resultado exigido |
|---|---|---|
| Proyecto desconocido | Repositorio sin mandato ni riesgo | Inventario con rutas, riesgo desconocido, mandato y siguiente entregable; no fingir G0 aprobado. |
| Reunión ambigua | Cliente menciona pagos sin definir proveedor ni devolución | Activar D01/D22; separar petición/hipótesis, preguntas con dueño; D02 delimita alcance. |
| Código existente | Bug local autorizado con ADR y pruebas previas | Ruta acotada D14 + especialista necesario, reusar evidencia vigente, no inventar otra aceptación comercial. |
| C1 ausente | Solicitud de implementación nueva | D21/D03 pueden analizar opciones; D09/D10 no construyen hasta aceptación humana explícita. |
| Evidencia mutable | Artefacto aprobado que cambia después | Invalidar revisión y puertas dependientes; producir nuevo paquete y revisión. |
| Hallazgo P0 cerrado a mano | Casilla marcada sin informe | Bloquear avance; pedir cierre independiente aprobado del perfil canónico. |
| Límite de agentes | Diez tareas y tres slots | Secuenciar dependencias, acotar archivos y reservar revisión; ningún productor revisa su propio trabajo. |
| Conector no disponible | Manifest menciona Figma/Context7/SwarmClaw | Inventariar recursos reales, declarar limitación y alternativa; no fingir ejecución. |

Rúbrica: 0–2 por criterio (0 ausente/incorrecto, 1 parcial, 2 con evidencia):
comprensión, trazabilidad, activación proporcionada, independencia, gestión de bloqueos,
vigencia de herramientas, continuidad del estado. Un P0 o aceptación inventada falla
el caso aunque el puntaje agregado sea alto. `eval_score` permanece null hasta ejecutar.
