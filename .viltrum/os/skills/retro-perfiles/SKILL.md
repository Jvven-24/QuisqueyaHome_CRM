---
name: retro-perfiles
description: Retroalimentación del sistema de perfiles Viltrum. Tras un barrido, una ola de despachos o un rechazo de revisión, registra qué falló, costó o funcionó en perfiles, router, proveedores y herramientas, y convierte cada lección en un cambio verificable (registro, prueba, SOP, checklist o skill). Úsala al cerrar cada ola y siempre que una IA externa entregue algo inválido, salga del alcance o una revisión rechace.
---

# Retroalimentación de perfiles

El sistema de perfiles se entrena con su propia evidencia. Una lección que no termina en un
cambio verificable no ocurrió (CLAUDE.md, "El aprendizaje se persiste").

## Cuándo correrla
- Al cerrar cada ola de un barrido (después de la revisión independiente, nunca antes).
- Inmediatamente cuando el validador de `tools/profile_dispatch.py` marca `failed`, cuando hay
  `warnings`, cuando un revisor devuelve `RECHAZADO`/`CON CONDICIONES` o cuando un agente toca
  archivos fuera de su alcance.
- Cuando el orquestador (D00) se equivoca: tarea mal escrita, archivo mal asignado, regla olvidada.

## Fuentes de evidencia (leer, no suponer)
1. `.viltrum/dispatch/*/result.json`: agente, modelo, estado, `problems`, `warnings`, `filesChanged`, duración.
2. `.viltrum/dispatch/*/stdout-tail.txt`: qué dijo el CLI (preámbulos vacíos, permisos denegados).
3. Informes de revisión con `VEREDICTO:` y los `REV-nn` que devolvieron trabajo al productor.
4. `git diff --stat` real frente a lo que el informe afirma (P3: el informe no es evidencia).

## Registro
Escribe en `<proyecto>/.viltrum/<barrido>/RETRO-sistema-perfiles.md` una entrada `R-nn` por lección:

```
## R-nn · <titulo corto: qué falló o funcionó>
Observación: <hecho con evidencia: archivo, comando, salida, result.json>
Causa: <perfil | router | proveedor/CLI | tarea de D00 | doctrina | herramienta>
Mejora: <cambio concreto en E:\PERFILES AI> · Estado: propuesta | aplicada (<commit/prueba>)
```

## Convertir la lección en cambio (elige el más pequeño que la haga imposible de repetir)
| Causa | Cambio |
|---|---|
| CLI headless mal invocado (preámbulo vacío, permisos denegados, flags incompatibles) | `registry/provider-routing.json` + prueba en `tests/test_profile_dispatch.py` |
| Modelo o proveedor mal asignado a un área | `routing` en `registry/provider-routing.json`, citando el playbook o la eval |
| El validador aceptó basura o rechazó un entregable válido | `validate()`/marcas `--require` + prueba |
| Perfil sin herramienta para verificar lo que propone | `tools` del perfil o contrato de handoff a un perfil que la tenga |
| Clasificador por palabras clave equivocado | Nunca decide nada crítico: D00 asigna departamento explícito |
| D00 escribió mal la tarea (archivo inexistente, alcance incompleto) | Checklist de D00: verificar con `grep` cada archivo asignado antes del despacho |
| Regla de doctrina olvidada bajo presión | Checklist del departamento o prueba automática; no una nota |
| Subagentes de la IA externa sin perfil | El prompt del despacho ya exige que lean `PERFIL.md`; si falla, reforzarlo y probarlo |

## Criterios de salida
- Cada `R-nn` tiene estado `aplicada` con prueba o commit, o `propuesta` con dueño y motivo.
- Pruebas del SDK en verde: `python -m unittest discover -s tests`.
- El revisor de la retro no es quien produjo el trabajo revisado (P4). Lo que toque producción o
  C1 queda como propuesta para aprobación humana.
- Actualiza la memoria del departamento afectado (`departments/<Dxx>/MEMORY.md`) con la regla, no con la anécdota.
