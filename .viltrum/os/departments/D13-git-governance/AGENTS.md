# D13 — Método operativo

## Contrato de entrada

De cualquier departamento que produce código: el cambio ya implementado, con sus pruebas.

De D03: convención de commits existente del repositorio (si la hay) y decisiones que deben
quedar como ADR referenciado en el commit.

De D12: resultado de Gitleaks sobre el cambio — **bloqueante**.

**Sin checks en verde, no integro.** No existe una excepción "lo arreglamos en el próximo
commit" para un check obligatorio.

---

## Procedimiento

### 1. Verificar que el cambio es pequeño y atómico

- [ ] Un commit resuelve una unidad lógica de cambio, no varias mezcladas
- [ ] El diff es revisable por una persona en minutos, no en horas
- [ ] Si el cambio es grande, se divide en una secuencia de commits pequeños, cada uno con `main` desplegable

**Si no se puede dividir, es señal de acoplamiento (P1 principio) — se avisa a D03.**

### 2. Redactar o verificar el mensaje de commit

Aplico la convención existente del repositorio. Si no existe ninguna, propongo
**Conventional Commits**:

```
<tipo>(<alcance opcional>): <resumen en imperativo, ≤72 caracteres>

<cuerpo opcional: qué y por qué, no cómo — el diff ya dice cómo>

<pie opcional: BREAKING CHANGE, Refs #issue, Co-authored-by>
```

| Tipo | Uso |
|---|---|
| `feat` | Funcionalidad nueva visible para quien usa el sistema |
| `fix` | Corrección de un defecto |
| `refactor` | Cambio interno sin cambio de comportamiento observable |
| `perf` | Mejora de rendimiento medida |
| `test` | Solo pruebas |
| `docs` | Solo documentación |
| `chore` | Mantenimiento, dependencias, configuración |
| `build` / `ci` | Pipeline y empaquetado |
| `revert` | Reversión de un commit anterior, con referencia |

- [ ] El resumen explica **qué cambió y para quién**, no "arreglos varios"
- [ ] `BREAKING CHANGE:` presente si rompe compatibilidad — dispara `MAJOR` en SemVer

### 3. Checks obligatorios antes de integrar a `main`

Ninguno es opcional. El orden importa: falla rápido primero.

| # | Check | Bloquea si falla |
|---|---|---|
| 1 | Lint | Sí |
| 2 | Tipos (TypeScript/equivalente) | Sí |
| 3 | Gitleaks (secretos) | Sí, siempre — sin excepción |
| 4 | Pruebas unitarias y de integración | Sí |
| 5 | Build | Sí |
| 6 | Pruebas E2E de los recorridos críticos (si el cambio los toca) | Sí |

- [ ] Los seis (los que apliquen) corrieron en CI, no solo en la máquina de quien escribió el código
- [ ] El resultado de cada check queda enlazado como evidencia del PR o del commit

### 4. `.gitattributes` y `.gitignore`

Verificados desde el primer commit del repositorio, revisados en cada cambio de tooling:

- [ ] `.gitattributes` normaliza finales de línea (`* text=auto eol=lf` o el estándar del stack)
- [ ] Archivos binarios marcados `-text` o `binary` explícitamente
- [ ] `.gitignore` cubre dependencias, artefactos de build, archivos de entorno y secretos locales
- [ ] Ningún archivo con secreto real fue versionado alguna vez — si lo fue, el secreto se rota (D12), no solo se ignora desde ahora

### 5. Feature flags para trabajo incompleto

- [ ] Código incompleto en `main` vive detrás de un flag apagado por defecto
- [ ] El flag tiene nombre descriptivo, dueño y fecha estimada de retiro
- [ ] Ningún flag lleva más de un ciclo de release sin revisarse — flag olvidado es deuda

### 6. Protección de `main`

- [ ] Push directo a `main` deshabilitado en GitHub — todo entra por PR, aunque el PR sea de un solo commit
- [ ] Checks obligatorios configurados como *required status checks* en la protección de rama
- [ ] Al menos una aprobación de revisor independiente configurada como requisito (P4)
- [ ] Force-push a `main` deshabilitado

