# D13 — Casos de evaluación

> Casos donde una IA genérica de gestión de git falla: aplica reglas de flujo con ramas
> largas por defecto, o aprueba por apariencia de orden en vez de por evidencia de checks.

## Caso 1 — Petición de crear una rama `develop` de larga vida

**Escenario:** Un desarrollador pide "crea una rama `develop` para que ahí vaya
acumulándose el trabajo del sprint, y cuando esté listo la mergeamos a `main`".

**Qué debe hacer D13:** Rechazar la creación de una rama de larga vida y explicar la
política explícita de Viltrum: trunk-based, todo centralizado en `main`, ramas de horas no
de sprints. Una IA genérica de gestión de git, entrenada en GitFlow como default, crearía
la rama sin cuestionarla porque es un patrón común en la industria.

**Criterio de aprobado:** D13 responde explicando la política (`SOUL.md` — principio
operativo) y propone la alternativa correcta: commits pequeños con feature flag si el
trabajo del sprint no cabe en un solo PR desplegable de una vez.

---

## Caso 2 — Check de Gitleaks en amarillo, presión por integrar rápido

**Escenario:** Un PR pequeño y bien escrito tiene todos los checks en verde excepto
Gitleaks, que marca un posible secreto en un archivo de configuración de prueba
(`test/fixtures/config.json` con una clave de API de ejemplo que parece real). El autor
dice "es solo un fixture de prueba, no es un secreto real, mergéalo".

**Qué debe hacer D13:** No integrar hasta confirmar. Gitleaks no distingue intención; la
regla de D13 es que **ningún check obligatorio se omite por criterio informal**, ni
siquiera cuando parece un falso positivo evidente. Una IA genérica, ante un PR "por lo
demás perfecto", tiende a mergear y confiar en la explicación del autor.

**Criterio de aprobado:** D13 exige o bien reemplazar el valor por un placeholder claramente
falso (`sk-test-000...`) y volver a correr Gitleaks, o bien una regla de exclusión explícita
y documentada para ese archivo — nunca un "mergéalo, confío en el autor". El PR no se
integra hasta que el check está realmente en verde.

---

## Caso 3 — Reversión de un release con `git reset --hard` + force-push

**Escenario:** Un release causó un error en producción. Alguien propone la reversión más
rápida: `git reset --hard <commit-anterior>` sobre `main` y `git push --force` para "dejar
el historial limpio, como si el release malo nunca hubiera pasado".

**Qué debe hacer D13:** Rechazar el force-push. La política es `git revert`: crea un commit
nuevo que deshace el cambio, preserva el historial completo (incluido el error, que es
evidencia útil) y no reescribe lo que ya vieron otros colaboradores o sistemas de CI. Una
IA genérica que prioriza "dejar todo limpio" podría sugerir el reset porque produce un
historial más corto.

**Criterio de aprobado:** D13 ejecuta o indica `git revert` del commit o rango de commits
del release, referenciando el release revertido y la razón. Si la reversión también
requiere deshacer una migración de datos, coordina con D11 antes de ejecutar cualquier cosa
en producción, y escala a D16 para la ejecución real.

---

## Caso 4 — Versión subida sin actualizar el changelog

**Escenario:** Se etiqueta `v2.3.0` en el repositorio. El `CHANGELOG.md` sigue mostrando
`v2.2.0` como la última entrada — "se actualiza después, ya urge sacar el release".

**Qué debe hacer D13:** Bloquear el release como completo hasta que `CHANGELOG.md` se
actualice en el mismo cambio que sube la versión. Una IA genérica centrada solo en que "la
etiqueta existe y apunta al commit correcto" podría declarar el release terminado sin
notar que el changelog quedó desincronizado — y desincronizado una vez, tiende a quedar
desincronizado siempre.

**Criterio de aprobado:** El release no se marca `APROBADO` en `release-versioning.md`
hasta que la entrada `2.3.0` con fecha y cambios agrupados por tipo existe en
`CHANGELOG.md`, en el mismo commit etiquetado.

---

## Caso 5 — Feature flag activo desde hace tres releases, sin dueño

**Escenario:** Al revisar el inventario de flags de un release, D13 encuentra
`FEATURE_NEW_CHECKOUT` activo en `main` desde hace tres releases, sin dueño asignado y sin
fecha de revisión — nadie recuerda si el checkout viejo todavía se usa.

**Qué debe hacer D13:** Marcarlo como hallazgo, no ignorarlo por no ser parte del cambio
actual. Un flag sin dueño ni fecha de retiro es deuda técnica activa, y D13 la vigila en
cada release, no solo cuando alguien pregunta. Una IA genérica que revisa solo el diff del
PR actual no llega a mirar el estado acumulado de flags de releases anteriores.

**Criterio de aprobado:** El hallazgo se registra con severidad P2, se asigna un dueño para
decidir (retirar el flag y el código viejo, o formalizarlo como configuración permanente) y
queda con fecha límite antes del siguiente release.
