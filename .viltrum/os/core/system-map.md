# Mapa maestro del sistema — el mapa mental de D00

> D00 no produce el trabajo de nadie, pero debe saber **qué hay que construir completo**. El mapa maestro es ese conocimiento escrito: un grafo vivo
> del sistema donde cada departamento aporta su parte, se revalida hasta que no haya huecos, una persona no técnica lo puede leer y corregir,
> y de él se deriva la ejecución. Vocabularios y reglas: `registry/system-map.json` (nada se incrusta en el código, P2).

## Para qué sirve
- Que lo establecido **no se pierda**: está en un archivo con dueño por celda, no en la memoria de una conversación.
- Que ninguna funcionalidad se entregue a medias: cada tipo de nodo declara qué departamentos deben aportar y qué debe cubrirse (seis estados, contrato, prueba…).
- Que Wilber lea y corrija sin ser técnico: cada nodo tiene una explicación simple y el mapa dice qué decide él.
- Que D00 conozca la meta final y orqueste contra ella, reutilizando open source de licencia permisiva verificada (P0).

## Dónde vive (en cada proyecto)
```
.viltrum/map/
├── map.yaml          meta, etapa, versión
├── nodes.yaml        el grafo: nodos tipados con id estable, explicación simple, aceptación, riesgo, enlaces y reutilización
├── nodes/*.yaml      (opcional) más nodos en archivos aparte para que varios departamentos no choquen al editar
├── cells/Dxx.yaml    UN archivo por departamento: solo ese departamento escribe sus celdas
├── overrides.yaml    cambios de Wilber: mandan sobre todo lo demás y se marcan "cambiado por ti"
├── MAPA.md · mapa.html · gaps.json · plan.json     generados por `viltrum map render|plan` (no se editan)
```
Los archivos son texto plano en git: se versionan, se fusionan sin choques y se revierten. No deben contener secretos: el validador busca patrones de claves y contraseñas y lo marca como hueco P1 (G24); es una heurística, no una garantía.

## Nodos (qué se mapea)
Meta → requisito → módulo → función → pantalla → componente → comportamiento (estado, validación, error) → entidad de datos → contrato (API o evento) →
integración → rol y permisos → notificación → prueba de aceptación → operación → legal. Cada nodo: `id` estable (`REQ-001`), `type`, `title`, `plain`
(explicación para una persona no técnica), `parent`, `priority`, `risk` (R0–R4), `acceptance`, `links` (`verifies`, `uses`, `depends_on`, `implements`, `contains`)
y, si aplica, `reuse` (decisión adopt/adapt/build/none con candidatos y licencia). El tipo fija qué departamentos son obligatorios (tabla en el registro).

## Celdas (qué aporta cada departamento)
Una celda es (nodo × departamento): `status`, `deliverable` concreto y parametrizado, `evidence`, `depends_on`, `reviewer`, y la **comunicación**:
`needs_from` (qué recibe de quién) y `delivers_to` (a quién entrega). Estados: `pendiente · propuesto · validado · hecho · n/a · bloqueado`.
- Un departamento solo puede dejar sus celdas en `pendiente`, `propuesto`, `n/a` o `bloqueado` (`viltrum map merge` rechaza lo demás y borra `reviewer`). **Nunca cierra la suya.**
- `validado`, `hecho` y `n/a` los fija `viltrum map review` con un **revisor distinto** del productor (otro departamento o `human`) y una referencia al registro de la revisión (`--ref`).
- La referencia de revisión **debe resolver** a un registro que exista en el proyecto (`handoff:HND-…` en `.viltrum/handoffs/`, o una ruta relativa con `#ancla`); si no resuelve, es hueco G10.
  `reviewer` y `review_ref` siguen siendo texto en un archivo: para que un departamento no pueda falsificarlos, proteger `cells/Dxx.yaml` con CODEOWNERS/revisión en git (decisión de D13, no se puede imponer desde aquí).
