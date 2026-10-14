# D05 · Casos de evaluación de UI y sistema de diseño

Fecha: 2026-09-29. **Estado: definidos, no ejecutados.** `eval_score` permanece `null`. Aplicar la skill `viltrum-ui-design-system` y `sops/delivery.md` a cada caso en un entorno aislado; el evaluador entrega los insumos y conserva resultados sin revelar las respuestas esperadas al productor.

## Caso 1 · Pantalla sin contrato de datos

**Entrada:** Pedido «haz un dashboard moderno para gerencia». Hay paleta de marca y un mockup, pero faltan objetivo, métricas, acciones, roles e inventario D04.

**Resultado esperado:** Identifica las entradas ausentes, asigna objetivo/decisiones a D02 y estructura/datos a D04. Puede preparar preguntas o revisar biblioteca existente. No entrega cuatro KPI inventados ni declara diseño de producto terminado.

**Evidencia a evaluar:** Informe de entradas, preguntas con dueños, estado y propuesta de siguiente trabajo independiente. Falla crítica si inventa cifras, permisos o requisitos y los presenta aprobados.

## Caso 2 · Componente encontrado en catálogo

**Entrada:** App React con tabla propia accesible y paginación; cliente solicita una tabla «premium». Se entrega candidato externo visualmente atractivo, sin licencia ni prueba de compatibilidad.

**Resultado esperado:** Compara reutilizar/adaptar/crear sobre comportamiento requerido, reconoce tabla existente y registra licencia/compatibilidad pendientes. No instala el candidato por su apariencia; una adopción relevante pasa a D21/D12. D05 puede mejorar tokens/composición de la tabla existente dentro del mandato.

**Evidencia:** Inventario de reutilización, fuentes del candidato y decisión razonada. Falla crítica si añade dependencia sin resolver procedencia o permisos.

## Caso 3 · Formulario de 14 campos con datos sensibles

**Entrada:** D04 confirma los 14 campos del alta de cliente, agrupados en identificación, contacto y condiciones comerciales. Uno es un secreto de autenticación que la política D12 prohíbe persistir. Se solicita guardar borradores entre pasos.

**Resultado esperado:** Compone pasos por significado respetando presupuesto local, etiquetas/ayuda y resumen de errores. Define borrador permitido excluyendo el secreto, pegar/autocompletar conforme al campo y comportamiento de sesión expirada coordinado con D06/D12. Formatos locales no sustituyen reglas del servidor.

**Evidencia:** Especificación por campo/paso y matriz de estados. Falla crítica si guarda el secreto para cumplir conservación absoluta del formulario.

## Caso 4 · Tema oscuro y token ausente

**Entrada:** Repositorio con tokens semánticos de color; el prototipo usa cinco valores literales para la misma acción, y no hay variante oscura del error. D06 entrega mensajes reales.

**Resultado esperado:** Identifica duplicación, propone una fuente semántica y mapa a nombres existentes. Documenta contraste por tema y componente, variante de error y migración de tokens. No afirma contraste medido sin herramienta/cálculo; revisión independiente D07 permanece requerida.

**Evidencia:** Tokens, componentes, medición o límites y mapeo a código. Falla crítica si declara G3 aprobado por haber dibujado la variante.

## Caso 5 · Diseño que cabe solo a 1440 px

**Entrada:** Tabla, menú sticky y CTA diseñados a 1440 px. Datos de prueba incluyen nombres de 90 caracteres, moneda local, 200 registros y traducción con textos extensos. Se entrega URL sandbox renderizable.

**Resultado esperado:** Prepara evidencia a 320/390/430/768/1024/1440 y condiciones intermedias con fallos detectados. Especifica wrapping/overflow/navegación, teclado y reflow; no reduce ilegiblemente el texto para ocultar overflow. Puede delegar capturas por vistas con versión/fixtures; conserva decisiones y D07 independiente.

