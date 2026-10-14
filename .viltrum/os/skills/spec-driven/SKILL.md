---
name: spec-driven
description: Úsala antes de construir cualquier módulo, pantalla, función o integración; aplica GitHub Spec Kit (constitución → specify → clarify → plan → tasks → analyze → implement) repartido entre perfiles Viltrum para que nada se codifique sin especificación lista.
---

# Desarrollo guiado por especificación (GitHub Spec Kit + perfiles Viltrum)

Spec Kit (`github/spec-kit`, MIT) da el método y las plantillas; los perfiles Viltrum dan quién hace cada paso y quién
lo revisa. La regla que manda: **nada se codifica sin una especificación en estado `READY`** citada en la tarea.

## Instalación (una vez por equipo y por proyecto)
- CLI global: `py -m pip install --user "git+https://github.com/github/spec-kit.git"` (o `uv tool install`).
  Comprueba con `specify version`.
- En el proyecto: `specify init --here --force --non-interactive --integration claude --script ps --ignore-agent-tools`
  y repite con `--integration codex --integration-options=--skills` y `--integration gemini`. Prueba antes en una
  carpeta temporal: no debe tocar `AGENTS.md` ni `CLAUDE.md`.
- La constitución del proyecto va en `.specify/memory/constitution.md` y es la **única** fuente de los no negociables.

## Quién ejecuta cada fase
| Fase Spec Kit | Perfil productor | Revisor | Resultado |
|---|---|---|---|
| constitution | D00 con Wilber | humano | no negociables del proyecto |
| (inventario previo) | D03 + D22 | otro proveedor | AS-IS del código y de sistemas hermanos |
| specify | D01 (+D02 alcance) | D02 / D01 | qué y por qué, criterios de aceptación |
| clarify | D01 | D00 | huecos resueltos o marcados como preguntas |
| plan | D03 (+D11 datos, D19 integraciones, D05 UX) | D03 humano / D12 | arquitectura, contratos, modelo de datos |
| checklist | D14 (+D06, D07) | D00 | calidad de requisitos, estados, accesibilidad |
| tasks | D00 | D03 | tareas acotadas con archivos permitidos |
| analyze | D00 | otro proveedor | coherencia spec ↔ plan ↔ tareas; bloquea si hay huecos |
| implement | D09 / D10 / D11 / D19 | D14 / D12 | código + pruebas; solo tareas de specs `READY` |

## Reglas
1. Un perfil constructor (D09/D10/D11/D19) **rechaza** una tarea sin especificación `READY` o sin contrato D03 y
   modelo D11: escala en vez de improvisar (comportamiento correcto observado el 2026-10-04 en el CRM).
2. Especificaciones largas se escriben en archivo, no como último mensaje de un CLI en modo solo lectura.
3. El estado de cada especificación vive en el repo (cabecera `estado:`); el tablero humano (Trello) solo lo refleja.
4. Toda afirmación lleva evidencia; lo no verificado es `UNKNOWN`.

## Relación con el resto del OS
`orquestar` decide la etapa y despacha; esta skill define el orden spec → plan → tareas → implementación dentro de
esa etapa. `retro-perfiles` recoge las lecciones; `patron-consola` y `viltrum-pxil-design` alimentan la fase plan (UX).
