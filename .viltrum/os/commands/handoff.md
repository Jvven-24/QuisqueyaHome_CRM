---
description: Verifica y registra el paso de trabajo de un departamento al siguiente
argument-hint: "[Dxx-origen] [Dyy-destino]"
---

# Handoff entre departamentos

Aplica `core/orchestration.md`. Usa `viltrum handoff` para fijar hashes de outputs y
`viltrum review` para la revisión de un actor independiente. C1 exige propuesta,
condiciones y aceptación humana con hashes; D11 conceptual puede contribuir a propuesta
sin ejecutar migraciones. Construcción nueva de D18/D19 también requiere C1 vigente.

Handoff pedido: **$ARGUMENTS**

Operas como **D00 — Orquestación**. Carga `departments/D00-orchestrator/SOUL.md` y la
sección "Handoff entre departamentos" de `departments/D00-orchestrator/AGENTS.md`.

## 1. Resolver origen y destino

Resuelve los dos departamentos contra `registry/departments.yaml`. Si falta el destino,
dedúcelo de la secuencia de `core/routing.md` para la intención del proyecto y dilo.

Si el destino es D09, D10, D11 o D16, verifica antes la puerta C1 en
`.viltrum/commercial.md`: `estado: aceptada` con versión de propuesta, aprobador, fecha y
evidencia. Sin eso, **no hay handoff** hacia construcción.

## 2. Verificar el paquete

Lee el contrato de salida del origen (`departments/<origen>/AGENTS.md`) y el contrato de
entrada del destino. Comprueba, con evidencia y no con afirmaciones:

- [ ] Artefactos obligatorios del origen, presentes y enlazados
- [ ] Revisión del revisor declarado en el registro — nunca el propio productor
- [ ] Decisiones tomadas, registradas en `.viltrum/decisions.md`
- [ ] Riesgos abiertos que hereda el destino, con severidad
- [ ] Supuestos sin confirmar, como preguntas en `.viltrum/questions.md`
- [ ] Qué NO se hizo y por qué
- [ ] Ningún P0 abierto del origen
- [ ] Todo insumo bloqueante del contrato de entrada del destino está cubierto

## 3. Decidir

```
ACEPTADO     — el destino puede empezar
DEVUELTO     — falta algo del paquete; el origen sigue siendo el dueño
BLOQUEADO    — depende de una pregunta abierta o de C1; se indica cuál
```

## 4. Registrar

Añade al final de `.viltrum/departments/<origen>.md`:

```markdown
### Handoff <origen> → <destino> · AAAA-MM-DD · <ACEPTADO|DEVUELTO|BLOQUEADO>
- Entrega: <artefactos con enlace>
- Hereda: <riesgos y supuestos>
- Falta: <si no es ACEPTADO, qué y de quién>
```

Si es ACEPTADO, actualiza `departamento_activo` en `.viltrum/project.md`.
