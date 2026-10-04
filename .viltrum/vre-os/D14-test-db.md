# D14 · T-QA-TEST-DB · Integración con PostgreSQL real

Fecha: 2026-10-04. Productor: Codex, perfil D14. Worktree/run: `20261004T221347Z-D14-codex`.
Tarea: [TAREA.md](../dispatch/20261004T221347Z-D14-codex/TAREA.md).
Estado: **L3 construida, con evidencia de ejecución; pendiente de revisión independiente D12**. No se aprueba gate ni se cierra un issue.

Resultado observado: **130/130 pruebas SQL**, **510/510 pruebas rápidas**, TypeScript sin diagnósticos y lint con cero errores (12 advertencias preexistentes). Mutación de alias: 15 caídas SQL. Mutación de booleano: tres caídas por contrato explícito de consulta; **la excepción SQL histórica del booleano no se reprodujo en este entorno**. Los conteos de las 39 tablas `public` de desarrollo quedaron iguales en todas las corridas.

## Mandato y alcance

Leídos el perfil completo, tarea, relevo, constitución, flujo de pasadas, índice del Spec Pack, router, manifest D14 y contexto de arquitectura/convenciones/flujo de trabajo. Aplicado el protocolo `viltrum-qa` incluido en PERFIL.md. Clasificación: BUG de cobertura, CRM/ERP, riesgo R3, producción acotada de pruebas; no construcción de funciones de producto.

La tarea despachada autoriza expresamente construir esta suite bajo decisiones #43/#44 y sustituye las restricciones históricas de solo exploración del relevo. **No cita una ficha READY**; se registra la discrepancia para D00, sin inventar una ficha ni editar el Spec Pack. No se emplearon subagentes, git, commits, push, dev, build, despliegues ni bases cloud.

GitNexus: consulta de flujos Dashboard/Reportes y análisis upstream de `infracciones`: **LOW**, 0 llamadores directos, 0 procesos afectados. Ese helper no se modificó. Las consultas de impacto de helpers nuevos devolvieron `Target not found`: el índice no incorpora estos archivos recién creados. No se afirma análisis de grafo de esos símbolos ni se modifica ningún símbolo de producto. No se ejecutó detect_changes porque no hay commit y el despacho prohíbe git.

Cambios limitados a:

- `scripts/test-db/`: runner, loader, fixture, esquemas de validación, pruebas de guardas y evidencias.
- `src/infrastructure/db/lecturas.db.test.ts`: suite de integración.
- `src/infrastructure/arquitectura.test.ts`: únicamente guarda añadida ARQ-SQL, desde línea 157.
- `package.json`: únicamente scripts `test:db*` añadidos.
- Este entregable, solicitado expresamente.

## Diseño y ejecución

`run.mjs` obtiene la conexión por `localDatabaseUrl()` → `databaseUrl()`; reutiliza la guarda de `scripts/seed/local.ts`. Solo acepta el destino inicial `quisqueyahome_crm`, loopback, puerto 5432 y sin query/hash. No guarda ni imprime la cadena de conexión. La credencial se lee en tiempo de ejecución y se hereda al proceso hijo en memoria.

1. Conexión de desarrollo de solo lectura; identidad real y conteos de **todas** las tablas `public`.
2. Crea `quisqueyahome_crm_test_<20 dígitos hex aleatorios>` con template0. Verifica nombre, esquema, host y puerto por SQL. Normaliza el sufijo CIDR del host igual que el seed existente.
3. Aplica `drizzle/` mediante el migrador Drizzle. Reutiliza los catálogos canónicos de `db/seed.sql`, excluyendo su sección Storage, porque estos repositorios no usan buckets de Supabase.
4. Reutiliza `generateDataset(..., SEED)` y su validación determinista; persiste los lotes en orden topológico. Semilla **20261004**: 640 leads, 176 negocios, 450 contactos, 400 unidades, 20 proyectos, 12 brokers, 1800 actividades y 15 comisiones. Añade identidades QA admin/assistant sin contraseñas, y una fase/foto sintéticas para ramas no vacías de Proyectos.
5. Descubre `src/**/*.db.test.ts` y lanza `node --test`. El loader resuelve imports relativos sin extensión y alias de Next, sin recompilar ni editar producto. Cada bloqueo/upsert del caso se ejecuta en transacción con rollback.
6. En `finally`, cierra las conexiones de prueba, elimina su base/esquema y vuelve a contar las tablas de desarrollo. Una diferencia o un fallo de limpieza hace fallar el comando.

