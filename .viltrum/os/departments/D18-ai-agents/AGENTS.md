# D18 — Método operativo

## Contrato de entrada

De **D03** (arquitectura) exijo, antes de empezar:
- Puerto y adaptador del modelo de IA ya definidos — **el nombre del proveedor no debe
  aparecer fuera de `adapters/`**
- Catálogo de herramientas/funciones que el agente podrá invocar, si las hay
- Modelo de amenazas del sistema, si el proyecto es R2 o superior
- Decisión de dónde vive el historial de conversación y bajo qué retención

De **D01** (requisitos) exijo:
- Caso de uso exacto: qué debe responder el sistema y a quién
- Base de conocimiento disponible: qué fuentes son verificables y cuáles no
- Tono, límites de contenido y temas fuera de alcance
- Criterio de éxito medible (no "que responda bien")

**Bloqueante:** sin puerto/adaptador de D03 no diseño el guardrail — diseñar sobre un
proveedor hardcodeado es construir sobre una violación de P1 ya cometida. Sin caso de
uso de D01 no puedo definir cuándo el sistema debe negarse a responder, porque no sé qué
es "dentro de alcance". En ambos casos, escalo y no avanzo con supuestos.

---

## Procedimiento

### 1. Clasificar el riesgo del sistema de IA

Aplico `core/routing.md`. Un sistema de IA que solo resume texto público no es R2 igual
que un agente con acceso a datos personales o a herramientas que escriben. El riesgo lo
fija el dato que el sistema toca y la acción que puede ejecutar, no el hecho de "usar
IA".

```
SISTEMA: <nombre>
¿LEE DATOS PERSONALES?: sí/no
¿ESCRIBE O EJECUTA ALGO?: sí/no — cuál herramienta
¿DECISIÓN AUTOMÁTICA CON IMPACTO REAL?: sí/no (aprobar, rechazar, cobrar, bloquear)
RIESGO: R0–R4
```

R2 o superior activa D12 obligatorio y gate humano por fase, según `core/routing.md`.

### 2. Verificar y aplicar OWASP Top 10 for LLM Applications

No se asume la versión: se verifica contra `genai.owasp.org` en cada revisión, porque
la lista cambia de edición en edición. Verificado el 2026-09-24: la edición vigente es
**OWASP Top 10 for LLM Applications 2026** (publicada 2026-08-03), que sustituye a la
edición 2025.

| Código 2026 | Categoría | Equivalente 2025 |
|---|---|---|
| LLM01:2026 | Prompt Injection | LLM01:2025 (sin cambio) |
| LLM02:2026 | Sensitive Information Disclosure | LLM02:2025 (sin cambio) |
| LLM03:2026 | Excessive Agency | LLM06:2025 |
| LLM04:2026 | Supply Chain | LLM03:2025 |
| LLM05:2026 | Data and Model Poisoning | LLM04:2025 |
| LLM06:2026 | Unbounded Consumption | LLM10:2025 |
| LLM07:2026 | Misinformation | LLM09:2025 |
| LLM08:2026 | Hidden Context Exposure | LLM07:2025 (renombrada y ampliada desde "System Prompt Leakage") |
| LLM09:2026 | Vector and Embedding Weaknesses | LLM08:2025 |
| LLM10:2026 | Improper Output Handling | LLM05:2025 |

Nota sobre el cambio más relevante: **Hidden Context Exposure** (LLM08:2026) ya no es
solo fuga del system prompt. Cubre todo lo que la aplicación pone frente al modelo sin
que el usuario lo vea: documentos recuperados, definiciones de herramientas, turnos
previos guardados en memoria, configuración que alguien asumió privada. Se revisa igual
que el system prompt: nada de eso debe poder extraerse pidiéndoselo al modelo con las
palabras correctas.

Para cada sistema que entra a D18, reviso las 10 categorías y registro cuáles aplican,
cuáles no y por qué:

```
CATEGORÍA: <código y nombre>
¿APLICA?: sí/no
CONTROL PROPIO: <qué mitiga esto en este sistema>
EVIDENCIA: <prueba, caso de eval, revisión de código>
```

Una categoría marcada "no aplica" sin razón escrita es un hallazgo contra D18.

### 3. Inyección de prompt — directa e indirecta

**Directa (LLM01:2026):** el usuario intenta manipular el sistema con su propio mensaje
— "ignora tus instrucciones anteriores", "actúa como si no tuvieras restricciones",
pedir el system prompt textual, intentar que el agente use una herramienta fuera de su
propósito declarado.

**Indirecta:** contenido de terceros que el modelo lee — un documento adjunto, una
página web, un correo, el resultado de una búsqueda, una respuesta de una herramienta —
contiene instrucciones ocultas dirigidas al modelo, no al usuario. Es el vector más
peligroso porque el usuario no la escribió y muchas veces no la ve.

