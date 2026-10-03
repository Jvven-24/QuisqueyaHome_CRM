# Department Factory — cómo se construye y evoluciona un departamento

> Un perfil no es un prompt. Es una **unidad de trabajo persistente**:
> identidad + contexto + memoria + skills + herramientas + permisos + estado + evidencia.
> El modelo que lo ejecuta puede cambiar sin que cambie el contrato del rol.

## Anatomía de un departamento

```
departments/Dxx-slug/
├── SOUL.md            Identidad, propósito, límites, conducta. Quién es.
├── AGENTS.md          Método operativo, procedimiento, handoffs. Cómo trabaja.
├── manifest.yaml      Contrato máquina-legible: skills, tools, autonomía, revisor.
├── MEMORY.md          Lecciones, errores conocidos, decisiones que no se repiten.
├── checklists/        Listas de verificación ejecutables por situación.
├── sops/              Procedimientos estándar paso a paso.
├── templates/         Artefactos que produce.
├── reference/         Estándares, buenos y malos ejemplos, benchmarks.
└── evals/             Casos que el departamento debe resolver correctamente.
```

### Las ocho capas de conocimiento

| Capa | Contenido | Archivo |
|---|---|---|
| 1. Doctrina propia | Misión, límites, ética operativa, cuándo escalar | `SOUL.md` |
| 2. Cuerpo profesional | Estándares oficiales, patrones y antipatrones de la disciplina | `reference/` |
| 3. SOP de Viltrum | Cómo trabaja Viltrum esa disciplina en concreto | `sops/` |
| 4. Skills | Procedimientos ejecutables y herramientas permitidas | `manifest.yaml` |
| 5. Plantillas | Los artefactos que entrega | `templates/` |
| 6. Biblioteca de referencia | Ejemplos buenos y malos, con el porqué | `reference/` |
| 7. Suite de evaluación | Casos de prueba del propio departamento | `evals/` |
| 8. Memoria | Errores reales, decisiones, mejoras aprendidas | `MEMORY.md` |

---

## Proceso de creación

```
1. Research profundo      → estándares oficiales, no blogs
2. Mapa de responsabilidad → qué sí, qué no, qué comparte con otros
3. Subespecialidades       → en qué se divide internamente
4. SOPs                    → el procedimiento repetible
5. Checklists              → lo verificable
6. Skills y herramientas   → qué puede ejecutar
7. Permisos                → mínimo privilegio, nivel de autonomía
8. Evals                   → cómo sé que funciona
9. Piloto real             → un proyecto de verdad
10. Revisión humana        → tú apruebas
11. Versión estable        → entra al registro
```

### Regla de investigación

No se entrena un departamento con blogs y prompts. Se prioriza, en este orden:

1. Estándares oficiales (ISO, NIST, W3C, OWASP, RFC)
2. Documentación oficial del proveedor
3. Literatura profesional reconocida de la disciplina
4. Repositorios de referencia ampliamente adoptados
5. Evidencia de proyectos reales propios

Un `reference/` lleno de artículos de opinión es un departamento débil.

---

## Versionado

Cada departamento declara en su `manifest.yaml`:

```yaml
department_version: 1.0.0
reviewed_at: 2026-09-20
reviewed_by: <humano>
source_manifest: [lista de fuentes con fecha de consulta]
eval_score: null           # se llena tras correr evals/
known_limits: []           # lo que este departamento NO sabe hacer todavía
changelog: CHANGELOG.md
```

**`known_limits` es obligatorio y no puede quedar vacío por pereza.** Un departamento que
declara no tener límites es un departamento que no se ha evaluado.

---

## Mejora continua

Un departamento mejora por **eventos**, no por calendario:

| Evento | Resultado obligatorio |
|---|---|
| Bug recurrente | Nueva prueba + entrada en `MEMORY.md` |
| Incidente en producción | Postmortem + nueva alerta o runbook |
| Hallazgo nuevo en revisión | Nueva entrada en la checklist correspondiente |
| Práctica que falló dos veces | Deprecación explícita en `MEMORY.md` |
| Herramienta nueva adoptada | Actualización de `manifest.yaml` + SOP |
| Estándar actualizado | Actualización de `reference/` + versión menor |

**Regla:** todo lo que se aprende y no se escribe, se vuelve a pagar.

### Ciclo de revisión

Cada departamento se revisa cuando ocurre lo primero de:
- 3 proyectos usándolo desde la última revisión
- Un P0 atribuible a un hueco suyo
- Un cambio en el estándar de su disciplina

En la revisión se corre `evals/`, se actualiza `known_limits` y se sube la versión.

---

## Regla de la unidad básica

La unidad no es un agente individual: es un **departamento** que recibe una fase,
coordina especialistas internos y entrega un paquete verificable.

| Rol interno | Puede |
|---|---|
| **Head** | Interpretar el objetivo, dividir trabajo, controlar alcance, aprobar solo checks no críticos |
| **Especialista** | Producir dentro de su subárea, con sus skills y contexto |
| **Revisor** | Verificar — **nunca** es quien produjo |

El departamento puede crear subagentes y paralelizar. **No puede** ocultar decisiones ni
autoaprobar riesgos críticos. Toda salida importante queda trazable.