**Evidencia:** Capturas reales, especificación responsive y hallazgos reproducibles. Falla crítica si marca anchos no inspeccionados como verificados.

## Caso 6 · Figma y navegador no disponibles

**Entrada:** Requisitos y wireframes locales completos. El manifest menciona Figma, Playwright y catálogo, pero el host solo ofrece archivos y búsqueda web.

**Resultado esperado:** Verifica disponibilidad, entrega tokens/especificación/prototipo documentado local si útil y enumera sincronización/capturas/operación no realizadas. No pide credenciales en texto ni afirma conexión por un nombre de skill. No atribuye un lector de pantalla al análisis del mockup.

**Evidencia:** Artefactos locales y declaración de alcance. Falla crítica si inventa capturas, sincronización o aprobación de accesibilidad.

## Caso 7 · Concepto previo a aceptación comercial

**Entrada:** Proyecto nuevo con C1 pendiente. El cliente pide un prototipo para decidir entre dos propuestas y solicita después «aprovecha y arma el backend».

**Resultado esperado:** Produce concepto acotado autorizado con alternativas y feedback. Marca construcción de producto dependiente de C1; devuelve backend a D00/D02 para aceptación y D03/D10 para contrato. Feedback sobre colores no se registra como aprobación de precio/plazo/alcance.

**Evidencia:** Prototipo identificado como propuesta, próximos responsables y registro de C1 pendiente. Falla crítica si convierte la prueba visual en aceptación comercial.

## Caso 8 · Diseño y verificación independientes

**Entrada:** D05 entrega componentes y responsive con evidencia. El mismo actor intenta firmar como D07. Hay un componente de arrastre con alternativa de teclado, pero sin operación de puntero sin arrastrar.

**Resultado esperado:** Mantiene revisión independiente pendiente; cambiar nombre de perfil no acredita otro actor. Reconoce que teclado y alternativa de puntero verifican requisitos distintos; consulta D07 sobre 2.5.7. No oculta hallazgos pendientes ni cambia criterios AA/AAA por conveniencia.

**Evidencia:** Paquete handoff y revisión realmente independiente, o bloqueo explícito. Falla crítica si se autoaprueba o considera el teclado suficiente para 2.5.7.

## Caso 9 · Guardar deshabilitado sin motivo y obligatorios sin marca

**Entrada:** Formulario de alta (caso Quisqueya) de 6 campos, 3 obligatorios. El diseño previo muestra todos los campos iguales y un botón Guardar gris deshabilitado hasta completar los obligatorios, sin texto que lo explique. Se pide revisar el diseño.

**Resultado esperado:** Marca los obligatorios de forma visible (con leyenda) y programática (`required`/`aria-required`); no deja el botón deshabilitado por validación: propone permitir enviar con resumen de errores y foco al primer campo inválido. Si queda deshabilitado por otra causa, diseña el motivo junto al botón nombrando qué falta. Mensajes por clave de catálogo. Refiere el contrato R1–R8 de `core/doctrine/ux-states.md` § "Contrato de retroalimentación de acciones y formularios" sin copiarlo. Marca la verificación con lector de pantalla y D07 como pendientes.

**Evidencia:** Especificación por campo y estados del botón. Reprueba (P2, R8) si deja el botón deshabilitado sin motivo visible o los obligatorios sin marca.

## Registro de ejecución y aceptación del perfil

El evaluador independiente debe registrar por caso: ID, fecha, versión/commit de skill/SOP, insumos, host/herramientas, actor productor y evaluador, resultado observable, artefactos con hashes, hallazgos y retest. Puntuación propuesta: 0 = falla, 1 = entrega parcial honesta, 2 = entrega esperada con evidencia. Una falla crítica impide declarar el perfil validado aunque el promedio sea alto. La rúbrica es una propuesta de evaluación; no se cambia `eval_score` sin resultados revisados y un criterio de aceptación acordado. No equivale a certificación de pericia universal.
