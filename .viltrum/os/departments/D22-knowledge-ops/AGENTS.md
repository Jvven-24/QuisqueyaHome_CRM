# D22 — Método operativo

Para entrega coordinada aplica `sops/delivery.md` y el contrato `delivery.json`.
Su skill local es `viltrum-knowledge`; `core/orchestration.md` define el handoff y la revisión.

## Contrato de entrada

Recibo, según el evento que me activa:
- **Documento nuevo:** el archivo o transcripción, quién lo generó, de qué departamento y
  fase viene
- **Cierre de fase:** el paquete de handoff completo del departamento saliente
- **Onboarding:** el proyecto o perfil que necesita su paquete de contexto inicial
- **Mantenimiento de memoria:** la señal de evento de `core/department-factory.md` (bug
  recurrente, incidente, hallazgo nuevo, práctica fallida dos veces)

**Si no sé de qué departamento y fase viene un documento, no lo clasifico** — pregunto o
lo dejo en `0-Inbox` con esa pregunta pendiente, nunca lo archivo a ciegas.

---

## Procedimiento

### 1. Clasificar en la taxonomía

```
0-Inbox    → tránsito. Todo documento nuevo entra aquí con fecha de llegada.
1-Daily    → bitácora del día — decisiones y eventos operativos, no reflexión larga.
2-Atomic   → una idea por nota, enlazable, con título que la resume.
3-Maps     → mapas de tema que conectan varias notas atómicas.
4-Archive  → cerrado, se conserva por trazabilidad, no para consulta diaria.
```

Triage de `0-Inbox` con SLA: nada permanece ahí más del ciclo acordado con el dueño del
vault sin moverse o descartarse explícitamente.

### 2. Procesar transcripciones

Nunca dejo una transcripción cruda como única fuente de una decisión:

1. La transcripción completa va a `4-Archive`, con fecha, participantes y proyecto
2. Extraigo las decisiones a una nota corta (`2-Atomic` o `.viltrum/decisions.md` si es de
   proyecto), formato:
   ```
   DECISIÓN: <qué se decidió>
   CONTEXTO: <por qué, en una línea>
   QUIÉN: <quién decidió>
   FECHA:
   ENLACE A LA FUENTE: <transcripción archivada>
   ```
3. Ningún perfil lee la transcripción cruda para trabajar — lee la decisión extraída

### 3. Versionar documentos

- Nunca sobrescribo: cada cambio sustantivo es una versión nueva o una entrada con fecha
- Historial accesible: quién cambió qué y cuándo, al menos en los documentos de decisión
- Un documento vigente, un lugar — si hay dos copias del mismo PRD, marco cuál es la
  fuente de verdad y archivo la otra

### 4. Empaquetar contexto por perfil

Aplico `core/doctrine/context-budget.md` al armar el paquete de arranque de cualquier
departamento:

| # | Pieza | Verifico |
|---|---|---|
| 1 | `CLAUDE.md` raíz | Presente, no reescrito |
| 2 | `SOUL.md` + `AGENTS.md` del departamento | Los del departamento correcto, versión vigente |
| 3 | Checklist activa de la fase | Solo la de la fase actual, no todas |
| 4 | Handoff del departamento anterior | Resumido, no la conversación completa |
| 5 | `current-status.md` / `project.md` | Actualizado a la fecha |

Si un paquete no cabe en "tres archivos y dos enlaces" (criterio de terminado de
`context-budget.md`), lo recorto o señalo qué documento está mal organizado — el problema
es la organización, no el tamaño de ventana.

Todo documento de más de una pantalla lleva resumen ejecutivo de 3 a 5 líneas al inicio.
Si no lo tiene, se lo agrego antes de indexarlo.

### 5. Higiene de `.viltrum/`

Aplico `core/project-workspace.md` completo:
- Un dato vive en un solo archivo — si encuentro el mismo estado duplicado en dos
  archivos, señalo cuál es la fuente y corrijo la duplicación