### 7. Versionado — SemVer 2.0.0

- [ ] `MAJOR.MINOR.PATCH` — `MAJOR` en cambio incompatible, `MINOR` en funcionalidad compatible, `PATCH` en corrección compatible
- [ ] Etiqueta (`tag`) de git creada en cada release, firmada si el repositorio lo exige
- [ ] `CHANGELOG.md` actualizado en el mismo cambio que sube la versión, no después
- [ ] Pre-releases (`-rc.1`, `-beta.1`) usadas cuando el release no es estable todavía

### 8. Reversión

- [ ] Toda reversión de producción usa `git revert`, nunca reescritura de historial (`reset --hard` + force-push)
- [ ] El commit de reversión referencia el commit revertido y la razón
- [ ] Si la reversión es de una migración de datos, se coordina con D11 antes de ejecutar

### 9. Firma de commits (opcional, según repositorio)

- [ ] Si el repositorio la exige, verificada como *required check*
- [ ] Si no la exige, no se impone — es mejora, no bloqueo, salvo decisión explícita del dueño

### 10. Handoff

- [ ] Log de commits del cambio, legible sin contexto adicional
- [ ] Checks en verde enlazados
- [ ] `CHANGELOG.md` y etiqueta si es release
- [ ] Handoff a D14 (para que ejecute regresión si el cambio lo amerita) y a D16 si dispara despliegue

---

## Herramientas y skills

| Situación | Skill / herramienta |
|---|---|
| Operaciones de git y GitHub desde CLI | `viltrum-git-governance` (git/gh) |
| Revisar un PR y su riesgo antes de integrar | `viltrum-repo-map` (revisión de PR) |
| Analizar qué se rompe con un cambio | `viltrum-repo-map` (impacto) |
| Trazar un bug hasta su origen en el historial | `viltrum-repo-map` (depurar) |
| Revisión de calidad del diff | `code-review` |
| Detectar secretos antes de integrar | Gitleaks (CLI, ejecutado por D12 o en CI) |

**No hay skill instalada dedicada a generar `CHANGELOG.md` automáticamente.** Se redacta
siguiendo Conventional Commits + Keep a Changelog como formato, a mano o con el script de
CI del repositorio si existe.

---

## Contrato de salida

- [ ] Commits atómicos, con mensaje que sigue la convención del repositorio
- [ ] Los seis checks obligatorios en verde, con evidencia enlazada
- [ ] `.gitattributes` y `.gitignore` correctos
- [ ] Sin secretos en el cambio ni en el historial
- [ ] Trabajo incompleto detrás de feature flag, nunca en rama de larga vida
- [ ] `main` protegido — sin push directo, sin force-push
- [ ] Versión SemVer, etiqueta y `CHANGELOG.md` actualizados si es release
- [ ] Reversión preparada con `git revert`, nunca con reescritura de historial
- [ ] Handoff a D14 y, si aplica, a D16

---

## Antipatrones propios

| Fallo | Corrección |
|---|---|
| Rama de feature que vive semanas | Trunk-based: commits pequeños directo hacia `main` vía PR corto |
| Mensaje de commit "fix", "cambios", "wip" | Convención aplicada: qué cambió y por qué |
| Commit que mezcla refactor y funcionalidad nueva | Se separan en commits atómicos distintos |
| Trabajo incompleto escondido en una rama paralela | Feature flag apagado en `main` |
| Check en rojo integrado "porque ya es tarde" | Bloqueo real — ningún check obligatorio es negociable |
| `git reset --hard` + force-push a `main` para revertir | `git revert`, siempre, con referencia al commit original |
| Secreto commiteado y solo borrado en el siguiente commit | El secreto queda en el historial — se rota (D12), no solo se retira |
| Feature flag que nadie retira nunca | Revisión de flags en cada release; dueño y fecha de retiro |
| Versión subida sin actualizar `CHANGELOG.md` | Mismo cambio actualiza versión y changelog |
| `main` sin protección de rama en GitHub | Checks requeridos + revisor obligatorio configurados desde el día uno |
| Final de línea inconsistente entre sistemas operativos del equipo | `.gitattributes` desde el primer commit |
