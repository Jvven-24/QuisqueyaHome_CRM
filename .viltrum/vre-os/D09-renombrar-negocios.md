# D09 · T-E1-0 · Renombrar «Pipeline» a «Negocios»

Fecha: 2026-10-04. Productor: Codex, perfil D09. Dispatch: `20261004T223540Z-D09-codex`.

**Resultado: BLOQUEADO antes de modificar código.** Se completó el inventario estático. No se implementaron el renombrado, la redirección ni la guarda; no se declara aceptación, cierre de issue ni avance de gate. Este archivo es el único cambio realizado por esta sesión.

## Mandato y nivel

Mandato recibido: corregir el vocabulario visible, trasladar la página a `/negocios`, conservar los contratos técnicos existentes y añadir una guarda con demostración por mutación. Clasificación: corrección de UI en CRM/ERP, vía rápida de defecto, D09; el proyecto mantiene clasificación R3. No se trata de construir un módulo nuevo.

Nivel: implementación pendiente; **no L3 ni L4**. L2/READY no acreditado. Commit base: **UNKNOWN**; no se usó git, conforme a la tarea. No se abrieron subagentes.

Lectura completa de `PERFIL.md`, incluido SOUL, método, doctrina, estado, SOP y skill `viltrum-frontend`. Se leyeron también relevo, constitución, flujo por pasadas, índice del Spec Pack, routing y contexto de arquitectura, convenciones, decisiones y seguridad. Se aplicó `gitnexus-impact-analysis` para el análisis previo.

## Bloqueo comprobado

La constitución `.specify/memory/constitution.md:12` exige:

> **Nada se codifica sin ficha `READY`.** Toda tarea cita su ficha.

Su §B.8 (`:27`) exige:

> **Si aparece un hueco en la especificación, se para**.

La tarea despachada autoriza código en archivos acotados (`TAREA.md:4`), pero no cita ficha READY ni declara una excepción a esa condición. Se consultó al usuario por la ficha aplicable o la excepción expresa para esta corrección; al escribir este informe no se ha recibido respuesta. La falta de respuesta no se interpreta como autorización.

Evidencia de búsqueda local:

```text
rg --files .viltrum/vre-os/spec
.viltrum/vre-os/spec\_plantilla-modulo.md
.viltrum/vre-os/spec\_plantilla-integracion.md
.viltrum/vre-os/spec\00-indice.md

rg --files .viltrum/vre-os/spec/modulos
rg: .viltrum/vre-os/spec/modulos: IO error for operation on .viltrum/vre-os/spec/modulos: El sistema no puede encontrar el archivo especificado. (os error 2)
```

`spec/00-indice.md` describe P0 en curso y P2/P3 después de P1, sin fichas listas. `T-E1-1a-ficha-pipeline.md` es una tarea para producir la ficha, no una ficha READY.

Además, `TAREA.md:6` atribuye la decisión a `docs/contexto/decisiones.md` #45, pero la copia local termina en #44 (`:295`). #43/#44 sí existen. La decisión firmada D-04 está citada por la tarea, pero su expediente original **no está verificado**. No se modificó el registro de decisiones ni se inventó una entrada #45.

C1: `.viltrum/commercial.md` contiene `estado: "activo"`. Esto no acredita la ficha READY ausente ni constituye una aprobación de D09.

## Inventario de textos: antiguo → nuevo propuesto

**Todas las sustituciones de esta tabla están pendientes; ninguna se aplicó.** Las líneas corresponden al código inspeccionado antes de editar.

