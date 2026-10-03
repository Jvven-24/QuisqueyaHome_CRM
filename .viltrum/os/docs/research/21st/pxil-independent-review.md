# Revisión independiente de la integración PXIL

Fecha: 2026-09-30. Revisor: subagente `pxil_contract_reviewer` (función D14/D07).
Alcance: lectura estática de contrato, importador, conexión de perfiles y construcción de prompts.
Clasificación: CAMBIO_UI + INTEGRACION, sistema interno R2. Sin aprobación de C1 ni gates.
Estado: **revisión inicial y lecturas sucesivas de correcciones**. La tabla de seguimiento al final
distingue correcciones confirmadas por lectura y brechas pendientes; los hallazgos originales
se conservan como antecedente. Esta revisión no acredita ejecución visual propia,
WCAG completo, permisos del proveedor, entrenamiento de modelos ni funcionamiento de sus herramientas.

## Evidencia examinada

- `skills/viltrum-pxil-design/SKILL.md` y skills complementarias Scout/Library Curation.
- `registry/design-resources.json`, `integrations/pxil/provenance.json`.
- `tools/import_pxil.py`, `tools/connect_pxil_profiles.py`.
- `viltrum_sdk/runtime.py`: `_prompt`, `_fingerprints` y preparación de `contextFiles`.
- `templates/pxil-experience-contract.md`, `departments/D05-ui-design-system/delivery.json`
  (identificación D05 del catálogo; conservar la ruta efectiva del repositorio si cambia su nombre).
- Schemas locales `req`, `scr`, `tst`, `private-library`, `evidence-store`.
- `output/21st/dashboard-sidebar.json`: respuesta almacenada de componente 14941.
- `docs/research/21st/review-console.json`: cero hallazgos, un archivo revisado; evidencia estática.
- `docs/architecture/HANDOFF-PXIL-21ST.md` y estructura de `templates/dashboard.html`.

La referencia 21st contiene URL de preview y código con imports React/Lucide. Este revisor no
renderizó ni capturó sus estados. En la segunda lectura se incorporaron los informes de los
agentes visuales; su alcance y capturas se registran al final sin atribuirnos su ejecución.

## Hallazgos priorizados

### PXIL-R01 · P1 · El conector puede reemplazar personalizaciones locales

`tools/connect_pxil_profiles.py:22,34,63–64` escribe el registro completo, sustituye la
lista `supporting_skills` y copia registro/plantilla a snapshots sin comprobar su hash
anterior. La protección `current in (old, new)` solo cubre contratos/AGENTS instalados.
Reejecutar el comando documentado puede eliminar nuevas skills o decisiones locales.

**Corrección propuesta:** conservar skills ajenas mediante unión estable; usar un manifiesto
de archivos gestionados con SHA previo para registro, plantilla y recursos; preparar todos
los conflictos antes de escribir. Informar `preserved` por archivo, sin sobrescribirlo.
**Cierre:** evidencia de actualización idempotente y de preservación de una edición local.

### PXIL-R02 · P2 · Actualizaciones pueden dejar un snapshot mixto

`tools/connect_pxil_profiles.py:67–70` copia skills/referencias solo si el destino no existe,
mientras sí actualiza otros archivos. La segunda importación puede anunciar recursos nuevos
y ejecutar skills o schemas antiguos. El registro no identifica una revisión de conjunto.

**Corrección propuesta:** actualización condicionada por hash por archivo; `packRevision`
derivada del manifiesto; distinguir versión fuente, versión instalada y conflictos.
**Cierre:** manifiesto que permita demostrar qué versión efectiva carga cada perfil.

### PXIL-R03 · P2 · Schemas y receta no forman siempre parte de las huellas de un run

`runtime.py:_fingerprints` recorre core/registry/departments/skills; no recorre
`integrations/pxil/reference` ni las plantillas. `_prompt` carga las skills complementarias,
pero no resuelve `design_resources` a archivos de contexto. Estos recursos quedan cubiertos
solo si se incorporan explícitamente como fuentes del run por otra ruta.

**Corrección propuesta:** resolver el pack declarado por contrato a una lista acotada de
fuentes dentro del paquete permitido, registrar sus hashes y rutas efectivas. Mantener lectura
bajo demanda y presupuesto de contexto; no inyectar todo el catálogo.
**Cierre:** un recibo de run con referencias/hashes y señal de invalidez al cambiar una fuente.

### PXIL-R04 · P2 · Catálogo visual sin evidencia estructurada de evaluación