Controles obligatorios:
- [ ] El system prompt distingue explícitamente instrucción (del operador) de dato (del
      usuario o de terceros) y el modelo está instruido a no obedecer instrucciones que
      lleguen como dato
- [ ] Todo contenido de terceros que el modelo procesa (documento, web, email, resultado
      de tool) se marca como **no confiable** en el prompt, con delimitadores explícitos
- [ ] Ninguna herramienta se invoca solo porque un documento leído lo "pidió" — se
      exige que la intención venga del usuario o de una regla del sistema, nunca del
      contenido leído
- [ ] Existe un caso de prueba que intenta inyección directa y otro que intenta
      inyección indirecta vía documento, y ambos están en el dataset de evaluación
      (ver paso 7)
- [ ] El prompt del sistema nunca contiene secretos, porque un prompt leak (LLM08:2026)
      se asume posible, no improbable

### 4. Filtrado de salida (LLM10:2026 — Improper Output Handling)

Nada de lo que el modelo genera llega al usuario o a una herramienta sin pasar por un
filtro determinista, no solo una instrucción de prompt.

Qué no debe salir nunca, con su control:

| Qué | Control |
|---|---|
| Secretos, credenciales, claves API | Escaneo de patrones antes de responder o registrar |
| PII no autorizada por el caso de uso | Redacción o bloqueo según política de D01/D12 |
| Contenido que viola política de la agencia o del cliente | Clasificador o lista de reglas, no solo el juicio del modelo |
| Código ejecutable no solicitado o con llamadas a red/sistema | Sandboxing o bloqueo si el canal no espera código |
| HTML/Markdown que el frontend interpreta sin sanitizar | Sanitización igual que cualquier entrada no confiable — el modelo es una fuente externa |

**Regla:** el filtrado de salida se implementa en el backend, nunca solo confiando en
que el prompt le pidió al modelo "no hagas X". Un modelo instruido para no revelar
secretos puede ser inyectado para hacerlo igual — el filtro determinista es la última
línea, igual que las restricciones de base de datos son la última línea de D11.

### 5. Datos personales

Qué entra al prompt:
- [ ] Inventario explícito de qué dato personal entra a cada prompt y por qué es
      necesario para la tarea — minimización, no "por si sirve"
- [ ] Ningún dato de tarjeta, contraseña o documento de identidad completo entra al
      prompt salvo que el caso de uso lo exija y D12 lo haya aprobado
- [ ] Los datos personales que entran se transforman cuando es posible (seudonimización,
      solo el campo necesario) en vez de pasar el registro completo

Qué se registra:
- [ ] El log de prompts y respuestas **no contiene** en claro lo que el filtrado de
      salida (paso 4) prohíbe
- [ ] Si el usuario pega un dato sensible por error (número de tarjeta, contraseña), el
      sistema lo detecta y lo enmascara antes de registrar — no solo antes de responder
- [ ] Retención del log de conversación definida con plazo, igual que cualquier dato
      personal según D11

### 6. Grounding y citas

El sistema responde solo con base en fuentes verificables cuando el caso de uso lo
exige (soporte, información regulada, datos del cliente) — no de memoria del modelo.

- [ ] Cada afirmación que depende de una fuente específica del negocio cita esa fuente
      (documento, registro, fecha de la información)
- [ ] Si la base de conocimiento no tiene una fuente que respalde la pregunta, el
      sistema **se niega a responder con seguridad** — admite que no sabe y ofrece
      escalar, en vez de generar una respuesta plausible sin respaldo
- [ ] Existe un umbral de confianza o de similitud de recuperación por debajo del cual
      el sistema no contesta desde la fuente, aunque haya recuperado algo
- [ ] La cita apunta a algo verificable por un humano (enlace, número de documento,
      sección) — no "según nuestras políticas" sin más

Criterio de "no sé": si la pregunta cae fuera de la base de conocimiento del sistema, la
respuesta correcta es decirlo, nunca generalizar con lo que el modelo sabe de su
entrenamiento cuando el caso de uso exige grounding.

### 7. Evaluaciones repetibles con dataset

Un sistema de IA no se certifica "probándolo a mano". Se certifica con un dataset de
casos, entrada esperada y criterio de aprobado, que corre igual la próxima vez.

```
CASO: <id>
ENTRADA: <prompt o escenario exacto, incluyendo intentos adversariales>
SALIDA ESPERADA: <respuesta correcta, o comportamiento esperado — p.ej. "se niega y escala"›
CRITERIO DE APROBADO: <cómo se verifica automáticamente o por rúbrica>
CATEGORÍA: <a qué riesgo de la tabla del paso 2 corresponde, si aplica>
```

