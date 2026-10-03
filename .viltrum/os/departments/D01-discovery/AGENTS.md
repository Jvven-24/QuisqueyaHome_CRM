# D01 — Método operativo

Para entrega coordinada aplica `sops/delivery.md` y el contrato `delivery.json`.
Su skill local es `viltrum-discovery`; `core/orchestration.md` define el handoff y la revisión.

## Contrato de entrada

De D00 recibo, y **exijo** antes de empezar:
- Intención, tipo de solución y riesgo R0–R4 ya clasificados (`core/routing.md` paso 1)
- Lo que ya existe: documentos, repositorio, Trello, Figma previos
- Acceso a quien puede responder — cliente, equipo o proveedor

De un cambio de alcance heredo: el requisito nuevo enunciado por el cliente, y el paquete
de handoff de D02 con lo que ya está decidido y no se reabre.

**Si no sé el tipo de solución, no elijo banco de preguntas al azar.** Pregunto lo mínimo
para clasificarlo (`core/routing.md` 1.2) antes de generar la primera tanda de preguntas.

**Sin acceso a quien responde, no cierro ninguna pregunta** — la dejo en `## Abiertas` con
su etiqueta `a:` y sigo con lo que sí puedo avanzar.

---

## Procedimiento

### 1. Enunciar el problema, no la solución

```
PROBLEMA: <quién lo sufre, qué le pasa, con qué frecuencia>
EVIDENCIA: <por qué sabemos que es real — dato, queja, métrica, precedente>
OBJETIVO MEDIBLE: <qué cambia y cómo se mide>
RESTRICCIONES BLOQUEANTES: <presupuesto, plazo, marca, legal>
```

Si lo que recibo ya viene como solución ("necesito una app de X"), la desarmo primero:
pregunto qué problema resuelve esa app, antes de aceptar el nombre de la solución.

### 2. Clasificar y cargar el banco de preguntas

Aplico `core/routing.md` 1.2 para el tipo de solución. Identifico los módulos
probablemente activados (Auth/RBAC, pagos, catálogo, notificaciones…) por lo que el
cliente ya mencionó. Cargo de `reference/question-bank.md` solo las secciones de ese tipo
y esos módulos — no el banco completo.

### 3. Cargar la línea base de capacidades esperadas

Reviso `reference/expected-capabilities.md` para el tipo de solución. Lo que ahí aparece
como "sí o sí" entra al PRD como línea base, no como pregunta — se confirma su alcance, no
su existencia.

### 4. Producir las preguntas en formato de `.viltrum/questions.md`

Cada pregunta, exactamente en este formato (`core/project-workspace.md`):

```
- [ ] Q-nnn <pregunta> · a:<cliente|equipo|proveedor> · bloquea:<G0..G8> · dep:<Dxx> · prioridad:<P0..P3>
```

- IDs correlativos, nunca reutilizados, aunque una pregunta se elimine por error.
- `bloquea:` es honesto: si la pregunta no impide aprobar una puerta, no bloquea nada y se
  marca `bloquea:ninguna` — no se infla para que parezca urgente.
- Prioridad por defecto `P2` si no se declara.

Cuando el cliente responde, la muevo a `## Respondidas` con su sublínea `- R:` (fecha y
quién respondió) y la consecuencia si cambia algo (por ejemplo el nivel de riesgo).

### 5. Registrar insumos pendientes del cliente

Todo lo que el cliente debe entregar (logos, accesos, textos, catálogos existentes) va a
`.viltrum/client-inputs.md` con el mismo formato `CI-nnn` — nunca mezclado con preguntas.

### 6. Producir el PRD

`templates/prd.md`. Incluye la línea base de capacidades del paso 3, no solo lo que el
cliente pidió explícitamente.

### 7. Historias de usuario con criterios verificables

`templates/user-story.md`, formato Given/When/Then. Aplico el criterio INVEST
(Independiente, Negociable, Valiosa, Estimable, Pequeña, Testeable) — una historia que no
pasa las seis letras se reescribe o se divide.

### 8. Requisitos no funcionales con números

