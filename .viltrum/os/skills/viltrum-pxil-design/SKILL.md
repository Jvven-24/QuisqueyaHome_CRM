---
name: viltrum-pxil-design
description: Conecta PXIL con los perfiles de experiencia, UI, estados, accesibilidad y frontend de Viltrum mediante contratos y evidencia.
---

# PXIL dentro de Viltrum

Usar en D04/D05/D06/D07/D08/D09 y en sus revisiones D14/D21/D22.
Viltrum conserva fases, revisores, gates y aceptación C1. PXIL aporta el contrato de experiencia.
Esto es metodología disponible, no entrenamiento de pesos ni acceso acreditado a servicios.

## Flujo obligatorio

1. Leer el contrato del perfil, el alcance aceptado y `registry/design-resources.json`.
2. Recorrer REQ → MOD → FLOW → SCR → STA → EVT → API/DATA/PERM → TST.
   Cada elemento conserva ID, versión, propietario, fuente y enlaces. Marcar faltantes como pendientes.
3. D04 define tareas/recorridos y pantallas. D06 define estados y transiciones; D08 el feedback.
   Para cada pantalla cubrir inicial, carga, vacío, parcial, error, offline, éxito y sin permiso;
   añadir conflicto/cancelación cuando apliquen. Registrar explícitamente los no aplicables.
4. D05 inspecciona primero PXIL y las bibliotecas/componentes existentes del proyecto,
   abriendo y reutilizando el código desde su ruta local cuando cubra la necesidad. No
   requiere registry CLI ni instalar herramientas para esa inspección. Solo si PXIL/local
   no cubre la necesidad y el proyecto autoriza explícitamente la búsqueda externa, usar
   CLI/MCP oficial de 21st: `npx @21st-dev/cli search "necesidad concreta" --context auto`
   y `get ID --json`. Registrar autor, URL, dependencias, licencia/procedencia y adaptación
   al stack. No scraping, publicación automática, entrenamiento con el catálogo ni compras
   implícitas.
5. Preparar tokens semánticos y Screen Recipe: jerarquía, datos, componentes, puntos de corte,
   estados, acción/permisos/feedback/auditoría/recuperación y aceptación por pantalla.
6. D07 revisa semántica, contraste, foco, teclado, zoom y movimiento reducido.
   D09 implementa con el stack existente solo si el mandato y C1 lo permiten.
7. D14 revisa evidencia funcional/visual; D22 incorpora únicamente patrones revisados.
   Una captura o archivo existente no acredita todos los estados ni una auditoría WCAG completa.

## Artefactos y herramientas

- Plantilla: `templates/pxil-experience-contract.md`.
- Referencias y schemas: `integrations/pxil/reference/`; procedencia: `integrations/pxil/provenance.json`.
- Validar instancias JSON con un validador compatible con el dialecto declarado de cada schema.
  Los schemas originales son estructurales y no prueban por sí solos integridad entre enlaces.
- XState, Storybook, Onlook, Playwright y axe son candidatos: comprobar instalación y permisos
  en cada proyecto antes de invocarlos. Repositorio clonado no significa herramienta conectada.
- El `traceability-linter.js` original solo imprime éxito: NO usarlo como evidencia.
- Gates PXIL se nombran `PXIL-G0` … `PXIL-G8`; nunca equivalen automáticamente a gates Viltrum.

## Open Design: puente de contexto, no import de runtime

Open Design entrega contexto de diseño a PXIL —prompts, tokens, fixtures e índice de
fuentes—; no instala ni importa componentes en el runtime del producto. El flujo por
defecto inspecciona primero el componente PXIL/local desde su ruta de código fuente y lo
reutiliza directamente si satisface el contrato. El perfil que implementa debe abrir e
inspeccionar ese código y verificarlo en el stack destino.

Antes de instalar una CLI para descubrir componentes, inspeccionar primero las fuentes
locales disponibles: biblioteca Viltrum/PXIL, componentes del proyecto y ejemplos que se
puedan abrir y revisar. Instalar una herramienta solo si una necesidad concreta sigue
sin resolverse y el flujo del proyecto lo autoriza. La disponibilidad de una galería o un
paquete de contexto no prueba que su código sea compatible ni ejecutable en la aplicación.

Un paquete reutilizable debe incluir un fixture real que renderice el componente desde su
fuente, además de un índice que permita localizar y auditar esa fuente. Un índice
metadata-only describe candidatos pero no contiene ni demuestra un fixture ejecutable, el
código fuente o la integración con el runtime. Cada entrada del
índice registra como mínimo ruta y revisión del código fuente, framework, dependencias,
licencia y procedencia, compatibilidad con el stack destino y evidencia QA. QA identifica
viewport(s), estados cubiertos, resultado de build/test y revisión relevante de teclado,
contraste y movimiento reducido. El fixture debe enlazar a la entrada del índice; una
imagen de referencia o una maqueta sintética no sustituye ese fixture.

