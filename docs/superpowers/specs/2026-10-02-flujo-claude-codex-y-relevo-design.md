# Diseño · Flujo de trabajo Claude/Codex y protocolo de relevo

Fecha: 2026-10-02 · Milestone: Reestructuración con metodología SOLID

Este documento es el **registro de la decisión**. La verdad operativa —lo que un
agente lee para trabajar— vive en `docs/R_ANALISIS_Y_PLAN.md` §5 y en
`AGENTS.md`, que se actualizan a partir de aquí.

## 1. El problema, verificado en el repositorio el 02/10/2026

No es deuda de código. El código está sano: 232 pruebas en verde y `typecheck`
limpio en `dev/reestructuracion-solid`. Son tres fallas de proceso:

1. **Código varado.** R3.3 (commit `804f966`) y R3.4 (1.171 líneas **sin
   commitear**) viven solo en el worktree `../crm-codex`. Ninguno está en la rama
   de integración.
2. **Contabilidad falsa.** El issue #47 (R3.3) está **cerrado** y su código no es
   ancestro de `dev/reestructuracion-solid`. En los issues parece que avanzamos;
   en la rama real, no.
3. **Informes de "verde" no verificables.** Codex reportó todo en verde. La
   corrida real da 244 pruebas con **1 fallando**: la prueba que Codex escribió
   para el módulo que Codex implementó
   (`src/application/proyectos/casos-de-uso.test.ts:172`), con una aserción
   invertida —llama a `borrarProyecto` y acto seguido afirma `deletedAt === null`.
   Más 2 avisos de lint en sus propios archivos nuevos.

### Dos creencias del plan que eran falsas

- **`R_ANALISIS_Y_PLAN.md:107` dice que Codex no puede usar git ni GitHub "porque
  su sandbox solo escribe dentro de `crm-codex`".** Falso: `~/.codex/config.toml`
  tiene `sandbox_mode = "danger-full-access"` y `approval_policy = "never"`.
  Codex no está en sandbox. El motivo real del fallo queda sin determinar, y da
  igual: el diseño nuevo no necesita que Codex use git.
- **Se asumió que Codex no podía probar la interfaz.** Falso: tiene
  `codex-computer-use.exe` registrado y `.playwright-cli/` guarda volcados de
  página y logs de consola del 02/10 a las 14:50–14:52 contra la app con
  `next dev` corriendo. Ya lo hizo.

Lo único cierto de la limitación: Codex **no debe** ejecutar `npm run dev` ni
`build`, porque deja archivos en `.next/` que Windows no permite borrar
(`errores-conocidos.md`). No le hace falta: alguien levanta el servidor y él
prueba contra la URL.

### Lo que no existe hoy

- Ninguna prueba de interfaz. Las 232 son unitarias y de arquitectura, con
  `node --test`. El `package.json` no declara Playwright, Vitest, Cypress ni
  Jest. (La carpeta `.playwright-cli/` **no** es una dependencia del proyecto:
  son los volcados que deja la herramienta de navegador del propio Codex, y está
  sin trackear.)
- Ninguna infraestructura de despliegue: sin `Dockerfile`, sin `compose`, solo
  tres workflows de CI.

## 2. Reparto del trabajo

Decidido el 02/10/2026. Sustituye la tabla de `R_ANALISIS_Y_PLAN.md` §5, que
tenía los papeles al revés: asignaba a Codex la extracción de módulos y la
migración de vistas, y a Claude la verificación en el navegador.

| | Claude | Codex |
|---|---|---|
| **Escribe** | Todo el código: backend (R3, R4), vistas (R5), pruebas unitarias | Nada |
| **Prueba** | `typecheck`, `lint`, `npm test` | La interfaz en navegador, buscando romperla |
| **Dónde** | Carpeta principal, rama `dev/reestructuracion-solid` | `../crm-codex`: solo lee y navega |
| **Git y GitHub** | Commits, push, issues, etiquetas | Nada |

**Motivo del reparto:** probar interfaces consume muchos tokens y Codex es más
eficiente en eso. Y separar quien escribe de quien prueba evita que un agente
corrija su propia tarea, que es exactamente lo que falló en R3.4.

**Consecuencia estructural:** si Codex nunca escribe código, no necesita rama ni
worktree de trabajo. Las fallas 1 y 2 de la §1 no se arreglan: se vuelven
imposibles. Desaparecen el merge pendiente, el código varado y el issue cerrado
sin integrar.

Codex **no** participa en R5 escribiendo vistas. Las vistas son código, y el
código es de Claude.

## 3. La vitrina

`../crm-codex` deja de ser sitio de trabajo y pasa a ser escenario de pruebas,
clavado a un commit ya verificado.

Ciclo por módulo:

1. Claude termina el módulo en la carpeta principal y deja `typecheck`, `lint` y
   `npm test` en verde.
2. Claude commitea y **pushea**. Mismo commit: el código y `docs/R_RELEVO.md`.
3. Claude pone la vitrina en ese commit exacto y levanta `npm run dev` ahí, en
   segundo plano.
4. Codex lee `docs/R_RELEVO.md`, recorre el módulo con el guion de
   `docs/R_REGRESION.md` e intenta romperlo.
5. Codex escribe lo que encuentre en `../crm-codex/hallazgos/<issue>.md`: pasos
   para reproducir, qué esperaba, qué pasó. Un archivo por issue, fuera de git.
6. Claude lee solo ese archivo, arregla en la carpeta principal, y vuelve al 1.
7. Cuando no quedan hallazgos, Claude cierra el issue.

