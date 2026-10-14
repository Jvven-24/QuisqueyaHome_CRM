---
name: mapa-maestro
description: Procedimiento de D00 para construir y operar el mapa maestro del sistema (`.viltrum/map/`) — sembrar desde la meta, pedir el aporte de cada departamento, validar huecos por rondas, revisión cruzada, entrega legible a Wilber y ejecución por oleadas con open source de licencia permisiva. Úsala al empezar un proyecto o módulo grande, y cada vez que Wilber cambie algo del sistema completo.
---

# Mapa maestro — procedimiento de D00

Doctrina y esquema: `core/system-map.md`, `registry/system-map.json`. Aquí, el orden de trabajo. Primero la capa de mandato (paso 2b): la petición se amplía con todo lo que implica
antes de sembrar nada.

## 1. Sembrar
1. `viltrum map init <proyecto> --goal "<meta en una frase>"`.
2. Con D01 (requisitos), D02 (alcance) y D03 (módulos y contratos) completa `nodes.yaml`: requisitos, módulos, funciones, pantallas, entidades, contratos, integraciones, roles, pruebas.
   Parte de los arquetipos de `skills/alcance-completo/archetypes.md`; cada nodo lleva `plain` (explicación simple), `acceptance`, `risk` y `links`.
3. Cada nodo de tipo función/pantalla se expande a sus comportamientos (estados, validaciones, errores, eventos): el comportamiento mínimo también es un nodo.

## 2. Pedir el aporte de cada departamento
Para cada departamento obligatorio según el tipo de nodo (`viltrum map validate --json` los lista como huecos G01), despacha la tarea de `contribution-task.md` con el modelo más barato que alcance
(P5: `tools/profile_dispatch.py --provider codex --tier small --slim-profile`). Cada departamento responde **solo un YAML** `department: Dxx · cells: [...]`; D00 lo guarda y lo fusiona:
`viltrum map merge <proyecto> --department Dxx --file aporte.yaml`. Un departamento nunca escribe celdas de otro.
Pasa al departamento solo la rebanada que le toca (sus nodos y los enlaces), no el mapa entero (P5).

## 3. Validar y cerrar huecos por rondas
1. `viltrum map validate --json` y agrupa los huecos por departamento.
2. Devuelve a cada dueño **solo sus huecos** (nueva ronda de aporte). Máximo 3 rondas; lo que siga abierto se declara con dueño y motivo, no se oculta.
3. Si el mapa cambió de forma sustancial, relee las lecciones afectadas (`registry/lessons.json`).

## 4. Revisión cruzada (P4)
Las celdas `propuesto` pasan a `validado` solo con `viltrum map review <proyecto> --department Dxx --node ID --status validado --reviewer Dyy --ref <registro>`, donde el revisor es independiente (el de `registry/departments.yaml`) y `--ref` apunta a su informe o handoff. Un departamento no puede cerrar su propia celda: `merge` lo rechaza y el validador marca G10.

## 5. Entregar a Wilber
`viltrum map render <proyecto>` → `MAPA.md` y `mapa.html`. Resume en pocas líneas lo que **decide él** (la sección "Lo que decides tú") y lo que falta. No presentes el mapa como aprobado: `ready_for_review` es una invitación.

## 6. Cambios de Wilber
Cada corrección entra en `overrides.yaml` con razón y fecha. Revalida: las celdas cerradas antes del cambio, en ese nodo y en los que lo enlazan, aparecen como hueco G23; devuélvelas a sus dueños para revalidarlas.

## 7. Ejecutar
`viltrum map plan <proyecto>` → oleadas por dependencia. Para cada tarea: decisión de reutilización (D21/D03, licencia verificada), departamento dueño, revisor. Construir nuevo requiere C1 vigente
y los gates de `core/lifecycle.md`; el plan **no autoriza** nada. Al cerrar una tarea, la celda pasa a `hecho` con evidencia y revisor.

## Reglas
- El mapa no sustituye a los gates ni a la aprobación humana. Producción y C1 siguen siendo humanos.
- Sin secretos en el mapa. Un archivo por departamento; nada de ediciones cruzadas.
- Si el mapa y el código se contradicen, gana el código y se corrige el mapa en el acto (fuentes de verdad de `CLAUDE.md`).