Fallback: ante `CREATE DATABASE` con SQLSTATE 42501, crea un esquema temporal aleatorio dentro de la base local. El `search_path` contiene solo ese esquema y `pg_catalog`. **Las FK de las migraciones calificadas con `"public".` se redirigen al esquema temporal en memoria**; no basta cambiar search_path. Aplica los statements leídos por `readMigrationFiles` en una transacción; esta modalidad no crea el journal persistente del migrador. El esquema se elimina con CASCADE después. No escribe filas, secuencias ni catálogos de `public`.

Limitación: el fallback comparte base física y rol SQL con desarrollo, y requiere permiso CREATE de esquema. Su ejecución forzada con `--schema` fue verificada. La transición automática con un rol sin CREATEDB es **UNKNOWN**, porque el rol disponible sí pudo crear bases. Limpieza después de tests rojos: verificada. Interrupción por señal: implementada, **no ejecutada**; muerte forzada del proceso/host no permite garantizar finally.

En este host se verificó con Node **v24.18.0**, PostgreSQL local y las dependencias ya instaladas. El loader utiliza `registerHooks`; requiere Node que exponga esa API (22.15 o posterior), una condición más estricta que engines >=22.13 del proyecto. Compatibilidad con Node 22.13: **no verificada**. No se instaló una dependencia.

## Cómo correr ambas capas

En PowerShell de este host los lanzadores `.ps1` de npm/npx no están firmados; se usaron los equivalentes `.cmd`:

```powershell
npx.cmd tsc --noEmit --incremental false
npm.cmd run lint
npm.cmd test
npm.cmd run test:db:guards
npm.cmd run test:db
npm.cmd run test:db:mutation:alias
npm.cmd run test:db:mutation:boolean
npm.cmd run test:db -- --schema
```

`test:db` necesita la configuración local en el entorno o un archivo cargado por Node. En este worktree no estaba inyectada; se cargó en memoria la del repositorio principal indicado en el perfil, después de informar el supuesto, mediante:

```powershell
npm.cmd run test:db -- --env-file=C:/Users/wilbe/Documents/QuisqueyaHome_CRM/.env
npm.cmd run test:db:mutation:alias -- --env-file=C:/Users/wilbe/Documents/QuisqueyaHome_CRM/.env
npm.cmd run test:db:mutation:boolean -- --env-file=C:/Users/wilbe/Documents/QuisqueyaHome_CRM/.env
npm.cmd run test:db -- --schema --env-file=C:/Users/wilbe/Documents/QuisqueyaHome_CRM/.env
```

No se leyó ni mostró su contenido mediante herramientas; Node lo cargó al entorno. No se copió el archivo al worktree. Si el destino configurado es cloud o distinto del autorizado, el harness rechaza la operación.

**Separación de npm test:** la tarea permite editar solo scripts `test:db*`, por lo que se conservó el glob existente `src/**/*.test.ts`. Ese glob también descubre `.db.test.ts`: excluirlos literalmente requeriría modificar el script `test`, fuera del alcance. El nuevo archivo solo registra casos y carga módulos DB cuando recibe el marcador aislado del runner; `npm test` no ejecuta esos 130 casos, no importa la fixture ni abre PostgreSQL. Node cuenta el archivo vacío como un subtest de archivo. De los 510 resultados rápidos, 508 son los existentes, uno es ARQ-SQL y uno ese archivo sin casos SQL. **Exclusión literal del descubrimiento: pendiente de autorización de alcance por D00**, no se declara cumplida.

## Consultas cubiertas

Tres actores construidos desde users/roles/permissions sembrados, según el criterio de elegir el primer usuario activo del rol de evaluación: admin, broker con own, assistant. No se inyectan permisos extra. Para el puerto Reportes se evalúa `ReadScope=own` del broker derivado de dashboard; el catálogo no concede `reports.view` al broker. Esto **no acredita acceso del broker a la página Reportes**.

