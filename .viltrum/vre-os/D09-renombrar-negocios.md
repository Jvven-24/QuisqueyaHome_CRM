# D09 · T-E1-0 · Renombrado de Negocios

Fecha: 2026-10-04. Productor: Codex, perfil D09. Estado: **L3, construido en el worktree; revisión independiente y ejecución de la interfaz pendientes**. No constituye aprobación ni cierre de gate.

## Mandato y autorización

Aplicar D-04 del Expediente Sprint 1 / decisión #45: eliminar «pipeline» del texto visible y publicar la ruta local del módulo como `/negocios`, con compatibilidad permanente de la URL anterior. La tarea despachada declara la excepción expresa a ficha READY para esta corrección de vocabulario. Clasificación: BUG de vocabulario / CRM, proyecto R3; sin cambio de reglas, datos ni permisos.

Se leyó completo `.viltrum/dispatch/20261004T224759Z-D09-codex/PERFIL.md`, incluidos SOUL, método, doctrina, estado, SOP y skill `viltrum-frontend`; después TAREA.md, constitución, flujo por pasadas, índice del Spec Pack, documentación de contexto y diseño aplicable. C1 consta activo en `.viltrum/commercial.md`. El relevo histórico conserva el reparto anterior: para esta entrega rige la autorización explícita del despacho (#43/#44/#45). No se abrieron subagentes.

## Cambios de textos y enlaces

Ubicaciones de la versión resultante, comprobadas comparando los archivos con su contenido anterior en memoria, sin usar git. Solo se cambió texto en application. Los cinco archivos de la carpeta de página se movieron; el inspector conserva exactamente su contenido.

| Archivo:línea | Antes | Después |
|---|---|---|
| `src/app/(crm)/modulos.ts:83` | `/pipeline` | `/negocios` |
| `src/app/(crm)/modulos.ts:84` | Pipeline | Negocios |
| `src/app/(crm)/_ui/command-palette.tsx:48` | Ver Pipeline de Negocios | Ver negocios |
| `src/app/(crm)/_ui/command-palette.tsx:50` | `/pipeline` | `/negocios` |
| `src/app/(crm)/_ui/command-palette.tsx:222` | Pipeline (ejemplo de búsqueda) | Negocios |
| `src/app/(crm)/_ui/analitica-copy.ts:12` | Ver pipeline | Ver negocios |
| `src/app/(crm)/_ui/analitica-copy.ts:12` | Pipeline USD | Valor en negocios abiertos (USD) |
| `src/app/(crm)/_ui/analitica-copy.ts:15` | Pipeline abierto ponderado por probabilidad de cierre, en USD | Negocios abiertos ponderados por probabilidad de cierre, en USD |
| `src/app/(crm)/_ui/analitica-copy.ts:15` | Pipeline ponderado | Negocios ponderados |
| `src/app/(crm)/configuracion/vista.tsx:17` | Etapas del pipeline | Etapas de negocios |
| `src/app/(crm)/configuracion/_etapas.tsx:61` | Pipeline | Negocios |
| `src/app/(crm)/configuracion/_etapas.tsx:62` | Etapas del pipeline | Etapas de negocios |
| `src/app/(crm)/metas/vista.tsx:62` | Cierres del pipeline contra los objetivos mensuales. | Cierres de negocios contra los objetivos mensuales. |
| `src/app/(crm)/brokers/[id]/page.tsx:206` | `/pipeline?deal=${negocio.dealId}` | `/negocios?deal=${negocio.dealId}` |
| `src/app/(crm)/brokers/[id]/page.tsx:207` | Ver en pipeline | Ver en negocios |
| `src/app/(crm)/negocios/vista.tsx:182` | Pipeline | Negocios |
| `src/app/(crm)/negocios/loading.tsx:11` | Pipeline | Negocios |
| `src/app/(crm)/negocios/error.tsx:24` | No se pudo cargar Pipeline | No se pudieron cargar los negocios |
| `src/app/(crm)/negocios/page.tsx:38` | Pipeline · CRM Quisqueya Home | Negocios · CRM Quisqueya Home |
| `src/application/pipeline/en-memoria.ts:124` | pipelineEnMemoria: no existe el negocio… | Repositorio de negocios: no existe el negocio… |
| `src/application/pipeline/en-memoria.ts:132` | pipelineEnMemoria: no existe la propiedad… | Repositorio de negocios: no existe la propiedad… |

Los dos mensajes del doble en memoria son errores de programación: se cambiaron únicamente sus literales para que la guarda cubra application sin excepciones generales de errores.

Inventario AST de literales y JSX: no quedan infracciones fuera de las excepciones técnicas comentadas. El barrido de `src/` y `scripts/seed/` no encontró «clasificación»; `scripts/seed/catalog.ts:22` ya define `slug: 'presentacion', name: 'Presentación'` y `src/domain/transicion-etapa.ts:44` usa la posición `presentacion`. No se ejecutó seed ni migración. El contenido de catálogos y plantillas almacenados en una base de datos es **UNKNOWN**: la inspección fue de fuentes, no de registros reales.

Los permisos usan actualmente el identificador `deals`, ya traducido «Negocios» en `configuracion/_permisos.tsx:14`; no se encontró recurso de permiso `pipeline` que traducir. No se cambiaron identificadores de API, tablas, application/pipeline ni infraestructura. Se reutilizaron los catálogos de copy existentes; el sistema integral de i18n y la extracción del copy legado de componentes quedan fuera de este despacho.

## Ruta y redirección

La carpeta `src/app/(crm)/pipeline/` pasó a `src/app/(crm)/negocios/`, incluyendo `page.tsx`, `vista.tsx`, `inspector.tsx`, `loading.tsx` y `error.tsx`. Imports relativos, filtros e inspector continúan dentro del mismo módulo. El barrido encontró tres enlaces explícitos de página antigua: menú, paleta y detalle de broker; los tres están actualizados. Los demás desplazamientos del módulo usan `usePathname()`.

`next.config.ts:12` incorpora:

```ts
async redirects() {
  return [
    { source: "/pipeline", destination: "/negocios", permanent: true },
    { source: "/pipeline/:path*", destination: "/negocios/:path*", permanent: true },
  ];
}
```

Next produce 308 y conserva la query. Comprobado con la utilidad instalada `unstable_getResponseFromNextConfig` de `next/experimental/testing/server.js`, importando la configuración real, sin build ni servidor nuevo:

```text
{"config":"/pipeline?deal=1","status":308,"location":"http://localhost:9301/negocios?deal=1"}
{"config":"/pipeline/1?deal=1","status":308,"location":"http://localhost:9301/negocios/1?deal=1"}
{"config":"/pipeline","status":308,"location":"http://localhost:9301/negocios"}
```

## Guarda de vocabulario

`src/infrastructure/vocabulario.test.ts` recorre recursivamente `.ts/.tsx` de app, components y application, excluyendo pruebas. Usa el parser TypeScript ya instalado, sin dependencia nueva; examina literales, piezas de templates con interpolación y texto JSX. No confunde comentarios ni nombres de funciones con texto visible; decodifica escapes de cadenas y entidades numéricas JSX.

Excepciones pequeñas y comentadas, con valor y contexto: especificadores de imports/exports; `/api/pipeline` como primer argumento de fetch; entidad de auditoría `pipeline_stage`; clave de KPI `pipeline`; id de paleta `act-pipeline`; tres clases CSS existentes solo en `className`. No hay excepciones por archivo. Otro test exige detectar títulos, errores, URL de página antigua, escapes Unicode, entidades JSX y templates, incluso cuando su valor coincide con una excepción en un contexto visible.

## Impacto y seguridad

Se aplicó `gitnexus-impact-analysis` antes de editar. Para PipelineVista, PipelinePage, EtapasPanel, MetasVista, CommandPalette, BrokerDetallePage, InicioVista, DealInspector, reemplazarNegocio, reemplazarPropiedad, ConfiguracionVista y next.config.ts, las consultas devuelven LOW, cero dependencias directas y cero procesos afectados. Error/Loading son nombres ambiguos: impact eligió los del shell; context con file_path confirmó específicamente los de la página comercial, sin referencias entrantes ni procesos. Algunas búsquedas por archivo/UID no resolvieron objetivo.

**Limitación:** el recurso de contexto de GitNexus advierte «Index is 27 commits behind HEAD». No se regeneró el índice porque generaría archivos fuera de los permitidos. Los resultados del grafo son provisionales, no evidencia de ausencia de riesgo. Se complementaron con lectura local de imports, rutas y literales. No se ejecutó detect_changes ni git: no se hace commit y el despacho prohíbe git. Commit base / ancestralidad remota: **UNKNOWN**, no verificados ni comparados.

Checklist de seguridad de `docs/contexto/flujo-de-trabajo.md` §6 aplicado al cambio:

- `negocios/page.tsx:50` conserva requireScopeInPage(actor, "deals", "view"); `:57` conserva visibleRows sobre responsable y deletedAt. El cambio de carpeta no elimina autorización ni filtrado.
- `next.config.ts:14` y `:15`: destinos internos fijos; no se toma un destino del usuario ni se introduce redirección abierta. Query y segmentos se tratan con el mecanismo de Next.
- No hay tablas, SQL, cuerpos JSON de producción, variables de entorno, manejo de HTML ni exportaciones CSV modificados. Las guardas existentes de RLS, permisos y capas pasaron dentro de npm test.
- No se encontraron riesgos de seguridad introducidos en los cambios cotejados. No se accedió a .env, listados de configuración sensible, cadenas de conexión ni credenciales. La cookie local de evaluación se mantuvo solo en memoria y se reportó únicamente un booleano; no apareció ningún secreto en las salidas.

## Pruebas

Comandos ejecutados en este worktree. En PowerShell, los wrappers `npx.ps1`/política de firmas bloquearon el primer intento de tsc; se usaron los ejecutables equivalentes `npx.cmd` y `npm.cmd`, sin cambiar políticas.

| Verificación | Resultado |
|---|---|
| `npx.cmd tsc --noEmit --incremental false` | Exit 0, salida vacía. No fue necesario ignorar errores de .next/types. |
| `npm.cmd run lint` | Exit 0; 0 errores, 12 advertencias en archivos no modificados. |
| `npm.cmd test` | Exit 0; 510/510 pruebas, incluye ambas pruebas D-04. |
| Mutación real de title en la vista | Guarda roja, exit 1; fuente restaurada en finally. |
| Redirección en motor de configuración Next | 308 con query y sufijos conservados; tres casos. |
| HTTP de localhost:9301 con evaluación admin | No cumple la ruta nueva; ver evidencia debajo. |
| Build / dev | No ejecutados: prohibidos por TAREA.md y AGENTS.md. |
| Capturas, responsive, teclado, seis estados en navegador de la versión nueva | **UNKNOWN**, pendiente del revisor. |

Salida real de lint (resumen; el listado completo señaló generator.ts, seed_local_crm.mjs, crm-header.tsx, crm-sidebar-menu.tsx, comisiones/vista.tsx, leads/vista.tsx, propiedades/vista.tsx y login/page.tsx, ninguno modificado):

```text
> quisqueya-home-crm@0.1.0 lint
> eslint .

✖ 12 problems (0 errors, 12 warnings)
```

Salida real final de npm test (extracto de la corrida, no informe de otro agente):

```text
> quisqueya-home-crm@0.1.0 test
> node --test "src/**/*.test.ts"

✔ D-04: ningún literal ni texto JSX muestra el vocabulario prohibido (831.8826ms)
✔ D-04: las excepciones técnicas no permiten etiquetas, errores ni enlaces antiguos (3.4644ms)
ℹ tests 510
ℹ suites 0
ℹ pass 510
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 5138.0728
```

### Mutación exigida

Se sustituyó temporalmente `title="Negocios"` por `title="Pipeline"` en la vista real, se ejecutó `node --test src/infrastructure/vocabulario.test.ts` y se restauró el contenido en finally. Después, la corrida completa confirmó la guarda verde. Salida roja real:

```text
✖ D-04: ningún literal ni texto JSX muestra el vocabulario prohibido (565.0577ms)
✔ D-04: las excepciones técnicas no permiten etiquetas, errores ni enlaces antiguos (1.7434ms)
ℹ tests 2
ℹ suites 0
ℹ pass 1
ℹ fail 1
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 1379.8318

✖ failing tests:

test at src\infrastructure\vocabulario.test.ts:68:1
✖ D-04: ningún literal ni texto JSX muestra el vocabulario prohibido (565.0577ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
  + actual - expected
  
  + [
  +   'src/app/(crm)/negocios/vista.tsx:182: Pipeline'
  + ]
  - []
  
      at TestContext.<anonymous> (file:///C:/Users/wilbe/Documents/.viltrum-worktrees/QuisqueyaHome_CRM/20261004T224759Z-D09-codex/src/infrastructure/vocabulario.test.ts:70:10)
      at Test.runInAsyncScope (node:async_hooks:227:14)
      at Test.run (node:internal/test_runner/test:1325:25)
      at Test.start (node:internal/test_runner/test:1191:17)
      at startSubtestAfterBootstrap (node:internal/test_runner/harness:385:17) {
    generatedMessage: true,
    code: 'ERR_ASSERTION',
    actual: [ 'src/app/(crm)/negocios/vista.tsx:182: Pipeline' ],
    expected: [],
    operator: 'deepStrictEqual',
    diff: 'simple'
  }


MUTATION_EXIT=1
MUTACION_REVERTIDA=true
```

### HTTP real: pendiente de aplicar el cambio al servidor

Se efectuó POST de evaluación admin y GET con la cookie solo en memoria, redirect manual y sin imprimir cuerpos con datos. Salida real:

```text
{"method":"POST","path":"/api/auth/demo","status":200,"evaluationCookieReceived":true}
{"method":"GET","path":"/negocios","status":404,"location":null,"titleNegocios":false}
{"method":"GET","path":"/pipeline?deal=1","status":200,"location":null}
{"method":"GET","path":"/pipeline/1?deal=1","status":404,"location":null}
```

Por tanto, **NO** se acredita GET /negocios → 200 ni la redirección en el servidor actual. La evidencia es compatible con que localhost:9301 siga sirviendo la versión anterior; el origen exacto de ese proceso es **UNKNOWN**. No se reinició, no se levantó otro servidor ni se alteró producción. La validación del motor de Next anterior prueba la configuración del worktree, no sustituye esta prueba HTTP ni una captura.

## Handoff

Revisor independiente contractual: D14; el despacho asigna Claude para comandos/apertura de pantalla y Gemini para captura. **D09 no aprueba este trabajo.**

1. Revisar los archivos cambiados y la guarda; regenerar GitNexus desde el contexto autorizado para confirmar impacto con índice vigente.
2. Aplicar el cambio del worktree y recargar la configuración de Next en el servidor autorizado por el orquestador. Ejecutar typecheck, lint, npm test y build donde esté permitido.
3. Obtener evaluación admin mediante POST /api/auth/demo, sin persistir ni imprimir cookies. Verificar GET /negocios → 200 y GET /pipeline?deal=1 → 308 con Location /negocios?deal=1; verificar también sufijos y query.
4. Abrir menú, paleta, detalle de broker, Inicio, Reportes, Metas y Configuración; comprobar título, estado de carga/error, etiquetas y enlaces. Capturar 320/390/768/1440, especialmente el KPI «Valor en negocios abiertos (USD)», más largo que antes. Verificar filtros e inspector con ?deal=.
5. Comprobar los valores reales del catálogo de etapas/plantillas: las fuentes ya usan Presentación, pero no se inspeccionaron ni modificaron registros de base de datos.
6. Registrar aceptación independiente y evidencia del servidor actualizado antes de cerrar T-E1-0. Commit, push, despliegue y actualización del relevo corresponden al orquestador; este perfil no los ejecutó.