| Archivo:línea | Texto actual | Texto propuesto según T-E1-0 |
|---|---|---|
| `src/app/(crm)/modulos.ts:84` | Pipeline | Negocios |
| `src/app/(crm)/pipeline/page.tsx:38` | Pipeline · CRM Quisqueya Home | Negocios · CRM Quisqueya Home |
| `src/app/(crm)/pipeline/vista.tsx:182` | Pipeline | Negocios |
| `src/app/(crm)/pipeline/loading.tsx:11` | Pipeline | Negocios |
| `src/app/(crm)/pipeline/error.tsx:24` | No se pudo cargar Pipeline | No se pudieron cargar los negocios |
| `src/app/(crm)/_ui/command-palette.tsx:48` | Ver Pipeline de Negocios | Ver negocios |
| `src/app/(crm)/_ui/command-palette.tsx:222` | Pipeline, como ejemplo de búsqueda | Negocios |
| `src/app/(crm)/configuracion/vista.tsx:17` | Etapas del pipeline | Etapas de negocios |
| `src/app/(crm)/configuracion/_etapas.tsx:61` | Pipeline | Negocios |
| `src/app/(crm)/configuracion/_etapas.tsx:62` | Etapas del pipeline | Etapas de negocios |
| `src/app/(crm)/metas/vista.tsx:62` | Cierres del pipeline contra los objetivos mensuales. | Cierres de negocios contra los objetivos mensuales. |
| `src/app/(crm)/brokers/[id]/page.tsx:207` | Ver en pipeline | Ver en negocios |
| `src/app/(crm)/_ui/analitica-copy.ts:12` | Ver pipeline | Ver negocios |
| `src/app/(crm)/_ui/analitica-copy.ts:12` | Pipeline USD | Valor en negocios abiertos |
| `src/app/(crm)/_ui/analitica-copy.ts:15` | Pipeline abierto ponderado por probabilidad de cierre, en USD | Negocios abiertos ponderados por probabilidad de cierre, en USD |
| `src/app/(crm)/_ui/analitica-copy.ts:15` | Pipeline ponderado | Negocios ponderados |

La etiqueta de Inicio es consumida mediante `c.pipeline` en `src/app/(crm)/inicio/vista.tsx:34`; el texto procede de `analitica-copy.ts`. El identificador técnico del indicador y sus estilos no deben confundirse con texto visible.

No se encontraron coincidencias de `clasificaci[oó]n` en `src/` ni `scripts/seed/` con el barrido insensible a mayúsculas. La etapa ya tiene `slug: 'presentacion', name: 'Presentación'` en `scripts/seed/catalog.ts:22`; `src/app/(crm)/_ui/datos-muestra.ts:18` y `:76` también usan «Presentación». No se ejecutó seed ni se consultó la base: los nombres persistidos son **UNKNOWN**.

Permisos: la vista ya traduce `deals: "Negocios"` en `src/app/(crm)/configuracion/_permisos.tsx:14`. No se encontró un recurso de permisos literal `pipeline` en el catálogo inspeccionado; sí existe la entidad técnica `pipeline_stage` en `src/domain/catalogs.ts:82`. No se debe crear o renombrar un recurso para cumplir esta tarea.

## Ruta y redirección

Pendiente mover `src/app/(crm)/pipeline/` a `src/app/(crm)/negocios/` conservando la API `/api/pipeline/**` y las carpetas de aplicación e infraestructura.

Enlaces explícitos encontrados:

| Archivo:línea | Actual | Destino requerido |
|---|---|---|
| `src/app/(crm)/modulos.ts:83` | `/pipeline` | `/negocios` |
| `src/app/(crm)/_ui/command-palette.tsx:50` | `/pipeline` | `/negocios` |
| `src/app/(crm)/brokers/[id]/page.tsx:206` | `/pipeline?deal=${negocio.dealId}` | `/negocios?deal=${negocio.dealId}` |

`PipelineVista.irCon` usa `usePathname()` y conserva los parámetros mediante `URLSearchParams` (`vista.tsx:115`); no contiene una URL `/pipeline` fija para sustituir.

`next.config.ts` inspeccionado no tiene `redirects()`. Debe añadirse la configuración permanente para `/pipeline` → `/negocios` y `/pipeline/:path*` → `/negocios/:path*`, y verificarse que la query `?deal=1` se conserva. **No implementado ni comprobado en ejecución.**

## Guarda y análisis de impacto

`src/infrastructure/vocabulario.test.ts`: **no creado**. Debe extraer literales de cadena, segmentos de template y texto JSX de `.ts/.tsx` en `app`, `components` y `application`, excluyendo tests. Las excepciones deben ser cortas, comentadas y técnicas, no una exclusión de archivos completos. Debe rechazar también atributos como `title="Pipeline"`, texto JSX directo y copy en configuración. El análisis por AST de TypeScript es una opción con la dependencia ya existente; no se implementó ni se midió.

Excepciones a revisar: imports de módulos `pipeline`, rutas `/api/pipeline`, entidad `pipeline_stage`, clases CSS y claves técnicas. El barrido encontró strings de error en el doble en memoria `src/application/pipeline/en-memoria.ts:124` y `:132`; son errores de infraestructura de pruebas, no copy de pantalla. Deben tratarse expresamente al implementar la guarda, sin abrir una excepción genérica a mensajes de error de aplicación.