| Repositorio | Métodos de lectura ejecutados |
|---|---|
| Dashboard | obtenerMetricasDashboard (consulta completa, incluidos sus CTE) |
| Reportes | obtenerMetricasBi (consulta BI completa, incluidos sus CTE) |
| Leads | candidatosDuplicados, contactoExiste, candidatosBroker, buscarLead, buscarLeadParaConversion, bloquearCapturaExterna, buscarContactoPorTelefonoOCorreo, primeraEtapaAbierta |
| Contactos | candidatosDuplicados, buscarVisible, listado: filas, total, canales, ficha seleccionada y brokers |
| Pipeline | buscarNegocio, buscarEtapa, buscarEtapaActiva, tieneActividadDeContacto, buscarProximaAccionVigente, propiedadesDelNegocio, bloquearNegocio, buscarPerfilDeBroker, totalGanadoDelAnio, buscarNegocioConEtapa, proyectoVisible, unidadDelProyecto, buscarPropiedad |
| Proyectos | proyectoVisible (incluido bloqueo), unidadVisible, fasesDelProyecto, faseVisible, fotosDeFase, fotoVisible |
| Comisiones | bloquearComision, con FOR UPDATE OF commissions real |
| Metas | existePerfilDeBroker y SELECT anterior dentro de fijarMetaMensual, para broker/compañía; upsert revertido |
| Brokers | buscarBroker, proyectosRelevantes con/sin ids solicitados |

Son **37 métodos** y **130 casos**: 43 por actor más el ataque own a IDs ajenos. Los métodos internos sin Actor se prueban con filas sintéticas alcanzables en ese contexto; no se les atribuye autorización que su contrato delega al caso de uso.

Comprobaciones de negocio: suma de etapas = total de negocios; totales de leads/negocios contra filas reales; suma por fuente/zona/broker coherente; 64 pérdidas y 15 comisiones del seed para alcance total; broker own con menos negocios que admin y sin brokers ajenos en ranking; IDs de leads, actividades y proyectos recientes verificados contra propietarios persistidos; ficha lateral/lead de conversión/proyecto ajeno invisibles; none oculta datos en los métodos que aceptan alcance. Filtros por proyecto, broker y fechas, además de proyecto inexistente con resultado vacío. DashboardSnapshot/ReportSnapshot se validan completos con Zod, y las filas completas con tipos/nullabilidad del esquema, además de la comprobación TypeScript del puerto.

Límites: no es E2E de interfaz, certificación RLS con un rol SQL de bajo privilegio, prueba de concurrencia entre sesiones ni de todas las ramas de todos los repositorios. Recibo de webhook duplicado/conflictivo y Academy no vacío no están cubiertos. Otros repositorios del directorio quedan fuera de esta tarea.

## Mutaciones y restauración

Se aplican **una por corrida** por el hook de carga, sin editar los archivos de producto. Cuando termina el proceso deja de existir la mutación. Los SHA-256 de los nueve repositorios se guardaron en `scripts/test-db/product-hashes.json` y coincidieron después de las corridas rojas: `PRODUCT_SHA256_UNCHANGED=True`.

Alias: cambia `left join contacts on contacts.id ...` a `left join contacts c on c.id ...`, cambia el SELECT a `c.full_name` y conserva visibleRows sobre contacts. Así el fallo se produce por el predicado de alcance y no por una referencia SELECT sin actualizar. Fragmento literal de la corrida final, exit 1:

```text
not ok 1 - DB dashboard.obtenerMetricasDashboard / admin (alias y alcance)
  error: 'SQLSTATE 42P01: referencia de tabla/alias inválida'
not ok 44 - DB dashboard.obtenerMetricasDashboard / broker (alias y alcance)
not ok 88 - DB dashboard.obtenerMetricasDashboard / assistant (alias y alcance)
# tests 130
# pass 115
# fail 15
CLEANUP PASS: database temporal eliminado.
DEV COUNTS PASS: todas las tablas public idénticas antes/después.
```

Booleano: sustituye la selección de fragmentos sql true/false en `attributableSpend` por el booleano JS y conserva `where ${attributableSpend}`. **La primera corrida sobrevivió**: 130 pass, 0 fail, exit 0, evidencia `mutation-boolean-output.txt`. No se inventa SQLSTATE 42804: este entorno aceptó el parámetro.