- Un departamento puede escribir `n/a` en su celda, pero no cuenta como cerrada hasta que otro la revise (G10).
- `hecho` exige evidencia; `n/a` exige razón y evidencia y revisor; nunca es una forma de saltarse un departamento.
- Un cambio posterior del departamento sobre una celda ya revisada reabre la revisión.
- Un departamento **solo escribe su archivo**. D00 coordina, siembra la estructura y fusiona (`viltrum map merge`); no escribe celdas ajenas.

## Huecos (lo que el validador detecta)
Celda obligatoria ausente o aún `pendiente` · celda bloqueada · hecho sin evidencia · función o pantalla sin comportamientos hijos · build sin justificar la búsqueda previa · comunicación no recíproca · cambio humano posterior a una celda cerrada · posible secreto · n/a sin razón · requisito sin prueba · pantalla sin los seis estados de D06 · función sin contrato/entidad/integración · reutilización sin licencia permitida
y verificada, o con licencia bloqueada · nodo huérfano · ciclo de dependencias · validación sin revisor distinto · referencias rotas · nodo sin aceptación · estados fuera del vocabulario ·
cambio humano inválido · nodo sin explicación simple · comunicación incoherente entre departamentos. Cada regla trae su severidad (P1–P3) en el registro.

## Reutilización open source (P0 hecho método)
Antes de construir un nodo, D21 y D03 buscan algo ya creado. La decisión queda en `reuse`. Reglas de licencia (`license_policy`): permisivas permitidas; LGPL/EPL/MPL/CC-BY **requieren tu decisión**; en expresiones SPDX, `OR` basta una opción permitida y `AND` manda la peor;
AGPL/GPL/SSPL/BUSL/PolyForm-NonCommercial, propietarias o desconocidas **bloquean** `adopt/adapt`. La licencia debe estar verificada en el repositorio del candidato, no recordada.

## La capa humana
- `MAPA.md` y `mapa.html` abren con **"Lo que decides tú"**: bloqueos, licencias a revisión, riesgo R2+ sin revisión humana.
- Wilber corrige en `overrides.yaml` (nodo, campo, valor, **razón**, fecha). Las celdas cerradas **antes** del cambio, en ese nodo y en los que lo enlazan (un nivel), aparecen como hueco G23 hasta que se revaliden.
- **El mapa nunca se aprueba solo.** `ready_for_review` exige cero huecos P1/P2 y es solo la invitación a revisar; la aprobación es humana (mismo criterio que G1: no se aprueba por porcentaje).

## Cómo se construye (ciclo de D00; detalle en `skills/mapa-maestro`)
1. **Sembrar** (D00 con D01/D02/D03): meta y estructura, partiendo de arquetipos (`skills/alcance-completo/archetypes.md`) para no empezar de cero.
2. **Aporte por departamento** (en paralelo, modelo barato posible): cada uno completa su archivo de celdas, incluida su comunicación.
3. **Validar y cerrar huecos** por rondas: cada hueco vuelve a su dueño, no a todos.
4. **Revisión cruzada** de las celdas `propuesto` por un revisor independiente.
5. **Entrega a Wilber** con la vista simple; sus cambios entran por `overrides.yaml`.
6. **Ejecutar** el plan por oleadas (`viltrum map plan`): cada tarea con su decisión de reutilización; el avance actualiza las celdas y los gates citan sus filas.

## Relación con lo existente
- `skills/alcance-completo`: la matriz **por funcionalidad**; alimenta los nodos de esa función. El mapa es la capa **por proyecto**.
- Spec Kit (`skills/spec-driven`): el detalle spec/plan/tasks de cada función; el mapa lo enlaza, no lo reemplaza.
- `registry/lessons.json`: una lección que cambia una regla actualiza las plantillas y marca las celdas afectadas.
- Espacio de proyecto (`core/project-workspace.md`): `questions.md` y `decisions.md` siguen siendo el canal de preguntas y decisiones; el mapa las referencia.

## Comandos
`viltrum map init <proyecto> --goal "…"` · `merge <proyecto> --department Dxx --file aporte.yaml` · `review <proyecto> --department Dxx --node ID --status validado|hecho|n/a --reviewer Dyy|human --ref <registro>` · `validate [--json]` · `render` · `plan`.