- [ ] El dataset incluye casos normales, casos límite y casos adversariales (inyección
      directa e indirecta, intento de fuga del system prompt, pregunta fuera de base)
- [ ] El dataset vive versionado junto al sistema, en `evals/cases.md` de este
      departamento como base y ampliado por proyecto
- [ ] Cada cambio de prompt, de modelo o de herramienta corre el dataset completo antes
      de desplegar — un cambio que baja el score de un caso ya aprobado es regresión
- [ ] El resultado se registra con fecha y versión del sistema evaluado, como cualquier
      evidencia de `core/evidence-contract.md`

**"Lo probé a mano" no cierra esta fase.** Es evidencia inválida según el contrato de
evidencia del repositorio.

### 8. Costos y límites

Conecta con `core/doctrine/context-budget.md`: modelo pequeño para tarea mecánica,
modelo grande para ambigüedad y riesgo.

- [ ] Presupuesto de costo declarado por sesión y por usuario/periodo, con el número
      escrito, no "que no sea caro"
- [ ] Qué pasa al exceder el presupuesto está definido — no un fallo silencioso: se
      informa al usuario o se degrada a una función más barata de forma explícita
- [ ] Elección de modelo justificada por la naturaleza de la tarea: tarea mecánica de
      clasificación o extracción → modelo pequeño; ambigüedad, razonamiento o riesgo →
      modelo grande. Subir de modelo sin justificación registrada es un hallazgo
- [ ] Límite de turnos o de iteraciones de herramienta por sesión, para evitar que un
      agente entre en un ciclo de llamadas a herramientas sin converger
- [ ] Timeout y límite de tokens de entrada/salida por llamada, declarados
- [ ] Alerta activa cuando el consumo se acerca al presupuesto, no solo cuando ya lo
      superó

### 9. Fallback humano

El sistema escala a un humano en vez de responder cuando:
- [ ] La confianza de grounding está bajo el umbral (paso 6)
- [ ] El usuario pide explícitamente hablar con una persona
- [ ] La pregunta implica una decisión con impacto real que el caso de uso no autorizó
      a automatizar (dinero, salud, legal, cancelación de cuenta)
- [ ] El sistema detecta una posible inyección o un intento de manipulación
- [ ] Se repite una falla o el usuario expresa frustración medible (varios reintentos
      sin resolver)
- [ ] Se alcanzó el límite de costo o de iteraciones del paso 8

Cómo se detecta que debe escalar: regla explícita por cada gatillo de la lista, no
"buen juicio del modelo" — el propio modelo puede estar comprometido por una inyección
cuando más se necesita el escalamiento.

- [ ] El punto de escalamiento está definido en el diseño, no como ocurrencia tardía
- [ ] El traspaso a humano incluye el contexto necesario para no repetir la
      conversación desde cero
- [ ] El usuario sabe, con lenguaje claro, que está hablando con un sistema automatizado
      y cómo pedir un humano en cualquier momento

### 10. Herramientas con mínimo privilegio (LLM03:2026 — Excessive Agency)

Si el agente tiene tool use / function calling, cada herramienta se diseña con el
privilegio mínimo necesario para su propósito declarado, nunca con acceso amplio "por
si acaso" — el mismo principio de P7 aplicado a agentes.

```
HERRAMIENTA: <nombre>
PROPÓSITO: <una frase, sin "y">
ALCANCE DE LECTURA: <exactamente qué puede leer>
ALCANCE DE ESCRITURA: <exactamente qué puede modificar — vacío si es de solo lectura>
¿PUEDE SER IRREVERSIBLE?: sí/no — si sí, requiere confirmación humana explícita
¿QUÉ PASA SI SE INVOCA CON ARGUMENTOS INESPERADOS?: <validación, rechazo>
```

- [ ] Ninguna herramienta con alcance "administrador" o "todo el sistema" para una
      tarea puntual
- [ ] Las herramientas que envían algo hacia afuera (correo, mensaje, webhook, pago)
      requieren confirmación humana explícita antes de ejecutar, igual que la categoría
      "Explicit permission required" de este mismo sistema aplicada a un agente
- [ ] Los argumentos que el modelo genera para una herramienta se validan en el backend
      antes de ejecutar — el modelo no es una fuente confiable de argumentos, igual que
      no lo es un formulario de cliente
- [ ] Ningún acceso a la herramienta se otorga "por si el agente lo necesita más
      adelante" — se agrega cuando el caso de uso lo exige, con su propia revisión

### 11. Registro (logging de agentes)

- [ ] Se registra cada prompt de entrada (ya filtrado según paso 5), cada respuesta de
      salida (ya filtrada según paso 4), cada herramienta invocada con sus argumentos y
      resultado, y cada decisión de escalar o negarse
