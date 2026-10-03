# Checklist — versionado y release

> Se aplica a todo release, desde el primer `0.1.0` hasta producción estable.
> Firma el revisor (D03), nunca quien preparó el release.

## A. SemVer 2.0.0

- [ ] Formato `MAJOR.MINOR.PATCH`, sin excepción
- [ ] `MAJOR` sube solo ante cambio incompatible con versiones anteriores
- [ ] `MINOR` sube ante funcionalidad nueva compatible hacia atrás
- [ ] `PATCH` sube ante corrección compatible hacia atrás
- [ ] Pre-release (`-rc.1`, `-beta.1`, `-alpha.1`) usado cuando el release no es estable
- [ ] Metadatos de build (`+build.123`) no afectan la precedencia de versión
- [ ] La versión `0.y.z` se entiende como desarrollo inicial — puede cambiar sin subir `MAJOR`, y se documenta que el proyecto ya salió de esa etapa cuando llega a `1.0.0`

## B. Etiquetas (`tags`)

- [ ] Cada release tiene una etiqueta de git correspondiente a su versión exacta
- [ ] La etiqueta apunta al commit real que se desplegó, no a uno posterior
- [ ] Etiquetas firmadas si el repositorio lo exige
- [ ] Ninguna etiqueta se reescribe ni se mueve después de publicada

## C. `CHANGELOG.md`

Formato Keep a Changelog:

- [ ] Sección `[Unreleased]` existe y se mantiene al día entre releases
- [ ] Cada versión tiene fecha en formato `YYYY-MM-DD`
- [ ] Cambios agrupados por tipo: `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`
- [ ] El release en `CHANGELOG.md` se actualiza en el **mismo cambio** que sube la versión, no en uno posterior
- [ ] Entradas legibles por una persona sin contexto técnico del commit — no es un copy-paste de mensajes de commit

## D. Checks previos al release

- [ ] Todos los checks de `pre-merge.md` en verde sobre el commit exacto que se etiqueta
- [ ] Sin P0 abierto (Gate G5/G6 de `core/lifecycle.md`)
- [ ] Migraciones de este release probadas sobre copia de producción (D11)
- [ ] Respaldo reciente confirmado antes de un release que toque datos

## E. Reversión preparada

- [ ] Se identificó la etiqueta anterior estable a la que se podría volver
- [ ] El plan de reversión usa `git revert` sobre los commits del release, no reescritura
- [ ] Si el release incluyó migración de datos, existe plan de reversión de datos coordinado con D11 — o se documentó que la migración es irreversible y por qué se aceptó

## F. Feature flags del release

- [ ] Inventario de flags activos en este release, con dueño y fecha de revisión
- [ ] Ningún flag de un release anterior sigue "temporalmente" activo sin revisión

---

## Veredicto

```
APROBADO      — SemVer correcto, etiqueta, changelog y reversión preparada, con evidencia
CONDICIONAL   — excepción documentada con dueño y fecha. Nunca con P0 abierto
RECHAZADO     — vuelve a preparación de release con hallazgos clasificados
```

Firma el revisor (D03). El release no se declara listo por "ya está en `main`" — se declara
listo cuando esta checklist está completa.