Para evitar la regresión de contrato, el caso nombrado de Reportes compila la consulta con PgDialect y rechaza parámetros booleanos JS directamente después de WHERE/AND/OR/WHEN. La consulta original sigue ejecutándose en PostgreSQL en ese caso. La corrida final con mutación cae en esa aserción, **antes de ejecutar la consulta de ese caso**; los otros 127 casos pasan. Fragmento literal, exit 1:

```text
not ok 2 - DB reportes.obtenerMetricasBi / admin (condición spend SQL)
  error: 'reportes: booleano JS directo en condición SQL; usar fragmento sql'
  code: 'ERR_ASSERTION'
not ok 45 - DB reportes.obtenerMetricasBi / broker (condición spend SQL)
not ok 89 - DB reportes.obtenerMetricasBi / assistant (condición spend SQL)
# tests 130
# pass 127
# fail 3
CLEANUP PASS: database temporal eliminado.
DEV COUNTS PASS: todas las tablas public idénticas antes/después.
```

ARQ-SQL añade la guarda barata exigida en arquitectura: detecta comparaciones JS ===/!== interpoladas directamente después de where/and/or/when en archivos de repos, con excepción de ternarios que seleccionan fragmentos sql. Es una guarda léxica, no un analizador completo de SQL. La guarda de parámetros en Reportes cubre además la variable booleana indirecta que esa regex no puede conocer.

## Pruebas

Salidas completas conservadas en `scripts/test-db/`; los bloques siguientes son extractos reales, no resultados inferidos.

| Comando ejecutado | Exit | Resultado | Evidencia |
|---|---:|---|---|
| npx.cmd tsc --noEmit --incremental false | 0 | Sin diagnósticos | typecheck-output.txt (registro del exit observado) |
| npm.cmd run lint | 0 | 0 errores, 12 warnings preexistentes | lint-output.txt |
| npm.cmd test | 0 | 510 pass, 0 fail | unit-final-output.txt |
| npm.cmd run test:db:guards | 0 | 3 pass, 0 fail | Salida transcrita debajo |
| test:db con env-file local, final | 0 | 130 pass, 0 fail | db-verified-output.txt |
| test:db --schema con env-file local | 0 | 130 pass, 0 fail | schema-output.txt |
| test:db:mutation:alias con env-file local | 1 | 115 pass, 15 fail por alias | mutation-alias-final-output.txt |
| test:db:mutation:boolean, primera versión sin guarda de parámetros | 0 | 130 pass; mutación sobrevivió | mutation-boolean-output.txt |
| test:db:mutation:boolean con guarda de parámetros | 1 | 127 pass, 3 fail por aserción | mutation-boolean-final-output.txt |

```text
TSC_EXIT=0
✖ 12 problems (0 errors, 12 warnings)

ℹ tests 510
ℹ pass 510
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0

✔ destino: reutiliza la guarda local y rechaza cloud, query, puerto y base distintos
✔ mutación alias: cambia solo JOIN/SELECT de contacto, conserva visibleRows
✔ mutación booleano: retira fragmentos SQL, conserva where interpolado
ℹ tests 3
ℹ pass 3
ℹ fail 0

# tests 130
# pass 130
# fail 0
# cancelled 0
# skipped 0
CLEANUP PASS: database temporal eliminado.
DEV COUNTS PASS: todas las tablas public idénticas antes/después.
```

El último comando verde corrió después de las dos mutaciones finales. No hubo errores de producto que reportar en las lecturas originales ejercitadas.

Conteos antes/después: el runner imprime ambas fotos completas en cada evidencia. En la corrida final coincidieron los **39 pares**, entre ellos: leads 648→648, deals 184→184, contacts 458→458, units 404→404, activities 1803→1803, commissions 17→17, projects 24→24, users 15→15, audit_log 1→1, goals 247→247. Son conteos de desarrollo, distintos de los del seed temporal. Este criterio verifica conteos; no es una prueba exhaustiva de igualdad de valores ni de ausencia de escritores externos concurrentes.

Primer intento sin configuración: rechazado antes de conectar. Primeros intentos `npm`/`npx`: rechazados por firma de `.ps1`, resuelto usando `.cmd`. Primera typecheck de la suite: error de tipo Promise<unknown> en callback node:test; corregido en el archivo permitido y posterior tsc exit 0. Primer intento de identidad DB: ERR_ASSERTION por sufijo CIDR, normalizado sin modificar la guarda original de seed. No se ocultaron fallos mediante reintentos del test runner.