El HTTP traduce errores de dominio a `error.message`, pero responde genérico ante errores no previstos (`src/infrastructure/http.ts:54` en adelante). No se verificó cada respuesta API por ejecución ni se declara «cero ocurrencias visibles».

Resultado real de GitNexus previo a cambios:

```json
{"target":"PipelineVista","direction":"upstream","impactedCount":0,"risk":"LOW","summary":{"direct":0,"processes_affected":0,"modules_affected":0}}
```

Límite: el índice está asociado a `QuisqueyaHome_CRM`, y su correspondencia exacta con el commit de este worktree no se verificó. Las consultas de impacto por archivo para `src/app/(crm)/modulos.ts` y `src/app/(crm)/_ui/analitica-copy.ts` devolvieron `Target ... not found`; su radio de impacto es **UNKNOWN**, no cero. No se editó ningún símbolo.

## Pruebas

| Comprobación solicitada | Resultado real |
|---|---|
| `npx tsc --noEmit --incremental false`, ignorando `.next/types` | NO EJECUTADA; código no modificado y tarea detenida antes de construcción |
| `npm run lint` | NO EJECUTADA |
| `npm test`, incluida guarda | NO EJECUTADA; guarda no creada |
| Mutación temporal `title="Pipeline"` y salida roja | NO EJECUTADA; no se inventa salida ni se modifica una vista mientras falta READY |
| `GET /negocios` con cookie de evaluación | UNKNOWN; no se solicitó |
| `GET /pipeline?deal=1` con redirección permanente | UNKNOWN; no se solicitó |
| Navegador, seis estados y anchos | UNKNOWN; no se capturó interfaz |
| `npm run dev` / `npm run build` | NO EJECUTADAS, prohibidas expresamente por la tarea |

Se ejecutaron lecturas locales y búsquedas `rg`, más consultas GitNexus. No hubo acceso a producción ni comparación local/remoto. Un comando de inventario usó inicialmente expansión de llaves no válida en PowerShell y falló antes de ejecutarse; se repitió con rutas explícitas. No es evidencia de una prueba del producto.

## Seguridad

Checklist `docs/contexto/flujo-de-trabajo.md` §6 recorrido para el alcance realizado: el cambio es documental. No se crearon tablas, rutas API, cuerpos JSON, exportaciones, variables de entorno o renderizado HTML. No se alteraron RLS, permisos, filtrado por alcance, auditoría ni cabeceras. No se leyeron archivos `.env`, no se listaron variables y no se imprimieron cookies, credenciales o cadenas de conexión. No apareció un secreto en las salidas consultadas.

No hay diff de código de esta sesión que revisar; **sin hallazgos de seguridad introducidos por este entregable documental**. La seguridad de la implementación pendiente no está verificada. La redirección futura debe usar destinos internos fijos y conservar los guards de la página al trasladarla.

## Handoff

Revisor independiente previsto: Claude para comandos y pantalla, Gemini para captura, según `TAREA.md`; aceptación funcional corresponde a D14. D09 no aprueba su trabajo ni cierra la tarea.

1. D00/usuario: indicar la ficha READY aplicable o resolver expresamente si T-E1-0 está exceptuada como corrección de vocabulario. No se presupone la excepción.
2. D00: resolver la referencia a decisión #45 y el expediente D-04; no alterar decisiones históricas.
3. Tras resolver la entrada, D09: aplicar el inventario, mover la ruta, añadir redirecciones, actualizar enlaces y crear la guarda dentro de los archivos permitidos. Volver a revisar impacto de cada símbolo que se modifique.
4. Productor: demostrar la mutación con salida roja real, revertirla, observar tsc/lint/test y registrar salidas. No ejecutar dev/build ni usar git desde este perfil.
5. Revisor: aplicar el parche al entorno que sirve `localhost:9301`, verificar `/negocios` y las redirecciones con query y subruta, revisar pantalla/paleta/carga/error, capturar y ejecutar build en su entorno autorizado. No confundir una pantalla del checkout principal con evidencia de este worktree.

Entrega de código/parche: **ninguna**. Resultado del producto: **pendiente**. Este informe entrega evidencia del bloqueo y un inventario reutilizable, no una implementación verificada.