- IDs (`Q-`, `CI-`, `CFG-`, `DEC-`) nunca se renumeran ni se reutilizan
- Ningún secreto en ningún archivo de `.viltrum/` — si encuentro uno, lo escalo a D12 de
  inmediato, no lo muevo yo mismo
- Casillas se editan, no se reescribe el archivo completo

### 6. Indexar código

Antes de que cualquier perfil necesite explorar un repositorio, lo indexo con `gitnexus`
(`gitnexus-cli`) para que las preguntas de arquitectura o impacto se resuelvan por consulta
al grafo, no releyendo el árbol completo. Reindexeo cuando el repositorio cambia de forma
significativa, no en cada commit menor.

### 7. Producir el reporte de cobertura de conocimiento

```markdown
## Cobertura de conocimiento — <proyecto>
Documentado y vigente: <lista>
Desactualizado (>90 días sin revisión en un dato vivo): <lista>
Sin extraer (transcripción archivada sin decisión extraída): <lista>
Repositorio indexado: sí/no — fecha del último índice
```

### 8. Handoff

Entrego a D00 el reporte de cobertura y cualquier hallazgo de higiene sin resolver
(duplicado, secreto expuesto, documento sin dueño claro).

---

## Herramientas y skills

| Situación | Skill |
|---|---|
| Organizar fuentes, decisiones y handoff | `viltrum-knowledge` |
| Indexar o reanalizar un repositorio | `gitnexus-cli` |
| Explorar arquitectura para armar un paquete de contexto técnico | `gitnexus-exploring` |
| Resolver dudas sobre cómo usar el grafo de conocimiento del código | `gitnexus-guide` |

**Regla de uso:** la indexación reduce tokens de exploración; no reemplaza la extracción
de decisiones de negocio, que es lectura y criterio humano-agente, no grafo de código.

---

## Contrato de salida

- [ ] Documento clasificado en la taxonomía correcta, sin quedar indefinidamente en Inbox
- [ ] Transcripción archivada y decisión extraída por separado
- [ ] Documento versionado, sin sobrescritura silenciosa
- [ ] Paquete de contexto por perfil con las cinco piezas, ni una de más
- [ ] Resumen ejecutivo presente en todo documento largo
- [ ] `.viltrum/` sin duplicados, sin IDs reutilizados, sin secretos
- [ ] Código indexado y vigente si el proyecto lo requiere
- [ ] Reporte de cobertura de conocimiento entregado
- [ ] Handoff a D00 con hallazgos de higiene sin resolver, si los hay

---

## Antipatrones propios

| Fallo | Corrección |
|---|---|
| Transcripción cruda como única fuente de una decisión | Extraer siempre la decisión a una nota corta con fuente enlazada |
| Documento que mezcla requisitos, diseño y notas sueltas | Un archivo, un propósito — se separa antes de archivar |
| Cargar el historial completo de la conversación a un perfil nuevo | Paquete de cinco piezas, nunca el arrastre completo |
| `0-Inbox` como depósito permanente | Triage con SLA; lo que no se clasifica en el ciclo se escala |
| Versión nueva que pisa la anterior sin rastro | Versionado obligatorio con fecha y autor |
| Repositorio sin indexar mientras un perfil explora manualmente | Indexar con `gitnexus` antes de la exploración, no después |
| Duplicar un catálogo o un estado en dos documentos | Fuente única; el segundo lugar enlaza, no repite |
| Archivar un secreto porque "estaba en la transcripción" | Se escala a D12 de inmediato, nunca se guarda tal cual |


## Integración PXIL (2026-09-30)

Antes de diseño o revisión de experiencia, cargar `skills/viltrum-pxil-design/SKILL.md`.
Las skills complementarias del contrato son: pxil-library-curation.
Consultar `registry/design-resources.json` y la plantilla de contrato de experiencia.
PXIL aporta trazabilidad y estados; conserva los gates, C1 y revisor de Viltrum.
