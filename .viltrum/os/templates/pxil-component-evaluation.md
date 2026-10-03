# PXIL — Evaluación de componente y evidencia visual

Estado: **borrador / pendiente de evaluación**. ID evaluación: __. Versión: __.
Proyecto/pantalla SCR: __. REQ/FLOW relacionados: __. Fecha UTC: __.
Productor: __. Revisor independiente: __. Alcance/C1 aplicable: __.

## Handoff entre subagentes

| Función | Actor | Entrada | Entrega / evidencia | Estado |
|---|---|---|---|---|
| Scout D21/D05 | | Necesidad SCR y stack | Candidatos oficiales acotados | pendiente |
| Captura D05 | | IDs/URLs seleccionados | Capturas y manifiesto por estado/ancho | pendiente |
| Contrato D04/D06/D08 | | Candidatos + estados requeridos | Receta y decisión de adaptación | pendiente |
| Implementación D09 | | Receta + mandato aplicable | Versión integrada y cambios | pendiente |
| Revisión D07/D14 | | Entrega + evidencia | Dictamen independiente | pendiente |
| Memoria D22 | | Versión revisada | Índice del patrón y hashes | pendiente |

Las capturas siguen los candidatos seleccionados; no son un rastreo masivo del catálogo.
Un navegador compartido requiere turnos o pestañas independientes. El revisor debe ser un
actor diferente del productor. Registrar bloqueos de herramienta en vez de simular evidencias.

## Candidato y procedencia

Nombre: __. ID y autor del catálogo: __. URL oficial: __.
Consulta/mecanismo autorizado (CLI/MCP oficial, sin secretos): __.
Código consultado: ruta __; SHA256 __; revisión/fecha __.
Licencia: __; evidencia/URL __; estado **verificada / pendiente**.
Dependencias declaradas: __. Imports observados: __. Compatibilidad con stack: __.
Adaptación prevista: **patrón / código / componente sin cambios**. Atribución requerida: __.
Alternativa de biblioteca propia y razón para reutilizar/adaptar/crear: __.

## Registro de capturas

No confundir el preview del proveedor con un componente ejecutado localmente.
Una captura solo acredita su estado y viewport registrados; no prueba interacciones ocultas.
Para media remota conservar el enlace original; no descargarla para evitar restricciones.

| Evidencia ID | Tipo | URL o ruta local | SHA256 local, si aplica | Viewport / DPR | Estado / variante | Fecha UTC | Capturó |
|---|---|---|---|---|---|---|---|
| EV-__ | provider_preview / local_candidate_render / integrated_dashboard | | | | | | |

Datos de muestra: **reales redactados / sintéticos**, descripción __.
Entorno/commit del render local: __. Comando o pasos reproducibles: __.
Captura antes: __. Captura después: __. Limitaciones observadas: __.

## Evaluación comparada

Usar **aprobado / falla / pendiente / no aplica con motivo**, nunca completar por suposición.

| Criterio | Resultado | Evidencia y observación | Corrección / responsable |
|---|---|---|---|
| Apoya tarea y jerarquía de SCR | pendiente | | |
| Densidad y lectura de datos reales | pendiente | | |
| Tokens semánticos y consistencia | pendiente | | |
| Responsive 360 / 768 / 1440 px | pendiente | | |
| Carga, vacío, parcial, error y offline | pendiente | | |
| Éxito, permiso y recuperación | pendiente | | |
| Semántica y nombres accesibles | pendiente | | |
| Teclado y foco, incluida restauración | pendiente | | |
| Contraste y zoom 200 % | pendiente | | |
| Movimiento reducido | pendiente | | |
| Refresco conserva selección/foco/scroll | pendiente | | |
| Licencia y dependencias | pendiente | | |
| No confunde capacidad declarada con ejecución | pendiente | | |

## Contrato de comportamiento

| STA | EVT | Acción / PERM | API / DATA | Feedback | Recuperación | TST / evidencia |
|---|---|---|---|---|---|---|
| | | | | | | |

## Decisión y promoción

Selección: __. Candidatos descartados y motivo: __. Pendientes: __.
Dictamen del revisor: **pendiente / aprobado para alcance explícito / rechazado**.
Identidad del revisor y fecha: __. Evidencia revisada: __. Hallazgos abiertos: __.
Versión aprobada y hash: __. Alcance exacto autorizado para biblioteca: __.

Solo D22 incorpora la versión revisada al catálogo gestionado. La aprobación de esta ficha
no aprueba una fase, C1, publicación ni acceso de herramientas y modelos.