El código nunca viaja de Codex a Claude. Solo viajan hallazgos en texto.

Y como la vitrina está fija a un commit, los fallos son reproducibles. Hoy no lo
eran: los `console-*.log` del 02/10 están llenos de *Fast Refresh*, es decir que
Codex probaba mientras el código cambiaba bajo sus pies.

El `.next/` sucio queda en una carpeta desechable, nunca en la principal.

## 4. El protocolo de relevo

**Premisa:** Claude no puede predecir con fiabilidad cuándo se agotan sus tokens.
El corte llega sin aviso. Por tanto el relevo **no se escribe al final**: se
escribe en cada push. Así el último commit que exista en el remoto ya es
coherente por sí solo, corte cuando corte.

Dos reglas innegociables:

- **Nada se prueba si no está pusheado.** Si no está en el remoto, no existe y no
  se pide probarlo.
- **El push y el relevo son un solo paso.** No hay push sin `docs/R_RELEVO.md` al
  día, en el mismo commit que el código. Al vivir en el mismo commit, no existe
  ventana en la que el repo diga una cosa y el código otra.

### `docs/R_RELEVO.md`

Trackeado en git, reescrito en cada push. Tres secciones:

| Sección | Para quién | Contenido |
|---|---|---|
| Dónde estamos | cualquiera | Commit, fase, qué está verde (con el número de pruebas), qué está integrado de verdad |
| Para Codex | Codex | Módulo a probar, URL de la vitrina, pasos, qué cuenta como fallo, ruta donde escribir hallazgos |
| Qué sigue | quien retome el código | Siguiente issue, archivos que toca, lo pendiente, las trampas conocidas |

### Firma en el commit

Cada commit lleva al pie una línea `Probar: <issue>` —por ejemplo
`Probar: R3.4`— o `Probar: nada` cuando no hay nada que verificar en interfaz.
Así `git log --oneline` se explica solo, sin abrir ningún archivo.

### Cómo se retoma sin Claude

- **El usuario a Codex, desde su terminal:** *"lee `docs/R_RELEVO.md` y haz lo que
  dice"*. Frase fija, siempre la misma, no hay que explicar nada más.
- **Una sesión nueva o en la nube:** arranca en frío leyendo `AGENTS.md`,
  `docs/R_ANALISIS_Y_PLAN.md` y `docs/R_RELEVO.md`.

Claude además deja el resumen en el chat al cerrar una tanda de trabajo, pero
como comodidad. **La verdad vive en el repo**, porque el chat se pierde y se
compacta.

## 5. Los tres candados

Uno por cada falla de la §1:

1. **Contra el "verde" falso:** un issue se cierra cuando Claude **vio** la
   corrida de `npm test` en verde. Nunca por un informe ajeno. Cuesta unos 300
   tokens y el 02/10 habría cazado la aserción invertida.
2. **Contra el código varado:** una sola rama con un solo dueño. Sin segunda rama
   donde varar nada.
3. **Contra la contabilidad falsa:** un issue solo se cierra si su commit es
   ancestro de `dev/reestructuracion-solid`, comprobado con
   `git merge-base --is-ancestor`.

## 6. Orden de las fases

1. **Rescate.** Salvar las 1.171 líneas de R3.4 antes de tocar la vitrina
   (fijarla a un commit las destruiría). Corregir la aserción invertida y los 2
   avisos de lint. Integrar R3.3 y R3.4. Reabrir #47 hasta que su código esté en
   la rama. Reetiquetar a `agente:claude` los 13 issues abiertos que hoy dicen
   `agente:codex`. Montar la vitrina. Borrar la ref rota
   `refs/heads/dev/reestructuracion-solid.broken-backup-20261002`, que suelta un
   aviso en cada comando de git. Actualizar `R_ANALISIS_Y_PLAN.md` §5 y §9 y
   `AGENTS.md` con este diseño.
2. **Completar la reestructuración.** R3.4 a R3.7, R4 y R5, con el ciclo de la §3
   por módulo.
3. **Verificar sin vuelta atrás.** Los 13 módulos del guion de
   `docs/R_REGRESION.md`, con Codex rompiendo, hasta que no queden hallazgos.
4. **Limpieza del repositorio.** Documentación obsoleta, decisiones que ya no
   rigen, ramas muertas (hay 6 ramas y 3 worktrees, uno de ellos detenido desde
   septiembre), issues completados que ya no describen el proyecto actual.
5. **Despliegue al VPS y validación por módulos con el cliente.**

La decisión **#17** (desplegar al final, en una sola operación) **se mantiene**.
Se revisó si convenía adelantar el despliegue para usarlo como escenario de
pruebas, y se descartó: la reestructuración se completa primero.

## 7. Lo que este diseño deliberadamente no hace

- **No adelanta el despliegue al VPS.** Fase 5, después de la limpieza.
- **No introduce un framework de pruebas de interfaz.** Codex prueba como un
  usuario, con navegador y el guion de regresión. No se instala Playwright ni se
  escriben pruebas E2E en este milestone.
- **No reorganiza el milestone en rebanadas verticales por módulo.** Se evaluó y
  se descartó: las fases R3, R4 y R5 se completan como están.
- **No le devuelve a Codex el acceso a git ni a GitHub.** No lo necesita, y
  averiguar por qué falló no aporta nada al objetivo.
- **No añade funciones nuevas** (decisión #4), ni cambia el esquema.