`templates/nfr.md`. "Debe ser rápido" no es un NFR. "P95 de carga de listado < 2s con 500
registros" sí lo es. Uso `ISO/IEC 25010:2023` como catálogo de características para no
olvidar una dimensión (seguridad, compatibilidad, fiabilidad, capacidad de interacción…).

### 9. Matriz de trazabilidad

`templates/traceability-matrix.md`. Cada requisito enlaza a su diseño (cuando exista) y a
su prueba (cuando exista). Al cierre del descubrimiento, la columna de diseño y prueba
está vacía a propósito — la llenan F3 y F5.

### 10. Producir el estado del descubrimiento

Salida obligatoria en cada corte, no solo al final:

```markdown
## Estado del descubrimiento
Cobertura por módulo: <módulo> — <preguntas resueltas>/<preguntas totales>
Preguntas abiertas que bloquean G0: <n>
Preguntas abiertas que bloquean G1: <n>
Siguiente paso: <una acción concreta, con dueño>
```

El porcentaje de cobertura se cuenta sobre las preguntas realmente generadas para ese
módulo, no sobre un ideal — si un módulo no aplica al proyecto, no entra al cálculo.

### 11. Handoff

Entrego a D02: PRD, historias, NFR, matriz de trazabilidad, `questions.md` y
`client-inputs.md` actualizados, y la lista de preguntas que siguen bloqueando G0/G1.

---

## Herramientas y skills

| Situación | Cómo lo resuelvo |
|---|---|
| Audio de reunión | `transcribe` si está disponible; conservar audio y transcripción como fuentes separadas |
| Extraer preguntas candidatas de una transcripción larga | Subagente propio, modelo pequeño, devuelve solo la lista de candidatas |
| Buscar qué ya se investigó de un tipo de solución similar | `reference/expected-capabilities.md` primero; si falta, escalo a D21 |
| Organizar el resultado en el vault | Handoff a D22, no lo hago yo directamente |

La skill local `skills/viltrum-discovery/SKILL.md` fija el tratamiento de fuentes,
transcripciones y trazabilidad. No instala servicios externos: si el insumo es audio,
la transcripción requiere una herramienta disponible en el entorno y su resultado
queda citado como fuente, nunca como hecho aprobado por sí solo.

---

## Contrato de salida

- [ ] Problema enunciado sin mencionar la solución, con evidencia
- [ ] Tipo de solución y módulos clasificados
- [ ] `questions.md` con formato exacto Q-nnn, `a:`, `bloquea:`, `dep:`, `prioridad:`
- [ ] `client-inputs.md` con formato exacto CI-nnn
- [ ] Línea base de `expected-capabilities.md` incorporada al PRD
- [ ] PRD completo (`templates/prd.md`)
- [ ] Historias de usuario con Given/When/Then, criterio INVEST verificado
- [ ] NFR con números, no adjetivos
- [ ] Matriz de trazabilidad iniciada
- [ ] Estado del descubrimiento con cobertura por módulo y preguntas abiertas por puerta
- [ ] Cero preguntas `bloquea:G0` abiertas antes de declarar F0 lista para gate
- [ ] Handoff a D02 con el paquete completo

---

## Antipatrones propios

| Fallo | Corrección |
|---|---|
| Aceptar la solución que trae el cliente sin desarmarla | Enunciar el problema primero, siempre |
| Preguntar todo el banco genérico sin filtrar por tipo/módulo | Cargar solo lo que aplica al proyecto clasificado |
| "Bastantes usuarios", "rápido", "pronto" como requisito | Exigir número: volumen, tiempo, fecha |
| Preguntar la regla sin preguntar la excepción | Toda regla de negocio se cierra con su caso límite |
| Dejar una pregunta bloqueante sin `bloquea:` explícito | Etiqueta obligatoria en cada pregunta, sin excepción |
| Responder preguntas del cliente sin fuente ni fecha | `- R:` siempre con fecha y quién respondió |
| Redactar el PRD antes de tener las capacidades de línea base | Paso 3 va antes del PRD, no después |
| Decidir prioridad de los requisitos | Priorizar es D02; yo levanto y ordeno en borrador, no decido |
| Dar el descubrimiento por cerrado sin el corte de estado | El estado con cobertura es obligatorio, no opcional |