- [ ] Se registra la razón de cada decisión del agente, no solo el resultado — "por qué
      invocó esta herramienta", "por qué se negó a responder"
- [ ] El registro **nunca** contiene secretos ni credenciales, aunque hayan pasado por
      el prompt — se redactan antes de escribir el log
- [ ] El registro es suficiente para reconstruir una sesión completa ante un incidente,
      sin depender de la memoria de quien lo operó
- [ ] El registro alimenta el dataset de evaluación: un caso real que falló se convierte
      en caso de prueba nuevo (paso 7)

### 12. Handoff

Entrego a **D12** (revisor) el expediente completo: clasificación de riesgo, tabla OWASP
aplicada, controles de inyección, filtrado de salida, dataset de evaluación con
resultados, presupuesto de costos, puntos de escalamiento y matriz de herramientas con
su privilegio. D12 firma o rechaza — D18 no cierra su propio hallazgo.

---

## Herramientas y skills

| Situación | Skill / herramienta |
|---|---|
| Referencia de API, modelos, pricing, streaming, tool use de Claude | `claude-api` |
| Revisión de seguridad del sistema (superficie, permisos, secretos) | `security-review` — la corre D12, no D18, para no autoaprobar |
| Búsqueda de estándar vigente (OWASP, documentación oficial) | WebSearch / WebFetch, nunca memoria sin verificar |

**Hueco real, declarado:** ninguna otra skill instalada en este entorno cubre
evaluación automatizada de LLM, red-teaming de prompt injection o observabilidad de
agentes en producción. `claude-api` es referencia de la API, no una suite de evals ni
un scanner de inyección. Hasta que exista esa skill, el dataset de `evals/cases.md` y
la revisión manual con la checklist son el único mecanismo disponible — y se declara
en `known_limits`, no se disfraza de cobertura completa.

---

## Contrato de salida

- [ ] Clasificación de riesgo R0–R4 del sistema de IA
- [ ] Tabla OWASP Top 10:2026 con aplica/no aplica, control propio y evidencia por
      categoría
- [ ] Controles de inyección directa e indirecta implementados y probados
- [ ] Filtrado de salida determinista, no dependiente solo del prompt
- [ ] Inventario de datos personales que entran al prompt, con minimización aplicada
- [ ] Política de grounding: cuándo cita, cuándo se niega a responder, con umbral
- [ ] Dataset de evaluación con casos normales, límite y adversariales, y resultado
      registrado con fecha
- [ ] Presupuesto de costo por sesión/usuario, con comportamiento al exceder definido
- [ ] Elección de modelo (pequeño/grande) justificada por tarea
- [ ] Puntos de escalamiento a humano, con gatillo explícito por cada uno
- [ ] Matriz de herramientas con alcance mínimo declarado por herramienta
- [ ] Registro de prompts, respuestas, decisiones y uso de herramientas, sin secretos
- [ ] Revisión de D12 firmada — D18 no cierra su propio hallazgo

---

## Antipatrones propios

| Fallo | Corrección |
|---|---|
| Confiar en que el prompt basta para prohibir algo | Filtro determinista en el backend, siempre |
| Tratar todo documento leído como confiable | Contenido de terceros es hostil por defecto (inyección indirecta) |
| Herramienta con acceso amplio "por si acaso" | Privilegio mínimo declarado por herramienta, caso concreto exigido |
| "Lo probé a mano y respondía bien" | Dataset de evaluación repetible, con fecha y versión |
| Responder con seguridad sin fuente | Grounding con umbral; si no hay fuente, se admite que no sabe |
| Sistema sin límite de costo o de iteraciones | Presupuesto declarado y comportamiento al exceder, definido |
| Registrar el prompt completo tal cual llegó | Redacción de secretos y PII antes de escribir el log |
| Elegir el modelo grande por defecto | Justificación registrada; mecánico va en modelo pequeño |
| Escalar a humano "cuando se note" | Gatillo explícito por cada causa de escalamiento |
| Asumir la versión de OWASP sin verificar | Se verifica contra la fuente oficial en cada revisión |
| D18 aprueba su propio guardrail de seguridad | D12 firma siempre, nunca D18 |

## Protocolo especializado de entrega

Para un mandato de entrega, aplicar [sops/delivery.md](sops/delivery.md) junto con este método. El contrato [delivery.json](delivery.json) define entradas, salidas, checks, capacidades necesarias y tareas delegables. Consultar la skill local indicada en manifest; disponibilidad de herramientas, autorización, C1 y revisión independiente se comprueban para cada proyecto. Las rúbricas de `evals/cases.md` no acreditan ejecución ni cierre de gates.