La adopción, incluida la reutilización entre proyectos, requiere licencia/procedencia
verificadas y compatibilidad confirmada entre framework, dependencias y stack destino para
el uso previsto. Si cualquiera de ellas sigue sin resolver, el ingrediente queda
`reference-only`: puede orientar composición y evaluación, pero no copiarse, adaptarse,
instalarse ni incorporarse al producto hasta resolverlo. No completar metadatos por
suposición.

Informar por separado el estado del servicio y el de la experiencia: `listening` solo
significa que el daemon abrió su socket; `api_verified` exige una respuesta válida del
endpoint esperado; `app_verified` exige comprobar la aplicación o flujo objetivo. Guardar
URL, endpoint/flujo, resultado y hora de la verificación. Un proceso activo, una respuesta
de health o una galería preparada no acreditan por sí solos que la API y la app estén
verificadas.

## Salida y revisión

Entregar contrato, inventario de componentes, matriz de estados, trazabilidad y evidencia por ancho.
El revisor independiente declarado del departamento decide sobre el alcance de esa entrega.
Conservar pendientes, fuentes sintéticas y limitaciones; no producir aprobaciones ficticias.

## Selección visual con subagentes

Cuando se comparan candidatos o se rediseña una interfaz, D00 asigna responsabilidades
separadas. Utilizar subagentes del host realmente disponibles; no inventar agentes activos.

1. **D21 / scout:** inspeccionar primero componentes PXIL/locales por ruta de fuente y
   reducir a 2–3 candidatos compatibles con la Screen Recipe. Usar 21st por CLI/MCP solo
   como fallback cuando lo local no cubra la necesidad y exista autorización explícita del
   proyecto. Entregar IDs, fuente, URL cuando aplique, dependencias y motivo de selección.
2. **D05 / captura visual:** abrir previews oficiales en pestañas propias y tomar capturas
   del shell/componente y de sus estados visibles. Guardar viewport, fecha, fuente y SHA256.
   Si se modifica un viewport compartido, coordinar y restaurarlo. No scraping masivo.
3. **D06 / contrato:** comprobar que cada candidato soporta datos, estados y acciones de
   la receta. Una captura bonita no acredita comportamiento, permisos o recuperación.
4. **D07 o revisor declarado / revisión:** comparar capturas y semántica de forma independiente.
   Revisar foco, nombres accesibles, navegación y adaptación móvil; registrar fallos y límites.
5. **D09 / implementación:** adaptar el patrón elegido al stack actual, sin datos ficticios.
   Capturar el resultado local y contrastarlo con el objetivo de la pantalla.
6. **D22 / memoria:** archivar decisión, capturas y hallazgos. Solo promover componentes
   revisados, con procedencia/licencia y evidencia suficiente para el uso declarado.

Usar `templates/pxil-component-evaluation.md` para la comparación cuando esté disponible.
Si una herramienta o subagente falla, registrar el bloqueo y el trabajo manual realizado;
no declarar revisión independiente cuando todo lo realizó el mismo actor.

## Biblioteca de diseño por proyecto

Cuando el perfil recibe un encargo que cubre pantallas, ejecutar el ciclo por cada pantalla
del brief, conservando un solo ID de brief para el lote. Las órdenes trabajan en el proyecto
indicado; no reemplazan su contrato, mandato, C1 ni revisión independiente.

```powershell
viltrum design PROJECT brief --file pantallas.json
viltrum design PROJECT status
viltrum design PROJECT search --query "necesidad concreta" --limit 8
viltrum design PROJECT acquire --id ID
viltrum design PROJECT capture --id ID --file preview.png --actor ACTOR --kind provider_preview
viltrum design PROJECT prepare --brief-id ID
```

La búsqueda local consulta interfaces GET de solo lectura; `acquire` guarda el resultado
como texto en `.viltrum/design/`, que no se ejecuta. La consulta externa a 21st por CLI/MCP
es únicamente un fallback si PXIL/local no cubre la necesidad y el proyecto la autoriza
explícitamente. Si se recibe un archivo JSON de resultados en vez de una consulta en vivo,
usar `import-search --file resultados.json`. Ejecutar búsqueda, adquisición y captura
únicamente para candidatos pertinentes; no rastrear el catálogo en masa.

Responsabilidades: D21 reduce candidatos y registra procedencia; D05 captura previews
oficiales y prepara la comparación; D06 contrasta datos, estados y eventos con la receta;
D07 revisa accesibilidad; D09 implementa solo con alcance/mandato válidos y C1 cuando
corresponda. D14 mantiene revisión independiente y D22 incorpora solo patrones aprobados
para el alcance expresamente revisado. `prepare` produce un plan lexical de handoff para
las pantallas, no una decisión de calidad, gate, mandato ni C1. La consola presenta el
estado/evidencia existente y no acredita por sí sola que un perfil ejecutó el flujo.

El selector local determinista y la inspección directa del código PXIL/proyecto son la ruta
por defecto. Un ranking remoto tipo Jev puede proponerse después como opción, solo sobre
candidatos ya filtrados y mediante una integración verificada; no se presupone endpoint,
soporte de imágenes ni credencial/API.
Toda pantalla mantiene selección humana y evidencia visual comparable. No enviar capturas
ni contenido privado a servicios externos sin autorización específica.
