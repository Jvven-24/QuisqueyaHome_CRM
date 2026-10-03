# Checklist — revisión del paquete de contexto

> Se aplica antes de que un departamento arranque trabajo nuevo o retome un proyecto.
> Firma el revisor (D00), nunca quien armó el paquete.

## A. Las cinco piezas

- [ ] `CLAUDE.md` raíz incluido, sin modificar
- [ ] `SOUL.md` + `AGENTS.md` del departamento correcto, versión vigente según su
      `manifest.yaml`
- [ ] Checklist activa de la fase actual — solo esa, no todas las del departamento
- [ ] Paquete de handoff del departamento anterior, resumido
- [ ] `current-status.md` / `project.md` actualizado a la fecha

## B. Lo que NO debe entrar

- [ ] El historial completo de la conversación anterior no está incluido
- [ ] Documentos de otros departamentos no relacionados con esta fase, excluidos
- [ ] Transcripciones sin procesar, excluidas — solo las decisiones extraídas
- [ ] El árbol completo del repositorio no se cargó; se referencia el índice de `gitnexus`

## C. Resumen ejecutivo

- [ ] Todo documento largo dentro del paquete tiene resumen de 3 a 5 líneas al inicio
- [ ] El agente puede decidir si necesita el detalle solo leyendo el resumen
- [ ] Las secciones de detalle están separadas y se cargan bajo demanda, no todas de una vez

## D. Tamaño y criterio de terminado

- [ ] El paquete completo permite empezar a trabajar con "tres archivos y dos enlaces"
      (criterio de `core/doctrine/context-budget.md`)
- [ ] Si no cumple ese criterio, se identificó qué documento está mal organizado y se
      corrigió — no se aceptó el paquete sobrecargado

## E. Handoff cerrado

- [ ] El paquete de handoff que se está empaquetando cumple los cinco puntos de
      `departments/D00-orchestrator/AGENTS.md` (artefactos, decisiones, riesgos heredados,
      supuestos sin confirmar, qué no se hizo y por qué)
- [ ] Ningún supuesto sin confirmar quedó fuera del paquete por descuido

---

## Veredicto

```
APROBADO      — checklist completa, paquete dentro del presupuesto de contexto
CONDICIONAL   — excepciones con dueño y fecha. Nunca con el historial completo incluido
RECHAZADO     — vuelve a empaquetarse con hallazgos clasificados
```

Firma el revisor (D00), **nunca** quien armó el paquete.