El registro actual tiene un `catalogReference`; `private-library.schema.json` requiere
identidad/fuente/código, pero no licencia, captura, viewport, hash, estado, decisión o revisor.
La respuesta guardada de 21st no equivale a una evaluación del comportamiento y su metadata
de dependencias no debe sustituir la inspección de imports. Una captura del preview acredita
su apariencia en ese viewport, nunca estados que no fueron ejecutados.

**Corrección propuesta:** adjuntar una evaluación conforme a
`templates/pxil-component-evaluation.md`. Separar `provider_preview`,
`local_candidate_render` y `integrated_dashboard`; conservar URL/ID de catálogo y hash
del código consultado. Licencia sin verificar = pendiente; no inferirla por ser público.
**Cierre:** candidatos comparables, capturas por estado/ancho, decisión de adaptación y
revisión independiente. No guardar tokens/API keys en comandos de procedencia.

### PXIL-R05 · P2 · Trazabilidad definida como procedimiento, todavía sin instancia completa

La skill exige REQ→MOD→FLOW→SCR→STA→EVT→API/DATA/PERM→TST, pero la plantilla vacía y
schemas individuales no prueban enlaces entre objetos, unicidad o cobertura de estados.
La exclusión del linter mock original es correcta. No corresponde declarar trazabilidad validada.

**Corrección propuesta:** instanciar la receta del dashboard de abajo; asignar IDs estables y
evidencia a cada criterio; luego implementar un validador de enlaces que falle con IDs ausentes,
duplicados o estados obligatorios sin justificación. Declarar el dialecto de cada schema.
**Cierre:** reporte reproducible con entradas/versiones y errores reales, revisado por D14.

### PXIL-R06 · P3 · Procedencia con fecha fija y sin revisión del importador

El importador registra buenos hashes de fuente/copia y límites de lectura, pero fija
`snapshotDate` a 2026-09-30 y no incluye revisión del importador ni marca temporal de captura.
Una actualización posterior resultaría indistinguible por fecha humana.

**Corrección propuesta:** `capturedAt` UTC real, fecha declarada de fuente separada y hash o
commit del importador. Preservar la atribución; no convertir rutas locales privadas en telemetría.

## Propuesta Screen Recipe del dashboard

Versión: propuesta 1; D04 responsable del flujo, D05 de composición, D06 de estados,
D07 de accesibilidad, D14 revisor de evidencia. IDs siguientes **propuestos**, no requisitos
ya aceptados por cliente. La consola mantiene acciones de operación por CLI mientras no
exista mandato independiente para escritura desde navegador.

| Pantalla | Necesidad y flujo | Composición | Datos / permiso | Aceptación pendiente |
|---|---|---|---|---|
| SCR-OPS-01 Resumen | REQ-OPS-01 entender actividad → FLOW-OPS-01 diagnosticar | Shell 21st adaptado + métricas + lista reciente + bloqueos | GET console/status/runs; lectura local | Distinguir ejecutando, suspendido e histórico; origen/fecha visibles |
| SCR-OPS-02 Ejecuciones | REQ-OPS-02 rastrear entrega → seleccionar run → tarea → revisión | Tabla accesible + inspector persistente | Run/tareas/artefactos; sin aprobación desde UI | Productor y revisor distintos; evidencia y artefacto vigente visibles |
| SCR-OPS-03 Departamentos | REQ-OPS-03 conocer capacidad → filtrar → seleccionar perfil | Tarjetas densas + inspector; controles con nombres | 23 perfiles, contrato, skills, acceso efectivo | Separar declarado/disponible/ejecutado; mostrar pack y versión |
| SCR-OPS-04 Entradas | REQ-OPS-04 rastrear origen → evento → run | Grupos de solicitudes/fuentes/webhooks + vínculos | Payload redactado, estados reales | Fuente a ejecución localizable; sin credenciales ni éxito inventado |
| SCR-OPS-05 Comunicación | REQ-OPS-05 seguir handoffs → evento → participantes | Timeline/lista ordenada + detalle | Eventos persistidos, no chat supuesto | Orden temporal, actor y vínculo verificables |
| SCR-OPS-06 Arquitectura | REQ-OPS-06 entender dependencias → nodo → contrato/revisor | Pipeline + nodos seleccionables + inspector | Configuración frente a ruta observada | No representar instalación como conexión o permiso acreditado |

### Estados, eventos y recuperación

