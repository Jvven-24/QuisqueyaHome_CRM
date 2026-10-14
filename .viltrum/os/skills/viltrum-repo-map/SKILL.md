---
name: viltrum-repo-map
description: Explora un repositorio existente, mide el impacto de un cambio, depura hasta el origen, refactoriza con seguridad o revisa un PR usando herramientas abiertas (ripgrep, ast, dependency-cruiser) vía `viltrum repo-*`. Úsala antes de tocar código que no escribiste.
---

# Mapa de repositorio Viltrum

Sustituye a GitNexus (licencia no comercial, requería índice previo). No necesita indexar:
consulta el código del commit actual cada vez. Implementación: `viltrum_sdk/repo_map.py`.

| Comando | Para qué |
|---|---|
| `viltrum snapshot <ruta> [--exclude carpeta]` | **Primero.** Todo el proyecto en `.viltrum/snapshot/SNAPSHOT.md` (~4K tokens para ~40K líneas): áreas, rutas, símbolos, grafo de imports, pruebas, puntos calientes y el delta contra la vez anterior (`look_here`). Gratis, incremental (~2 s); se regenera al cerrar cada tarea |
| `viltrum repo-inventory --project <ruta>` | Inventario de solo lectura: lenguajes, manifiestos, tests. Primer paso en brownfield |
| `viltrum repo-query "<términos>" --project <ruta>` | Encontrar símbolos por nombre o ruta |
| `viltrum repo-context <símbolo> [--file <ruta>]` | Definición, fragmento, referencias y llamadas |
| `viltrum repo-impact <símbolo> [--depth 2] [--modules]` | Llamadores transitivos, archivos afectados y riesgo |
| `viltrum repo-pack "<tema>"` | Paquete de contexto mínimo (P5) para otro perfil o modelo |

## Procedimientos

**Snapshot antes que lectura.** Se lee `SNAPSHOT.md` (o se regenera con `viltrum snapshot`) antes de abrir archivos; el `delta.json`
dice qué cambió y qué dependientes revisar. Al cerrar una tarea se vuelve a generar; si hay mapa maestro, devuelve los nodos cuyo código cambió.

**Explorar antes de tocar.** `repo-inventory` → `repo-query` del módulo → `repo-context` de
los 2–4 símbolos clave. Leer solo esos fragmentos; nunca el árbol completo.

**Impacto de un cambio.** `repo-impact <símbolo>`. Riesgo `MEDIUM`/`HIGH` o un contrato
público entre los afectados → pruebas de caracterización antes del cambio y aviso a D03.
`--modules` añade el grafo de dependency-cruiser en JS/TS (lento en proyectos grandes).

**Depurar.** Desde el síntoma (mensaje de error, ruta, componente): `repo-query` →
`repo-context` del punto de fallo → `repo-impact` hacia arriba para ver quién lo invoca.
Confirmar la causa con una prueba que falla antes de proponer el parche.

**Refactor seguro.** `repo-impact` antes, mismo comando después: los llamadores deben
coincidir salvo los que el cambio declara. Renombres: `rg -w <nombre>` debe quedar en cero.

**Revisión de PR.** `git diff --name-only <base>...HEAD` → `repo-impact` de cada símbolo
público modificado → verificar que los afectados tienen prueba.

## Límites

`repo-impact` se detiene con `status: truncated` y riesgo `HIGH` si un nivel supera 25
llamadores o se agotan 20 s (nombres comunes como `get` o `run`): en ese caso, acotar con
`repo-context --file` y pruebas, no ampliar la búsqueda. `--depth` mínimo es 1.

Las referencias son por nombre: no resuelve llamadas dinámicas, alias, inyección de
dependencias ni homónimos, y en JS/TS el fin de una función se estima por llaves. Cada
resultado indica su `engine`; lo que no se confirma con una prueba o lectura se marca
como inferido. No ejecuta instaladores, scripts ni migraciones.