## Seguridad y prácticas sólidas verificadas

Revisión del cambio contra `docs/contexto/flujo-de-trabajo.md` §6:

- `scripts/test-db/run.mjs:93`: destino validado por la guarda existente antes de construir conexiones. `fixture.ts:12` vuelve a validar destino temporal y la identidad del servidor.
- `run.mjs:43`: conteos en transacción read only; conexión de desarrollo también con default_transaction_read_only. Solo el control crea/elimina recursos aleatorios propios.
- `run.mjs:106`, `:111`, `:137`, `:138`: nombres aleatorios con regex cerrada, identificadores del driver, sin interpolación de datos del usuario en DDL. CASCADE/FORCE solo sobre el recurso recién creado de este run.
- `run.mjs:57`, `:125`: unsafe recibe exclusivamente SQL canónico del repositorio y el namespace generado/validado; no contenido de solicitudes. En fallback las FK se redirigen explícitamente.
- `fixture.ts:72`: rollback del caso, incluso después de upsert/bloqueo; no dependencia de mutaciones persistidas por tests anteriores.
- `lecturas.db.test.ts:192`: pruebas negativas reales de alcance own por IDs ajenos. No se confía en ocultar botones.
- No se cambiaron tablas de producto, rutas API, cuerpos JSON, variables públicas, secretos ni permisos. Las guardas RLS y de permisos de npm test pasaron.
- Errores del driver sanitizados a código y categoría; no se imprimen queries, parámetros ni causas. Aserciones solo sobre fixtures sintéticas. Escaneo de los archivos propios entregados: `ARCHIVOS_ENTREGADOS_CON_PATRON_DE_CREDENCIAL=0` para patrones de URI con credencial y JWT; no sustituye la revisión humana. **No se observó un secreto en las salidas**.

No se encontraron hallazgos nuevos de seguridad reproducibles en los archivos modificados. Riesgo residual: conexión SQL privilegiada de aplicación prueba filtrado RBAC, no RLS como anon/authenticated; fallback tiene menor aislamiento que una base dedicada. D12 debe revisar y decidir, D14 no acepta esos límites como riesgo aprobado.

Fuentes de implementación: API de [Node registerHooks](https://nodejs.org/download/release/v22.18.0/docs/api/module.html), [migraciones Drizzle](https://orm.drizzle.team/docs/migrations), además del migrador instalado `node_modules/drizzle-orm/pg-core/dialect.js` y el código canónico de seed. Las fuentes guiaron la implementación; la evidencia runtime es la de este reporte.

## Handoff

**Revisor asignado por TAREA.md: D12, proveedor distinto del productor. D00 conserva la decisión de gate.** No hay autoaprobación ni cierre de issue. Entrega: archivos permitidos editados y evidencias locales; no commit/parche Git creado por la prohibición del despacho.

Reproducir los comandos de la tabla, revisar los nueve repositorios sin cambios de producto y verificar limpieza/conteos también en las corridas rojas. Revisar especialmente `run.mjs`, la identidad/rollback de fixture y la guarda de parámetros de Reportes. Las salidas completas permiten reconstruir cada caída sin credenciales.

Decisiones/preguntas para D00/D12:

1. Fijar la ficha READY de esta tarea de infraestructura de pruebas; no está citada en el despacho.
2. Autorizar, si se exige exclusión literal, cambiar `npm test` para excluir `.db.test.ts`; hoy están aislados de ejecución SQL, pero el glob los descubre.
3. Validar el criterio de mutación booleano: el error SQL histórico es **no reproducido**, la prohibición del parámetro se acredita por contrato de consulta. Investigar la diferencia de entorno si hace falta reproducir aquel SQLSTATE.
4. Determinar la versión mínima Node para test:db y ensayar el fallback automático con rol sin CREATEDB.
5. Integración CI, interfaz/estados visuales, build, concurrencia entre sesiones y revisión RLS con roles de bajo privilegio: **no ejecutadas / fuera de este despacho**. El revisor/orquestador debe ejecutarlas donde corresponda antes de aprobar un gate.

Siguiente paso propuesto: revisión independiente y resolución de estas discrepancias de alcance; luego D00 decide aplicación del cambio según sus comandos y política de commits. Ninguna afirmación de este informe certifica una release ni cobertura total del CRM.