| STA | EVT | Feedback y recuperación | Comprobación a registrar |
|---|---|---|---|
| STA-OPS-LOAD | EVT-OPS-LOAD inicio/cambio proyecto | Esqueleto y texto de carga sin cifras falsas | Captura y estado accesible |
| STA-OPS-EMPTY | EVT-OPS-FILTER / respuesta sin filas | Diferenciar sin datos de sin coincidencias; limpiar filtro | Captura con filtros y dataset |
| STA-OPS-PARTIAL | EVT-OPS-PARTIAL endpoint incompleto | Sección pendiente + último dato conocido etiquetado | Endpoint/fecha/sección afectados |
| STA-OPS-ERROR | EVT-OPS-FAIL error servidor | Mensaje concreto + reintentar | Evidencia de fallo y recuperación |
| STA-OPS-OFFLINE | EVT-OPS-DISCONNECT | Datos anteriores marcados obsoletos; reconectar | Fecha observada, sin prometer tiempo real |
| STA-OPS-READY | EVT-OPS-SYNC respuesta válida | Estado conectado y actualización conservando foco/selección | Capturas antes/después del polling |
| STA-OPS-DENIED | EVT-OPS-403 | Explicar permiso insuficiente sin mostrar datos protegidos | Respuesta 403 y estado UI |
| STA-OPS-PAUSED | EVT-OPS-PAUSE | Pausa explícita y reanudar | Contenido no cambia hasta reanudar |

Conflicto de escritura/cancelación de tareas: no aplican al alcance de lectura de esta
receta. Pausar refresco no cancela agentes; debe indicarse junto al control.

### Criterios visuales y accesibles

- 360, 768 y 1440 px como muestra inicial; añadir ancho real del usuario. Anchos aún no
  evaluados quedan pendientes. Capturar layout completo y un detalle por componente candidato.
- En móvil, una sola columna y selector/inspector navegables sin perder el contexto; tablas
  pueden desplazarse en su contenedor, nunca obligar a desplazar la página completa.
- Semántica nativa, foco visible, teclado, nombres accesibles, zoom 200 %, contraste y
  movimiento reducido requieren evidencia específica. Captura estática no acredita teclado.
- El catálogo 21st aporta candidatos. La selección debe seguir la tarea del operador,
  densidad de datos y estados requeridos. Evitar animación decorativa que distraiga del estado.

## Handoff y decisión

### Lectura independiente final de las correcciones

Fecha: 2026-09-30. Método: inspección estática; no ejecución del conector, mutación de fuentes
de prueba ni ejecución nueva de modelos. Huellas de las versiones examinadas:

| Archivo | SHA256 |
|---|---|
| `tools/connect_pxil_profiles.py` | `d4b600f16cef1ba7e439b4ee44a64d3f6dd156f1193722f1b2f2a9ced2609821` |
| `viltrum_sdk/runtime.py` | `d78643792024e57fbb8be4f5eaf790ed27c902bb70094aea9e1ba7e8ef370cd3` |
| `tools/import_pxil.py` | `f7df729c7ac37c9b44a9be75d01147aaf297daaf59c34f5db32888b7796059ae` |
| `skills/viltrum-pxil-design/SKILL.md` | `4ecb2e75d2f39046361fc5e8d0f782936588de7fed8f056c5745a4af60555af2` |

| Hallazgo inicial | Estado actual | Evidencia y brecha residual |
|---|---|---|
| R01: sobrescritura de personalizaciones | **Corregido por lectura para los casos señalados** | Registro conserva valores existentes; `supporting_skills` usa unión estable; recursos del snapshot requieren hash igual al nuevo o al ledger previo. Un cambio desconocido se conserva y se informa. No se probó recuperación ante interrupción de escritura. |
| R02: recursos existentes nunca se actualizan | **Corregido por lectura para archivos gestionados** | Se recorre cada fuente y se actualiza cuando coincide con `pxil-managed-files.json`; archivos distintos se preservan. Existe ledger local y `packRevision` en procedencia. El resultado `preservedLocalChanges` sigue siendo necesario para detectar un snapshot parcial; la revisión de conjunto no implica que toda copia local sea idéntica. |
| R03: falta de huellas/contexto PXIL | **Corregido por lectura en instalación local contenida en proyecto** | `_fingerprints` incorpora `integrations/pxil` y ambas plantillas. `_prompt` embebe registro y receta hasta 12.000 caracteres cada uno. La creación del run añade registro, dos plantillas y hasta 16 schemas cuando productor o revisor tiene PXIL; solo incluye rutas resueltas dentro del proyecto. Si dataRoot está fuera, no se autoriza su acceso por esta ruta: instalar el pack localmente o aportar contexto explícito. No afirmar que se ejecutó validación de schemas. |
| R04: evidencia visual sin ficha estructurada | **Mejorado; ficha y licencia pendientes** | Existen informes/capturas de dos agentes y plantilla de evaluación. No se instanció todavía un registro por candidato con licencia y matriz de estados completas. |
| R05: cadena sin instancia/verificador | **Extensión futura explícita** | La receta propuesta y plantilla no son una cadena instanciada y validada. Ningún reporte recibido prueba integridad REQ→TST completa; esta integración metodológica no lo declara completo. |
| R06: fecha fija/procedencia | **Corregido por lectura y metadatos generados** | El importador usa fecha UTC real, capturedAt, revisión derivada de records y SHA del importador. Procedencia leída: capturedAt `2026-09-30T14:24:51.821485+00:00`, packRevision `0cdd2ee70be887f41324aa799fb2a76286767cfbb32635efa7b829cebf0ce94b`. |

**Brecha adicional cerrada por lectura:** el conector ya incluye
`templates/pxil-component-evaluation.md`. La lectura de hashes confirma que esa plantilla
y `integrations/pxil/provenance.json` coinciden con sus fuentes en los snapshots
`.viltrum/os` y `tmp/runtime-demo/.viltrum/os` (cuatro comparaciones iguales). Esto acredita
estos archivos efectivos; no constituye una prueba de todas las rutas de error del conector.

El procedimiento de subagentes sí está ahora en la skill operativa: scouting acotado,
captura, contrato, revisión, implementación y memoria. Su presencia instruye al host;
no prueba por sí sola disponibilidad de herramientas ni ejecución de cada rol.

### Evidencia visual aportada por otros revisores

- [Investigación visual](visual-scout.md), agente `design_visual_scout`: dos candidatos,
  Sidebar y App Dashboard Layout; previews oficiales visibles, límites y recomendación de
  adaptar patrones. Licencias de redistribución y estados móviles del catálogo quedan pendientes.
- [Revisión de consola](console-independent-review.md), agente `console_visual_reviewer`:
  D05, búsqueda, inspector, expansión con Enter y móvil 390×844. Reporta ausencia de overflow
  horizontal del documento. En su revisión final el mismo revisor cerró independientemente
  ambos defectos P2 de nombre accesible/selección después de recarga y confirmó nueve perfiles
  con el filtro PXIL. No equivale a una auditoría WCAG completa.
- Confirmada por lectura de directorio la existencia de capturas `21st-sidebar-preview.png`,
  `21st-app-preview.png`, `console-d05-desktop.png`, `console-d05-mobile.png` y otras en
  `output/design-review/`. Este revisor no repitió esas interacciones ni inspeccionó sus píxeles.

Dictamen acotado: las correcciones estáticas de preservación e invalidación señaladas son
coherentes. Se puede continuar la integración sin declarar trazabilidad completa, licencia
de redistribución ni validación de todos los estados. Las brechas de la tabla conservan dueño
y evidencia pendiente; no se otorga una aprobación global del producto.

### Procedimiento de subagentes solicitado por el usuario

1. D00 entrega un mandato con SCR, tareas del usuario, stack, restricciones y candidatos
   necesarios. La búsqueda se limita a necesidades concretas; nunca se recorre todo el catálogo.
2. **Scout D21/D05:** consulta CLI/MCP oficial 21st, obtiene candidatos acotados y devuelve
   IDs, URLs, autor, dependencias/licencia comprobadas o pendientes y razón de pertinencia.
3. **Captura D05:** abre únicamente candidatos seleccionados en navegador y registra captura
   del componente visible con viewport/estado/fecha. Si hay render local autorizado, registra
   su hash y entorno; no llama a la imagen del proveedor «componente probado». Devuelve el
   manifiesto de evidencia, sin descargar media remota para evitar restricciones.
4. **Contrato D04/D06/D08:** compara capacidades con SCR, estados, permisos, feedback y
   recuperación. Decide reutilizar/adaptar/crear y entrega una receta con IDs y evidencia.
5. **Implementación D09:** recibe la receta revisable; modifica solo archivos asignados y
   conserva endpoints y datos reales. El permiso de construcción proviene del mandato/C1 aplicable.
6. **Revisión D07/D14:** agente distinto del productor revisa contraste/semántica/teclado,
   estados y capturas de la integración. Emite alcance exacto, pendientes y dictamen.
7. D22 conserva únicamente variantes revisadas con su versión/hashes. D00 integra resultados
   y mantiene los hallazgos abiertos hasta evidencia suficiente.

Scout y contrato pueden avanzar en paralelo; captura depende de candidatos y revisión depende
de entrega. Evitar dos agentes editando el mismo archivo o navegando simultáneamente la misma
pestaña. Cada agente registra su identidad y sus fuentes, y no aprueba su propio trabajo.

La conexión metodológica es verificable por inspección del código. La implementación visual
y la cobertura completa siguen sujetas a evidencia. Se entrega esta revisión al coordinador;
el productor puede corregir hallazgos, pero su cierre debe ser confirmado independientemente.
No se ejecutaron los scripts de importación/conexión ni pruebas visuales durante esta revisión.
